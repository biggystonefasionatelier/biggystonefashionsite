import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db.collection("orders").find({}).sort({ created_at: -1 }).toArray();
    const orders = docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Admin orders GET failed:", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
