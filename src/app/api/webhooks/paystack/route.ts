import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { verifyWebhookSignature } from "@/lib/paystack";
import { markGiftEligibilityIfQualifying } from "@/lib/loyalty";
import { markBirthdayDiscountUsed } from "@/lib/discount";
import { markBrevoBirthdayDiscountUsed } from "@/lib/brevo";

type OrderItemDoc = { product_id: string; product_name: string; quantity: number; unit_price: number };
type OrderDoc = {
  _id: ObjectId;
  email: string;
  status: string;
  total: number;
  order_type: "retail" | "wholesale";
  order_items: OrderItemDoc[];
  paystack_reference: string;
  discount_code?: string | null;
};

/**
 * Paystack calls this URL directly (configured in your Paystack dashboard
 * under Settings -> API Keys & Webhooks) whenever a payment event happens.
 * This is the authoritative confirmation path - unlike the browser
 * redirect in /checkout/success, this can't be skipped by closing the tab
 * or faked by someone hitting the URL themselves, because every request
 * is verified against its HMAC signature below.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const isValid = await verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.warn("Rejected Paystack webhook with invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "charge.success") {
    // Acknowledge everything else so Paystack doesn't keep retrying.
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return NextResponse.json({ received: true });
  }

  try {
    const db = await getDb();
    const orders = db.collection<OrderDoc>("orders");

    const order = await orders.findOne({ paystack_reference: reference });

    if (!order || order.status === "paid") {
      return NextResponse.json({ received: true });
    }

    const expectedKobo = Math.round(order.total * 100);
    if (event.data.amount !== expectedKobo) {
      console.error("Webhook amount mismatch for", reference);
      return NextResponse.json({ received: true });
    }

    await orders.updateOne({ _id: order._id }, { $set: { status: "paid" } });

    if (order.order_type === "retail") {
      const products = db.collection("products");
      for (const item of order.order_items) {
        await products.updateOne({ _id: new ObjectId(item.product_id) }, [
          { $set: { stock: { $max: [{ $subtract: ["$stock", item.quantity] }, 0] } } },
        ]);
      }
    }

    await markGiftEligibilityIfQualifying(db, order._id, order.email, order.order_type, order.total);

    if (order.discount_code) {
      await markBirthdayDiscountUsed(db, order.email);
      await markBrevoBirthdayDiscountUsed(order.email);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    // Still 200 so Paystack doesn't hammer retries on our internal error;
    // this is logged for manual follow-up instead.
    return NextResponse.json({ received: true });
  }
}
