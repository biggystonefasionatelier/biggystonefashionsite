import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";

/**
 * Refer-a-friend rewards: every signup gets a personal code. Share it as
 * a link (?ref=CODE) - when someone genuinely new signs up through it,
 * the referrer earns a ₦100 credit. Each credit is only valid for 7 days
 * from when it was earned (not a running account that never expires), and
 * the referrer redeems whatever's still valid by typing their own code in
 * as a discount code at checkout - reusing the existing checkout field
 * rather than a separate "my rewards" page, since there are no customer
 * accounts on this site.
 */
export const REFERRAL_CREDIT_AMOUNT = 100;
export const REFERRAL_CREDIT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
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

function generateCode(): string {
  return CODE_PREFIX + randomBytes(4).toString("hex").toUpperCase();
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

/**
 * Credits the referrer if `referralCode` is valid and belongs to someone
 * other than the person signing up. Silently does nothing on any invalid
 * input (bad code, self-referral) - a wrong/missing referral code should
 * never block someone from signing up.
 */
export async function creditReferralIfValid(
  db: Db,
  referralCode: string,
  referredEmail: string
): Promise<void> {
  const code = referralCode.trim().toUpperCase();
  if (!code) return;

  const referrer = await db.collection("email_signups").findOne({ referral_code: code });
  if (!referrer || referrer.email === referredEmail) return;

  await db.collection<ReferralCreditDoc>("referral_credits").insertOne({
    referrer_email: referrer.email,
    referred_email: referredEmail,
    amount: REFERRAL_CREDIT_AMOUNT,
    earned_at: new Date(),
    used: false,
    used_at: null,
    used_order_id: null,
  } as ReferralCreditDoc);
}

/** Oldest-first, so the credits closest to expiring get spent first. */
export async function getAvailableCredits(db: Db, email: string): Promise<ReferralCreditDoc[]> {
  const cutoff = new Date(Date.now() - REFERRAL_CREDIT_TTL_MS);
  return db
    .collection<ReferralCreditDoc>("referral_credits")
    .find({ referrer_email: email, used: false, earned_at: { $gte: cutoff } })
    .sort({ earned_at: 1 })
    .toArray();
}

export type ReferralCodeEligibility =
  | { eligible: true; credits: ReferralCreditDoc[] }
  | { eligible: false; reason: "invalid_code" | "wrong_email" | "no_credit" };

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
    case "no_credit":
      return "You don't have any referral credit available right now - it may have expired (credits last 7 days) or already been used.";
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
