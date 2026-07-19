import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { getAdminStats } from "../controllers/statsController";

export const adminRoutes = Router();

adminRoutes.get("/stats", requireAuth, requireRole("admin"), getAdminStats);
