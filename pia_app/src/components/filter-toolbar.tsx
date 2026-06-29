"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/field";

/**
 * Presentational toolbar for instant client-side list filtering: a search box
 * plus optional `<Select>` filters passed as children, and a live result count.
 * The owning list component holds the filter state and does the actual filtering.
 */
export function FilterToolbar({
  search,
  onSearchChange,
  placeholder = "Search…",
  children,
  count,
  total,
  noun = "result",
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  children?: ReactNode;
  count: number;
  total: number;
  noun?: string;
}) {
  const plural = (n: number) => (n === 1 ? noun : `${noun}s`);

  return (
    <div className="flex flex-col gap-3 border-b border-border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="pl-9"
          />
        </div>
        {children}
      </div>
      <p className="text-xs text-muted">
        {count === total
          ? `${total} ${plural(total)}`
          : `${count} of ${total} ${plural(total)}`}
      </p>
    </div>
  );
}
