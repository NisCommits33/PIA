"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { bulkLogMeals, adminRemoveMeal, type BulkState } from "./actions";

export type RosterStaff = {
  id: string;
  name: string;
  department: string | null;
  logged: boolean;
  mealId: string | null;
};

/** Admin-only remove button for an already-logged meal. Confirms first, then
 * calls the server action via a transition and toasts the result. */
function RemoveLoggedMeal({ mealId, name }: { mealId: string; name: string }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  function run() {
    start(async () => {
      try {
        await adminRemoveMeal(mealId);
        toast.success("Meal removed");
        setOpen(false);
      } catch {
        toast.error("Couldn't remove the meal.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Remove this logged meal"
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger-soft"
      >
        <Trash2 aria-hidden className="size-3.5" />
        Remove
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Remove logged meal?">
        <p className="text-sm text-muted">
          {name}&rsquo;s meal for this shift will be removed and stop counting toward the cost per
          meal. It can be logged again later.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={pending} onClick={run}>
            Remove
          </Button>
        </div>
      </Modal>
    </>
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
  const toast = useToast();
  const selectable = staff.filter((s) => !s.logged);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(selectable.map((s) => s.id)));
  const [state, action, pending] = useActionState<BulkState, FormData>(bulkLogMeals, undefined);

  useEffect(() => {
    if (state?.ok) toast.success(state.ok);
  }, [state, toast]);

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
                  {s.mealId && <RemoveLoggedMeal mealId={s.mealId} name={s.name} />}
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
        </div>
        <Button type="submit" loading={pending} disabled={selected.size === 0}>
          {pending ? "Logging…" : `Log ${selected.size} meal${selected.size === 1 ? "" : "s"}`}
        </Button>
      </div>
    </form>
  );
}
