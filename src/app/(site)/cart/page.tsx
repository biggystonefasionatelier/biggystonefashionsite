"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Your cart</h1>

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

      <Link
        href="/checkout"
        className="mt-6 block w-full rounded-full bg-brand-black py-3 text-center text-sm text-brand-gold-light"
      >
        Proceed to checkout
      </Link>
    </div>
  );
}
