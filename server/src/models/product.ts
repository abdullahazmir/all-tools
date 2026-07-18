import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export type ProductStatus = "pending" | "approved" | "rejected";
export type ProductCondition = "new" | "used";

export interface Product {
  _id?: ObjectId;
  shopId: ObjectId;
  title: string;
  shortDesc: string;
  fullDesc: string;
  category: string;
  price: number;
  condition: ProductCondition;
  stock: number;
  images: string[];
  status: ProductStatus;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
}

export function productsCollection() {
  return getDB().collection<Product>("products");
}
