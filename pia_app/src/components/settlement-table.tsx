import { formatNpr } from "@/lib/format";
import { cn } from "@/lib/cn";

export type SettlementRow = {
  staff_id: string;
  full_name: string | null;
  meal_count: number;
  cost_per_meal: number | null;
  bill: number | null;
  advance: number;
  balance: number | null;
};

function BalanceCell({ balance }: { balance: number | null }) {
  if (balance === null) return <span className="text-muted">—</span>;
  const refund = balance >= 0;
  return (
    <span className={cn("font-semibold", refund ? "text-success" : "text-danger")}>
      {formatNpr(Math.abs(balance))} {refund ? "refund" : "due"}
    </span>
  );
}

/** Per-person bills & balances table with a totals row. Shared by the admin
 * settlement page and the read-only Mess book. */
export function SettlementTable({ rows }: { rows: SettlementRow[] }) {
  const totals = rows.reduce(
    (acc, r) => ({
      meals: acc.meals + r.meal_count,
      bill: acc.bill + (r.bill ?? 0),
      advance: acc.advance + r.advance,
      balance: acc.balance + (r.balance ?? 0),
    }),
    { meals: 0, bill: 0, advance: 0, balance: 0 },
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-150 text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-2 font-medium">Staff</th>
            <th className="px-4 py-2 text-right font-medium">Meals</th>
            <th className="px-4 py-2 text-right font-medium">Bill</th>
            <th className="px-4 py-2 text-right font-medium">Advance</th>
            <th className="px-4 py-2 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.staff_id}>
              <td className="px-4 py-2.5 font-medium text-foreground">
                {r.full_name ?? "Unnamed"}
              </td>
              <td className="nums px-4 py-2.5 text-right">{r.meal_count}</td>
              <td className="nums px-4 py-2.5 text-right">{formatNpr(r.bill)}</td>
              <td className="nums px-4 py-2.5 text-right">{formatNpr(r.advance)}</td>
              <td className="nums px-4 py-2.5 text-right">
                <BalanceCell balance={r.balance} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-muted font-semibold">
            <td className="px-4 py-2.5 text-foreground">Total</td>
            <td className="nums px-4 py-2.5 text-right">{totals.meals}</td>
            <td className="nums px-4 py-2.5 text-right">{formatNpr(totals.bill)}</td>
            <td className="nums px-4 py-2.5 text-right">{formatNpr(totals.advance)}</td>
            <td className="nums px-4 py-2.5 text-right">
              <BalanceCell balance={totals.balance} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
