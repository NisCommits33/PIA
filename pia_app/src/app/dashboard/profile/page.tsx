import { requireOnboardedUser, isMessAdmin } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const ctx = await requireOnboardedUser();
  const username = ctx.email.split("@")[0];
  const admin = isMessAdmin(ctx);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My profile" description="Update your personal details." />

      <Card>
        <CardHeader title="Details" description={`Signed in as ${username}`} />
        <div className="p-4">
          <ProfileForm
            isAdmin={admin}
            defaultName={ctx.profile?.full_name ?? ""}
            defaultPhone={ctx.profile?.phone ?? ""}
            defaultDepartment={ctx.profile?.department ?? ""}
            defaultShift={ctx.profile?.default_shift ?? ""}
          />
        </div>
      </Card>
    </div>
  );
}
