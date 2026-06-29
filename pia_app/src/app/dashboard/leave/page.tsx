import { redirect } from "next/navigation";
import { CalendarOff, Ban, RotateCcw } from "lucide-react";

import { requireOnboardedUser, isMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { formatBs, toAdInputValue } from "@/lib/bs-date";
import { LEAVE_TYPES, type LeaveType, type LeaveStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { LeaveForm } from "./leave-form";
import { TeamLeaveTimeline, type TeamLeaveRow } from "./team-leave-timeline";
import { cancelLeave, reactivateLeave, deleteLeave } from "./actions";

const TEAM_LEAVE_COLUMNS =
  "id, staff_id, leave_type, reason, status, start_bs_year, start_bs_month, start_bs_day, end_bs_year, end_bs_month, end_bs_day";

type LeaveRow = {
  id: string;
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

export default async function LeavePage() {
  const ctx = await requireOnboardedUser();
  // Personal leave is for staff; admin accounts are management-only.
  if (isMessAdmin(ctx)) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("leave_records")
    .select(
      "id, leave_type, reason, status, start_bs_year, start_bs_month, start_bs_day, end_bs_year, end_bs_month, end_bs_day",
    )
    .eq("staff_id", ctx.userId)
    .order("start_date", { ascending: false });

  const records = (data as LeaveRow[] | null) ?? [];

  // Whole-team leave for the read-only timeline. RLS limits the normal client
  // to the user's own rows, so read everyone's via the service-role client.
  const adminDb = createAdminClient();
  const [{ data: teamData }, { data: profileData }] = await Promise.all([
    adminDb
      .from("leave_records")
      .select(TEAM_LEAVE_COLUMNS)
      .order("start_date", { ascending: false })
      .limit(200),
    adminDb.from("profiles").select("id, full_name"),
  ]);
  const teamRecords = (teamData as TeamLeaveRow[] | null) ?? [];
  const names = new Map<string, string>();
  for (const p of (profileData as { id: string; full_name: string | null }[] | null) ?? []) {
    if (p.full_name) names.set(p.id, p.full_name);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leave"
        description="Record your leave. This is informational only — no approval needed."
      />

      <Card>
        <CardHeader title="New leave" />
        <CardBody>
          <LeaveForm defaultDate={toAdInputValue(new Date())} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="My leave"
          description={`${records.length} ${records.length === 1 ? "record" : "records"}`}
        />
        {records.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="No leave recorded"
            description="Add your first leave using the form above."
          />
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
                    <div className="flex items-center gap-2">
                      <Badge tone={cancelled ? "neutral" : "primary"}>{typeLabel(r.leave_type)}</Badge>
                      {cancelled && <Badge tone="danger">Cancelled</Badge>}
                    </div>
                    <p className="nums mt-1 text-sm font-medium text-foreground">{dateRange(r)}</p>
                    {r.reason && <p className="text-xs text-muted">{r.reason}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    {cancelled ? (
                      <form action={reactivateLeave.bind(null, r.id)}>
                        <Button type="submit" variant="secondary" size="sm">
                          <RotateCcw aria-hidden className="size-4" />
                          Reactivate
                        </Button>
                      </form>
                    ) : (
                      <form action={cancelLeave.bind(null, r.id)}>
                        <Button type="submit" variant="secondary" size="sm">
                          <Ban aria-hidden className="size-4" />
                          Cancel
                        </Button>
                      </form>
                    )}
                    <form action={deleteLeave.bind(null, r.id)}>
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

      <Card>
        <CardHeader
          title="Team leave timeline"
          description="Everyone's leave at a glance · view only"
        />
        <CardBody>
          <TeamLeaveTimeline records={teamRecords} names={names} />
        </CardBody>
      </Card>
    </div>
  );
}
