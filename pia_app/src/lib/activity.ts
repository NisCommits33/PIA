import "server-only";

import { createClient } from "@/utils/supabase/server";
import { getSessionContext } from "@/lib/roles";

export type ActivityEntityType = "expense" | "meal" | "contribution" | "account";

type ActivityInput = {
  action: string;
  summary: string;
  entityType?: ActivityEntityType;
  entityId?: string;
  meta?: Record<string, unknown>;
};

/**
 * Record a mess-admin action to the activity log (shown read-only to staff +
 * super_admin). Only logs when the actor is a **mess_admin and not a
 * super_admin** — super_admin actions are intentionally not recorded. Never
 * throws: a logging failure must not break the underlying action.
 */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return;
    const isMessAdminOnly = ctx.roles.includes("mess_admin") && !ctx.roles.includes("super_admin");
    if (!isMessAdminOnly) return;

    const supabase = await createClient();
    await supabase.from("activity_log").insert({
      actor_id: ctx.userId,
      actor_name: ctx.profile?.full_name ?? ctx.email,
      action: input.action,
      summary: input.summary,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      meta: input.meta ?? null,
    });
  } catch {
    // Swallow — activity logging is best-effort.
  }
}
