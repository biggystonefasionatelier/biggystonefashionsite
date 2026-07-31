# Context for Claude — start here

This file exists so a fresh Claude Code session (in VS Code) has full
context on this project without Faith having to re-explain everything.
If you're Claude reading this for the first time: read this whole file,
then `README.md` and `SECURITY.md`, before doing anything else.

## What this is

Biggystone Fashion Atelier — an e-commerce site for a jewelry business
(earrings etc., ₦1,000–5,000 price range). Faith is the founder, a
non-developer. She started the business in 2019 at AAUA for students,
now based in Lagos, expanded beyond students to everyone.

Two sales channels on one site:
- **Retail**: in-stock pieces, buy now.
- **Pre-order wholesale**: bulk pricing for resellers, MOQ + deposit,
  longer lead time. Kept clearly separate from retail everywhere in the
  UI and checkout (they can't be checked out together).

Site goal: live by the last week of August, with a one-month launch
discount running through September — implemented as a dismissible,
countdown popup (see `src/components/SalePopup.tsx` and
`src/lib/promo.ts`), not a hardcoded banner, since the site itself is
meant to run indefinitely and this popup pattern gets reused for future
promos too.

Primary audience: Unilag students/campus (same-day pickup/delivery) plus
nationwide Nigeria buyers (tracked courier delivery). A separate,
already-designed printable delivery label (gold background, black text,
QR code linking to Instagram) was produced earlier in this project's
history but lives outside this codebase — it's a standalone PDF, not
part of the website.

## Stack decisions (already made, don't re-litigate unless Faith asks)

- **Framework**: Next.js (App Router, TypeScript, Tailwind v4)
- **Hosting**: Vercel
- **Code**: GitHub
- **Database**: MongoDB Atlas, via the official `mongodb` driver
  (`src/lib/mongodb.ts`). An earlier version of this project used
  Supabase (Postgres); that was fully migrated away on 2026-07-31
  because Faith wanted MongoDB instead. A later, in-between plan to use
  Vercel Postgres was decided but never actually implemented in code —
  MongoDB is what's really running now. If you see any stray reference
  to Supabase or Postgres anywhere, it's leftover cruft to clean up, not
  the intended design.
- **File storage**: Vercel Blob, for product photos uploaded via the
  admin dashboard (`src/app/api/admin/upload/route.ts`,
  `src/components/admin/ProductForm.tsx`).
- **Payments**: Paystack, hosted checkout (card data never touches this
  app's server) + webhook + redirect-based verification, both checked
  server-side before an order is marked paid.
- **Admin auth**: custom — bcrypt-hashed password in the `admin_users`
  collection (`src/lib/password.ts`), signed JWT session cookie built
  with `jose` (`src/lib/session.ts`, Edge-runtime-safe since it's used
  from `src/middleware.ts`). No third-party auth provider.
- **Email/birthday marketing**: Brevo. Signup form
  (`src/components/SignupForm.tsx`) collects name/email/birthday,
  stores in the `email_signups` collection, and pushes to Brevo via API
  (`src/lib/brevo.ts`) so Faith's birthday-triggered email automation
  (set up on Brevo's side, not in this code) can pick it up. This is a
  **permanent** feature of the site, not September-only.

## Data model (MongoDB collections)

No schema migration file needed (Mongo creates collections on first
write) — `database/init-indexes.mjs` (run via `npm run init-db`) sets up
the indexes that matter: uniqueness on `products.slug`,
`orders.paystack_reference`, `email_signups.email`, and
`admin_users.email`.

Field names inside documents are intentionally kept `snake_case`
(`product_type`, `image_url`, `customer_name`, etc.) matching the old
Postgres column names, purely so the API response shapes — and every
frontend component that reads them — didn't need to change during the
Mongo migration. Don't "clean this up" to camelCase without touching
every consumer; it's simply the model everything already agrees on.

`orders` embeds its line items directly as an `order_items` array field
(no separate collection/join) — that's what both the checkout routes
and the admin orders dashboard expect.

## Current state

Fully coded, not yet deployed. Nothing has been pushed to GitHub or
connected to a live Vercel project yet. `npm install` needs to be re-run
after the 2026-07-31 Mongo migration (dependencies changed — Supabase
packages removed, `mongodb`/`bcryptjs`/`jose`/`@vercel/blob`/`dotenv`
added). `npm run dev` had not yet been confirmed working as of this
handoff.

## What's left (see README.md for full detail on each step)

1. `git init` + push to a GitHub repo
2. Create Vercel project from that repo
3. Create a MongoDB Atlas cluster + a Vercel Blob store, run
   `npm run init-db` to set up indexes
4. `vercel env pull .env.local`, fill in remaining values
   (`.env.local.example` lists everything needed)
5. `npm run create-admin` to set up her login
6. Create Paystack account (test keys first), Brevo account + list +
   birthday automation workflow
7. Deploy, set Paystack webhook URL, connect custom domain
8. Add real product photos + copy (placeholder/generic copy is in
   `src/app/(site)/page.tsx` and `about/page.tsx` already, using her
   real founding story — just needs product data)
9. Confirm the actual September discount percentage (currently a
   generic "launch pricing" message in `src/lib/promo.ts` — update
   `PROMO.message` and `PROMO.end` once she confirms specifics)

## Working style notes

Faith is not a developer — explain steps plainly, avoid unexplained
jargon, and confirm before doing anything that touches money/payments
or deletes data. She's on a tight deadline (site live end of August).
The website should be secure and hard to break into — see
`SECURITY.md` for what's already in place; flag anything that falls
short of that bar rather than assuming it's fine.
