"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireMessAdmin, requireSuperAdmin } from "@/lib/roles";

export type CreateState = { error?: string; ok?: string } | undefined;

function revalidateStaff() {
  revalidatePath("/dashboard/staff");
}

/** Create a new staff account (mess_admin or super_admin). Login is username@pia.local. */
export async function createStaffAccount(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  await requireMessAdmin();

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!/^[a-z0-9._-]{3,}$/.test(username)) {
    return { error: "Username: 3+ chars, letters/numbers/._- only (no spaces or @)." };
  }
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: `${username}@pia.local`,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? "");
    return { error: taken ? "That username is already taken." : "Could not create the account." };
  }

  // The new-user trigger created the profile + staff role; set the name if given.
  if (fullName) {
    await admin.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);
  }

  revalidateStaff();
  return { ok: `Account “${username}” created.` };
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
