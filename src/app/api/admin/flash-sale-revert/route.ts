import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const bodySchema = z.object({
  endsAt: z.string().datetime(),
  items: z
    .array(z.object({ productId: z.string(), price: z.number().positive() }))
    .min(1)
    .max(2000),
});

/**
 * Schedules a flash-sale price revert: Faith drops prices herself (e.g. by
 * bulk-editing products), then this stashes what each one should go back to
 * and when, so the /api/cron/revert-flash-sale job can restore them on its
 * own later - without anyone needing to remember, and without any admin
 * credential living outside her own logged-in session that made this call.
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

  const db = await getDb();
  const result = await db.collection("flash_sale_reverts").insertOne({
    ends_at: new Date(parsed.data.endsAt),
    items: parsed.data.items,
    status: "pending",
    created_at: new Date(),
  });

  return NextResponse.json({ id: result.insertedId.toString() });
}
