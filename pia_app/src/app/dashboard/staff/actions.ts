"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireMessAdmin, requireSuperAdmin } from "@/lib/roles";

export type CreateState = { error?: string; ok?: string } | undefined;

function revalidateStaff() {
  revalidatePath("/dashboard/staff");
}

/**
 * Create a new staff account (mess_admin or super_admin). The admin enters only
 * the staff member's name; the login is derived from it:
 *   "Ram Bahadur" → rambahadur@pia.local / password rambahadur2026
 */
export async function createStaffAccount(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  await requireMessAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  // Username = the name lowercased with everything but letters/numbers stripped.
  const username = fullName.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (fullName.length < 2) return { error: "Enter the staff member's name." };
  if (username.length < 3) return { error: "Name needs at least 3 letters or numbers." };

  const password = `${username}2026`;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: `${username}@pia.local`,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? "");
    return {
      error: taken
        ? `An account for “${fullName}” already exists (username ${username}).`
        : "Could not create the account.",
    };
  }

  // The new-user trigger created the profile + staff role; set the name.
  await admin.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);

  revalidateStaff();
  return { ok: `Account created — username ${username}, password ${password}.` };
}

/** Grant or revoke a role (super_admin only). */
export async function setRole(
  userId: string,
  role: "mess_admin" | "super_admin",
  grant: boolean,
): Promise<void> {
  const ctx = await requireSuperAdmin();
  // A super_admin cannot revoke their own super_admin access.
  if (userId === ctx.userId && role === "super_admin" && !grant) return;

  const supabase = await createClient();
  if (grant) {
    await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role, granted_by: ctx.userId }, { onConflict: "user_id,role" });
  } else {
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
  }
  revalidateStaff();
}

/** Activate or deactivate a staff account (mess_admin or super_admin). */
export async function setActive(userId: string, active: boolean): Promise<void> {
  const ctx = await requireMessAdmin();
  // Don't let an admin lock themselves out.
  if (userId === ctx.userId && !active) return;

  // Service-role write: RLS reserves direct profile writes for super_admin, so
  // mess_admin toggles go through the admin client (authorization is the guard above).
  const admin = createAdminClient();

  // A mess_admin must not be able to toggle a super_admin's account — only
  // super_admin can manage super_admin accounts.
  if (!ctx.roles.includes("super_admin")) {
    const { data: targetRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin");
    if (targetRoles && targetRoles.length > 0) return;
  }

  await admin.from("profiles").update({ is_active: active }).eq("id", userId);
  revalidateStaff();
}
