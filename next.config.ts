import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackPluginRuntimeStrategy: "workerThreads",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
        pathname: "/coins/images/**",
      },
    ],
  },
};

export default nextConfig;
