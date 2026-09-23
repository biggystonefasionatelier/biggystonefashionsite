"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

// Same business number as the site-wide WhatsApp button. No number-less
// wa.me link here (that opens a contact picker) - this one goes straight
// to Faith, since it's an inquiry meant for her specifically.
const WHATSAPP_NUMBER = "2348148263705";

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
      interestType: String(form.get("interestType") ?? "wholesale"),
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
      // Send the actual inquiry straight to Faith's WhatsApp, pre-filled,
      // so she can respond from her phone immediately instead of waiting
      // to check email/admin - the whole point of this over the old
      // Telegram redirect, which didn't get her the details at all.
      const whatsappMessage = [
        `Hi Biggystone! I'm interested in wholesale.`,
        `Name: ${payload.name}`,
        payload.businessName ? `Business: ${payload.businessName}` : null,
        `Interested in: ${payload.interestType === "wholesale" ? "Wholesale (available pieces)" : "Pre-Order Wholesale"}`,
        `Quantity interested: ${payload.quantityInterested}`,
        payload.message ? `Note: ${payload.message}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

      (e.target as HTMLFormElement).reset();
      setTimeout(() => {
        window.location.href = whatsappHref;
      }, 1500);
    } catch {
      setErrorMsg("Network error. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="rounded-lg bg-brand-gold-light/40 p-4 text-sm text-neutral-800">
        Got it — opening WhatsApp so you can send us your details directly
        for a quick reply.
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
      <div className="rounded-md border border-black/15 p-3 text-sm sm:col-span-2">
        <p className="text-xs font-medium text-neutral-700">
          Which are you interested in?
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2">
            <input type="radio" name="interestType" value="wholesale" defaultChecked required />
            Wholesale (available pieces)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="interestType" value="pre_order" required />
            Pre-Order Wholesale
          </label>
        </div>
      </div>
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
