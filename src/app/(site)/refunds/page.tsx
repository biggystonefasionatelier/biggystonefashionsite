export const metadata = { title: "Refund & Returns Policy | Biggystone Fashion Atelier" };

export default function RefundsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Refund &amp; Returns Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated August 2026</p>

      <h2 className="mt-8 font-bold">Retail orders</h2>
      <p className="mt-2 text-neutral-700">
        If an item arrives damaged, or isn&apos;t what you ordered, reach
        out within <strong>24 hours of delivery</strong> via WhatsApp or
        email (below) with your order details and a photo of the item, and
        we&apos;ll sort it out — a replacement, store credit, or refund,
        depending on the situation and what&apos;s available.
      </p>
      <p className="mt-3 text-neutral-700">
        Because our pieces are affordable, fast-moving, and often
        limited-stock, we don&apos;t accept change-of-mind returns once an
        order has shipped — please check sizing and details on the
        product photo/description before ordering, or message us on
        WhatsApp first if you&apos;re unsure.
      </p>

      <h2 className="mt-8 font-bold">Partial refunds</h2>
      <p className="mt-2 text-neutral-700">
        There are certain situations where only partial refunds are
        granted (if applicable):
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
        <li>Any item not in its original condition, is damaged, or is missing parts for reasons not due to our error.</li>
      </ul>

      <h2 className="mt-8 font-bold">Pre-order wholesale</h2>
      <p className="mt-2 text-neutral-700">
        Wholesale pieces are made or sourced to order, so change-of-mind
        returns don&apos;t apply once an order is placed. Damaged or
        defective items are handled case by case — reach out as soon as
        your order arrives.
      </p>

      <h2 className="mt-8 font-bold">How refunds are paid</h2>
      <p className="mt-2 text-neutral-700">
        Approved refunds are sent back to your original payment method
        through Paystack. Depending on your bank, this can take a few
        business days to reflect after we process it.
      </p>

      <h2 className="mt-8 font-bold">Discount codes and gifts</h2>
      <p className="mt-2 text-neutral-700">
        Discount codes, loyalty gift vouchers, and bundle pricing are tied
        to the order they were used on and aren&apos;t refundable,
        transferable, or redeemable for cash.
      </p>

      <h2 className="mt-8 font-bold">Questions?</h2>
      <p className="mt-2 text-neutral-700">
        WhatsApp/call +234 814 826 3705, or email
        biggystonefashionatelier@gmail.com.
      </p>
    </div>
  );
}
