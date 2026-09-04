import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";
import { sendReferralCreditEmail } from "@/lib/brevo";

/**
 * Refer-a-friend rewards: every signup gets a personal code. Share it as
 * a link (?ref=CODE) - when someone genuinely new signs up through it,
 * the referrer earns a ₦100 credit. The code itself (and everything
 * earned through it, spent or not) expires 7 days after the REFERRER
 * signed up - one fixed deadline per person, not a rolling per-credit
 * timer, so it's simple to explain: "refer friends within your first
 * week." The referrer redeems whatever's still valid by typing their own
 * code in as a discount code at checkout - reusing the existing checkout
 * field rather than a separate "my rewards" page, since there are no
 * customer accounts on this site.
 */
export const REFERRAL_CREDIT_AMOUNT = 100;
export const REFERRAL_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CODE_PREFIX = "REF-";

export type ReferralCreditDoc = {
  _id: ObjectId;
  referrer_email: string;
  referred_email: string;
  amount: number;
  earned_at: Date;
  used: boolean;
  used_at: Date | null;
  used_order_id: ObjectId | null;
};

// 6 hex chars (24 bits, ~16.7M combinations) is plenty for this scale and
// keeps the shareable code/link short - collisions are still checked for
// below regardless.
function generateCode(): string {
  return CODE_PREFIX + randomBytes(3).toString("hex").toUpperCase();
}

function isCodeExpired(signupCreatedAt: Date): boolean {
  return Date.now() > signupCreatedAt.getTime() + REFERRAL_CODE_TTL_MS;
}

function daysRemaining(signupCreatedAt: Date): number {
  const msLeft = signupCreatedAt.getTime() + REFERRAL_CODE_TTL_MS - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

/** Every signup should have one - generated once at signup time, but this
 * can also backfill an older record that predates the referral program. */
export async function ensureReferralCode(db: Db, email: string): Promise<string> {
  const existing = await db.collection("email_signups").findOne({ email });
  if (existing?.referral_code) return existing.referral_code;

  let code = generateCode();
  // Astronomically unlikely to collide (32 bits of randomness), but loop
  // just in case rather than trust that blindly.
  while (await db.collection("email_signups").findOne({ referral_code: code })) {
    code = generateCode();
  }

  await db.collection("email_signups").updateOne({ email }, { $set: { referral_code: code } });
  return code;
}

export type ReferralCreditResult =
  | { credited: true; referrerName: string; referrerEmail: string }
  | { credited: false };

/**
 * Credits the referrer if `referralCode` is valid, still within its
 * 7-day window, and belongs to someone other than the person signing up.
 * Silently does nothing on any invalid input (bad/expired code,
 * self-referral) - a wrong referral code should never block someone from
 * signing up. Emails the referrer a confirmation with their new balance
 * on success (best-effort, doesn't throw). Returns who was credited (if
 * anyone) so the caller can reflect it in Faith's admin notification.
 */
export async function creditReferralIfValid(
  db: Db,
  referralCode: string,
  referredEmail: string
): Promise<ReferralCreditResult> {
  const code = referralCode.trim().toUpperCase();
  if (!code) return { credited: false };

  const referrer = await db.collection("email_signups").findOne({ referral_code: code });
  if (!referrer || referrer.email === referredEmail) return { credited: false };
  if (isCodeExpired(referrer.created_at)) return { credited: false };

  await db.collection<ReferralCreditDoc>("referral_credits").insertOne({
    referrer_email: referrer.email,
    referred_email: referredEmail,
    amount: REFERRAL_CREDIT_AMOUNT,
    earned_at: new Date(),
    used: false,
    used_at: null,
    used_order_id: null,
  } as ReferralCreditDoc);

  const balance = await getBalance(db, referrer.email);
  await sendReferralCreditEmail({
    email: referrer.email,
    name: referrer.name,
    balance,
    daysLeft: daysRemaining(referrer.created_at),
    referralCode: code,
  });

  return { credited: true, referrerName: referrer.name, referrerEmail: referrer.email };
}

export async function getAvailableCredits(db: Db, email: string): Promise<ReferralCreditDoc[]> {
  return db
    .collection<ReferralCreditDoc>("referral_credits")
    .find({ referrer_email: email, used: false })
    .sort({ earned_at: 1 })
    .toArray();
}

export async function getBalance(db: Db, email: string): Promise<number> {
  const credits = await getAvailableCredits(db, email);
  return credits.reduce((sum, c) => sum + c.amount, 0);
}

export type ReferralCodeEligibility =
  | { eligible: true; credits: ReferralCreditDoc[] }
  | { eligible: false; reason: "invalid_code" | "wrong_email" | "code_expired" | "no_credit" };

export async function checkReferralCodeEligibility(
  db: Db,
  checkoutEmail: string,
  code: string
): Promise<ReferralCodeEligibility> {
  const owner = await db.collection("email_signups").findOne({ referral_code: code.trim().toUpperCase() });
  if (!owner) return { eligible: false, reason: "invalid_code" };
  // Matches by exact string, same as the birthday-discount check in
  // src/lib/discount.ts - emails aren't case-normalized at signup, so
  // this stays consistent with how that lookup already behaves.
  if (owner.email !== checkoutEmail.trim()) {
    return { eligible: false, reason: "wrong_email" };
  }
  if (isCodeExpired(owner.created_at)) {
    return { eligible: false, reason: "code_expired" };
  }

  const credits = await getAvailableCredits(db, owner.email);
  if (credits.length === 0) return { eligible: false, reason: "no_credit" };

  return { eligible: true, credits };
}

export function referralCodeIneligibilityMessage(
  reason: Exclude<ReferralCodeEligibility, { eligible: true }>["reason"]
): string {
  switch (reason) {
    case "invalid_code":
      return "That referral code isn't valid.";
    case "wrong_email":
      return "That referral code belongs to a different email address.";
    case "code_expired":
      return "This referral code has expired - codes and any credit earned through them are only valid for 7 days after signing up.";
    case "no_credit":
      return "You don't have any referral credit available right now - it may already be used up.";
  }
}

export async function markReferralCreditsUsed(
  db: Db,
  creditIds: string[],
  orderId: ObjectId
): Promise<void> {
  if (creditIds.length === 0) return;
  await db.collection("referral_credits").updateMany(
    { _id: { $in: creditIds.map((id) => new ObjectId(id)) }, used: false },
    { $set: { used: true, used_at: new Date(), used_order_id: orderId } }
  );
}
