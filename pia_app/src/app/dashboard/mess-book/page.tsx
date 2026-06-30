import Link from "next/link";
import { Coins, Receipt, UtensilsCrossed, Scale, ChevronLeft, ChevronRight } from "lucide-react";

import { requireOnboardedUser } from "@/lib/roles";
import {
  currentBsMonth,
  formatBsMonth,
  formatBs,
  stepBsMonth,
  adToBs,
  type BsMonth,
} from "@/lib/bs-date";
import { formatNpr } from "@/lib/format";
import { getMonthData } from "@/lib/mess-data";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SettlementTable } from "@/components/settlement-table";
import { MessLedgerList, type LedgerEntry } from "./mess-ledger-list";

function monthIndex({ year, month }: BsMonth): number {
  return year * 12 + (month - 1);
}

function monthHref({ year, month }: BsMonth): string {
  return `/dashboard/mess-book?y=${year}&m=${month}`;
}

export default async function MessBookPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  await requireOnboardedUser();
  const sp = await searchParams;

  const now = currentBsMonth();
  const y = Number(sp.y);
  const m = Number(sp.m);
  const valid = Number.isInteger(y) && Number.isInteger(m) && m >= 1 && m <= 12;
  const bsMonth: BsMonth = valid ? { year: y, month: m } : now;

  const prev = stepBsMonth(bsMonth, -1);
  const next = stepBsMonth(bsMonth, 1);
  const atCurrent = monthIndex(bsMonth) >= monthIndex(now);

  const {
    summary,
    settlement,
    ledger: ledgerRows,
  } = await getMonthData(bsMonth.year, bsMonth.month);

  const ledger: LedgerEntry[] = ledgerRows.map((e) => ({
    id: e.id,
    item: e.item,
    description: e.description,
    amountLabel: formatNpr(e.amount),
    dateLabel: formatBs({ year: e.bs_year, month: e.bs_month, day: e.bs_day }),
    status: e.status,
    reimbursed: e.reimbursed,
    submittedBy: e.submitted_by || "Unknown",
    approvedBy: e.approved_by,
    approvedOn: e.reviewed_at ? formatBs(adToBs(new Date(e.reviewed_at))) : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mess book"
        description="Every mess expense, bill, and balance — open for all staff to see."
      />

      {/* Month navigator */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-2 shadow-sm">
        <Link
          href={monthHref(prev)}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          <ChevronLeft aria-hidden className="size-4" />
          <span className="hidden sm:inline">{formatBsMonth(prev)}</span>
          <span className="sm:hidden">Prev</span>
        </Link>
        <span className="text-sm font-semibold text-foreground">{formatBsMonth(bsMonth)}</span>
        {atCurrent ? (
          <span className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted/50">
            <span className="hidden sm:inline">{formatBsMonth(next)}</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight aria-hidden className="size-4" />
          </span>
        ) : (
          <Link
            href={monthHref(next)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            <span className="hidden sm:inline">{formatBsMonth(next)}</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>

      <section aria-label="Mess summary" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Cost per meal"
          value={formatNpr(summary?.cost_per_meal)}
          hint="Approved expenses ÷ meals"
          icon={Coins}
          tone="primary"
          emphasis
        />
        <StatCard
          title="Approved spend"
          value={formatNpr(summary?.total_expenses ?? 0)}
          hint={formatBsMonth(bsMonth)}
          icon={Receipt}
        />
        <StatCard
          title="Total meals"
          value={String(summary?.total_meals ?? 0)}
          hint="All staff this month"
          icon={UtensilsCrossed}
        />
      </section>

      <Card>
        <CardHeader
          title="Bills & balances"
          description={`${settlement.length} ${settlement.length === 1 ? "person" : "people"}`}
        />
        {settlement.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Nothing settled yet"
            description="Once staff log meals and advances are recorded, bills appear here."
          />
        ) : (
          <SettlementTable rows={settlement} />
        )}
      </Card>

      <Card>
        <CardHeader title="Expense ledger" description="Where the mess money went" />
        <MessLedgerList rows={ledger} />
      </Card>
    </div>
  );
}
