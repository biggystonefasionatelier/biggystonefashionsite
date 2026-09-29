"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";

export default function PreorderProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) =>
        setProducts((data.products ?? []).filter((p: Product) => p.product_type === "wholesale"))
      );
  }, []);

  const query = search.trim().toLowerCase();
  const filtered =
    products && query
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) || (p.category ?? "").toLowerCase().includes(query)
        )
      : products;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          Pre-order pieces only. Retail listings are managed from the main{" "}
          <Link href="/admin/products" className="underline">
            Products
          </Link>{" "}
          page.
        </p>
        <Link
          href="/admin/products/new?type=wholesale"
          className="rounded-full bg-brand-black px-4 py-2 text-sm text-brand-gold-light"
        >
          + Add pre-order piece
        </Link>
      </div>

      {products && products.length > 0 && (
        <div className="mt-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pre-order pieces by name or category..."
            className="w-full max-w-sm rounded-md border border-black/15 px-3 py-2 text-sm"
          />
          {query && (
            <p className="mt-1 text-xs text-neutral-500">
              {filtered?.length ?? 0} of {products.length} piece{products.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      {!products ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No pre-order pieces yet.</p>
      ) : filtered && filtered.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No pieces match &quot;{search.trim()}&quot;.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(filtered ?? []).map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.category || "—"}</td>
                  <td className="px-4 py-3">₦{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">{p.active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}/edit`} className="underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
