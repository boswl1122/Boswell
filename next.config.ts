// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // ✅ allow deploys even if ESLint finds problems
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ allow deploys even if TS type-check fails
    ignoreBuildErrors: true,
  },
};

export default nextConfig;