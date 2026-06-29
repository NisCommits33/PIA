"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, Check, X, BadgeCheck } from "lucide-react";

import type { ExpenseStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionButton } from "@/components/ui/action-button";
import { FilterToolbar } from "@/components/filter-toolbar";
import { ExpenseInfoTrigger, type ExpenseDetail } from "@/components/expense-detail";
import { ExpenseAdminActions } from "./expense-admin-actions";
import { approveExpense, rejectExpense, markReimbursed } from "./actions";

const STATUS: Record<ExpenseStatus, { label: string; tone: "accent" | "success" | "danger" }> = {
  pending: { label: "Pending", tone: "accent" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

export type ExpenseReviewRow = {
  id: string;
  item: string;
  submitterName: string;
  amountLabel: string;
  status: ExpenseStatus;
  reimbursed: boolean;
  detail: ExpenseDetail;
  admin: { id: string; item: string; description: string | null; amount: number; spentOn: string };
};

export function ExpenseReviewList({ rows }: { rows: ExpenseReviewRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ExpenseStatus>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((e) => {
      if (q && !e.item.toLowerCase().includes(q) && !e.submitterName.toLowerCase().includes(q)) {
        return false;
      }
      if (status !== "all" && e.status !== status) return false;
      return true;
    });
  }, [rows, search, status]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Nothing to review"
        description="Expenses submitted by staff will appear here."
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
        noun="item"
      >
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | ExpenseStatus)}
          className="h-11 w-auto"
        >
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </FilterToolbar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No matching expenses"
          description="Try a different search or filter."
        />
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((e) => {
            const s = STATUS[e.status];
            return (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <ExpenseInfoTrigger expense={e.detail} />

                <span className="nums w-24 text-right text-sm font-semibold text-foreground">
                  {e.amountLabel}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {e.status === "pending" ? (
                    <>
                      <ActionButton
                        action={() => approveExpense(e.id)}
                        successMessage={`Approved “${e.item}”`}
                      >
                        <Check aria-hidden className="size-4" />
                        Approve
                      </ActionButton>
                      <ActionButton
                        action={() => rejectExpense(e.id)}
                        variant="danger"
                        successMessage={`Rejected “${e.item}”`}
                        confirm={{
                          title: "Reject expense?",
                          body: `“${e.item}” won't count toward the cost per meal.`,
                          confirmLabel: "Reject",
                        }}
                      >
                        <X aria-hidden className="size-4" />
                        Reject
                      </ActionButton>
                    </>
                  ) : (
                    <>
                      <Badge tone={s.tone}>{s.label}</Badge>
                      {e.status === "approved" &&
                        (e.reimbursed ? (
                          <Badge tone="primary">Reimbursed</Badge>
                        ) : (
                          <ActionButton
                            action={() => markReimbursed(e.id)}
                            successMessage="Marked reimbursed"
                          >
                            <BadgeCheck aria-hidden className="size-4" />
                            Mark reimbursed
                          </ActionButton>
                        ))}
                    </>
                  )}
                  <ExpenseAdminActions expense={e.admin} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
