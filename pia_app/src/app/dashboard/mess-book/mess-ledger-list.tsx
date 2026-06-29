"use client";

import { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";

import type { ExpenseStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/filter-toolbar";

const STATUS: Record<ExpenseStatus, { label: string; tone: "accent" | "success" | "danger" }> = {
  pending: { label: "Pending", tone: "accent" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export type LedgerEntry = {
  id: string;
  item: string;
  description: string | null;
  amountLabel: string;
  dateLabel: string;
  status: ExpenseStatus;
  reimbursed: boolean;
  submittedBy: string;
  approvedBy: string | null;
  approvedOn: string | null;
};

export function MessLedgerList({ rows }: { rows: LedgerEntry[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ExpenseStatus>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((e) => {
      if (q && !e.item.toLowerCase().includes(q) && !e.submittedBy.toLowerCase().includes(q)) {
        return false;
      }
      if (status !== "all" && e.status !== status) return false;
      return true;
    });
  }, [rows, search, status]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No expenses this month"
        description="Mess purchases for this month will appear here."
      />
    );
  }

  return (
    <>
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search item or submitter…"
        count={filtered.length}
        total={rows.length}
        noun="expense"
      >
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | ExpenseStatus)}
          className="h-11 w-auto"
        >
          <option value="all">All status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </Select>
      </FilterToolbar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No matching expenses"
          description="Try a different search or filter."
        />
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((e) => {
            const s = STATUS[e.status];
            return (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{e.item}</p>
                  {e.description && <p className="text-xs text-muted">{e.description}</p>}
                  <p className="mt-0.5 text-xs text-muted">
                    {e.dateLabel} · by {e.submittedBy}
                    {e.status === "approved" && e.approvedBy
                      ? ` · approved by ${e.approvedBy}${e.approvedOn ? ` on ${e.approvedOn}` : ""}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  {e.status === "approved" && e.reimbursed && (
                    <Badge tone="primary">Reimbursed</Badge>
                  )}
                  <span className="nums w-24 text-right text-sm font-semibold text-foreground">
                    {e.amountLabel}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
