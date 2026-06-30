import { requireOnboardedUser } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { ActivityFeed, type ActivityRow } from "../activity-feed";

type ActivityLogRow = {
  id: string;
  actor_name: string | null;
  summary: string;
  entity_type: string | null;
  created_at: string;
};

export default async function ActivityPage() {
  await requireOnboardedUser();

  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_log")
    .select("id, actor_name, summary, entity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: ActivityRow[] = ((data as ActivityLogRow[] | null) ?? []).map((r) => ({
    id: r.id,
    actorName: r.actor_name || "Mess admin",
    summary: r.summary,
    entityType: r.entity_type,
    createdAt: r.created_at,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mess admin activity"
        description="A running record of what the mess admin does — for everyone to see."
      />

      <Card>
        <CardHeader title="Recent activity" description="Latest 100 actions" />
        <ActivityFeed rows={rows} />
      </Card>
    </div>
  );
}
