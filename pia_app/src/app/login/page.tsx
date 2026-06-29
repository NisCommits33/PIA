import { redirect } from "next/navigation";
import { Flame } from "lucide-react";

import { getSessionContext } from "@/lib/roles";
import { Card, CardBody } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Already signed in? Skip the login screen.
  if (await getSessionContext()) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
            <Flame aria-hidden className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Station Ops</h1>
          <p className="mt-1 text-sm text-muted">Pokhara Fire Station — staff sign in</p>
        </div>

        <Card>
          <CardBody className="p-6">
            <LoginForm />
          </CardBody>
        </Card>

        <p className="mt-6 text-center text-xs text-muted">Internal use only.</p>
      </div>
    </main>
  );
}
