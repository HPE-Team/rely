import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore
  allowedDevOrigins: ['127.0.0.1', 'localhost'], // Allowed for HMR over 127.0.0.1

  // Ensure these stay available in the server runtime bundle (Vercel output tracing).
  serverExternalPackages: ["md-to-pdf", "@sparticuz/chromium"],

  // Include the Chromium binary payload in the serverless bundle.
  outputFileTracingIncludes: {
    "/api/pdf": [
      "./node_modules/md-to-pdf/**/*",
      "./node_modules/@sparticuz/chromium/**/*",
      "./fonts/**/*",
    ],
  },

  // Disable Next.js image optimization pipeline and its disk cache.
  images: {
    unoptimized: true,
  },

  // Prevent browsers from caching zone logo assets.
  async headers() {
    return [
      {
        source: "/zones/:file*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
