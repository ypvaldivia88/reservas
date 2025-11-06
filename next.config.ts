import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
    // En desarrollo, usar unoptimized para evitar timeouts con Vercel Blob
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
