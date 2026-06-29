"use client";

import { useActionState, useEffect } from "react";

import { DEPARTMENTS, SHIFTS, type Department, type ShiftType } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { saveProfile, type ProfileState } from "./actions";

export function ProfileForm({
  isAdmin,
  defaultName,
  defaultPhone,
  defaultDepartment,
  defaultShift,
}: {
  isAdmin: boolean;
  defaultName: string;
  defaultPhone: string;
  defaultDepartment: Department | "";
  defaultShift: ShiftType | "";
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, undefined);
  const toast = useToast();

  useEffect(() => {
    if (state?.ok) toast.success(state.ok);
  }, [state, toast]);

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
          defaultValue={defaultPhone}
          autoComplete="tel"
          inputMode="tel"
          required
          placeholder="98XXXXXXXX"
        />
      </Field>

      {!isAdmin && (
        <>
          <Field label="Department" htmlFor="department" required>
            <Select id="department" name="department" required defaultValue={defaultDepartment}>
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

      <div aria-live="polite" className="min-h-5 text-sm">
        {state?.error && <span className="font-medium text-danger">{state.error}</span>}
      </div>

      <Button type="submit" loading={pending} className="sm:w-auto sm:self-start">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
