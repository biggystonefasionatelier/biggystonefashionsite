"use client";

import { useEffect, useState } from "react";

type VoucherType = "none" | "fixed_discount" | "free_delivery";

type Gift = {
  id: string;
  number: number;
  name: string;
  description: string;
  image_url: string | null;
  voucher_type?: VoucherType;
  voucher_amount?: number | null;
  voucher_transferable?: boolean;
};

function GiftForm({ gift, onSaved }: { gift: Gift; onSaved: (gift: Gift) => void }) {
  const [name, setName] = useState(gift.name);
  const [description, setDescription] = useState(gift.description);
  const [imageUrl, setImageUrl] = useState(gift.image_url ?? "");
  const [voucherType, setVoucherType] = useState<VoucherType>(gift.voucher_type ?? "none");
  const [voucherAmount, setVoucherAmount] = useState(gift.voucher_amount?.toString() ?? "");
  const [voucherTransferable, setVoucherTransferable] = useState(gift.voucher_transferable ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/gifts/${gift.number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          imageUrl,
          voucherType,
          voucherAmount: voucherAmount ? Number(voucherAmount) : undefined,
          voucherTransferable,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        setSaving(false);
        return;
      }

      onSaved(data.gift);
      setSaved(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-xs text-neutral-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Image URL (optional)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="mt-2">
        <label className="text-xs text-neutral-500">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-xs text-neutral-500">What happens when a customer earns this</label>
          <select
            value={voucherType}
            onChange={(e) => setVoucherType(e.target.value as VoucherType)}
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
          >
            <option value="none">A physical item — I&apos;ll pack it with the order</option>
            <option value="fixed_discount">A ₦ amount off their next order (auto code)</option>
            <option value="free_delivery">Free delivery on their next order (auto code)</option>
          </select>
        </div>
        {voucherType === "fixed_discount" && (
          <div>
            <label className="text-xs text-neutral-500">Discount amount (₦)</label>
            <input
              type="number"
              value={voucherAmount}
              onChange={(e) => setVoucherAmount(e.target.value)}
              placeholder="10000"
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>
      {voucherType !== "none" && (
        <>
          <p className="mt-2 text-xs text-neutral-500">
            The customer gets a one-time code automatically the moment they
            qualify (shown on screen and emailed to them), for use at
            checkout on a future order. The order that earned it isn&apos;t
            affected.
          </p>
          <label className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={voucherTransferable}
              onChange={(e) => setVoucherTransferable(e.target.checked)}
            />
            Shareable — anyone with the code can use it, not just the
            customer who earned it (e.g. a gift card meant to be given to a
            friend)
          </label>
        </>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-brand-black px-4 py-2 text-sm text-brand-gold-light disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <p className="text-xs text-green-700">Saved.</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default function AdminGiftsPage() {
  const [gift, setGift] = useState<Gift | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/admin/gifts")
      .then((r) => r.json())
      .then((data) => {
        const gifts: Gift[] = data.gifts ?? [];
        setGift(gifts.find((g) => g.number === 1) ?? null);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Loyalty gift</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-500">
        Customers who pay for 5 retail orders of ₦20,000 or more (then again
        at 10, 15, and so on) automatically earn this gift right away — no
        picking involved. Set what it actually is here.
      </p>

      {gift === undefined ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : gift === null ? (
        <p className="mt-6 text-sm text-neutral-500">
          Gift isn&apos;t set up yet — contact support.
        </p>
      ) : (
        <div className="mt-6">
          <GiftForm gift={gift} onSaved={setGift} />
        </div>
      )}
    </div>
  );
}
