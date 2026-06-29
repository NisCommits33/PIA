"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export type LoginState = { error: string } | undefined;

/** Map a username to its login email; pass through anything already an email. */
function toEmail(identifier: string): string {
  const id = identifier.trim().toLowerCase();
  return id.includes("@") ? id : `${id}@pia.local`;
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Enter your username and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(identifier),
    password,
  });

  if (error) {
    return { error: "Incorrect username or password." };
  }

  // requireOnboardedUser on the dashboard will redirect to /onboarding if needed.
  redirect("/dashboard");
}
