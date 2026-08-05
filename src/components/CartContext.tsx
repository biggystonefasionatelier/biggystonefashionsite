"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  orderType: "retail" | "wholesale";
  color?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string) => void;
  clear: () => void;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "biggystone_cart_v1";

// Different colors of the same product are separate cart lines - a
// productId match alone isn't enough to treat two lines as "the same item".
function sameLine(a: { productId: string; color?: string }, b: { productId: string; color?: string }) {
  return a.productId === b.productId && (a.color ?? "") === (b.color ?? "");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage once, on the client only. Can't read
  // localStorage during render (no `window` on the server), so this has
  // to be an effect - the lint rule against setState-in-effect doesn't
  // apply cleanly to syncing from an external store like this.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt/blocked storage - start with an empty cart rather than crash.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(newItem: CartItem) {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, newItem));
      if (existing) {
        return prev.map((i) =>
          sameLine(i, newItem) ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      return [...prev, newItem];
    });
  }

  function removeItem(productId: string, color?: string) {
    setItems((prev) => prev.filter((i) => !sameLine(i, { productId, color })));
  }

  function updateQuantity(productId: string, quantity: number, color?: string) {
    if (quantity <= 0) {
      removeItem(productId, color);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (sameLine(i, { productId, color }) ? { ...i, quantity } : i))
    );
  }

  function clear() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
