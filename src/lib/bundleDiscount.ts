/**
 * Automatic "buy 3 of the same product" bundle pricing - not a code the
 * customer enters, computed straight from the cart. Repeats per complete
 * group of 3 (6 of the same item = ₦1,000 off, 9 = ₦1,500, ...). Different
 * colors of the same product still count toward the same group, since
 * it's the same underlying product either way.
 */
export const BUNDLE_MIN_PRICE = 2000;
export const BUNDLE_GROUP_SIZE = 3;
export const BUNDLE_DISCOUNT_PER_GROUP = 500;

export function calculateBundleDiscount(
  items: { productId: string; price: number; quantity: number }[]
): number {
  const quantityByProduct = new Map<string, { price: number; quantity: number }>();

  for (const item of items) {
    const existing = quantityByProduct.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      quantityByProduct.set(item.productId, { price: item.price, quantity: item.quantity });
    }
  }

  let discount = 0;
  for (const { price, quantity } of quantityByProduct.values()) {
    if (price < BUNDLE_MIN_PRICE) continue;
    const groups = Math.floor(quantity / BUNDLE_GROUP_SIZE);
    discount += groups * BUNDLE_DISCOUNT_PER_GROUP;
  }

  return discount;
}
