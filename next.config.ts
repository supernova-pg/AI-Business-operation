import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Linting is handled in CI via `npm run lint`. Skip during `next build`.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is handled in CI via `tsc`. Skip during `next build`.
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          // Helmet-equivalent: Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Helmet-equivalent: Clickjacking protection
          { key: "X-Frame-Options", value: "DENY" },
          // Helmet-equivalent: XSS filter
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Helmet-equivalent: HSTS
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Helmet-equivalent: Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Helmet-equivalent: Permissions policy
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // CSP: Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; ")
          },
        ],
      },
    ];
  },
};

export default nextConfig;
