import Link from "next/link";

export const metadata = { title: "About | Biggystone Fashion Atelier" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Our Story</h1>

      <p className="mt-4 text-neutral-700">
        Biggystone Fashion Atelier began in 2019 at Adekunle Ajasin
        University (AAUA), built on one decision: students shouldn&apos;t
        have to break the bank to look good. That vision has grown with us.
        We&apos;re based in Lagos now, and it&apos;s no longer just for
        students — it&apos;s for everybody. Students, professionals, working
        class, married, single, everybody. Every piece we sell is chosen and
        priced with the same promise: affordable, easy to get, and made to
        make you look good.
      </p>

      <h2 className="mt-10 font-bold">The Name Behind Biggystone</h2>
      <p className="mt-3 text-neutral-700">
        The name carries a story close to my heart. Biggystone is named
        after my beloved brother, Olugbenga Anthony Bolaniran —{" "}
        <em>Biggystone</em> to everyone who knew him, and to me, for life. He
        was born in September, and though he&apos;s no longer here with us,
        his name lives on in every single piece we sell.
      </p>
      <p className="mt-3 text-neutral-700">
        That&apos;s why, every September, we run discounts and free delivery
        across the whole site. It isn&apos;t just a sale to us — it&apos;s
        our way of celebrating him, in the month he was born, every year.
        When you shop with us in September, you&apos;re part of that
        celebration too.
      </p>

      <h2 className="mt-10 font-bold">
        What Sets Us Apart — Why Choose Biggystone Fashion
      </h2>
      <ul className="mt-4 space-y-3 text-neutral-700">
        <li>
          <strong>Real affordability.</strong> Pieces from ₦1,000, most
          under ₦5,000 — you never have to choose between looking expensive
          and staying in budget.
        </li>
        <li>
          <strong>New pieces every month.</strong> Styles picked to match
          what&apos;s actually trending, not stock that&apos;s been sitting
          around.
        </li>
        <li>
          <strong>Retail and wholesale, kept separate.</strong> Shop what is
          in stock now, or if you&apos;re a reseller or boutique buying in
          bulk, check our{" "}
          <Link href="/wholesale" className="underline">
            pre-order wholesale
          </Link>{" "}
          pricing.
        </li>
        <li>
          <strong>Same-day pickup for Unilag.</strong> We&apos;re close by
          in Bariga, Lagos, with same-day pickup and delivery for campus.
        </li>
        <li>
          <strong>Nationwide delivery, real updates.</strong> We deliver
          across Lagos and the rest of Nigeria, with WhatsApp updates on
          your order the whole way.
        </li>
        <li>
          <strong>A birthday gift, every year.</strong> Sign up with your
          birthday and get a discount code to use during your birthday
          month.
        </li>
        <li>
          <strong>Loyalty rewards for repeat customers.</strong> Every 5th
          qualifying order unlocks a surprise gift pick, on us.
        </li>
        <li>
          <strong>A September to remember.</strong> A discount and free
          delivery on qualifying orders, every September, in honor of
          Biggystone.
        </li>
        <li>
          <strong>Real support, not a bot.</strong> Message us directly on
          WhatsApp and get a real reply from a real person.
        </li>
      </ul>
    </div>
  );
}
