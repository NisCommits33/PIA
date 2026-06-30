import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/proxy";

// Next.js 16 renamed the "middleware" convention to "proxy".
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on all routes except static assets, image files, and the PWA assets
  // (manifest + service worker). The manifest link is fetched WITHOUT credentials,
  // so it must never hit the auth redirect or the app won't be installable.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
