import test from "node:test";
import assert from "node:assert/strict";

import {
  headlineLineBreakVariants,
  resolveHeadlineLockup,
  type HeadlinePaintBounds,
} from "../components/coco/headlineDirector/resolveHeadlineLockup.ts";

function proportionalMeasure(text: string, fontSize: number): HeadlinePaintBounds {
  const lines = text.split("\n");
  const lineWidths = lines.map((line) =>
    Array.from(line).reduce((width, glyph) => {
      if (glyph === " ") return width + fontSize * 0.3;
      if (/[MW@]/.test(glyph)) return width + fontSize * 0.9;
      if (/[I1]/.test(glyph)) return width + fontSize * 0.32;
      return width + fontSize * 0.6;
    }, 0)
  );
  return {
    width: Math.max(...lineWidths),
    height: fontSize * (1.05 + Math.max(0, lines.length - 1) * 0.92),
    lineWidths,
  };
}

const resolve = (overrides: Partial<Parameters<typeof resolveHeadlineLockup>[0]> = {}) =>
  resolveHeadlineLockup({
    text: "RED VELVET",
    safeZone: { width: 500, height: 120, widthPct: 84 },
    minFontSize: 28,
    maxFontSize: 220,
    measurePaintBounds: proportionalMeasure,
    ...overrides,
  });

test("headline resolver rejects analyzer zones below the 70 percent canvas span", () => {
  assert.equal(
    resolve({ safeZone: { width: 360, height: 180, widthPct: 66 } }),
    null
  );
});

test("a short title remains one line when it is already comfortable in its safe zone", () => {
  const plan = resolve();
  assert.ok(plan);
  assert.equal(plan.text, "RED VELVET");
  assert.equal(plan.lineCount, 1);
  assert.equal(plan.reason, "single-line-fit");
  assert.ok(plan.bounds.width <= 500);
  assert.ok(plan.bounds.height <= 120);
});

test("a long width-limited title splits only when two lines materially increase scale", () => {
  const plan = resolve({
    text: "THE ULTIMATE SUMMER TAKEOVER",
    safeZone: { width: 500, height: 250, widthPct: 78 },
  });
  assert.ok(plan);
  assert.equal(plan.lineCount, 2);
  assert.equal(plan.reason, "split-to-preserve-scale");
  assert.ok(plan.fontSize > 28);
  assert.ok(plan.bounds.width <= 500);
  assert.ok(plan.bounds.height <= 250);
});

test("one-word titles are never split", () => {
  const plan = resolve({
    text: "VIP",
    safeZone: { width: 390, height: 250, widthPct: 78 },
  });
  assert.ok(plan);
  assert.equal(plan.text, "VIP");
  assert.equal(plan.lineCount, 1);
});

test("an explicit authored headline break is preserved exactly", () => {
  const plan = resolve({ text: "RED\nVELVET" });
  assert.ok(plan);
  assert.equal(plan.text, "RED\nVELVET");
  assert.equal(plan.reason, "explicit-break");
});

test("candidate generation offers one line first and only two-line word boundaries", () => {
  const variants = headlineLineBreakVariants("ULTIMATE SUMMER TAKEOVER");
  assert.equal(variants[0], "ULTIMATE SUMMER TAKEOVER");
  assert.deepEqual(variants.slice(1), [
    "ULTIMATE\nSUMMER TAKEOVER",
    "ULTIMATE SUMMER\nTAKEOVER",
  ]);
  assert.ok(variants.every((variant) => variant.split("\n").length <= 2));
});
