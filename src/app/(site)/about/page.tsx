export const metadata = { title: "About | Biggystone Fashion Atelier" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Why Biggystone</h1>
      <p className="mt-4 text-neutral-700">
        Biggystone Fashion Atelier started in Lagos with one idea: you
        shouldn&apos;t have to choose between looking expensive and staying in
        budget. Every piece is picked to feel like a statement, priced like a
        treat.
      </p>
      <p className="mt-4 text-neutral-700">
        We&apos;re based in Bariga, Lagos, close to Unilag — same-day pickup
        and delivery for campus, and nationwide shipping with WhatsApp
        updates for everyone else.
      </p>
      <p className="mt-4 text-neutral-700">
        New pieces drop every month, picked to match what&apos;s actually
        trending. If you&apos;re looking to buy in bulk to resell, check out
        our{" "}
        <a href="/wholesale" className="underline">
          pre-order wholesale
        </a>{" "}
        pricing.
      </p>
    </div>
  );
}
