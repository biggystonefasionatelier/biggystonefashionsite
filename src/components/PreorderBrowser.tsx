"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PreorderProductCard from "./PreorderProductCard";
import type { Product } from "@/lib/products";

const PAGE_SIZE = 12;

export default function PreorderBrowser({
  products,
  categoryMoq,
}: {
  products: Product[];
  categoryMoq: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const gridTopRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = products.filter((p) => {
    const matchesCategory = category === "All" || p.category === category;
    const matchesQuery =
      query.trim() === "" || p.name.toLowerCase().includes(query.trim().toLowerCase());
    const min = minPrice.trim() === "" ? null : Number(minPrice);
    const max = maxPrice.trim() === "" ? null : Number(maxPrice);
    const matchesMin = min === null || Number.isNaN(min) || p.price >= min;
    const matchesMax = max === null || Number.isNaN(max) || p.price <= max;
    return matchesCategory && matchesQuery && matchesMin && matchesMax;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // A new search/category/price range is a new result set - always start
  // back on page 1 rather than leaving the shopper stranded on a page
  // number that may no longer exist.
  useEffect(() => {
    setPage(1);
  }, [query, category, minPrice, maxPrice]);

  function goToPage(n: number) {
    setPage(n);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <div ref={gridTopRef} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                category === c
                  ? "border-brand-black bg-brand-black text-brand-gold-light"
                  : "border-black/15 text-neutral-600 hover:border-black/30"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-neutral-500">Price:</span>
            <input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min ₦"
              aria-label="Minimum price"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 text-sm"
            />
            <span className="text-neutral-400">–</span>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max ₦"
              aria-label="Maximum price"
              className="w-24 rounded-md border border-black/15 px-2 py-1.5 text-sm"
            />
            {(minPrice || maxPrice) && (
              <button
                type="button"
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                }}
                className="text-xs text-neutral-500 underline"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pre-order pieces..."
            aria-label="Search pre-order pieces"
            className="w-full rounded-full border border-black/15 px-4 py-2 text-sm sm:w-56"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No pieces match that search.</p>
      ) : (
        <>
          <p className="mt-4 text-xs text-neutral-500">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            {totalPages > 1 && ` — page ${currentPage} of ${totalPages}`}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {paginated.map((product) => (
              <PreorderProductCard
                key={product.id}
                product={product}
                categoryMoq={product.category ? categoryMoq[product.category] : undefined}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  aria-current={n === currentPage ? "page" : undefined}
                  className={`h-8 w-8 rounded-full text-xs font-medium transition ${
                    n === currentPage
                      ? "bg-brand-black text-brand-gold-light"
                      : "border border-black/15 text-neutral-600 hover:border-black/30"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
