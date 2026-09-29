"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  paidOrCompleteOrders: number;
  piecesOrdered: number;
  amountCollected: number;
};

const COLLECTED_STATUSES = new Set(["paid", "fulfilled"]);

export default function PreorderOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [productsRes, ordersRes] = await Promise.all([
        fetch("/api/admin/products").then((r) => r.json()),
        fetch("/api/admin/orders").then((r) => r.json()),
      ]);

      const products = (productsRes.products ?? []).filter(
        (p: { product_type: string }) => p.product_type === "wholesale"
      );
      const orders = (ordersRes.orders ?? []).filter(
        (o: { order_type: string }) => o.order_type === "wholesale"
      );

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: { status: string }) => o.status === "pending").length,
        paidOrCompleteOrders: orders.filter((o: { status: string }) => COLLECTED_STATUSES.has(o.status))
          .length,
        piecesOrdered: orders
          .filter((o: { status: string }) => COLLECTED_STATUSES.has(o.status))
          .reduce(
            (sum: number, o: { order_items: { quantity: number }[] }) =>
              sum + o.order_items.reduce((s: number, i) => s + i.quantity, 0),
            0
          ),
        amountCollected: orders
          .filter((o: { status: string }) => COLLECTED_STATUSES.has(o.status))
          .reduce((sum: number, o: { total: number }) => sum + Number(o.total), 0),
      });
    }
    load();
  }, []);

  const cards = stats
    ? [
        { label: "Pre-order products", value: stats.totalProducts },
        { label: "Total pre-orders", value: stats.totalOrders },
        { label: "Awaiting Opay confirmation", value: stats.pendingOrders },
        { label: "Confirmed orders", value: stats.paidOrCompleteOrders },
        { label: "Pieces ordered", value: stats.piecesOrdered },
        { label: "Amount collected", value: `₦${stats.amountCollected.toLocaleString()}` },
      ]
    : [];

  return (
    <div>
      {!stats ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="mt-1 text-xs text-neutral-500">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
