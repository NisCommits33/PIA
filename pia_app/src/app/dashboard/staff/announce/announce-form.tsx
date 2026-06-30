"use client";

import { useActionState, useEffect, useRef } from "react";

import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { sendAnnouncement, type AnnounceState } from "./actions";

export function AnnounceForm() {
  const [state, action, pending] = useActionState<AnnounceState, FormData>(
    sendAnnouncement,
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
        label="Title"
        htmlFor="title"
        required
        helper="Short headline — shown as the notification title."
      >
        <Input id="title" name="title" required maxLength={80} placeholder="e.g. New: Mess book" />
      </Field>

      <Field label="Message" htmlFor="message" required>
        <Textarea
          id="message"
          name="message"
          rows={3}
          required
          maxLength={500}
          placeholder="Describe what's new or what staff need to know…"
        />
      </Field>

      <Field
        label="Link"
        htmlFor="link"
        helper="Optional — where it opens when tapped, e.g. /dashboard/mess-book"
      >
        <Input id="link" name="link" placeholder="/dashboard/mess-book" />
      </Field>

      <div aria-live="polite" className="min-h-5 text-sm">
        {state?.error && <span className="font-medium text-danger">{state.error}</span>}
      </div>

      <Button type="submit" loading={pending} className="sm:w-auto sm:self-start">
        {pending ? "Sending…" : "Send to everyone"}
      </Button>
    </form>
  );
}
