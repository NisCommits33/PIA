"use client";

import { useMemo, useState } from "react";
import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterToolbar } from "@/components/filter-toolbar";

export type ActivityRow = {
  id: string;
  actorName: string;
  summary: string;
  entityType: string | null;
  createdAt: string;
};

const ENTITY_LABEL: Record<string, string> = {
  expense: "Expense",
  meal: "Meal",
  contribution: "Advance",
  account: "Account",
};

/** Compact relative time, e.g. "just now", "5m ago", "3h ago", "2d ago". */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ActivityFeed({ rows }: { rows: ActivityRow[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.summary.toLowerCase().includes(q) && !r.actorName.toLowerCase().includes(q)) {
        return false;
      }
      if (type !== "all" && r.entityType !== type) return false;
      return true;
    });
  }, [rows, search, type]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Mess admin actions — approvals, meals, advances, accounts — will show up here."
      />
    );
  }

  return (
    <>
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search activity or admin…"
        count={filtered.length}
        total={rows.length}
        noun="entry"
      >
        <Select
          aria-label="Filter by type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-11 w-auto"
        >
          <option value="all">All types</option>
          <option value="expense">Expenses</option>
          <option value="meal">Meals</option>
          <option value="contribution">Advances</option>
          <option value="account">Accounts</option>
        </Select>
      </FilterToolbar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="No matching activity"
          description="Try a different search or filter."
        />
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-foreground">{r.summary}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="font-medium text-foreground">{r.actorName}</span>
                  <Badge tone="accent">Mess admin</Badge>
                  {r.entityType && ENTITY_LABEL[r.entityType] && (
                    <Badge tone="neutral">{ENTITY_LABEL[r.entityType]}</Badge>
                  )}
                </p>
              </div>
              <time
                dateTime={r.createdAt}
                title={new Date(r.createdAt).toLocaleString()}
                className="shrink-0 text-xs text-muted"
              >
                {timeAgo(r.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
