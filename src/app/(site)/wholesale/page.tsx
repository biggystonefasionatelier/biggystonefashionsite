import Link from "next/link";
import { getProducts } from "@/lib/products";
import { getDb } from "@/lib/mongodb";
import { getCategoryMoqMap } from "@/lib/categoryMoq";
import WholesaleInquiryForm from "@/components/WholesaleInquiryForm";
import PreorderProductCard from "@/components/PreorderProductCard";

export const metadata = { title: "Wholesale | Biggystone Fashion Atelier" };
export const revalidate = 60;

async function safeGetCategoryMoqMap(): Promise<Map<string, number>> {
  try {
    const db = await getDb();
    return await getCategoryMoqMap(db);
  } catch (err) {
    console.error("getCategoryMoqMap failed (is MongoDB configured yet?):", err);
    return new Map();
  }
}

export default async function WholesalePage() {
  const products = await getProducts("wholesale");
  const categoryMoqMap = await safeGetCategoryMoqMap();

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
            lead time. Pick what you want below, pay to our Opay, and
            you&apos;re set — no need to message us first.
          </p>
        </div>
      </div>

      {products.length > 0 && (
        <>
          <h2 className="mt-12 font-bold">Pre-order pieces</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Tap <strong>Add</strong> on every piece you want and set how
            many. These are made/sourced to order, so lead time is longer
            than in-stock pieces.
          </p>
          <div className="mt-3 max-w-2xl rounded-lg border border-black/10 bg-neutral-50 p-3 text-sm text-neutral-600">
            <p>
              Don&apos;t see the design you want here?{" "}
              <a
                href={`https://wa.me/2348148263705?text=${encodeURIComponent(
                  "Hi Biggystone! I want to pre-order a piece that's not on your site - here's a picture of what I want:"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                Send us a picture on WhatsApp
              </a>{" "}
              and we&apos;ll let you know if we can source it.
            </p>
            <p className="mt-1">
              Shipping and delivery/waybill fee is not included in the price
              below - that&apos;s paid separately when your order arrives.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <PreorderProductCard
                key={p.id}
                product={p}
                categoryMoq={p.category ? categoryMoqMap.get(p.category) : undefined}
              />
            ))}
          </div>
          <Link
            href="/cart"
            className="mt-6 inline-block rounded-full bg-brand-black px-6 py-2 text-sm text-brand-gold-light"
          >
            View pre-order cart →
          </Link>
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
