import test from "node:test";
import assert from "node:assert/strict";

import type { CanvasEnvironmentCell } from "../components/coco/subjectGeometry/buildCanvasEnvironmentMap.ts";
import {
  buildZoneTextPaletteCandidates,
  resolveZoneTextColor,
} from "../components/coco/zoneTextColor.ts";

function cell(input: Partial<CanvasEnvironmentCell> & Pick<CanvasEnvironmentCell, "x" | "y" | "width" | "height" | "luminance">): CanvasEnvironmentCell {
  return {
    column: 0,
    row: 0,
    complexity: 0.08,
    edgeDensity: 0.04,
    negativeSpace: 0.9,
    edgePressure: 0,
    lightTextReadability: 0.8,
    darkTextReadability: 0.8,
    relativeRegion: "open-background",
    ...input,
  };
}

const fullRect = { x: 0, y: 0, width: 100, height: 100 };
const palette = ["#F4EBDD", "#171923", "#24C7E8"];

test("selects a supplied dark fill over a locally light image region", () => {
  const decision = resolveZoneTextColor({
    environmentCells: [cell({ x: 0, y: 0, width: 100, height: 100, luminance: 0.92 })],
    rect: fullRect,
    paletteCandidates: palette,
    currentColor: "#F4EBDD",
    role: "details",
  });

  assert.equal(decision.fill, "#171923");
  assert.equal(decision.tone, "dark");
  assert.equal(decision.needsScrim, false);
  assert.equal(decision.scrimColor, null);
  assert.equal(decision.scrimOpacity, 0);
});

test("derives harmonious light and dark companions when the photo palette is one-sided", () => {
  const candidates = buildZoneTextPaletteCandidates(["#F1B84B", "#F6D98C", "#E97B32"]);
  const luminances = candidates.map((color) => {
    const numeric = color.slice(1).match(/.{2}/g)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
    const linear = numeric.map((value) =>
      value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  });

  assert.ok(Math.min(...luminances) < 0.02);
  assert.ok(Math.max(...luminances) > 0.82);
  assert.ok(candidates.includes("#F1B84B"));
});

test("uses a palette-derived dark companion over a pale warm photo zone", () => {
  const candidates = buildZoneTextPaletteCandidates(["#F1B84B", "#F6D98C", "#E97B32"]);
  const decision = resolveZoneTextColor({
    environmentCells: [cell({ x: 0, y: 0, width: 100, height: 100, luminance: 0.88 })],
    rect: fullRect,
    paletteCandidates: candidates,
    currentColor: "#F6D98C",
    role: "date",
  });

  assert.equal(decision.tone, "dark");
  assert.ok(candidates.includes(decision.fill));
  assert.equal(decision.needsScrim, false);
});

test("selects a supplied light fill over a locally dark image region", () => {
  const decision = resolveZoneTextColor({
    environmentCells: [cell({ x: 0, y: 0, width: 100, height: 100, luminance: 0.06 })],
    rect: fullRect,
    paletteCandidates: palette,
    currentColor: "#24C7E8",
    role: "venue",
  });

  assert.equal(decision.fill, "#F4EBDD");
  assert.equal(decision.tone, "light");
  assert.equal(decision.needsScrim, false);
});

test("samples only the final role footprint instead of the image-wide average", () => {
  const environmentCells = [
    cell({ x: 0, y: 0, width: 70, height: 100, luminance: 0.05 }),
    cell({ x: 70, y: 0, width: 30, height: 100, luminance: 0.95 }),
  ];
  const decision = resolveZoneTextColor({
    environmentCells,
    rect: { x: 72, y: 10, width: 24, height: 80 },
    paletteCandidates: ["#F4EBDD", "#171923"],
    currentColor: "#F4EBDD",
    role: "date",
  });

  assert.equal(decision.fill, "#171923");
  assert.equal(decision.sampledCellCount, 1);
  assert.ok(decision.localLuminance > 0.9);
});

test("local luminance and complexity are weighted by overlap area", () => {
  const decision = resolveZoneTextColor({
    environmentCells: [
      cell({ x: 0, y: 0, width: 75, height: 100, luminance: 0.2, complexity: 0.1 }),
      cell({ x: 75, y: 0, width: 25, height: 100, luminance: 0.8, complexity: 0.9 }),
    ],
    rect: fullRect,
    paletteCandidates: ["#F4EBDD", "#171923"],
    currentColor: "#F4EBDD",
    role: "headline",
  });

  assert.ok(Math.abs(decision.localLuminance - 0.35) < 0.0001);
  assert.ok(Math.abs(decision.localComplexity - 0.3) < 0.0001);
  assert.equal(decision.sampledArea, 10_000);
});

test("mixed light and dark pixels request a restrained scrim when neither fill clears the low-percentile threshold", () => {
  const suppliedColors = ["#FFFFFF", "#000000", "#C9A86A"];
  const decision = resolveZoneTextColor({
    environmentCells: [
      cell({ x: 0, y: 0, width: 50, height: 100, luminance: 0.015, complexity: 0.72, edgeDensity: 0.8 }),
      cell({ x: 50, y: 0, width: 50, height: 100, luminance: 0.985, complexity: 0.72, edgeDensity: 0.8 }),
    ],
    rect: fullRect,
    paletteCandidates: suppliedColors,
    currentColor: "#FFFFFF",
    role: "headline",
  });

  assert.ok(suppliedColors.includes(decision.fill));
  assert.equal(decision.needsScrim, true);
  assert.ok(decision.scrimColor);
  assert.ok(decision.scrimOpacity >= 0.16 && decision.scrimOpacity <= 0.5);
  assert.ok(decision.luminanceRange > 0.9);
  assert.ok(decision.complexityAdjustedContrast < decision.contrastThreshold);
  assert.equal("stroke" in decision, false);
  assert.equal("strokeColor" in decision, false);
  assert.equal("strokeWidth" in decision, false);
});

test("never invents a text accent outside the supplied photo palette", () => {
  const suppliedColors = ["#F2D29B", "#293348", "#B06B45"];
  const decision = resolveZoneTextColor({
    environmentCells: [cell({ x: 0, y: 0, width: 100, height: 100, luminance: 0.55 })],
    rect: fullRect,
    paletteCandidates: suppliedColors,
    currentColor: "#B06B45",
    role: "socialHandle",
  });

  assert.ok(suppliedColors.includes(decision.fill));
});

test("preserves current color when no local environment cells intersect", () => {
  const decision = resolveZoneTextColor({
    environmentCells: [cell({ x: 0, y: 0, width: 10, height: 10, luminance: 0.1 })],
    rect: { x: 50, y: 50, width: 10, height: 10 },
    paletteCandidates: ["#FFFFFF", "#111111"],
    currentColor: "#C9A86A",
    role: "details",
  });

  assert.equal(decision.fill, "#C9A86A");
  assert.equal(decision.sampledCellCount, 0);
  assert.equal(decision.needsScrim, false);
});
