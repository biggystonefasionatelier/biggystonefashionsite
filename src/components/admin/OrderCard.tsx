"use client";

export type OrderItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  color?: string | null;
  image_url?: string | null;
};

export type Order = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  order_type: "retail" | "wholesale";
  status: string;
  sent_to_supplier?: boolean;
  sourced_items?: string[];
  payment_method?: "paystack" | "opay" | "paystack_invoice" | null;
  total: number;
  deposit_only: boolean;
  created_at: string;
  order_items: OrderItem[];
  gift_number?: number;
  gift_name?: string;
  discount_code?: string | null;
  discount_amount?: number | null;
  bundle_discount_amount?: number | null;
  dozen_discount_amount?: number | null;
  delivery_method?: "pickup" | "delivery" | null;
  delivery_zone_label?: string | null;
  delivery_fee?: number | null;
  delivery_note?: string | null;
};

export const ORDER_STATUSES = ["pending", "paid", "failed", "fulfilled", "cancelled"];

export function totalPieces(o: Order): number {
  return o.order_items.reduce((sum, item) => sum + item.quantity, 0);
}

function deliveryLabel(o: Order): string | null {
  if (!o.delivery_method) return null;
  if (o.delivery_method === "pickup") return "Pickup";
  const zone = o.delivery_zone_label ?? "Delivery";
  const fee = o.delivery_fee ? `₦${o.delivery_fee.toLocaleString()}` : "Free";
  return `${zone} (${fee})`;
}

// e.g. "57 Brooches · 19 Earrings" - lets Faith count what to source/pack
// per category at a glance instead of tallying every line item by hand.
// Category isn't stored on the order itself (only on the product), so this
// depends on the current product list passed in from the orders page.
function categorySummary(o: Order, categoryByProductId?: Record<string, string>): string | null {
  if (!categoryByProductId) return null;
  const totals = new Map<string, number>();
  for (const item of o.order_items) {
    const category = categoryByProductId[item.product_id] || "Uncategorized";
    totals.set(category, (totals.get(category) ?? 0) + item.quantity);
  }
  if (totals.size === 0) return null;
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, qty]) => `${qty} ${category}`)
    .join(" · ");
}

const CART_STORAGE_KEY = "biggystone_cart_v1";

async function restoreOrderToCart(o: Order) {
  if (
    !window.confirm(
      "This will replace whatever is currently in your cart (on this browser) with this order's items. Continue?"
    )
  ) {
    return;
  }

  let categoryByProductId: Record<string, string> = {};
  try {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    categoryByProductId = Object.fromEntries(
      (data.products ?? []).map((p: { id: string; category: string | null }) => [p.id, p.category ?? ""])
    );
  } catch {
    // Category lookup is best-effort - the cart still works without it,
    // it just won't group correctly toward pre-order minimums until the
    // page is reloaded with product data.
  }

  const cartItems = o.order_items.map((item) => ({
    productId: item.product_id,
    name: item.product_name,
    price: item.unit_price,
    quantity: item.quantity,
    imageUrl: item.image_url ?? undefined,
    orderType: o.order_type,
    color: item.color ?? undefined,
    category: categoryByProductId[item.product_id] || undefined,
  }));

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  window.open("/cart", "_blank");
}

