import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export interface ContactMessage {
  _id?: ObjectId;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

export function contactMessagesCollection() {
  return getDB().collection<ContactMessage>("contactMessages");
}
