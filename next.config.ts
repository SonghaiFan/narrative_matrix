import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Removing redirects as they will be handled client-side for context awareness
  // async redirects() {
  //   return [
  //     // ... redirects removed ...
  //   ]
  // },
};

export default nextConfig;
