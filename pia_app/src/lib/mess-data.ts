import "server-only";

import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/utils/supabase/admin";
import { currentBsMonth } from "@/lib/bs-date";
import type { ExpenseStatus } from "@/lib/types";
import type { SettlementRow } from "@/components/settlement-table";

export type MonthSummary = {
  total_expenses: number;
  total_meals: number;
  cost_per_meal: number | null;
};

export type LedgerRow = {
  id: string;
  item: string;
  description: string | null;
  amount: number;
  bs_year: number;
  bs_month: number;
  bs_day: number;
  status: ExpenseStatus;
  reimbursed: boolean;
  submitted_by: string | null;
  approved_by: string | null;
  reviewed_at: string | null;
};

export type MonthData = {
  summary: MonthSummary | null;
  settlement: SettlementRow[];
  ledger: LedgerRow[];
};

/**
 * Fetch a month's mess figures (summary + settlement + ledger). Uses the
 * service-role client: the RPCs are SECURITY DEFINER and non-user-specific
 * (everyone sees the same transparency data), and a cache scope can't read
 * request cookies anyway.
 */
async function fetchMonth(year: number, month: number): Promise<MonthData> {
  const admin = createAdminClient();
  const [summaryRes, settleRes, ledgerRes] = await Promise.all([
    admin.rpc("month_summary", { p_bs_year: year, p_bs_month: month }),
    admin.rpc("staff_settlement", { p_bs_year: year, p_bs_month: month }),
    admin.rpc("mess_expense_ledger", { p_bs_year: year, p_bs_month: month }),
  ]);
  return {
    summary: (summaryRes.data as MonthSummary[] | null)?.[0] ?? null,
    settlement: (settleRes.data as SettlementRow[] | null) ?? [],
    ledger: (ledgerRes.data as LedgerRow[] | null) ?? [],
  };
}

// Past months are immutable in practice — cache them (30 min TTL self-heals the
// rare past-month edit). Keyed by (year, month) via the function arguments.
const fetchMonthCached = unstable_cache(fetchMonth, ["mess-month"], { revalidate: 1800 });

/** Mess figures for a BS month: cached for past months, live for the current one. */
export async function getMonthData(year: number, month: number): Promise<MonthData> {
  const now = currentBsMonth();
  const isPast = year * 12 + month < now.year * 12 + now.month;
  return isPast ? fetchMonthCached(year, month) : fetchMonth(year, month);
}
