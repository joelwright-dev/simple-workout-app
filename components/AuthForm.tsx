"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (
    prev: string | undefined,
    formData: FormData,
  ) => Promise<string | undefined>;
}) {
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const isLogin = mode === "login";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      // On success the action redirects (handled by Next); on failure it
      // resolves to an error message.
      const err = await action(undefined, formData);
      if (err) setError(err);
    });
  }

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink">
          <span className="text-xl font-black text-paper">G</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-ink-muted">
          {isLogin
            ? "Sign in to pick up where you left off."
            : "Your progress syncs across every device."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder={isLogin ? "Your password" : "At least 8 characters"}
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Just a sec…" : isLogin ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="font-semibold text-accent-ink"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </main>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      <input
        required
        className="rounded-2xl bg-paper px-4 py-3.5 text-ink ring-1 ring-line outline-none transition placeholder:text-ink-faint focus:ring-2 focus:ring-accent"
        {...props}
      />
    </label>
  );
}
