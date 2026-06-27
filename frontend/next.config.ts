import type { NextConfig } from "next";

const backendUrl = process.env.NODE_ENV === "production" ? "http://backend:8000" : "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    proxyClientMaxBodySize: "500mb",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
