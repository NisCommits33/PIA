"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { requireOnboardedUser, isMessAdmin } from "@/lib/roles";
import { adStringToBs } from "@/lib/bs-date";
import { SHIFTS, type ShiftType } from "@/lib/types";

export type MealState = { error?: string; ok?: string } | undefined;

const SHIFT_VALUES = SHIFTS.map((s) => s.value);

/** Log the current user's meal for a given AD date + shift (one per shift/day). */
export async function logMeal(_prev: MealState, formData: FormData): Promise<MealState> {
  const ctx = await requireOnboardedUser();
  // Admin accounts don't eat / self-log; they bulk-log for staff instead.
  if (isMessAdmin(ctx)) return { error: "Admin accounts don't log their own meals." };

  const mealDate = String(formData.get("meal_date") ?? "");
  const shift = String(formData.get("shift") ?? "") as ShiftType;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(mealDate)) return { error: "Pick a valid date." };
  if (!SHIFT_VALUES.includes(shift)) return { error: "Pick a shift." };

  const bs = adStringToBs(mealDate);
  const supabase = await createClient();
  const { error } = await supabase.from("meal_logs").insert({
    staff_id: ctx.userId,
    meal_date: mealDate,
    shift,
    bs_year: bs.year,
    bs_month: bs.month,
    bs_day: bs.day,
    logged_by: ctx.userId,
  });

  if (error) {
    // 23505 = unique violation (already logged for this staff/date/shift).
    if (error.code === "23505") return { error: "That meal is already logged." };
    return { error: "Could not log the meal. Please try again." };
  }

  revalidatePath("/dashboard/meals");
  revalidatePath("/dashboard");
  return { ok: "Meal logged." };
}

// Staff can no longer remove a logged meal — once logged it counts toward the
// mess bill and only a mess admin can correct it (see mess/meals actions).
