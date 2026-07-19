import type { NextConfig } from "next";

// In production the API runs on a different host (Render) than the client (Vercel).
// Proxying /api/* through Next.js makes it same-origin from the browser's perspective,
// which the session cookie (and proxy.ts's cookie check) depends on — cookies set by a
// cross-site response are invisible to proxy.ts running on this domain no matter what
// SameSite value is used, since SameSite only governs whether an *already-owned* cookie
// is attached to a request, not which domain owns it in the first place.
const API_ORIGIN = process.env.API_ORIGIN;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!API_ORIGIN) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
