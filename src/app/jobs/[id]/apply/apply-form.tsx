"use client";

import { useState, FormEvent } from "react";
import { AlertCircleIcon, CheckCircleIcon, SpinnerIcon } from "@/components/icons";
import { fieldClass, fieldLabelClass, buttonPrimaryClass } from "@/lib/ui";

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
            <label htmlFor="name" className={fieldLabelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              defaultValue={defaultName}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="email" className={fieldLabelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={defaultEmail}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="phone" className={fieldLabelClass}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">Application questions</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="resumeSummary" className={fieldLabelClass}>
              Resume summary
            </label>
            <textarea
              id="resumeSummary"
              name="resumeSummary"
              required
              rows={5}
              placeholder="Paste a short summary of your experience"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="essayAnswer1" className={fieldLabelClass}>
              Why does this role interest you?
            </label>
            <textarea
              id="essayAnswer1"
              name="essayAnswer1"
              required
              rows={4}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="essayAnswer2" className={fieldLabelClass}>
              Describe a time you solved a problem without being told how.
            </label>
            <textarea
              id="essayAnswer2"
              name="essayAnswer2"
              required
              rows={4}
              className={fieldClass}
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

      <button type="submit" disabled={submitting} className={buttonPrimaryClass}>
        {submitting && <SpinnerIcon className="h-4 w-4" />}
        {submitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
