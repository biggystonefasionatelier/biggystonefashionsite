export const LOCAL_DELIVERY_FEES = {
  unilag: 1000,
  bariga: 500,
  iwaya: 1500,
} as const;

export type LocalArea = keyof typeof LOCAL_DELIVERY_FEES;
export type DeliveryMethod = "pickup" | "local" | "nationwide";

export const LOCAL_AREA_LABELS: Record<LocalArea, string> = {
  unilag: "Unilag",
  bariga: "Bariga",
  iwaya: "Iwaya",
};

function isFridayInLagos(at: Date): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", weekday: "short" }).format(at);
  return weekday === "Fri";
}

/**
 * Local delivery (Unilag/Bariga/Iwaya and environs - "environs" just picks
 * whichever of the three is closest) is free on Fridays. Nationwide
 * shipping isn't priced here at all - the fee varies by destination, so
 * it's confirmed manually with the customer after checkout rather than
 * charged automatically.
 */
export function calculateDeliveryFee(
  method: DeliveryMethod,
  area: LocalArea | undefined,
  at: Date = new Date()
): number {
  if (method !== "local" || !area) return 0;
  if (isFridayInLagos(at)) return 0;
  return LOCAL_DELIVERY_FEES[area];
}
