import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/" && searchParams.has("/studio")) {
    const studioUrl = request.nextUrl.clone();
    const studioValue = studioUrl.searchParams.get("/studio") || "1";
    studioUrl.searchParams.delete("/studio");
    studioUrl.searchParams.set("studio", studioValue);
    return NextResponse.redirect(studioUrl);
  }

  // The public home is served at / for every visitor, regardless of auth.
  // Explicit editor links retain the existing editor route and saved sessions.
  if (pathname === "/" && !["studio", "guest", "skipLanding"].some(key => searchParams.get(key) === "1")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/landing";
    return NextResponse.rewrite(homeUrl);
  }
  if (pathname === "/landing") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/landing"],
};
