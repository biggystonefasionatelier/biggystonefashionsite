import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const updateSchema = z.object({
  status: z.enum(["pending", "paid", "failed", "fulfilled", "cancelled"]),
});

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
    const result = await db
      .collection("orders")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: parsed.data.status } },
        { returnDocument: "after" }
      );

    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { _id, ...rest } = result;
    return NextResponse.json({ order: { id: _id.toString(), ...rest } });
  } catch (err) {
    console.error("Admin order update failed:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
