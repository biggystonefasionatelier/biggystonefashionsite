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

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        const wholesaleOrders: Order[] = (data.orders ?? []).filter(
          (o: Order) => o.order_type === "wholesale"
        );

        const byEmail = new Map<string, ClientGroup>();
        for (const order of wholesaleOrders) {
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

        setClients(Array.from(byEmail.values()).sort((a, b) => b.totalSpent - a.totalSpent));
      });
  }, []);

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
                  <li key={o.id} className="flex items-center justify-between">
                    <span>
                      {new Date(o.created_at).toLocaleDateString("en-NG")} —{" "}
                      {totalPieces(o)} piece{totalPieces(o) === 1 ? "" : "s"}
                    </span>
                    <span className="capitalize">
                      {o.status} · ₦{Number(o.total).toLocaleString()}
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
