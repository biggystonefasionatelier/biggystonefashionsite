"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/preorder", label: "Overview" },
  { href: "/admin/preorder/orders", label: "Orders" },
  { href: "/admin/preorder/supplier", label: "Supplier order" },
  { href: "/admin/preorder/clients", label: "Per client" },
  { href: "/admin/preorder/products", label: "Products" },
  { href: "/admin/preorder/upload", label: "Upload photos" },
  { href: "/admin/preorder/settings", label: "Settings" },
];

export default function PreorderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="mb-6 border-b border-black/10">
        <p className="text-xs font-medium tracking-[2px] text-neutral-400">PRE-ORDER ADMIN</p>
        <nav className="mt-2 flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-t-md px-3 py-2 text-sm ${
                  active
                    ? "bg-brand-gold text-brand-black"
                    : "text-neutral-600 hover:bg-black/5"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
