import { Router, raw } from "express";
import { handleStripeWebhook } from "../controllers/webhookController";

export const webhookRoutes = Router();

webhookRoutes.post("/webhook", raw({ type: "application/json" }), handleStripeWebhook);
