"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { subscribeUser, unsubscribeUser } from "./actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Per-device toggle to enable/disable Web Push notifications. */
export function PushToggle() {
  const toast = useToast();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    let active = true;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!active) return;
        setSupported(true);
        setSubscribed(Boolean(sub));
      })
      .catch(() => {
        if (active) setSupported(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        toast.error("Push notifications aren't configured yet.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission was denied.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const res = await subscribeUser(JSON.parse(JSON.stringify(sub)));
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setSubscribed(true);
      toast.success("Notifications enabled on this device.");
    } catch {
      toast.error("Couldn't enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await unsubscribeUser(sub.endpoint);
      }
      setSubscribed(false);
      toast.success("Notifications disabled on this device.");
    } catch {
      toast.error("Couldn't disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted">
        Push notifications aren&rsquo;t supported on this browser.
      </p>
    );
  }

  return subscribed ? (
    <Button type="button" variant="secondary" loading={busy} onClick={disable}>
      <BellOff aria-hidden className="size-4" /> Turn off notifications
    </Button>
  ) : (
    <Button type="button" variant="primary" loading={busy} onClick={enable}>
      <Bell aria-hidden className="size-4" /> Enable notifications
    </Button>
  );
}
