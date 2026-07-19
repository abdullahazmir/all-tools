import { Request, Response } from "express";
import { shopsCollection } from "../models/shop";
import { productsCollection } from "../models/product";
import { ordersCollection } from "../models/order";
import { usersCollection } from "../models/user";
import { getObjectIdParam } from "../utils/params";

const DAY_FORMAT = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

export async function getAdminStats(_req: Request, res: Response): Promise<void> {
  const [shopsCount, productsCount, ordersCount, revenueAgg, signupsOverTime, categorySplit] =
    await Promise.all([
      shopsCollection().countDocuments(),
      productsCollection().countDocuments({ status: "approved" }),
      ordersCollection().countDocuments(),
      ordersCollection()
        .aggregate([
          { $match: { status: "paid" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ])
        .toArray(),
      usersCollection()
        .aggregate([
          { $group: { _id: DAY_FORMAT, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
          { $limit: 30 },
        ])
        .toArray(),
      productsCollection()
        .aggregate([
          { $match: { status: "approved" } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
    ]);

  res.json({
    totals: {
      shops: shopsCount,
      products: productsCount,
      orders: ordersCount,
      revenue: revenueAgg[0]?.total ?? 0,
    },
    signupsOverTime: signupsOverTime.map((d) => ({ date: d._id, count: d.count })),
    categorySplit: categorySplit.map((d) => ({ category: d._id, count: d.count })),
  });
}

export async function getShopStats(req: Request, res: Response): Promise<void> {
  const shopId = getObjectIdParam(req, res, "id");
  if (!shopId) return;

  const shop = await shopsCollection().findOne({ _id: shopId });
  if (!shop) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }
  if (req.user!.role !== "admin" && shop.ownerUserId.toString() !== req.user!.id) {
    res.status(403).json({ message: "You do not own this shop" });
    return;
  }

  const salesOverTime = await ordersCollection()
    .aggregate([
      { $match: { status: "paid" } },
      { $unwind: "$items" },
      { $match: { "items.shopId": shopId } },
      {
        $group: {
          _id: DAY_FORMAT,
          total: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  res.json({
    salesOverTime: salesOverTime.map((d) => ({ date: d._id, total: d.total })),
  });
}
