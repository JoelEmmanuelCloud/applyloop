import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Open roles</h1>
      <p className="mt-2 text-gray-600">
        Browse listings and apply. ApplyLoop is a demo job board built for the Kane CLI Hackathon.
      </p>

      <div className="mt-8 grid gap-4">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="rounded-lg border border-gray-200 p-5 transition hover:border-gray-400 hover:shadow-sm"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{job.title}</h2>
              <span className="text-sm text-gray-500">{job.location}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-gray-700">{job.company}</p>
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{job.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
