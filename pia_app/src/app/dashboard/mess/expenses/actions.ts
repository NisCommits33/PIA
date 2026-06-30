"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { requireMessAdmin } from "@/lib/roles";
import { adStringToBs } from "@/lib/bs-date";
import { formatNpr } from "@/lib/format";
import { logActivity } from "@/lib/activity";

export type EditExpenseState = { error?: string; ok?: string } | undefined;

function revalidateMess() {
  revalidatePath("/dashboard/mess/expenses");
  revalidatePath("/dashboard/mess");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
}

async function setStatus(id: string, status: "approved" | "rejected") {
  const ctx = await requireMessAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .update({ status, reviewed_by: ctx.userId, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("item, amount")
    .maybeSingle();
  revalidateMess();
  if (data) {
    await logActivity({
      action: `expense.${status}`,
      summary: `${status === "approved" ? "Approved" : "Rejected"} expense “${data.item}” (${formatNpr(data.amount)})`,
      entityType: "expense",
      entityId: id,
    });
  }
}

export async function approveExpense(id: string): Promise<void> {
  await setStatus(id, "approved");
}

export async function rejectExpense(id: string): Promise<void> {
  await setStatus(id, "rejected");
}

/** Mark an approved expense as reimbursed to the staff member who paid. */
export async function markReimbursed(id: string): Promise<void> {
  const ctx = await requireMessAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .update({
      reimbursed: true,
      reimbursed_by: ctx.userId,
      reimbursed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "approved")
    .select("item, amount")
    .maybeSingle();
  revalidateMess();
  if (data) {
    await logActivity({
      action: "expense.reimbursed",
      summary: `Marked “${data.item}” (${formatNpr(data.amount)}) reimbursed`,
      entityType: "expense",
      entityId: id,
    });
  }
}

/** Edit an expense's core fields (mess admin only). */
export async function editExpense(
  id: string,
  _prev: EditExpenseState,
  formData: FormData,
): Promise<EditExpenseState> {
  await requireMessAdmin();

  const item = String(formData.get("item") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const spentOn = String(formData.get("spent_on") ?? "");
  const amount = Number(amountRaw);

  if (item.length < 2) return { error: "Describe what was bought." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than 0." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spentOn)) return { error: "Pick a valid date." };

  const bs = adStringToBs(spentOn);
  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      item,
      description: description || null,
      amount,
      spent_on: spentOn,
      bs_year: bs.year,
      bs_month: bs.month,
      bs_day: bs.day,
    })
    .eq("id", id);

  if (error) return { error: "Could not save the changes. Please try again." };

  revalidateMess();
  await logActivity({
    action: "expense.edited",
    summary: `Edited expense “${item}” (${formatNpr(amount)})`,
    entityType: "expense",
    entityId: id,
  });
  return { ok: "Expense updated." };
}

/** Remove an expense (mess admin only). Soft-delete so totals/history stay intact. */
export async function removeExpense(id: string): Promise<void> {
  await requireMessAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .update({ is_deleted: true })
    .eq("id", id)
    .select("item, amount")
    .maybeSingle();
  revalidateMess();
  if (data) {
    await logActivity({
      action: "expense.removed",
      summary: `Removed expense “${data.item}” (${formatNpr(data.amount)})`,
      entityType: "expense",
      entityId: id,
    });
  }
}
