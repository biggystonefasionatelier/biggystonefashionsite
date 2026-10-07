import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { initializeTransaction } from "@/lib/paystack";

type OrderItemDoc = { product_name: string; quantity: number; unit_price: number; image_url?: string | null };
type OrderDoc = {
  customer_name: string;
  email: string;
  status: string;
  total: number;
  order_type: "retail" | "wholesale";
  payment_method?: string | null;
  authorization_url?: string | null;
  order_items: OrderItemDoc[];
  delivery_method?: "pickup" | "delivery" | null;
  delivery_zone_label?: string | null;
  delivery_fee?: number | null;
};

/**
 * Public, reference-keyed lookup for a shareable "pay for me" invoice -
 * same trust model as /api/checkout/verify (anyone with the unguessable
 * reference can view/act on that one order, no login needed).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;

  try {
    const db = await getDb();
    const order = await db.collection<OrderDoc>("orders").findOne(
      { paystack_reference: reference, payment_method: { $in: ["paystack_invoice", "opay"] } },
      {
        projection: {
          customer_name: 1,
          status: 1,
          total: 1,
          order_type: 1,
          payment_method: 1,
          order_items: 1,
          delivery_method: 1,
          delivery_zone_label: 1,
          delivery_fee: 1,
        },
      }
    );

    if (!order) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("Invoice lookup failed:", err);
    return NextResponse.json({ error: "Could not load this invoice" }, { status: 500 });
  }
}

/**
 * Generates the actual Paystack payment link for this invoice, the first
 * time anyone clicks "Pay now" - and only that first time, since Paystack
 * rejects re-initializing the same reference. Later clicks (or a page
 * reload) just hand back the same cached authorization_url instead of
 * calling Paystack again.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;

  try {
    const db = await getDb();
    const orders = db.collection<OrderDoc>("orders");
    const order = await orders.findOne({ paystack_reference: reference, payment_method: "paystack_invoice" });

    if (!order) {
      return NextResponse.json(
        { error: "This invoice isn't payable by card - check the invoice page for how to pay." },
        { status: 404 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: `This invoice is already ${order.status}.` }, { status: 400 });
    }

    if (order.authorization_url) {
      return NextResponse.json({ authorizationUrl: order.authorization_url });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const { authorization_url } = await initializeTransaction({
      email: order.email,
      amountKobo: Math.round(order.total * 100),
      reference,
      callbackUrl: `${siteUrl}/checkout/success`,
      metadata: { orderType: order.order_type },
    });

    await orders.updateOne({ paystack_reference: reference }, { $set: { authorization_url } });

    return NextResponse.json({ authorizationUrl: authorization_url });
  } catch (err) {
    console.error("Invoice pay failed:", err);
    const message = err instanceof Error ? err.message : "Could not start payment. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
