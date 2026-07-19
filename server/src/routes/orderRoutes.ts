import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  createOrderCheckout,
  listMyOrders,
  listOrdersAdmin,
  listOrdersByShop,
} from "../controllers/orderController";

export const orderRoutes = Router();

orderRoutes.post("/checkout", requireAuth, createOrderCheckout);
orderRoutes.get("/mine", requireAuth, listMyOrders);
orderRoutes.get("/shop/:shopId", requireAuth, requireRole("seller"), listOrdersByShop);
orderRoutes.get("/", requireAuth, requireRole("admin"), listOrdersAdmin);
