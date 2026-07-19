import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export type Role = "admin" | "seller" | "buyer";

/**
 * Collection is owned by BetterAuth's mongodb adapter (collection name "user",
 * singular, not "users") — this only adds typed access to fields we read/write
 * directly (role), plus the core fields BetterAuth manages.
 */
export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export function usersCollection() {
  return getDB().collection<User>("user");
}
