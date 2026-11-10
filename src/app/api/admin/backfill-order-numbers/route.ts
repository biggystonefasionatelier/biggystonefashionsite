import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getNextOrderNumber } from "@/lib/orderNumber";

type OrderDoc = { _id: { toString(): string }; order_number?: number };

/**
 * One-time (safe to re-run) backfill: assigns order_number to every order
 * that predates the field, oldest first, so existing orders get a sensible
 * number too instead of only ones placed after this feature shipped.
 */
export async function POST() {
  try {
    const db = await getDb();
    const orders = db.collection<OrderDoc>("orders");

    const missing = await orders
      .find({ order_number: { $exists: false } })
      .sort({ created_at: 1 })
      .toArray();

    let updated = 0;
    for (const order of missing) {
      const orderNumber = await getNextOrderNumber(db);
      await orders.updateOne({ _id: order._id }, { $set: { order_number: orderNumber } });
      updated++;
    }

    return NextResponse.json({ updated });
  } catch (err) {
    console.error("Backfill order numbers failed:", err);
    return NextResponse.json({ error: "Failed to backfill order numbers" }, { status: 500 });
  }
}
