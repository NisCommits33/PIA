import { requireSuperAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { formatBs } from "@/lib/bs-date";
import { LEAVE_TYPES, type LeaveType, type LeaveStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { LeaveList, type LeaveListRow } from "./leave-list";

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

  const rows: LeaveListRow[] = ((leaveData as LeaveRow[] | null) ?? []).map((r) => ({
    id: r.id,
    staffName: names.get(r.staff_id) || "Unnamed",
    leaveType: r.leave_type,
    typeLabel: typeLabel(r.leave_type),
    cancelled: r.status === "cancelled",
    dateRange: dateRange(r),
    reason: r.reason,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff leave"
        description="View and correct any staff member's leave records."
      />

      <Card>
        <CardHeader
          title="All leave"
          description={`${rows.length} ${rows.length === 1 ? "record" : "records"}`}
        />
        <LeaveList rows={rows} />
      </Card>
    </div>
  );
}
