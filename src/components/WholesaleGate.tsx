"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACK_KEY = "biggystone_wholesale_ack";

/**
 * Retail shoppers were landing here by mistake and buying bulk/reseller
 * pieces instead of the regular shop - this stops them before they see any
 * products, rather than relying on them to notice MOQ/dozen pricing on
 * their own. Remembered per browser (via localStorage) so a real reseller
 * only sees it once, not on every visit.
 */
export default function WholesaleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [showGate, setShowGate] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(ACK_KEY) === "1") {
        setShowGate(false);
      }
    } catch {
      // localStorage unavailable - fall back to always showing the gate.
    }
    setReady(true);
  }, []);

  function continueToWholesale() {
    try {
      window.localStorage.setItem(ACK_KEY, "1");
    } catch {}
    setShowGate(false);
  }

  if (!ready) return null;
  if (!showGate) return <>{children}</>;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-xl font-bold">Is this what you&apos;re looking for?</h1>
      <p className="mt-3 text-sm text-neutral-600">
        This page is for <strong>bulk, reseller pre-orders</strong> -
        minimum order quantities and dozen-rate pricing apply, and pieces
        are made/sourced to order, so delivery takes longer than usual.
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        Just shopping for yourself? You want the regular shop instead.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/shop")}
          className="w-full rounded-full bg-brand-black px-6 py-3 text-sm text-brand-gold-light"
        >
          Take me to the regular shop →
        </button>
        <button type="button" onClick={continueToWholesale} className="text-sm text-neutral-500 underline">
          I&apos;m a reseller - continue to wholesale pre-order
        </button>
      </div>
    </div>
  );
}
