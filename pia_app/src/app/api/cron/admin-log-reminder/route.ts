import { NextResponse } from "next/server";

import { notify, messAdminIds } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * End-of-day nudge to mess admins to bulk-log any meals not yet recorded.
 * Triggered by pg_cron (21:00 NPT) via pg_net.
 */
async function run(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipients = await messAdminIds();
  await notify({
    recipientIds: recipients,
    title: "Log today's meals",
    body: "Record any meals that weren't logged for today before the day closes.",
    link: "/dashboard/mess/meals",
    kind: "reminder",
  });

  return NextResponse.json({ ok: true, reminded: recipients.length });
}

export async function POST(request: Request) {
  return run(request);
}

export async function GET(request: Request) {
  return run(request);
}
