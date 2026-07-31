import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/10 bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-neutral-600">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-bold text-neutral-900">Biggystone Fashion Atelier</p>
            <p className="mt-2">5, Ajileye Street, Ilaje Road,</p>
            <p>Bariga, Lagos, Nigeria</p>
            <p className="mt-2">+234 814 826 3705</p>
            <p>biggystonefashionatelier@gmail.com</p>
          </div>

          <div>
            <p className="font-bold text-neutral-900">Shop</p>
            <ul className="mt-2 space-y-1">
              <li><Link href="/shop" className="hover:underline">Retail</Link></li>
              <li><Link href="/wholesale" className="hover:underline">Pre-Order Wholesale</Link></li>
              <li><Link href="/delivery" className="hover:underline">Delivery & Returns</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-neutral-900">Follow</p>
            <ul className="mt-2 space-y-1">
              <li>
                <a
                  href="https://www.instagram.com/biggystonefashionatelier"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} Biggystone Fashion Atelier. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
