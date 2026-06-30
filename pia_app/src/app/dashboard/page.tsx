import Link from "next/link";
import {
  Coins,
  UtensilsCrossed,
  Receipt,
  Wallet,
  ClipboardList,
  ClipboardCheck,
  CalendarDays,
  Users,
  ArrowRight,
} from "lucide-react";

import { requireOnboardedUser, isMessAdmin, isSuperAdmin, type SessionContext } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { currentBsMonth, formatBsMonth, formatBs, type BsMonth } from "@/lib/bs-date";
import { formatNpr } from "@/lib/format";
import type { ExpenseStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickActions, type QuickAction } from "./quick-actions";
import { OnLeaveToday } from "./on-leave-today";

type MonthSummary = {
  total_expenses: number;
  total_meals: number;
  cost_per_meal: number | null;
};

type MiniExpense = {
  id: string;
  item: string;
  amount: number;
  status: ExpenseStatus;
  bs_year: number;
  bs_month: number;
  bs_day: number;
  created_by?: string | null;
};

const STATUS_TONE: Record<ExpenseStatus, "accent" | "success" | "danger"> = {
  pending: "accent",
  approved: "success",
  rejected: "danger",
};

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default async function DashboardPage() {
  const ctx = await requireOnboardedUser();
  const bsMonth = currentBsMonth();
  return isMessAdmin(ctx) ? (
    <AdminDashboard ctx={ctx} bsMonth={bsMonth} />
  ) : (
    <StaffDashboard ctx={ctx} bsMonth={bsMonth} />
  );
}

