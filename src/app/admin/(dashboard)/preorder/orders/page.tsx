"use client";

import { useEffect, useState } from "react";
import OrderCard, { type Order } from "@/components/admin/OrderCard";

export default function PreorderOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

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

  return (
    <div>
      {!orders ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-neutral-500">No pre-orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
