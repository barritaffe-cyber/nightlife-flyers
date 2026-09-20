import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
const libraryUrl = new URL("../components/editor/LibraryPanel.tsx", import.meta.url);

test("social icons use one 15 percent insertion and normalization scale", async () => {
  const [page, library] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(libraryUrl, "utf8"),
  ]);

  assert.match(page, /const COCO_SOCIAL_ICON_SCALE = 0\.15;/);
  assert.match(page, /128 \* COCO_SOCIAL_ICON_SCALE/);
  assert.match(library, /const SOCIAL_ICON_DEFAULT_SCALE = 0\.15;/);
  assert.match(library, /item\.opticalViewBox \|\| item\.viewBox/);
  assert.match(library, /if \(opticalGraphic\) \{[\s\S]{0,100}?addVectorSticker\(opticalGraphic\)/);
  assert.match(library, /scale: socialPlatform \? SOCIAL_ICON_DEFAULT_SCALE : 0\.6/);
  assert.match(library, /scale: SOCIAL_ICON_DEFAULT_SCALE/);
  assert.doesNotMatch(page, /scale: 0\.18/);
});

test("selected social controls render before the icon gallery and insertion stays in the editor", async () => {
  const source = await readFile(libraryUrl, "utf8");
  const socialStart = source.indexOf('title="Social Media"');
  const controls = source.indexOf("renderStickerControls(", socialStart);
  const gallery = source.indexOf('className="grid grid-cols-4 gap-2"', socialStart);

  assert.ok(socialStart >= 0 && controls > socialStart, "social section exists with controls");
  assert.ok(controls < gallery, "selected controls appear above the icon gallery");
  assert.match(source, /if \(!socialPlatform\) onPlaceToCanvas\?\.\(\);/);
  assert.match(source, /data-selected-social-controls="true"/);
  assert.match(
    source,
    /selectedSocialControlsRef\.current\?\.scrollIntoView\([\s\S]{0,160}?block: 'nearest'/
  );
});

test("new social icons start above the complete canvas stack", async () => {
  const [page, library] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(libraryUrl, "utf8"),
  ]);

  assert.match(library, /const SOCIAL_ICON_TOP_LAYER_OFFSET = 180;/);
  assert.equal(
    (library.match(/layerOffset: SOCIAL_ICON_TOP_LAYER_OFFSET/g) || []).length,
    2,
    "both vector and raster social insertion paths use the top layer",
  );
  assert.match(library, /const ASSET_LAYER_MAX = 180;/);
  assert.match(page, /const COCO_SOCIAL_ICON_TOP_LAYER_OFFSET = 180;/);
  assert.match(page, /const ASSET_LAYER_MAX = 180;/);
  assert.match(
    page,
    /Number\.isFinite\(Number\(item\?\.layerOffset\)\)[\s\S]{0,120}?Number\(item\.layerOffset\)[\s\S]{0,120}?COCO_SOCIAL_ICON_TOP_LAYER_OFFSET/,
    "center-footer normalization preserves explicit social depth and migrates missing depth",
  );
});