/** A compact expense row used in the dashboard preview lists. */
function ExpenseLine({ e, by }: { e: MiniExpense; by?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{e.item}</p>
        <p className="text-xs text-muted">
          {by ? `${by} · ` : ""}
          {formatBs({ year: e.bs_year, month: e.bs_month, day: e.bs_day })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
        <span className="nums w-20 text-right text-sm font-semibold text-foreground">
          {formatNpr(e.amount)}
        </span>
      </div>
    </li>
  );
}

/** Management overview — admins don't eat or get billed on this account. */
async function AdminDashboard({ ctx, bsMonth }: { ctx: SessionContext; bsMonth: BsMonth }) {
  const supabase = await createClient();
  const [{ data: summaryRows }, pending, { data: profileData }] = await Promise.all([
    supabase.rpc("month_summary", { p_bs_year: bsMonth.year, p_bs_month: bsMonth.month }),
    supabase
      .from("expenses")
      .select("id, item, amount, status, bs_year, bs_month, bs_day, created_by", {
        count: "exact",
      })
      .eq("status", "pending")
      .eq("is_deleted", false)
      .order("spent_on", { ascending: false })
      .limit(5),
    supabase.from("profiles").select("id, full_name"),
  ]);
  const summary = (summaryRows as MonthSummary[] | null)?.[0];
  const pendingRows = (pending.data as MiniExpense[] | null) ?? [];
  const pendingCount = pending.count ?? pendingRows.length;
  const names = new Map(
    ((profileData as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [
      p.id,
      p.full_name,
    ]),
  );

  const actions: QuickAction[] = [
    {
      href: "/dashboard/mess/expenses",
      label: "Review expenses",
      hint: "Approve, reject, edit",
      icon: ClipboardCheck,
      badge: pendingCount,
    },
    {
      href: "/dashboard/mess/meals",
      label: "Log meals",
      hint: "Bulk-log shift meals",
      icon: UtensilsCrossed,
    },
    {
      href: "/dashboard/mess",
      label: "Manage mess",
      hint: "Bills, advances, settlement",
      icon: Wallet,
    },
    ...(isSuperAdmin(ctx)
      ? [{ href: "/dashboard/staff", label: "Manage staff", hint: "Accounts & roles", icon: Users }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mess overview"
        description={
          <>
            Live figures for{" "}
            <span className="font-medium text-foreground">{formatBsMonth(bsMonth)}</span>.
          </>
        }
      />

      <section aria-label="Mess summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          hint="This month"
          icon={Receipt}
        />
        <StatCard
          title="Total meals"
          value={String(summary?.total_meals ?? 0)}
          hint="All staff this month"
          icon={UtensilsCrossed}
        />
        <StatCard
          title="Pending expenses"
          value={String(pendingCount)}
          hint="Awaiting review"
          icon={ClipboardList}
          tone={pendingCount ? "danger" : "default"}
        />
      </section>

      <QuickActions actions={actions} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pending expenses" description="Newest first" />
          {pendingRows.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Nothing to review"
              description="Staff submissions awaiting approval show up here."
            />
          ) : (
            <>
              <ul className="divide-y divide-border">
                {pendingRows.map((e) => (
                  <ExpenseLine key={e.id} e={e} by={names.get(e.created_by ?? "") || "Unknown"} />
                ))}
              </ul>
              <Link
                href="/dashboard/mess/expenses"
                className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
              >
                Review all expenses
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </>
          )}
        </Card>

        <OnLeaveToday />
      </div>
    </div>
  );
}

/** Personal view — a staff member's own meals, bill, and balance. */
async function StaffDashboard({ ctx, bsMonth }: { ctx: SessionContext; bsMonth: BsMonth }) {
  const firstName = (ctx.profile?.full_name ?? "").split(" ")[0] || "there";
  const supabase = await createClient();
  // Personal numbers only — fetch the user's own meal count + advance directly
  // (both hit covering indexes) instead of running the full all-staff settlement.
  const [
    { data: summaryRows },
    { count: myMealCount },
    { data: contribRow },
    { data: recentExpenses },
  ] = await Promise.all([
    supabase.rpc("month_summary", { p_bs_year: bsMonth.year, p_bs_month: bsMonth.month }),
    supabase
      .from("meal_logs")
      .select("id", { count: "exact", head: true })
      .eq("staff_id", ctx.userId)
      .eq("bs_year", bsMonth.year)
      .eq("bs_month", bsMonth.month),
    supabase
      .from("contributions")
      .select("amount")
      .eq("staff_id", ctx.userId)
      .eq("bs_year", bsMonth.year)
      .eq("bs_month", bsMonth.month)
      .maybeSingle(),
    supabase
      .from("expenses")
      .select("id, item, amount, status, bs_year, bs_month, bs_day")
      .eq("created_by", ctx.userId)
      .eq("is_deleted", false)
      .order("spent_on", { ascending: false })
      .limit(5),
  ]);

  const summary = (summaryRows as MonthSummary[] | null)?.[0];
  const recent = (recentExpenses as MiniExpense[] | null) ?? [];

  const mealCount = myMealCount ?? 0;
  const advance = Number((contribRow as { amount: number } | null)?.amount ?? 0);
  const costPerMeal = summary?.cost_per_meal ?? null;
  const bill = costPerMeal === null ? null : Math.round(mealCount * costPerMeal * 100) / 100;
  const balance =
    costPerMeal === null ? null : Math.round((advance - mealCount * costPerMeal) * 100) / 100;
  const balanceTone = balance === null ? "default" : balance >= 0 ? "success" : "danger";
  const balanceHint =
    balance === null
      ? "Set once meals are logged"
      : balance >= 0
        ? "Refund at month close"
        : "Due at month close";

  const actions: QuickAction[] = [
    {
      href: "/dashboard/meals",
      label: "Log a meal",
      hint: "Record a shift meal",
      icon: UtensilsCrossed,
    },
    {
      href: "/dashboard/expenses",
      label: "Add expense",
      hint: "Submit a mess purchase",
      icon: Receipt,
    },
    { href: "/dashboard/leave", label: "Record leave", hint: "Note time off", icon: CalendarDays },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Hello, ${firstName}`}
        description={
          <>
            Mess figures for{" "}
            <span className="font-medium text-foreground">{formatBsMonth(bsMonth)}</span> — updated
            live as meals and expenses are logged.
          </>
        }
      />

      <section aria-label="Monthly summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Cost per meal"
          value={formatNpr(summary?.cost_per_meal)}
          hint={`${summary?.total_meals ?? 0} meals · ${formatNpr(summary?.total_expenses ?? 0)} approved`}
          icon={Coins}
          tone="primary"
          emphasis
        />
        <StatCard
          title="My meals this month"
          value={String(mealCount)}
          hint="Across both shifts"
          icon={UtensilsCrossed}
        />
        <StatCard
          title="My running bill"
          value={formatNpr(bill)}
          hint="Meals × cost per meal"
          icon={Receipt}
        />
        <StatCard
          title="Projected balance"
          value={formatNpr(balance)}
          hint={`Advance ${formatNpr(advance)} · ${balanceHint}`}
          icon={Wallet}
          tone={balanceTone}
        />
      </section>

      <QuickActions actions={actions} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="My recent expenses" description="Last 5 submissions" />
          {recent.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Submit a mess purchase from Add expense above."
            />
          ) : (
            <>
              <ul className="divide-y divide-border">
                {recent.map((e) => (
                  <ExpenseLine key={e.id} e={e} />
                ))}
              </ul>
              <Link
                href="/dashboard/expenses"
                className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
              >
                View all expenses
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </>
          )}
        </Card>

        <OnLeaveToday />
      </div>
    </div>
  );
}
