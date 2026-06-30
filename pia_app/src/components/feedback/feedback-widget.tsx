"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";
import { submitFeedback } from "./actions";

/**
 * Floating "Send feedback" button (bottom-right, clears the mobile bottom nav).
 * Opens a small form to report a bug, request a feature, or leave a suggestion.
 */
export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  const toast = useToast();

  // Client form action — keeps SubmitButton's pending state via useFormStatus,
  // and lets us toast/close on success without a setState-in-effect.
  async function handle(formData: FormData) {
    setError(null);
    const res = await submitFeedback(undefined, formData);
    if (res?.error) {
      setError(res.error);
    } else if (res?.ok) {
      toast.success(res.ok);
      formRef.current?.reset();
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-20 right-4 z-30 flex size-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6 sm:right-6"
      >
        <MessageSquarePlus aria-hidden className="size-6" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Send feedback">
        <p className="mb-4 text-sm text-muted">
          Found a bug or have an idea? Let us know — it goes straight to the admin.
        </p>
        <form ref={formRef} action={handle} className="flex flex-col gap-4">
          <input type="hidden" name="page" value={pathname} />

          <Field label="Type" htmlFor="kind" required>
            <Select id="kind" name="kind" required defaultValue="bug">
              <option value="bug">Bug report</option>
              <option value="feature">Feature request</option>
              <option value="other">Other / suggestion</option>
            </Select>
          </Field>

          <Field
            label="Message"
            htmlFor="message"
            required
            helper="Describe what happened or what you'd like."
          >
            <Textarea
              id="message"
              name="message"
              rows={4}
              required
              maxLength={2000}
              placeholder="e.g. The meal date defaults to the wrong day…"
            />
          </Field>

          <div aria-live="polite" className="min-h-5 text-sm">
            {error && <span className="font-medium text-danger">{error}</span>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton variant="primary" size="md" pendingLabel="Sending…">
              Send feedback
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
