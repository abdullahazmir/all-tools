import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { getAuth } from "./auth";
import { meRoutes } from "./routes/meRoutes";
import { shopRoutes } from "./routes/shopRoutes";
import { productRoutes } from "./routes/productRoutes";
import { categoryRoutes } from "./routes/categoryRoutes";
import { paymentRoutes } from "./routes/paymentRoutes";
import { webhookRoutes } from "./routes/webhookRoutes";

export async function createApp(): Promise<Express> {
  const app = express();
  const auth = await getAuth();
  const { toNodeHandler } = await import("better-auth/node");

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );

  // Mounted before express.json() — better-auth reads the raw request body itself.
  app.all("/api/auth/*splat", toNodeHandler(auth));

  // Also before express.json() — Stripe webhook needs the raw body to verify the signature.
  app.use("/api/payments", webhookRoutes);

  app.use(cookieParser());
  app.use(express.json());

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/api/me", meRoutes);
  app.use("/api/shops", shopRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/payments", paymentRoutes);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}
