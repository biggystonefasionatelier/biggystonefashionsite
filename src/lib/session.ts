import { SignJWT, jwtVerify } from "jose";

/**
 * Admin session token handling, built on `jose` (not `jsonwebtoken`)
 * specifically because this must work from src/middleware.ts, which can
 * run on the Edge runtime where Node's native crypto module isn't
 * available - jose works in both.
 */

export const SESSION_COOKIE_NAME = "biggystone_admin_session";

export type SessionPayload = {
  sub: string;
  email: string;
};

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing. Check your .env.local file.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
