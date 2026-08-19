import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });

  if (!job) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        &larr; Back to listings
      </Link>

      <h1 className="mt-4 text-2xl font-bold">{job.title}</h1>
      <p className="mt-1 text-gray-700">
        {job.company} &middot; {job.location}
      </p>

      <p className="mt-6 whitespace-pre-line text-gray-800">{job.description}</p>

      <Link
        href={`/jobs/${job.id}/apply`}
        className="mt-8 inline-block rounded bg-black px-5 py-2.5 font-medium text-white hover:bg-gray-800"
      >
        Apply now
      </Link>
    </div>
  );
}
