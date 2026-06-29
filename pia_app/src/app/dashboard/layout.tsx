import { Flame } from "lucide-react";

import { requireOnboardedUser, isMessAdmin } from "@/lib/roles";
import { signOut } from "@/lib/session-actions";
import { SubNav, type NavItem } from "@/components/sub-nav";
import { BottomNav } from "@/components/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";

function roleLabel(roles: string[]): string {
  if (roles.includes("super_admin")) return "Super admin";
  if (roles.includes("mess_admin")) return "Mess admin";
  return "Staff";
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOnboardedUser();

  const admin = isMessAdmin(ctx);
  const nav: NavItem[] = [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" }];
  // Admin accounts are management-only — they don't log their own meals.
  if (!admin) {
    nav.push({ href: "/dashboard/meals", label: "My meals", icon: "meals" });
  }
  nav.push({ href: "/dashboard/expenses", label: "Expenses", icon: "expenses" });
  if (!admin) {
    nav.push({ href: "/dashboard/leave", label: "Leave", icon: "leave" });
  }
  if (admin) {
    nav.push({ href: "/dashboard/mess", label: "Manage mess", icon: "mess" });
  }
  if (admin) {
    nav.push({ href: "/dashboard/staff", label: "Staff", icon: "staff" });
  }
  nav.push({ href: "/dashboard/profile", label: "Profile", icon: "settings" });

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-on-primary">
                <Flame aria-hidden className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">Station Ops</span>
              <Badge tone="accent">{roleLabel(ctx.roles)}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-muted sm:inline">
                {ctx.profile?.full_name ?? ctx.email}
              </span>
              <form action={signOut}>
                <Button type="submit" variant="secondary" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
          {/* Desktop/tablet tab strip; on mobile the bottom bar takes over. */}
          <div className="mx-auto hidden max-w-5xl px-4 pb-2 sm:block">
            <SubNav items={nav} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:pb-6">{children}</main>

        <BottomNav items={nav} />
      </div>
    </ToastProvider>
  );
}
