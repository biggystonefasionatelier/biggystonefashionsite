"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";

const LOCAL_FEES = { unilag: 1000, bariga: 500, iwaya: 1500 } as const;
type LocalArea = keyof typeof LOCAL_FEES;
type DeliveryMethod = "pickup" | "local" | "nationwide";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [depositOnly, setDepositOnly] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [deliveryArea, setDeliveryArea] = useState<LocalArea>("bariga");
  const isFridayToday = new Date().getDay() === 5;

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
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          address: String(form.get("address") ?? ""),
          city: String(form.get("city") ?? ""),
          orderType,
          depositOnly,
          discountCode: String(form.get("discountCode") ?? ""),
          deliveryMethod: orderType === "retail" ? deliveryMethod : undefined,
          deliveryArea: orderType === "retail" && deliveryMethod === "local" ? deliveryArea : undefined,
          deliveryNote: String(form.get("deliveryNote") ?? ""),
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
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
            <input
              name="discountCode"
              maxLength={50}
              placeholder="Discount code (optional)"
              className="rounded-md border border-black/15 px-3 py-2 text-sm uppercase placeholder:normal-case"
            />

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
                    checked={deliveryMethod === "local"}
                    onChange={() => setDeliveryMethod("local")}
                  />
                  Local delivery — Unilag / Bariga / Iwaya & environs
                </label>
                {deliveryMethod === "local" && (
                  <div className="ml-6 grid gap-1">
                    {(Object.keys(LOCAL_FEES) as LocalArea[]).map((area) => (
                      <label key={area} className="flex items-center gap-2 text-neutral-600">
                        <input
                          type="radio"
                          name="deliveryAreaChoice"
                          checked={deliveryArea === area}
                          onChange={() => setDeliveryArea(area)}
                        />
                        <span className="capitalize">{area}</span> — {" "}
                        {isFridayToday ? (
                          <span className="text-green-700">Free today (Friday delivery)</span>
                        ) : (
                          `₦${LOCAL_FEES[area].toLocaleString()}`
                        )}
                      </label>
                    ))}
                    <p className="text-xs text-neutral-500">
                      Local delivery is always free on Fridays.
                    </p>
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethodChoice"
                    checked={deliveryMethod === "nationwide"}
                    onChange={() => setDeliveryMethod("nationwide")}
                  />
                  Nationwide shipping
                </label>
                {deliveryMethod === "nationwide" && (
                  <p className="ml-6 text-xs text-neutral-500">
                    Shipping cost depends on your location — we&apos;ll confirm it with you on
                    WhatsApp before your order is dispatched.
                  </p>
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
