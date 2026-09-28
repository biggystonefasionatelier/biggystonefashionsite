import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getCategoryMoqMap } from "@/lib/categoryMoq";

/**
 * Public, read-only - the cart page needs this to show shoppers how many
 * more pieces they need to reach a category's minimum. Nothing sensitive
 * in a list of category names and minimum quantities.
 */
export async function GET() {
  try {
    const db = await getDb();
    const map = await getCategoryMoqMap(db);
    return NextResponse.json({ categoryMoq: Object.fromEntries(map) });
  } catch (err) {
    console.error("category-moq GET failed:", err);
    return NextResponse.json({ categoryMoq: {} });
  }
}
