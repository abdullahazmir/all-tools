import { getDB, getClient } from "./config/db";
import { env } from "./config/env";

let authInstance: Awaited<ReturnType<typeof buildAuth>> | undefined;

export async function getAuth() {
  if (!authInstance) {
    authInstance = await buildAuth();
  }
  return authInstance;
}

async function buildAuth() {
  const { betterAuth } = await import("better-auth/minimal");
  const { mongodbAdapter } = await import("better-auth/adapters/mongodb");

  return betterAuth({
    appName: "ToolBazaar",
    baseURL: env.serverUrl,
    basePath: "/api/auth",
    secret: env.betterAuthSecret,
    trustedOrigins: [env.clientUrl],
    database: mongodbAdapter(getDB(), { client: getClient() }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "buyer",
          input: false,
        },
      },
    },
  });
}

export type Auth = Awaited<ReturnType<typeof buildAuth>>;
