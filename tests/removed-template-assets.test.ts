import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const templatesSource = readFileSync("lib/templates.ts", "utf8");
const appSource = readFileSync("app/page.tsx", "utf8");

const blockedIds = [
  "center_hero_neon_glow_overlay",
  "center_hero_laser_beams",
  "center_hero_smoke_ribbons",
  "center_hero_neon_particles",
  "ladies_night_lasers_square",
  "ladies_night_lasers_story",
  "ladies_night_smoke_story",
];

const blockedUrls = [
  "/scene-assets/neon-club/glow-overlay.svg",
  "/scene-assets/neon-club/laser-beams.svg",
  "/scene-assets/neon-club/particles.svg",
  "/scene-assets/common/smoke-ribbons.svg",
  "/mobile-assets/scene-assets/neon-club/glow-overlay.webp",
  "/mobile-assets/scene-assets/neon-club/laser-beams.webp",
  "/mobile-assets/scene-assets/neon-club/particles.webp",
  "/mobile-assets/scene-assets/common/smoke-ribbons.webp",
];

test("hidden overlay ids and urls are denied at the template layer", () => {
  for (const id of blockedIds) {
    assert.match(templatesSource, new RegExp(`['"]${id}['"]`));
  }

  for (const url of blockedUrls) {
    assert.ok(templatesSource.includes(url), `missing blocked asset URL: ${url}`);
  }

  assert.ok(templatesSource.includes("export const isRemovedTemplateAsset"));
  assert.ok(templatesSource.includes("REMOVED_TEMPLATE_ASSET_URLS.has"));
});

test("template application sanitizes fresh layouts and stale saved sessions", () => {
  assert.ok(appSource.includes("isRemovedTemplateAsset"));
  assert.ok(appSource.includes(".filter((item: any) => !isRemovedTemplateAsset(item))"));
  assert.ok(appSource.includes("cloneTemplateAssetSessionList((merged as any).emojiList"));
  assert.ok(appSource.includes("cloneTemplateAssetSessionList((merged as any).portraits"));
  assert.ok(appSource.includes("cloneTemplateAssetSessionList((merged as any).emojis"));
  assert.ok(appSource.includes("(portraits[format] || []).filter((item: any) => !isRemovedTemplateAsset(item))"));
  assert.ok(appSource.includes("(portraits?.[format] || []).filter((item: any) => !isRemovedTemplateAsset(item))"));
  assert.ok(appSource.includes(".filter((asset) => !isRemovedTemplateAsset(asset))"));
});
