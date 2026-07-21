import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { attachUser } from "../middleware/requireAuth";
import { chatRateLimit } from "../middleware/chatRateLimit";
import {
  generateDescription,
  getRelatedProducts,
  getRecommendedForUser,
} from "../controllers/aiController";
import { chatWithAssistant } from "../controllers/assistantController";

export const aiRoutes = Router();

aiRoutes.post("/generate-description", requireAuth, requireRole("seller"), generateDescription);
aiRoutes.get("/related/:productId", getRelatedProducts);
aiRoutes.get("/recommendations", requireAuth, getRecommendedForUser);
aiRoutes.post("/assistant", chatRateLimit, attachUser, chatWithAssistant);
