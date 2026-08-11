import Link from "next/link";

export const metadata = { title: "Terms of Service | Biggystone Fashion Atelier" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated August 2026</p>

      <p className="mt-6 text-neutral-700">
        These are the terms for using biggystonefashion.com and buying from
        Biggystone Fashion Atelier. By placing an order or signing up on
        this site, you&apos;re agreeing to them.
      </p>

      <h2 className="mt-8 font-bold">Retail vs. pre-order wholesale</h2>
      <p className="mt-2 text-neutral-700">
        We sell two different ways, kept separate everywhere on this site:
        retail (in-stock pieces, ready to ship) and pre-order wholesale
        (bulk pricing for resellers, with a minimum order quantity and
        deposit). The two can&apos;t be checked out together, since they
        ship on different timelines — wholesale pieces are made or sourced
        to order, so lead time is longer and confirmed when you order,
        separately from retail delivery times.
      </p>

      <h2 className="mt-8 font-bold">Prices and payment</h2>
      <p className="mt-2 text-neutral-700">
        All prices are in Nigerian Naira (₦) and may change without
        notice. Payment is processed securely by Paystack — we never see
        or store your card details. Discount codes, loyalty gift vouchers,
        and bundle pricing are subject to the conditions shown at
        checkout, are limited to one use where stated, and may be changed
        or withdrawn at any time.
      </p>

      <h2 className="mt-8 font-bold">Orders and stock</h2>
      <p className="mt-2 text-neutral-700">
        Retail orders are confirmed subject to stock being available at
        the time of payment — in the rare case an item sells out before
        your payment is confirmed, we&apos;ll reach out to sort out a
        replacement or refund. Wholesale orders are made/sourced to order
        after your deposit or payment is received.
      </p>

      <h2 className="mt-8 font-bold">Delivery</h2>
      <p className="mt-2 text-neutral-700">
        Pickup is free; delivery is priced by area — see{" "}
        <Link href="/delivery" className="underline">
          Delivery &amp; Returns
        </Link>{" "}
        for the full breakdown and current timing. We don&apos;t run a
        formal parcel-tracking system — we send updates directly on
        WhatsApp as your order moves.
      </p>

      <h2 className="mt-8 font-bold">Returns and refunds</h2>
      <p className="mt-2 text-neutral-700">
        See our{" "}
        <Link href="/refunds" className="underline">
          Refund &amp; Returns Policy
        </Link>{" "}
        for how this works.
      </p>

      <h2 className="mt-8 font-bold">No customer accounts</h2>
      <p className="mt-2 text-neutral-700">
        You don&apos;t need to create an account to shop with us — orders
        are tracked by the email and phone number you provide at checkout.
        (Our admin dashboard is separate and only accessible to Biggystone
        staff.)
      </p>

      <h2 className="mt-8 font-bold">Fair use</h2>
      <p className="mt-2 text-neutral-700">
        Please don&apos;t place fraudulent orders, abuse discount codes or
        the loyalty gift program beyond their intended one-per-person use,
        or attempt to interfere with how the site runs. We reserve the
        right to cancel orders or restrict access where this happens.
      </p>

      <h2 className="mt-8 font-bold">Governing law</h2>
      <p className="mt-2 text-neutral-700">
        These terms are governed by the laws of the Federal Republic of
        Nigeria.
      </p>

      <h2 className="mt-8 font-bold">Changes to these terms</h2>
      <p className="mt-2 text-neutral-700">
        If anything here changes, we&apos;ll update this page and the
        &quot;last updated&quot; date at the top.
      </p>

      <h2 className="mt-8 font-bold">Questions?</h2>
      <p className="mt-2 text-neutral-700">
        WhatsApp/call +234 814 826 3705, or email
        biggystonefashionatelier@gmail.com.
      </p>
    </div>
  );
}
