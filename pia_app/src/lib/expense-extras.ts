import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";

export type ExpenseExtra = { description: string | null; receiptUrl: string | null };

const RECEIPT_BUCKET = "receipts";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

/**
 * Fetch the optional description + a signed bill-photo URL for the given expense
 * ids. Best-effort and resilient: if the `description` column or `receipts`
 * bucket doesn't exist yet (migration 0006 not applied), it degrades to whatever
 * is available instead of throwing — so list pages keep rendering either way.
 */
export async function getExpenseExtras(ids: string[]): Promise<Map<string, ExpenseExtra>> {
  const out = new Map<string, ExpenseExtra>();
  if (ids.length === 0) return out;

  const adminDb = createAdminClient();

  // Try to read description + receipt_path; fall back to receipt_path only if the
  // description column isn't there yet.
  let rows: { id: string; description: string | null; receipt_path: string | null }[] = [];
  const withDescription = await adminDb
    .from("expenses")
    .select("id, description, receipt_path")
    .in("id", ids);

  if (withDescription.error) {
    const receiptOnly = await adminDb.from("expenses").select("id, receipt_path").in("id", ids);
    rows = ((receiptOnly.data as { id: string; receipt_path: string | null }[] | null) ?? []).map(
      (r) => ({ ...r, description: null }),
    );
  } else {
    rows = (withDescription.data as typeof rows | null) ?? [];
  }

  // Sign receipt paths so the private bucket can be viewed; tolerate a missing bucket.
  const paths = rows.map((r) => r.receipt_path).filter((p): p is string => !!p);
  const urlByPath = new Map<string, string>();
  if (paths.length) {
    const signed = await adminDb.storage
      .from(RECEIPT_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    for (const item of signed.data ?? []) {
      if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl);
    }
  }

  for (const r of rows) {
    out.set(r.id, {
      description: r.description,
      receiptUrl: r.receipt_path ? (urlByPath.get(r.receipt_path) ?? null) : null,
    });
  }
  return out;
}
