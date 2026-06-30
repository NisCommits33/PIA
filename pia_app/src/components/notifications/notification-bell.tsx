"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Receipt,
  UtensilsCrossed,
  Wallet,
  AlarmClock,
  Megaphone,
  X,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { markNotificationsRead } from "./actions";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  kind: string;
  read: boolean;
  createdAt: string;
};

/** Icon + colour treatment per notification kind. */
const KIND: Record<string, { icon: LucideIcon; tone: string }> = {
  expense: { icon: Receipt, tone: "bg-primary-soft text-primary" },
  meal: { icon: UtensilsCrossed, tone: "bg-accent-soft text-accent" },
  contribution: { icon: Wallet, tone: "bg-success-soft text-success" },
  reminder: { icon: AlarmClock, tone: "bg-accent-soft text-accent" },
  announcement: { icon: Megaphone, tone: "bg-primary-soft text-primary" },
  general: { icon: Bell, tone: "bg-surface-muted text-muted" },
};

function kindOf(kind: string) {
  return KIND[kind] ?? KIND.general;
}

function timeAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function dayBucket(iso: string): "Today" | "Yesterday" | "Earlier" {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(iso).getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - 86_400_000) return "Yesterday";
  return "Earlier";
}

export function NotificationBell({
  userId,
  initial,
}: {
  userId: string;
  initial: NotificationItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(initial);

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const groups = useMemo(() => {
    const order: Array<"Today" | "Yesterday" | "Earlier"> = ["Today", "Yesterday", "Earlier"];
    const map = new Map<string, NotificationItem[]>();
    for (const item of items) {
      const b = dayBucket(item.createdAt);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(item);
    }
    return order.filter((b) => map.has(b)).map((label) => ({ label, items: map.get(label)! }));
  }, [items]);

  // Live updates via Realtime.
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) supabase.realtime.setAuth(token);
      if (!active) return;

      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            const n = payload.new as {
              id: string;
              title: string;
              body: string | null;
              link: string | null;
              kind: string | null;
              created_at: string;
            };
            setItems((prev) =>
              [
                {
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  link: n.link,
                  kind: n.kind ?? "general",
                  read: false,
                  createdAt: n.created_at,
                },
                ...prev.filter((i) => i.id !== n.id),
              ].slice(0, 50),
            );
            toast.success(n.title);
          },
        )
        .subscribe();
    })();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  async function openItem(item: NotificationItem) {
    if (!item.read) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      await markNotificationsRead(item.id);
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  async function markAll() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await markNotificationsRead();
  }

  function panelBody(mobile: boolean) {
    return (
      <>
        {mobile && <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border" />}

        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            {unread > 0 && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                {unread} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={markAll}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-soft disabled:text-muted disabled:hover:bg-transparent"
            >
              <CheckCheck aria-hidden className="size-3.5" />
              Mark all read
            </button>
            {mobile && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <X aria-hidden className="size-4" />
              </button>
            )}
          </div>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-muted">
              <BellOff aria-hidden className="size-6" />
            </span>
            <p className="text-sm font-medium text-foreground">You&rsquo;re all caught up</p>
            <p className="max-w-[14rem] text-xs text-muted">
              Approvals, advances, and meal reminders will show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto overscroll-contain">
            {groups.map((group) => (
              <section key={group.label}>
                <h3 className="sticky top-0 z-10 bg-surface/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted backdrop-blur">
                  {group.label}
                </h3>
                <ul className="divide-y divide-border">
                  {group.items.map((item) => {
                    const { icon: Icon, tone } = kindOf(item.kind);
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => openItem(item)}
                          className={cn(
                            "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted",
                            !item.read && "bg-primary-soft/40",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-full",
                              tone,
                            )}
                          >
                            <Icon aria-hidden className="size-4.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "truncate text-sm text-foreground",
                                  !item.read && "font-semibold",
                                )}
                              >
                                {item.title}
                              </span>
                              {!item.read && (
                                <span
                                  aria-hidden
                                  className="size-2 shrink-0 rounded-full bg-primary"
                                />
                              )}
                            </span>
                            {item.body && (
                              <span className="mt-0.5 block text-xs text-muted">{item.body}</span>
                            )}
                            <span className="mt-1 block text-[11px] text-muted">
                              {timeAgo(item.createdAt)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex size-10 touch-manipulation items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell aria-hidden className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-surface">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Scrim (mobile) / click-away (desktop) */}
            <div
              className="fixed inset-0 z-40 bg-black/40 motion-safe:animate-[fade-in_150ms_ease-out] sm:bg-black/10"
              onClick={() => setOpen(false)}
              aria-hidden
            />

            {/* Mobile: bottom sheet */}
            <div
              role="dialog"
              aria-label="Notifications"
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-t-2xl border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl motion-safe:animate-[sheet-up_220ms_cubic-bezier(0.22,1,0.36,1)] sm:hidden"
            >
              {panelBody(true)}
            </div>

            {/* Desktop: dropdown aligned to the max-w-5xl container's right edge (where the bell is) */}
            <div className="pointer-events-none fixed inset-x-0 top-16 z-50 hidden sm:block">
              <div className="mx-auto flex max-w-5xl justify-end px-4">
                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="pointer-events-auto flex max-h-[70dvh] w-96 origin-top-right flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl motion-safe:animate-[dropdown-in_160ms_ease-out]"
                >
                  {panelBody(false)}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
