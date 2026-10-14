import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getCategoryMoqMap, getCategoryDozenPriceMap } from "@/lib/categoryMoq";

/**
 * Public, read-only - the cart/wholesale pages need this to show shoppers
 * how many more pieces they need to reach a category's minimum, and
 * whether buying a dozen of a category gets a better flat price. Nothing
 * sensitive in a list of category names, minimum quantities, and dozen
 * prices.
 */
export async function GET() {
  try {
    const db = await getDb();
    const [moqMap, dozenPriceMap] = await Promise.all([
      getCategoryMoqMap(db),
      getCategoryDozenPriceMap(db),
    ]);
    return NextResponse.json({
      categoryMoq: Object.fromEntries(moqMap),
      categoryDozenPrice: Object.fromEntries(dozenPriceMap),
    });
  } catch (err) {
    console.error("category-moq GET failed:", err);
    return NextResponse.json({ categoryMoq: {}, categoryDozenPrice: {} });
  }
}
