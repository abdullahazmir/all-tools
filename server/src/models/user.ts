import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export type Role = "admin" | "seller" | "buyer";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  oauthId?: string;
  role: Role;
  avatar?: string;
  createdAt: Date;
}

export function usersCollection() {
  return getDB().collection<User>("users");
}
