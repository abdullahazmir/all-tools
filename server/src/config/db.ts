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
  await ensureIndexes(db);
  return db;
}

async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("products").createIndex({ title: "text" }),
    db.collection("products").createIndex({ shopId: 1, status: 1 }),
    db.collection("products").createIndex({ status: 1, category: 1, price: 1 }),
    db.collection("shops").createIndex({ shopName: 1 }),
    db.collection("shops").createIndex({ ownerUserId: 1 }, { unique: true }),
    db.collection("reviews").createIndex({ productId: 1, userId: 1 }, { unique: true }),
    db.collection("orders").createIndex({ buyerId: 1 }),
    db.collection("orders").createIndex({ "items.shopId": 1 }),
  ]);
}

export function getDB(): Db {
  if (!db) {
    throw new Error("DB not connected yet — call connectDB() first");
  }
  return db;
}

export function getClient(): MongoClient {
  if (!client) {
    throw new Error("DB not connected yet — call connectDB() first");
  }
  return client;
}
