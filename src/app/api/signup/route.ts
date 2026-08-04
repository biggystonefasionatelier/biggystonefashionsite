import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { addBrevoContact, sendAdminNotification } from "@/lib/brevo";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  // Max 5 signups per IP per 10 minutes - generous for real users, slows
  // down anyone trying to spam the form or scrape it.
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`signup:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, phone, birthday } = parsed.data;

  try {
    const db = await getDb();
    const signups = db.collection("email_signups");

    await signups.updateOne(
      { email },
      { $set: { name, email, phone, birthday: birthday || null }, $setOnInsert: { created_at: new Date(), brevo_synced: false } },
      { upsert: true }
    );

    const { synced } = await addBrevoContact({ name, email, phone, birthday: birthday || undefined });

    if (synced) {
      await signups.updateOne({ email }, { $set: { brevo_synced: true } });
    }

    await sendAdminNotification(
      `New signup — ${name}`,
      `<p><strong>${name}</strong> joined the email/birthday list.</p>
       <p>Email: ${email}<br>Phone: ${phone}${birthday ? `<br>Birthday: ${birthday}` : ""}</p>
       <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/signups">View in admin dashboard</a></p>`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Signup failed:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your details. Please try again." },
      { status: 500 }
    );
  }
}
