import { DELIVERY_ZONES } from "@/lib/delivery";

export const metadata = { title: "Delivery & Returns | Biggystone Fashion Atelier" };

const GROUPS = ["Lagos Mainland", "Lagos Island", "Outside Lagos"] as const;

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Delivery & Returns</h1>

      <h2 className="mt-8 font-bold">Pickup</h2>
      <p className="mt-2 text-neutral-700">
        Free, always. Exact pickup timing depends on when your order comes
        in — you&apos;ll get a confirmation with your expected window.
      </p>

      <h2 className="mt-8 font-bold">Delivery</h2>
      <p className="mt-2 text-neutral-700">
        We deliver anywhere in Nigeria with a tracked delivery label on every
        order. Pick your area at checkout to see the exact fee — and{" "}
        <strong>delivery is free for everyone, everywhere, every Friday</strong>.
      </p>

      {GROUPS.map((group) => (
        <div key={group} className="mt-6">
          <h3 className="font-semibold text-neutral-800">{group}</h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-black/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Areas covered</th>
                  <th className="px-3 py-2">Fee</th>
                  <th className="px-3 py-2">Delivery time</th>
                </tr>
              </thead>
              <tbody>
                {DELIVERY_ZONES.filter((z) => z.group === group).map((zone) => (
                  <tr key={zone.id} className="border-b border-black/5 last:border-0">
                    <td className="px-3 py-2 text-neutral-700">{zone.areas.join(", ")}</td>
                    <td className="px-3 py-2 whitespace-nowrap">₦{zone.fee.toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-neutral-500">{zone.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <h2 className="mt-8 font-bold">Pre-order wholesale lead time</h2>
      <p className="mt-2 text-neutral-700">
        Wholesale orders are made/sourced to order, so lead time is longer
        than retail. Your specific lead time is confirmed when you place a
        wholesale order — this is separate from retail delivery timing.
      </p>

      <h2 className="mt-8 font-bold">Returns & exchanges</h2>
      <p className="mt-2 text-neutral-700">
        If an item arrives damaged or isn&apos;t what you ordered, reach out
        within 24 hours of delivery via WhatsApp or email (below) and
        we&apos;ll sort it out.
      </p>

      <h2 className="mt-8 font-bold">Questions about your delivery?</h2>
      <p className="mt-2 text-neutral-700">
        WhatsApp/call +234 814 826 3705, or email
        biggystonefashionatelier@gmail.com.
      </p>
    </div>
  );
}
