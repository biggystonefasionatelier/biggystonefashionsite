"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Incorrect email or password.");
        setSubmitting(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-brand-gold/40 bg-black p-8 text-brand-gold-light"
      >
        <h1 className="text-center text-lg font-bold tracking-wide">
          BIGGYSTONE
          <span className="mt-1 block text-[10px] font-normal tracking-[3px] text-brand-gold">
            ADMIN
          </span>
        </h1>

        <div className="mt-6 grid gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="rounded-md border border-brand-gold/40 bg-transparent px-3 py-2 text-sm placeholder:text-brand-gold-light/40"
          />
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Password"
              className="w-full rounded-md border border-brand-gold/40 bg-transparent px-3 py-2 pr-16 text-sm placeholder:text-brand-gold-light/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 text-xs text-brand-gold-light/70 hover:text-brand-gold-light"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-brand-gold py-2 text-sm font-medium text-brand-black disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <Link
          href="/admin/forgot-password"
          className="mt-4 block text-center text-xs text-brand-gold-light/70 hover:text-brand-gold-light"
        >
          Forgot password?
        </Link>
      </form>
    </div>
  );
}
