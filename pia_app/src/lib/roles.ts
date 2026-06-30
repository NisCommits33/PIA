import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import type { AppRole, Profile } from "./types";

export type SessionContext = {
  userId: string;
  email: string;
  roles: AppRole[];
  profile: Profile | null;
};

/**
 * Server-side source of truth for the current user, their roles, and profile.
 * Memoised per request with React `cache` so repeated guards in a single render
 * don't re-hit Supabase. Returns null when not signed in.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // Stale/invalid session (e.g. after a DB reset) — treat as logged out.
    return null;
  }
  if (!user) return null;

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("full_name, phone, department, default_shift, is_active, onboarded")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return {
    userId: user.id,
    email: user.email ?? "",
    roles: (roleRows ?? []).map((r) => r.role as AppRole),
    profile: (profile as Profile | null) ?? null,
  };
});

export function isMessAdmin(ctx: SessionContext): boolean {
  return ctx.roles.includes("mess_admin") || ctx.roles.includes("super_admin");
}

export function isSuperAdmin(ctx: SessionContext): boolean {
  return ctx.roles.includes("super_admin");
}

/** Require an authenticated user; otherwise redirect to login. */
export async function requireUser(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/**
 * Require an authenticated user who has completed onboarding. Sends new users
 * to the onboarding wizard first. Use this to guard the main app.
 */
export async function requireOnboardedUser(): Promise<SessionContext> {
  const ctx = await requireUser();
  // Admins are oversight roles — they don't log meals, so no shift/onboarding needed.
  if (!ctx.profile?.onboarded && !isMessAdmin(ctx)) redirect("/onboarding");
  return ctx;
}

/** Require mess_admin (or super_admin). Non-admins bounce to the dashboard. */
export async function requireMessAdmin(): Promise<SessionContext> {
  const ctx = await requireOnboardedUser();
  if (!isMessAdmin(ctx)) redirect("/dashboard");
  return ctx;
}

/** Require super_admin. Others bounce to the dashboard. */
export async function requireSuperAdmin(): Promise<SessionContext> {
  const ctx = await requireOnboardedUser();
  if (!isSuperAdmin(ctx)) redirect("/dashboard");
  return ctx;
}
