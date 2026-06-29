import { requireMessAdmin } from "@/lib/roles";
import { createAdminClient } from "@/utils/supabase/admin";
import type { AppRole, Department } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { CreateAccountForm } from "./create-account-form";
import { StaffRoster, type StaffRow } from "./staff-roster";

type ProfileRow = {
  id: string;
  full_name: string | null;
  department: Department | null;
  is_active: boolean;
};

function deptLabel(value: Department | null): string {
  return DEPARTMENTS.find((d) => d.value === value)?.label ?? "—";
}

export default async function StaffPage() {
  const ctx = await requireMessAdmin();
  const canManageRoles = ctx.roles.includes("super_admin");

  const admin = createAdminClient();

  // Service-role reads so the roster + role badges render for mess_admin too,
  // regardless of profiles/user_roles SELECT RLS.
  const [{ data: profiles }, { data: roleRows }, usersResult] = await Promise.all([
    admin.from("profiles").select("id, full_name, department, is_active").order("full_name"),
    admin.from("user_roles").select("user_id, role"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const rolesByUser = new Map<string, Set<AppRole>>();
  for (const r of (roleRows as { user_id: string; role: AppRole }[] | null) ?? []) {
    if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, new Set());
    rolesByUser.get(r.user_id)!.add(r.role);
  }
  const emailById = new Map(usersResult.data.users.map((u) => [u.id, u.email ?? ""]));

  const rows: StaffRow[] = ((profiles as ProfileRow[] | null) ?? []).map((p) => {
    const roles = rolesByUser.get(p.id) ?? new Set<AppRole>();
    return {
      id: p.id,
      name: p.full_name ?? "",
      username: (emailById.get(p.id) ?? "").split("@")[0],
      deptLabel: deptLabel(p.department),
      isActive: p.is_active,
      isMessAdmin: roles.has("mess_admin"),
      isSuperAdmin: roles.has("super_admin"),
      isSelf: p.id === ctx.userId,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff management"
        description={
          canManageRoles ? "Create accounts and assign roles." : "Create and manage staff accounts."
        }
      />

      <Card>
        <CardHeader title="New account" />
        <div className="p-4">
          <CreateAccountForm />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="People"
          description={`${rows.length} ${rows.length === 1 ? "account" : "accounts"}`}
        />
        <StaffRoster rows={rows} canManageRoles={canManageRoles} />
      </Card>
    </div>
  );
}
