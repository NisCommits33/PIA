import "server-only";

import webpush from "web-push";

import { createAdminClient } from "@/utils/supabase/admin";

export type PushPayload = { title: string; body?: string; link?: string };

let configured = false;

/** Configure web-push with the VAPID keys. Returns false if keys aren't set. */
function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails("mailto:nixstha2@gmail.com", publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Send a Web Push to every push subscription of the given users. Best-effort:
 * silently no-ops if VAPID isn't configured, and prunes expired subscriptions.
 */
export async function sendPush(recipientIds: string[], payload: PushPayload): Promise<void> {
  if (recipientIds.length === 0 || !configure()) return;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", recipientIds);
  if (!subs || subs.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    link: payload.link ?? "/dashboard",
  });

  const expired: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) expired.push(s.id); // gone — clean up
      }
    }),
  );

  if (expired.length) {
    await admin.from("push_subscriptions").delete().in("id", expired);
  }
}
