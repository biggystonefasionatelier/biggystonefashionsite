import type { Db } from "mongodb";

type CounterDoc = { _id: string; value: number };

/**
 * Atomically issues the next sequential, human-friendly order number
 * (Order #1, #2, ...) - assigned once, at order creation, so even orders
 * that end up failed/abandoned keep their number. Gaps in the sequence are
 * normal (same as most e-commerce platforms) and not a sign anything is
 * missing.
 *
 * This is purely a display convenience - it is never used as a lookup key
 * or in a URL. paystack_reference (unguessable) stays the thing that
 * actually grants access to an order, e.g. on the shareable invoice page -
 * a small sequential number there would let anyone enumerate other
 * people's orders just by trying nearby numbers.
 */
export async function getNextOrderNumber(db: Db): Promise<number> {
  const counters = db.collection<CounterDoc>("counters");
  const result = await counters.findOneAndUpdate(
    { _id: "order_number" },
    { $inc: { value: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return result!.value;
}

export { formatOrderNumber } from "@/lib/formatOrderNumber";
