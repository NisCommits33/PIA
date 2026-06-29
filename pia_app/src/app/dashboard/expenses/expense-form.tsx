"use client";

import { useActionState, useEffect, useRef } from "react";

import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { submitExpense, type ExpenseState } from "./actions";

export function ExpenseForm({ defaultDate }: { defaultDate: string }) {
  const [state, action, pending] = useActionState<ExpenseState, FormData>(submitExpense, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.ok);
      formRef.current?.reset();
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <Field label="Item" htmlFor="item" required helper="What was purchased for the mess.">
        <Input id="item" name="item" required placeholder="e.g. Vegetables, gas cylinder" />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        helper="Optional — extra detail, e.g. shop name or what it was for."
      >
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="e.g. Weekly vegetables from Mahendrapul market"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (NPR)" htmlFor="amount" required>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            required
            placeholder="0.00"
          />
        </Field>

        <Field label="Date bought" htmlFor="spent_on" required>
          <Input id="spent_on" name="spent_on" type="date" defaultValue={defaultDate} required />
        </Field>
      </div>

      <Field
        label="Bill / receipt photo"
        htmlFor="receipt"
        helper="Optional — attach a photo of the bill (JPG or PNG, up to 5 MB)."
      >
        <Input
          id="receipt"
          name="receipt"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="h-auto cursor-pointer py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary"
        />
      </Field>

      <div aria-live="polite" className="min-h-5 text-sm">
        {state?.error && <span className="font-medium text-danger">{state.error}</span>}
      </div>

      <Button type="submit" loading={pending} className="sm:w-auto sm:self-start">
        {pending ? "Submitting…" : "Submit expense"}
      </Button>
    </form>
  );
}
