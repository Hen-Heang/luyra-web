import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PAUSED_HENGO_ROUTES = ["/today", "/tasks", "/goals", "/habits", "/learning"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPausedHengoRoute = PAUSED_HENGO_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPausedHengoRoute) {
    const moneyFlowUrl = request.nextUrl.clone();
    moneyFlowUrl.pathname = "/finance";
    moneyFlowUrl.search = "";
    return NextResponse.redirect(moneyFlowUrl);
  }

  return updateSession(request);
}

export const config = {
  // manifest.webmanifest, icons, and sw.js must stay reachable without a
  // session — the OS/browser fetches them for PWA install/offline caching,
  // not as an authenticated user request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js|api).*)"],
};
