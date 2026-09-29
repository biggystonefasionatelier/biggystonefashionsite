import type { Db } from "mongodb";

// Matches the category suggestions in ProductForm's datalist, plus
// "Button Covers" which is also a real live category. Kept as a fixed
// list (rather than derived from whatever categories happen to exist)
// so the admin MOQ page always shows every category to configure, even
// ones with zero pre-order pieces yet.
export const PRE_ORDER_CATEGORIES = [
  "Earrings",
  "Neckpieces",
  "Bracelets",
  "Brooches",
  "Male Jewelry",
  "Rings",
  "Hair Accessories",
  "Sets",
  "Button Covers",
] as const;

export type CategoryMoqDoc = { category: string; moq: number; price?: number };

/**
 * Pre-order minimums are per *category*, not per individual design - a
 * customer buying 10 brooches can mix any 10 designs together, they
 * aren't required to buy 10 of the exact same piece. So this maps
 * category name -> minimum total pieces across all designs in that
 * category, looked up fresh from the database (editable by Faith at
 * /admin/preorder-moq) rather than baked into each product.
 */
export async function getCategoryMoqMap(db: Db): Promise<Map<string, number>> {
  const docs = await db.collection<CategoryMoqDoc>("category_moq").find({}).toArray();
  return new Map(docs.map((d) => [d.category, d.moq]));
}
