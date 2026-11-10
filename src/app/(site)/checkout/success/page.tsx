"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { trackPurchase } from "@/lib/analytics";
import { formatOrderNumber } from "@/lib/formatOrderNumber";

type VerifyState = "checking" | "paid" | "failed" | "error";

type GiftInfo = { name: string; code: string | null; qualifyingOrderNumber: number | null };

function SuccessContent() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const { clear } = useCart();
  const [state, setState] = useState<VerifyState>(reference ? "checking" : "error");
  const [gift, setGift] = useState<GiftInfo | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  useEffect(() => {
    if (!reference) return;

    fetch(`/api/checkout/verify?reference=${encodeURIComponent(reference)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "paid") {
          setState("paid");
          setOrderNumber(data.order?.order_number ?? null);
          clear();

          // Guard against double-counting the same order if this page is
          // refreshed (the verify call above is safe to repeat, but the ad
          // pixel shouldn't fire twice for one purchase).
          const trackedKey = `biggystone_purchase_tracked_${reference}`;
          if (data.order?.total && !sessionStorage.getItem(trackedKey)) {
            trackPurchase(data.order.total, reference);
            sessionStorage.setItem(trackedKey, "1");
          }

          if (data.order?.gift_number) {
            setGift({
              name: data.order.gift_name,
              code: data.order.gift_voucher_code ?? null,
              qualifyingOrderNumber: data.order.gift_order_number ?? null,
            });
          }
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
          {orderNumber && (
            <p className="mt-1 text-xs text-neutral-500">Order {formatOrderNumber(orderNumber)}</p>
          )}
          <p className="mt-3 text-sm text-neutral-600">
            A confirmation has been sent to your email. We&apos;ll reach out
            with delivery details shortly.
          </p>
          {gift && (
            <div className="mt-6 rounded-xl border border-brand-gold/60 bg-brand-gold/10 p-5 text-left">
              <p className="text-sm font-bold">
                🎉 {gift.qualifyingOrderNumber
                  ? `Your ${gift.qualifyingOrderNumber}th qualifying order`
                  : "Loyalty milestone"}{" "}
                earned you a gift!
              </p>
              <p className="mt-1 text-sm">{gift.name}</p>
              {gift.code ? (
                <>
                  <p className="mt-3 text-xs text-neutral-600">
                    Your one-time code — enter this at checkout on a future order:
                  </p>
                  <p className="mt-1 text-lg font-bold tracking-wide">{gift.code}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    We&apos;ve also emailed this to you so it isn&apos;t lost.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-xs text-neutral-500">
                  This will be included with your order. Thank you for being a loyal customer!
                </p>
              )}
            </div>
          )}

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
