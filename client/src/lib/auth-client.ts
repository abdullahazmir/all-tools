import { createAuthClient } from "better-auth/react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
// A relative NEXT_PUBLIC_API_URL (e.g. "/api", used in production once Next.js rewrites
// it to the real backend) means same-origin — omit baseURL so better-auth infers it from
// window.location instead of trying to parse "/api" as an absolute URL.
const isRelative = apiUrl.startsWith("/");

export const authClient = createAuthClient({
  ...(isRelative ? {} : { baseURL: apiUrl.replace(/\/api$/, "") }),
  basePath: "/api/auth",
});

export const { useSession, signIn, signUp, signOut } = authClient;
