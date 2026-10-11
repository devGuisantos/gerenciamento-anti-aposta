import type { NextConfig } from "next";

const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

/**
 * Sent on every response. Each one closes a specific hole rather than being
 * cargo-culted:
 *
 * - `frame-ancestors 'none'` + `X-Frame-Options`: no other site can frame the
 *   sign-in form and trick somebody into typing into it (clickjacking). The CSP
 *   carries only this directive on purpose — a full script policy needs nonces
 *   wired through the App Router, and a half-done one breaks hydration.
 * - `nosniff`: a response is only ever run as the type it was sent as.
 * - `Referrer-Policy`: other sites see our origin, never a full URL with a query.
 * - `Permissions-Policy`: the app uses no camera, microphone or location, so it
 *   can never be talked into asking for them.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * HSTS only in production: sent over plain-HTTP localhost it would be ignored at
 * best, and on a custom dev hostname it would pin that host to HTTPS for a year.
 */
const TRANSPORT_HEADERS =
  process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: `max-age=${ONE_YEAR_IN_SECONDS}; includeSubDomains` }]
    : [];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [...SECURITY_HEADERS, ...TRANSPORT_HEADERS] }];
  },
};

export default nextConfig;
