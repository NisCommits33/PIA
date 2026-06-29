import { redirect } from "next/navigation";

import { requireUser, isMessAdmin } from "@/lib/roles";
import { Card, CardBody } from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const ctx = await requireUser();
  // Already onboarded, or an oversight admin who doesn't need a shift — skip setup.
  if (ctx.profile?.onboarded || isMessAdmin(ctx)) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Step 1 of 1 · Finish setup
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Welcome aboard</h1>
          <p className="mt-1 text-sm text-muted">
            A few details so we can set up your meals, bills, and leave.
          </p>
        </div>

        <Card>
          <CardBody className="p-6">
            <OnboardingForm defaultName={ctx.profile?.full_name ?? undefined} />
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
