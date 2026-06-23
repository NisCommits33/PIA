import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/proxy";

// Next.js 16 renamed the "middleware" convention to "proxy".
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on all routes except static assets and image optimization files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
