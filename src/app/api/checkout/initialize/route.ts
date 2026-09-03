import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkoutInitSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { initializeTransaction } from "@/lib/paystack";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { resolveCart, resolveDiscountCode } from "@/lib/orderPricing";
import { calculateDeliveryFee, findDeliveryZone, type DeliveryMethod } from "@/lib/delivery";
import { PROMO, isPromoActive } from "@/lib/promo";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
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

  const parsed = checkoutInitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const {
    customerName,
    email,
    phone,
    address,
    city,
    orderType,
    items,
    depositOnly,
    discountCode,
    deliveryMethod,
    deliveryZone,
    deliveryNote,
  } = parsed.data;

  try {
    const db = await getDb();

    const cart = await resolveCart(db, { orderType, items, depositOnly });
    if (!cart.ok) {
      return NextResponse.json({ error: cart.error }, { status: 400 });
    }
    const { orderItems, total, bundleDiscount } = cart;
    let amountDue = cart.amountDue;

    // Four possible retail discount codes: the September launch promo
    // (BSTONESEPT - date-gated, open to anyone), the birthday code
    // (BSTONEBDAY - checked against the customer's signup record, see
    // src/lib/discount.ts), a one-time gift voucher code (GIFT-xxxx,
    // earned by picking a non-physical loyalty gift - see
    // src/lib/giftVoucher.ts), or a referral credit code (REF-xxxx, the
    // customer's own personal code, redeeming whatever ₦100 credits they've
    // earned - see src/lib/referral.ts). At most one applies per order.
    let discountAmount = 0;
    let appliedDiscountCode: string | null = null;
    let appliedGiftVoucherCode: string | null = null;
    let referralCreditIds: string[] = [];
    let freeDeliveryFromVoucher = false;
    if (orderType === "retail" && discountCode) {
      const resolved = await resolveDiscountCode(db, { orderType, email, discountCode, amountDue });
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: 400 });
      }
      discountAmount = resolved.discountAmount;
      appliedDiscountCode = resolved.appliedDiscountCode;
      appliedGiftVoucherCode = resolved.appliedGiftVoucherCode;
      referralCreditIds = resolved.referralCreditIds;
      freeDeliveryFromVoucher = resolved.freeDeliveryFromVoucher;
      amountDue -= discountAmount;
    }

    // Delivery is priced by zone (see src/lib/delivery.ts) - free during
    // the September promo for orders worth PROMO.freeDeliveryThreshold or
    // more (based on the item subtotal, before any discount), or if a
    // free-delivery gift voucher was applied above.
    let deliveryFee = 0;
    const zone = findDeliveryZone(deliveryZone);
    if (orderType === "retail" && deliveryMethod) {
      deliveryFee = calculateDeliveryFee(deliveryMethod as DeliveryMethod, deliveryZone);
      if (freeDeliveryFromVoucher || (isPromoActive() && total >= PROMO.freeDeliveryThreshold)) {
        deliveryFee = 0;
      }
      amountDue += deliveryFee;
    }

    // A fixed-discount gift voucher can't reduce a small order below zero
    // (it's capped above), but it can bring the total to exactly zero,
    // which Paystack can't process as a charge.
    if (amountDue <= 0) {
      return NextResponse.json(
        { error: "Your order total is ₦0 after this discount. Please add another item to your cart to check out." },
        { status: 400 }
      );
    }

    const reference = `biggystone_${randomUUID()}`;

    const insertResult = await db.collection("orders").insertOne({
      customer_name: customerName,
      email,
      phone,
      address,
      city,
      order_type: orderType,
      status: "pending",
      total: amountDue,
      deposit_only: orderType === "wholesale" ? depositOnly ?? false : false,
      paystack_reference: reference,
      created_at: new Date(),
      order_items: orderItems,
      discount_code: appliedDiscountCode,
      discount_amount: discountAmount || null,
      gift_voucher_code: appliedGiftVoucherCode,
      referral_credit_ids: referralCreditIds.length ? referralCreditIds : null,
      bundle_discount_amount: bundleDiscount || null,
      delivery_method: orderType === "retail" ? deliveryMethod ?? null : null,
      delivery_zone: orderType === "retail" ? deliveryZone || null : null,
      delivery_zone_label: orderType === "retail" ? zone?.label ?? null : null,
      delivery_fee: deliveryFee || null,
      delivery_note: deliveryNote || null,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { authorization_url } = await initializeTransaction({
      email,
      amountKobo: Math.round(amountDue * 100),
      reference,
      callbackUrl: `${siteUrl}/checkout/success`,
      metadata: { orderId: insertResult.insertedId.toString(), orderType },
    });

    return NextResponse.json({ authorizationUrl: authorization_url });
  } catch (err) {
    console.error("Checkout initialize failed:", err);
    const message = err instanceof Error ? err.message : "Checkout failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
