import { NextResponse } from "next/server";
import { previewDiscountSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { resolveCart, resolveDiscountCode } from "@/lib/orderPricing";

/**
 * Read-only "what would this code do" check for the checkout page - lets
 * the customer see the discount amount (and, for referral codes, their
 * full balance) before they commit to paying. Never creates an order or
 * touches Paystack; shares its actual math with the real checkout route
 * (src/lib/orderPricing.ts) so the preview can't drift from reality.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`preview-discount:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });
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

  const parsed = previewDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, orderType, items, discountCode } = parsed.data;

  try {
    const db = await getDb();

    const cart = await resolveCart(db, { orderType, items });
    if (!cart.ok) {
      return NextResponse.json({ error: cart.error }, { status: 400 });
    }

    const resolved = await resolveDiscountCode(db, {
      orderType,
      email,
      discountCode,
      amountDue: cart.amountDue,
    });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    return NextResponse.json({
      discountAmount: resolved.discountAmount,
      freeDelivery: resolved.freeDeliveryFromVoucher,
      referralBalance: resolved.referralBalance,
      isReferral: resolved.appliedDiscountCode.startsWith("REF-"),
    });
  } catch (err) {
    console.error("Discount preview failed:", err);
    return NextResponse.json({ error: "Could not check that code. Please try again." }, { status: 500 });
  }
}
