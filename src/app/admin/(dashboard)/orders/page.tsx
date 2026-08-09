"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  color?: string | null;
  image_url?: string | null;
};
type Order = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  order_type: "retail" | "wholesale";
  status: string;
  total: number;
  deposit_only: boolean;
  created_at: string;
  order_items: OrderItem[];
  gift_number?: number;
  gift_name?: string;
  discount_code?: string | null;
  discount_amount?: number | null;
  bundle_discount_amount?: number | null;
  delivery_method?: "pickup" | "delivery" | null;
  delivery_zone_label?: string | null;
  delivery_fee?: number | null;
  delivery_note?: string | null;
};

function deliveryLabel(o: Order): string | null {
  if (!o.delivery_method) return null;
  if (o.delivery_method === "pickup") return "Pickup";
  const zone = o.delivery_zone_label ?? "Delivery";
  const fee = o.delivery_fee ? `₦${o.delivery_fee.toLocaleString()}` : "Free";
  return `${zone} (${fee})`;
}

const STATUSES = ["pending", "paid", "failed", "fulfilled", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  function load() {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    setOrders((prev) =>
      prev ? prev.map((o) => (o.id === id ? { ...o, status } : o)) : prev
    );
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>

      {!orders ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No orders yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {o.customer_name} · <span className="capitalize">{o.order_type}</span>
                    {o.deposit_only && " (deposit)"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {o.email} · {o.phone}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {o.address}, {o.city}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₦{Number(o.total).toLocaleString()}</p>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="mt-1 rounded-md border border-black/15 px-2 py-1 text-xs capitalize"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ul className="mt-3 space-y-2 border-t border-black/5 pt-3 text-xs text-neutral-600">
                {o.order_items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {item.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <span>
                      {item.quantity} × {item.product_name}
                      {item.color && ` (${item.color})`} — ₦
                      {(item.unit_price * item.quantity).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>

              {deliveryLabel(o) && (
                <p className="mt-2 border-t border-black/5 pt-2 text-xs text-neutral-600">
                  🚚 {deliveryLabel(o)}
                  {o.delivery_note && <span className="block text-neutral-500">Note: {o.delivery_note}</span>}
                </p>
              )}

              {o.discount_code && (
                <p className="mt-2 border-t border-black/5 pt-2 text-xs text-neutral-600">
                  {o.discount_code.startsWith("GIFT-") ? "🎁" : "🏷️"} Code {o.discount_code} applied
                  {o.discount_amount
                    ? ` — ₦${Number(o.discount_amount).toLocaleString()} off`
                    : " — free delivery on this order"}
                </p>
              )}

              {o.bundle_discount_amount ? (
                <p className="mt-2 border-t border-black/5 pt-2 text-xs text-neutral-600">
                  📦 Buy-3 bundle discount — ₦{Number(o.bundle_discount_amount).toLocaleString()} off
                </p>
              ) : null}

              {o.gift_number && (
                <p className="mt-2 border-t border-black/5 pt-2 text-xs font-medium text-brand-black">
                  🎁 Loyalty gift picked: #{o.gift_number} — {o.gift_name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
