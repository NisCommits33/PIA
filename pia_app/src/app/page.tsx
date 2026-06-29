import { redirect } from "next/navigation";

import { getSessionContext } from "@/lib/roles";

export default async function Home() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile?.onboarded) redirect("/onboarding");
  redirect("/dashboard");
}
