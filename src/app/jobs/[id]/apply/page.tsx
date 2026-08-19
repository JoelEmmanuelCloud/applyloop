import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ApplyForm } from "./apply-form";

export default async function ApplyPage({ params }: PageProps<"/jobs/[id]/apply">) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=/jobs/${id}/apply`);
  }

  const [job, user] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: session.userId } }),
  ]);

  if (!job || !user) {
    notFound();
  }

  const existing = await prisma.application.findUnique({
    where: { userId_jobId: { userId: user.id, jobId: job.id } },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Apply: {job.title}</h1>
      <p className="mt-1 text-gray-600">{job.company}</p>

      {existing ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          You already applied to this role.
        </p>
      ) : (
        <ApplyForm
          jobId={job.id}
          defaultName={user.name}
          defaultEmail={user.email}
        />
      )}
    </div>
  );
}
