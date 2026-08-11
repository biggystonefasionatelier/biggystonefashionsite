"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const PRE_ORDER_LANDING_URL = "https://shop.biggystonefashion.com";

export default function WholesaleInquiryForm() {
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
      businessName: String(form.get("businessName") ?? ""),
      quantityInterested: String(form.get("quantityInterested") ?? ""),
      message: String(form.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/wholesale-inquiry", {
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
      // Send them straight into the pre-order Telegram circle while
      // they're a hot lead, right after the enquiry goes through - a
      // short pause so they still see the confirmation before leaving.
      setTimeout(() => {
        window.location.href = PRE_ORDER_LANDING_URL;
      }, 1500);
    } catch {
      setErrorMsg("Network error. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-lg bg-brand-gold-light/40 p-4 text-sm text-neutral-800">
        Got it — Taking you to our pre-order circle now for the pricing and
        next steps.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input
        name="name"
        required
        maxLength={100}
        placeholder="Your name"
        className="rounded-md border border-black/15 px-3 py-2 text-sm"
      />
      <input
        name="phone"
        required
        maxLength={20}
        placeholder="Phone / WhatsApp number"
        className="rounded-md border border-black/15 px-3 py-2 text-sm"
      />
      <input
        name="email"
        type="email"
        required
        maxLength={200}
        placeholder="Email"
        className="rounded-md border border-black/15 px-3 py-2 text-sm"
      />
      <input
        name="businessName"
        maxLength={150}
        placeholder="Business name (optional)"
        className="rounded-md border border-black/15 px-3 py-2 text-sm"
      />
      <input
        name="quantityInterested"
        required
        maxLength={100}
        placeholder="Roughly how many pieces are you interested in?"
        className="rounded-md border border-black/15 px-3 py-2 text-sm sm:col-span-2"
      />
      <textarea
        name="message"
        maxLength={1000}
        placeholder="Anything else we should know? (optional)"
        rows={3}
        className="rounded-md border border-black/15 px-3 py-2 text-sm sm:col-span-2"
      />

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-full bg-brand-black px-6 py-2 text-sm text-brand-gold-light disabled:opacity-60 sm:col-span-2"
      >
        {status === "submitting" ? "Sending..." : "Send inquiry"}
      </button>

      {status === "error" && (
        <p className="text-xs text-red-600 sm:col-span-2">{errorMsg}</p>
      )}
    </form>
  );
}
