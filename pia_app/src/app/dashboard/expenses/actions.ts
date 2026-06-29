"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireOnboardedUser, isMessAdmin } from "@/lib/roles";
import { adStringToBs } from "@/lib/bs-date";

export type ExpenseState = { error?: string; ok?: string } | undefined;

const RECEIPT_BUCKET = "receipts";
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_RECEIPT_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Submit an expense the current user paid for. Staff submissions start pending
 * and need admin review; admins are oversight roles, so their own expenses are
 * recorded as approved straight away (no self-approval step).
 *
 * The optional description and bill photo are attached as a best-effort follow-up
 * step: the core expense is always saved first, so a missing `description` column
 * or `receipts` storage bucket can never block recording the expense itself.
 */
export async function submitExpense(
  _prev: ExpenseState,
  formData: FormData,
): Promise<ExpenseState> {
  const ctx = await requireOnboardedUser();
  const admin = isMessAdmin(ctx);

  const item = String(formData.get("item") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const spentOn = String(formData.get("spent_on") ?? "");
  const amount = Number(amountRaw);
  const receipt = formData.get("receipt");
  const hasReceipt = receipt instanceof File && receipt.size > 0;

  if (item.length < 2) return { error: "Describe what was bought." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than 0." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spentOn)) return { error: "Pick a valid date." };
  if (hasReceipt) {
    const file = receipt as File;
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      return { error: "Bill photo must be a JPG, PNG, or WebP image." };
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      return { error: "Bill photo must be under 5 MB." };
    }
  }

  const bs = adStringToBs(spentOn);
  const now = new Date().toISOString();
  // Staff inserts go through RLS (which forces status='pending'). Admin entries
  // are recorded as approved up front, which RLS forbids on insert, so they use
  // the service-role client — safe here because we've already verified the role
  // and we pin created_by to the signed-in admin below.
  const supabase = admin ? createAdminClient() : await createClient();
  const { data: inserted, error } = await supabase
    .from("expenses")
    .insert({
      item,
      amount,
      spent_on: spentOn,
      bs_year: bs.year,
      bs_month: bs.month,
      bs_day: bs.day,
      bought_by: ctx.userId,
      created_by: ctx.userId,
      // Admins record directly — approved on entry; staff go through review.
      ...(admin
        ? { status: "approved", reviewed_by: ctx.userId, reviewed_at: now }
        : { status: "pending" }),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "Could not submit the expense. Please try again." };
  }

  // Best-effort: attach the note and bill photo. Each failure (missing column or
  // bucket) is collected so we can tell the user it's pending setup, without
  // losing the expense that was already saved.
  const pendingSetup = await attachExtras(
    inserted.id,
    ctx.userId,
    description,
    hasReceipt ? (receipt as File) : null,
  );

  revalidatePath("/dashboard/expenses");
  if (admin) {
    // Recorded expense feeds the mess overview / cost per meal immediately.
    revalidatePath("/dashboard/mess");
    revalidatePath("/dashboard");
  }

  const base = admin ? "Expense recorded." : "Expense submitted for review.";
  if (pendingSetup.length) {
    return { ok: `${base} Couldn't save the ${pendingSetup.join(" and ")} yet — pending setup.` };
  }
  return { ok: base };
}

/**
 * Attach the optional description / receipt to an already-created expense.
 * Returns the labels of any extras that couldn't be saved (e.g. the `description`
 * column or `receipts` storage bucket hasn't been created in Supabase yet).
 */
async function attachExtras(
  expenseId: string,
  userId: string,
  description: string,
  receipt: File | null,
): Promise<string[]> {
  if (!description && !receipt) return [];

  const adminDb = createAdminClient();
  const failed: string[] = [];

  if (description) {
    const { error } = await adminDb.from("expenses").update({ description }).eq("id", expenseId);
    if (error) failed.push("description");
  }

  if (receipt) {
    const safeName = receipt.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "bill";
    const path = `${userId}/${expenseId}-${Date.now()}-${safeName}`;
    const opts = { contentType: receipt.type, upsert: false };

    let upload = await adminDb.storage.from(RECEIPT_BUCKET).upload(path, receipt, opts);

    // The private bucket may not exist yet — create it once (service-role) and
    // retry, so bill photos work without any manual storage setup.
    if (upload.error) {
      const created = await adminDb.storage.createBucket(RECEIPT_BUCKET, {
        public: false,
        allowedMimeTypes: ALLOWED_RECEIPT_TYPES,
        fileSizeLimit: MAX_RECEIPT_BYTES,
      });
      if (!created.error || /exist/i.test(created.error.message)) {
        upload = await adminDb.storage.from(RECEIPT_BUCKET).upload(path, receipt, opts);
      }
    }

    if (upload.error) {
      failed.push("bill photo");
    } else {
      const { error } = await adminDb
        .from("expenses")
        .update({ receipt_path: path })
        .eq("id", expenseId);
      if (error) failed.push("bill photo");
    }
  }

  return failed;
}
