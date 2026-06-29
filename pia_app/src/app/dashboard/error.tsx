"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle aria-hidden className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted">
          This page couldn&rsquo;t load. Check your connection and try again — your data is safe.
        </p>
      </div>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
