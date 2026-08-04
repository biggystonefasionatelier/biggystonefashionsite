import { NextResponse } from "next/server";
import { wholesaleInquirySchema } from "@/lib/validation";
import { getDb } from "@/lib/mongodb";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendAdminNotification } from "@/lib/brevo";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`wholesale:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = wholesaleInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    await db.collection("wholesale_inquiries").insertOne({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      business_name: parsed.data.businessName || null,
      quantity_interested: parsed.data.quantityInterested,
      message: parsed.data.message || null,
      created_at: new Date(),
    });

    await sendAdminNotification(
      `New wholesale inquiry — ${parsed.data.name}`,
      `<p><strong>${parsed.data.name}</strong>${parsed.data.businessName ? ` (${parsed.data.businessName})` : ""} is interested in wholesale.</p>
       <p>Email: ${parsed.data.email}<br>Phone: ${parsed.data.phone}<br>Quantity: ${parsed.data.quantityInterested}</p>
       ${parsed.data.message ? `<p>Message: ${parsed.data.message}</p>` : ""}
       <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/wholesale">View in admin dashboard</a></p>`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Wholesale inquiry failed:", err);
    return NextResponse.json(
      { error: "Something went wrong submitting your inquiry. Please try again." },
      { status: 500 }
    );
  }
}
