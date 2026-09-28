import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { PRE_ORDER_CATEGORIES, type CategoryMoqDoc } from "@/lib/categoryMoq";

// Auth is already enforced by middleware for everything under /api/admin/*.

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db.collection<CategoryMoqDoc>("category_moq").find({}).toArray();
    const byCategory = new Map(docs.map((d) => [d.category, d.moq]));

    // Always return every known category, even ones with no MOQ set yet
    // (moq: null), so the admin page can render a full, stable list.
    const categories = PRE_ORDER_CATEGORIES.map((category) => ({
      category,
      moq: byCategory.get(category) ?? null,
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
    // moq: 0 means "no minimum" - stored the same as not having a row at
    // all, so the checkout check (which skips categories with no entry)
    // treats them identically.
    if (parsed.data.moq === 0) {
      await db.collection("category_moq").deleteOne({ category: parsed.data.category });
    } else {
      await db.collection("category_moq").updateOne(
        { category: parsed.data.category },
        { $set: { moq: parsed.data.moq } },
        { upsert: true }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin category-moq POST failed:", err);
    return NextResponse.json({ error: "Failed to save MOQ" }, { status: 500 });
  }
}
