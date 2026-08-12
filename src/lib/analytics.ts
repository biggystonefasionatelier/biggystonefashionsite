declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires the Meta Pixel Purchase event with the real order total, so ad
 * performance can be measured by actual revenue rather than just clicks.
 * Only ever called once per order - see the sessionStorage guard where
 * this is used on the checkout success page, so refreshing that page
 * doesn't double-count the same purchase.
 */
export function trackPurchase(value: number, currency = "NGN"): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", { value, currency });
  }
}
