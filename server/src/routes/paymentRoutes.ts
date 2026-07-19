import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { createSellerFeeCheckout } from "../controllers/paymentController";

export const paymentRoutes = Router();

paymentRoutes.post("/seller-fee-checkout", requireAuth, createSellerFeeCheckout);
