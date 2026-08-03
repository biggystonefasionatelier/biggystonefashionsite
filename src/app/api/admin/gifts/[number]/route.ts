import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number: numberParam } = await params;
  const number = Number(numberParam);

  if (!Number.isInteger(number) || number < 1 || number > 10) {
    return NextResponse.json({ error: "Invalid gift number" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const result = await db.collection("gifts").findOneAndUpdate(
      { number },
      {
        $set: {
          name: parsed.data.name,
          description: parsed.data.description || "",
          image_url: parsed.data.imageUrl || null,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    const { _id, ...rest } = result;
    return NextResponse.json({ gift: { id: _id.toString(), ...rest } });
  } catch (err) {
    console.error("Admin gift update failed:", err);
    return NextResponse.json({ error: "Failed to update gift" }, { status: 500 });
  }
}
