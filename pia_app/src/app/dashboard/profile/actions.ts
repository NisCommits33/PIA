"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { requireOnboardedUser, isMessAdmin } from "@/lib/roles";
import { DEPARTMENTS, SHIFTS, type Department, type ShiftType } from "@/lib/types";

export type ProfileState = { error?: string; ok?: string } | undefined;

const DEPT_VALUES = DEPARTMENTS.map((d) => d.value);
const SHIFT_VALUES = SHIFTS.map((s) => s.value);

/** Update the signed-in user's own profile. Does not touch role or onboarded. */
export async function saveProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const ctx = await requireOnboardedUser();
  const admin = isMessAdmin(ctx);

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) return { error: "Please enter your full name." };
  if (!phone) return { error: "Please enter a phone number." };

  // Admins are oversight roles with no meal shift — only name/phone apply to them.
  const update: Record<string, string> = { full_name: fullName, phone };
  if (!admin) {
    const department = String(formData.get("department") ?? "") as Department;
    const defaultShift = String(formData.get("default_shift") ?? "") as ShiftType;
    if (!DEPT_VALUES.includes(department)) return { error: "Choose a department." };
    if (!SHIFT_VALUES.includes(defaultShift)) return { error: "Choose your default shift." };
    update.department = department;
    update.default_shift = defaultShift;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(update).eq("id", ctx.userId);

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: "Profile updated." };
}
