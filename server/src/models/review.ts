import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export interface Review {
  _id?: ObjectId;
  productId: ObjectId;
  userId: ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

export function reviewsCollection() {
  return getDB().collection<Review>("reviews");
}
