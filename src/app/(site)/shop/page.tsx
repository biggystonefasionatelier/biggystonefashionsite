import { getProducts } from "@/lib/products";
import ShopBrowser from "@/components/ShopBrowser";

export const metadata = { title: "Shop | Biggystone Fashion Atelier" };
// New/edited products in the admin dashboard should show up without a
// redeploy - revalidate this page's cached HTML at most once a minute.
export const revalidate = 60;

export default async function ShopPage() {
  const products = await getProducts("retail");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold">Shop</h1>
      <p className="mt-2 text-sm text-neutral-600">
        In-stock pieces — order today, ships same-day/next-day for Unilag,
        or nationwide with delivery updates on WhatsApp.
      </p>

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          New pieces are being added — check back soon, or follow us on
          Instagram for the first look.
        </p>
      ) : (
        <ShopBrowser products={products} />
      )}
    </div>
  );
}
