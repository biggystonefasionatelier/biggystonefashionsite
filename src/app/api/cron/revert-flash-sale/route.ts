import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

type FlashSaleRevertDoc = {
  _id: ObjectId;
  ends_at: Date;
  items: { productId: string; price: number }[];
  status: "pending" | "done";
};

/**
 * Restores prices after a time-boxed flash sale (e.g. "fastest finger"
 * promos). Runs daily (see vercel.json) and is a no-op unless a pending
 * revert's ends_at has passed, so the same mechanism works for any future
 * sale without needing a new one-off job each time.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const due = await db
    .collection<FlashSaleRevertDoc>("flash_sale_reverts")
    .find({ status: "pending", ends_at: { $lte: new Date() } })
    .toArray();

  let reverted = 0;
  for (const sale of due) {
    const products = db.collection("products");
    for (const item of sale.items) {
      await products.updateOne(
        { _id: new ObjectId(item.productId) },
        { $set: { price: item.price } }
      );
      reverted++;
    }
    await db
      .collection("flash_sale_reverts")
      .updateOne({ _id: sale._id }, { $set: { status: "done" } });
  }

  return NextResponse.json({ salesReverted: due.length, productsReverted: reverted });
}
