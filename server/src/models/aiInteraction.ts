import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export type InteractionType = "view" | "purchase" | "search";

export interface AiInteraction {
  _id?: ObjectId;
  userId: ObjectId;
  type: InteractionType;
  productId?: ObjectId;
  category?: string;
  query?: string;
  createdAt: Date;
}

export function aiInteractionsCollection() {
  return getDB().collection<AiInteraction>("aiInteractions");
}
