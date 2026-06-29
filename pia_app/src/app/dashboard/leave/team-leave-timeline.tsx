import { CalendarOff } from "lucide-react";

import { formatBs } from "@/lib/bs-date";
import { LEAVE_TYPES, type LeaveType, type LeaveStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

export type TeamLeaveRow = {
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

const TYPE_TONE: Record<LeaveType, "primary" | "accent" | "success" | "neutral"> = {
  casual: "primary",
  sick: "accent",
  annual: "success",
  other: "neutral",
};

const DOT_COLOR: Record<LeaveType, string> = {
  casual: "bg-primary",
  sick: "bg-accent",
  annual: "bg-success",
  other: "bg-muted",
};

function typeLabel(t: LeaveType): string {
  return LEAVE_TYPES.find((x) => x.value === t)?.label ?? t;
}

function dateRange(r: TeamLeaveRow): string {
  const start = formatBs({ year: r.start_bs_year, month: r.start_bs_month, day: r.start_bs_day });
  const end = formatBs({ year: r.end_bs_year, month: r.end_bs_month, day: r.end_bs_day });
  return start === end ? start : `${start} → ${end}`;
}

/**
 * Read-only vertical timeline of every staff member's leave, newest first.
 * Each entry is a dot on a left rail, colour-coded by leave type, with a text
 * label too (never colour alone) so it stays accessible.
 */
export function TeamLeaveTimeline({
  records,
  names,
}: {
  records: TeamLeaveRow[];
  names: Map<string, string>;
}) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="No team leave yet"
        description="Leave recorded by any staff member will show up on this timeline."
      />
    );
  }

  return (
    <ol className="relative ml-4 border-l border-border py-2 pl-6">
      {records.map((r) => {
        const cancelled = r.status === "cancelled";
        return (
          <li key={r.id} className={cn("relative pb-6 last:pb-0", cancelled && "opacity-55")}>
            <span
              aria-hidden
              className={cn(
                "absolute -left-[1.84rem] top-1 size-3 rounded-full ring-4 ring-surface",
                cancelled ? "bg-muted" : DOT_COLOR[r.leave_type],
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {names.get(r.staff_id) || "Unnamed"}
              </span>
              <Badge tone={cancelled ? "neutral" : TYPE_TONE[r.leave_type]}>
                {typeLabel(r.leave_type)}
              </Badge>
              {cancelled && <Badge tone="danger">Cancelled</Badge>}
            </div>
            <p className="nums mt-0.5 text-sm text-foreground">{dateRange(r)}</p>
            {r.reason && <p className="mt-0.5 text-xs text-muted">{r.reason}</p>}
          </li>
        );
      })}
    </ol>
  );
}
