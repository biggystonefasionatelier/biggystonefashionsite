/**
 * Server-only Paystack helpers. PAYSTACK_SECRET_KEY must never be imported
 * into client components - only API routes touch this file.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo, // Paystack expects the smallest currency unit (kobo)
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message ?? "Failed to initialize Paystack transaction");
  }
  return data.data as { authorization_url: string; access_code: string; reference: string };
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey()}` },
      cache: "no-store",
    }
  );

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message ?? "Failed to verify Paystack transaction");
  }
  return data.data as {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    customer: { email: string };
    metadata?: Record<string, unknown>;
  };
}

/**
 * Verifies the X-Paystack-Signature header on incoming webhooks using
 * HMAC SHA512, per Paystack's docs. This is what proves a webhook request
 * actually came from Paystack and wasn't forged by someone hitting our
 * endpoint directly.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader) return false;
  const crypto = await import("node:crypto");
  const hash = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}
