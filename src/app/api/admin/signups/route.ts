import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db
      .collection("email_signups")
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    const signups = docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));
    return NextResponse.json({ signups });
  } catch (err) {
    console.error("Admin signups GET failed:", err);
    return NextResponse.json({ error: "Failed to load signups" }, { status: 500 });
  }
}
