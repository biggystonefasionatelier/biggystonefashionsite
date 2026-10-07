"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WHATSAPP_NUMBER, OPAY_ACCOUNT_NAME, OPAY_ACCOUNT_NUMBER } from "@/lib/contact";

type InvoiceItem = { product_name: string; quantity: number; unit_price: number };
type InvoiceOrder = {
  customer_name: string;
  status: string;
  total: number;
  order_type: "retail" | "wholesale";
  payment_method?: "paystack_invoice" | "opay" | null;
  order_items: InvoiceItem[];
  delivery_method?: "pickup" | "delivery" | null;
  delivery_zone_label?: string | null;
  delivery_fee?: number | null;
};

type LoadState = "loading" | "ready" | "not_found" | "error";

export default function InvoicePage() {
  const params = useParams<{ reference: string }>();
  const reference = params.reference;
  const [order, setOrder] = useState<InvoiceOrder | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    fetch(`/api/checkout/invoice/${reference}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setLoadState("not_found");
          return;
        }
        setOrder(data.order);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, [reference]);

  async function handlePay() {
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch(`/api/checkout/invoice/${reference}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error ?? "Could not start payment. Please try again.");
        setPaying(false);
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch {
      setPayError("Network error. Check your connection and try again.");
      setPaying(false);
    }
  }

  if (loadState === "loading") {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center text-sm text-neutral-500">Loading invoice...</div>;
  }

  if (loadState === "not_found") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Invoice not found</h1>
        <p className="mt-3 text-sm text-neutral-600">
          This link may be mistyped or the invoice no longer exists. Contact
          us on WhatsApp (+234 814 826 3705) if you think this is a mistake.
        </p>
      </div>
    );
  }

  if (loadState === "error" || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Please refresh, or contact us on WhatsApp (+234 814 826 3705) with
          this link if it keeps happening.
        </p>
      </div>
    );
  }

  if (order.status === "paid") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">This invoice has already been paid</h1>
        <p className="mt-3 text-sm text-neutral-600">Thank you! {order.customer_name} is all set.</p>
        <Link href="/shop" className="mt-6 inline-block underline">
          Continue shopping →
        </Link>
      </div>
    );
  }

  if (order.status !== "pending") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">This invoice is no longer payable</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Status: {order.status}. Contact us on WhatsApp (+234 814 826 3705)
          if this doesn&apos;t look right.
        </p>
      </div>
    );
  }

  const isWholesale = order.order_type === "wholesale";

  const opayWhatsappMessage = [
    `Hi Biggystone! I just paid for ${order.customer_name}'s pre-order.`,
    `Name: ${order.customer_name}`,
    `Total paid: ₦${order.total.toLocaleString()}`,
    `Reference: ${reference}`,
    `(Attaching my payment receipt)`,
  ].join("\n");
  const opayWhatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(opayWhatsappMessage)}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">Payment request from {order.customer_name}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        {order.customer_name} picked out some pieces from Biggystone Fashion
        Atelier and is asking you to complete the payment below.
      </p>

      <div className="mt-6 divide-y divide-black/10 rounded-xl border border-black/10">
        {order.order_items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 text-sm">
            <span>
              {item.quantity} × {item.product_name}
            </span>
            <span>₦{(item.unit_price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        {order.delivery_method === "delivery" && order.delivery_fee ? (
          <div className="flex items-center justify-between p-3 text-sm text-neutral-600">
            <span>Delivery ({order.delivery_zone_label})</span>
            <span>₦{order.delivery_fee.toLocaleString()}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between p-3 text-sm font-bold">
          <span>Total</span>
          <span>₦{order.total.toLocaleString()}</span>
        </div>
      </div>

      {isWholesale ? (
        <>
          <p className="mt-6 text-sm text-neutral-600">
            This is a pre-order piece, paid by bank transfer to Opay. Send
            the amount above, then send the receipt on WhatsApp so it can
            be confirmed.
          </p>
          <div className="mt-4 rounded-xl border border-black/10 bg-neutral-50 p-5">
            <p className="text-xs text-neutral-500">Amount to pay</p>
            <p className="text-2xl font-bold">₦{order.total.toLocaleString()}</p>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <span className="text-neutral-500">Bank:</span> Opay
              </p>
              <p>
                <span className="text-neutral-500">Account name:</span> {OPAY_ACCOUNT_NAME}
              </p>
              <p>
                <span className="text-neutral-500">Account number:</span>{" "}
                <span className="font-mono font-medium">{OPAY_ACCOUNT_NUMBER}</span>
              </p>
            </div>
          </div>
          <a
            href={opayWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block w-full rounded-full bg-brand-black py-3 text-center text-sm text-brand-gold-light"
          >
            I&apos;ve paid — send receipt on WhatsApp
          </a>
          <p className="mt-3 text-center text-xs text-neutral-500">
            Reference: <span className="font-mono">{reference}</span>
          </p>
        </>
      ) : (
        <>
          <button
            onClick={handlePay}
            disabled={paying}
            className="mt-6 w-full rounded-full bg-brand-black py-3 text-sm text-brand-gold-light disabled:opacity-60"
          >
            {paying ? "Redirecting to payment..." : `Pay ₦${order.total.toLocaleString()} with Paystack`}
          </button>
          {payError && <p className="mt-2 text-xs text-red-600">{payError}</p>}
        </>
      )}
    </div>
  );
}
