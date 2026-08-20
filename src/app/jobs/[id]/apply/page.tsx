import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ApplyForm } from "./apply-form";
import { ArrowLeftIcon } from "@/components/icons";

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
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Link
        href={`/jobs/${job.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to role
      </Link>

      <div className="mt-6">
        <span className="text-xs font-semibold tracking-widest text-accent uppercase">
          {job.company}
        </span>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
          Apply: {job.title}
        </h1>
      </div>

      {existing ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          You already applied to this role.
        </div>
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
