import { ObjectId } from "mongodb";
import { getDB } from "../config/db";

export interface NewsletterSubscriber {
  _id?: ObjectId;
  email: string;
  createdAt: Date;
}

export function newsletterSubscribersCollection() {
  return getDB().collection<NewsletterSubscriber>("newsletterSubscribers");
}
