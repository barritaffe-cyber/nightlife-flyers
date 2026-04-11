export function getPublicSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://nightlife-flyers.com";
}

export function getPublicSiteHost() {
  return getPublicSiteUrl().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "nightlife-flyers.com";
}

export function getPublicSupportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "level47.store@gmail.com";
}

export function getPublicLegalName() {
  return process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME || "Nightlife Flyers";
}

export function getPublicSupportPhone() {
  return process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";
}

export function getPublicMerchantAddress() {
  return process.env.NEXT_PUBLIC_MERCHANT_ADDRESS || "";
}

export function getPublicTransactionCurrency() {
  return process.env.NEXT_PUBLIC_TRANSACTION_CURRENCY || "USD";
}
