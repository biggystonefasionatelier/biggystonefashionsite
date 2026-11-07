import { NextResponse } from "next/server";

/**
 * Read-only diagnostic: looks a reference up directly against Paystack's
 * verify API and returns the raw response, regardless of what our own
 * orders collection currently has recorded. /api/checkout/verify can't be
 * used for this because it short-circuits and just echoes our own status
 * once an order is already marked paid, without re-asking Paystack.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "PAYSTACK_SECRET_KEY is not set" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` }, cache: "no-store" }
  );
  const data = await res.json();

  return NextResponse.json({ paystackStatus: res.status, data });
}
