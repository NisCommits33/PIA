"use server";

import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/roles";

type PushSubscriptionJSON = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

/** Save a browser push subscription for the current user. */
export async function subscribeUser(
  sub: PushSubscriptionJSON,
): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await requireUser();
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!sub?.endpoint || !p256dh || !auth) return { error: "Invalid subscription." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: ctx.userId, endpoint: sub.endpoint, p256dh, auth },
      { onConflict: "endpoint" },
    );
  if (error) return { error: "Could not save the subscription." };
  return { ok: true };
}

/** Remove a push subscription (on disable / sign-out of notifications). */
export async function unsubscribeUser(endpoint: string): Promise<void> {
  const ctx = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", ctx.userId);
}

/** Mark notifications read for the current user (all, or a specific one). */
export async function markNotificationsRead(id?: string): Promise<void> {
  const ctx = await requireUser();
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", ctx.userId)
    .is("read_at", null);
  if (id) query = query.eq("id", id);
  await query;
}
