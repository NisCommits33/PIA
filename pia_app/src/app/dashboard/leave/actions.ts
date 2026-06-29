"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { requireOnboardedUser } from "@/lib/roles";
import { adStringToBs } from "@/lib/bs-date";
import { LEAVE_TYPES, type LeaveType } from "@/lib/types";

export type LeaveState = { error?: string; ok?: string } | undefined;

const TYPE_VALUES = LEAVE_TYPES.map((t) => t.value);

/** Create a leave record for the current user (informational only). */
export async function createLeave(_prev: LeaveState, formData: FormData): Promise<LeaveState> {
  const ctx = await requireOnboardedUser();

  const leaveType = String(formData.get("leave_type") ?? "") as LeaveType;
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!TYPE_VALUES.includes(leaveType)) return { error: "Choose a leave type." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { error: "Pick a start date." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return { error: "Pick an end date." };
  if (endDate < startDate) return { error: "End date can't be before the start date." };

  const startBs = adStringToBs(startDate);
  const endBs = adStringToBs(endDate);

  const supabase = await createClient();
  const { error } = await supabase.from("leave_records").insert({
    staff_id: ctx.userId,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    start_bs_year: startBs.year,
    start_bs_month: startBs.month,
    start_bs_day: startBs.day,
    end_bs_year: endBs.year,
    end_bs_month: endBs.month,
    end_bs_day: endBs.day,
    reason,
    created_by: ctx.userId,
  });

  if (error) return { error: "Could not save the leave record. Please try again." };

  revalidatePath("/dashboard/leave");
  return { ok: "Leave recorded." };
}

async function setStatus(id: string, status: "active" | "cancelled") {
  const ctx = await requireOnboardedUser();
  const supabase = await createClient();
  await supabase
    .from("leave_records")
    .update({ status })
    .eq("id", id)
    .eq("staff_id", ctx.userId);
  revalidatePath("/dashboard/leave");
}

export async function cancelLeave(id: string): Promise<void> {
  await setStatus(id, "cancelled");
}

export async function reactivateLeave(id: string): Promise<void> {
  await setStatus(id, "active");
}

export async function deleteLeave(id: string): Promise<void> {
  const ctx = await requireOnboardedUser();
  const supabase = await createClient();
  await supabase.from("leave_records").delete().eq("id", id).eq("staff_id", ctx.userId);
  revalidatePath("/dashboard/leave");
}
