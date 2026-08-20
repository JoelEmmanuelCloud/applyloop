"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircleIcon, LogoMark, SpinnerIcon } from "@/components/icons";
import { PasswordInput } from "@/components/password-input";
import { fieldClass, buttonPrimaryClass } from "@/lib/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    const next = searchParams.get("next") ?? "/dashboard";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 sm:px-6">
      <LogoMark className="h-9 w-9 text-primary" />
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Log in to continue to ApplyLoop.</p>

      <div className="mt-8 w-full rounded-xl border border-border bg-surface p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={fieldClass}
            />
          </div>

          <PasswordInput name="password" autoComplete="current-password" />

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-sm text-destructive-foreground"
            >
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className={`w-full ${buttonPrimaryClass}`}>
            {submitting && <SpinnerIcon className="h-4 w-4" />}
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="font-medium text-accent hover:text-accent-hover hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
