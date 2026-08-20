"use client";

import { useState, FormEvent } from "react";
import { AlertCircleIcon, CheckCircleIcon, SpinnerIcon } from "@/components/icons";

const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-ring/25";

const labelClass = "block text-sm font-medium text-foreground";

export function ApplyForm({
  jobId,
  defaultName,
  defaultEmail,
}: {
  jobId: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const body = {
      jobId,
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      resumeSummary: form.get("resumeSummary"),
      essayAnswer1: form.get("essayAnswer1"),
      essayAnswer2: form.get("essayAnswer2"),
    };

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-10 text-center">
        <CheckCircleIcon className="h-10 w-10 text-success" />
        <p className="text-[15px] font-semibold text-foreground">
          Application submitted
        </p>
        <p className="text-sm text-muted-foreground">
          We&apos;ll follow up by email as soon as there&apos;s an update.
        </p>
        <a
          href="/dashboard"
          className="mt-2 text-sm font-medium text-accent hover:text-accent-hover hover:underline"
        >
          View your applications
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-8">
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Contact information</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              defaultValue={defaultName}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={defaultEmail}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Application questions</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="resumeSummary" className={labelClass}>
              Resume summary
            </label>
            <textarea
              id="resumeSummary"
              name="resumeSummary"
              required
              rows={5}
              placeholder="Paste a short summary of your experience"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="essayAnswer1" className={labelClass}>
              Why does this role interest you?
            </label>
            <textarea
              id="essayAnswer1"
              name="essayAnswer1"
              required
              rows={4}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="essayAnswer2" className={labelClass}>
              Describe a time you solved a problem without being told how.
            </label>
            <textarea
              id="essayAnswer2"
              name="essayAnswer2"
              required
              rows={4}
              className={inputClass}
            />
          </div>
        </div>
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

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <SpinnerIcon className="h-4 w-4" />}
        {submitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
