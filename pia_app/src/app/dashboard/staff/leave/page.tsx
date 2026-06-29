import { CalendarOff, Ban, RotateCcw } from "lucide-react";

import { requireSuperAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { formatBs } from "@/lib/bs-date";
import { LEAVE_TYPES, type LeaveType, type LeaveStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { adminCancelLeave, adminReactivateLeave, adminDeleteLeave } from "./actions";

type LeaveRow = {
  id: string;
  staff_id: string;
  leave_type: LeaveType;
  reason: string | null;
  status: LeaveStatus;
  start_bs_year: number;
  start_bs_month: number;
  start_bs_day: number;
  end_bs_year: number;
  end_bs_month: number;
  end_bs_day: number;
};

function typeLabel(t: LeaveType): string {
  return LEAVE_TYPES.find((x) => x.value === t)?.label ?? t;
}

function dateRange(r: LeaveRow): string {
  const start = formatBs({ year: r.start_bs_year, month: r.start_bs_month, day: r.start_bs_day });
  const end = formatBs({ year: r.end_bs_year, month: r.end_bs_month, day: r.end_bs_day });
  return start === end ? start : `${start} → ${end}`;
}

export default async function StaffLeavePage() {
  await requireSuperAdmin();

  const supabase = await createClient();
  const [{ data: leaveData }, { data: profileData }] = await Promise.all([
    supabase
      .from("leave_records")
      .select(
        "id, staff_id, leave_type, reason, status, start_bs_year, start_bs_month, start_bs_day, end_bs_year, end_bs_month, end_bs_day",
      )
      .order("start_date", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const names = new Map(
    ((profileData as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [
      p.id,
      p.full_name,
    ]),
  );
  const records = (leaveData as LeaveRow[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff leave"
        description="View and correct any staff member's leave records."
      />

      <Card>
        <CardHeader
          title="All leave"
          description={`${records.length} ${records.length === 1 ? "record" : "records"}`}
        />
        {records.length === 0 ? (
          <EmptyState icon={CalendarOff} title="No leave records" description="Staff leave will appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {records.map((r) => {
              const cancelled = r.status === "cancelled";
              return (
                <li
                  key={r.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
                    cancelled && "opacity-60",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {names.get(r.staff_id) || "Unnamed"}
                      </span>
                      <Badge tone={cancelled ? "neutral" : "primary"}>{typeLabel(r.leave_type)}</Badge>
                      {cancelled && <Badge tone="danger">Cancelled</Badge>}
                    </div>
                    <p className="nums mt-0.5 text-sm text-foreground">{dateRange(r)}</p>
                    {r.reason && <p className="text-xs text-muted">{r.reason}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {cancelled ? (
                      <form action={adminReactivateLeave.bind(null, r.id)}>
                        <Button type="submit" variant="secondary" size="sm">
                          <RotateCcw aria-hidden className="size-4" />
                          Reactivate
                        </Button>
                      </form>
                    ) : (
                      <form action={adminCancelLeave.bind(null, r.id)}>
                        <Button type="submit" variant="secondary" size="sm">
                          <Ban aria-hidden className="size-4" />
                          Cancel
                        </Button>
                      </form>
                    )}
                    <form action={adminDeleteLeave.bind(null, r.id)}>
                      <Button type="submit" variant="danger" size="sm">
                        Remove
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
