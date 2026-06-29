"use client";

import { useState } from "react";
import { ChevronRight, ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

type StatusTone = "neutral" | "primary" | "accent" | "success" | "danger";

export type ExpenseDetail = {
  item: string;
  amountLabel: string;
  dateLabel: string;
  statusLabel: string;
  statusTone: StatusTone;
  reimbursed?: boolean;
  submitterName?: string;
  description: string | null;
  receiptUrl: string | null;
};

/** Read-only label/value row inside the detail modal. */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className="min-w-0 text-right text-sm text-foreground">{children}</span>
    </div>
  );
}

/** The shared modal body: all details + the bill photo. */
function ExpenseDetailModal({
  open,
  onClose,
  expense,
}: {
  open: boolean;
  onClose: () => void;
  expense: ExpenseDetail;
}) {
  return (
    <Modal open={open} onClose={onClose} title={expense.item}>
      <div className="flex flex-col gap-1">
        <DetailRow label="Amount">
          <span className="nums font-semibold">{expense.amountLabel}</span>
        </DetailRow>
        <DetailRow label="Date">
          <span className="nums">{expense.dateLabel}</span>
        </DetailRow>
        <DetailRow label="Status">
          <span className="inline-flex items-center gap-1.5">
            <Badge tone={expense.statusTone}>{expense.statusLabel}</Badge>
            {expense.reimbursed && <Badge tone="primary">Reimbursed</Badge>}
          </span>
        </DetailRow>
        {expense.submitterName && <DetailRow label="By">{expense.submitterName}</DetailRow>}

        <div className="pt-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Description</p>
          <p className="text-sm text-foreground">
            {expense.description || <span className="text-muted">No description added.</span>}
          </p>
        </div>

        <div className="pt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            Bill / receipt
          </p>
          {expense.receiptUrl ? (
            <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={expense.receiptUrl}
                alt={`Bill for ${expense.item}`}
                className="max-h-80 w-full rounded-lg border border-border bg-surface-muted object-contain"
              />
              <span className="mt-1 block text-xs text-primary">Tap image to open full size</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted">
              <ImageOff aria-hidden className="size-4" />
              No bill photo attached.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** A full, clickable expense list row that opens the detail modal. */
export function ExpenseRow({ expense }: { expense: ExpenseDetail }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{expense.item}</p>
          <p className="text-xs text-muted">
            {expense.submitterName ? `${expense.submitterName} · ` : ""}
            {expense.dateLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <Badge tone={expense.statusTone}>{expense.statusLabel}</Badge>
            {expense.reimbursed && <Badge tone="primary">Reimbursed</Badge>}
          </div>
          <span className="nums w-24 text-right text-sm font-semibold text-foreground">
            {expense.amountLabel}
          </span>
          <ChevronRight aria-hidden className="size-4 text-muted" />
        </div>
      </button>
      <ExpenseDetailModal open={open} onClose={() => setOpen(false)} expense={expense} />
    </li>
  );
}

/**
 * Just the clickable item/meta block (no row chrome), for lists that keep their
 * own action buttons alongside — e.g. the admin review screen.
 */
export function ExpenseInfoTrigger({ expense }: { expense: ExpenseDetail }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <p className="truncate text-sm font-medium text-foreground underline-offset-2 hover:underline">
          {expense.item}
        </p>
        <p className="text-xs text-muted">
          {expense.submitterName ? `${expense.submitterName} · ` : ""}
          {expense.dateLabel}
        </p>
      </button>
      <ExpenseDetailModal open={open} onClose={() => setOpen(false)} expense={expense} />
    </>
  );
}
