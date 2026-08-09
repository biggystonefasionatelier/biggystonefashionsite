import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { deleteBrevoContact } from "@/lib/brevo";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid signup ID" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const signup = await db.collection("email_signups").findOne({ _id: new ObjectId(id) });
    if (!signup) {
      return NextResponse.json({ error: "Signup not found" }, { status: 404 });
    }

    await db.collection("email_signups").deleteOne({ _id: new ObjectId(id) });

    if (signup.brevo_synced) {
      await deleteBrevoContact(signup.email);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin signup delete failed:", err);
    return NextResponse.json({ error: "Failed to delete signup" }, { status: 500 });
  }
}
