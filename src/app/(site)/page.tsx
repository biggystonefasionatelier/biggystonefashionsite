import Link from "next/link";
import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import SignupForm from "@/components/SignupForm";
import HeroSlideshow from "@/components/HeroSlideshow";
import { PROMO, isPromoActive, promoDaysRemaining } from "@/lib/promo";

export const revalidate = 60;

export default async function HomePage() {
  const featured = await getProducts("retail", 8);
  const promoActive = isPromoActive();
  const daysLeft = promoDaysRemaining();
  const heroImages = featured
    .map((p) => p.image_url)
    .filter((url): url is string => !!url)
    .slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-black text-brand-gold-light">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 text-center md:grid-cols-2 md:py-20 md:text-left">
          <div>
            <h1 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl md:mx-0">
              Luxury-look jewelry. Real prices.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-brand-gold md:mx-0">
              {promoActive
                ? `New pieces every month, from ₦1,000 — and right now, ${PROMO.percent}% off everything.`
                : "New pieces every month, from ₦1,000."}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                href="/shop"
                className="rounded-full bg-brand-gold px-6 py-3 text-sm font-medium text-brand-black"
              >
                {promoActive ? "Shop the September Sale" : "Shop now"}
              </Link>
              <Link href="/delivery" className="text-sm underline underline-offset-4">
                Unilag? Pick up same-day →
              </Link>
            </div>
          </div>
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
            <HeroSlideshow images={heroImages} />
          </div>
        </div>
      </section>

      {/* Discount banner */}
      {promoActive && (
        <section className="bg-brand-gold-light px-4 py-4 text-center text-sm text-neutral-800">
          <strong>
            September Sale — {PROMO.percent}% off with code {PROMO.code}.
          </strong>{" "}
          Free delivery on orders ₦{PROMO.freeDeliveryThreshold.toLocaleString()}+. Ends in{" "}
          {daysLeft} {daysLeft === 1 ? "day" : "days"}.
        </section>
      )}

      {/* Value props */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Affordable luxury",
            body: "Pearl, crystal, and statement pieces that look far more expensive than they cost. Most under ₦5,000.",
          },
          {
            title: "Fast delivery, real updates",
            body: "Same-day/next-day pickup for Unilag. Nationwide shipping with WhatsApp updates on every order.",
          },
          {
            title: "New drops monthly",
            body: "Styles that match what's actually trending — not stock that's been sitting since last year.",
          },
          {
            title: "Buying in bulk?",
            body: "Pre-order wholesale pricing for resellers and boutiques.",
            link: { href: "/wholesale", label: "See wholesale pricing" },
          },
        ].map((card) => (
          <div key={card.title} className="rounded-xl border border-black/10 p-5">
            <p className="font-bold">{card.title}</p>
            <p className="mt-2 text-sm text-neutral-600">{card.body}</p>
            {card.link && (
              <Link href={card.link.href} className="mt-2 inline-block text-sm underline">
                {card.link.label} →
              </Link>
            )}
          </div>
        ))}
      </section>

      {/* Featured collection */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-bold">This month&apos;s edit</h2>
        {featured.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            New pieces are being added — check back soon.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Email + birthday signup */}
      <section className="bg-neutral-50 px-4 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold">Get first access — and a birthday gift</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Drop your email and birthday. You&apos;ll get the first look at new
            drops{promoActive ? ", this month's discount code," : ""} and something extra the
            week of your birthday.
          </p>
          <div className="mt-6">
            <SignupForm />
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="text-xl font-bold">Why Biggystone</h2>
        <p className="mt-3 text-sm text-neutral-600">
          Biggystone Fashion Atelier started in Lagos with one idea: you
          shouldn&apos;t have to choose between looking expensive and staying in
          budget. Every piece is picked to feel like a statement, priced like
          a treat.
        </p>
        <Link href="/about" className="mt-3 inline-block text-sm underline">
          Read our story →
        </Link>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-black px-4 py-14 text-center text-brand-gold-light">
        <h2 className="text-xl font-bold">Ready to shop?</h2>
        <p className="mt-2 text-sm text-brand-gold">
          {promoActive
            ? "September's discount won't last. Neither will the pieces everyone's already asking about."
            : "The pieces everyone's already asking about won't last."}
        </p>
        <Link
          href="/shop"
          className="mt-5 inline-block rounded-full bg-brand-gold px-6 py-3 text-sm font-medium text-brand-black"
        >
          Shop now
        </Link>
      </section>
    </div>
  );
}
