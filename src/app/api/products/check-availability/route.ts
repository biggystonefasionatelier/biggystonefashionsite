import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import type { ProductDoc } from "@/lib/products";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(500),
});

// Lets the cart page point out which items are no longer available (deleted
// or switched off) before the shopper even reaches checkout, instead of a
// generic "something in your cart isn't available" error after the fact.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const validIds = parsed.data.ids.filter((id) => ObjectId.isValid(id));

  try {
    const db = await getDb();
    const available = await db
      .collection<ProductDoc>("products")
      .find({ _id: { $in: validIds.map((id) => new ObjectId(id)) }, active: true })
      .project({ _id: 1 })
      .toArray();
    const availableSet = new Set(available.map((p) => p._id.toString()));

    const unavailable = parsed.data.ids.filter((id) => !availableSet.has(id));
    return NextResponse.json({ unavailable });
  } catch (err) {
    console.error("check-availability failed:", err);
    return NextResponse.json({ error: "Could not check availability" }, { status: 500 });
  }
}
