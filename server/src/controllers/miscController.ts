import { Request, Response } from "express";
import { shopsCollection } from "../models/shop";
import { productsCollection } from "../models/product";
import { ordersCollection } from "../models/order";
import { usersCollection } from "../models/user";
import { contactMessagesCollection } from "../models/contactMessage";
import { newsletterSubscribersCollection } from "../models/newsletterSubscriber";

export async function getPublicStats(_req: Request, res: Response): Promise<void> {
  const [shops, products, orders, users] = await Promise.all([
    shopsCollection().countDocuments({ status: "active" }),
    productsCollection().countDocuments({ status: "approved" }),
    ordersCollection().countDocuments({ status: { $in: ["paid", "shipped", "completed"] } }),
    usersCollection().countDocuments(),
  ]);
  res.json({ shops, products, orders, users });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(req: Request, res: Response): Promise<void> {
  const { name, email, message } = req.body as { name?: string; email?: string; message?: string };

  if (!name || name.trim().length < 2) {
    res.status(400).json({ message: "name is required" });
    return;
  }
  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ message: "a valid email is required" });
    return;
  }
  if (!message || message.trim().length < 10) {
    res.status(400).json({ message: "message must be at least 10 characters" });
    return;
  }

  await contactMessagesCollection().insertOne({
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    createdAt: new Date(),
  });

  res.status(201).json({ success: true });
}

export async function subscribeNewsletter(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string };
  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ message: "a valid email is required" });
    return;
  }

  await newsletterSubscribersCollection().updateOne(
    { email: email.trim() },
    { $setOnInsert: { email: email.trim(), createdAt: new Date() } },
    { upsert: true }
  );

  res.status(201).json({ success: true });
}
