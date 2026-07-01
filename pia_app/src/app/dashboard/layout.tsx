import Link from "next/link";
import { CircleUser } from "lucide-react";

import { requireOnboardedUser, isMessAdmin } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/lib/session-actions";
import { SubNav, type NavItem } from "@/components/sub-nav";
import { BottomNav } from "@/components/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { BrandMark } from "@/components/brand-mark";
import {
  NotificationBell,
  type NotificationItem,
} from "@/components/notifications/notification-bell";

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
  // Read-only mess transparency — visible to everyone. (Profile lives in the header.)
  nav.push({ href: "/dashboard/mess-book", label: "Mess book", icon: "messbook" });

  const supabase = await createClient();
  const { data: notifRows } = await supabase
    .from("notifications")
    .select("id, title, body, link, kind, read_at, created_at")
    .eq("recipient_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(30);
  const notifications: NotificationItem[] = (
    (notifRows as
      | {
          id: string;
          title: string;
          body: string | null;
          link: string | null;
          kind: string | null;
          read_at: string | null;
          created_at: string;
        }[]
      | null) ?? []
  ).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    kind: n.kind ?? "general",
    read: n.read_at != null,
    createdAt: n.created_at,
  }));

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-2">
              <BrandMark className="size-9 object-contain" />
              <span className="text-lg font-bold tracking-tight text-foreground">PIA ARFF</span>
              <Badge tone="accent">{roleLabel(ctx.roles)}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <NotificationBell userId={ctx.userId} initial={notifications} />
              <Link
                href="/dashboard/profile"
                aria-label="Your profile"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <CircleUser aria-hidden className="size-5" />
                <span className="hidden sm:inline">{ctx.profile?.full_name ?? ctx.email}</span>
              </Link>
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
        <FeedbackWidget />
      </div>
    </ToastProvider>
  );
}
