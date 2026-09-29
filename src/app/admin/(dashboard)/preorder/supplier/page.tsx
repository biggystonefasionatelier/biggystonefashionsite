"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/components/admin/OrderCard";

type ProductAgg = {
  name: string;
  image_url: string | null;
  toSource: number; // paid, not yet fulfilled - needs ordering from supplier
  awaitingPayment: number; // pending Opay confirmation - not yet confirmed to source
};

export default function SupplierOrderPage() {
  const [rows, setRows] = useState<ProductAgg[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        const wholesaleOrders: Order[] = (data.orders ?? []).filter(
          (o: Order) => o.order_type === "wholesale"
        );

        const byProduct = new Map<string, ProductAgg>();
        for (const order of wholesaleOrders) {
          if (order.status !== "paid" && order.status !== "pending") continue;
          for (const item of order.order_items) {
            const key = item.product_name;
            const existing = byProduct.get(key) ?? {
              name: item.product_name,
              image_url: item.image_url ?? null,
              toSource: 0,
              awaitingPayment: 0,
            };
            if (order.status === "paid") {
              existing.toSource += item.quantity;
            } else {
              existing.awaitingPayment += item.quantity;
            }
            byProduct.set(key, existing);
          }
        }

        setRows(
          Array.from(byProduct.values()).sort((a, b) => b.toSource - a.toSource)
        );
      });
  }, []);

  return (
    <div>
      <p className="max-w-2xl text-sm text-neutral-600">
        How many of each pre-order piece to source from your supplier right
        now, based on orders that are paid but not yet marked fulfilled.
        &quot;Awaiting payment&quot; pieces are still waiting on Opay
        confirmation, so they&apos;re not counted in what to order yet.
      </p>

      {!rows ? (
        <p className="mt-6 text-sm text-neutral-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">Nothing to source right now.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Piece</th>
                <th className="px-4 py-3">To source (paid)</th>
                <th className="px-4 py-3">Awaiting payment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-b border-black/5 last:border-0">
                  <td className="flex items-center gap-2 px-4 py-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {r.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    {r.name}
                  </td>
                  <td className="px-4 py-3 font-medium">{r.toSource || "—"}</td>
                  <td className="px-4 py-3 text-neutral-500">{r.awaitingPayment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
