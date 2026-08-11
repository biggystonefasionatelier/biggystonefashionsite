import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * Runs on every request. Protects everything under /admin and /api/admin
 * (except the login/logout endpoints themselves): no valid, signed
 * session cookie -> redirect to /admin/login (page routes) or 401 (API
 * routes). This is the primary gate keeping the admin dashboard and its
 * data endpoints away from anyone who isn't you.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // shop.biggystonefashion.com is shared as a direct link to the
  // pre-order wholesale landing page, not the homepage - only the root
  // path is special-cased so other pages on that subdomain (e.g. /cart)
  // still behave normally.
  const hostname = request.headers.get("host") ?? "";
  if (hostname.startsWith("shop.") && path === "/") {
    return NextResponse.rewrite(new URL("/wholesale", request.url));
  }

  const isApiAdminRoute = path.startsWith("/api/admin");
  const isAdminRoute = path.startsWith("/admin") || isApiAdminRoute;
  const isPublicAuthRoute =
    path.startsWith("/admin/login") ||
    path.startsWith("/admin/forgot-password") ||
    path.startsWith("/admin/reset-password") ||
    path === "/api/admin/login" ||
    path === "/api/admin/logout" ||
    path === "/api/admin/forgot-password" ||
    path === "/api/admin/reset-password";

  if (!isAdminRoute || isPublicAuthRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return isApiAdminRoute
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
};
