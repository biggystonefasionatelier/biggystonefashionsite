import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { toProduct, type ProductDoc } from "@/lib/products";

const searchSchema = z.object({
  embedding: z.array(z.number()).min(1).max(4096),
  productType: z.enum(["retail", "wholesale"]),
  category: z.string().trim().max(100).optional(),
});

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const query: Record<string, unknown> = {
      product_type: parsed.data.productType,
      active: true,
      embedding: { $exists: true, $type: "array", $ne: [] },
    };
    if (parsed.data.category) query.category = parsed.data.category;

    const candidates = await db.collection<ProductDoc>("products").find(query).toArray();

    const scored = candidates
      .filter((p) => Array.isArray(p.embedding) && p.embedding.length === parsed.data.embedding.length)
      .map((p) => ({
        product: p,
        score: cosineSimilarity(parsed.data.embedding, p.embedding as number[]),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 24);

    return NextResponse.json({
      products: scored.map((s) => toProduct(s.product)),
    });
  } catch (err) {
    console.error("search-by-image failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
