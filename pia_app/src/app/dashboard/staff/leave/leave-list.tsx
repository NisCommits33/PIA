"use client";

import { useMemo, useState } from "react";
import { CalendarOff, Ban, RotateCcw } from "lucide-react";

import { LEAVE_TYPES, type LeaveType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { FilterToolbar } from "@/components/filter-toolbar";
import { adminCancelLeave, adminReactivateLeave, adminDeleteLeave } from "./actions";

export type LeaveListRow = {
  id: string;
  staffName: string;
  leaveType: LeaveType;
  typeLabel: string;
  cancelled: boolean;
  dateRange: string;
  reason: string | null;
};

export function LeaveList({ rows }: { rows: LeaveListRow[] }) {
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "cancelled">("all");
  const [type, setType] = useState<"all" | LeaveType>("all");

  const staffOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.staffName))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        q &&
        !r.staffName.toLowerCase().includes(q) &&
        !(r.reason ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (staff !== "all" && r.staffName !== staff) return false;
      if (status === "active" && r.cancelled) return false;
      if (status === "cancelled" && !r.cancelled) return false;
      if (type !== "all" && r.leaveType !== type) return false;
      return true;
    });
  }, [rows, search, staff, status, type]);

  if (rows.length === 0) {
    return (
      <EmptyState icon={CalendarOff} title="No leave records" description="Staff leave will appear here." />
    );
  }

  return (
    <>
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search staff or reason…"
        count={filtered.length}
        total={rows.length}
        noun="record"
      >
        <Select
          aria-label="Filter by staff"
          value={staff}
          onChange={(e) => setStaff(e.target.value)}
          className="h-11 w-auto"
        >
          <option value="all">All staff</option>
          {staffOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | "active" | "cancelled")}
          className="h-11 w-auto"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select
          aria-label="Filter by type"
          value={type}
          onChange={(e) => setType(e.target.value as "all" | LeaveType)}
          className="h-11 w-auto"
        >
          <option value="all">All types</option>
          {LEAVE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </FilterToolbar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No matching records"
          description="Try a different search or filter."
        />
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
                r.cancelled && "opacity-60",
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{r.staffName}</span>
                  <Badge tone={r.cancelled ? "neutral" : "primary"}>{r.typeLabel}</Badge>
                  {r.cancelled && <Badge tone="danger">Cancelled</Badge>}
                </div>
                <p className="nums mt-0.5 text-sm text-foreground">{r.dateRange}</p>
                {r.reason && <p className="text-xs text-muted">{r.reason}</p>}
              </div>

              <div className="flex items-center gap-2">
                {r.cancelled ? (
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
          ))}
        </ul>
      )}
    </>
  );
}
