import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { productsCollection, ProductCondition } from "../models/product";
import { shopsCollection } from "../models/shop";
import { getObjectIdParam } from "../utils/params";

const SHOP_LOOKUP_STAGES = [
  {
    $lookup: {
      from: "shops",
      localField: "shopId",
      foreignField: "_id",
      as: "shop",
    },
  },
  { $unwind: "$shop" },
  {
    $project: {
      title: 1,
      shortDesc: 1,
      fullDesc: 1,
      category: 1,
      price: 1,
      condition: 1,
      stock: 1,
      images: 1,
      status: 1,
      ratingAvg: 1,
      ratingCount: 1,
      createdAt: 1,
      shopId: 1,
      "shop._id": 1,
      "shop.shopName": 1,
      "shop.logo": 1,
    },
  },
];

async function getOwnedShopOrFail(userId: string, res: Response) {
  const shop = await shopsCollection().findOne({ ownerUserId: new ObjectId(userId) });
  if (!shop) {
    res.status(404).json({ message: "No shop found for this account" });
    return null;
  }
  return shop;
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const shop = await getOwnedShopOrFail(req.user!.id, res);
  if (!shop) return;
  if (!shop.feePaid || shop.status !== "active") {
    res.status(403).json({ message: "Your shop must be active (registration fee paid) before listing products" });
    return;
  }

  const { title, shortDesc, fullDesc, category, price, condition, stock, images } = req.body as {
    title?: string;
    shortDesc?: string;
    fullDesc?: string;
    category?: string;
    price?: number;
    condition?: ProductCondition;
    stock?: number;
    images?: string[];
  };

  if (!title || title.trim().length < 2) {
    res.status(400).json({ message: "title is required" });
    return;
  }
  if (!category) {
    res.status(400).json({ message: "category is required" });
    return;
  }
  if (typeof price !== "number" || price <= 0) {
    res.status(400).json({ message: "price must be a positive number" });
    return;
  }
  if (condition !== "new" && condition !== "used") {
    res.status(400).json({ message: "condition must be 'new' or 'used'" });
    return;
  }
  if (typeof stock !== "number" || stock < 0) {
    res.status(400).json({ message: "stock must be a non-negative number" });
    return;
  }

  const product = {
    shopId: shop._id!,
    title: title.trim(),
    shortDesc: shortDesc?.trim() ?? "",
    fullDesc: fullDesc?.trim() ?? "",
    category,
    price,
    condition,
    stock,
    images: Array.isArray(images) ? images.filter(Boolean) : [],
    status: "pending" as const,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: new Date(),
  };

  const result = await productsCollection().insertOne(product);
  res.status(201).json({ product: { ...product, _id: result.insertedId } });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const id = getObjectIdParam(req, res, "id");
  if (!id) return;

  const shop = await getOwnedShopOrFail(req.user!.id, res);
  if (!shop) return;

  const existing = await productsCollection().findOne({ _id: id });
  if (!existing) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  if (existing.shopId.toString() !== shop._id!.toString()) {
    res.status(403).json({ message: "You do not own this product" });
    return;
  }

  const { title, shortDesc, fullDesc, category, price, condition, stock, images } = req.body as {
    title?: string;
    shortDesc?: string;
    fullDesc?: string;
    category?: string;
    price?: number;
    condition?: ProductCondition;
    stock?: number;
    images?: string[];
  };

  const update: Record<string, unknown> = { status: "pending" };
  if (title !== undefined) update.title = title.trim();
  if (shortDesc !== undefined) update.shortDesc = shortDesc.trim();
  if (fullDesc !== undefined) update.fullDesc = fullDesc.trim();
  if (category !== undefined) update.category = category;
  if (price !== undefined) update.price = price;
  if (condition !== undefined) update.condition = condition;
  if (stock !== undefined) update.stock = stock;
  if (images !== undefined) update.images = images.filter(Boolean);

  const result = await productsCollection().findOneAndUpdate(
    { _id: id },
    { $set: update },
    { returnDocument: "after" }
  );
  res.json({ product: result });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const id = getObjectIdParam(req, res, "id");
  if (!id) return;

  const product = await productsCollection().findOne({ _id: id });
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  if (req.user!.role !== "admin") {
    const shop = await getOwnedShopOrFail(req.user!.id, res);
    if (!shop) return;
    if (product.shopId.toString() !== shop._id!.toString()) {
      res.status(403).json({ message: "You do not own this product" });
      return;
    }
  }

  await productsCollection().deleteOne({ _id: id });
  res.json({ success: true });
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  const id = getObjectIdParam(req, res, "id");
  if (!id) return;

  const results = await productsCollection()
    .aggregate([{ $match: { _id: id } }, ...SHOP_LOOKUP_STAGES])
    .toArray();
  const product = results[0];

  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }

  if (product.status !== "approved") {
    const isAdmin = req.user?.role === "admin";
    let ownsShop = false;
    if (req.user && req.user.role === "seller") {
      const shop = await shopsCollection().findOne({ ownerUserId: new ObjectId(req.user.id) });
      ownsShop = !!shop && shop._id!.toString() === product.shopId.toString();
    }
    if (!isAdmin && !ownsShop) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
  }

  res.json({ product });
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const { search, category, shopId, minPrice, maxPrice, minRating, condition, sort, page, limit } = req.query as Record<
    string,
    string | undefined
  >;

  const match: Record<string, unknown> = { status: "approved" };
  if (shopId && ObjectId.isValid(shopId)) match.shopId = new ObjectId(shopId);
  if (category) match.category = category;
  if (condition) match.condition = condition;
  if (minPrice || maxPrice) {
    match.price = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
    };
  }
  if (minRating) {
    match.ratingAvg = { $gte: Number(minRating) };
  }

  if (search) {
    const matchingShops = await shopsCollection()
      .find({ shopName: { $regex: search, $options: "i" } })
      .project({ _id: 1 })
      .toArray();
    match.$or = [
      { title: { $regex: search, $options: "i" } },
      { shopId: { $in: matchingShops.map((s) => s._id) } },
    ];
  }

  const sortStage: Record<string, 1 | -1> =
    sort === "price_asc"
      ? { price: 1 }
      : sort === "price_desc"
        ? { price: -1 }
        : sort === "rating"
          ? { ratingAvg: -1 }
          : { createdAt: -1 };

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(48, Math.max(1, Number(limit) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    productsCollection()
      .aggregate([
        { $match: match },
        ...SHOP_LOOKUP_STAGES,
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limitNum },
      ])
      .toArray(),
    productsCollection().countDocuments(match),
  ]);

  res.json({
    products,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
}

export async function listMyProducts(req: Request, res: Response): Promise<void> {
  const shop = await getOwnedShopOrFail(req.user!.id, res);
  if (!shop) return;
  const products = await productsCollection()
    .find({ shopId: shop._id! })
    .sort({ createdAt: -1 })
    .toArray();
  res.json({ products });
}

export async function listProductsAdmin(req: Request, res: Response): Promise<void> {
  const { status } = req.query as { status?: string };
  const match: Record<string, unknown> = status ? { status } : { status: "pending" };
  const products = await productsCollection()
    .aggregate([{ $match: match }, ...SHOP_LOOKUP_STAGES, { $sort: { createdAt: -1 } }])
    .toArray();
  res.json({ products });
}

export async function approveProduct(req: Request, res: Response): Promise<void> {
  const id = getObjectIdParam(req, res, "id");
  if (!id) return;
  const result = await productsCollection().findOneAndUpdate(
    { _id: id },
    { $set: { status: "approved" } },
    { returnDocument: "after" }
  );
  if (!result) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json({ product: result });
}

export async function rejectProduct(req: Request, res: Response): Promise<void> {
  const id = getObjectIdParam(req, res, "id");
  if (!id) return;
  const result = await productsCollection().findOneAndUpdate(
    { _id: id },
    { $set: { status: "rejected" } },
    { returnDocument: "after" }
  );
  if (!result) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json({ product: result });
}
