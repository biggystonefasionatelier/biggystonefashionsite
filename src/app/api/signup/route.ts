import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { addBrevoContact, sendAdminNotification, sendWelcomeEmail } from "@/lib/brevo";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { ensureReferralCode, creditReferralIfValid } from "@/lib/referral";

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

  const { name, email, phone, birthday, referralCode } = parsed.data;

  try {
    const db = await getDb();
    const signups = db.collection("email_signups");

    const upsertResult = await signups.updateOne(
      { email },
      { $set: { name, email, phone, birthday: birthday || null }, $setOnInsert: { created_at: new Date(), brevo_synced: false } },
      { upsert: true }
    );
    const isNewSignup = upsertResult.upsertedCount > 0;

    const { synced } = await addBrevoContact({ name, email, phone, birthday: birthday || undefined });

    if (synced) {
      await signups.updateOne({ email }, { $set: { brevo_synced: true } });
    }

    const myReferralCode = await ensureReferralCode(db, email);

    // Only welcome brand-new signups - re-submitting the form to update
    // your birthday/phone shouldn't trigger a second welcome email or a
    // repeat referral credit for whoever referred them the first time.
    let referralResult: Awaited<ReturnType<typeof creditReferralIfValid>> = { credited: false };
    if (isNewSignup) {
      await sendWelcomeEmail({ email, name, referralCode: myReferralCode });
      if (referralCode) {
        referralResult = await creditReferralIfValid(db, referralCode, email);
      }
    }

    const referralLine = referralResult.credited
      ? `<p>🔗 Referred by <strong>${referralResult.referrerName}</strong> (${referralResult.referrerEmail}) — ₦100 credited to them.</p>`
      : referralCode
        ? `<p>🔗 Signed up with a referral code (${referralCode}), but it wasn't valid/credited (expired, unknown, or self-referral).</p>`
        : "";

    await sendAdminNotification(
      `New signup — ${name}`,
      `<p><strong>${name}</strong> joined the email/birthday list.</p>
       <p>Email: ${email}<br>Phone: ${phone}${birthday ? `<br>Birthday: ${birthday}` : ""}</p>
       ${referralLine}
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
