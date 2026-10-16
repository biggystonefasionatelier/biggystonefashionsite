"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const [categoryMoq, setCategoryMoq] = useState<Record<string, number>>({});
  const [categoryDozenPrice, setCategoryDozenPrice] = useState<Record<string, number>>({});
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/category-moq")
      .then((r) => r.json())
      .then((data) => {
        setCategoryMoq(data.categoryMoq ?? {});
        setCategoryDozenPrice(data.categoryDozenPrice ?? {});
      });
  }, []);

  // Checked every time the cart's contents change, so a piece that gets
  // taken down while it's sitting in someone's cart is flagged right here
  // instead of only surfacing as a vague error at checkout.
  useEffect(() => {
    if (items.length === 0) {
      setUnavailableIds(new Set());
      return;
    }
    const ids = Array.from(new Set(items.map((i) => i.productId)));
    fetch("/api/products/check-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => r.json())
      .then((data) => setUnavailableIds(new Set(data.unavailable ?? [])))
      .catch(() => setUnavailableIds(new Set()));
  }, [items]);

  function removeAllUnavailable() {
    for (const item of items) {
      if (unavailableIds.has(item.productId)) removeItem(item.productId, item.color);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/shop" className="mt-4 inline-block underline">
          Go shopping →
        </Link>
      </div>
    );
  }

  // Pre-order minimums are per category (mix any designs), not per design -
  // see src/lib/categoryMoq.ts. Group wholesale items by category to show
  // progress toward each one's minimum before checkout even runs the same
  // check server-side.
  const wholesaleCategoryTotals = new Map<string, number>();
  for (const item of items) {
    if (item.orderType !== "wholesale") continue;
    const category = item.category ?? "Uncategorized";
    wholesaleCategoryTotals.set(category, (wholesaleCategoryTotals.get(category) ?? 0) + item.quantity);
  }
  const shortCategories = Array.from(wholesaleCategoryTotals.entries())
    .map(([category, total]) => ({ category, total, moq: categoryMoq[category] }))
    .filter((c) => c.moq && c.total < c.moq);
  const canCheckout = shortCategories.length === 0 && unavailableIds.size === 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Your cart</h1>

      {unavailableIds.size > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>
            {unavailableIds.size} item{unavailableIds.size === 1 ? "" : "s"} in your cart{" "}
            {unavailableIds.size === 1 ? "is" : "are"} no longer available (marked below).
          </span>
          <button type="button" onClick={removeAllUnavailable} className="shrink-0 font-medium underline">
            Remove {unavailableIds.size === 1 ? "it" : "them all"}
          </button>
        </div>
      )}

      {wholesaleCategoryTotals.size > 0 && (
        <div className="mt-4 rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm">
          <p className="font-medium">Pre-order minimums</p>
          <ul className="mt-2 space-y-1">
            {Array.from(wholesaleCategoryTotals.entries()).map(([category, total]) => {
              const moq = categoryMoq[category];
              const short = moq && total < moq;
              return (
                <li key={category} className={short ? "text-red-600" : "text-neutral-600"}>
                  {category}: {total}
                  {moq ? ` / ${moq} pieces` : " pieces"}
                  {short && ` — add ${moq! - total} more (any ${category.toLowerCase()} design)`}
                </li>
              );
            })}
          </ul>

          {Array.from(wholesaleCategoryTotals.entries()).some(([category]) => categoryDozenPrice[category]) && (
            <>
              <p className="mt-3 font-medium">Dozen pricing</p>
              <ul className="mt-2 space-y-1">
                {Array.from(wholesaleCategoryTotals.entries())
                  .filter(([category]) => categoryDozenPrice[category])
                  .map(([category, total]) => {
                    const dozenPrice = categoryDozenPrice[category];
                    const fullDozens = Math.floor(total / 12);
                    const remainder = total % 12;
                    return (
                      <li key={category} className="text-neutral-600">
                        {category}: {fullDozens > 0
                          ? `${fullDozens} dozen${fullDozens === 1 ? "" : "s"} at ₦${dozenPrice.toLocaleString()} each applied automatically`
                          : `add ${12 - remainder} more (any design) to unlock ₦${dozenPrice.toLocaleString()} for 12`}
                        {fullDozens > 0 && remainder > 0 && ` · ${remainder} more at the regular price`}
                      </li>
                    );
                  })}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="mt-6 divide-y divide-black/10">
        {items.map((item) => {
          const unavailable = unavailableIds.has(item.productId);
          return (
          <div
            key={item.productId + (item.color ?? "")}
            className={`flex items-center gap-4 py-4 ${unavailable ? "opacity-50" : ""}`}
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              {unavailable && (
                <p className="text-xs font-medium text-red-600">No longer available — remove to check out</p>
              )}
              {item.color && <p className="text-xs text-neutral-500">Color: {item.color}</p>}
              {item.originalPrice ? (
                <p className="text-sm">
                  <span className="mr-1.5 text-neutral-400 line-through">
                    ₦{item.originalPrice.toLocaleString()}
                  </span>
                  <span className="font-medium text-red-600">₦{item.price.toLocaleString()}</span>
                </p>
              ) : (
                <p className="text-sm text-neutral-500">₦{item.price.toLocaleString()}</p>
              )}
              {item.orderType === "wholesale" && (
                <p className="text-xs text-brand-gold">Pre-order wholesale</p>
              )}
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.productId, Number(e.target.value), item.color)}
              className="w-16 rounded-md border border-black/15 px-2 py-1 text-sm"
            />
            <button
              onClick={() => removeItem(item.productId, item.color)}
              className="text-xs text-neutral-500 underline"
            >
              Remove
            </button>
          </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-4">
        <p className="font-bold">Subtotal</p>
        <p className="font-bold">₦{subtotal.toLocaleString()}</p>
      </div>

      {canCheckout ? (
        <Link
          href="/checkout"
          className="mt-6 block w-full rounded-full bg-brand-black py-3 text-center text-sm text-brand-gold-light"
        >
          Proceed to checkout
        </Link>
      ) : (
        <>
          <button
            disabled
            className="mt-6 block w-full cursor-not-allowed rounded-full bg-neutral-300 py-3 text-center text-sm text-neutral-500"
          >
            Proceed to checkout
          </button>
          <p className="mt-2 text-center text-xs text-red-600">
            {unavailableIds.size > 0
              ? "Remove the no-longer-available item(s) marked above before checking out."
              : "Add more pieces to meet the minimum order shown above before checking out."}
          </p>
        </>
      )}
    </div>
  );
}
