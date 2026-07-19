import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

export const meRoutes = Router();

meRoutes.get("/", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
