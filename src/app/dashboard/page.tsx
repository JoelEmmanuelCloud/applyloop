import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getInitials, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ArrowRightIcon } from "@/components/icons";
import { buttonSecondaryClass } from "@/lib/ui";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }

  const applications = await prisma.application.findMany({
    where: { userId: session.userId },
    include: { job: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Your applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track the status of every role you&apos;ve applied to.
          </p>
        </div>
        {applications.length > 0 && (
          <Link href="/" className={`shrink-0 ${buttonSecondaryClass}`}>
            Browse open roles
          </Link>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t applied to anything yet.
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover hover:underline"
          >
            Browse open roles
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {applications.map((application) => (
            <Link
              key={application.id}
              href={`/dashboard/applications/${application.id}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground/80">
                {getInitials(application.job.company)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{application.job.title}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {application.job.company} &middot; Applied {timeAgo(application.createdAt)}
                </p>
              </div>

              <StatusBadge status={application.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
