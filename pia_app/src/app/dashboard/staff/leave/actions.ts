"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { requireSuperAdmin } from "@/lib/roles";

// super_admin may correct ANY staff member's leave (RLS leave_super_admin_all).
async function adminSetStatus(id: string, status: "active" | "cancelled") {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("leave_records").update({ status }).eq("id", id);
  revalidatePath("/dashboard/staff/leave");
}

export async function adminCancelLeave(id: string): Promise<void> {
  await adminSetStatus(id, "cancelled");
}

export async function adminReactivateLeave(id: string): Promise<void> {
  await adminSetStatus(id, "active");
}

export async function adminDeleteLeave(id: string): Promise<void> {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("leave_records").delete().eq("id", id);
  revalidatePath("/dashboard/staff/leave");
}
