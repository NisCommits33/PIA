import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "./env";

/**
 * Refreshes the Supabase auth session on each request and keeps cookies in sync.
 * Call this from `src/middleware.ts`. Do not run other logic between creating the
 * client and calling getUser() — it can cause hard-to-debug session bugs.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touch the user to trigger token refresh; result intentionally unused here.
  await supabase.auth.getUser();

  return response;
}
