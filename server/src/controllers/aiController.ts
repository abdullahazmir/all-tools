import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { generateContent, rerankWithGemini, RerankCandidate } from "../utils/gemini";
import { productsCollection, Product } from "../models/product";
import { aiInteractionsCollection, InteractionType } from "../models/aiInteraction";
import { getObjectIdParam } from "../utils/params";
import { SHOP_LOOKUP_STAGES } from "./productController";

type ProductWithShop = Product & { shop: { _id: ObjectId; shopName: string; logo: string } };

type Length = "short" | "medium" | "long";

const CATEGORY_TONE: Record<string, string> = {
  "power-tools": "Emphasize power, performance, and reliability for demanding jobs.",
  grinding: "Emphasize precision grinding performance, durability, and control.",
  drilling: "Emphasize drilling power, chuck precision, and ease of handling.",
  cutting: "Emphasize blade sharpness, cutting precision, and safety.",
  "hand-tools": "Emphasize durability, ergonomic grip, and everyday reliability.",
  measuring: "Emphasize accuracy, precision, and ease of reading measurements.",
  fasteners: "Emphasize strength, corrosion resistance, and secure fastening.",
  "safety-gear": "Emphasize protection, comfort, and compliance with safety standards.",
  welding: "Emphasize heat resistance, precision control, and weld quality.",
  generators: "Emphasize power output, fuel efficiency, and portability.",
};

const LENGTH_GUIDANCE: Record<Length, { short: string; full: string }> = {
  short: { short: "10-15 words", full: "25-40 words" },
  medium: { short: "15-20 words", full: "50-70 words" },
  long: { short: "20-25 words", full: "90-120 words" },
};

function buildPrompt(
  title: string,
  category: string,
  keywords: string,
  length: Length
): string {
  const tone = CATEGORY_TONE[category] ?? "Emphasize quality, durability, and value.";
  const guidance = LENGTH_GUIDANCE[length];

  return `You are a copywriter for ToolBazaar, an online marketplace for hand and machine tools.

Write a product listing for:
Title: ${title}
Category: ${category}
Keywords/specs from the seller: ${keywords || "none provided"}

Tone guidance: ${tone}

Write two fields:
- shortDesc: one sentence, ${guidance.short}, for a product card.
- fullDesc: a fuller description, ${guidance.full}, for the product details page. Mention concrete specs if provided.

Respond with ONLY a raw JSON object, no markdown code fences, no commentary, in exactly this shape:
{"shortDesc": "...", "fullDesc": "..."}`;
}

function parseJsonResponse(text: string): { shortDesc: string; fullDesc: string } {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (typeof parsed.shortDesc !== "string" || typeof parsed.fullDesc !== "string") {
    throw new Error("Unexpected AI response shape");
  }
  return { shortDesc: parsed.shortDesc, fullDesc: parsed.fullDesc };
}

export async function generateDescription(req: Request, res: Response): Promise<void> {
  const { title, category, keywords, length } = req.body as {
    title?: string;
    category?: string;
    keywords?: string;
    length?: Length;
  };

  if (!title || title.trim().length < 2) {
    res.status(400).json({ message: "title is required" });
    return;
  }
  if (!category) {
    res.status(400).json({ message: "category is required" });
    return;
  }
  const safeLength: Length = length === "short" || length === "long" ? length : "medium";

  try {
    const prompt = buildPrompt(title.trim(), category, keywords?.trim() ?? "", safeLength);
    const text = await generateContent(prompt);
    const result = parseJsonResponse(text);
    res.json(result);
  } catch (err) {
    console.error("AI description generation failed:", err);
    res.status(502).json({ message: "AI description generation failed. Try again." });
  }
}

export async function logInteraction(
  userId: string,
  type: InteractionType,
  extra: { productId?: ObjectId; category?: string; query?: string }
): Promise<void> {
  try {
    await aiInteractionsCollection().insertOne({
      userId: new ObjectId(userId),
      type,
      ...extra,
      createdAt: new Date(),
    });
  } catch (err) {
    // Interaction logging must never break the request it's attached to.
    console.error("Failed to log AI interaction:", err);
  }
}

function toCandidate(index: number, p: Product): RerankCandidate {
  return { index, title: p.title, category: p.category, price: p.price };
}

async function findProductsWithShop(
  match: Record<string, unknown>,
  limit: number,
  sort: Record<string, 1 | -1> = { createdAt: -1 }
): Promise<ProductWithShop[]> {
  const results = await productsCollection()
    .aggregate([{ $match: match }, ...SHOP_LOOKUP_STAGES, { $sort: sort }, { $limit: limit }])
    .toArray();
  return results as unknown as ProductWithShop[];
}

export async function getRelatedProducts(req: Request, res: Response): Promise<void> {
  const productId = getObjectIdParam(req, res, "productId");
  if (!productId) return;

  const target = await productsCollection().findOne({ _id: productId });
  if (!target) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  const priceLow = target.price * 0.5;
  const priceHigh = target.price * 2;

  const candidates = await findProductsWithShop(
    { _id: { $ne: productId }, status: "approved", category: target.category },
    12
  );

  if (candidates.length < 4) {
    const fallback = await findProductsWithShop(
      { _id: { $ne: productId }, status: "approved", price: { $gte: priceLow, $lte: priceHigh } },
      12
    );
    const seen = new Set(candidates.map((c) => c._id!.toString()));
    for (const p of fallback) {
      if (!seen.has(p._id!.toString())) candidates.push(p);
    }
  }

  if (candidates.length === 0) {
    res.json({ products: [] });
    return;
  }

  const rerankCandidates = candidates.map((p, i) => toCandidate(i, p));
  const order = await rerankWithGemini(
    `A shopper is viewing "${target.title}" (category: ${target.category}, price: $${target.price}). Suggest related or complementary tools they might also want.`,
    rerankCandidates,
    4
  );

  const ordered = order ? order.map((i) => candidates[i]) : candidates.slice(0, 4);
  res.json({ products: ordered });
}

export async function getRecommendedForUser(req: Request, res: Response): Promise<void> {
  const { maxPrice } = req.query as { maxPrice?: string };
  const userId = new ObjectId(req.user!.id);

  const interactions = await aiInteractionsCollection()
    .find({ userId, type: { $in: ["view", "purchase"] } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const categoryScore = new Map<string, number>();
  for (const interaction of interactions) {
    if (!interaction.category) continue;
    const weight = interaction.type === "purchase" ? 3 : 1;
    categoryScore.set(interaction.category, (categoryScore.get(interaction.category) ?? 0) + weight);
  }

  const topCategories = [...categoryScore.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  const priceFilter = maxPrice ? { price: { $lte: Number(maxPrice) } } : {};

  const candidates =
    topCategories.length > 0
      ? await findProductsWithShop(
          { status: "approved", category: { $in: topCategories }, ...priceFilter },
          12
        )
      : // Cold start: no interaction history yet — surface newest approved products.
        await findProductsWithShop({ status: "approved", ...priceFilter }, 12);

  if (candidates.length === 0) {
    res.json({ products: [] });
    return;
  }

  const rerankCandidates = candidates.map((p, i) => toCandidate(i, p));
  const contextLine =
    topCategories.length > 0
      ? `A shopper has shown interest in these tool categories (most relevant first): ${topCategories.join(", ")}. Recommend products they'd likely want next.`
      : `A new shopper with no browsing history yet. Recommend a well-rounded, appealing set of tools.`;

  const order = await rerankWithGemini(contextLine, rerankCandidates, 8);
  const ordered = order ? order.map((i) => candidates[i]) : candidates.slice(0, 8);
  res.json({ products: ordered });
}
