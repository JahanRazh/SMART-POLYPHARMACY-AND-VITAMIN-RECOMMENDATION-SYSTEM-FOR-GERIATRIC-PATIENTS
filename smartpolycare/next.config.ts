import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Linting runs separately in CI; don't fail the production build on lint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors are surfaced by the IDE/tsc step; don't block the Next.js build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
