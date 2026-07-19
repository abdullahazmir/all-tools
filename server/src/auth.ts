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
    // Client (Vercel) and server (Render) are genuinely different sites in production —
    // SameSite=Lax (the default) blocks the session cookie on cross-site fetches. Only
    // apply None+Secure in production: Secure cookies require HTTPS, which local dev doesn't have.
    advanced:
      env.nodeEnv === "production"
        ? {
            useSecureCookies: true,
            defaultCookieAttributes: { sameSite: "none", secure: true },
          }
        : undefined,
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
