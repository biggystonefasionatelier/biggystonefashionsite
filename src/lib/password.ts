import bcrypt from "bcryptjs";

/**
 * Kept separate from session.ts on purpose: this uses bcryptjs (fine in
 * Node API routes and scripts), while session.ts is imported by
 * src/middleware.ts and must stay Edge-safe.
 */

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// A precomputed hash of a value nobody will ever type, used to keep login
// timing the same whether or not the email exists - otherwise a missing
// user (instant reject) vs. a wrong password (bcrypt.compare runs) would
// respond at measurably different speeds, letting an attacker enumerate
// valid admin emails.
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO2p.3.9F.vXf9K5c9RgL6WOgY9Qkjqd6";

export function verifyPasswordConstantTime(password: string, hash: string | undefined): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}
