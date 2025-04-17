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

  // Removing redirects again - sequence will be handled by client-side logic on button click
  // async redirects() { ... }
};

export default nextConfig;
