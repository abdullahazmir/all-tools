import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { createReview, listReviewsByProduct } from "../controllers/reviewController";

export const reviewRoutes = Router();

reviewRoutes.post("/", requireAuth, createReview);
reviewRoutes.get("/product/:productId", listReviewsByProduct);
