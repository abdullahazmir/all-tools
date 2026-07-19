import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { stripe } from "../config/stripe";
import { env } from "../config/env";
import { shopsCollection } from "../models/shop";
import { usersCollection } from "../models/user";
import { ordersCollection } from "../models/order";
import { productsCollection } from "../models/product";
import { logInteraction } from "./aiController";

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    res.status(400).json({ message: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, env.stripeWebhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    res.status(400).json({ message: "Invalid webhook signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};

    if (metadata.type === "seller_fee" && metadata.shopId && metadata.userId) {
      await shopsCollection().updateOne(
        { _id: new ObjectId(metadata.shopId) },
        { $set: { feePaid: true, status: "active", feePaymentId: session.id } }
      );
      await usersCollection().updateOne(
        { _id: new ObjectId(metadata.userId) },
        { $set: { role: "seller" } }
      );
    }

    if (metadata.type === "order" && metadata.orderId) {
      // Filtering on status:"pending" makes this idempotent against Stripe's
      // at-least-once webhook delivery — a redelivered event won't double-decrement stock.
      const order = await ordersCollection().findOneAndUpdate(
        { _id: new ObjectId(metadata.orderId), status: "pending" },
        {
          $set: {
            status: "paid",
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          },
        },
        { returnDocument: "after" }
      );

      if (order) {
        for (const item of order.items) {
          const product = await productsCollection().findOneAndUpdate(
            { _id: item.productId },
            { $inc: { stock: -item.qty } },
            { returnDocument: "after" }
          );
          if (product) {
            void logInteraction(order.buyerId.toString(), "purchase", {
              productId: item.productId,
              category: product.category,
            });
          }
        }
      }
    }
  }

  res.json({ received: true });
}
