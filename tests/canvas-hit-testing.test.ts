import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  isInsideVisiblePixelEnvelope,
  isVisibleAssetPixel,
} from "../lib/canvasHitTesting.ts";

test("normal assets select only pixels with visible alpha", () => {
  assert.equal(isVisibleAssetPixel({ red: 255, green: 255, blue: 255, alpha: 255 }), true);
  assert.equal(isVisibleAssetPixel({ red: 255, green: 255, blue: 255, alpha: 0 }), false);
  assert.equal(isVisibleAssetPixel({ red: 255, green: 255, blue: 255, alpha: 255, opacity: 0 }), false);
});

test("screen and additive assets do not select their invisible black pixels", () => {
  assert.equal(
    isVisibleAssetPixel({ red: 0, green: 0, blue: 0, alpha: 255, blendMode: "screen" }),
    false,
  );
  assert.equal(
    isVisibleAssetPixel({ red: 180, green: 30, blue: 20, alpha: 255, blendMode: "screen" }),
    true,
  );
});

test("multiply assets do not select their invisible white pixels", () => {
  assert.equal(
    isVisibleAssetPixel({ red: 255, green: 255, blue: 255, alpha: 255, blendMode: "multiply" }),
    false,
  );
  assert.equal(
    isVisibleAssetPixel({ red: 20, green: 20, blue: 20, alpha: 255, blendMode: "multiply" }),
    true,
  );
});

test("enclosed hit mode fills a hollow perimeter without filling outside margins", () => {
  const width = 7;
  const height = 7;
  const data = new Uint8ClampedArray(width * height * 4);
  const paint = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    data[index + 3] = 255;
  };
  for (let x = 1; x <= 5; x += 1) {
    paint(x, 1);
    paint(x, 5);
  }
  for (let y = 1; y <= 5; y += 1) {
    paint(1, y);
    paint(5, y);
  }

  assert.equal(isInsideVisiblePixelEnvelope({ data, width, height, x: 3, y: 3 }), true);
  assert.equal(isInsideVisiblePixelEnvelope({ data, width, height, x: 0, y: 3 }), false);
  assert.equal(isInsideVisiblePixelEnvelope({ data, width, height, x: 6, y: 6 }), false);
});

test("canvas routes legacy alpha-bounds assets through pixel masks", async () => {
  const [page, globals] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /requestedHitMode === "alpha-bounds" \? "alpha-mask"/);
  assert.match(page, /querySelector\('img\[data-hit-source="true"\]'\)/);
  assert.doesNotMatch(page, /if \(hitMode === "alpha-bounds"\)/);
  assert.match(page, /data-hit-mode="alpha-mask"/);
  assert.match(page, /compiledUsesAlphaEnvelope/);
  assert.match(page, /data-hit-mode=\{compiledHitMode\}/);
  assert.match(page, /hitTestMode === "alpha-envelope"/);
  assert.match(page, /empty corners of an emoji's line box stay clickable-through/);
  assert.match(page, /data-text-hit-surface/);
  assert.match(page, /styledRuns=\{styledTextRuns\}/);
  assert.match(page, /data-styled-text-hit-box="true"/);
  assert.match(page, /object\.kind === "text"\s*\? "none"/);
  assert.match(page, /Painted glyph hit surfaces still bubble through this wrapper/);
  assert.match(page, /const usesSeparatePriceLabel = object\.semanticRole === "price"/);
  assert.match(page, /usesSeparatePriceLabel && priceLabel/);
  assert.match(globals, /\[data-node\]:has\(\[data-text-glyph-box="true"\]\)/);
  assert.match(globals, /\[data-text-hit-surface="true"\][^{]*\{[^}]*pointer-events: visiblePainted !important/s);
});
