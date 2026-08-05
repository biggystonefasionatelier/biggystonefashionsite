import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sendAdminNotification } from "@/lib/brevo";

const ABANDONED_AFTER_MINUTES = 45;

type OrderItemDoc = { product_name: string; quantity: number; unit_price: number };
type OrderDoc = {
  _id: unknown;
  customer_name: string;
  email: string;
  phone: string;
  total: number;
  order_type: "retail" | "wholesale";
  order_items: OrderItemDoc[];
  created_at: Date;
};

/**
 * Runs once a day (Vercel Hobby plan caps cron frequency at daily - see
 * vercel.json). Flags any checkout that was started but never paid for,
 * more than ABANDONED_AFTER_MINUTES ago, so Faith can follow up on
 * WhatsApp. Each order is only ever notified once, tracked via
 * abandoned_notified, so this can safely run daily without re-alerting
 * on the same stale order every time.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MINUTES * 60 * 1000);

  const abandoned = await db
    .collection<OrderDoc>("orders")
    .find({ status: "pending", created_at: { $lt: cutoff }, abandoned_notified: { $ne: true } })
    .toArray();

  for (const order of abandoned) {
    const itemsList = order.order_items
      .map((i) => `${i.quantity} × ${i.product_name}`)
      .join("<br>");

    await sendAdminNotification(
      `Abandoned checkout — ${order.customer_name} (₦${order.total.toLocaleString()})`,
      `<p><strong>${order.customer_name}</strong> started a ${order.order_type} checkout on
       ${order.created_at.toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} but never completed payment.</p>
       <p>Email: ${order.email}<br>Phone: ${order.phone}</p>
       <p>${itemsList}</p>
       <p><strong>Total: ₦${order.total.toLocaleString()}</strong></p>
       <p>Worth a WhatsApp nudge to see if they need help completing payment.</p>`
    );

    await db.collection("orders").updateOne({ _id: order._id }, { $set: { abandoned_notified: true } });
  }

  return NextResponse.json({ checked: abandoned.length });
}
