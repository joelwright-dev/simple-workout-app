"use client";

import { useTransition } from "react";
import { logout } from "@/lib/actions";

export function SignOutButton({ className = "" }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
      className={`w-full rounded-2xl bg-paper px-4 py-3 font-semibold text-ink ring-1 ring-line active:bg-line/60 disabled:opacity-50 ${className}`}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
