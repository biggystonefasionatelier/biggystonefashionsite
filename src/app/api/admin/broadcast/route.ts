import { NextResponse } from "next/server";
import { z } from "zod";
import { sendBroadcastCampaign } from "@/lib/brevo";

const bodySchema = z.object({
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
});

/**
 * Sends a one-off marketing email to everyone on the signup list, right
 * now. For a future send time, see /api/admin/schedule-broadcast instead.
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

  const result = await sendBroadcastCampaign(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, campaignId: result.campaignId }, { status: 502 });
  }

  return NextResponse.json({ ok: true, campaignId: result.campaignId });
}
