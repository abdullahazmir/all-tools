import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { stripe, SELLER_FEE_AMOUNT_CENTS } from "../config/stripe";
import { shopsCollection } from "../models/shop";
import { env } from "../config/env";

export async function createSellerFeeCheckout(req: Request, res: Response): Promise<void> {
  const { shopId } = req.body as { shopId?: string };
  if (!shopId || !ObjectId.isValid(shopId)) {
    res.status(400).json({ message: "Valid shopId is required" });
    return;
  }

  const shop = await shopsCollection().findOne({ _id: new ObjectId(shopId) });
  if (!shop) {
    res.status(404).json({ message: "Shop not found" });
    return;
  }
  if (shop.ownerUserId.toString() !== req.user!.id) {
    res.status(403).json({ message: "You do not own this shop" });
    return;
  }
  if (shop.feePaid) {
    res.status(400).json({ message: "Registration fee already paid" });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: SELLER_FEE_AMOUNT_CENTS,
          product_data: {
            name: "ToolBazaar Seller Registration Fee",
            description: `One-time registration for shop "${shop.shopName}"`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${env.clientUrl}/become-seller/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/become-seller/cancel`,
    metadata: {
      type: "seller_fee",
      shopId: shop._id!.toString(),
      userId: req.user!.id,
    },
  });

  res.json({ url: session.url });
}
