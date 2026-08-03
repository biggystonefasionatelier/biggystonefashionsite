"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function SignupForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      birthday: String(form.get("birthday") ?? ""),
    };

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setErrorMsg("Network error. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-lg bg-brand-gold-light/40 p-4 text-sm text-neutral-800">
        You&apos;re on the list — watch your inbox for the September discount code.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="block text-xs text-neutral-500" htmlFor="signup-name">
          Name
        </label>
        <input
          id="signup-name"
          name="name"
          required
          maxLength={100}
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          placeholder="Your name"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-neutral-500" htmlFor="signup-email">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          maxLength={200}
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          placeholder="you@email.com"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-neutral-500" htmlFor="signup-phone">
          Phone number
        </label>
        <input
          id="signup-phone"
          name="phone"
          type="tel"
          required
          maxLength={20}
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          placeholder="080..."
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-neutral-500" htmlFor="signup-birthday">
          Birthday
        </label>
        <input
          id="signup-birthday"
          name="birthday"
          type="date"
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-full bg-brand-black px-6 py-2 text-sm text-brand-gold-light disabled:opacity-60"
      >
        {status === "submitting" ? "Joining..." : "Join the list"}
      </button>

      {status === "error" && (
        <p className="w-full text-xs text-red-600">{errorMsg}</p>
      )}
    </form>
  );
}
