import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { PRE_ORDER_CATEGORIES, type CategoryMoqDoc } from "@/lib/categoryMoq";

// Auth is already enforced by middleware for everything under /api/admin/*.

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db.collection<CategoryMoqDoc>("category_moq").find({}).toArray();
    const byCategory = new Map(docs.map((d) => [d.category, d]));

    // Always return every known category, even ones with no MOQ/price set
    // yet, so the admin page can render a full, stable list.
    const categories = PRE_ORDER_CATEGORIES.map((category) => ({
      category,
      moq: byCategory.get(category)?.moq ?? null,
      price: byCategory.get(category)?.price ?? null,
    }));

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Admin category-moq GET failed:", err);
    return NextResponse.json({ error: "Failed to load MOQ settings" }, { status: 500 });
  }
}

const updateSchema = z.object({
  category: z.string().trim().min(1).max(100),
  moq: z.number().int().min(0),
  price: z.number().min(0).optional(),
  applyPriceToExisting: z.boolean().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const { category, moq, price } = parsed.data;

    // moq: 0 means "no minimum" - but we may still need to keep/update the
    // row if a price is set, so only delete the doc when there's neither a
    // moq nor a price to remember for this category.
    if (moq === 0 && price === undefined) {
      await db.collection("category_moq").deleteOne({ category });
    } else {
      const set: { moq: number; price?: number } = { moq };
      if (price !== undefined) set.price = price;
      await db.collection("category_moq").updateOne({ category }, { $set: set }, { upsert: true });
    }

    let updatedCount: number | null = null;
    if (parsed.data.applyPriceToExisting && price !== undefined) {
      const result = await db
        .collection("products")
        .updateMany({ product_type: "wholesale", category }, { $set: { price } });
      updatedCount = result.modifiedCount;
    }

    return NextResponse.json({ ok: true, updatedCount });
  } catch (err) {
    console.error("Admin category-moq POST failed:", err);
    return NextResponse.json({ error: "Failed to save MOQ" }, { status: 500 });
  }
}
