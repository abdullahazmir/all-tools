import { Router } from "express";
import { getPublicStats, submitContactMessage, subscribeNewsletter } from "../controllers/miscController";

export const miscRoutes = Router();

miscRoutes.get("/stats/public", getPublicStats);
miscRoutes.post("/contact", submitContactMessage);
miscRoutes.post("/newsletter", subscribeNewsletter);
