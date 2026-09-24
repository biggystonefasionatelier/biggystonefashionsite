import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const updateSchema = z.object({
  status: z.enum(["pending", "paid", "failed", "fulfilled", "cancelled"]),
});

type OrderItemDoc = { product_id: string; quantity: number };
type OrderDoc = {
  status: string;
  order_type: "retail" | "wholesale";
  order_items: OrderItemDoc[];
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const orders = db.collection<OrderDoc>("orders");

    // Read the order first so we know whether this update is the one
    // transitioning it into "paid" - stock only gets decremented once,
    // right at that transition, the same as the automatic Paystack
    // verify/webhook paths. Without this, manually marking an order paid
    // in admin (e.g. after confirming a payment Paystack's own webhook
    // missed) would leave stock untouched and the shop page still showing
    // "Add to cart" on pieces that were actually just sold.
    const before = await orders.findOne({ _id: new ObjectId(id) });
    if (!before) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const isNewlyPaid = parsed.data.status === "paid" && before.status !== "paid";

    const result = await orders.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: parsed.data.status } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (isNewlyPaid && before.order_type === "retail") {
      const products = db.collection("products");
      for (const item of before.order_items) {
        await products.updateOne({ _id: new ObjectId(item.product_id) }, [
          { $set: { stock: { $max: [{ $subtract: ["$stock", item.quantity] }, 0] } } },
        ]);
      }
    }

    const { _id, ...rest } = result;
    return NextResponse.json({ order: { id: _id.toString(), ...rest } });
  } catch (err) {
    console.error("Admin order update failed:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    const db = await getDb();
    await db.collection("orders").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin order delete failed:", err);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
