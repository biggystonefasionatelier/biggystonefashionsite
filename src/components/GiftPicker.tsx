"use client";

import { useState } from "react";

const NUMBERS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function GiftPicker({ reference }: { reference: string }) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const [gift, setGift] = useState<{ number: number; name: string; description: string } | null>(
    null
  );
  const [voucherCode, setVoucherCode] = useState<string | null>(null);

  async function pick(number: number) {
    setPicking(true);
    setError("");

    try {
      const res = await fetch("/api/loyalty/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, giftNumber: number }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setPicking(false);
        return;
      }

      setGift(data.gift);
      setVoucherCode(data.voucherCode ?? null);
    } catch {
      setError("Network error. Please try again.");
      setPicking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 text-center">
        {gift ? (
          <>
            <p className="text-sm text-neutral-500">You picked #{gift.number} —</p>
            <h2 className="mt-1 text-xl font-bold">{gift.name}</h2>
            {gift.description && (
              <p className="mt-2 text-sm text-neutral-600">{gift.description}</p>
            )}
            {voucherCode ? (
              <div className="mt-4 rounded-lg border border-brand-gold/60 bg-brand-gold/10 p-3">
                <p className="text-xs text-neutral-600">
                  Your one-time code — enter this at checkout on a future order:
                </p>
                <p className="mt-1 text-lg font-bold tracking-wide">{voucherCode}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  We&apos;ve also emailed this to you so it isn&apos;t lost.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-xs text-neutral-500">
                This will be included with your order. Thank you for being a loyal customer!
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">🎉 You&apos;ve earned a free gift!</h2>
            <p className="mt-2 text-sm text-neutral-600">
              As a thank-you for your continued support, pick a number below to reveal your
              surprise gift.
            </p>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {NUMBERS.map((number) => (
                <button
                  key={number}
                  onClick={() => pick(number)}
                  disabled={picking}
                  className="aspect-square rounded-lg border border-brand-gold/60 text-lg font-semibold hover:bg-brand-gold/10 disabled:opacity-50"
                >
                  {number}
                </button>
              ))}
            </div>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
