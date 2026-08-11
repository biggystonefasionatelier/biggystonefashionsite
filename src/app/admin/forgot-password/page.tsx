"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message ?? "If that email is registered, a password reset link has been sent to it.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4">
      <div className="w-full max-w-sm rounded-xl border border-brand-gold/40 bg-black p-8 text-brand-gold-light">
        <h1 className="text-center text-lg font-bold tracking-wide">
          BIGGYSTONE
          <span className="mt-1 block text-[10px] font-normal tracking-[3px] text-brand-gold">
            ADMIN
          </span>
        </h1>

        {message ? (
          <>
            <p className="mt-6 text-sm text-brand-gold-light/90">{message}</p>
            <p className="mt-4 text-sm text-brand-gold-light/90">
              Check your email for the reset link — it expires in 1 hour.
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
            <p className="text-sm text-brand-gold-light/70">
              Enter the email on your admin account and we&apos;ll send a link to reset your
              password.
            </p>
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="rounded-md border border-brand-gold/40 bg-transparent px-3 py-2 text-sm placeholder:text-brand-gold-light/40"
            />
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-full bg-brand-gold py-2 text-sm font-medium text-brand-black disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send reset link"}
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </form>
        )}

        <Link
          href="/admin/login"
          className="mt-6 block text-center text-xs text-brand-gold-light/70 hover:text-brand-gold-light"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
