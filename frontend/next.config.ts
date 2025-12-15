import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // PROXY ALL API CALLS TO YOUR EXPRESS BACKEND (port 3001)
  async rewrites() {
    return [
      // ── CAB AGREEMENTS ───────────────────────────────────────
      {
        source: "/cab-agreements",
        destination: "http://localhost:3001/cab-agreements",
      },
      {
        source: "/cab-agreements/:path*",
        destination: "http://localhost:3001/cab-agreements/:path*",
      },
      // ── CAB SERVICES ──────────────────────────────────────────
      {
        source: "/cab-services",
        destination: "http://localhost:3001/cab-services",
      },
      {
        source: "/cab-services/:path*",
        destination: "http://localhost:3001/cab-services/:path*",
      },

      // ── BUSINESS UNITS ─────────────────────────────────────
      {
        source: "/business-units",
        destination: "http://localhost:3001/business-units",
      },
      {
        source: "/business-units/:path*",
        destination: "http://localhost:3001/business-units/:path*",
      },

      // ── DEPARTMENTS ───────────────────────────────────────
      {
        source: "/departments",
        destination: "http://localhost:3001/departments",
      },
      {
        source: "/departments/:path*",
        destination: "http://localhost:3001/departments/:path*",
      },

      // ── USERS ─────────────────────────────────────────────
      {
        source: "/users",
        destination: "http://localhost:3001/users",
      },
      {
        source: "/users/:path*",
        destination: "http://localhost:3001/users/:path*",
      },

      // ── AUTH ──────────────────────────────────────────────
      {
        source: "/auth",
        destination: "http://localhost:3001/auth",
      },
      {
        source: "/auth/:path*",
        destination: "http://localhost:3001/auth/:path*",
      },

      // ── ROLES & PERMISSIONS ───────────────────────────────
      {
        source: "/roles",
        destination: "http://localhost:3001/roles",
      },
      {
        source: "/roles/:path*",
        destination: "http://localhost:3001/roles/:path*",
      },
      {
        source: "/permissions",
        destination: "http://localhost:3001/permissions",
      },
      {
        source: "/permissions/:path*",
        destination: "http://localhost:3001/permissions/:path*",
      },

      // ── FALLBACK: ANY OTHER /api/* routes (optional safety) ──
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },

  // Allow images from backend (avatars, uploads, etc.)
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
    ],
  },

  // This is crucial for query params like ?page=1&limit=10&search=tech
  // Without it Next.js strips or messes up the query string on some rewrites
  experimental: {
    proxyTimeout: 60_000, // 60 seconds (prevents timeout on large responses)
  },
};

export default nextConfig;
