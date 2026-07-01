import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline — PIA ARFF",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">You&rsquo;re offline</h1>
      <p className="max-w-sm text-sm text-muted">
        PIA ARFF needs a connection to load this page. Check your network and try again —
        anything you&rsquo;ve already opened stays available.
      </p>
    </main>
  );
}
