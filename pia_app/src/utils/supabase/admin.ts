import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseEnv, supabaseServiceRoleKey } from "./env";

/**
 * Privileged Supabase client using the service-role key. BYPASSES Row Level
 * Security — only use it in server code, after an explicit role check, for
 * operations RLS can't express (e.g. creating auth users). Never import this
 * into a Client Component.
 */
export function createAdminClient() {
  const { url } = supabaseEnv();
  return createSupabaseClient(url, supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
