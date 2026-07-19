import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export type OrderStatus = "pending" | "paid" | "shipped" | "completed";

export interface OrderItem {
  productId: ObjectId;
  shopId: ObjectId;
  title: string;
  image: string;
  price: number;
  qty: number;
}

export interface Order {
  _id?: ObjectId;
  buyerId: ObjectId;
  items: OrderItem[];
  totalAmount: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  status: OrderStatus;
  createdAt: Date;
}

export function ordersCollection() {
  return getDB().collection<Order>("orders");
}
