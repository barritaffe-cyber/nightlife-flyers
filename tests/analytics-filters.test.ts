import test from "node:test";
import assert from "node:assert/strict";

import {
  isAutomatedAnalyticsUserAgent,
  isTrackableHumanDeviceUserAgent,
} from "../lib/analytics/filters.ts";

const chromeWindows =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const safariIphone =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const androidWebView =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 wv)";

test("analytics filter allows real desktop and mobile browser devices", () => {
  assert.equal(isTrackableHumanDeviceUserAgent(chromeWindows), true);
  assert.equal(isTrackableHumanDeviceUserAgent(safariIphone), true);
  assert.equal(isTrackableHumanDeviceUserAgent(androidWebView), true);
});

test("analytics filter rejects server pings and automated clients", () => {
  assert.equal(isTrackableHumanDeviceUserAgent("vercel-edge-functions/1.0"), false);
  assert.equal(isTrackableHumanDeviceUserAgent("supabase-js/2.93.1"), false);
  assert.equal(isTrackableHumanDeviceUserAgent("curl/8.7.1"), false);
  assert.equal(isTrackableHumanDeviceUserAgent("facebookexternalhit/1.1"), false);
  assert.equal(isTrackableHumanDeviceUserAgent(""), false);
});

test("analytics automated user-agent detector flags known infrastructure noise", () => {
  assert.equal(isAutomatedAnalyticsUserAgent("vercel-edge-functions/1.0"), true);
  assert.equal(isAutomatedAnalyticsUserAgent("Supabase-JS/2.93.1"), true);
  assert.equal(isAutomatedAnalyticsUserAgent("Mozilla/5.0 Googlebot/2.1"), true);
  assert.equal(isAutomatedAnalyticsUserAgent(chromeWindows), false);
});
