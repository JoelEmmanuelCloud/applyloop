"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

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
    title: string;
    company: string;
  };
};

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
    return <div className="mx-auto max-w-2xl px-4 py-10 text-gray-500">Loading...</div>;
  }

  if (error || !application) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-red-600">{error ?? "Application not found."}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
        &larr; Back to dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold">{application.job.title}</h1>
      <p className="mt-1 text-gray-600">{application.job.company}</p>

      <dl className="mt-6 grid gap-4">
        <div>
          <dt className="text-sm font-medium text-gray-500">Name</dt>
          <dd>{application.name}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Email</dt>
          <dd>{application.email}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Phone</dt>
          <dd>{application.phone}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Resume summary</dt>
          <dd className="whitespace-pre-line">{application.resumeSummary}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Why does this role interest you?</dt>
          <dd className="whitespace-pre-line">{application.essayAnswer1}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">
            Describe a time you solved a problem without being told how.
          </dt>
          <dd className="whitespace-pre-line">{application.essayAnswer2}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd className="uppercase">{application.status}</dd>
        </div>
      </dl>
    </div>
  );
}
