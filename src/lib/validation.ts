import { z } from "zod";

/**
 * Every API route validates its input against one of these schemas before
 * touching the database. Never trust data from the client - not even
 * prices or quantities, which are always re-checked against the database.
 */

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(200),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Birthday must be in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
});

export const wholesaleInquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(20),
  businessName: z.string().trim().max(150).optional().or(z.literal("")),
  quantityInterested: z.string().trim().max(100),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const cartItemSchema = z.object({
  productId: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid product ID"),
  quantity: z.number().int().min(1).max(500),
});

export const checkoutInitSchema = z.object({
  customerName: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(1).max(100),
  orderType: z.enum(["retail", "wholesale"]),
  items: z.array(cartItemSchema).min(1, "Cart is empty"),
  depositOnly: z.boolean().optional().default(false),
});

export const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.number().positive(),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  productType: z.enum(["retail", "wholesale"]),
  stock: z.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
  moq: z.number().int().min(1).optional(),
  depositPercent: z.number().min(0).max(100).optional(),
  active: z.boolean().default(true),
});
