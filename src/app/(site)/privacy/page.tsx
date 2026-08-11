export const metadata = { title: "Privacy Policy | Biggystone Fashion Atelier" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated August 2026</p>

      <p className="mt-6 text-neutral-700">
        This page explains what information Biggystone Fashion Atelier
        collects when you use this site, what we do with it, and who we
        share it with. We keep this simple on purpose — if anything here
        isn&apos;t clear, message us on WhatsApp or email and we&apos;ll
        explain.
      </p>

      <h2 className="mt-8 font-bold">What we collect</h2>
      <p className="mt-2 text-neutral-700">Depending on how you use the site, we collect:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
        <li>Name, email, phone number, and birthday (month and day only — we never ask for your birth year) when you sign up for our list.</li>
        <li>Name, email, phone, delivery address, and city when you place an order.</li>
        <li>Business name and quantity interested, if you submit a wholesale inquiry.</li>
        <li>Order history — what you bought, when, and any discount codes or gifts used.</li>
      </ul>

      <h2 className="mt-8 font-bold">What we don&apos;t collect</h2>
      <p className="mt-2 text-neutral-700">
        We never see or store your card details — payment is handled
        entirely by Paystack on their own secure checkout page. We also
        don&apos;t run any analytics or advertising trackers on this site
        (no Google Analytics, no Facebook Pixel, nothing like that) — the
        only thing stored in your browser is your shopping cart, kept
        locally on your device until you check out.
      </p>

      <h2 className="mt-8 font-bold">How we use it</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
        <li>To process and deliver your order, and to reach you on WhatsApp with delivery updates.</li>
        <li>To send you a discount code and a small something during your birthday month, and to let you know about new drops, if you signed up for our list.</li>
        <li>To follow up on pre-order wholesale inquiries.</li>
        <li>To run our loyalty gift program for repeat customers.</li>
      </ul>

      <h2 className="mt-8 font-bold">Who we share it with</h2>
      <p className="mt-2 text-neutral-700">
        We use a small number of trusted service providers to run this
        site — we don&apos;t sell or rent your information to anyone, ever.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
        <li><strong>Paystack</strong> — processes your payment directly; we never see your card details.</li>
        <li><strong>Brevo</strong> — sends the emails described above (signup confirmations, birthday offers, order updates). You can unsubscribe from marketing emails at any time using the link in any email we send.</li>
        <li><strong>MongoDB Atlas</strong> and <strong>Vercel</strong> — host our database and website respectively.</li>
      </ul>

      <h2 className="mt-8 font-bold">How long we keep it</h2>
      <p className="mt-2 text-neutral-700">
        We keep order records for as long as needed for our business
        records. If you&apos;re on our email list, we keep your details
        until you unsubscribe or ask us to remove them.
      </p>

      <h2 className="mt-8 font-bold">Your rights</h2>
      <p className="mt-2 text-neutral-700">
        You can ask us what information we hold about you, ask us to
        correct it, or ask us to delete it, at any time — just message us
        on WhatsApp or email (below). For marketing emails specifically,
        you can also unsubscribe yourself using the link at the bottom of
        any email.
      </p>

      <h2 className="mt-8 font-bold">Keeping your information safe</h2>
      <p className="mt-2 text-neutral-700">
        Account passwords are never stored in plain text, our admin
        dashboard is protected by a login only Faith has access to, and
        all traffic to this site is encrypted (https).
      </p>

      <h2 className="mt-8 font-bold">Children</h2>
      <p className="mt-2 text-neutral-700">
        This site is not directed at children, and we don&apos;t knowingly
        collect information from anyone under 18 without a parent or
        guardian&apos;s involvement.
      </p>

      <h2 className="mt-8 font-bold">Changes to this policy</h2>
      <p className="mt-2 text-neutral-700">
        If anything here changes, we&apos;ll update this page and the
        &quot;last updated&quot; date at the top.
      </p>

      <h2 className="mt-8 font-bold">Questions?</h2>
      <p className="mt-2 text-neutral-700">
        WhatsApp/call +234 814 826 3705, or email
        biggystonefashionatelier@gmail.com.
      </p>
    </div>
  );
}
