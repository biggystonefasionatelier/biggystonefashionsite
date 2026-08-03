import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { verifyTransaction } from "@/lib/paystack";
import { markGiftEligibilityIfQualifying } from "@/lib/loyalty";

type OrderItemDoc = { product_id: string; product_name: string; quantity: number; unit_price: number };
type OrderDoc = {
  _id: ObjectId;
  email: string;
  status: string;
  total: number;
  order_type: "retail" | "wholesale";
  order_items: OrderItemDoc[];
  paystack_reference: string;
  gift_eligible?: boolean;
  gift_number?: number;
  gift_name?: string;
};

/**
 * Called from the /checkout/success page with ?reference=... after Paystack
 * redirects back. This re-checks payment status directly with Paystack's
 * API (never trusts the redirect itself, which anyone could fake) before
 * marking the order paid. The Paystack webhook (api/webhooks/paystack) is
 * the other, more authoritative path to the same result - having both
 * means a closed browser tab after payment doesn't leave an order stuck
 * as "pending" forever.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const orders = db.collection<OrderDoc>("orders");

    const order = await orders.findOne({ paystack_reference: reference });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ status: "paid", order });
    }

    const transaction = await verifyTransaction(reference);

    if (transaction.status !== "success") {
      await orders.updateOne({ _id: order._id }, { $set: { status: "failed" } });
      return NextResponse.json({ status: transaction.status, order });
    }

    // Confirm the amount actually paid matches what we expected, in kobo.
    const expectedKobo = Math.round(order.total * 100);
    if (transaction.amount !== expectedKobo) {
      console.error("Amount mismatch on verify:", transaction.amount, expectedKobo);
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
    }

    await orders.updateOne({ _id: order._id }, { $set: { status: "paid" } });

    // Decrement stock for retail orders only (wholesale is made/sourced to order).
    if (order.order_type === "retail") {
      const products = db.collection("products");
      for (const item of order.order_items) {
        await products.updateOne({ _id: new ObjectId(item.product_id) }, [
          { $set: { stock: { $max: [{ $subtract: ["$stock", item.quantity] }, 0] } } },
        ]);
      }
    }

    await markGiftEligibilityIfQualifying(db, order._id, order.email, order.order_type, order.total);
    const updatedOrder = await orders.findOne({ _id: order._id });

    return NextResponse.json({ status: "paid", order: updatedOrder });
  } catch (err) {
    console.error("Checkout verify failed:", err);
    return NextResponse.json({ error: "Could not verify payment" }, { status: 500 });
  }
}
