import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  createShop,
  getMyShop,
  getShopById,
  listShops,
  listShopsAdmin,
  approveShop,
  suspendShop,
} from "../controllers/shopController";

export const shopRoutes = Router();

shopRoutes.get("/mine", requireAuth, getMyShop);
shopRoutes.get("/admin", requireAuth, requireRole("admin"), listShopsAdmin);
shopRoutes.patch("/:id/approve", requireAuth, requireRole("admin"), approveShop);
shopRoutes.patch("/:id/suspend", requireAuth, requireRole("admin"), suspendShop);
shopRoutes.get("/:id", getShopById);
shopRoutes.get("/", listShops);
shopRoutes.post("/", requireAuth, createShop);
