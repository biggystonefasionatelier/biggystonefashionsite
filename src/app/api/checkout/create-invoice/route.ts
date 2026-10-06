import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkoutInitSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { resolveCart, resolveDiscountCode } from "@/lib/orderPricing";
import { calculateDeliveryFee, findDeliveryZone, type DeliveryMethod } from "@/lib/delivery";
import { PROMO, isPromoActive } from "@/lib/promo";

/**
 * "Pay for me" - a customer picks items and fills in delivery details but
 * doesn't pay themselves, instead sharing a link (see /invoice/[reference])
 * that someone else opens to complete the Paystack payment. Mirrors
 * /api/checkout/initialize's math exactly (same resolveCart/discount/
 * delivery pipeline) but never calls Paystack here - that only happens
 * once, lazily, the first time anyone actually opens the invoice link and
 * clicks "Pay now" (see /api/checkout/pay-invoice/[reference]). Calling
 * Paystack's initializeTransaction twice with the same reference errors,
 * so it must happen at most once, and this route would otherwise have no
 * guarantee the link is ever opened at all.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`create-invoice:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
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
    discountCode,
    deliveryMethod,
    deliveryZone,
    deliveryNote,
  } = parsed.data;

  // Wholesale pre-orders already have their own "pay later" flow (Opay +
  // WhatsApp receipt) - this shareable-invoice option is for retail
  // Paystack orders only.
  if (orderType !== "retail") {
    return NextResponse.json(
      { error: "Invoices are only available for retail orders." },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();

    const cart = await resolveCart(db, { orderType, items });
    if (!cart.ok) {
      return NextResponse.json({ error: cart.error }, { status: 400 });
    }
    const { orderItems, total, bundleDiscount } = cart;
    let amountDue = cart.amountDue;

    let discountAmount = 0;
    let appliedDiscountCode: string | null = null;
    let appliedGiftVoucherCode: string | null = null;
    let referralCreditIds: string[] = [];
    let freeDeliveryFromVoucher = false;
    if (discountCode) {
      const resolved = await resolveDiscountCode(db, { orderType, email, discountCode, amountDue, total });
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

    let deliveryFee = 0;
    const zone = findDeliveryZone(deliveryZone);
    if (deliveryMethod === "delivery" && !zone) {
      return NextResponse.json({ error: "Please select a valid delivery area." }, { status: 400 });
    }
    if (deliveryMethod) {
      deliveryFee = calculateDeliveryFee(deliveryMethod as DeliveryMethod, deliveryZone);
      if (freeDeliveryFromVoucher || (isPromoActive() && total >= PROMO.freeDeliveryThreshold)) {
        deliveryFee = 0;
      }
      amountDue += deliveryFee;
    }

    if (amountDue <= 0) {
      return NextResponse.json(
        { error: "Your order total is ₦0 after this discount. Please add another item to your cart to check out." },
        { status: 400 }
      );
    }

    // Still needs a unique value for the unique, non-sparse
    // paystack_reference index, even though Paystack isn't called yet.
    const reference = `biggystone_invoice_${randomUUID()}`;

    const insertResult = await db.collection("orders").insertOne({
      customer_name: customerName,
      email,
      phone,
      address,
      city,
      order_type: orderType,
      status: "pending",
      payment_method: "paystack_invoice",
      authorization_url: null,
      total: amountDue,
      deposit_only: false,
      paystack_reference: reference,
      created_at: new Date(),
      order_items: orderItems,
      discount_code: appliedDiscountCode,
      discount_amount: discountAmount || null,
      gift_voucher_code: appliedGiftVoucherCode,
      referral_credit_ids: referralCreditIds.length ? referralCreditIds : null,
      bundle_discount_amount: bundleDiscount || null,
      delivery_method: deliveryMethod ?? null,
      delivery_zone: deliveryZone || null,
      delivery_zone_label: zone?.label ?? null,
      delivery_fee: deliveryFee || null,
      delivery_note: deliveryNote || null,
    });

    return NextResponse.json({
      orderId: insertResult.insertedId.toString(),
      reference,
      total: amountDue,
    });
  } catch (err) {
    console.error("Create invoice failed:", err);
    const message = err instanceof Error ? err.message : "Could not create invoice. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
