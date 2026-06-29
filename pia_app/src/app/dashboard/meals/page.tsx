import { redirect } from "next/navigation";
import { UtensilsCrossed, Sunrise, Sunset } from "lucide-react";

import { requireOnboardedUser, isMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { currentBsMonth, formatBsMonth, formatBs, toAdInputValue } from "@/lib/bs-date";
import { SHIFTS, type ShiftType } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MealForm } from "./meal-form";

type MealRow = {
  id: string;
  meal_date: string;
  shift: ShiftType;
  bs_year: number;
  bs_month: number;
  bs_day: number;
};

function shiftLabel(shift: ShiftType): string {
  return SHIFTS.find((s) => s.value === shift)?.label ?? shift;
}

export default async function MealsPage() {
  const ctx = await requireOnboardedUser();
  // Admin accounts don't log their own meals — they manage the mess instead.
  if (isMessAdmin(ctx)) redirect("/dashboard/mess");
  const bsMonth = currentBsMonth();

  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_logs")
    .select("id, meal_date, shift, bs_year, bs_month, bs_day")
    .eq("staff_id", ctx.userId)
    .eq("bs_year", bsMonth.year)
    .eq("bs_month", bsMonth.month)
    .order("meal_date", { ascending: false });

  const meals = (data as MealRow[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My meals"
        description={`Log the shift meals you ate in ${formatBsMonth(bsMonth)}. One entry per shift per day. Logged meals are final — ask a mess admin to fix any mistakes.`}
      />

      <Card>
        <CardBody>
          <MealForm
            defaultDate={toAdInputValue(new Date())}
            defaultShift={ctx.profile?.default_shift ?? null}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="This month"
          description={`${meals.length} ${meals.length === 1 ? "meal" : "meals"} logged`}
        />
        {meals.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No meals logged yet"
            description="Use the form above to record a shift meal."
          />
        ) : (
          <ul className="divide-y divide-border">
            {meals.map((m) => {
              const ShiftIcon = m.shift === "morning" ? Sunrise : Sunset;
              return (
                <li key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-surface-muted text-muted">
                      <ShiftIcon aria-hidden className="size-5" />
                    </span>
                    <div>
                      <p className="nums text-sm font-medium text-foreground">
                        {formatBs({ year: m.bs_year, month: m.bs_month, day: m.bs_day })}
                      </p>
                      <Badge tone={m.shift === "morning" ? "accent" : "primary"}>
                        {shiftLabel(m.shift)} shift
                      </Badge>
                    </div>
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
