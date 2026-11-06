import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
});

/**
 * Sends a one-off marketing email to everyone on the signup list, via
 * Brevo's Campaigns API (not the transactional SMTP endpoint used
 * elsewhere in src/lib/brevo.ts) - a real campaign against the configured
 * list gets Brevo's own unsubscribe-link handling and delivery compliance
 * for free, instead of hand-rolling a bulk send that wouldn't.
 */
export async function POST(request: Request) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;
  const senderEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !listId || !senderEmail) {
    return NextResponse.json({ error: "Brevo is not fully configured" }, { status: 500 });
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

  const createRes = await fetch("https://api.brevo.com/v3/emailCampaigns", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: `Broadcast ${new Date().toISOString()}`,
      subject: parsed.data.subject,
      sender: { name: "Biggystone Fashion Atelier", email: senderEmail },
      htmlContent: parsed.data.htmlContent,
      recipients: { listIds: [Number(listId)] },
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error("Brevo campaign create failed:", createRes.status, text);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 502 });
  }

  const created = await createRes.json();
  const campaignId = created.id;

  const sendRes = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
    method: "POST",
    headers: { "api-key": apiKey, Accept: "application/json" },
  });

  if (!sendRes.ok) {
    const text = await sendRes.text();
    console.error("Brevo campaign send failed:", sendRes.status, text);
    return NextResponse.json(
      { error: "Campaign created but failed to send", campaignId },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, campaignId });
}
