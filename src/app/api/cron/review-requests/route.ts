import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sendReviewRequestEmail } from "@/lib/brevo";

const DAYS_AFTER_PAYMENT = 7;
// Bounds the query to a rolling week-wide window (day 7-14 after payment)
// instead of "everything older than 7 days" - otherwise the first run
// after this feature ships would blast every old paid order in the
// database with a review request all at once.
const WINDOW_END_DAYS = 14;

type OrderDoc = {
  _id: unknown;
  customer_name: string;
  email: string;
  status: string;
  created_at: Date;
};

/**
 * Runs once a day (Vercel Hobby plan caps cron frequency at daily - see
 * vercel.json). Emails a Google review request for any paid order that
 * crossed the 7-day mark since yesterday's run. review_requested tracks
 * which orders have already been asked, so this is safe to run daily
 * without repeat-asking the same customer.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const windowStart = new Date(Date.now() - WINDOW_END_DAYS * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(Date.now() - DAYS_AFTER_PAYMENT * 24 * 60 * 60 * 1000);

  const dueForReview = await db
    .collection<OrderDoc>("orders")
    .find({
      status: "paid",
      created_at: { $gte: windowStart, $lte: windowEnd },
      review_requested: { $ne: true },
    })
    .toArray();

  for (const order of dueForReview) {
    await sendReviewRequestEmail({ email: order.email, name: order.customer_name });
    await db.collection("orders").updateOne({ _id: order._id }, { $set: { review_requested: true } });
  }

  return NextResponse.json({ checked: dueForReview.length });
}
