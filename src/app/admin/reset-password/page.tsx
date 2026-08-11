"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/admin/login"), 2500);
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <p className="mt-6 text-sm text-brand-gold-light/90">
        This link is missing its reset token. Request a new one from the{" "}
        <Link href="/admin/forgot-password" className="underline">
          forgot password
        </Link>{" "}
        page.
      </p>
    );
  }

  if (done) {
    return (
      <p className="mt-6 text-sm text-brand-gold-light/90">
        Password updated. Taking you to sign in...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
      <input
        name="newPassword"
        type="password"
        required
        minLength={10}
        placeholder="New password (min 10 characters)"
        className="rounded-md border border-brand-gold/40 bg-transparent px-3 py-2 text-sm placeholder:text-brand-gold-light/40"
      />
      <input
        name="confirmPassword"
        type="password"
        required
        minLength={10}
        placeholder="Confirm new password"
        className="rounded-md border border-brand-gold/40 bg-transparent px-3 py-2 text-sm placeholder:text-brand-gold-light/40"
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-full bg-brand-gold py-2 text-sm font-medium text-brand-black disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Set new password"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4">
      <div className="w-full max-w-sm rounded-xl border border-brand-gold/40 bg-black p-8 text-brand-gold-light">
        <h1 className="text-center text-lg font-bold tracking-wide">
          BIGGYSTONE
          <span className="mt-1 block text-[10px] font-normal tracking-[3px] text-brand-gold">
            ADMIN
          </span>
        </h1>

        <Suspense fallback={<p className="mt-6 text-sm text-brand-gold-light/70">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
