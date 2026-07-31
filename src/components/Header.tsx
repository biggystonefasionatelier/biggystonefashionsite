"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/wholesale", label: "Pre-Order Wholesale" },
  { href: "/about", label: "About" },
  { href: "/delivery", label: "Delivery & Returns" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="bg-brand-black text-brand-gold-light sticky top-0 z-40 border-b border-brand-gold/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-wide">
          BIGGYSTONE
          <span className="block text-[10px] font-normal tracking-[3px] text-brand-gold">
            FASHION ATELIER
          </span>
        </Link>

        <nav className="hidden gap-6 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-gold">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/cart"
          className="rounded-full border border-brand-gold px-4 py-1.5 text-sm hover:bg-brand-gold hover:text-brand-black"
        >
          Cart ({count})
        </Link>
      </div>

      {/* Mobile nav */}
      <nav className="flex gap-4 overflow-x-auto px-4 pb-3 text-xs md:hidden">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-brand-gold">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
