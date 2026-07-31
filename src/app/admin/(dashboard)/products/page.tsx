"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-brand-black px-4 py-2 text-sm text-brand-gold-light"
        >
          + Add product
        </Link>
      </div>

      {!products ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No products yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 capitalize">{p.product_type}</td>
                  <td className="px-4 py-3">₦{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">{p.stock}</td>
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
