import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { reviewsCollection } from "../models/review";
import { ordersCollection } from "../models/order";
import { productsCollection } from "../models/product";
import { getObjectIdParam } from "../utils/params";

async function recomputeProductRating(productId: ObjectId): Promise<void> {
  const stats = await reviewsCollection()
    .aggregate([
      { $match: { productId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    .toArray();

  const { avg, count } = stats[0] ?? { avg: 0, count: 0 };
  await productsCollection().updateOne(
    { _id: productId },
    { $set: { ratingAvg: Math.round(avg * 10) / 10, ratingCount: count } }
  );
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const { productId, rating, comment } = req.body as {
    productId?: string;
    rating?: number;
    comment?: string;
  };

  if (!productId || !ObjectId.isValid(productId)) {
    res.status(400).json({ message: "Valid productId is required" });
    return;
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    res.status(400).json({ message: "rating must be between 1 and 5" });
    return;
  }

  const productObjectId = new ObjectId(productId);
  const buyerId = new ObjectId(req.user!.id);

  const purchase = await ordersCollection().findOne({
    buyerId,
    "items.productId": productObjectId,
    status: { $in: ["paid", "shipped", "completed"] },
  });
  if (!purchase) {
    res.status(403).json({ message: "You must purchase this product before reviewing it" });
    return;
  }

  await reviewsCollection().updateOne(
    { productId: productObjectId, userId: buyerId },
    {
      $set: {
        rating,
        comment: comment?.trim() ?? "",
        userName: req.user!.name,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  await recomputeProductRating(productObjectId);

  const reviews = await reviewsCollection()
    .find({ productId: productObjectId })
    .sort({ createdAt: -1 })
    .toArray();
  res.status(201).json({ reviews });
}

export async function listReviewsByProduct(req: Request, res: Response): Promise<void> {
  const productId = getObjectIdParam(req, res, "productId");
  if (!productId) return;
  const reviews = await reviewsCollection()
    .find({ productId })
    .sort({ createdAt: -1 })
    .toArray();
  res.json({ reviews });
}
