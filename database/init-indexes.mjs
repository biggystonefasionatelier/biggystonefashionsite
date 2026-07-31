// Biggystone Fashion Atelier — database setup
// Run this once against your MongoDB Atlas cluster: `npm run init-db`
// (reads MONGODB_URI / MONGODB_DB from .env.local). MongoDB doesn't need
// a schema up front like Postgres did — collections are created
// automatically the first time something is written to them. What this
// script does is create indexes: some for speed, and some (`unique: true`)
// that enforce data integrity the same way the old Postgres `unique`
// column constraints did (e.g. two products can't share a slug).

import { MongoClient } from "mongodb";
import { config } from "dotenv";

config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing. Fill in .env.local first (see .env.local.example).");
  process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "biggystone");

  await db.collection("products").createIndex({ slug: 1 }, { unique: true });
  await db.collection("products").createIndex({ product_type: 1, active: 1 });

  await db.collection("orders").createIndex({ paystack_reference: 1 }, { unique: true });
  await db.collection("orders").createIndex({ status: 1 });

  await db.collection("email_signups").createIndex({ email: 1 }, { unique: true });
  await db.collection("email_signups").createIndex({ created_at: -1 });

  await db.collection("wholesale_inquiries").createIndex({ created_at: -1 });

  await db.collection("admin_users").createIndex({ email: 1 }, { unique: true });

  console.log("Indexes created. Your database is ready.");
}

run()
  .catch((err) => {
    console.error("Setup failed:", err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
