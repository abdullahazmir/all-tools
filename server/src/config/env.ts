import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: process.env.PORT ?? "5000",
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGO_URI ?? "",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  serverUrl: process.env.SERVER_URL ?? `http://localhost:${process.env.PORT ?? "5000"}`,
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
};

export { required };
