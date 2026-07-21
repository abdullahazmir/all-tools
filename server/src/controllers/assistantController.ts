import { Request, Response } from "express";
import { generateContent } from "../utils/gemini";
import { productsCollection, Product } from "../models/product";
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

interface SearchPlan {
  needsProducts: boolean;
  searchQuery: string | null;
  category: string | null;
  maxPrice: number | null;
  minRating: number | null;
  condition: "new" | "used" | null;
}

function parsePlan(text: string): SearchPlan {
  const parsed = JSON.parse(stripFences(text));
  return {
    needsProducts: parsed.needsProducts === true,
    searchQuery: typeof parsed.searchQuery === "string" ? parsed.searchQuery : null,
    category: typeof parsed.category === "string" ? parsed.category : null,
    maxPrice: typeof parsed.maxPrice === "number" ? parsed.maxPrice : null,
    minRating: typeof parsed.minRating === "number" ? parsed.minRating : null,
    condition: parsed.condition === "new" || parsed.condition === "used" ? parsed.condition : null,
  };
}

function buildPlanPrompt(message: string, historyText: string): string {
  return `You are the planning step of a shopping assistant for ToolBazaar, an online marketplace for hand and machine tools.

Conversation so far:
${historyText}

Latest shopper message: "${message}"

Decide whether you need to search the product catalog to answer well. If the shopper is asking about specific tools, a job/project, or a budget, you probably do. If they're asking something general (greeting, how the site works), you don't.

Respond with ONLY a raw JSON object, no markdown, no commentary, in exactly this shape:
{"needsProducts": true, "searchQuery": "cordless drill", "category": null, "maxPrice": 100, "minRating": null, "condition": null}

Use null for any field you can't infer. searchQuery should be short keywords (product name/type), not a full sentence.`;
}

async function searchCandidates(plan: SearchPlan): Promise<ProductWithShop[]> {
  const match: Record<string, unknown> = { status: "approved" };
  if (plan.category) match.category = plan.category;
  if (plan.condition) match.condition = plan.condition;
  if (plan.maxPrice) match.price = { $lte: plan.maxPrice };
  if (plan.minRating) match.ratingAvg = { $gte: plan.minRating };
  if (plan.searchQuery) {
    match.title = { $regex: plan.searchQuery, $options: "i" };
  }

  const results = await productsCollection()
    .aggregate([{ $match: match }, ...SHOP_LOOKUP_STAGES, { $sort: { ratingAvg: -1 } }, { $limit: 8 }])
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

  return `You are a friendly, concise shopping assistant for ToolBazaar, an online marketplace for hand and machine tools. Only recommend products from the list below — never invent products or ids.

Conversation so far:
${historyText}

Latest shopper message: "${message}"

Available matching products (id. title — details):
${list}

Write a short, helpful reply (2-4 sentences) addressing the shopper's message, referencing specific products by name where relevant. If no products matched, say so and suggest they browse Explore or rephrase.

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
    const planText = await generateContent(buildPlanPrompt(cleanMessage, historyText));
    const plan = parsePlan(planText);

    const candidates = plan.needsProducts ? await searchCandidates(plan) : [];

    if (plan.needsProducts && plan.searchQuery && req.user) {
      void logInteraction(req.user.id, "search", { query: plan.searchQuery, category: plan.category ?? undefined });
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
