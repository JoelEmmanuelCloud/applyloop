import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Your applications</h1>

      {applications.length === 0 ? (
        <p className="mt-4 text-gray-600">
          You haven&apos;t applied to anything yet.{" "}
          <Link href="/" className="underline">
            Browse open roles
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 grid gap-3">
          {applications.map((application) => (
            <Link
              key={application.id}
              href={`/dashboard/applications/${application.id}`}
              className="rounded-lg border border-gray-200 p-4 hover:border-gray-400"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{application.job.title}</p>
                  <p className="text-sm text-gray-600">{application.job.company}</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {application.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
