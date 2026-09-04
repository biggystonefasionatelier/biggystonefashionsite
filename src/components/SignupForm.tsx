"use client";

import { useState, type FormEvent } from "react";
import { REFERRAL_STORAGE_KEY } from "./ReferralCapture";

type Status = "idle" | "submitting" | "success" | "error";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function SignupForm({
  compact = false,
  onSuccess,
}: {
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = new FormData(e.currentTarget);
    const birthMonth = String(form.get("birthMonth") ?? "");
    const birthDay = String(form.get("birthDay") ?? "");
    // Prefer a ?ref= still sitting in the current URL, but fall back to
    // whatever ReferralCapture stashed in localStorage when they first
    // landed - by the time someone actually fills this form out they've
    // often browsed to another page, where the URL param is long gone.
    let referralCode = "";
    if (typeof window !== "undefined") {
      referralCode = new URLSearchParams(window.location.search).get("ref") ?? "";
      if (!referralCode) {
        try {
          referralCode = localStorage.getItem(REFERRAL_STORAGE_KEY) ?? "";
        } catch {
          // Corrupt/blocked storage - just proceed without a referral code.
        }
      }
    }
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      birthday: birthMonth && birthDay ? `${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}` : "",
      referralCode,
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
      onSuccess?.();
    } catch {
      setErrorMsg("Network error. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-lg bg-brand-gold-light/40 p-4 text-sm text-neutral-800">
        You&apos;re on the list — watch your inbox for new drops and your birthday surprise.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "flex flex-col gap-3" : "flex flex-col gap-3 sm:flex-row sm:items-end"}
    >
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
        <label className="block text-xs text-neutral-500">Birthday (no year needed)</label>
        <div className="mt-1 flex gap-2">
          <select
            name="birthMonth"
            defaultValue=""
            aria-label="Birth month"
            className="w-full rounded-md border border-black/15 px-2 py-2 text-sm"
          >
            <option value="">Month</option>
            {MONTHS.map((month, i) => (
              <option key={month} value={i + 1}>
                {month}
              </option>
            ))}
          </select>
          <select
            name="birthDay"
            defaultValue=""
            aria-label="Birth day"
            className="w-full rounded-md border border-black/15 px-2 py-2 text-sm"
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
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
