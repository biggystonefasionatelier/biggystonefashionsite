"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalOrders: number;
  paidOrders: number;
  totalSignups: number;
  totalInquiries: number;
  totalProducts: number;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [ordersRes, signupsRes, inquiriesRes, productsRes] = await Promise.all([
        fetch("/api/admin/orders").then((r) => r.json()),
        fetch("/api/admin/signups").then((r) => r.json()),
        fetch("/api/admin/wholesale-inquiries").then((r) => r.json()),
        fetch("/api/admin/products").then((r) => r.json()),
      ]);

      const orders = ordersRes.orders ?? [];
      setStats({
        totalOrders: orders.length,
        paidOrders: orders.filter((o: { status: string }) => o.status === "paid").length,
        totalSignups: (signupsRes.signups ?? []).length,
        totalInquiries: (inquiriesRes.inquiries ?? []).length,
        totalProducts: (productsRes.products ?? []).length,
      });
    }
    load();
  }, []);

  const cards = stats
    ? [
        { label: "Total orders", value: stats.totalOrders },
        { label: "Paid orders", value: stats.paidOrders },
        { label: "Email/birthday signups", value: stats.totalSignups },
        { label: "Wholesale inquiries", value: stats.totalInquiries },
        { label: "Products listed", value: stats.totalProducts },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Overview</h1>
      {!stats ? (
        <p className="mt-4 text-sm text-neutral-500">Loading...</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
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
