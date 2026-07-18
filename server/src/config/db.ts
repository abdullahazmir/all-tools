import { MongoClient, Db } from "mongodb";
import { env } from "./env";

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not set");
  }
  client = new MongoClient(env.mongoUri);
  await client.connect();
  db = client.db();
  console.log("MongoDB connected");
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error("DB not connected yet — call connectDB() first");
  }
  return db;
}
