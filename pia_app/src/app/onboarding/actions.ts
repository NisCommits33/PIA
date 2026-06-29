"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/roles";
import { DEPARTMENTS, SHIFTS, type Department, type ShiftType } from "@/lib/types";

export type OnboardingState = { error: string } | undefined;

const DEPT_VALUES = DEPARTMENTS.map((d) => d.value);
const SHIFT_VALUES = SHIFTS.map((s) => s.value);

export async function saveOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const ctx = await requireUser();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const department = String(formData.get("department") ?? "") as Department;
  const defaultShift = String(formData.get("default_shift") ?? "") as ShiftType;

  if (fullName.length < 2) return { error: "Please enter your full name." };
  if (!phone) return { error: "Please enter a phone number." };
  if (!DEPT_VALUES.includes(department)) return { error: "Choose a department." };
  if (!SHIFT_VALUES.includes(defaultShift)) return { error: "Choose your default shift." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      department,
      default_shift: defaultShift,
      onboarded: true,
    })
    .eq("id", ctx.userId);

  if (error) {
    return { error: "Could not save your details. Please try again." };
  }

  redirect("/dashboard");
}
