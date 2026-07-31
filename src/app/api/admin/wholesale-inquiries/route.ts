import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db
      .collection("wholesale_inquiries")
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    const inquiries = docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));
    return NextResponse.json({ inquiries });
  } catch (err) {
    console.error("Admin wholesale inquiries GET failed:", err);
    return NextResponse.json({ error: "Failed to load inquiries" }, { status: 500 });
  }
}
