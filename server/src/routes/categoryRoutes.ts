import { Router } from "express";
import { categoriesCollection } from "../models/category";

export const categoryRoutes = Router();

categoryRoutes.get("/", async (_req, res) => {
  const categories = await categoriesCollection().find().sort({ name: 1 }).toArray();
  res.json({ categories });
});
