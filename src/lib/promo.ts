/**
 * September launch promo - a time-boxed sale, not a permanent site
 * feature. This is the one place to update if the dates or numbers ever
 * change; everything else (popup, homepage copy, checkout discount,
 * free delivery threshold) reads from here so nothing drifts out of sync.
 */
export const PROMO = {
  code: "BSTONESEPT",
  percent: 10,
  freeDeliveryThreshold: 50000,
  // Africa/Lagos is UTC+1 year-round (no DST), so a fixed +01:00 offset
  // is safe here without needing timezone-conversion logic.
  start: new Date("2026-09-01T00:00:00+01:00"),
  end: new Date("2026-09-30T23:59:59+01:00"),
};

export function isPromoActive(at: Date = new Date()): boolean {
  return at >= PROMO.start && at <= PROMO.end;
}

export function promoDaysRemaining(at: Date = new Date()): number {
  return Math.max(0, Math.ceil((PROMO.end.getTime() - at.getTime()) / (24 * 60 * 60 * 1000)));
}
