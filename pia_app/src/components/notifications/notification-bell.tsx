"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { markNotificationsRead } from "./actions";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
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

  // Live updates: subscribe to this user's new notifications via Realtime.
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
              created_at: string;
            };
            setItems((prev) =>
              [
                {
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  link: n.link,
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell aria-hidden className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Notifications">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No notifications yet.</p>
        ) : (
          <div className="flex flex-col">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={markAll}
                disabled={unread === 0}
                className="text-xs font-medium text-primary transition-colors hover:underline disabled:text-muted disabled:no-underline"
              >
                Mark all read
              </button>
            </div>
            <ul className="-mx-1 max-h-[60dvh] divide-y divide-border overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-muted",
                      !item.read && "bg-primary-soft/50",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {!item.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                    </span>
                    {item.body && <span className="text-xs text-muted">{item.body}</span>}
                    <span className="text-[11px] text-muted">{timeAgo(item.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
