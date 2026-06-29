"use client";

import { useActionState, useEffect, useRef } from "react";

import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createStaffAccount, type CreateState } from "./actions";

export function CreateAccountForm() {
  const [state, action, pending] = useActionState<CreateState, FormData>(
    createStaffAccount,
    undefined,
  );
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
      <Field
        label="Staff name"
        htmlFor="full_name"
        required
        helper="The login is created automatically — e.g. “Ram Bahadur” → username rambahadur, password rambahadur2026."
      >
        <Input
          id="full_name"
          name="full_name"
          autoComplete="off"
          required
          placeholder="e.g. Ram Bahadur"
        />
      </Field>

      <div aria-live="polite" className="min-h-5 text-sm">
        {state?.error && <span className="font-medium text-danger">{state.error}</span>}
      </div>

      <Button type="submit" loading={pending} className="sm:w-auto sm:self-start">
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
