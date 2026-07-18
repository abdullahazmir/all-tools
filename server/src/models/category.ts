import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export interface Category {
  _id?: ObjectId;
  name: string;
  slug: string;
  icon?: string;
}

export function categoriesCollection() {
  return getDB().collection<Category>("categories");
}
