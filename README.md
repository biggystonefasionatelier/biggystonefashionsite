# Biggystone Fashion Atelier — store setup guide

This is your full store: retail shop, pre-order wholesale, cart, Paystack
checkout, email/birthday signup (feeding Brevo), and a custom admin
dashboard with photo upload. Follow these steps in order to get it live.
See `SECURITY.md` for what's protecting the site along the way.

## 1. Create a MongoDB Atlas cluster (your database)

1. Go to mongodb.com/cloud/atlas, sign up, and create a new free (M0)
   cluster (pick a region close to Nigeria, e.g. one of the AWS
   `eu-west` regions).
2. Under **Database Access**, add a database user with a strong,
   generated password (not your Atlas login password).
3. Under **Network Access**, add `0.0.0.0/0` (allow access from
   anywhere) — Vercel's servers don't have a fixed IP, so this is the
   normal setup for this kind of hosting. Your data is still protected
   by the database username/password, not by IP restriction.
4. Click **Connect -> Drivers**, copy the connection string (it looks
   like `mongodb+srv://user:password@your-cluster.mongodb.net/...`) —
   this is your `MONGODB_URI`.

## 2. Create a Paystack account (payments)

1. Sign up at paystack.com (or log in if you already have an account).
2. Go to **Settings -> API Keys & Webhooks**. Copy your **test** secret
   and public keys for now (they start with `sk_test_` / `pk_test_`) —
   switch to live keys only once you're ready to accept real payments.
3. Once the site is deployed (step 6), come back here and set the
   **Webhook URL** to `https://your-domain.com/api/webhooks/paystack`.

## 3. Create a Brevo account (email/birthday marketing)

1. Sign up at brevo.com (free plan is enough to start).
2. Go to **Contacts -> Lists**, create a list (e.g. "Biggystone Signups"),
   and note its list ID (shown in the list settings).
3. Go to **Settings -> SMTP & API -> API Keys**, create a new API key.
4. Set up your birthday automation: **Automations -> Create workflow ->
   trigger on contact attribute (BIRTHDAY)**. This is where your birthday
   messages actually get built and sent — the site just feeds Brevo the
   names, emails, and birthdays.

## 4. Fill in your environment variables

Copy `.env.local.example` to a new file named `.env.local` in this same
folder, and fill in the real values from steps 1-2 above. For
`JWT_SECRET`, generate a random value with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Leave `BLOB_READ_WRITE_TOKEN` blank for now — you'll get that in step 6
once your Vercel project exists. Never share `.env.local` or paste its
contents anywhere public.

## 5. Run it locally (optional, to preview before deploying)

```bash
npm install
npm run init-db        # creates database indexes (run once)
npm run create-admin    # sets your admin email + password
npm run dev
```

Open http://localhost:3000. The admin dashboard is at
http://localhost:3000/admin/login — sign in with the email/password you
just created. Product photo uploads only work once `BLOB_READ_WRITE_TOKEN`
is set (step 6), but everything else works locally first.

## 6. Deploy to Vercel (make it live)

1. Push this project to a GitHub repository (private is fine).
2. Go to vercel.com, sign up/log in, click **Add New -> Project**, and
   import that repository.
3. Before deploying, add every variable from your `.env.local` file into
   Vercel's **Environment Variables** settings (same names, same values).
   Set `NEXT_PUBLIC_SITE_URL` to your actual Vercel URL or custom domain.
4. Click **Deploy**.
5. Once deployed, go to your Vercel project -> **Storage -> Create
   Database -> Blob**, create a store, and connect it to this project —
   this automatically adds `BLOB_READ_WRITE_TOKEN` to your environment
   variables. Redeploy once so the running site picks it up.
6. Go back to Paystack (step 2.3) and set the webhook URL using your
   real domain.
7. Connect your custom domain under **Vercel -> Settings -> Domains** if
   you're using biggystonefashionatelier.com.

## 7. Add your first products

Log into `/admin/login`, go to **Products -> Add product**, and start
listing your retail and pre-order wholesale pieces. Retail items need
stock counts; wholesale items need an MOQ and deposit percentage. Upload
a photo directly from the product form, or paste an image URL instead.

## Ongoing costs (recap)

- Domain: ~₦3,000–7,000/year
- Vercel hosting: free tier is enough at this scale
- Vercel Blob (photo storage): free tier (1GB) is enough at this scale
- MongoDB Atlas: free (M0) tier is enough at this scale
- Brevo: free plan covers up to 100,000 contacts, 300 emails/day
- Paystack: 1.5% + ₦100 per transaction (no monthly fee)

## What's not built yet

- Individual product detail pages (customers add to cart straight from
  the shop/home grid for now — a full product page can be added later)
