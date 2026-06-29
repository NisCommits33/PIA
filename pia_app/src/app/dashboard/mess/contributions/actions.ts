"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { requireMessAdmin } from "@/lib/roles";

/** Record (or update) a staff member's monthly advance. */
export async function recordContribution(staffId: string, formData: FormData): Promise<void> {
  const ctx = await requireMessAdmin();

  const amount = Number(formData.get("amount"));
  const paidOn = String(formData.get("paid_on") ?? "").trim() || null;
  const bsYear = Number(formData.get("bs_year"));
  const bsMonth = Number(formData.get("bs_month"));

  if (!Number.isFinite(amount) || amount < 0) return;
  if (!Number.isInteger(bsYear) || !Number.isInteger(bsMonth)) return;

  const supabase = await createClient();
  await supabase.from("contributions").upsert(
    {
      staff_id: staffId,
      bs_year: bsYear,
      bs_month: bsMonth,
      amount,
      paid_on: paidOn,
      recorded_by: ctx.userId,
    },
    { onConflict: "staff_id,bs_year,bs_month" },
  );

  revalidatePath("/dashboard/mess/contributions");
  revalidatePath("/dashboard/mess/settlement");
  revalidatePath("/dashboard");
}
