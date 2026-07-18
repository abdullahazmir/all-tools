import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export type OrderStatus = "pending" | "paid" | "shipped" | "completed";

export interface OrderItem {
  productId: ObjectId;
  qty: number;
  price: number;
}

export interface Order {
  _id?: ObjectId;
  buyerId: ObjectId;
  items: OrderItem[];
  totalAmount: number;
  stripePaymentIntentId?: string;
  status: OrderStatus;
  createdAt: Date;
}

export function ordersCollection() {
  return getDB().collection<Order>("orders");
}
