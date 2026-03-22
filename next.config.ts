import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  compress: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
