import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // manifest.webmanifest, icons, and sw.js must stay reachable without a
  // session — the OS/browser fetches them for PWA install/offline caching,
  // not as an authenticated user request.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js|api).*)"],
};
