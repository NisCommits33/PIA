"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { requireMessAdmin } from "@/lib/roles";
import { adStringToBs } from "@/lib/bs-date";
import { SHIFTS, type ShiftType } from "@/lib/types";

export type BulkState = { error?: string; ok?: string } | undefined;

/**
 * Log a shift meal for the selected staff on a date. Skips anyone who already
 * has a meal for that (staff, date, shift) — both via the disabled checkboxes
 * in the UI and, defensively, via an ignore-duplicates upsert here. Admin
 * accounts are never logged (they don't eat).
 */
export async function bulkLogMeals(_prev: BulkState, formData: FormData): Promise<BulkState> {
  const ctx = await requireMessAdmin();

  const date = String(formData.get("meal_date") ?? "");
  const shift = String(formData.get("shift") ?? "") as ShiftType;
  const staffIds = formData.getAll("staff_ids").map(String).filter(Boolean);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Pick a valid date." };
  if (!SHIFTS.some((s) => s.value === shift)) return { error: "Pick a shift." };
  if (staffIds.length === 0) return { error: "Select at least one staff member." };

  const supabase = await createClient();

  // Keep only active staff who are NOT admin accounts.
  const [{ data: activeRows }, { data: adminRows }] = await Promise.all([
    supabase.from("profiles").select("id").eq("is_active", true).in("id", staffIds),
    supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["mess_admin", "super_admin"])
      .in("user_id", staffIds),
  ]);
  const adminSet = new Set((adminRows ?? []).map((r) => r.user_id as string));
  const validIds = (activeRows ?? []).map((r) => r.id as string).filter((id) => !adminSet.has(id));

  if (validIds.length === 0) return { error: "No eligible staff selected." };

  const bs = adStringToBs(date);
  const rows = validIds.map((id) => ({
    staff_id: id,
    meal_date: date,
    shift,
    bs_year: bs.year,
    bs_month: bs.month,
    bs_day: bs.day,
    logged_by: ctx.userId,
  }));

  const { error } = await supabase
    .from("meal_logs")
    .upsert(rows, { onConflict: "staff_id,meal_date,shift", ignoreDuplicates: true });

  if (error) return { error: "Could not log meals. Please try again." };

  revalidatePath("/dashboard/mess/meals");
  revalidatePath("/dashboard/mess");
  revalidatePath("/dashboard");
  return {
    ok: `Logged meals for ${rows.length} ${rows.length === 1 ? "staff member" : "staff"}.`,
  };
}

/** Remove a single logged meal (mess admin only) — staff can't delete their own. */
export async function adminRemoveMeal(id: string): Promise<void> {
  await requireMessAdmin();
  const supabase = await createClient();
  await supabase.from("meal_logs").delete().eq("id", id);
  revalidatePath("/dashboard/mess/meals");
  revalidatePath("/dashboard/mess");
  revalidatePath("/dashboard");
}
