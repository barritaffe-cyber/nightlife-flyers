export function getPublicSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://nightlife-flyers.com";
}

export function getPublicSiteHost() {
  return getPublicSiteUrl().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "nightlife-flyers.com";
}

export function getPublicSupportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || `support@${getPublicSiteHost()}`;
}

export function getPublicLegalName() {
  return process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME || "Nightlife Flyers";
}
