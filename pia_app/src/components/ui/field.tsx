import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/cn";

const controlClass =
  "w-full rounded-lg border border-border bg-surface px-3 text-foreground placeholder:text-muted/70 " +
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 h-11";

/** Label + helper text + error wrapper for a single form control. */
export function Field({
  label,
  htmlFor,
  required,
  helper,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-danger">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-danger">{error}</p>
      ) : helper ? (
        <p className="text-xs text-muted">{helper}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(controlClass, "min-h-20 resize-y py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}
