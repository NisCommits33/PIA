"use client";

import { useState, useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

type ActionResult = void | { error?: string };

type ConfirmConfig = {
  title: string;
  body: ReactNode;
  confirmLabel?: string;
};

/**
 * Button that runs a bound server action with consistent UX: a spinner +
 * disabled state while pending, an optional confirmation dialog for destructive
 * actions, and success/error toasts. Replaces the bare `<form action>` + plain
 * `<Button>` pattern used across the lists.
 */
export function ActionButton({
  action,
  successMessage,
  confirm,
  children,
  variant = "secondary",
  size = "sm",
  disabled,
  title,
  className,
  "aria-label": ariaLabel,
}: {
  action: () => Promise<ActionResult>;
  successMessage?: string;
  confirm?: ConfirmConfig;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  title?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run() {
    start(async () => {
      try {
        const res = await action();
        if (res && res.error) {
          toast.error(res.error);
        } else if (successMessage) {
          toast.success(successMessage);
        }
        setConfirmOpen(false);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        loading={pending}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        className={className}
        onClick={() => (confirm ? setConfirmOpen(true) : run())}
      >
        {children}
      </Button>

      {confirm && (
        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={confirm.title}>
          <div className="text-sm text-muted">{confirm.body}</div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={pending} onClick={run}>
              {confirm.confirmLabel ?? "Confirm"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
