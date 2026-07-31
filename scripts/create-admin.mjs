// Creates (or resets) your admin login. Run with: npm run create-admin
// Reads MONGODB_URI from .env.local, so fill that in first.

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing. Fill in .env.local first (see .env.local.example).");
  process.exit(1);
}

const rl = readline.createInterface({ input: stdin, output: stdout });

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function run() {
  const email = (await rl.question("Admin email: ")).trim().toLowerCase();
  if (!isValidEmail(email)) {
    console.error("That doesn't look like a valid email address.");
    process.exit(1);
  }

  const password = await rl.question("Admin password (min 10 characters): ");
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "biggystone");

    await db.collection("admin_users").updateOne(
      { email },
      { $set: { email, password_hash: passwordHash }, $setOnInsert: { created_at: new Date() } },
      { upsert: true }
    );

    console.log(`Admin login ready for ${email}. You can now sign in at /admin/login.`);
  } finally {
    await client.close();
  }
}

run()
  .catch((err) => {
    console.error("Failed to create admin:", err);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
