# Security measures built into this site

A plain-language summary of what's protecting the store and its data.

## Payments
- Card details never touch this app's server. Checkout hands off to Paystack's own hosted payment page, so PCI compliance (the rules around handling card data) stays entirely with Paystack.
- Prices are never trusted from the browser. Every checkout recalculates the total server-side from the database, so no one can tamper with a price in the browser and pay less.
- Payment confirmation happens two ways: (1) the success page verifies the transaction directly with Paystack's API, and (2) Paystack's webhook independently confirms the same thing. An order only marks "paid" after a real, verified payment - not just because someone landed on the success page URL.
- The webhook checks a cryptographic signature (HMAC) on every request, so only genuine requests from Paystack are accepted - not someone hitting the URL directly.

## Admin access
- The admin dashboard requires a real login (email + password) checked against a hashed password stored in the database - not a hardcoded password in the code.
- Passwords are hashed with bcrypt before being stored. This app never stores or logs a plain-text password. Login always takes the same amount of time whether the email exists or not, so someone probing the login form can't tell which admin emails are valid.
- After login, the server signs a session token (JWT) and stores it in an `httpOnly` cookie - JavaScript running in the browser (including injected by an attacker) can never read or steal it. The cookie is also marked `secure` in production, so it's only ever sent over HTTPS.
- Every request to `/admin/*` and `/api/admin/*` is checked by the site's middleware, which runs before any page or API route loads and rejects anything without a valid, correctly-signed session.

## Secrets
- API keys (Paystack secret key, MongoDB connection string, Brevo key, JWT signing secret, Blob storage token) live only in environment variables on the server, never in the code and never sent to the browser.
- `.env.local` (where you'll put real keys) is excluded from version control by default - it will never accidentally get pushed to GitHub or shared.
- The database itself is only reachable with a username and password (set up in MongoDB Atlas) - there's no way to query it directly from the browser. Every read and write goes through this app's own API routes, which validate and authorize each request first.

## Public forms (signup, wholesale inquiry, checkout)
- Every field is validated on the server before touching the database - wrong formats, missing fields, or oversized input get rejected outright.
- Rate limiting slows down spam/abuse: a maximum number of submissions per visitor per time window on signup, wholesale inquiries, checkout, and admin login attempts.
- Product photo uploads are restricted to image files under 5MB and go straight to Vercel Blob storage - nothing uploaded through that form can execute as code.

## What to still do on your end
- Use Paystack's **test keys** until you're ready to go live, then switch to live keys (see the setup guide in README.md).
- Keep your MongoDB Atlas and Vercel account passwords strong, and don't share `.env.local` contents in chat, screenshots, or email.
- Once live, periodically check the Orders and Signups tables in the admin dashboard match what you'd expect - this is a small business site, not a bank, but it's still good practice.
