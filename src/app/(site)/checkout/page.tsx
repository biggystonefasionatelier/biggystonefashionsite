"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [depositOnly, setDepositOnly] = useState(false);

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
          <input
            name="discountCode"
            maxLength={50}
            placeholder="Discount code (optional)"
            className="rounded-md border border-black/15 px-3 py-2 text-sm uppercase placeholder:normal-case"
          />
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
