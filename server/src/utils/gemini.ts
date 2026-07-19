import { env } from "../config/env";

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function generateContent(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${env.geminiApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no content");
  }
  return text as string;
}

export interface RerankCandidate {
  index: number;
  title: string;
  category: string;
  price: number;
}

/**
 * Asks Gemini to pick and order the most relevant candidates for the given context.
 * Returns the chosen indices (into the original candidates array), or null if the
 * model call/parse fails — callers should fall back to their own DB-ordered ranking.
 */
export async function rerankWithGemini(
  contextDescription: string,
  candidates: RerankCandidate[],
  take: number
): Promise<number[] | null> {
  if (candidates.length === 0) return null;

  const list = candidates
    .map((c) => `${c.index}. "${c.title}" — category: ${c.category}, price: $${c.price}`)
    .join("\n");

  const prompt = `${contextDescription}

Candidate products:
${list}

Pick the ${Math.min(take, candidates.length)} most relevant candidates and order them from most to least relevant.
Respond with ONLY a raw JSON object, no markdown, no commentary, in exactly this shape:
{"order": [index, index, ...]}`;

  try {
    const text = await generateContent(prompt);
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as { order?: number[] };
    if (!Array.isArray(parsed.order)) return null;

    const validIndices = new Set(candidates.map((c) => c.index));
    const filtered = parsed.order.filter((i) => validIndices.has(i));
    return filtered.length > 0 ? filtered : null;
  } catch (err) {
    console.error("Gemini rerank failed, falling back to DB order:", err);
    return null;
  }
}
