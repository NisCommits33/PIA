"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Wallet,
  HandCoins,
  Scale,
  CalendarDays,
  Users,
  Settings,
  BookOpen,
  Activity,
} from "lucide-react";

import { cn } from "@/lib/cn";

// Icons are resolved here (client side) by key — components can't be passed as
// props from a Server Component across the client boundary.
export const ICONS = {
  dashboard: LayoutDashboard,
  meals: UtensilsCrossed,
  expenses: Receipt,
  mess: Wallet,
  wallet: HandCoins,
  settlement: Scale,
  leave: CalendarDays,
  staff: Users,
  settings: Settings,
  messbook: BookOpen,
  activity: Activity,
} as const;

export type NavIcon = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon?: NavIcon };

export function SubNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon ? ICONS[item.icon] : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            {Icon && <Icon aria-hidden className="size-4" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
