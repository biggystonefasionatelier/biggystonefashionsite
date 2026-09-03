import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { toProduct, type ProductDoc } from "@/lib/products";
import {
  BIRTHDAY_DISCOUNT_PERCENT,
  checkBirthdayDiscountEligibility,
  discountIneligibilityMessage,
} from "@/lib/discount";
import { checkGiftVoucherEligibility, giftVoucherIneligibilityMessage } from "@/lib/giftVoucher";
import {
  checkReferralCodeEligibility,
  referralCodeIneligibilityMessage,
  REFERRAL_CREDIT_AMOUNT,
} from "@/lib/referral";
import { calculateBundleDiscount } from "@/lib/bundleDiscount";
import { PROMO, isPromoActive } from "@/lib/promo";

/**
 * Shared between /api/checkout/initialize (the real, payment-creating
 * route) and /api/checkout/preview-discount (a read-only "what would this
 * code do" check for the checkout page UI) - kept in one place so the two
 * can never drift apart and disagree on what a code is actually worth.
 */

export type CartItemInput = { productId: string; quantity: number; color?: string };

export type ResolvedCart =
  | {
      ok: true;
      products: ReturnType<typeof toProduct>[];
      orderItems: {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        color: string | null;
        image_url: string | null;
      }[];
      total: number;
      bundleDiscount: number;
      amountDue: number;
    }
  | { ok: false; error: string };

export async function resolveCart(
  db: Db,
  params: { orderType: "retail" | "wholesale"; items: CartItemInput[]; depositOnly?: boolean }
): Promise<ResolvedCart> {
  const { orderType, items, depositOnly } = params;

  const productIds = items.map((i) => new ObjectId(i.productId));
  const productDocs = await db
    .collection<ProductDoc>("products")
    .find({ _id: { $in: productIds }, active: true })
    .toArray();
  const products = productDocs.map(toProduct);

  if (products.length !== items.length) {
    return { ok: false, error: "One or more items in your cart are no longer available." };
  }

  const mismatched = products.find((p) => p.product_type !== orderType);
  if (mismatched) {
    return {
      ok: false,
      error: "Retail and pre-order wholesale items can't be checked out together. Please check out separately.",
    };
  }

  let total = 0;
  let stockError: string | null = null;
  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;

    if (orderType === "retail" && product.stock < item.quantity) {
      stockError = `Not enough stock for ${product.name}`;
    }

    const lineTotal = product.price * item.quantity;
    total += lineTotal;

    return {
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: product.price,
      color: item.color || null,
      image_url: product.image_url || null,
    };
  });
  if (stockError) return { ok: false, error: stockError };

  const bundleDiscount =
    orderType === "retail"
      ? calculateBundleDiscount(
          orderItems.map((i) => ({ productId: i.product_id, price: i.unit_price, quantity: i.quantity }))
        )
      : 0;

  let amountDue = total - bundleDiscount;
  if (orderType === "wholesale" && depositOnly) {
    const depositPercents = products
      .map((p) => p.deposit_percent ?? 100)
      .filter((n) => !Number.isNaN(n));
    const depositPercent = depositPercents.length ? Math.max(...depositPercents) : 100;
    amountDue = Math.round((total * depositPercent) / 100);
  }

  return { ok: true, products, orderItems, total, bundleDiscount, amountDue };
}

export type ResolvedDiscount =
  | {
      ok: true;
      discountAmount: number;
      appliedDiscountCode: string;
      appliedGiftVoucherCode: string | null;
      referralCreditIds: string[];
      freeDeliveryFromVoucher: boolean;
      referralBalance: number | null;
    }
  | { ok: false; error: string };

export async function resolveDiscountCode(
  db: Db,
  params: { orderType: "retail" | "wholesale"; email: string; discountCode: string; amountDue: number }
): Promise<ResolvedDiscount> {
  const { orderType, email, amountDue } = params;

  if (orderType !== "retail") {
    return { ok: false, error: "Discount codes only apply to retail orders." };
  }

  const code = params.discountCode.trim().toUpperCase();

  if (code === PROMO.code) {
    if (!isPromoActive()) {
      return { ok: false, error: "That code isn't active right now." };
    }
    return {
      ok: true,
      discountAmount: Math.round((amountDue * PROMO.percent) / 100),
      appliedDiscountCode: code,
      appliedGiftVoucherCode: null,
      referralCreditIds: [],
      freeDeliveryFromVoucher: false,
      referralBalance: null,
    };
  }

  if (code.startsWith("GIFT-")) {
    const eligibility = await checkGiftVoucherEligibility(db, email, code);
    if (!eligibility.eligible) {
      return { ok: false, error: giftVoucherIneligibilityMessage(eligibility.reason) };
    }
    const isFixed = eligibility.voucher.type === "fixed_discount";
    return {
      ok: true,
      discountAmount: isFixed ? Math.min(amountDue, eligibility.voucher.amount ?? 0) : 0,
      appliedDiscountCode: code,
      appliedGiftVoucherCode: code,
      referralCreditIds: [],
      freeDeliveryFromVoucher: !isFixed,
      referralBalance: null,
    };
  }

  if (code.startsWith("REF-")) {
    const eligibility = await checkReferralCodeEligibility(db, email, code);
    if (!eligibility.eligible) {
      return { ok: false, error: referralCodeIneligibilityMessage(eligibility.reason) };
    }
    const balance = eligibility.credits.reduce((sum, c) => sum + c.amount, 0);
    // Credits only come in whole ₦100 units, so spend as many as fit both
    // the order total and the available balance - never partial.
    const maxAffordable = Math.floor(amountDue / REFERRAL_CREDIT_AMOUNT);
    const creditsToUse = eligibility.credits.slice(0, Math.min(maxAffordable, eligibility.credits.length));
    if (creditsToUse.length === 0) {
      return {
        ok: false,
        error: `Your order isn't large enough to use a ₦${REFERRAL_CREDIT_AMOUNT} referral credit yet (you have ₦${balance.toLocaleString()} available).`,
      };
    }
    return {
      ok: true,
      discountAmount: creditsToUse.length * REFERRAL_CREDIT_AMOUNT,
      appliedDiscountCode: code,
      appliedGiftVoucherCode: null,
      referralCreditIds: creditsToUse.map((c) => c._id.toString()),
      freeDeliveryFromVoucher: false,
      referralBalance: balance,
    };
  }

  const eligibility = await checkBirthdayDiscountEligibility(db, email, code);
  if (!eligibility.eligible) {
    return { ok: false, error: discountIneligibilityMessage(eligibility.reason) };
  }
  return {
    ok: true,
    discountAmount: Math.round((amountDue * BIRTHDAY_DISCOUNT_PERCENT) / 100),
    appliedDiscountCode: code,
    appliedGiftVoucherCode: null,
    referralCreditIds: [],
    freeDeliveryFromVoucher: false,
    referralBalance: null,
  };
}
