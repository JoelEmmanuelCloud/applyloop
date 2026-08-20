"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeftIcon, AlertCircleIcon } from "@/components/icons";

type ApplicationDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeSummary: string;
  essayAnswer1: string;
  essayAnswer2: string;
  status: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line text-[15px] text-foreground">{value}</dd>
    </div>
  );
}

export default function ApplicationDetailPage({
  params,
}: PageProps<"/dashboard/applications/[id]">) {
  const { id } = use(params);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/applications/${id}`);
      if (cancelled) return;

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setApplication(data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="animate-pulse">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="mt-6 h-7 w-64 rounded bg-muted" />
          <div className="mt-2 h-4 w-40 rounded bg-muted" />
          <div className="mt-8 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="mt-2 h-4 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-sm text-destructive-foreground"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error ?? "Application not found."}
        </div>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {application.job.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{application.job.company}</p>
          <Link
            href={`/jobs/${application.job.id}`}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover hover:underline"
          >
            View job posting
          </Link>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <dl className="mt-8 grid gap-6 rounded-xl border border-border bg-surface p-5">
        <Field label="Name" value={application.name} />
        <Field label="Email" value={application.email} />
        <Field label="Phone" value={application.phone} />
        <Field label="Resume summary" value={application.resumeSummary} />
        <Field label="Why does this role interest you?" value={application.essayAnswer1} />
        <Field
          label="Describe a time you solved a problem without being told how."
          value={application.essayAnswer2}
        />
      </dl>
    </div>
  );
}
