import test from "node:test";
import assert from "node:assert/strict";

import {
  COCO_PRICE_BADGE_INNER_RATIO,
  fitCocoPriceBadgeFontSize,
} from "../components/coco/priceBadgeFit.ts";

function measuredBlockBounds(
  text: string,
  fontSize: number,
  lineHeight: number,
  measureLineWidth: (line: string, fontSize: number) => number
) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    width: Math.max(...lines.map((line) => measureLineWidth(line, fontSize))),
    height: fontSize * (0.9 + Math.max(0, lines.length - 1) * lineHeight),
  };
}

test("multiline entry copy stays inside the circular safe area in square and story", () => {
  const text = "ENTRY\n$50";
  const lineHeight = 0.7;
  const measureLineWidth = (line: string, fontSize: number) =>
    (line === "ENTRY" ? 2.8 : 1.8) * fontSize;

  for (const sample of [
    { format: "square", diameterPx: 56 },
    { format: "story", diameterPx: 72 },
  ] as const) {
    const fontSize = fitCocoPriceBadgeFontSize({
      diameterPx: sample.diameterPx,
      lineHeight,
      measureLineWidth,
      requestedSize: 40,
      text,
    });
    const bounds = measuredBlockBounds(text, fontSize, lineHeight, measureLineWidth);
    const innerDiameter = sample.diameterPx * COCO_PRICE_BADGE_INNER_RATIO;

    assert.ok(
      bounds.width <= innerDiameter + 0.01,
      `${sample.format} entry width should remain inside the safe circle`
    );
    assert.ok(
      bounds.height <= innerDiameter + 0.01,
      `${sample.format} entry height should remain inside the safe circle`
    );
  }
});

test("wide entry copy shrinks more than short entry copy", () => {
  const measureLineWidth = (line: string, fontSize: number) => line.length * 0.58 * fontSize;
  const shared = {
    diameterPx: 56,
    lineHeight: 0.72,
    measureLineWidth,
    requestedSize: 32,
  };
  const shortSize = fitCocoPriceBadgeFontSize({ ...shared, text: "ENTRY\n$5" });
  const wideText = "ENTRY\n$1000000";
  const wideSize = fitCocoPriceBadgeFontSize({ ...shared, text: wideText });
  const wideBounds = measuredBlockBounds(wideText, wideSize, shared.lineHeight, measureLineWidth);
  const innerDiameter = shared.diameterPx * COCO_PRICE_BADGE_INNER_RATIO;

  assert.ok(wideSize < shortSize);
  assert.ok(wideBounds.width <= innerDiameter + 0.01);
  assert.ok(wideBounds.height <= innerDiameter + 0.01);
});

test("badge fitting never enlarges the requested font size", () => {
  for (const text of ["ENTRY\n$50", "", "FREE ENTRY"]) {
    assert.equal(
      fitCocoPriceBadgeFontSize({
        diameterPx: 240,
        requestedSize: 9.25,
        text,
      }),
      9.25
    );
  }
});

test("custom line measurement controls the fitted width", () => {
  const measuredLines: string[] = [];
  const measureLineWidth = (line: string, fontSize: number) => {
    measuredLines.push(line);
    return line === "WIDE" ? fontSize * 4 : fontSize;
  };
  const fitted = fitCocoPriceBadgeFontSize({
    diameterPx: 100,
    lineHeight: 0.8,
    measureLineWidth,
    requestedSize: 40,
    text: "WIDE\n$5",
  });
  const expectedWidthCap = Math.floor(
    ((100 * COCO_PRICE_BADGE_INNER_RATIO) / 4) * 0.94 * 100
  ) / 100;

  assert.deepEqual(measuredLines, ["WIDE", "$5"]);
  assert.equal(fitted, expectedWidthCap);
});
