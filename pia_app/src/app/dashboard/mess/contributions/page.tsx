import { requireMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { currentBsMonth, formatBsMonth } from "@/lib/bs-date";
import type { Department } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { ContributionsRoster, type ContributionRow } from "./contributions-roster";

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
  const byStaff = new Map(((contribs as ContribRow[] | null) ?? []).map((c) => [c.staff_id, c]));
  const rows: ContributionRow[] = ((profiles as ProfileRow[] | null) ?? [])
    .filter((p) => !adminSet.has(p.id))
    .map((p) => {
      const existing = byStaff.get(p.id);
      return {
        id: p.id,
        name: p.full_name ?? "Unnamed",
        deptValue: p.department,
        deptLabel: deptLabel(p.department),
        amount: existing?.amount ?? DEFAULT_ADVANCE,
        paidOn: existing?.paid_on ?? "",
        saved: existing != null,
      };
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Advances"
        description={`Record each staff member's advance for ${formatBsMonth(bsMonth)} (default Rs ${DEFAULT_ADVANCE.toLocaleString()}).`}
      />

      <Card>
        <CardHeader
          title="Staff"
          description={`${rows.length} ${rows.length === 1 ? "person" : "people"}`}
        />
        <ContributionsRoster rows={rows} bsYear={bsMonth.year} bsMonth={bsMonth.month} />
      </Card>
    </div>
  );
}
