"use client";

import { useRouter } from "next/navigation";
import { buttonGhostClass } from "@/lib/ui";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={buttonGhostClass}>
      Log out
    </button>
  );
}
