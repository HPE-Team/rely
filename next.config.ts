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
};

export default nextConfig;
