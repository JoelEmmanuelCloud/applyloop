import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogoutButton } from "./logout-button";
import { LogoMark } from "./icons";
import { getInitials } from "@/lib/format";

export async function Nav() {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.userId } })
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground"
        >
          <LogoMark className="h-7 w-7 text-primary" />
          <span className="font-display">ApplyLoop</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-2 font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              >
                Dashboard
              </Link>
              <div className="ml-1 flex items-center gap-3 border-l border-border pl-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-soft-foreground">
                    {getInitials(user.name)}
                  </span>
                  <span className="hidden text-foreground/70 sm:inline">{user.name}</span>
                </div>
                <LogoutButton />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-3.5 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
