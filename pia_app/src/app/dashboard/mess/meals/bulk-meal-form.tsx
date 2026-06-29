"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { bulkLogMeals, adminRemoveMeal, type BulkState } from "./actions";

export type RosterStaff = {
  id: string;
  name: string;
  department: string | null;
  logged: boolean;
  mealId: string | null;
};

/** Admin-only remove button for an already-logged meal. Lives outside the bulk
 * form (no nested forms), calling the server action via a transition. */
function RemoveLoggedMeal({ mealId }: { mealId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => adminRemoveMeal(mealId))}
      disabled={pending}
      aria-label="Remove this logged meal"
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
    >
      <Trash2 aria-hidden className="size-3.5" />
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

export function BulkMealForm({
  date,
  shift,
  staff,
}: {
  date: string;
  shift: string;
  staff: RosterStaff[];
}) {
  const selectable = staff.filter((s) => !s.logged);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(selectable.map((s) => s.id)),
  );
  const [state, action, pending] = useActionState<BulkState, FormData>(bulkLogMeals, undefined);

  const allSelected = selectable.length > 0 && selected.size === selectable.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectable.map((s) => s.id)));
  }

  return (
    <form action={action} className="flex flex-col">
      <input type="hidden" name="meal_date" value={date} />
      <input type="hidden" name="shift" value={shift} />

      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            disabled={selectable.length === 0}
            className="size-4"
          />
          Select all eligible ({selectable.length})
        </label>
        <span className="text-xs text-muted">{selected.size} selected</span>
      </div>

      <ul className="divide-y divide-border">
        {staff.map((s) => (
          <li key={s.id}>
            <label
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3",
                s.logged ? "opacity-60" : "cursor-pointer hover:bg-surface-muted",
              )}
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="staff_ids"
                  value={s.id}
                  checked={selected.has(s.id)}
                  disabled={s.logged}
                  onChange={() => toggle(s.id)}
                  className="size-4"
                />
                <span className="text-sm font-medium text-foreground">{s.name}</span>
              </span>
              {s.logged ? (
                <span className="flex items-center gap-2">
                  <Badge tone="success">Logged</Badge>
                  {s.mealId && <RemoveLoggedMeal mealId={s.mealId} />}
                </span>
              ) : s.department ? (
                <Badge tone="neutral">{s.department}</Badge>
              ) : null}
            </label>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <div aria-live="polite" className="min-h-5 text-sm">
          {state?.error && <span className="font-medium text-danger">{state.error}</span>}
          {state?.ok && (
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 aria-hidden className="size-4" />
              {state.ok}
            </span>
          )}
        </div>
        <Button type="submit" loading={pending} disabled={selected.size === 0}>
          {pending ? "Logging…" : `Log ${selected.size} meal${selected.size === 1 ? "" : "s"}`}
        </Button>
      </div>
    </form>
  );
}
