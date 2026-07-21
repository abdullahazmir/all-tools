import { Request, Response, NextFunction } from "express";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 15;

const hits = new Map<string, { count: number; resetAt: number }>();

/** Simple fixed-window per-IP limiter for the public assistant chat endpoint. */
export function chatRateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({ message: "Too many messages. Please wait a few minutes and try again." });
    return;
  }

  entry.count += 1;
  next();
}
