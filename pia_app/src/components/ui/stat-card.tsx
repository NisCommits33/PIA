import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

type Tone = "default" | "primary" | "success" | "danger";

const VALUE_TONES: Record<Tone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  danger: "text-danger",
};

/** Compact KPI tile for the dashboard. `value` renders with tabular figures. */
export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
  emphasis = false,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-4 shadow-sm",
        emphasis ? "border-primary/30 ring-1 ring-primary-soft" : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{title}</p>
        {Icon && (
          <Icon aria-hidden className={cn("size-4", emphasis ? "text-primary" : "text-muted")} />
        )}
      </div>
      <p className={cn("nums mt-2 text-2xl font-bold", VALUE_TONES[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
