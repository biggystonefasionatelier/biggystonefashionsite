/**
 * Minimal in-memory rate limiter for public-facing API routes (signup,
 * wholesale inquiry, checkout initialize) to slow down spam/abuse.
 *
 * NOTE: this resets whenever the server restarts and does not share state
 * across multiple server instances. It is a reasonable first line of
 * defense for a small store on a single Vercel deployment. If traffic
 * grows, replace this with a shared store like Upstash Redis
 * (@upstash/ratelimit) - the calling code below won't need to change,
 * just this file's internals.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

/** Best-effort caller identifier from request headers (works behind Vercel's proxy). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
