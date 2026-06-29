import { Coins, Clock } from "lucide-react";

import { requireMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { currentBsMonth, formatBsMonth, formatBs } from "@/lib/bs-date";
import { formatNpr } from "@/lib/format";
import { getExpenseExtras } from "@/lib/expense-extras";
import type { ExpenseStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { type ExpenseDetail } from "@/components/expense-detail";
import { ExpenseReviewList, type ExpenseReviewRow } from "./expense-review-list";

type ExpenseRow = {
  id: string;
  item: string;
  amount: number;
  spent_on: string;
  bs_year: number;
  bs_month: number;
  bs_day: number;
  status: ExpenseStatus;
  reimbursed: boolean;
  created_by: string | null;
};

const STATUS: Record<ExpenseStatus, { label: string; tone: "accent" | "success" | "danger" }> = {
  pending: { label: "Pending", tone: "accent" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

const STATUS_ORDER: Record<ExpenseStatus, number> = { pending: 0, approved: 1, rejected: 2 };

export default async function ReviewExpensesPage() {
  await requireMessAdmin();
  const bsMonth = currentBsMonth();

  const supabase = await createClient();
  const [{ data: expenseData }, { data: profileData }] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "id, item, amount, spent_on, bs_year, bs_month, bs_day, status, reimbursed, created_by",
      )
      .eq("is_deleted", false)
      .eq("bs_year", bsMonth.year)
      .eq("bs_month", bsMonth.month)
      .order("spent_on", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const names = new Map(
    ((profileData as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [
      p.id,
      p.full_name,
    ]),
  );

  const expenses = ((expenseData as ExpenseRow[] | null) ?? []).sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );

  const extras = await getExpenseExtras(expenses.map((e) => e.id));

  // Totals for the month: approved spend feeds the cost per meal; pending is
  // still awaiting a decision.
  const approvedTotal = expenses
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingTotal = expenses
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingCount = expenses.filter((e) => e.status === "pending").length;

  const rows: ExpenseReviewRow[] = expenses.map((e) => {
    const s = STATUS[e.status];
    const extra = extras.get(e.id);
    const submitterName = names.get(e.created_by ?? "") || "Unknown";
    const detail: ExpenseDetail = {
      item: e.item,
      amountLabel: formatNpr(e.amount),
      dateLabel: formatBs({ year: e.bs_year, month: e.bs_month, day: e.bs_day }),
      statusLabel: s.label,
      statusTone: s.tone,
      reimbursed: e.status === "approved" && e.reimbursed,
      submitterName,
      description: extra?.description ?? null,
      receiptUrl: extra?.receiptUrl ?? null,
    };
    return {
      id: e.id,
      item: e.item,
      submitterName,
      amountLabel: formatNpr(e.amount),
      status: e.status,
      reimbursed: e.reimbursed,
      detail,
      admin: {
        id: e.id,
        item: e.item,
        description: extra?.description ?? null,
        amount: Number(e.amount),
        spentOn: e.spent_on,
      },
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Review expenses"
        description={`Submissions for ${formatBsMonth(bsMonth)}. Approved items count toward the cost per meal.`}
      />

      <section aria-label="Expense totals" className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Approved total"
          value={formatNpr(approvedTotal)}
          hint={`Mess spend for ${formatBsMonth(bsMonth)}`}
          icon={Coins}
          tone="primary"
          emphasis
        />
        <StatCard
          title="Pending total"
          value={formatNpr(pendingTotal)}
          hint={`${pendingCount} awaiting review`}
          icon={Clock}
          tone={pendingCount ? "danger" : "default"}
        />
      </section>

      <Card>
        <CardHeader
          title="Submissions"
          description={`${expenses.length} ${expenses.length === 1 ? "item" : "items"} this month`}
        />
        <ExpenseReviewList rows={rows} />
      </Card>
    </div>
  );
}
