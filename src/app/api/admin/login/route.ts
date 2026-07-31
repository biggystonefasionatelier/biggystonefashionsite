import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { verifyPasswordConstantTime } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

type AdminUserDoc = {
  _id: ObjectId;
  email: string;
  password_hash: string;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`admin-login:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const { email, password } = parsed.data;

  try {
    const db = await getDb();
    const admin = await db.collection<AdminUserDoc>("admin_users").findOne({ email });

    const validPassword = await verifyPasswordConstantTime(password, admin?.password_hash);
    if (!admin || !validPassword) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const token = await createSessionToken({ sub: admin._id.toString(), email: admin.email });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    console.error("Admin login failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
