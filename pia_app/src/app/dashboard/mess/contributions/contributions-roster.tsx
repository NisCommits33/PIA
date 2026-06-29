"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";

import { DEPARTMENTS, type Department } from "@/lib/types";
import { Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { FilterToolbar } from "@/components/filter-toolbar";
import { recordContribution } from "./actions";

export type ContributionRow = {
  id: string;
  name: string;
  deptValue: Department | null;
  deptLabel: string;
  amount: number;
  paidOn: string;
  saved: boolean;
};

export function ContributionsRoster({
  rows,
  bsYear,
  bsMonth,
}: {
  rows: ContributionRow[];
  bsYear: number;
  bsMonth: number;
}) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<"all" | Department>("all");

  async function save(staffId: string, formData: FormData) {
    try {
      await recordContribution(staffId, formData);
      toast.success("Advance saved");
    } catch {
      toast.error("Couldn't save the advance.");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (dept !== "all" && r.deptValue !== dept) return false;
      return true;
    });
  }, [rows, search, dept]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No staff yet"
        description="Create staff accounts to record advances."
      />
    );
  }

  return (
    <>
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search staff by name…"
        count={filtered.length}
        total={rows.length}
        noun="person"
      >
        <Select
          aria-label="Filter by department"
          value={dept}
          onChange={(e) => setDept(e.target.value as "all" | Department)}
          className="h-11 w-auto"
        >
          <option value="all">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </FilterToolbar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No matching staff"
          description="Try a different search or filter."
        />
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((p) => (
            <li key={p.id} className="px-4 py-3">
              <form action={(fd) => save(p.id, fd)} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="bs_year" value={bsYear} />
                <input type="hidden" name="bs_month" value={bsMonth} />

                <div className="min-w-40 flex-1">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted">{p.deptLabel}</p>
                </div>

                <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                  Amount (NPR)
                  <Input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    required
                    defaultValue={p.amount}
                    className="h-9 w-32"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                  Paid on
                  <Input name="paid_on" type="date" defaultValue={p.paidOn} className="h-9 w-40" />
                </label>

                <SubmitButton pendingLabel="Saving…">{p.saved ? "Update" : "Save"}</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
