"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--sidebar-border)] px-3 py-2 text-xs font-semibold text-muted transition hover:bg-[var(--nav-hover-bg)] hover:text-foreground disabled:opacity-60"
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
      {loading ? "กำลังออก..." : "ออกจากระบบ"}
    </button>
  );
}
