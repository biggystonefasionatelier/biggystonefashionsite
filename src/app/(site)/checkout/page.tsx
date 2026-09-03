"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { DELIVERY_ZONES, type DeliveryZone } from "@/lib/delivery";
import { calculateBundleDiscount } from "@/lib/bundleDiscount";

type DeliveryMethod = "pickup" | "delivery";

const ZONE_GROUPS = ["Lagos Mainland", "Lagos Island", "Outside Lagos"] as const;

// Leads with actual place names instead of the internal "Island 1" /
// "Mainland 3" labels, which look identical to customers with no way to
// tell which one matches where they live.
function zoneOptionLabel(zone: DeliveryZone): string {
  const preview = zone.areas.slice(0, 3).join(", ");
  const extra = zone.areas.length > 3 ? ` +${zone.areas.length - 3} more` : "";
  return `${preview}${extra} — ₦${zone.fee.toLocaleString()} (${zone.eta})`;
}

type DiscountPreviewState = {
  status: "idle" | "loading" | "applied" | "error";
  message: string;
};

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [depositOnly, setDepositOnly] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [deliveryZone, setDeliveryZone] = useState(DELIVERY_ZONES[0].id);
  const [email, setEmail] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPreview, setDiscountPreview] = useState<DiscountPreviewState>({
    status: "idle",
    message: "",
  });
  const selectedZone = DELIVERY_ZONES.find((z) => z.id === deliveryZone);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/shop" className="mt-4 inline-block underline">
          Go shopping →
        </Link>
      </div>
    );
  }

  const orderTypes = new Set(items.map((i) => i.orderType));
  const mixedCart = orderTypes.size > 1;
  const orderType = items[0].orderType;
  const bundleDiscount =
    orderType === "retail"
      ? calculateBundleDiscount(
          items.map((i) => ({ productId: i.productId, price: i.price, quantity: i.quantity }))
        )
      : 0;

  async function handlePreviewDiscount() {
    const code = discountCode.trim();
    if (!code) {
      setDiscountPreview({ status: "idle", message: "" });
      return;
    }
    if (!email.trim()) {
      setDiscountPreview({ status: "error", message: "Enter your email above first, then we can check this code." });
      return;
    }

    setDiscountPreview({ status: "loading", message: "" });

    try {
      const res = await fetch("/api/checkout/preview-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          orderType,
          discountCode: code,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, color: i.color })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDiscountPreview({ status: "error", message: data.error ?? "That code didn't work." });
        return;
      }

      let message: string;
      if (data.freeDelivery) {
        message = "✓ Free delivery will be applied to this order.";
      } else if (data.isReferral) {
        message = `You have ₦${Number(data.referralBalance).toLocaleString()} available — ₦${Number(data.discountAmount).toLocaleString()} will be applied to this order.`;
      } else {
        message = `✓ ₦${Number(data.discountAmount).toLocaleString()} off will be applied to this order.`;
      }
      setDiscountPreview({ status: "applied", message });
    } catch {
      setDiscountPreview({ status: "error", message: "Network error. Couldn't check that code." });
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: String(form.get("customerName") ?? ""),
          email,
          phone: String(form.get("phone") ?? ""),
          address: String(form.get("address") ?? ""),
          city: String(form.get("city") ?? ""),
          orderType,
          depositOnly,
          discountCode,
          deliveryMethod: orderType === "retail" ? deliveryMethod : undefined,
          deliveryZone: orderType === "retail" && deliveryMethod === "delivery" ? deliveryZone : undefined,
          deliveryNote: String(form.get("deliveryNote") ?? ""),
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, color: i.color })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Checkout failed. Please try again.");
        setSubmitting(false);
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch {
      setError("Network error. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (mixedCart) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Checkout separately, please</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Your cart has both retail and pre-order wholesale items. They ship
          on different timelines, so please check out each type separately.
        </p>
        <Link href="/cart" className="mt-4 inline-block underline">
          Back to cart →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {orderType === "wholesale" ? "Pre-order wholesale" : "Retail"} order —
        subtotal ₦{subtotal.toLocaleString()}
      </p>
      {bundleDiscount > 0 && (
        <p className="mt-1 text-sm font-medium text-brand-gold">
          📦 Buy-3 bundle discount applied — ₦{bundleDiscount.toLocaleString()} off
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
        <input
          name="customerName"
          required
          maxLength={150}
          placeholder="Full name"
          className="rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          required
          maxLength={200}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          name="address"
          required
          maxLength={500}
          placeholder="Delivery address (or 'Unilag pickup')"
          className="rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <input
          name="city"
          required
          maxLength={100}
          placeholder="City"
          className="rounded-md border border-black/15 px-3 py-2 text-sm"
        />

        {orderType === "wholesale" && (
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={depositOnly}
              onChange={(e) => setDepositOnly(e.target.checked)}
            />
            Pay deposit now, balance before delivery
          </label>
        )}

        {orderType === "retail" && (
          <>
            <div>
              <div className="flex gap-2">
                <input
                  name="discountCode"
                  maxLength={50}
                  placeholder="Discount code (optional)"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase());
                    setDiscountPreview({ status: "idle", message: "" });
                  }}
                  onBlur={handlePreviewDiscount}
                  className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm uppercase placeholder:normal-case"
                />
                <button
                  type="button"
                  onClick={handlePreviewDiscount}
                  disabled={discountPreview.status === "loading" || !discountCode.trim()}
                  className="rounded-md border border-black/15 px-4 py-2 text-sm disabled:opacity-40"
                >
                  {discountPreview.status === "loading" ? "Checking..." : "Apply"}
                </button>
              </div>
              {discountPreview.status === "applied" && (
                <p className="mt-1 text-xs font-medium text-green-700">{discountPreview.message}</p>
              )}
              {discountPreview.status === "error" && (
                <p className="mt-1 text-xs text-red-600">{discountPreview.message}</p>
              )}
            </div>

            <div className="rounded-md border border-black/15 p-3">
              <p className="text-xs font-medium text-neutral-700">Pickup or delivery?</p>
              <div className="mt-2 grid gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethodChoice"
                    checked={deliveryMethod === "pickup"}
                    onChange={() => setDeliveryMethod("pickup")}
                  />
                  Pickup (free)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethodChoice"
                    checked={deliveryMethod === "delivery"}
                    onChange={() => setDeliveryMethod("delivery")}
                  />
                  Delivery
                </label>

                {deliveryMethod === "delivery" && (
                  <div className="ml-6 grid gap-2">
                    <select
                      value={deliveryZone}
                      onChange={(e) => setDeliveryZone(e.target.value)}
                      className="rounded-md border border-black/15 px-2 py-2 text-sm"
                    >
                      {ZONE_GROUPS.map((group) => (
                        <optgroup key={group} label={group}>
                          {DELIVERY_ZONES.filter((z) => z.group === group).map((z) => (
                            <option key={z.id} value={z.id}>
                              {zoneOptionLabel(z)}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {selectedZone && (
                      <p className="text-xs text-neutral-500">
                        Covers: {selectedZone.areas.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <textarea
              name="deliveryNote"
              maxLength={500}
              rows={2}
              placeholder="Delivery note (optional) — landmark, preferred time, etc."
              className="rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </>
        )}

        <p className="text-xs text-neutral-500">
          By placing this order, you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/refunds" className="underline">
            Refund Policy
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-brand-black py-3 text-sm text-brand-gold-light disabled:opacity-60"
        >
          {submitting ? "Redirecting to payment..." : "Pay with Paystack"}
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
