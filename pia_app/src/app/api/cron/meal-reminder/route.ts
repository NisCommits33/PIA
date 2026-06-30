import { NextResponse } from "next/server";

import { createAdminClient } from "@/utils/supabase/admin";
import { notify } from "@/lib/notify";
import { SHIFTS, type ShiftType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Today's date in Nepal (UTC+5:45) as YYYY-MM-DD. */
function nepalToday(): string {
  const nepal = new Date(Date.now() + (5 * 60 + 45) * 60 * 1000);
  return nepal.toISOString().slice(0, 10);
}

/**
 * Remind staff on a given shift who haven't logged today's meal yet.
 * Triggered by pg_cron (10:00 NPT morning, 19:00 NPT day) via pg_net.
 */
async function run(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const shift = url.searchParams.get("shift") as ShiftType | null;
  const shiftDef = SHIFTS.find((s) => s.value === shift);
  if (!shiftDef) {
    return NextResponse.json({ error: "Invalid shift" }, { status: 400 });
  }

  const today = nepalToday();
  const admin = createAdminClient();

  const [{ data: staff }, { data: adminRows }, { data: logged }] = await Promise.all([
    admin
      .from("profiles")
      .select("id")
      .eq("is_active", true)
      .eq("onboarded", true)
      .eq("default_shift", shift),
    admin.from("user_roles").select("user_id").in("role", ["mess_admin", "super_admin"]),
    admin.from("meal_logs").select("staff_id").eq("meal_date", today).eq("shift", shift),
  ]);

  const adminSet = new Set((adminRows ?? []).map((r) => r.user_id as string));
  const loggedSet = new Set((logged ?? []).map((r) => r.staff_id as string));
  const recipients = (staff ?? [])
    .map((s) => s.id as string)
    .filter((id) => !adminSet.has(id) && !loggedSet.has(id));

  await notify({
    recipientIds: recipients,
    title: "Log your meal",
    body: `Don't forget to log your ${shiftDef.label} meal today.`,
    link: "/dashboard/meals",
    kind: "reminder",
  });

  return NextResponse.json({ ok: true, shift, reminded: recipients.length });
}

export async function POST(request: Request) {
  return run(request);
}

// Allow manual testing with a GET + the bearer secret.
export async function GET(request: Request) {
  return run(request);
}
