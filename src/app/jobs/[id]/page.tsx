import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getInitials, timeAgo } from "@/lib/format";
import { ArrowLeftIcon, MapPinIcon, ClockIcon } from "@/components/icons";

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });

  if (!job) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to listings
      </Link>

      <div className="mt-6 grid gap-8 sm:grid-cols-[1fr_260px]">
        <div>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground/80">
              {getInitials(job.company)}
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {job.title}
              </h1>
              <p className="mt-1 text-[15px] text-muted-foreground">{job.company}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-border py-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon className="h-4 w-4" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              Posted {timeAgo(job.createdAt)}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground">About the role</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground/80">
              {job.description}
            </p>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-surface p-5 sm:sticky sm:top-20">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {job.company}
          </p>
          <p className="mt-1 text-sm text-foreground">{job.location}</p>
          <Link
            href={`/jobs/${job.id}/apply`}
            className="mt-4 flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Apply now
          </Link>
        </aside>
      </div>
    </div>
  );
}
