import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  listProducts,
  listMyProducts,
  listProductsAdmin,
  approveProduct,
  rejectProduct,
} from "../controllers/productController";

export const productRoutes = Router();

productRoutes.get("/mine", requireAuth, requireRole("seller"), listMyProducts);
productRoutes.get("/admin", requireAuth, requireRole("admin"), listProductsAdmin);
productRoutes.patch("/:id/approve", requireAuth, requireRole("admin"), approveProduct);
productRoutes.patch("/:id/reject", requireAuth, requireRole("admin"), rejectProduct);
productRoutes.get("/:id", attachUser, getProductById);
productRoutes.get("/", listProducts);
productRoutes.post("/", requireAuth, requireRole("seller"), createProduct);
productRoutes.patch("/:id", requireAuth, requireRole("seller"), updateProduct);
productRoutes.delete("/:id", requireAuth, deleteProduct);
