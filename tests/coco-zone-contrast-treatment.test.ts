import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import {
  COCO_ZONE_BLACK_FLARE_SRC,
  COCO_ZONE_CONTRAST_ROLES,
  COCO_ZONE_SUPPORTING_BOX_PADDING_PX,
  padCocoZoneContrastRect,
  resolveCocoZoneContrastTreatment,
  type CocoZoneContrastRole,
} from "../components/coco/zoneContrastTreatment.ts";

const headlineRoles: CocoZoneContrastRole[] = ["headline", "headline2"];
const supportingRoles = COCO_ZONE_CONTRAST_ROLES.filter(
  (role) => !headlineRoles.includes(role)
);

test("headline and subheadline use the black flare, never a box or text stroke", () => {
  for (const role of headlineRoles) {
    assert.deepEqual(resolveCocoZoneContrastTreatment(role), {
      kind: "black-flare",
      assetSrc: COCO_ZONE_BLACK_FLARE_SRC,
      paddingPx: 0,
      textStrokeWidthPx: 0,
    });
  }
  assert.equal(existsSync(`public${COCO_ZONE_BLACK_FLARE_SRC}`), true);
});

test("every supporting role uses a seven-pixel box and no text stroke", () => {
  assert.ok(supportingRoles.length > 0);
  for (const role of supportingRoles) {
    assert.deepEqual(resolveCocoZoneContrastTreatment(role), {
      kind: "supporting-box",
      assetSrc: null,
      paddingPx: COCO_ZONE_SUPPORTING_BOX_PADDING_PX,
      textStrokeWidthPx: 0,
    });
  }
  assert.equal(COCO_ZONE_SUPPORTING_BOX_PADDING_PX, 7);
});

test("seven-pixel supporting padding round-trips in Square and Story coordinates", () => {
  const source = { x: 20, y: 30, width: 40, height: 12 };
  const canvases = [
    { format: "square", width: 540, height: 540 },
    { format: "story", width: 540, height: 960 },
  ] as const;

  for (const canvas of canvases) {
    const padded = padCocoZoneContrastRect(source, "details", canvas);
    const leftPaddingPx = (source.x - padded.x) / 100 * canvas.width;
    const rightPaddingPx = (padded.x + padded.width - source.x - source.width) / 100 * canvas.width;
    const topPaddingPx = (source.y - padded.y) / 100 * canvas.height;
    const bottomPaddingPx = (padded.y + padded.height - source.y - source.height) / 100 * canvas.height;

    assert.ok(Math.abs(leftPaddingPx - 7) < 1e-9, `${canvas.format} left padding`);
    assert.ok(Math.abs(rightPaddingPx - 7) < 1e-9, `${canvas.format} right padding`);
    assert.ok(Math.abs(topPaddingPx - 7) < 1e-9, `${canvas.format} top padding`);
    assert.ok(Math.abs(bottomPaddingPx - 7) < 1e-9, `${canvas.format} bottom padding`);
  }
});

test("headline flare bounds stay organic instead of gaining box padding", () => {
  const source = { x: 12, y: 18, width: 70, height: 28 };
  assert.deepEqual(
    padCocoZoneContrastRect(source, "headline", { width: 1080, height: 1080 }),
    source
  );
  assert.deepEqual(
    padCocoZoneContrastRect(source, "headline2", { width: 1080, height: 1920 }),
    source
  );
});

test("shared treatment geometry is deterministic for preview and export", () => {
  const source = { x: 24, y: 76, width: 52, height: 8 };
  const square = { width: 540, height: 540 };
  const story = { width: 540, height: 960 };

  for (const role of COCO_ZONE_CONTRAST_ROLES) {
    const previewSquare = padCocoZoneContrastRect(source, role, square);
    const exportSquare = padCocoZoneContrastRect(source, role, square);
    const previewStory = padCocoZoneContrastRect(source, role, story);
    const exportStory = padCocoZoneContrastRect(source, role, story);

    assert.deepEqual(exportSquare, previewSquare, `${role} Square parity`);
    assert.deepEqual(exportStory, previewStory, `${role} Story parity`);
    assert.equal(resolveCocoZoneContrastTreatment(role).textStrokeWidthPx, 0);
  }
});
