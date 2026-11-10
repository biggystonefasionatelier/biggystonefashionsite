import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import type { ProductDoc } from "@/lib/products";

// MobileNet embeddings for the exact same photo (even re-compressed or
// resized) score extremely close to 1.0 - this sits high enough to catch
// that without flagging two merely similar-looking products as duplicates.
const DUPLICATE_THRESHOLD = 0.97;

const bodySchema = z.object({
  embedding: z.array(z.number()).min(1).max(4096),
  productType: z.enum(["retail", "wholesale"]),
  excludeProductId: z.string().optional(),
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

/**
 * Checks a newly uploaded product photo's embedding against every other
 * product in the same catalog (retail/wholesale are separate - the same
 * piece intentionally listed in both isn't a mistake), flagging the
 * closest match if it looks like the same picture already in use.
 * Best-effort/advisory only, not a hard block - ProductForm shows this as
 * a dismissible warning so Faith can decide, since a false positive
 * shouldn't ever prevent saving a real product.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
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
      embedding: { $exists: true, $type: "array", $ne: [] },
    };
    if (parsed.data.excludeProductId && ObjectId.isValid(parsed.data.excludeProductId)) {
      query._id = { $ne: new ObjectId(parsed.data.excludeProductId) };
    }

    const candidates = await db.collection<ProductDoc>("products").find(query).toArray();

    let best: { id: string; name: string; imageUrl: string | null; score: number } | null = null;
    for (const p of candidates) {
      if (!Array.isArray(p.embedding) || p.embedding.length !== parsed.data.embedding.length) continue;
      const score = cosineSimilarity(parsed.data.embedding, p.embedding as number[]);
      if (!best || score > best.score) {
        best = { id: p._id.toString(), name: p.name, imageUrl: p.image_url ?? null, score };
      }
    }

    const duplicate = !!best && best.score >= DUPLICATE_THRESHOLD;
    return NextResponse.json({ duplicate, match: duplicate ? best : null });
  } catch (err) {
    console.error("check-duplicate-photo failed:", err);
    return NextResponse.json({ error: "Duplicate check failed" }, { status: 500 });
  }
}
