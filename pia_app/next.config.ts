import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reuse dynamic page segments client-side for a short window so re-navigating
    // tabs / back-forward is instant. Mutations call revalidatePath, which still
    // invalidates the edited path's cache, so data stays correct.
    staleTimes: { dynamic: 30, static: 180 },
  },
  async headers() {
    return [
      {
        // Never cache the service worker so clients always pick up new versions.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
