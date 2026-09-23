import { getProducts } from "@/lib/products";
import WholesaleInquiryForm from "@/components/WholesaleInquiryForm";

export const metadata = { title: "Wholesale | Biggystone Fashion Atelier" };
export const revalidate = 60;

export default async function WholesalePage() {
  const products = await getProducts("wholesale");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold">Wholesale</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Buying to resell? We offer wholesale pricing two ways. Message us
        to get verified as a reseller, and we&apos;ll walk you through
        pricing and get you set up to order directly on the site.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 p-5">
          <h2 className="font-bold">Wholesale</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Pieces already in stock, ready to ship now — the same catalog
            everyone shops, at reseller pricing once you&apos;re verified.
          </p>
        </div>
        <div className="rounded-xl border border-black/10 p-5">
          <h2 className="font-bold">Pre-Order Wholesale</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Pieces made or sourced specifically for larger orders — longer
            lead time, with a minimum order quantity and deposit.
          </p>
        </div>
      </div>

      {products.length > 0 && (
        <>
          <h2 className="mt-12 font-bold">Pre-order pieces</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            These are made/sourced to order, so lead time is longer than
            in-stock pieces — you&apos;ll see the minimum order quantity and
            deposit required on each item.
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
        <h2 className="font-bold">Interested in wholesale or pre-order pricing?</h2>
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
