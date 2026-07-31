import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: string | null;
  product_type: "retail" | "wholesale";
  stock: number;
  image_url: string | null;
  moq: number | null;
  deposit_percent: number | null;
  active: boolean;
};

export type ProductDoc = {
  _id: ObjectId;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: string | null;
  product_type: "retail" | "wholesale";
  stock: number;
  image_url: string | null;
  moq: number | null;
  deposit_percent: number | null;
  active: boolean;
  created_at: Date;
};

export function toProduct(doc: ProductDoc): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    price: doc.price,
    category: doc.category,
    product_type: doc.product_type,
    stock: doc.stock,
    image_url: doc.image_url,
    moq: doc.moq,
    deposit_percent: doc.deposit_percent,
    active: doc.active,
  };
}

/**
 * Reads are wrapped in try/catch so the site still renders (with an empty
 * state) before MONGODB_URI is configured, instead of crashing the whole
 * page during local development.
 */
export async function getProducts(
  productType: "retail" | "wholesale",
  limit?: number
): Promise<Product[]> {
  try {
    const db = await getDb();
    let cursor = db
      .collection<ProductDoc>("products")
      .find({ product_type: productType, active: true })
      .sort({ created_at: -1 });

    if (limit) cursor = cursor.limit(limit);

    const docs = await cursor.toArray();
    return docs.map(toProduct);
  } catch (err) {
    console.error("getProducts failed (is MongoDB configured yet?):", err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const db = await getDb();
    const doc = await db
      .collection<ProductDoc>("products")
      .findOne({ slug, active: true });
    return doc ? toProduct(doc) : null;
  } catch (err) {
    console.error("getProductBySlug failed:", err);
    return null;
  }
}

/** Admin-only lookup - ignores the `active` flag so inactive products can be edited too. */
export async function getProductById(id: string): Promise<Product | null> {
  if (!ObjectId.isValid(id)) return null;
  try {
    const db = await getDb();
    const doc = await db.collection<ProductDoc>("products").findOne({ _id: new ObjectId(id) });
    return doc ? toProduct(doc) : null;
  } catch (err) {
    console.error("getProductById failed:", err);
    return null;
  }
}
