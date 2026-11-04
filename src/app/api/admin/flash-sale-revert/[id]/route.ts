import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const bodySchema = z.object({ endsAt: z.string().datetime() });

/**
 * Extends (or shortens) a still-pending flash sale's end time - e.g. "extend
 * the sale to tomorrow 11:59PM" - without touching the items/prices already
 * stashed for it. Only works while status is still "pending"; once the cron
 * has reverted it, there's nothing left to extend.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

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
  const result = await db.collection("flash_sale_reverts").findOneAndUpdate(
    { _id: new ObjectId(id), status: "pending" },
    { $set: { ends_at: new Date(parsed.data.endsAt) } },
    { returnDocument: "after" }
  );

  if (!result) {
    return NextResponse.json(
      { error: "No pending flash sale revert found with that id" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, ends_at: result.ends_at });
}
