"use client";

import { useEffect, useState } from "react";
import { totalPieces, type Order } from "@/components/admin/OrderCard";

type ClientGroup = {
  email: string;
  name: string;
  phone: string;
  orders: Order[];
  totalSpent: number;
  totalPieces: number;
};

export default function PreorderClientsPage() {
  const [clients, setClients] = useState<ClientGroup[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  function group(orders: Order[]): ClientGroup[] {
    const byEmail = new Map<string, ClientGroup>();
    for (const order of orders) {
      const existing = byEmail.get(order.email) ?? {
        email: order.email,
        name: order.customer_name,
        phone: order.phone,
        orders: [],
        totalSpent: 0,
        totalPieces: 0,
      };
      existing.orders.push(order);
      if (order.status === "paid" || order.status === "fulfilled") {
        existing.totalSpent += Number(order.total);
        existing.totalPieces += totalPieces(order);
      }
      byEmail.set(order.email, existing);
    }
    return Array.from(byEmail.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        const wholesaleOrders: Order[] = (data.orders ?? []).filter(
          (o: Order) => o.order_type === "wholesale"
        );
        setClients(group(wholesaleOrders));
      });
  }, []);

  async function toggleSent(orderId: string, next: boolean) {
    setSaving(orderId);
    // Optimistic update so the checkbox responds immediately.
    setClients(
      (prev) =>
        prev &&
        prev.map((c) => ({
          ...c,
          orders: c.orders.map((o) =>
            o.id === orderId ? { ...o, sent_to_supplier: next } : o
          ),
        }))
    );
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sent_to_supplier: next }),
    });
    setSaving(null);
  }

  return (
    <div>
      {!clients ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-neutral-500">No pre-order clients yet.</p>
      ) : (
        <div className="space-y-4">
          {clients.map((c) => (
            <div key={c.email} className="rounded-xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-neutral-500">
                    {c.email} · {c.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₦{c.totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-neutral-500">
                    {c.totalPieces} piece{c.totalPieces === 1 ? "" : "s"} · {c.orders.length} order
                    {c.orders.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1 border-t border-black/5 pt-3 text-xs text-neutral-600">
                {c.orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2">
                    <span>
                      {new Date(o.created_at).toLocaleDateString("en-NG")} —{" "}
                      {totalPieces(o)} piece{totalPieces(o) === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="capitalize">
                        {o.status} · ₦{Number(o.total).toLocaleString()}
                      </span>
                      <label
                        className={`flex items-center gap-1 rounded-full border px-2 py-1 ${
                          o.sent_to_supplier
                            ? "border-green-600/30 bg-green-50 text-green-700"
                            : "border-black/15 text-neutral-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!o.sent_to_supplier}
                          disabled={saving === o.id}
                          onChange={(e) => toggleSent(o.id, e.target.checked)}
                          className="h-3 w-3"
                        />
                        Sent to supplier
                      </label>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
