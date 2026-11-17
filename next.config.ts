import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  compress: true,
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    cpus: 2,
    // Inlines critical CSS into HTML to eliminate render-blocking CSS requests
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
