/**
 * Display format for the raw sequential number stored on each order -
 * BSTONE001, BSTONE002, ... BSTONE999, then naturally widens (BSTONE1000)
 * past that rather than truncating. Has no server-only dependencies, so
 * it's safe to import from client components directly.
 */
export function formatOrderNumber(orderNumber: number): string {
  return `BSTONE${String(orderNumber).padStart(3, "0")}`;
}
