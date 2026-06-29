"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { editExpense, removeExpense } from "./actions";

export type EditableExpense = {
  id: string;
  item: string;
  description: string | null;
  amount: number;
  spentOn: string; // AD date, YYYY-MM-DD
};

export function ExpenseAdminActions({ expense }: { expense: EditableExpense }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [removing, startRemove] = useTransition();

  function onSave(formData: FormData) {
    startSave(async () => {
      const res = await editExpense(expense.id, undefined, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setError(null);
        setEditOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setEditOpen(true)}
        aria-label="Edit expense"
      >
        <Pencil aria-hidden className="size-4" />
        Edit
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        aria-label="Remove expense"
      >
        <Trash2 aria-hidden className="size-4" />
        Remove
      </Button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit expense">
        <form action={onSave} className="flex flex-col gap-4">
          <Field label="Item" htmlFor={`item-${expense.id}`} required>
            <Input id={`item-${expense.id}`} name="item" required defaultValue={expense.item} />
          </Field>

          <Field label="Description" htmlFor={`desc-${expense.id}`}>
            <Textarea
              id={`desc-${expense.id}`}
              name="description"
              rows={3}
              defaultValue={expense.description ?? ""}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (NPR)" htmlFor={`amt-${expense.id}`} required>
              <Input
                id={`amt-${expense.id}`}
                name="amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                required
                defaultValue={expense.amount}
              />
            </Field>
            <Field label="Date bought" htmlFor={`date-${expense.id}`} required>
              <Input
                id={`date-${expense.id}`}
                name="spent_on"
                type="date"
                required
                defaultValue={expense.spentOn}
              />
            </Field>
          </div>

          <div aria-live="polite" className="min-h-5 text-sm">
            {error && <span className="font-medium text-danger">{error}</span>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Remove expense?">
        <p className="text-sm text-muted">
          “{expense.item}” will be removed from the mess records and stop counting toward the cost
          per meal. This can’t be undone from the app.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={removing}
            onClick={() =>
              startRemove(async () => {
                await removeExpense(expense.id);
                setConfirmOpen(false);
              })
            }
          >
            {removing ? "Removing…" : "Remove"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
