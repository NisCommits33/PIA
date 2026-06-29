"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { signIn, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Username" htmlFor="identifier">
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          autoFocus
          required
          placeholder="e.g. superadmin"
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-5" />
            ) : (
              <Eye aria-hidden className="size-5" />
            )}
          </button>
        </div>
      </Field>

      <div aria-live="polite">
        {state?.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
      </div>

      <Button type="submit" loading={pending} className="mt-1 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
