"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
  label?: string;
}

/**
 * Standalone logout button — calls POST /api/auth/logout then redirects home.
 * Safe to use inside server-component pages (it's a leaf client component).
 */
export default function LogoutButton({
  className,
  label = "Logout",
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={
        className ??
        "text-sm font-semibold px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50"
      }
    >
      {loading ? "Logging out…" : label}
    </button>
  );
}
