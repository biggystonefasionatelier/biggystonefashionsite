import { NextResponse } from "next/server";
import { productSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { toProduct, type ProductDoc } from "@/lib/products";

// Auth is already enforced by middleware for everything under /api/admin/*.
// This route additionally only ever runs after that check passes.

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db
      .collection<ProductDoc>("products")
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    return NextResponse.json({ products: docs.map(toProduct) });
  } catch (err) {
    console.error("Admin products GET failed:", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const existing = await db.collection("products").findOne({ slug: parsed.data.slug });
    if (existing) {
      return NextResponse.json({ error: "A product with this slug already exists." }, { status: 400 });
    }

    const doc = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      price: parsed.data.price,
      category: parsed.data.category || null,
      product_type: parsed.data.productType,
      stock: parsed.data.stock,
      image_url: parsed.data.imageUrl || null,
      moq: parsed.data.moq ?? null,
      deposit_percent: parsed.data.depositPercent ?? null,
      active: parsed.data.active,
      created_at: new Date(),
    };

    const result = await db.collection<ProductDoc>("products").insertOne(doc as ProductDoc);
    return NextResponse.json({ product: toProduct({ _id: result.insertedId, ...doc }) });
  } catch (err) {
    console.error("Admin product create failed:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
