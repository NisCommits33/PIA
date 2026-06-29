"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * Submit button that auto-reflects the enclosing `<form action>`'s pending
 * state (spinner + disabled) via `useFormStatus`. Use inside forms that submit
 * field values, where a bare `action()` call isn't possible.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "secondary",
  size = "sm",
  className,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} loading={pending} className={className}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
