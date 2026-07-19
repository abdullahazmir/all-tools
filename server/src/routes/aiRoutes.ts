import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  generateDescription,
  getRelatedProducts,
  getRecommendedForUser,
} from "../controllers/aiController";

export const aiRoutes = Router();

aiRoutes.post("/generate-description", requireAuth, requireRole("seller"), generateDescription);
aiRoutes.get("/related/:productId", getRelatedProducts);
aiRoutes.get("/recommendations", requireAuth, getRecommendedForUser);