export default function OrderCard({
  order: o,
  onStatusChange,
  categoryByProductId,
  onToggleSourced,
}: {
  order: Order;
  onStatusChange: (id: string, status: string) => void;
  categoryByProductId?: Record<string, string>;
  onToggleSourced?: (orderId: string, itemKey: string) => void;
}) {
  const summary = o.order_type === "wholesale" ? categorySummary(o, categoryByProductId) : null;
  const sourced = new Set(o.sourced_items ?? []);
  const showSourcedCheckboxes = o.order_type === "wholesale" && !!onToggleSourced;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {o.customer_name} · <span className="capitalize">{o.order_type}</span>
            {o.deposit_only && " (deposit)"}
            {o.payment_method === "opay" && (
              <span className="ml-2 rounded-full bg-brand-gold-light px-2 py-0.5 text-xs font-medium text-neutral-800">
                Opay
              </span>
            )}
            {o.payment_method === "paystack_invoice" && (
              <span className="ml-2 rounded-full bg-brand-gold-light px-2 py-0.5 text-xs font-medium text-neutral-800">
                Pay-for-me link
              </span>
            )}
          </p>
          {o.payment_method === "opay" && o.status === "pending" && (
            <p className="mt-1 text-xs text-neutral-500">
              Awaiting Opay confirmation — check your Opay app/WhatsApp,
              then mark this paid.
            </p>
          )}
          {o.payment_method === "paystack_invoice" && o.status === "pending" && (
            <p className="mt-1 text-xs text-neutral-500">
              Customer shared a payment link with someone else — Paystack
              will mark this paid automatically once they pay.
            </p>
          )}
          <p className="text-xs text-neutral-500">
            {o.email} · {o.phone}
          </p>
          <p className="text-xs text-neutral-500">
            {o.address}, {o.city}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">₦{Number(o.total).toLocaleString()}</p>
          <p className="text-xs font-medium text-neutral-700">
            {totalPieces(o)} piece{totalPieces(o) === 1 ? "" : "s"}
          </p>
          {summary && <p className="max-w-[16rem] text-xs text-neutral-500">{summary}</p>}
          {showSourcedCheckboxes && (
            <p className="text-xs text-neutral-500">
              {sourced.size}/{o.order_items.length} sourced
            </p>
          )}
          <select
            value={o.status}
            onChange={(e) => onStatusChange(o.id, e.target.value)}
            className="mt-1 rounded-md border border-black/15 px-2 py-1 text-xs capitalize"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {o.status === "pending" && (
            <button
              type="button"
              onClick={() => restoreOrderToCart(o)}
              className="mt-1 block text-xs text-neutral-500 underline"
            >
              Load into cart
            </button>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-2 border-t border-black/5 pt-3 text-xs text-neutral-600">
        {o.order_items.map((item, i) => {
          const key = String(i);
          const isSourced = sourced.has(key);
          return (
            <li key={i} className="flex items-center gap-2">
              {showSourcedCheckboxes && (
                <input
                  type="checkbox"
                  checked={isSourced}
                  onChange={() => onToggleSourced!(o.id, key)}
                  aria-label={`Mark "${item.product_name}" as sourced`}
                  className="h-4 w-4 flex-shrink-0 accent-brand-black"
                />
              )}
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <span className={isSourced ? "text-neutral-400 line-through" : undefined}>
                {item.quantity} × {item.product_name}
                {item.color && ` (${item.color})`} — ₦
                {(item.unit_price * item.quantity).toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>

      {deliveryLabel(o) && (
        <p className="mt-2 border-t border-black/5 pt-2 text-xs text-neutral-600">
          🚚 {deliveryLabel(o)}
          {o.delivery_note && <span className="block text-neutral-500">Note: {o.delivery_note}</span>}
        </p>
      )}

      {o.discount_code && (
        <p className="mt-2 border-t border-black/5 pt-2 text-xs text-neutral-600">
          {o.discount_code.startsWith("GIFT-")
            ? "🎁"
            : o.discount_code.startsWith("REF-")
              ? "🔗"
              : "🏷️"}{" "}
          Code {o.discount_code} applied
          {o.discount_amount
            ? ` — ₦${Number(o.discount_amount).toLocaleString()} off`
            : " — free delivery on this order"}
        </p>
      )}

      {o.bundle_discount_amount ? (
        <p className="mt-2 border-t border-black/5 pt-2 text-xs text-neutral-600">
          📦 Buy-3 bundle discount — ₦{Number(o.bundle_discount_amount).toLocaleString()} off
        </p>
      ) : null}

      {o.dozen_discount_amount ? (
        <p className="mt-2 border-t border-black/5 pt-2 text-xs text-neutral-600">
          🎁 Dozen pricing applied — ₦{Number(o.dozen_discount_amount).toLocaleString()} off
        </p>
      ) : null}

      {o.gift_number && (
        <p className="mt-2 border-t border-black/5 pt-2 text-xs font-medium text-brand-black">
          🎁 Loyalty gift picked: #{o.gift_number} — {o.gift_name}
        </p>
      )}
    </div>
  );
}
