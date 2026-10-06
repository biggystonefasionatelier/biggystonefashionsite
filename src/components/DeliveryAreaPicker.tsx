"use client";

import { useMemo, useState } from "react";
import { allDeliveryAreas, findDeliveryZone } from "@/lib/delivery";

const WHATSAPP_NUMBER = "2348148263705";

/**
 * Free-text "type your area, pick it from the matches" search - replaces
 * the old dropdown, which always started on its first option ("Surulere
 * and co") and let customers submit without ever touching it, charging
 * the cheapest delivery fee regardless of where they actually live. Here,
 * nothing is selected until the customer actively finds and picks their
 * own area, so there's no wrong-but-valid default to miss.
 */
export default function DeliveryAreaPicker({
  zoneId,
  onSelect,
}: {
  zoneId: string;
  onSelect: (zoneId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const allAreas = useMemo(() => allDeliveryAreas(), []);
  const selectedZone = findDeliveryZone(zoneId);

  const matches =
    query.trim().length >= 2
      ? allAreas.filter((a) => a.area.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
      : [];

  function pick(area: string, selectedZoneId: string) {
    setQuery(area);
    setOpen(false);
    onSelect(selectedZoneId);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (zoneId) onSelect(""); // text no longer matches the prior pick - force reselection
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Type your area - e.g. Yaba, Lekki, Ikeja..."
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-black/15 bg-white shadow-md">
          {matches.length > 0 ? (
            matches.map((m) => (
              <button
                key={`${m.zone.id}-${m.area}`}
                type="button"
                onClick={() => pick(m.area, m.zone.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50"
              >
                <span>{m.area}</span>
                <span className="text-xs text-neutral-500">₦{m.zone.fee.toLocaleString()}</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-neutral-500">
              Can&apos;t find your area?{" "}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Hi Biggystone! What's the delivery fee to my area - ${query.trim()}?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Ask us on WhatsApp
              </a>
            </div>
          )}
        </div>
      )}

      {selectedZone && (
        <p className="mt-1 text-xs text-neutral-500">
          ₦{selectedZone.fee.toLocaleString()} delivery · {selectedZone.eta}
        </p>
      )}
    </div>
  );
}
