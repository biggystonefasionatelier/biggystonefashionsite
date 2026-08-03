import type { Db, ObjectId } from "mongodb";

const QUALIFYING_TOTAL = 20000;
const ORDERS_PER_GIFT = 5;

/**
 * Call right after an order flips to "paid" (from checkout/verify or the
 * Paystack webhook - whichever gets there first, since both check
 * `status === "paid"` and bail out before this runs otherwise). Counts
 * this customer's qualifying retail orders (by email, no login system)
 * and marks the order eligible for a gift pick if it's their 5th, 10th,
 * 15th, ... qualifying order.
 */
export async function markGiftEligibilityIfQualifying(
  db: Db,
  orderId: ObjectId,
  email: string,
  orderType: "retail" | "wholesale",
  total: number
): Promise<void> {
  if (orderType !== "retail" || total < QUALIFYING_TOTAL) return;

  const qualifyingCount = await db.collection("orders").countDocuments({
    email,
    order_type: "retail",
    status: "paid",
    total: { $gte: QUALIFYING_TOTAL },
  });

  if (qualifyingCount > 0 && qualifyingCount % ORDERS_PER_GIFT === 0) {
    await db.collection("orders").updateOne({ _id: orderId }, { $set: { gift_eligible: true } });
  }
}
