"use client";

import { useActionState, useEffect, useRef } from "react";

import { SHIFTS, type ShiftType } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { logMeal, type MealState } from "./actions";

export function MealForm({
  defaultDate,
  defaultShift,
}: {
  defaultDate: string;
  defaultShift: ShiftType | null;
}) {
  const [state, action, pending] = useActionState<MealState, FormData>(logMeal, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  // Reset the form after a successful log so it's ready for the next entry.
  useEffect(() => {
    if (state?.ok) {
      toast.success(state.ok);
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Date" htmlFor="meal_date">
          <Input id="meal_date" name="meal_date" type="date" defaultValue={defaultDate} required />
        </Field>

        <Field label="Shift" htmlFor="shift">
          <Select id="shift" name="shift" defaultValue={defaultShift ?? ""} required>
            <option value="" disabled>
              Select a shift
            </option>
            {SHIFTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label} — {s.mealLabel}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" loading={pending} className="sm:w-auto">
          {pending ? "Logging…" : "Log meal"}
        </Button>
      </div>

      <div aria-live="polite" className="min-h-5 text-sm">
        {state?.error && <span className="font-medium text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
