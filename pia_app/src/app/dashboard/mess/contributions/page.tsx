import { Users } from "lucide-react";

import { requireMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { currentBsMonth, formatBsMonth } from "@/lib/bs-date";
import type { Department } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { recordContribution } from "./actions";

type ProfileRow = { id: string; full_name: string | null; department: Department | null };
type ContribRow = { staff_id: string; amount: number; paid_on: string | null };

const DEFAULT_ADVANCE = 3000;

function deptLabel(value: Department | null): string {
  return DEPARTMENTS.find((d) => d.value === value)?.label ?? "—";
}

export default async function ContributionsPage() {
  await requireMessAdmin();
  const bsMonth = currentBsMonth();

  const supabase = await createClient();
  const [{ data: profiles }, { data: adminRows }, { data: contribs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, department")
      .eq("is_active", true)
      .eq("onboarded", true)
      .order("full_name"),
    supabase.from("user_roles").select("user_id").in("role", ["mess_admin", "super_admin"]),
    supabase
      .from("contributions")
      .select("staff_id, amount, paid_on")
      .eq("bs_year", bsMonth.year)
      .eq("bs_month", bsMonth.month),
  ]);

  const adminSet = new Set((adminRows ?? []).map((r) => r.user_id as string));
  const byStaff = new Map(
    ((contribs as ContribRow[] | null) ?? []).map((c) => [c.staff_id, c]),
  );
  const eaters = ((profiles as ProfileRow[] | null) ?? []).filter((p) => !adminSet.has(p.id));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Advances"
        description={`Record each staff member's advance for ${formatBsMonth(bsMonth)} (default Rs ${DEFAULT_ADVANCE.toLocaleString()}).`}
      />

      <Card>
        <CardHeader title="Staff" description={`${eaters.length} ${eaters.length === 1 ? "person" : "people"}`} />
        {eaters.length === 0 ? (
          <EmptyState icon={Users} title="No staff yet" description="Create staff accounts to record advances." />
        ) : (
          <ul className="divide-y divide-border">
            {eaters.map((p) => {
              const existing = byStaff.get(p.id);
              return (
                <li key={p.id} className="px-4 py-3">
                  <form
                    action={recordContribution.bind(null, p.id)}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <input type="hidden" name="bs_year" value={bsMonth.year} />
                    <input type="hidden" name="bs_month" value={bsMonth.month} />

                    <div className="min-w-40 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {p.full_name ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-muted">{deptLabel(p.department)}</p>
                    </div>

                    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                      Amount (NPR)
                      <Input
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        required
                        defaultValue={existing?.amount ?? DEFAULT_ADVANCE}
                        className="h-9 w-32"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                      Paid on
                      <Input
                        name="paid_on"
                        type="date"
                        defaultValue={existing?.paid_on ?? ""}
                        className="h-9 w-40"
                      />
                    </label>

                    <Button type="submit" variant="secondary" size="sm">
                      {existing ? "Update" : "Save"}
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
