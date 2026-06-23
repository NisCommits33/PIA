import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

/** Browser-side Supabase client (uses the public publishable key). */
export function createClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient(url, publishableKey);
}
