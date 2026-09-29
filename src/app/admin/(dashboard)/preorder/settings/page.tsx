"use client";

import { useEffect, useState } from "react";

type CategorySetting = { category: string; moq: number | null; price: number | null };

export default function PreorderSettingsPage() {
  const [categories, setCategories] = useState<CategorySetting[] | null>(null);
  const [draftPrice, setDraftPrice] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const [applyMsg, setApplyMsg] = useState<Record<string, string>>({});

  function load() {
    fetch("/api/admin/category-moq")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function saveMoq(category: string, moq: number) {
    setSaving(category);
    await fetch("/api/admin/category-moq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, moq }),
    });
    setSaving(null);
    setSavedAt((prev) => ({ ...prev, [category]: Date.now() }));
    load();
  }

  async function applyPrice(category: string, moq: number) {
    const raw = draftPrice[category];
    const price = raw === undefined ? undefined : Math.max(0, Number(raw) || 0);
    if (price === undefined) return;

    setSaving(category);
    setApplyMsg((prev) => ({ ...prev, [category]: "" }));
    const res = await fetch("/api/admin/category-moq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, moq, price, applyPriceToExisting: true }),
    });
    const data = await res.json();
    setSaving(null);
    setSavedAt((prev) => ({ ...prev, [category]: Date.now() }));
    setApplyMsg((prev) => ({
      ...prev,
      [category]:
        typeof data.updatedCount === "number"
          ? `Updated ${data.updatedCount} piece${data.updatedCount === 1 ? "" : "s"}`
          : "",
    }));
    load();
  }

  return (
    <div>
      <h2 className="font-bold">Minimum order (MOQ) and price per category</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        MOQ is the minimum total pieces a customer must pre-order per
        category, mixing any designs they like within it - not a minimum
        per individual design. For example, a Brooches minimum of 10 means
        any 10 brooches together, not 10 of the same one. Set a category to
        0 for no minimum.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Setting a price and clicking <strong>Apply</strong> updates the
        price on every existing pre-order piece in that category at once -
        handy when a whole category needs to move to a new price.
      </p>

      {!categories ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : (
        <div className="mt-6 max-w-2xl space-y-3">
          {categories.map((c) => (
            <div
              key={c.category}
              className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="font-medium">{c.category}</p>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-neutral-500">
                  MOQ
                  <input
                    type="number"
                    min={0}
                    defaultValue={c.moq ?? 0}
                    onBlur={(e) => saveMoq(c.category, Math.max(0, Number(e.target.value) || 0))}
                    className="w-20 rounded-md border border-black/15 px-2 py-1.5 text-sm text-neutral-900"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-neutral-500">
                  Price ₦
                  <input
                    type="number"
                    min={0}
                    defaultValue={c.price ?? ""}
                    placeholder="—"
                    onChange={(e) =>
                      setDraftPrice((prev) => ({ ...prev, [c.category]: e.target.value }))
                    }
                    className="w-24 rounded-md border border-black/15 px-2 py-1.5 text-sm text-neutral-900"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => applyPrice(c.category, c.moq ?? 0)}
                  disabled={saving === c.category || draftPrice[c.category] === undefined}
                  className="rounded-full bg-brand-black px-3 py-1.5 text-xs text-brand-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Apply
                </button>
                <span className="w-32 text-xs text-neutral-500">
                  {saving === c.category
                    ? "Saving..."
                    : applyMsg[c.category] ||
                      (savedAt[c.category] ? "Saved ✓" : "")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
