import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export type ShopStatus = "pending" | "active" | "suspended";

export interface Shop {
  _id?: ObjectId;
  ownerUserId: ObjectId;
  shopName: string;
  logo?: string;
  description?: string;
  address?: string;
  feePaid: boolean;
  feePaymentId?: string;
  status: ShopStatus;
  createdAt: Date;
}

export function shopsCollection() {
  return getDB().collection<Shop>("shops");
}
