import type { Db, ObjectId } from "mongodb";
import { createGiftVoucher, type VoucherType } from "@/lib/giftVoucher";
import { sendGiftVoucherEmail } from "@/lib/brevo";

const QUALIFYING_TOTAL = 20000;
const ORDERS_PER_GIFT = 5;

type GiftDoc = {
  number: number;
  name: string;
  description: string;
  voucher_type?: VoucherType | "none";
  voucher_amount?: number | null;
  voucher_transferable?: boolean;
};

/**
 * Call right after an order flips to "paid" (from checkout/verify or the
 * Paystack webhook - whichever gets there first, since both check
 * `status === "paid"` and bail out before this runs otherwise). Counts
 * this customer's qualifying retail orders (>= N20,000, by email, no login
 * system) and - if this is their 5th, 10th, 15th, ... qualifying order -
 * automatically awards the one loyalty gift right away. There's no picking
 * step anymore: with only one gift configured (see Admin > Loyalty gift),
 * there's nothing to choose between.
 */
export async function markGiftEligibilityIfQualifying(
  db: Db,
  orderId: ObjectId,
  email: string,
  customerName: string,
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

  if (qualifyingCount === 0 || qualifyingCount % ORDERS_PER_GIFT !== 0) return;

  const gift = await db.collection<GiftDoc>("gifts").findOne({ number: 1 });
  if (!gift) return;

  const set: Record<string, unknown> = {
    gift_eligible: true,
    gift_order_number: qualifyingCount,
    gift_number: 1,
    gift_name: gift.name,
  };

  if (gift.voucher_type === "fixed_discount" || gift.voucher_type === "free_delivery") {
    const code = await createGiftVoucher(db, {
      email,
      type: gift.voucher_type,
      amount: gift.voucher_type === "fixed_discount" ? gift.voucher_amount ?? null : null,
      giftNumber: 1,
      sourceOrderId: orderId,
      transferable: gift.voucher_transferable ?? false,
    });
    set.gift_voucher_code = code;

    await sendGiftVoucherEmail({
      email,
      customerName,
      code,
      giftName: gift.name,
      type: gift.voucher_type,
      amount: gift.voucher_amount ?? null,
      transferable: gift.voucher_transferable ?? false,
      orderNumber: qualifyingCount,
    });
  }

  await db.collection("orders").updateOne({ _id: orderId }, { $set: set });
}
