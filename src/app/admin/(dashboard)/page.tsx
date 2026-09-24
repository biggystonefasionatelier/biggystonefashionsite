"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalOrders: number;
  paidOrders: number;
  totalSignups: number;
  totalInquiries: number;
  totalProducts: number;
  inventoryValue: number;
  amountSold: number;
  piecesSold: number;
  soldOutProducts: number;
};

// Orders in these statuses count as sold - paid but not yet marked fulfilled
// still represents money actually taken, so both count toward revenue.
const SOLD_STATUSES = new Set(["paid", "fulfilled"]);

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

      const orders: {
        status: string;
        total: number;
        order_items: { quantity: number }[];
      }[] = ordersRes.orders ?? [];
      const products: { price: number; stock: number; active: boolean }[] =
        productsRes.products ?? [];

      setStats({
        totalOrders: orders.length,
        paidOrders: orders.filter((o) => o.status === "paid").length,
        totalSignups: (signupsRes.signups ?? []).length,
        totalInquiries: (inquiriesRes.inquiries ?? []).length,
        totalProducts: products.length,
        soldOutProducts: products.filter((p) => p.stock <= 0).length,
        inventoryValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
        amountSold: orders
          .filter((o) => SOLD_STATUSES.has(o.status))
          .reduce((sum, o) => sum + Number(o.total), 0),
        piecesSold: orders
          .filter((o) => SOLD_STATUSES.has(o.status))
          .reduce(
            (sum, o) => sum + o.order_items.reduce((itemSum, i) => itemSum + i.quantity, 0),
            0
          ),
      });
    }
    load();
  }, []);

  const cards = stats
    ? [
        { label: "Total product amount (stock value)", value: `₦${stats.inventoryValue.toLocaleString()}` },
        { label: "Amount sold", value: `₦${stats.amountSold.toLocaleString()}` },
        { label: "Pieces sold", value: stats.piecesSold },
        { label: "Total orders", value: stats.totalOrders },
        { label: "Paid orders", value: stats.paidOrders },
        { label: "Email/birthday signups", value: stats.totalSignups },
        { label: "Wholesale inquiries", value: stats.totalInquiries },
        { label: "Products listed", value: stats.totalProducts },
        { label: "Sold out", value: stats.soldOutProducts },
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
