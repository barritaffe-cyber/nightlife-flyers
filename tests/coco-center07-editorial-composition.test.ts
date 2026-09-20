import assert from "node:assert/strict";
import test from "node:test";

import {
  CENTER07_EDITORIAL_DISABLED_HEADLINE_EFFECTS,
  CENTER07_EDITORIAL_REFERENCE_ID,
  buildCenter07EditorialComposition,
  type Center07EditorialRect,
} from "../components/coco/referenceLayouts/buildCenter07EditorialComposition.ts";
import { CENTER_REFERENCE_LAYOUTS } from "../components/coco/referenceLayouts/centerReferenceLayouts.ts";

const area = (rect: Center07EditorialRect) => rect.width * rect.height;

const overlapArea = (left: Center07EditorialRect, right: Center07EditorialRect) => {
  const width = Math.max(
    0,
    Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x)
  );
  const height = Math.max(
    0,
    Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y)
  );
  return width * height;
};

const assertRectInBounds = (rect: Center07EditorialRect, label: string) => {
  assert.ok(rect.x >= 0, `${label} x must be in bounds`);
  assert.ok(rect.y >= 0, `${label} y must be in bounds`);
  assert.ok(rect.width > 0, `${label} width must be positive`);
  assert.ok(rect.height > 0, `${label} height must be positive`);
  assert.ok(rect.x + rect.width <= 100, `${label} must fit horizontally`);
  assert.ok(rect.y + rect.height <= 100, `${label} must fit vertically`);
};

test("center07 editorial composition remains traceable to the measured reference", () => {
  const source = CENTER_REFERENCE_LAYOUTS.find(
    (layout) => layout.id === CENTER07_EDITORIAL_REFERENCE_ID
  );
  assert.ok(source);

  const composition = buildCenter07EditorialComposition("story");
  assert.equal(composition.referenceLayoutId, "center-07-geometric-title");
  assert.equal(composition.measurement.sourceUrl, "/coco-references/center/center07.jpg");
  assert.equal(composition.measurement.sourceAspectRatio, 1199 / 1496);
  assert.deepEqual(composition.measurement.faceAnchor, source.faceAnchor);
  assert.deepEqual(composition.measurement.zones, source.zones);
  assert.deepEqual(composition.measurement.zones.headline, {
    x: 20,
    y: 43,
    width: 60,
    height: 20,
  });
});

test("Square and Story are safe independent compositions of one campaign", () => {
  const square = buildCenter07EditorialComposition("square");
  const story = buildCenter07EditorialComposition("story");

  assert.notDeepEqual(square.zones, story.zones);
  assert.equal(square.patch.format, "square");
  assert.equal(story.patch.format, "story");
  assert.equal(square.patch.cocoSubjectLayoutId, "subject-center");
  assert.equal(story.patch.cocoSubjectLayoutId, "subject-center");
  assert.equal(square.patch.cocoCenterLayoutOptionId, "subject-center");
  assert.equal(story.patch.cocoCenterLayoutOptionId, "subject-center");
  assert.equal(square.patch.cocoCenterLayoutVersion, 55);
  assert.equal(story.patch.cocoCenterLayoutVersion, 55);

  for (const composition of [square, story]) {
    assertRectInBounds(composition.faceProtection, `${composition.format}:faceProtection`);
    for (const [role, zone] of Object.entries(composition.zones)) {
      assertRectInBounds(zone, `${composition.format}:${role}`);
      assert.equal(
        overlapArea(zone, composition.faceProtection),
        0,
        `${composition.format}:${role} must not cover the protected face`
      );
    }

    const heroArea = area(composition.zones.headline) + area(composition.zones.headline2);
    assert.ok(heroArea > area(composition.zones.details));
    assert.ok(heroArea > area(composition.zones.details2));
    assert.ok(composition.zones.headline.y >= composition.faceProtection.y + composition.faceProtection.height);
    assert.ok(composition.zones.subtag.y >= composition.zones.headline2.y + composition.zones.headline2.height);
    assert.ok(composition.zones.venue.y > composition.zones.details.y);
  }
});

