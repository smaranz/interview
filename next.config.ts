import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Prevent PDF.js from trying to dynamically import worker files in server environment
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Prevent dynamic worker imports
        'pdfjs-dist/build/pdf.worker': false,
        'pdfjs-dist/build/pdf.worker.min': false,
      };
    }
    return config;
  },
};

export default nextConfig;
