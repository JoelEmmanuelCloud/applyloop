import Link from "next/link";
import { prisma } from "@/lib/db";
import { getInitials, timeAgo } from "@/lib/format";
import { ArrowRightIcon, MapPinIcon } from "@/components/icons";

export default async function HomePage() {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="max-w-2xl">
        <span className="text-xs font-semibold tracking-widest text-accent uppercase">
          Open roles
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Find your next role.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Browse open positions from teams that are hiring right now, and apply
          in minutes with an application that carries over between roles.
        </p>
      </div>

      <div className="mt-8 flex items-center gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{jobs.length}</span>
        open {jobs.length === 1 ? "role" : "roles"}
      </div>

      <div className="mt-4 grid gap-3">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="group rounded-xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md hover:shadow-slate-900/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground/80">
                  {getInitials(job.company)}
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">
                    {job.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{job.company}</p>
                </div>
              </div>
              <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                {job.location}
              </span>
              <span aria-hidden="true">&middot;</span>
              <span>Posted {timeAgo(job.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
