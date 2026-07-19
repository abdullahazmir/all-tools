import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { shopsCollection } from "../models/shop";
import { getObjectIdParam } from "../utils/params";

export async function createShop(req: Request, res: Response): Promise<void> {
  const { shopName, description, address, logo } = req.body as {
    shopName?: string;
    description?: string;
    address?: string;
    logo?: string;
  };

  if (!shopName || shopName.trim().length < 2) {
    res.status(400).json({ message: "shopName is required" });
    return;
  }

  const shops = shopsCollection();
  const ownerUserId = new ObjectId(req.user!.id);

  const existing = await shops.findOne({ ownerUserId });
  if (existing) {
    res.status(200).json({ shop: existing });
    return;
  }

  const shop = {
    ownerUserId,
    shopName: shopName.trim(),
    description: description?.trim() ?? "",
    address: address?.trim() ?? "",
    logo: logo?.trim() ?? "",
    feePaid: false,
    status: "pending" as const,
    createdAt: new Date(),
  };

  const result = await shops.insertOne(shop);
  res.status(201).json({ shop: { ...shop, _id: result.insertedId } });
}

export async function getMyShop(req: Request, res: Response): Promise<void> {
  const shop = await shopsCollection().findOne({ ownerUserId: new ObjectId(req.user!.id) });
  if (!shop) {
    res.status(404).json({ message: "No shop found for this account" });
    return;
  }
  res.json({ shop });
}

export async function getShopById(req: Request, res: Response): Promise<void> {
  const id = getObjectIdParam(req, res, "id");
  if (!id) return;
  const shop = await shopsCollection().findOne({ _id: id });
  if (!shop) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }
  res.json({ shop });
}

export async function listShops(req: Request, res: Response): Promise<void> {
  const { search } = req.query as { search?: string };
  const filter: Record<string, unknown> = { status: "active" };
  if (search) {
    filter.shopName = { $regex: search, $options: "i" };
  }
  const shops = await shopsCollection().find(filter).sort({ createdAt: -1 }).toArray();
  res.json({ shops });
}

export async function listShopsAdmin(req: Request, res: Response): Promise<void> {
  const { status } = req.query as { status?: string };
  const filter: Record<string, unknown> = {};
  if (status) {
    filter.status = status;
  }
  const shops = await shopsCollection().find(filter).sort({ createdAt: -1 }).toArray();
  res.json({ shops });
}

export async function approveShop(req: Request, res: Response): Promise<void> {
  const id = getObjectIdParam(req, res, "id");
  if (!id) return;
  const result = await shopsCollection().findOneAndUpdate(
    { _id: id },
    { $set: { status: "active" } },
    { returnDocument: "after" }
  );
  if (!result) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }
  res.json({ shop: result });
}

export async function suspendShop(req: Request, res: Response): Promise<void> {
  const id = getObjectIdParam(req, res, "id");
  if (!id) return;
  const result = await shopsCollection().findOneAndUpdate(
    { _id: id },
    { $set: { status: "suspended" } },
    { returnDocument: "after" }
  );
  if (!result) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }
  res.json({ shop: result });
}
