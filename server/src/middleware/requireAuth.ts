import { Request, Response, NextFunction } from "express";
import { getAuth } from "../auth";
import type { Role } from "../models/user";

export interface AuthedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { fromNodeHeaders } = await import("better-auth/node");
  const auth = await getAuth();

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  req.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as { role: Role }).role,
  };
  next();
}

/** Populates req.user when a session cookie is present, but never blocks the request. */
export async function attachUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const { fromNodeHeaders } = await import("better-auth/node");
  const auth = await getAuth();

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (session) {
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as { role: Role }).role,
    };
  }
  next();
}
