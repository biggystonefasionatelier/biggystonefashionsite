"use client";

import { useState } from "react";
import { useCart } from "@/components/CartContext";
import type { Product } from "@/lib/products";

export default function PreorderProductCard({
  product,
  categoryMoq,
}: {
  product: Product;
  categoryMoq?: number;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const hasColors = !!product.colors && product.colors.length > 0;
  const [color, setColor] = useState(hasColors ? "" : undefined);

  function handleAdd() {
    if (hasColors && !color) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: Math.max(1, quantity),
      imageUrl: product.image_url ?? undefined,
      orderType: "wholesale",
      color: color || undefined,
      category: product.category ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="rounded-xl border border-black/10 p-3">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            Photo coming soon
          </div>
        )}
      </div>
      <p className="mt-3 font-medium">{product.name}</p>
      <p className="text-sm text-black">₦{product.price.toLocaleString()} / unit</p>
      {!!categoryMoq && (
        <p className="text-xs text-black">
          {product.category} minimum: {categoryMoq} pieces total (mix any designs)
        </p>
      )}

      {hasColors && (
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="mt-2 w-full rounded-md border border-black/15 px-2 py-1.5 text-sm"
        >
          <option value="">Choose a color…</option>
          {product.colors!.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="w-16 rounded-md border border-black/15 px-2 py-1.5 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={hasColors && !color}
          className="flex-1 rounded-full bg-brand-black py-1.5 text-sm text-brand-gold-light disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
        >
          {added ? "Added ✓" : "Add"}
        </button>
      </div>
    </div>
  );
}
