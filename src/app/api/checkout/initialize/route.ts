import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { checkoutInitSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { toProduct, type ProductDoc } from "@/lib/products";
import { initializeTransaction } from "@/lib/paystack";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  BIRTHDAY_DISCOUNT_PERCENT,
  checkBirthdayDiscountEligibility,
  discountIneligibilityMessage,
} from "@/lib/discount";
import { checkGiftVoucherEligibility, giftVoucherIneligibilityMessage } from "@/lib/giftVoucher";
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

    // Never trust prices/stock from the client - look everything up fresh.
    const productIds = items.map((i) => new ObjectId(i.productId));
    const productDocs = await db
      .collection<ProductDoc>("products")
      .find({ _id: { $in: productIds }, active: true })
      .toArray();
    const products = productDocs.map(toProduct);

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: "One or more items in your cart are no longer available." },
        { status: 400 }
      );
    }

    // Guard against mixing retail and wholesale items in one checkout -
    // they have different fulfillment/lead-time flows.
    const mismatched = products.find((p) => p.product_type !== orderType);
    if (mismatched) {
      return NextResponse.json(
        {
          error:
            "Retail and pre-order wholesale items can't be checked out together. Please check out separately.",
        },
        { status: 400 }
      );
    }

    let total = 0;
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;

      if (orderType === "retail" && product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      const lineTotal = product.price * item.quantity;
      total += lineTotal;

      return {
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        color: item.color || null,
        image_url: product.image_url || null,
      };
    });

    // For wholesale, a deposit-only checkout charges a percentage now;
    // the remainder is collected before delivery (handled manually/admin side).
    let amountDue = total;
    if (orderType === "wholesale" && depositOnly) {
      const depositPercents = products
        .map((p) => p.deposit_percent ?? 100)
        .filter((n) => !Number.isNaN(n));
      const depositPercent = depositPercents.length
        ? Math.max(...depositPercents)
        : 100;
      amountDue = Math.round((total * depositPercent) / 100);
    }

    // Three possible retail discount codes: the September launch promo
    // (BSTONESEPT - date-gated, open to anyone), the birthday code
    // (BSTONEBDAY - checked against the customer's signup record, see
    // src/lib/discount.ts), or a one-time gift voucher code (GIFT-xxxx,
    // earned by picking a non-physical loyalty gift - see
    // src/lib/giftVoucher.ts). At most one applies per order.
    let discountAmount = 0;
    let appliedDiscountCode: string | null = null;
    let appliedGiftVoucherCode: string | null = null;
    let freeDeliveryFromVoucher = false;
    if (orderType === "retail" && discountCode) {
      const code = discountCode.trim().toUpperCase();
      if (code === PROMO.code) {
        if (!isPromoActive()) {
          return NextResponse.json({ error: "That code isn't active right now." }, { status: 400 });
        }
        discountAmount = Math.round((amountDue * PROMO.percent) / 100);
        appliedDiscountCode = code;
      } else if (code.startsWith("GIFT-")) {
        const eligibility = await checkGiftVoucherEligibility(db, email, code);
        if (!eligibility.eligible) {
          return NextResponse.json(
            { error: giftVoucherIneligibilityMessage(eligibility.reason) },
            { status: 400 }
          );
        }
        if (eligibility.voucher.type === "fixed_discount") {
          discountAmount = Math.min(amountDue, eligibility.voucher.amount ?? 0);
        } else {
          freeDeliveryFromVoucher = true;
        }
        appliedDiscountCode = code;
        appliedGiftVoucherCode = code;
      } else {
        const eligibility = await checkBirthdayDiscountEligibility(db, email, discountCode);
        if (!eligibility.eligible) {
          return NextResponse.json({ error: discountIneligibilityMessage(eligibility.reason) }, { status: 400 });
        }
        discountAmount = Math.round((amountDue * BIRTHDAY_DISCOUNT_PERCENT) / 100);
        appliedDiscountCode = code;
      }
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
