import { Users, ShieldPlus, ShieldMinus, Power, PowerOff } from "lucide-react";

import { requireSuperAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { AppRole, Department } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateAccountForm } from "./create-account-form";
import { setRole, setActive } from "./actions";

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
  const ctx = await requireSuperAdmin();

  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: roleRows }, usersResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, department, is_active").order("full_name"),
    supabase.from("user_roles").select("user_id, role"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const rolesByUser = new Map<string, Set<AppRole>>();
  for (const r of (roleRows as { user_id: string; role: AppRole }[] | null) ?? []) {
    if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, new Set());
    rolesByUser.get(r.user_id)!.add(r.role);
  }
  const emailById = new Map(usersResult.data.users.map((u) => [u.id, u.email ?? ""]));

  const rows = (profiles as ProfileRow[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Staff management" description="Create accounts and assign roles." />

      <Card>
        <CardHeader title="New account" />
        <div className="p-4">
          <CreateAccountForm />
        </div>
      </Card>

      <Card>
        <CardHeader title="People" description={`${rows.length} ${rows.length === 1 ? "account" : "accounts"}`} />
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No accounts yet" description="Create the first staff account above." />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((p) => {
              const roles = rolesByUser.get(p.id) ?? new Set<AppRole>();
              const isMessAdmin = roles.has("mess_admin");
              const isSuperAdmin = roles.has("super_admin");
              const isSelf = p.id === ctx.userId;
              const username = (emailById.get(p.id) ?? "").split("@")[0];

              return (
                <li key={p.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {p.full_name || username || "Unnamed"}
                      </span>
                      {isSuperAdmin ? (
                        <Badge tone="primary">Super admin</Badge>
                      ) : isMessAdmin ? (
                        <Badge tone="accent">Mess admin</Badge>
                      ) : (
                        <Badge tone="neutral">Staff</Badge>
                      )}
                      {!p.is_active && <Badge tone="danger">Inactive</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {username} · {deptLabel(p.department)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setRole.bind(null, p.id, "mess_admin", !isMessAdmin)}>
                      <Button type="submit" variant="secondary" size="sm" disabled={isSuperAdmin}>
                        {isMessAdmin ? (
                          <>
                            <ShieldMinus aria-hidden className="size-4" /> Mess admin
                          </>
                        ) : (
                          <>
                            <ShieldPlus aria-hidden className="size-4" /> Mess admin
                          </>
                        )}
                      </Button>
                    </form>

                    <form action={setRole.bind(null, p.id, "super_admin", !isSuperAdmin)}>
                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={isSelf && isSuperAdmin}
                        title={isSelf && isSuperAdmin ? "You can't remove your own super admin" : undefined}
                      >
                        {isSuperAdmin ? (
                          <>
                            <ShieldMinus aria-hidden className="size-4" /> Super admin
                          </>
                        ) : (
                          <>
                            <ShieldPlus aria-hidden className="size-4" /> Super admin
                          </>
                        )}
                      </Button>
                    </form>

                    <form action={setActive.bind(null, p.id, !p.is_active)}>
                      <Button
                        type="submit"
                        variant={p.is_active ? "danger" : "secondary"}
                        size="sm"
                        disabled={isSelf}
                        title={isSelf ? "You can't deactivate yourself" : undefined}
                      >
                        {p.is_active ? (
                          <>
                            <PowerOff aria-hidden className="size-4" /> Deactivate
                          </>
                        ) : (
                          <>
                            <Power aria-hidden className="size-4" /> Activate
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
