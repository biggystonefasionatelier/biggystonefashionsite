import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { hashResetToken } from "@/lib/passwordReset";
import { hashPassword } from "@/lib/password";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const schema = z.object({
  token: z.string().trim().min(1),
  newPassword: z.string().min(10, "Password must be at least 10 characters"),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`admin-reset-password:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const tokenHash = hashResetToken(parsed.data.token);

    const admin = await db.collection("admin_users").findOne({
      reset_token_hash: tokenHash,
      reset_token_expires: { $gt: new Date() },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await db.collection("admin_users").updateOne(
      { _id: admin._id },
      {
        $set: { password_hash: passwordHash },
        $unset: { reset_token_hash: "", reset_token_expires: "" },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin reset-password failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
