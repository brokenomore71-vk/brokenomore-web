import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 2,
    // Puts the stylesheet straight into the HTML instead of a separate file the browser must
    // download before it can draw anything (PageSpeed's "render-blocking requests")
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
