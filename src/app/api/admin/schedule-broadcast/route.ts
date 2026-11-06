import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const bodySchema = z.object({
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  sendAt: z.string().datetime(),
});

/**
 * Queues a marketing email to go out later (e.g. "send a reminder
 * tomorrow"), without needing anything to stay running in the meantime -
 * /api/cron/send-scheduled-broadcasts picks it up once its time has
 * passed. Same pattern as /api/admin/flash-sale-revert.
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
  const result = await db.collection("scheduled_broadcasts").insertOne({
    subject: parsed.data.subject,
    html_content: parsed.data.htmlContent,
    send_at: new Date(parsed.data.sendAt),
    status: "pending",
    created_at: new Date(),
  });

  return NextResponse.json({ id: result.insertedId.toString() });
}
