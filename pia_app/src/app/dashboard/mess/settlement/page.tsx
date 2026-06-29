import { Scale } from "lucide-react";

import { requireMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { currentBsMonth, formatBsMonth } from "@/lib/bs-date";
import { formatNpr } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SettlementTable, type SettlementRow } from "@/components/settlement-table";

export default async function SettlementPage() {
  await requireMessAdmin();
  const bsMonth = currentBsMonth();

  const supabase = await createClient();
  const { data } = await supabase.rpc("staff_settlement", {
    p_bs_year: bsMonth.year,
    p_bs_month: bsMonth.month,
  });
  const rows = (data as SettlementRow[] | null) ?? [];
  const costPerMeal = rows[0]?.cost_per_meal ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Monthly settlement"
        description={`Per-person bill for ${formatBsMonth(bsMonth)}. Bill = meals × cost per meal (${formatNpr(costPerMeal)}).`}
      />

      <Card>
        <CardHeader
          title="Bills & balances"
          description={`${rows.length} ${rows.length === 1 ? "person" : "people"}`}
        />
        {rows.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Nothing to settle yet"
            description="Once staff log meals and advances are recorded, bills appear here."
          />
        ) : (
          <SettlementTable rows={rows} />
        )}
      </Card>
    </div>
  );
}
