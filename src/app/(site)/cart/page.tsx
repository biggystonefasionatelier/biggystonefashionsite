"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const [categoryMoq, setCategoryMoq] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/category-moq")
      .then((r) => r.json())
      .then((data) => setCategoryMoq(data.categoryMoq ?? {}));
  }, []);

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
  const canCheckout = shortCategories.length === 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Your cart</h1>

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
        </div>
      )}

      <div className="mt-6 divide-y divide-black/10">
        {items.map((item) => (
          <div key={item.productId + (item.color ?? "")} className="flex items-center gap-4 py-4">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              {item.color && <p className="text-xs text-neutral-500">Color: {item.color}</p>}
              <p className="text-sm text-neutral-500">₦{item.price.toLocaleString()}</p>
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
        ))}
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
            Add more pieces to meet the minimum order shown above before checking out.
          </p>
        </>
      )}
    </div>
  );
}
