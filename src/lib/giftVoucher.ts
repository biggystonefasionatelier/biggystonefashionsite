import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";

export type VoucherType = "fixed_discount" | "free_delivery";

export type GiftVoucherDoc = {
  _id: ObjectId;
  code: string;
  email: string;
  type: VoucherType;
  amount: number | null;
  gift_number: number;
  source_order_id: ObjectId;
  created_at: Date;
  used: boolean;
  used_at: Date | null;
  used_order_id: ObjectId | null;
};

// Distinct "GIFT-" prefix so it's never confused with PROMO/birthday codes
// at a glance, in either direction, when someone types a code at checkout.
function generateVoucherCode(): string {
  return `GIFT-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Called right after a customer picks a gift number that's tied to a
 * non-physical reward (see gifts.voucher_type, set in /admin/gifts).
 * Creates a single-use code redeemable at a future checkout, since the
 * order that earned the gift has already been paid for by this point -
 * there's no way to retroactively discount it.
 */
export async function createGiftVoucher(
  db: Db,
  params: {
    email: string;
    type: VoucherType;
    amount: number | null;
    giftNumber: number;
    sourceOrderId: ObjectId;
  }
): Promise<string> {
  const code = generateVoucherCode();
  await db.collection("gift_vouchers").insertOne({
    code,
    email: params.email.trim().toLowerCase(),
    type: params.type,
    amount: params.amount,
    gift_number: params.giftNumber,
    source_order_id: params.sourceOrderId,
    created_at: new Date(),
    used: false,
    used_at: null,
    used_order_id: null,
  });
  return code;
}

export type GiftVoucherEligibility =
  | { eligible: true; voucher: GiftVoucherDoc }
  | { eligible: false; reason: "not_found" | "already_used" | "wrong_email" };

export async function checkGiftVoucherEligibility(
  db: Db,
  email: string,
  code: string
): Promise<GiftVoucherEligibility> {
  const voucher = await db
    .collection<GiftVoucherDoc>("gift_vouchers")
    .findOne({ code: code.trim().toUpperCase() });

  if (!voucher) return { eligible: false, reason: "not_found" };
  if (voucher.used) return { eligible: false, reason: "already_used" };
  if (voucher.email !== email.trim().toLowerCase()) {
    return { eligible: false, reason: "wrong_email" };
  }

  return { eligible: true, voucher };
}

export function giftVoucherIneligibilityMessage(
  reason: Exclude<GiftVoucherEligibility, { eligible: true }>["reason"]
): string {
  switch (reason) {
    case "not_found":
      return "That gift code isn't valid.";
    case "already_used":
      return "That gift code has already been used.";
    case "wrong_email":
      return "That gift code was issued to a different email address.";
  }
}

/**
 * Only called after payment actually confirms (checkout/verify or the
 * Paystack webhook) - matches the same "apply optimistically at checkout,
 * burn it for real once paid" pattern used for the birthday discount code,
 * so a failed payment doesn't waste the customer's one-time code.
 */
export async function markGiftVoucherUsed(db: Db, code: string, orderId: ObjectId): Promise<void> {
  await db
    .collection("gift_vouchers")
    .updateOne(
      { code: code.trim().toUpperCase(), used: false },
      { $set: { used: true, used_at: new Date(), used_order_id: orderId } }
    );
}
