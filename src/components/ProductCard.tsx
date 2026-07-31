"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import type { Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.image_url ?? undefined,
      orderType: product.product_type,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="group rounded-xl border border-black/10 p-3 transition hover:shadow-md">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            Photo coming soon
          </div>
        )}
      </div>
      <p className="mt-3 font-medium">{product.name}</p>
      <p className="text-sm text-neutral-500">
        ₦{product.price.toLocaleString()}
      </p>
      <button
        onClick={handleAdd}
        disabled={product.stock <= 0}
        className="mt-2 w-full rounded-full bg-brand-black py-2 text-sm text-brand-gold-light disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
      >
        {product.stock <= 0 ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
      </button>
    </div>
  );
}
