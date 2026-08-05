import { NextResponse } from "next/server";
import { claimGiftSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { createGiftVoucher, type VoucherType } from "@/lib/giftVoucher";
import { sendGiftVoucherEmail } from "@/lib/brevo";

/**
 * Called from the gift-picker popup on /checkout/success once an order is
 * confirmed paid and eligible. Looks the order up by its Paystack
 * reference (same trust model as /api/checkout/verify - the reference
 * only ever reaches the customer via the redirect after a real payment).
 * The `gift_eligible: true, gift_number: null` filter below makes the
 * update atomic: it can only ever succeed once per order, so refreshing
 * the page or double-clicking can't double-claim or overwrite a pick.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`gift-claim:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = claimGiftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { reference, giftNumber } = parsed.data;

  try {
    const db = await getDb();

    const gift = await db.collection<{
      number: number;
      name: string;
      description: string;
      voucher_type?: VoucherType | "none";
      voucher_amount?: number | null;
    }>("gifts").findOne({ number: giftNumber });
    if (!gift) {
      return NextResponse.json({ error: "That gift number doesn't exist" }, { status: 400 });
    }

    const result = await db.collection("orders").findOneAndUpdate(
      { paystack_reference: reference, status: "paid", gift_eligible: true, gift_number: { $exists: false } },
      { $set: { gift_number: giftNumber, gift_name: gift.name, gift_claimed_at: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "This order isn't eligible for a gift, or a gift was already picked." },
        { status: 400 }
      );
    }

    let voucherCode: string | null = null;
    if (gift.voucher_type === "fixed_discount" || gift.voucher_type === "free_delivery") {
      voucherCode = await createGiftVoucher(db, {
        email: result.email,
        type: gift.voucher_type,
        amount: gift.voucher_type === "fixed_discount" ? gift.voucher_amount ?? null : null,
        giftNumber,
        sourceOrderId: result._id,
      });

      await sendGiftVoucherEmail({
        email: result.email,
        customerName: result.customer_name,
        code: voucherCode,
        giftName: gift.name,
        type: gift.voucher_type,
        amount: gift.voucher_amount ?? null,
      });
    }

    return NextResponse.json({
      gift: { number: gift.number, name: gift.name, description: gift.description },
      voucherCode,
    });
  } catch (err) {
    console.error("Gift claim failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
