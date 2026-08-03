import type { Db } from "mongodb";

export const BIRTHDAY_DISCOUNT_CODE = "BSTONEBDAY";
export const BIRTHDAY_DISCOUNT_PERCENT = 10;

type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: "invalid_code" | "not_signed_up" | "wrong_month" | "already_used" };

/**
 * The birthday discount is one shared code (not unique per customer) -
 * eligibility instead comes from matching the checkout email against the
 * signup list: they must be on it, it must currently be their birthday
 * month, and they mustn't have already redeemed it this calendar year
 * (birthday_discount_used_year resets the check automatically every
 * January without needing a cron job).
 */
export async function checkBirthdayDiscountEligibility(
  db: Db,
  email: string,
  code: string
): Promise<EligibilityResult> {
  if (code.trim().toUpperCase() !== BIRTHDAY_DISCOUNT_CODE) {
    return { eligible: false, reason: "invalid_code" };
  }

  const signup = await db.collection("email_signups").findOne({ email });
  if (!signup || !signup.birthday) {
    return { eligible: false, reason: "not_signed_up" };
  }

  const [birthMonth] = (signup.birthday as string).split("-").map(Number);
  const now = new Date();
  if (birthMonth !== now.getMonth() + 1) {
    return { eligible: false, reason: "wrong_month" };
  }

  if (signup.birthday_discount_used_year === now.getFullYear()) {
    return { eligible: false, reason: "already_used" };
  }

  return { eligible: true };
}

export function discountIneligibilityMessage(reason: Exclude<EligibilityResult, { eligible: true }>["reason"]): string {
  switch (reason) {
    case "invalid_code":
      return "That discount code isn't valid.";
    case "not_signed_up":
      return "This discount is for customers on our email list - sign up on the site first, then use this code during your birthday month.";
    case "wrong_month":
      return "This code is only valid during your birthday month.";
    case "already_used":
      return "You've already used your birthday discount this year - see you next year!";
  }
}

export async function markBirthdayDiscountUsed(db: Db, email: string): Promise<void> {
  await db
    .collection("email_signups")
    .updateOne({ email }, { $set: { birthday_discount_used_year: new Date().getFullYear() } });
}
