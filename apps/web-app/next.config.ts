import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // "standalone" is only needed for Docker/self-hosted deployments.
  // Set NEXT_OUTPUT_MODE=standalone in Dockerfile; leave unset for Vercel.
  ...(process.env.NEXT_OUTPUT_MODE === "standalone" ? { output: "standalone" } : {}),
  experimental: {
      turbopackFileSystemCacheForDev: true
  }
};

export default nextConfig;
