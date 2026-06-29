import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type QuickAction = {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  badge?: number;
};

/** A grid of shortcut tiles to the most common tasks for the current role. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Card>
      <CardHeader title="Quick actions" />
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm transition-colors hover:border-primary hover:bg-primary-soft"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {a.label}
                  {a.badge ? <Badge tone="danger">{a.badge}</Badge> : null}
                </span>
                <span className="block truncate text-xs text-muted">{a.hint}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
