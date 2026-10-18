"use client";

import { useEffect, useState } from "react";
import OrderCard, { ORDER_STATUSES, type Order } from "@/components/admin/OrderCard";

export default function PreorderOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("paid");

  function load() {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => setOrders((data.orders ?? []).filter((o: Order) => o.order_type === "wholesale")));
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

  const filtered = orders?.filter((o) => statusFilter === "all" || o.status === statusFilter) ?? null;

  return (
    <div>
      {orders && orders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...ORDER_STATUSES].map((s) => {
            const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                  statusFilter === s
                    ? "border-brand-black bg-brand-black text-brand-gold-light"
                    : "border-black/15 text-neutral-600 hover:border-black/30"
                }`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      )}

      {!orders ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No pre-orders yet.</p>
      ) : filtered!.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No {statusFilter} pre-orders.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered!.map((o) => (
            <OrderCard key={o.id} order={o} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
