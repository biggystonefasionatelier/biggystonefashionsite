"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/wholesale", label: "Wholesale inquiries" },
  { href: "/admin/signups", label: "Email/birthday list" },
  { href: "/admin/gifts", label: "Loyalty gifts" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-brand-black text-brand-gold-light">
      <div className="p-5">
        <p className="text-sm font-bold tracking-wide">BIGGYSTONE</p>
        <p className="text-[10px] tracking-[3px] text-brand-gold">ADMIN</p>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm ${
                active ? "bg-brand-gold text-brand-black" : "hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleSignOut}
        className="mx-3 mt-6 rounded-md border border-brand-gold/40 px-3 py-2 text-left text-sm hover:bg-white/5"
      >
        Sign out
      </button>
    </aside>
  );
}
