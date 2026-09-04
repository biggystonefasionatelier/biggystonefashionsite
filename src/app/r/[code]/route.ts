import { NextResponse } from "next/server";

/**
 * Short redirect for referral links (e.g. biggystonefashion.com/r/REF-A1B2C3)
 * so what gets shared/typed is shorter than the full ?ref= query string.
 * SignupForm.tsx only ever reads the ?ref= param, so this just bounces
 * straight there rather than duplicating that capture logic.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biggystonefashion.com";
  return NextResponse.redirect(`${siteUrl}/?ref=${encodeURIComponent(code)}`);
}
