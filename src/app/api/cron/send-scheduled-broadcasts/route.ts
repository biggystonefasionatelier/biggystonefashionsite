import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { sendBroadcastCampaign } from "@/lib/brevo";

type ScheduledBroadcastDoc = {
  _id: ObjectId;
  subject: string;
  html_content: string;
  send_at: Date;
  status: "pending" | "done" | "failed";
};

/**
 * Runs daily (see vercel.json) and sends any queued broadcast whose send_at
 * has passed - a no-op on days with nothing queued.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const due = await db
    .collection<ScheduledBroadcastDoc>("scheduled_broadcasts")
    .find({ status: "pending", send_at: { $lte: new Date() } })
    .toArray();

  let sent = 0;
  let failed = 0;
  for (const broadcast of due) {
    const result = await sendBroadcastCampaign({
      subject: broadcast.subject,
      htmlContent: broadcast.html_content,
    });
    await db
      .collection("scheduled_broadcasts")
      .updateOne({ _id: broadcast._id }, { $set: { status: result.ok ? "done" : "failed" } });
    if (result.ok) sent++;
    else failed++;
  }

  return NextResponse.json({ sent, failed });
}
