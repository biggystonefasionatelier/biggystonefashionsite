import { randomBytes, createHash } from "node:crypto";

/**
 * The raw token goes out in the email link; only its hash is ever stored,
 * same principle as password hashing - a database leak alone shouldn't
 * hand out a usable reset link.
 */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
