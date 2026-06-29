"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";

import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createStaffAccount, type CreateState } from "./actions";

export function CreateAccountForm() {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createStaffAccount,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name" helper="Optional — they can set it at first login.">
          <Input id="full_name" name="full_name" autoComplete="off" />
        </Field>
        <Field label="Username" htmlFor="username" required helper="Used to sign in (e.g. ram.bdr).">
          <Input id="username" name="username" autoComplete="off" required placeholder="ram.bdr" />
        </Field>
      </div>

      <Field
        label="Temporary password"
        htmlFor="password"
        required
        helper="At least 6 characters. Share it with the staff member to change later."
      >
        <Input id="password" name="password" type="text" autoComplete="off" required minLength={6} />
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
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
