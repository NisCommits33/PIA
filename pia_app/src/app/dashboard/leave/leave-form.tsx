"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";

import { LEAVE_TYPES } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createLeave, type LeaveState } from "./actions";

export function LeaveForm({ defaultDate }: { defaultDate: string }) {
  const [state, action, pending] = useActionState<LeaveState, FormData>(createLeave, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <Field label="Leave type" htmlFor="leave_type" required>
        <Select id="leave_type" name="leave_type" required defaultValue="">
          <option value="" disabled>
            Select a type
          </option>
          {LEAVE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" htmlFor="start_date" required>
          <Input id="start_date" name="start_date" type="date" defaultValue={defaultDate} required />
        </Field>
        <Field label="End date" htmlFor="end_date" required>
          <Input id="end_date" name="end_date" type="date" defaultValue={defaultDate} required />
        </Field>
      </div>

      <Field label="Reason" htmlFor="reason" helper="Optional.">
        <Input id="reason" name="reason" placeholder="e.g. Family function" />
      </Field>

      <div aria-live="polite" className="min-h-5 text-sm">
        {state?.error && <span className="font-medium text-danger">{state.error}</span>}
        {state?.ok && (
          <span className="inline-flex items-center gap-1.5 font-medium text-success">
            <CheckCircle2 aria-hidden className="size-4" />
            {state.ok}
          </span>
        )}
      </div>

      <Button type="submit" loading={pending} className="sm:w-auto sm:self-start">
        {pending ? "Saving…" : "Add leave"}
      </Button>
    </form>
  );
}
