import { cn } from "@/lib/cn";

/** A single shimmer placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-border/70 motion-safe:animate-[skeleton-pulse_1.4s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

/**
 * Generic page-loading placeholder: a header line plus a card with several rows.
 * Used by route `loading.tsx` files so tab switches feel instant.
 */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <ul className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-24" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
