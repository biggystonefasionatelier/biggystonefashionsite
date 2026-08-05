"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [productType, setProductType] = useState<"retail" | "wholesale">(
    product?.product_type ?? "retail"
  );

  async function handleFileChange(e: FormEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }

      setImageUrl(data.url);
    } catch {
      setError("Network error while uploading. Try again.");
    } finally {
      setUploading(false);
      e.currentTarget.value = "";
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? ""),
      description: String(form.get("description") ?? ""),
      price: Number(form.get("price") ?? 0),
      category: String(form.get("category") ?? ""),
      colors: String(form.get("colors") ?? "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      productType,
      stock: Number(form.get("stock") ?? 0),
      imageUrl,
      moq: form.get("moq") ? Number(form.get("moq")) : undefined,
      depositPercent: form.get("depositPercent") ? Number(form.get("depositPercent")) : undefined,
      active: form.get("active") === "on",
    };

    try {
      const res = await fetch(
        product ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: product ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;

    await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid max-w-2xl gap-4">
      <div>
        <label className="text-xs text-neutral-500">Name</label>
        <input
          name="name"
          required
          defaultValue={product?.name}
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500">
          Slug (lowercase, hyphens only — e.g. gold-pearl-drop-earrings)
        </label>
        <input
          name="slug"
          required
          defaultValue={product?.slug}
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-neutral-500">Price (₦)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            required
            defaultValue={product?.price}
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Stock</label>
          <input
            name="stock"
            type="number"
            required
            defaultValue={product?.stock ?? 0}
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-500">
          Category (optional — used as a tag on the shop page, so keep spelling consistent)
        </label>
        <input
          name="category"
          list="category-suggestions"
          defaultValue={product?.category ?? ""}
          placeholder="e.g. Earrings"
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <datalist id="category-suggestions">
          <option value="Earrings" />
          <option value="Neckpieces" />
          <option value="Bracelets" />
          <option value="Brooches" />
          <option value="Male Jewelry" />
          <option value="Rings" />
          <option value="Hair Accessories" />
        </datalist>
      </div>

      <div>
        <label className="text-xs text-neutral-500">
          Colors (optional — comma-separated, e.g. Yellow, Teal, Pink. Leave
          blank if this listing is only one color. If set, shoppers must pick
          a color before adding to cart.)
        </label>
        <input
          name="colors"
          defaultValue={product?.colors?.join(", ") ?? ""}
          placeholder="e.g. Yellow, Teal, Purple, Pink, Blue"
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500">Photo</label>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="mt-2 h-32 w-32 rounded-md border border-black/10 object-cover"
          />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileChange}
          disabled={uploading}
          className="mt-2 block text-sm"
        />
        {uploading && <p className="mt-1 text-xs text-neutral-500">Uploading...</p>}
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Or paste an image URL"
          className="mt-2 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500">Listing type</label>
        <div className="mt-1 flex gap-4 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={productType === "retail"}
              onChange={() => setProductType("retail")}
            />
            Retail
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={productType === "wholesale"}
              onChange={() => setProductType("wholesale")}
            />
            Pre-order wholesale
          </label>
        </div>
      </div>

      {productType === "wholesale" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-500">MOQ (minimum order quantity)</label>
            <input
              name="moq"
              type="number"
              defaultValue={product?.moq ?? ""}
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500">Deposit % required</label>
            <input
              name="depositPercent"
              type="number"
              defaultValue={product?.deposit_percent ?? ""}
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
        Visible on the site
      </label>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand-black px-6 py-2 text-sm text-brand-gold-light disabled:opacity-60"
        >
          {submitting ? "Saving..." : product ? "Save changes" : "Create product"}
        </button>
        {product && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-600 underline"
          >
            Delete product
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
