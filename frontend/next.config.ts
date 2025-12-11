import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // --- Departments ---
      {
        source: "/departments/:path*",
        destination: "http://localhost:3001/departments/:path*",
      },
      {
        source: "/departments/:path*",
        destination: "http://localhost:3001/departments/:path*",
      },

      // --- Business Units ---
      {
        source: "/business-units",
        destination: "http://localhost:3001/business-units",
      },
      {
        source: "/business-units/:path*",
        destination: "http://localhost:3001/business-units/:path*",
      },

      // --- Users ---
      {
        source: "/users",
        destination: "http://localhost:3001/users",
      },
      {
        source: "/users/:path*",
        destination: "http://localhost:3001/users/:path*",
      },

      // --- Auth ---
      {
        source: "/auth",
        destination: "http://localhost:3001/auth",
      },
      {
        source: "/auth/:path*",
        destination: "http://localhost:3001/auth/:path*",
      },

      // --- Roles ---
      {
        source: "/roles",
        destination: "http://localhost:3001/roles",
      },
      {
        source: "/roles/:path*",
        destination: "http://localhost:3001/roles/:path*",
      },

      // --- Permissions ---
      {
        source: "/permissions",
        destination: "http://localhost:3001/permissions",
      },
      {
        source: "/permissions/:path*",
        destination: "http://localhost:3001/permissions/:path*",
      },

      // Add more backend modules here using the same pattern
    ];
  },

  // Optional: allow images from backend
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },
    ],
  },
};

export default nextConfig;
