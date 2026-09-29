/**
 * Short automatic retail flash sale - unlike the code-based September
 * promo (see promo.ts), this needs no code: eligible items just show
 * discounted everywhere (shop, cart, checkout) for as long as it's
 * active. This is the one place to update if the dates/percent/minimum
 * ever change.
 */
export const FLASH_SALE = {
  percent: 25,
  minPrice: 1000, // items priced below this are not discounted
  // Africa/Lagos is UTC+1 year-round (no DST), so a fixed +01:00 offset
  // is safe here without needing timezone-conversion logic.
  start: new Date("2026-09-29T00:00:00+01:00"),
  end: new Date("2026-10-01T23:59:59+01:00"),
};

export function isFlashSaleActive(at: Date = new Date()): boolean {
  return at >= FLASH_SALE.start && at <= FLASH_SALE.end;
}

export function isFlashSaleEligible(price: number): boolean {
  return price >= FLASH_SALE.minPrice;
}

/** Retail-only, and only for eligible (>= minPrice) items - returns the
 * original price unchanged outside the sale window or for cheaper pieces. */
export function flashSaleUnitPrice(
  price: number,
  productType: "retail" | "wholesale",
  at: Date = new Date()
): number {
  if (productType !== "retail" || !isFlashSaleActive(at) || !isFlashSaleEligible(price)) {
    return price;
  }
  return Math.round(price - (price * FLASH_SALE.percent) / 100);
}

export function flashSaleEndLabel(): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(FLASH_SALE.end);
}
