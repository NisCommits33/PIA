import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import { sendPush } from "@/lib/push";

export type NotifyInput = {
  recipientIds: string[];
  title: string;
  body?: string;
  link?: string;
  kind?: string;
};

/**
 * Notify users: write an in-app notification row per recipient (powers the bell
 * + Realtime) and fire a Web Push. Best-effort — never throws, so it can't break
 * the action that triggered it.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const ids = Array.from(new Set(input.recipientIds.filter(Boolean)));
    if (ids.length === 0) return;

    const admin = createAdminClient();
    await admin.from("notifications").insert(
      ids.map((id) => ({
        recipient_id: id,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        kind: input.kind ?? "general",
      })),
    );

    await sendPush(ids, { title: input.title, body: input.body, link: input.link });
  } catch {
    // best-effort notification — swallow.
  }
}

/** User ids for admin-targeted notifications (mess_admin + super_admin). */
export async function messAdminIds(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_roles")
    .select("user_id")
    .in("role", ["mess_admin", "super_admin"]);
  return Array.from(new Set((data ?? []).map((r) => r.user_id as string)));
}
