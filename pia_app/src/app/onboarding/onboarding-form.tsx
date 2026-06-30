"use client";

import { useActionState } from "react";

import { DEPARTMENTS, SHIFTS, type Department, type ShiftType } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm({
  defaultName,
  defaultDepartment,
  defaultShift,
}: {
  defaultName?: string;
  defaultDepartment?: Department;
  defaultShift?: ShiftType;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    saveOnboarding,
    undefined,
  );

  // An admin may have already set the department + shift at account creation —
  // if so, carry them silently and don't make the staff member pick again.
  const preset = Boolean(defaultDepartment && defaultShift);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Full name" htmlFor="full_name" required>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaultName}
          autoComplete="name"
          required
        />
      </Field>

      <Field label="Phone" htmlFor="phone" required helper="Used by the mess team to reach you.">
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          placeholder="98XXXXXXXX"
        />
      </Field>

      {preset ? (
        <>
          <input type="hidden" name="department" value={defaultDepartment} />
          <input type="hidden" name="default_shift" value={defaultShift} />
          <p className="rounded-lg bg-surface-muted px-3 py-2.5 text-sm text-muted">
            Department & shift set by your admin:{" "}
            <span className="font-medium text-foreground">
              {DEPARTMENTS.find((d) => d.value === defaultDepartment)?.label} ·{" "}
              {SHIFTS.find((s) => s.value === defaultShift)?.label}
            </span>
          </p>
        </>
      ) : (
        <>
          <Field label="Department" htmlFor="department" required>
            <Select
              id="department"
              name="department"
              required
              defaultValue={defaultDepartment ?? ""}
            >
              <option value="" disabled>
                Select a department
              </option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground">
              Default shift <span className="text-danger">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {SHIFTS.map((s) => (
                <label
                  key={s.value}
                  className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-soft"
                >
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <input
                      type="radio"
                      name="default_shift"
                      value={s.value}
                      defaultChecked={s.value === defaultShift}
                      required
                    />
                    {s.label}
                  </span>
                  <span className="pl-6 text-xs text-muted">{s.mealLabel}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <div aria-live="polite">
        {state?.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
      </div>

      <Button type="submit" loading={pending} className="mt-1 w-full">
        {pending ? "Saving…" : "Continue to dashboard"}
      </Button>
    </form>
  );
}
