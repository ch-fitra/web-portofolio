import type { NextConfig } from "next";
// npm runs in the app directory, including isolated update.sh build checkouts.
// Do not infer the root from a parent checkout's package-lock.json.
const projectRoot = process.cwd();
const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },
  poweredByHeader: false,
  outputFileTracingExcludes: {
    "/*": ["./.local/**/*", "./.env*", "./storage/**/*", "./tests/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};
export default config;
