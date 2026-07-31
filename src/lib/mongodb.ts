import { MongoClient, type Db } from "mongodb";

/**
 * Cached on `global` (not just a module-level variable) because Next.js
 * dev mode reloads modules on every file change - without this, each
 * reload would open a brand new connection to MongoDB and leak sockets.
 */
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Check your .env.local file.");
  }

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || "biggystone");
}
