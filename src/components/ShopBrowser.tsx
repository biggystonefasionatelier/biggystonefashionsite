"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/products";

const PAGE_SIZE = 12;

type StockStatus = "available" | "sold-out";

export default function ShopBrowser({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  // Defaults to "available" so a sold-out piece drops off the main shop
  // view entirely once it sells out, rather than lingering as a disabled
  // card - synced to ?status= in the URL so it's a page customers can link
  // or bookmark directly (e.g. .../shop?status=sold-out).
  const [status, setStatus] = useState<StockStatus>(
    searchParams.get("status") === "sold-out" ? "sold-out" : "available"
  );
  const [page, setPage] = useState(1);
  const gridTopRef = useRef<HTMLDivElement>(null);

  function changeStatus(next: StockStatus) {
    setStatus(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "available") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const availableCount = useMemo(() => products.filter((p) => p.stock > 0).length, [products]);
  const soldOutCount = useMemo(() => products.filter((p) => p.stock <= 0).length, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = products.filter((p) => {
    const matchesStatus = status === "available" ? p.stock > 0 : p.stock <= 0;
    const matchesCategory = category === "All" || p.category === category;
    const matchesQuery =
      query.trim() === "" || p.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesStatus && matchesCategory && matchesQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // A new search/category/status is a new result set - always start back on page 1.
  useEffect(() => {
    setPage(1);
  }, [query, category, status]);

  function goToPage(n: number) {
    setPage(n);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <div ref={gridTopRef} className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => changeStatus("available")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            status === "available"
              ? "bg-brand-black text-brand-gold-light"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Available ({availableCount})
        </button>
        <button
          type="button"
          onClick={() => changeStatus("sold-out")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            status === "sold-out"
              ? "bg-brand-black text-brand-gold-light"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Sold Out ({soldOutCount})
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
          className="w-full rounded-full border border-black/15 px-4 py-2 text-sm sm:w-56"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          {status === "sold-out"
            ? "Nothing sold out right now."
            : "No pieces match that search."}
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-neutral-500">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            {totalPages > 1 && ` — page ${currentPage} of ${totalPages}`}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {paginated.map((product) => (
              <ProductCard key={product.id} product={product} />
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
