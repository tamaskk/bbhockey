import { NextResponse, type NextRequest } from "next/server";

// Hungarian is the default language at "/" (no prefix): those paths are served from the /hu route internally.
// /en, /de, /sv are real paths; "/hu/..." redirects to the address without the prefix.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (/^\/(en|de|sv)(\/|$)/.test(pathname)) return;
  const url = req.nextUrl.clone();
  if (/^\/hu(\/|$)/.test(pathname)) {
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  url.pathname = `/hu${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

// pages only: not the API, Next internals, the admin, or files (/img/x.jpg, /wp-content/...css)
export const config = { matcher: ["/((?!api|_next|admin|.*\\.).*)"] };
