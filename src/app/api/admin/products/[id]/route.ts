import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { productSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { toProduct, type ProductDoc } from "@/lib/products";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const update: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) update.name = parsed.data.name;
    if (parsed.data.slug !== undefined) update.slug = parsed.data.slug;
    if (parsed.data.description !== undefined) update.description = parsed.data.description || null;
    if (parsed.data.price !== undefined) update.price = parsed.data.price;
    if (parsed.data.category !== undefined) update.category = parsed.data.category || null;
    if (parsed.data.colors !== undefined) {
      update.colors = parsed.data.colors.length > 0 ? parsed.data.colors : null;
    }
    if (parsed.data.productType !== undefined) update.product_type = parsed.data.productType;
    if (parsed.data.stock !== undefined) update.stock = parsed.data.stock;
    if (parsed.data.imageUrl !== undefined) update.image_url = parsed.data.imageUrl || null;
    if (parsed.data.moq !== undefined) update.moq = parsed.data.moq;
    if (parsed.data.depositPercent !== undefined) update.deposit_percent = parsed.data.depositPercent;
    if (parsed.data.active !== undefined) update.active = parsed.data.active;

    const result = await db
      .collection<ProductDoc>("products")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: update }, { returnDocument: "after" });

    if (!result) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: toProduct(result) });
  } catch (err) {
    console.error("Admin product update failed:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const db = await getDb();
    await db.collection("products").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin product delete failed:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
