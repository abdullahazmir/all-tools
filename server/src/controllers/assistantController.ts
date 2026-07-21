import { Request, Response } from "express";
import { generateContent } from "../utils/gemini";
import { productsCollection, Product } from "../models/product";
import { categoriesCollection } from "../models/category";
import { SHOP_LOOKUP_STAGES } from "./productController";
import { logInteraction } from "./aiController";

type ChatRole = "user" | "assistant";
interface ChatMessage {
  role: ChatRole;
  text: string;
}

type ProductWithShop = Product & { shop: { _id: unknown; shopName: string; logo: string } };

const MAX_MESSAGE_LEN = 500;
const MAX_HISTORY = 6;

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "")
    .trim();
}

function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.text === "string" &&
        m.text.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, text: m.text.trim().slice(0, MAX_MESSAGE_LEN) }));
}

function formatHistory(history: ChatMessage[]): string {
  if (history.length === 0) return "(no earlier messages)";
  return history.map((m) => `${m.role === "user" ? "Shopper" : "Assistant"}: ${m.text}`).join("\n");
}

interface Heuristics {
  category: string | null;
  maxPrice: number | null;
  condition: "new" | "used" | null;
}

const PRICE_CEILING_RE = /(?:under|below|less than|no more than|up to)\s*\$?(\d+(?:\.\d+)?)/i;
const PRICE_BARE_RE = /\$(\d+(?:\.\d+)?)/;

/** Cheap, non-AI intent extraction — replaces a first Gemini call with regex/substring matching. */
async function extractHeuristics(message: string): Promise<Heuristics> {
  const lower = message.toLowerCase();

  const ceilingMatch = message.match(PRICE_CEILING_RE) ?? message.match(PRICE_BARE_RE);
  const maxPrice = ceilingMatch ? Number(ceilingMatch[1]) : null;

  const condition = /\bused\b/.test(lower) ? "used" : /\bnew\b/.test(lower) ? "new" : null;

  const categories = await categoriesCollection().find().toArray();
  const words = lower.split(/[^a-z]+/).filter((w) => w.length >= 4);
  const category =
    categories.find((c) => {
      const name = c.name.toLowerCase();
      return lower.includes(name) || words.some((w) => name.includes(w) || w.includes(name));
    })?.slug ?? null;

  return { category, maxPrice, condition };
}

async function searchCandidates(heuristics: Heuristics): Promise<ProductWithShop[]> {
  const match: Record<string, unknown> = { status: "approved" };
  if (heuristics.category) match.category = heuristics.category;
  if (heuristics.condition) match.condition = heuristics.condition;
  if (heuristics.maxPrice) match.price = { $lte: heuristics.maxPrice };

  const results = await productsCollection()
    .aggregate([{ $match: match }, ...SHOP_LOOKUP_STAGES, { $sort: { ratingAvg: -1 } }, { $limit: 12 }])
    .toArray();

  return results as unknown as ProductWithShop[];
}

function buildAnswerPrompt(
  message: string,
  historyText: string,
  candidates: ProductWithShop[]
): string {
  const list =
    candidates.length > 0
      ? candidates
          .map(
            (p) =>
              `${p._id}. "${p.title}" — category: ${p.category}, price: $${p.price}, rating: ${p.ratingAvg.toFixed(1)} (${p.ratingCount} reviews), condition: ${p.condition}`
          )
          .join("\n")
      : "(no matching products found in catalog)";

  return `You are a friendly, concise shopping assistant for ToolBazaar, an online marketplace for hand and machine tools. Only recommend products from the list below — never invent products or ids. If the shopper's message is a greeting or general question rather than a product need, just respond conversationally and leave productIds empty.

Conversation so far:
${historyText}

Latest shopper message: "${message}"

Candidate products from the catalog (id. title — details):
${list}

Write a short, helpful reply (2-4 sentences) addressing the shopper's message, referencing specific products by name where relevant. If none of the candidates actually fit, say so and suggest they browse Explore or rephrase — don't force a recommendation.

Respond with ONLY a raw JSON object, no markdown, no commentary, in exactly this shape:
{"reply": "...", "productIds": ["<id>", "<id>"]}

productIds must be a subset of the ids listed above, ordered most to least relevant (empty array if none fit).`;
}

function parseAnswer(text: string): { reply: string; productIds: string[] } {
  const parsed = JSON.parse(stripFences(text));
  if (typeof parsed.reply !== "string") throw new Error("Unexpected AI response shape");
  const productIds = Array.isArray(parsed.productIds)
    ? parsed.productIds.filter((id: unknown) => typeof id === "string")
    : [];
  return { reply: parsed.reply, productIds };
}

const FALLBACK_REPLY =
  "Sorry, I'm having trouble right now. Try browsing Explore, or ask me again in a moment.";

export async function chatWithAssistant(req: Request, res: Response): Promise<void> {
  const { message, history } = req.body as { message?: string; history?: unknown };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ message: "message is required" });
    return;
  }
  const cleanMessage = message.trim().slice(0, MAX_MESSAGE_LEN);
  const cleanHistory = sanitizeHistory(history);
  const historyText = formatHistory(cleanHistory);

  try {
    const heuristics = await extractHeuristics(cleanMessage);
    const candidates = await searchCandidates(heuristics);

    if (req.user) {
      void logInteraction(req.user.id, "search", {
        query: cleanMessage,
        category: heuristics.category ?? undefined,
      });
    }

    const answerText = await generateContent(buildAnswerPrompt(cleanMessage, historyText, candidates));
    const { reply, productIds } = parseAnswer(answerText);

    const candidateMap = new Map(candidates.map((p) => [String(p._id), p]));
    const products = productIds.map((id) => candidateMap.get(id)).filter((p): p is ProductWithShop => !!p);

    res.json({ reply, products });
  } catch (err) {
    console.error("AI assistant chat failed:", err);
    res.json({ reply: FALLBACK_REPLY, products: [] });
  }
}
