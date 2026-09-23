import Link from "next/link";
import { getProducts } from "@/lib/products";
import WholesaleInquiryForm from "@/components/WholesaleInquiryForm";
import { WHOLESALE_DISCOUNT_CODE, WHOLESALE_DISCOUNT_PERCENT, WHOLESALE_MIN_ORDER } from "@/lib/orderPricing";

export const metadata = { title: "Pre-Order Wholesale | Biggystone Fashion Atelier" };
export const revalidate = 60;

export default async function WholesalePage() {
  const products = await getProducts("wholesale");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold">Wholesale &amp; Reseller Pricing</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Buying to resell? Shop our full catalog like any other customer,
        then use a reseller code at checkout to unlock bulk pricing — no
        separate wholesale-only listing to browse.
      </p>

      <div className="mt-6 max-w-2xl rounded-xl border border-brand-gold/40 bg-brand-gold-light/40 p-5">
        <p className="font-bold">Have a reseller code?</p>
        <p className="mt-1 text-sm text-neutral-700">
          Approved resellers get {WHOLESALE_DISCOUNT_PERCENT}% off on orders
          of ₦{WHOLESALE_MIN_ORDER.toLocaleString()} or more — enter your
          code (e.g. <span className="font-mono">{WHOLESALE_DISCOUNT_CODE}</span>)
          in the discount code field at checkout.
        </p>
        <Link
          href="/shop"
          className="mt-3 inline-block rounded-full bg-brand-black px-5 py-2 text-sm text-brand-gold-light"
        >
          Shop the catalog →
        </Link>
      </div>

      {products.length > 0 && (
        <>
          <h2 className="mt-12 font-bold">Pre-order pieces</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            These are made/sourced to order separately from the main
            catalog, so lead time is longer — you&apos;ll see the minimum
            order quantity and deposit required on each item.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border border-black/10 p-3">
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                      Photo coming soon
                    </div>
                  )}
                </div>
                <p className="mt-3 font-medium">{p.name}</p>
                <p className="text-sm text-neutral-500">₦{p.price.toLocaleString()} / unit</p>
                {p.moq && <p className="text-xs text-neutral-500">MOQ: {p.moq} units</p>}
                {p.deposit_percent != null && (
                  <p className="text-xs text-neutral-500">
                    {p.deposit_percent}% deposit to reserve
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-12 rounded-xl border border-black/10 bg-neutral-50 p-6">
        <h2 className="font-bold">Don&apos;t have a reseller code yet?</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Tell us what you&apos;re looking for and we&apos;ll follow up with
          pricing and next steps.
        </p>
        <div className="mt-4">
          <WholesaleInquiryForm />
        </div>
      </div>
    </div>
  );
}
