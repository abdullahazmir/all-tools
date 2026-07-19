import { Request, Response } from "express";
import { ObjectId } from "mongodb";

/** Reads an ObjectId route param; writes a 400 response and returns null if missing/invalid. */
export function getObjectIdParam(req: Request, res: Response, name: string): ObjectId | null {
  const raw = req.params[name];
  if (typeof raw !== "string" || !ObjectId.isValid(raw)) {
    res.status(400).json({ message: `Invalid ${name}` });
    return null;
  }
  return new ObjectId(raw);
}
