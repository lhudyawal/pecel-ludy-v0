import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint checks during build to allow development
    ignoreDuringBuilds: true,
  },
  // Disable source maps in development to avoid warnings
  productionBrowserSourceMaps: false,
};

export default nextConfig;
