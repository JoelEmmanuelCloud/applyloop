"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircleIcon, LogoMark, SpinnerIcon } from "@/components/icons";
import { PasswordInput } from "@/components/password-input";
import { fieldClass, buttonPrimaryClass } from "@/lib/ui";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
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

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-16 sm:px-6">
      <LogoMark className="h-9 w-9 text-primary" />
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        One profile, apply to every role in minutes.
      </p>

      <div className="mt-8 w-full rounded-xl border border-border bg-surface p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className={fieldClass}
            />
          </div>

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

          <div>
            <PasswordInput name="password" autoComplete="new-password" minLength={8} />
            <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
          </div>

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
            {submitting ? "Signing up..." : "Sign up"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
