import { requireSuperAdmin } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { AnnounceForm } from "./announce-form";

export default async function AnnouncePage() {
  await requireSuperAdmin();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcement"
        description="Send a notice to every staff member — new features, schedule changes, reminders."
      />

      <Card>
        <CardHeader
          title="New announcement"
          description="Delivered to everyone's notification bell and as a push notification."
        />
        <div className="p-4">
          <AnnounceForm />
        </div>
      </Card>
    </div>
  );
}
