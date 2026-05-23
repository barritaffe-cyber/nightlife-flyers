import { NextResponse, type NextRequest } from "next/server";

const AD_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "gad_source",
  "gad_campaignid",
]);

function isPaidLandingClick(searchParams: URLSearchParams) {
  if ([...AD_QUERY_KEYS].some((key) => searchParams.has(key))) return true;

  const utmMedium = searchParams.get("utm_medium")?.toLowerCase();
  const utmSource = searchParams.get("utm_source")?.toLowerCase();
  return utmMedium === "paid" || utmSource === "fb" || utmSource === "ig";
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/" && searchParams.has("/studio")) {
    const studioUrl = request.nextUrl.clone();
    const studioValue = studioUrl.searchParams.get("/studio") || "1";
    studioUrl.searchParams.delete("/studio");
    studioUrl.searchParams.set("studio", studioValue);
    return NextResponse.redirect(studioUrl);
  }

  if (pathname === "/landing" && isPaidLandingClick(searchParams)) {
    const studioUrl = request.nextUrl.clone();
    studioUrl.pathname = "/";
    studioUrl.searchParams.set("studio", "1");
    studioUrl.searchParams.set("from_landing_ad", "1");
    return NextResponse.redirect(studioUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/landing"],
};
