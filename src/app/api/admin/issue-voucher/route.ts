import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { createGiftVoucher } from "@/lib/giftVoucher";
import { sendGiftVoucherEmail } from "@/lib/brevo";

const bodySchema = z.object({
  email: z.string().trim().email(),
  customerName: z.string().trim().min(1),
  type: z.enum(["fixed_discount", "free_delivery"]).default("fixed_discount"),
  amount: z.number().positive().optional(),
  transferable: z.boolean().optional(),
  note: z.string().trim().max(500).optional(),
});

/**
 * Issues a one-off discount/free-delivery code outside the loyalty
 * program - e.g. a goodwill gesture, a refund-as-credit, a one-time
 * apology discount. Uses the exact same gift_vouchers mechanism and
 * checkout redemption path as loyalty gifts (see src/lib/giftVoucher.ts),
 * just created directly instead of earned through order milestones. Never
 * expires, same as loyalty vouchers - there's no expiry concept in this
 * system currently.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  if (parsed.data.type === "fixed_discount" && !parsed.data.amount) {
    return NextResponse.json(
      { error: "Amount is required for a fixed-discount voucher" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const code = await createGiftVoucher(db, {
      email: parsed.data.email,
      type: parsed.data.type,
      amount: parsed.data.type === "fixed_discount" ? parsed.data.amount ?? null : null,
      transferable: parsed.data.transferable ?? false,
      note: parsed.data.note ?? null,
    });

    await sendGiftVoucherEmail({
      email: parsed.data.email,
      customerName: parsed.data.customerName,
      code,
      giftName: parsed.data.note || "A thank-you from Biggystone",
      type: parsed.data.type,
      amount: parsed.data.amount ?? null,
      transferable: parsed.data.transferable ?? false,
    });

    return NextResponse.json({ code });
  } catch (err) {
    console.error("Issue voucher failed:", err);
    return NextResponse.json({ error: "Failed to issue voucher" }, { status: 500 });
  }
}
