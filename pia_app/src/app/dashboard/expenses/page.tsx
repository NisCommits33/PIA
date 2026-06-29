import { Receipt, Users } from "lucide-react";

import { requireOnboardedUser, isMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { currentBsMonth, formatBs, formatBsMonth, toAdInputValue } from "@/lib/bs-date";
import { formatNpr } from "@/lib/format";
import { getExpenseExtras } from "@/lib/expense-extras";
import type { ExpenseStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpenseRow, type ExpenseDetail } from "@/components/expense-detail";
import { ExpenseForm } from "./expense-form";

type ExpenseListRow = {
  id: string;
  item: string;
  amount: number;
  bs_year: number;
  bs_month: number;
  bs_day: number;
  status: ExpenseStatus;
  reimbursed: boolean;
};

type AllExpenseRow = ExpenseListRow & { created_by: string | null };

const STATUS: Record<ExpenseStatus, { label: string; tone: "accent" | "success" | "danger" }> = {
  pending: { label: "Pending review", tone: "accent" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

const STATUS_ORDER: Record<ExpenseStatus, number> = { pending: 0, approved: 1, rejected: 2 };

export default async function ExpensesPage() {
  const ctx = await requireOnboardedUser();
  const admin = isMessAdmin(ctx);
  const bsMonth = currentBsMonth();

  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("id, item, amount, bs_year, bs_month, bs_day, status, reimbursed")
    .eq("created_by", ctx.userId)
    .eq("is_deleted", false)
    .order("spent_on", { ascending: false })
    .limit(100);

  const expenses = (data as ExpenseListRow[] | null) ?? [];

  // Read-only visibility into everyone's expenses for staff (RLS limits the
  // normal client to their own rows, so read all via the service-role client).
  // Admins already have the full review screen under Manage mess.
  let allExpenses: AllExpenseRow[] = [];
  const names = new Map<string, string>();
  if (!admin) {
    const adminDb = createAdminClient();
    const [{ data: allData }, { data: profileData }] = await Promise.all([
      adminDb
        .from("expenses")
        .select("id, item, amount, bs_year, bs_month, bs_day, status, reimbursed, created_by")
        .eq("is_deleted", false)
        .eq("bs_year", bsMonth.year)
        .eq("bs_month", bsMonth.month)
        .order("spent_on", { ascending: false }),
      adminDb.from("profiles").select("id, full_name"),
    ]);
    allExpenses = ((allData as AllExpenseRow[] | null) ?? []).sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
    );
    for (const p of (profileData as { id: string; full_name: string | null }[] | null) ?? []) {
      if (p.full_name) names.set(p.id, p.full_name);
    }
  }

  // Description + signed bill-photo URL for every expense shown on this page.
  const extras = await getExpenseExtras([
    ...expenses.map((e) => e.id),
    ...allExpenses.map((e) => e.id),
  ]);

  const toDetail = (e: ExpenseListRow, submitterName?: string): ExpenseDetail => {
    const s = STATUS[e.status];
    const extra = extras.get(e.id);
    return {
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
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Expenses"
        description={
          admin
            ? "Record what you bought for the mess. Your entries are approved automatically."
            : "Submit what you bought for the mess. An admin reviews and reimburses approved items."
        }
      />

      <Card>
        <CardHeader title="New expense" />
        <CardBody>
          <ExpenseForm defaultDate={toAdInputValue(new Date())} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="My submissions"
          description={`${expenses.length} ${expenses.length === 1 ? "item" : "items"}`}
        />
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Submit your first mess purchase using the form above."
          />
        ) : (
          <ul className="divide-y divide-border">
            {expenses.map((e) => (
              <ExpenseRow key={e.id} expense={toDetail(e)} />
            ))}
          </ul>
        )}
      </Card>

      {!admin && (
        <Card>
          <CardHeader
            title="All mess expenses"
            description={`Everyone's purchases for ${formatBsMonth(bsMonth)} · view only`}
          />
          {allExpenses.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No expenses this month"
              description="Mess purchases logged by the team will appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {allExpenses.map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={toDetail(e, names.get(e.created_by ?? "") || "Unknown")}
                />
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
