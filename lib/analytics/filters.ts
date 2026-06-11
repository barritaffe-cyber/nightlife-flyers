const AUTOMATED_USER_AGENT_TOKENS = [
  "ahrefsbot",
  "adsbot",
  "applebot",
  "axios",
  "baiduspider",
  "better uptime",
  "bingbot",
  "bot",
  "checkly",
  "crawler",
  "curl",
  "datadog",
  "discordbot",
  "duckduckbot",
  "facebookexternalhit",
  "facebot",
  "go-http-client",
  "google-inspectiontool",
  "googlebot",
  "headless",
  "health",
  "httpie",
  "insomnia",
  "java/",
  "lighthouse",
  "linkedinbot",
  "mj12bot",
  "monitor",
  "newrelic",
  "node",
  "okhttp",
  "pagespeed",
  "petalbot",
  "pingdom",
  "postmanruntime",
  "probe",
  "python",
  "semrushbot",
  "slackbot",
  "spider",
  "statuscake",
  "supabase",
  "synthetic",
  "telegrambot",
  "undici",
  "uptime",
  "vercel",
  "wget",
  "whatsapp",
  "yandexbot",
] as const;

const SUPPORTED_DEVICE_TOKENS = [
  "android",
  "cros",
  "ipad",
  "iphone",
  "ipod",
  "linux aarch64",
  "linux x86_64",
  "mac os x",
  "macintosh",
  "windows nt",
  "x11; linux",
] as const;

const BROWSER_OR_WEBVIEW_TOKENS = [
  "chrome/",
  "crios/",
  "duckduckgo/",
  "edg/",
  "edga/",
  "edgios/",
  "fban/",
  "fbav/",
  "firefox/",
  "fxios/",
  "gsa/",
  "instagram",
  "linkedinapp",
  "mobile safari",
  "opr/",
  "pinterest",
  "safari/",
  "samsungbrowser/",
  "version/",
  "wv)",
] as const;

function normalizeUserAgent(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function includesAnyToken(userAgent: string, tokens: readonly string[]) {
  return tokens.some((token) => userAgent.includes(token));
}

export function isAutomatedAnalyticsUserAgent(value: unknown) {
  const userAgent = normalizeUserAgent(value);
  return userAgent ? includesAnyToken(userAgent, AUTOMATED_USER_AGENT_TOKENS) : false;
}

export function isSupportedAnalyticsDeviceUserAgent(value: unknown) {
  const userAgent = normalizeUserAgent(value);
  return userAgent ? includesAnyToken(userAgent, SUPPORTED_DEVICE_TOKENS) : false;
}

export function isSupportedAnalyticsBrowserUserAgent(value: unknown) {
  const userAgent = normalizeUserAgent(value);
  return userAgent ? includesAnyToken(userAgent, BROWSER_OR_WEBVIEW_TOKENS) : false;
}

export function isTrackableHumanDeviceUserAgent(value: unknown) {
  const userAgent = normalizeUserAgent(value);
  if (!userAgent) return false;
  if (isAutomatedAnalyticsUserAgent(userAgent)) return false;
  return (
    isSupportedAnalyticsDeviceUserAgent(userAgent) &&
    isSupportedAnalyticsBrowserUserAgent(userAgent)
  );
}
