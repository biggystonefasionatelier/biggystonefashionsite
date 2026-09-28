"use client";

import { useEffect, useState } from "react";

type CategoryMoq = { category: string; moq: number | null };

export default function PreorderMoqPage() {
  const [categories, setCategories] = useState<CategoryMoq[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});

  function load() {
    fetch("/api/admin/category-moq")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(category: string, moq: number) {
    setSaving(category);
    await fetch("/api/admin/category-moq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, moq }),
    });
    setSaving(null);
    setSavedAt((prev) => ({ ...prev, [category]: Date.now() }));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Pre-order minimum order (MOQ)</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        This is the minimum total pieces a customer must pre-order per
        category, mixing any designs they like within it - not a minimum
        per individual design. For example, a Brooches minimum of 10 means
        any 10 brooches together, not 10 of the same one. Set a category to
        0 for no minimum.
      </p>

      {!categories ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : (
        <div className="mt-6 max-w-md space-y-3">
          {categories.map((c) => (
            <div
              key={c.category}
              className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-4"
            >
              <p className="font-medium">{c.category}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  defaultValue={c.moq ?? 0}
                  onBlur={(e) => save(c.category, Math.max(0, Number(e.target.value) || 0))}
                  className="w-20 rounded-md border border-black/15 px-2 py-1.5 text-sm"
                />
                <span className="w-16 text-xs text-neutral-500">
                  {saving === c.category
                    ? "Saving..."
                    : savedAt[c.category]
                      ? "Saved ✓"
                      : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
