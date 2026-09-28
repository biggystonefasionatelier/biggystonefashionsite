import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkoutInitSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { resolveCart } from "@/lib/orderPricing";

/**
 * Pre-order wholesale pieces are paid manually to Faith's Opay account
 * instead of through Paystack - she doesn't want gateway fees on top of
 * made-to-order pricing, and it lets her confirm payment herself from her
 * Opay app rather than wiring up a second payment gateway. So unlike
 * /api/checkout/initialize, this route never talks to Paystack: it just
 * creates the order as "pending" with payment_method "opay" and hands
 * back the total, which the checkout page shows next to the Opay account
 * details and a "send receipt on WhatsApp" button. Faith then marks the
 * order paid by hand in /admin/orders once she's confirmed the transfer -
 * that PATCH route already decrements stock and everything else a normal
 * paid order needs.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`preorder-checkout:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
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

  const { customerName, email, phone, address, city, orderType, items } = parsed.data;

  if (orderType !== "wholesale") {
    return NextResponse.json(
      { error: "This checkout is for pre-order wholesale items only." },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();

    // Always the full price - pre-order pieces aren't sold on a deposit.
    const cart = await resolveCart(db, { orderType, items, depositOnly: false });
    if (!cart.ok) {
      return NextResponse.json({ error: cart.error }, { status: 400 });
    }
    const { orderItems, total } = cart;

    // No real Paystack transaction happens here, but paystack_reference
    // has a unique index with no sparse option (see database/init-indexes.mjs),
    // so every order still needs a unique value in that field.
    const reference = `biggystone_opay_${randomUUID()}`;

    const insertResult = await db.collection("orders").insertOne({
      customer_name: customerName,
      email,
      phone,
      address,
      city,
      order_type: orderType,
      status: "pending",
      payment_method: "opay",
      total,
      deposit_only: false,
      paystack_reference: reference,
      created_at: new Date(),
      order_items: orderItems,
      discount_code: null,
      discount_amount: null,
      gift_voucher_code: null,
      referral_credit_ids: null,
      bundle_discount_amount: null,
      delivery_method: null,
      delivery_zone: null,
      delivery_zone_label: null,
      delivery_fee: null,
      delivery_note: null,
    });

    return NextResponse.json({
      orderId: insertResult.insertedId.toString(),
      reference,
      total,
    });
  } catch (err) {
    console.error("Pre-order checkout failed:", err);
    const message = err instanceof Error ? err.message : "Checkout failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
