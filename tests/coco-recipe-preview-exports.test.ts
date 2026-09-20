import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  COCO_CURATED_ART_DIRECTION_LIBRARY,
  getCocoRecipePreviewExports,
} from "../components/coco/artDirections/index.ts";

test("every active Coco recipe choice has a real reference export", () => {
  for (const direction of COCO_CURATED_ART_DIRECTION_LIBRARY) {
    const preview = getCocoRecipePreviewExports(direction.visualRecipeId);
    assert.ok(preview, `${direction.id} needs a recipe preview`);
    assert.ok(preview.square || preview.story, `${direction.id} needs at least one preview format`);

    for (const src of [preview.square, preview.story].filter(Boolean)) {
      assert.ok(existsSync(`public${src}`), `${src} must exist in public`);
    }
  }

  assert.equal(getCocoRecipePreviewExports("golden-hero-editorial"), undefined);
});

test("the chooser prefers recipe exports and falls back per missing format", () => {
  const chooserSource = readFileSync("components/coco/CocoDirectionChooser.tsx", "utf8");
  const appSource = readFileSync("app/page.tsx", "utf8");

  assert.match(chooserSource, /choice\.recipePreview \? \(/);
  assert.match(chooserSource, /const exportedSrc = choice\.recipePreview\?\.\[format\]/);
  assert.match(chooserSource, /const generatedCanvas = choice\.generatedPreview\?\.\[format\]/);
  assert.match(appSource, /recipePreview: getCocoRecipePreviewExports\(direction\.visualRecipeId\)/);
});
