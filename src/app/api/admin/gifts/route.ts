import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db.collection("gifts").find({}).sort({ number: 1 }).toArray();
    const gifts = docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));
    return NextResponse.json({ gifts });
  } catch (err) {
    console.error("Admin gifts GET failed:", err);
    return NextResponse.json({ error: "Failed to load gifts" }, { status: 500 });
  }
}
