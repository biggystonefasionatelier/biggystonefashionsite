"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";

type VerifyState = "checking" | "paid" | "failed" | "error";

function SuccessContent() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const { clear } = useCart();
  const [state, setState] = useState<VerifyState>(reference ? "checking" : "error");

  useEffect(() => {
    if (!reference) return;

    fetch(`/api/checkout/verify?reference=${encodeURIComponent(reference)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "paid") {
          setState("paid");
          clear();
        } else {
          setState("failed");
        }
      })
      .catch(() => setState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      {state === "checking" && <p>Confirming your payment...</p>}

      {state === "paid" && (
        <>
          <h1 className="text-2xl font-bold">Thank you — your order is confirmed</h1>
          <p className="mt-3 text-sm text-neutral-600">
            A confirmation has been sent to your email. We&apos;ll reach out
            with delivery details shortly.
          </p>
          <Link href="/shop" className="mt-6 inline-block underline">
            Keep shopping →
          </Link>
        </>
      )}

      {state === "failed" && (
        <>
          <h1 className="text-2xl font-bold">Payment not confirmed</h1>
          <p className="mt-3 text-sm text-neutral-600">
            We couldn&apos;t confirm this payment. If money left your
            account, contact us on WhatsApp (+234 814 826 3705) with your
            reference: <span className="font-mono">{reference}</span>
          </p>
        </>
      )}

      {state === "error" && (
        <>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-3 text-sm text-neutral-600">
            We couldn&apos;t verify this payment automatically. Contact us on
            WhatsApp (+234 814 826 3705) and we&apos;ll check manually.
          </p>
        </>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="px-4 py-20 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
