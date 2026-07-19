// Used only by server components doing their own fetch() on Node.js — unlike the
// browser, Node can't resolve a relative "/api" URL against "the current page", so
// this always needs an absolute URL. API_ORIGIN (server-only, set in production to
// the Render backend) takes priority; falls back to NEXT_PUBLIC_API_URL for local dev
// where both client and server-side fetches point at the same absolute localhost URL.
export const SERVER_API_URL = process.env.API_ORIGIN
  ? `${process.env.API_ORIGIN}/api`
  : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api");