test("patch geometry is a direct adapter over the semantic editable zones", () => {
  for (const format of ["square", "story"] as const) {
    const { patch, zones } = buildCenter07EditorialComposition(format);

    assert.equal(patch.headX, zones.headline.x + zones.headline.width / 2);
    assert.equal(patch.headY, zones.headline.y);
    assert.equal(patch.textColWidth, zones.headline.width);
    assert.equal(patch.head2X, zones.headline2.x + zones.headline2.width / 2);
    assert.equal(patch.head2Y, zones.headline2.y);
    assert.equal(patch.head2ColWidth, zones.headline2.width);
    assert.equal(patch.presenterX, zones.presenter.x + zones.presenter.width / 2);
    assert.equal(patch.presenterY, zones.presenter.y);
    assert.equal(patch.presenterWidth, zones.presenter.width);
    assert.equal(patch.dateX, zones.date.x);
    assert.equal(patch.dateY, zones.date.y);
    assert.equal(patch.detailsX, zones.details.x);
    assert.equal(patch.detailsY, zones.details.y);
    assert.equal(patch.details2X, zones.details2.x + zones.details2.width);
    assert.equal(patch.details2Y, zones.details2.y);
    assert.equal(patch.subtagX, zones.subtag.x);
    assert.equal(patch.subtagY, zones.subtag.y);
    assert.equal(patch.venueX, zones.venue.x + zones.venue.width / 2);
    assert.equal(patch.venueY, zones.venue.y);
  }
});

test("both formats share the restrained geometric type and color system", () => {
  const square = buildCenter07EditorialComposition("square").patch;
  const story = buildCenter07EditorialComposition("story").patch;

  for (const patch of [square, story]) {
    assert.equal(patch.headlineFamily, "LEMONMILK-Bold");
    assert.equal(patch.head2Family, "LEMONMILK-Bold");
    assert.equal(patch.presenterFamily, "LEMONMILK-Light");
    assert.equal(patch.dateFamily, "Bebas Neue");
    assert.equal(patch.detailsFamily, "Bebas Neue");
    assert.equal(patch.details2Family, "Bebas Neue");
    assert.equal(patch.subtagFamily, "Bebas Neue");
    assert.equal(patch.venueFamily, "LEMONMILK-Light");
    assert.equal(patch.headColor, "#FFF8F0");
    assert.equal(patch.head2Color, "#FFF8F0");
    assert.equal(patch.subtagTextColor, "#D8B45A");
    assert.equal(patch.subtagAlpha, 1);
    assert.equal(patch.detailsLabel, "");
    assert.equal(patch.djLineupLabel, "");
    assert.equal(patch.pillAlpha, 0);
    assert.equal(patch.contrast, 1.06);
    assert.equal(patch.saturation, 0.82);
    assert.equal(patch.haze, 0);
    assert.equal(patch.grade, 0);
    assert.equal(patch.filmGrade, 0);
  }

  assert.deepEqual(square.palette, story.palette);
  assert.equal(square.headlineFamily, story.headlineFamily);
  assert.equal(square.head2Family, story.head2Family);
  assert.equal(square.bodyColor, story.bodyColor);
});

test("the editorial patch cannot reintroduce badges, QR, rails, or headline decoration", () => {
  for (const format of ["square", "story"] as const) {
    const composition = buildCenter07EditorialComposition(format);
    const { patch } = composition;

    assert.equal(patch.priceEnabled, false);
    assert.equal(patch.complianceEnabled, false);
    assert.equal(patch.qrEnabled, false);
    assert.equal(patch.leftRailEnabled, false);
    assert.equal(patch.rightRailEnabled, false);
    assert.equal(patch.socialHandleEnabled, false);
    assert.equal(patch.cocoSocialHandleEnabled, false);
    assert.equal(patch.textFx.gradient, false);
    assert.equal(patch.textFx.strokeWidth, 0);
    assert.equal(patch.textFx.glow, 0);
    assert.equal(patch.textFx.shadowEnabled, false);
    assert.equal(patch.head2Fx.gradient, false);
    assert.equal(patch.head2Fx.strokeWidth, 0);
    assert.equal(patch.head2Fx.glow, 0);
    assert.equal(patch.head2Fx.shadowEnabled, false);

    for (const field of CENTER07_EDITORIAL_DISABLED_HEADLINE_EFFECTS) {
      assert.equal(patch[field], false, `${format}:${field} must stay disabled`);
    }

    assert.deepEqual(composition.assetPolicy, {
      keepSubject: true,
      keepUserLogo: true,
      autoAddSocials: false,
      autoAddFeatures: false,
      autoAddComplianceRing: false,
      autoAddFooterFlare: false,
    });
  }
});
