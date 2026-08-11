import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { generateResetToken, hashResetToken, RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { sendAdminPasswordResetEmail } from "@/lib/brevo";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

// Always the same response whether or not the email is a real admin
// account - anything else would let someone probe for valid admin emails.
const GENERIC_MESSAGE = "If that email is registered, a password reset link has been sent to it.";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`admin-forgot-password:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  try {
    const db = await getDb();
    const admin = await db.collection("admin_users").findOne({ email: parsed.data.email });

    if (admin) {
      const token = generateResetToken();
      await db.collection("admin_users").updateOne(
        { _id: admin._id },
        {
          $set: {
            reset_token_hash: hashResetToken(token),
            reset_token_expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          },
        }
      );

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const resetUrl = `${siteUrl}/admin/reset-password?token=${token}`;
      await sendAdminPasswordResetEmail(admin.email, resetUrl);
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error("Admin forgot-password failed:", err);
    // Still generic - an internal error shouldn't reveal anything either.
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}
