import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { ordersCollection, OrderItem } from "../models/order";
import { productsCollection } from "../models/product";
import { shopsCollection } from "../models/shop";
import { stripe } from "../config/stripe";
import { env } from "../config/env";
import { getObjectIdParam } from "../utils/params";

interface CheckoutLineInput {
  productId: string;
  qty: number;
}

export async function createOrderCheckout(req: Request, res: Response): Promise<void> {
  const { items } = req.body as { items?: CheckoutLineInput[] };

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "items is required" });
    return;
  }
  if (items.some((i) => !ObjectId.isValid(i.productId) || !Number.isInteger(i.qty) || i.qty < 1)) {
    res.status(400).json({ message: "Each item needs a valid productId and qty >= 1" });
    return;
  }

  const orderItems: OrderItem[] = [];
  for (const line of items) {
    const product = await productsCollection().findOne({ _id: new ObjectId(line.productId) });
    if (!product || product.status !== "approved") {
      res.status(400).json({ message: `Product ${line.productId} is not available` });
      return;
    }
    if (product.stock < line.qty) {
      res.status(400).json({ message: `Not enough stock for "${product.title}"` });
      return;
    }
    orderItems.push({
      productId: product._id!,
      shopId: product.shopId,
      title: product.title,
      image: product.images[0] ?? "",
      price: product.price,
      qty: line.qty,
    });
  }

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const order = {
    buyerId: new ObjectId(req.user!.id),
    items: orderItems,
    totalAmount,
    status: "pending" as const,
    createdAt: new Date(),
  };
  const result = await ordersCollection().insertOne(order);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: orderItems.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: Math.round(item.price * 100),
        product_data: { name: item.title },
      },
      quantity: item.qty,
    })),
    success_url: `${env.clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/checkout/cancel`,
    metadata: {
      type: "order",
      orderId: result.insertedId.toString(),
      userId: req.user!.id,
    },
  });

  await ordersCollection().updateOne(
    { _id: result.insertedId },
    { $set: { stripeSessionId: session.id } }
  );

  res.json({ url: session.url });
}

export async function listMyOrders(req: Request, res: Response): Promise<void> {
  const orders = await ordersCollection()
    .find({ buyerId: new ObjectId(req.user!.id) })
    .sort({ createdAt: -1 })
    .toArray();
  res.json({ orders });
}

export async function listOrdersAdmin(_req: Request, res: Response): Promise<void> {
  const orders = await ordersCollection().find().sort({ createdAt: -1 }).toArray();
  res.json({ orders });
}

export async function listOrdersByShop(req: Request, res: Response): Promise<void> {
  const shopId = getObjectIdParam(req, res, "shopId");
  if (!shopId) return;

  const shop = await shopsCollection().findOne({ _id: shopId });
  if (!shop || shop.ownerUserId.toString() !== req.user!.id) {
    res.status(403).json({ message: "You do not own this shop" });
    return;
  }

  const orders = await ordersCollection()
    .find({ "items.shopId": shopId })
    .sort({ createdAt: -1 })
    .toArray();
  res.json({ orders });
}
