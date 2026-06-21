import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  experimental: {
      turbopackFileSystemCacheForDev: true
  }
};

export default nextConfig;
