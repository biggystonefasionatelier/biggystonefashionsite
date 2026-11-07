import crypto from "node:crypto";

// Same pixel the browser-side snippet uses - see src/components/MetaPixel.tsx.
const PIXEL_ID = "1348104840813007";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Sends a Purchase event to Meta's Conversions API directly from the
 * server, the moment an order is actually marked paid - regardless of
 * whether the customer's browser ever reaches /checkout/success. The
 * browser-only pixel (src/lib/analytics.ts) misses real sales whenever
 * the customer closes the tab right after paying, an ad blocker strips
 * the pixel script, or the order is marked paid manually in admin (e.g.
 * reconciling a stuck payment) - this is what actually closes that gap.
 *
 * eventId should match the eventID passed to the browser pixel's
 * trackPurchase() call for the same order (the Paystack reference works
 * well), so Meta dedupes the two instead of double-counting one sale.
 */
export async function sendPurchaseConversionEvent(order: {
  email: string;
  phone: string;
  total: number;
  eventId: string;
}): Promise<void> {
  const token = process.env.META_CONVERSIONS_API_TOKEN;
  if (!token) {
    console.warn("META_CONVERSIONS_API_TOKEN not configured - skipping server-side purchase event");
    return;
  }

  const phoneDigits = order.phone.replace(/\D/g, "");
  const normalizedPhone = phoneDigits.startsWith("0") ? `234${phoneDigits.slice(1)}` : phoneDigits;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url: "https://biggystonefashion.com/checkout/success",
              event_id: order.eventId,
              user_data: {
                em: [sha256(order.email)],
                ph: [sha256(normalizedPhone)],
              },
              custom_data: {
                value: order.total,
                currency: "NGN",
              },
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Meta Conversions API send failed:", res.status, text);
    }
  } catch (err) {
    console.error("Meta Conversions API request failed:", err);
  }
}
