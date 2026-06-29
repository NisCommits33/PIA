import Link from "next/link";
import { Coins, UtensilsCrossed, ClipboardList, ArrowRight } from "lucide-react";

import { requireMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { currentBsMonth, formatBsMonth } from "@/lib/bs-date";
import { formatNpr } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

type MonthSummary = {
  total_expenses: number;
  total_meals: number;
  cost_per_meal: number | null;
};

export default async function MessOverviewPage() {
  await requireMessAdmin();
  const bsMonth = currentBsMonth();

  const supabase = await createClient();
  const [{ data: summaryRows }, { count: pendingCount }] = await Promise.all([
    supabase.rpc("month_summary", { p_bs_year: bsMonth.year, p_bs_month: bsMonth.month }),
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("is_deleted", false),
  ]);

  const summary = (summaryRows as MonthSummary[] | null)?.[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage mess"
        description={`Mess administration for ${formatBsMonth(bsMonth)}.`}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Cost per meal"
          value={formatNpr(summary?.cost_per_meal)}
          hint="Approved expenses ÷ meals"
          icon={Coins}
          tone="primary"
          emphasis
        />
        <StatCard
          title="Total meals"
          value={String(summary?.total_meals ?? 0)}
          hint="All staff this month"
          icon={UtensilsCrossed}
        />
        <StatCard
          title="Pending expenses"
          value={String(pendingCount ?? 0)}
          hint="Awaiting your review"
          icon={ClipboardList}
          tone={pendingCount ? "danger" : "default"}
        />
      </section>

      <Link
        href="/dashboard/mess/expenses"
        className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-4 shadow-sm transition-colors hover:bg-surface-muted"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">Review expenses</p>
          <p className="text-xs text-muted">Approve, reject, and mark reimbursements.</p>
        </div>
        <ArrowRight aria-hidden className="size-5 text-muted" />
      </Link>
    </div>
  );
}
