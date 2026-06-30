"use server";

import { requireSuperAdmin } from "@/lib/roles";
import { createAdminClient } from "@/utils/supabase/admin";
import { notify } from "@/lib/notify";

export type AnnounceState = { ok?: string; error?: string } | undefined;

/**
 * Broadcast an announcement to every user — delivered to the in-app bell (live)
 * and as a Web Push. Super-admin only.
 */
export async function sendAnnouncement(
  _prev: AnnounceState,
  formData: FormData,
): Promise<AnnounceState> {
  await requireSuperAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const linkRaw = String(formData.get("link") ?? "").trim();
  // Only allow internal links (must start with "/").
  const link = linkRaw.startsWith("/") ? linkRaw : undefined;

  if (title.length < 2) return { error: "Add a title." };
  if (message.length < 2) return { error: "Add a message." };

  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id");
  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length === 0) return { error: "There are no users to notify yet." };

  await notify({
    recipientIds: ids,
    title,
    body: message,
    link,
    kind: "announcement",
  });

  return { ok: `Announcement sent to ${ids.length} ${ids.length === 1 ? "person" : "people"}.` };
}
