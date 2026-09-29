"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "Earrings",
  "Neckpieces",
  "Bracelets",
  "Brooches",
  "Male Jewelry",
  "Rings",
  "Hair Accessories",
  "Sets",
  "Button Covers",
];

type Row = {
  file: File;
  previewUrl: string;
  name: string;
  category: string;
  price: string;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
};

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(16).slice(2, 8);
  return `${base}-${suffix}`;
}

export default function PreorderUploadPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [creating, setCreating] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newRows: Row[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name.replace(/\.[^.]+$/, ""),
      category: CATEGORIES[0],
      price: "",
      status: "idle",
    }));
    setRows((prev) => [...prev, ...newRows]);
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function createAll() {
    setCreating(true);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status === "done") continue;
      if (!row.name.trim() || !row.price || Number(row.price) <= 0) {
        updateRow(i, { status: "error", error: "Name and price are required" });
        continue;
      }

      updateRow(i, { status: "uploading", error: undefined });
      try {
        const body = new FormData();
        body.append("file", row.file);
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");

        const createRes = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name.trim(),
            slug: slugify(row.name.trim()),
            price: Number(row.price),
            category: row.category,
            productType: "wholesale",
            stock: 0,
            imageUrl: uploadData.url,
            active: true,
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.error ?? "Create failed");

        updateRow(i, { status: "done" });
      } catch (err) {
        updateRow(i, {
          status: "error",
          error: err instanceof Error ? err.message : "Something went wrong",
        });
      }
    }
    setCreating(false);
  }

  const allDone = rows.length > 0 && rows.every((r) => r.status === "done");

  return (
    <div>
      <p className="max-w-2xl text-sm text-neutral-600">
        Pick several photos at once, fill in a name, category and price for
        each, then create them all as pre-order pieces in one go - no need
        to add them one at a time in the main Products form.
      </p>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="mt-4 block text-sm"
      />

      {rows.length > 0 && (
        <div className="mt-6 space-y-3">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.previewUrl}
                alt=""
                className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
              />
              <input
                value={row.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                placeholder="Name"
                disabled={row.status === "done"}
                className="min-w-[10rem] flex-1 rounded-md border border-black/15 px-2 py-1.5 text-sm disabled:bg-neutral-100"
              />
              <select
                value={row.category}
                onChange={(e) => updateRow(i, { category: e.target.value })}
                disabled={row.status === "done"}
                className="rounded-md border border-black/15 px-2 py-1.5 text-sm disabled:bg-neutral-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={row.price}
                onChange={(e) => updateRow(i, { price: e.target.value })}
                placeholder="Price (₦)"
                disabled={row.status === "done"}
                className="w-28 rounded-md border border-black/15 px-2 py-1.5 text-sm disabled:bg-neutral-100"
              />
              <span className="w-20 text-xs">
                {row.status === "uploading" && "Uploading..."}
                {row.status === "done" && <span className="text-green-700">Created ✓</span>}
                {row.status === "error" && <span className="text-red-600">{row.error}</span>}
              </span>
              {row.status !== "done" && (
                <button
                  onClick={() => removeRow(i)}
                  className="text-xs text-neutral-500 underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={createAll}
              disabled={creating || allDone}
              className="rounded-full bg-brand-black px-6 py-2 text-sm text-brand-gold-light disabled:opacity-60"
            >
              {creating ? "Creating..." : allDone ? "All created" : `Create all ${rows.length} pieces`}
            </button>
            {allDone && (
              <button
                onClick={() => router.push("/admin/preorder/products")}
                className="text-sm underline"
              >
                View pre-order products →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
