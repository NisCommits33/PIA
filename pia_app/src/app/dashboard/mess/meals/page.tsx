import { Users } from "lucide-react";

import { requireMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { adStringToBs, formatBs, toAdInputValue } from "@/lib/bs-date";
import { DEPARTMENTS, SHIFTS, type Department, type ShiftType } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BulkMealForm, type RosterStaff } from "./bulk-meal-form";

type ProfileRow = { id: string; full_name: string | null; department: Department | null };

function deptLabel(value: Department | null): string {
  return DEPARTMENTS.find((d) => d.value === value)?.label ?? "";
}

export default async function BulkMealsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; shift?: string; dept?: string }>;
}) {
  await requireMessAdmin();
  const sp = await searchParams;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : toAdInputValue(new Date());
  const shift = (SHIFTS.some((s) => s.value === sp.shift) ? sp.shift : "morning") as ShiftType;
  const dept = (DEPARTMENTS.some((d) => d.value === sp.dept) ? sp.dept : "all") as
    | Department
    | "all";

  const supabase = await createClient();

  let profileQuery = supabase
    .from("profiles")
    .select("id, full_name, department")
    .eq("is_active", true)
    .eq("onboarded", true);
  if (dept !== "all") profileQuery = profileQuery.eq("department", dept);

  const [{ data: profiles }, { data: adminRows }, { data: logs }] = await Promise.all([
    profileQuery.order("full_name"),
    supabase.from("user_roles").select("user_id").in("role", ["mess_admin", "super_admin"]),
    supabase.from("meal_logs").select("id, staff_id").eq("meal_date", date).eq("shift", shift),
  ]);

  const adminSet = new Set((adminRows ?? []).map((r) => r.user_id as string));
  const mealIdByStaff = new Map(
    ((logs as { id: string; staff_id: string }[] | null) ?? []).map((l) => [l.staff_id, l.id]),
  );

  const staff: RosterStaff[] = ((profiles as ProfileRow[] | null) ?? [])
    .filter((p) => !adminSet.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.full_name ?? "Unnamed",
      department: deptLabel(p.department) || null,
      logged: mealIdByStaff.has(p.id),
      mealId: mealIdByStaff.get(p.id) ?? null,
    }));

  const bs = adStringToBs(date);
  const shiftMeal = SHIFTS.find((s) => s.value === shift);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bulk meal logging"
        description="Mark who ate a shift meal. Staff who already logged themselves are skipped."
      />

      <Card>
        <CardHeader title="Roster filter" />
        <form method="get" className="grid gap-4 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <Field label="Date" htmlFor="date">
            <Input id="date" name="date" type="date" defaultValue={date} />
          </Field>
          <Field label="Shift" htmlFor="shift">
            <Select id="shift" name="shift" defaultValue={shift}>
              {SHIFTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.mealLabel}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Department" htmlFor="dept">
            <Select id="dept" name="dept" defaultValue={dept}>
              <option value="all">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" variant="secondary">
            Update roster
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader
          title={`${shiftMeal?.label ?? shift} meal · ${formatBs(bs)}`}
          description={shiftMeal?.mealLabel}
        />
        {staff.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff to show"
            description="No active, onboarded staff match this department filter."
          />
        ) : (
          <BulkMealForm date={date} shift={shift} staff={staff} />
        )}
      </Card>
    </div>
  );
}
