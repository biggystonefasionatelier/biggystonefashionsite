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
  const isApiAdminRoute = path.startsWith("/api/admin");
  const isAdminRoute = path.startsWith("/admin") || isApiAdminRoute;
  const isPublicAuthRoute =
    path.startsWith("/admin/login") ||
    path === "/api/admin/login" ||
    path === "/api/admin/logout";

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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
