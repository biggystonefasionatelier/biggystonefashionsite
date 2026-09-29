"use client";

import { useEffect, useState } from "react";
import { FLASH_SALE, isFlashSaleActive, flashSaleEndLabel } from "@/lib/flashSale";
import { PROMO, isPromoActive, promoDaysRemaining } from "@/lib/promo";
import SignupForm from "./SignupForm";

// See SignupPopup.tsx for why this suppresses per-session instead of
// permanently on close - same fix, same reasoning.
const DISMISSED_KEY = "biggystone_sale_popup_dismissed";
const SIGNED_UP_KEY = "biggystone_sale_popup_signed_up";
const SHOW_DELAY_MS = 3000;

export default function SalePopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(SIGNED_UP_KEY)) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!visible) return null;

  // The flash sale (automatic, no code, better deal) takes priority over
  // the older September code-based promo whenever both happen to be
  // active at once - showing both at the same time would just confuse
  // shoppers about which discount actually applies.
  const flashSaleActive = isFlashSaleActive();
  const daysLeft = promoDaysRemaining();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-sm rounded-xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 text-lg text-neutral-400 hover:text-neutral-700"
        >
          ✕
        </button>

        {flashSaleActive ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
              Flash Sale — ends {flashSaleEndLabel()}
            </p>
            <h2 className="mt-1 pr-6 text-lg font-bold">
              {FLASH_SALE.percent}% off pieces ₦{FLASH_SALE.minPrice.toLocaleString()} and up
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Prices are already discounted across the shop — no code needed.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
              September Sale — {daysLeft} {daysLeft === 1 ? "day" : "days"} left
            </p>
            <h2 className="mt-1 pr-6 text-lg font-bold">{PROMO.percent}% off everything</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Use code <strong className="font-mono">{PROMO.code}</strong> at checkout. Plus free
              delivery on any order ₦{PROMO.freeDeliveryThreshold.toLocaleString()} and above — no
              code needed.
            </p>
          </>
        )}

        <p className="mt-4 text-xs text-neutral-500">
          Drop your details for first access to new drops too:
        </p>
        <div className="mt-2">
          <SignupForm compact onSuccess={() => localStorage.setItem(SIGNED_UP_KEY, "1")} />
        </div>
      </div>
    </div>
  );
}
