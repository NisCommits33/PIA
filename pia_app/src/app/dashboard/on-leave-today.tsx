import { CalendarCheck } from "lucide-react";

import { createAdminClient } from "@/utils/supabase/admin";
import { toAdInputValue } from "@/lib/bs-date";
import { LEAVE_TYPES, type LeaveType } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type LeaveToday = { staff_id: string; leave_type: LeaveType };

const TYPE_TONE: Record<LeaveType, "primary" | "accent" | "success" | "neutral"> = {
  casual: "primary",
  sick: "accent",
  annual: "success",
  other: "neutral",
};

function typeLabel(t: LeaveType): string {
  return LEAVE_TYPES.find((x) => x.value === t)?.label ?? t;
}

/**
 * Team-wide "who's off today" snapshot. Reads across all staff via the
 * service-role client (RLS otherwise limits non-super users to their own rows).
 */
export async function OnLeaveToday() {
  const today = toAdInputValue(new Date());
  const adminDb = createAdminClient();

  const [{ data: leaveRows }, { data: profileData }] = await Promise.all([
    adminDb
      .from("leave_records")
      .select("staff_id, leave_type")
      .eq("status", "active")
      .lte("start_date", today)
      .gte("end_date", today),
    adminDb.from("profiles").select("id, full_name"),
  ]);

  const names = new Map(
    ((profileData as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [
      p.id,
      p.full_name,
    ]),
  );
  const rows = (leaveRows as LeaveToday[] | null) ?? [];

  return (
    <Card>
      <CardHeader
        title="On leave today"
        description={`${rows.length} ${rows.length === 1 ? "person" : "people"} off`}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Everyone's in"
          description="No staff are on leave today."
        />
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r, i) => (
            <li
              key={`${r.staff_id}-${i}`}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <span className="truncate text-sm font-medium text-foreground">
                {names.get(r.staff_id) || "Unnamed"}
              </span>
              <Badge tone={TYPE_TONE[r.leave_type]}>{typeLabel(r.leave_type)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
