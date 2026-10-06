import Link from "next/link";
import { getProducts } from "@/lib/products";
import { getDb } from "@/lib/mongodb";
import { getCategoryMoqMap } from "@/lib/categoryMoq";
import PreorderBrowser from "@/components/PreorderBrowser";

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

      {products.length > 0 && (
        <>
          <h2 className="mt-6 font-bold">Pre-order pieces</h2>
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
          <div className="mt-6">
            <PreorderBrowser products={products} categoryMoq={Object.fromEntries(categoryMoqMap)} />
          </div>
          <Link
            href="/cart"
            className="mt-6 inline-block rounded-full bg-brand-black px-6 py-2 text-sm text-brand-gold-light"
          >
            View pre-order cart →
          </Link>
        </>
      )}
    </div>
  );
}
