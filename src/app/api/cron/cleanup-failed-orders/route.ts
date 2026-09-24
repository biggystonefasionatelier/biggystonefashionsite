import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const CLEANUP_AFTER_DAYS = 3;

/**
 * Runs once a day (Vercel Hobby plan caps cron frequency at daily - see
 * vercel.json). Deletes orders that never turned into a sale - failed or
 * cancelled - once they're a few days old, so the admin orders list stays
 * mostly paid/pending instead of accumulating abandoned-checkout clutter.
 * The 3-day wait is a grace window: Faith sometimes fixes a mis-marked
 * order's status by hand shortly after the fact (see the checkout/verify
 * amount-mismatch safeguard), so this never removes anything same-day.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const cutoff = new Date(Date.now() - CLEANUP_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const result = await db.collection("orders").deleteMany({
    status: { $in: ["failed", "cancelled"] },
    created_at: { $lt: cutoff },
  });

  return NextResponse.json({ deleted: result.deletedCount });
}
