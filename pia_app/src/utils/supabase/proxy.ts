import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "./env";

/** Paths reachable without an authenticated session. */
const PUBLIC_PATHS = ["/login", "/offline"];

/**
 * Refreshes the Supabase auth session on each request, keeps cookies in sync,
 * and redirects unauthenticated users to /login. Called from src/proxy.ts.
 * Do not run other logic between creating the client and calling getUser() —
 * it can cause hard-to-debug session bugs.
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

  // Touch the user to trigger token refresh. Keep this immediately after client
  // creation; the result also drives the redirect below. A stale/invalid refresh
  // token (e.g. after a DB reset) makes this throw — treat that as logged out.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const redirect = NextResponse.redirect(loginUrl);
    // Drop any stale Supabase auth cookies so the bad token doesn't loop.
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) redirect.cookies.delete(cookie.name);
    }
    return redirect;
  }

  return response;
}
