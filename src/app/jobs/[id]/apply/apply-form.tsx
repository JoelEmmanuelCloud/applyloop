"use client";

import { useState, FormEvent } from "react";

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
      <div className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Application submitted successfully.{" "}
        <a href="/dashboard" className="underline">
          View your applications
        </a>
        .
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-800">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-800">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="resumeSummary" className="block text-sm font-medium text-gray-800">
          Resume summary
        </label>
        <textarea
          id="resumeSummary"
          name="resumeSummary"
          required
          rows={5}
          placeholder="Paste a short summary of your experience"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="essayAnswer1" className="block text-sm font-medium text-gray-800">
          Why does this role interest you?
        </label>
        <textarea
          id="essayAnswer1"
          name="essayAnswer1"
          required
          rows={4}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="essayAnswer2" className="block text-sm font-medium text-gray-800">
          Describe a time you solved a problem without being told how.
        </label>
        <textarea
          id="essayAnswer2"
          name="essayAnswer2"
          required
          rows={4}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-black px-5 py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
