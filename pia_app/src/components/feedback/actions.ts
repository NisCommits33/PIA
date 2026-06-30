"use server";

import { createClient } from "@/utils/supabase/server";
import { requireUser } from "@/lib/roles";

export type FeedbackState = { ok?: string; error?: string } | undefined;

const KINDS = ["bug", "feature", "other"] as const;
type FeedbackKind = (typeof KINDS)[number];

/** Submit in-app feedback (bug / feature / suggestion) for the current user. */
export async function submitFeedback(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const ctx = await requireUser();

  const kind = String(formData.get("kind") ?? "") as FeedbackKind;
  const message = String(formData.get("message") ?? "").trim();
  const page = String(formData.get("page") ?? "").slice(0, 200) || null;

  if (!KINDS.includes(kind)) return { error: "Pick what kind of feedback this is." };
  if (message.length < 3) return { error: "Please add a bit more detail." };
  if (message.length > 2000) return { error: "That's a bit long — keep it under 2000 characters." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("feedback")
    .insert({ created_by: ctx.userId, kind, message, page });

  if (error) return { error: "Couldn't send your feedback. Please try again." };

  return { ok: "Thanks! Your feedback was sent." };
}
