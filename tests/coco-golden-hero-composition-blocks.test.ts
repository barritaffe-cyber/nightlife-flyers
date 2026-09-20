import assert from "node:assert/strict";
import test from "node:test";

import { buildBaseComposition } from "../coco-composition-director/blockBuilder.ts";
import { directCocoComposition } from "../coco-composition-director/director.ts";
import { FAMILY_PRESETS } from "../coco-composition-director/families.ts";
import { MOJITO_COMPOSITION_FIXTURE } from "../coco-composition-director/fixtures.ts";
import { buildCocoCompositionSystemFromLayout } from "../components/coco/compositionDirector.ts";
import {
  intersectionArea,
  overlapRatio,
} from "../coco-composition-director/geometry.ts";
import type {
  CompositionDirectorInput,
  PercentRect,
} from "../coco-composition-director/types.ts";

const FACE_RECT: PercentRect = { x: 67, y: 14, width: 22, height: 24 };

const buildInput = (format: "square" | "story"): CompositionDirectorInput => {
  const input = structuredClone(MOJITO_COMPOSITION_FIXTURE);
  const subjectRect =
    format === "story"
      ? { x: 40, y: 3, width: 60, height: 97 }
      : { x: 42, y: 5, width: 58, height: 95 };

  input.format = format;
  input.preferredFamily = "golden-hero-editorial";
  input.creativeDirection.composition.family = "golden-hero-editorial";
  input.creativeDirection.composition.typeField = "left";
  input.creativeDirection.composition.alignment = "left";
  input.creativeDirection.composition.stackRect =
    format === "story"
      ? FAMILY_PRESETS["golden-hero-editorial"].storyColumn
      : FAMILY_PRESETS["golden-hero-editorial"].squareColumn;
  input.creativeDirection.composition.overlapPolicy = "none";
  input.creativeDirection.composition.oneColumn = false;
  input.creativeDirection.signatureMove.move = "editorial-spacing";
  input.creativeDirection.signatureMove.target = "full-stack";
  input.scene.creativeDecisions.story = "afrobeats-sunset";
  input.scene.creativeDecisions.composition.typeField = "left";
  input.scene.creativeDecisions.composition.stackAlignment = "left";
  input.scene.creativeDecisions.composition.stackRect =
    input.creativeDirection.composition.stackRect;
  input.scene.creativeDecisions.composition.preferredPattern =
    "golden-hero-editorial";
  input.text = {
    headline: "TRIBAL NIGHT",
    accent: "Friday",
    presenter: "DTL",
    date: "JULY 25TH",
    time: "10PM",
    details: "A warm, premium nightlife experience",
    details2: "HYPEMAN\nVIBE KING – T BRAINS",
    venue: "DOWNTOWN LOUNGE\n47 GRAND AVENUE",
    subtag: "DOORS OPEN • 10PM",
    footer: "MUSIC POLICY\nAFROBEATS • OPEN FORMAT",
    price: "ENTRY\n$25",
    compliance: "RSVP @DTL_NIGHTS",
  };
  input.subject = {
    rect: subjectRect,
    visibleRect: subjectRect,
    faceRect: FACE_RECT,
    side: "right",
    crop: "three-quarter",
    saliency: 0.95,
    visualMass: 0.9,
  };
  input.scene.protectionZones = [
    {
      target: "face",
      rect: FACE_RECT,
      importance: "critical",
      allowOverlapRatio: 0,
    },
  ];
  input.negativeSpace = [
    { id: "left", rect: { x: 3, y: 7, width: 57, height: 88 }, score: 0.95 },
  ];
  input.busyZones = [{ x: 62, y: 8, width: 34, height: 80 }];
  input.darkZones = [{ x: 3, y: 7, width: 57, height: 88 }];
  return input;
};

const build = (format: "square" | "story") => {
  const input = buildInput(format);
  const composition = buildBaseComposition(
    input,
    "golden-hero-editorial",
    `golden-hero-${format}`
  );
  return {
    composition,
    input,
    rects: Object.fromEntries(
      composition.blocks.map((block) => [block.id, block.rect])
    ),
  };
};

test("Golden Hero Square uses the authored title, script, support, and footer geometry", () => {
  const { composition, rects } = build("square");

  assert.equal(composition.alignment, "left");
  assert.equal(composition.typeField, "left");
  assert.deepEqual(
    composition.textColumn,
    FAMILY_PRESETS["golden-hero-editorial"].squareColumn
  );
  assert.deepEqual(rects["block-presenter"], { x: 70, y: 3, width: 24, height: 7 });
  assert.deepEqual(rects["block-identity"], { x: 6, y: 7, width: 42, height: 30 });
  assert.deepEqual(rects["block-accent"], { x: 6, y: 49, width: 34, height: 13 });
  assert.deepEqual(rects["block-dateTime"], { x: 6, y: 66, width: 15, height: 7 });
  assert.deepEqual(rects["block-time"], { x: 6, y: 74, width: 15, height: 2.5 });
  assert.deepEqual(rects["block-primaryMeta"], { x: 25, y: 66, width: 67, height: 6 });
  assert.deepEqual(rects["block-optionalDetails"], { x: 25, y: 72.5, width: 67, height: 4 });
  assert.deepEqual(rects["block-venue"], { x: 6, y: 85, width: 34, height: 8 });
  assert.deepEqual(rects["block-musicPolicy"], { x: 50, y: 85, width: 27, height: 8 });
  assert.deepEqual(rects["block-badge"], { x: 84, y: 84, width: 11, height: 10 });
  assert.deepEqual(rects["block-rsvp"], { x: 6, y: 94, width: 88, height: 3 });
  assert.equal(
    composition.blocks.find((block) => block.id === "block-optionalDetails")?.hidden,
    true
  );
});

test("Golden Hero Story preserves the campaign grammar with format-specific spacing", () => {
  const { composition, rects } = build("story");

  assert.equal(composition.alignment, "left");
  assert.equal(composition.typeField, "left");
  assert.deepEqual(
    composition.textColumn,
    FAMILY_PRESETS["golden-hero-editorial"].storyColumn
  );
  assert.deepEqual(rects["block-presenter"], { x: 70, y: 3, width: 24, height: 7 });
  assert.deepEqual(rects["block-identity"], { x: 6, y: 6, width: 42, height: 29 });
  assert.deepEqual(rects["block-accent"], { x: 6, y: 36.5, width: 36, height: 11 });
  assert.deepEqual(rects["block-dateTime"], { x: 6, y: 56.5, width: 15, height: 7 });
  assert.deepEqual(rects["block-time"], { x: 6, y: 64, width: 15, height: 2.5 });
  assert.deepEqual(rects["block-primaryMeta"], { x: 25, y: 57, width: 67, height: 7.5 });
  assert.deepEqual(rects["block-optionalDetails"], { x: 25, y: 67.5, width: 67, height: 5 });
  assert.deepEqual(rects["block-venue"], { x: 6, y: 85, width: 34, height: 8 });
  assert.deepEqual(rects["block-musicPolicy"], { x: 50, y: 85, width: 27, height: 8 });
  assert.deepEqual(rects["block-badge"], { x: 84, y: 84, width: 11, height: 10 });
  assert.deepEqual(rects["block-rsvp"], { x: 6, y: 94, width: 88, height: 3 });
  assert.equal(
    composition.blocks.find((block) => block.id === "block-optionalDetails")?.hidden,
    true
  );
});

test("Golden Hero roles stay pinned, editable by source, and clear of the face", () => {
  for (const format of ["square", "story"] as const) {
    const { composition } = build(format);
    const visible = composition.blocks.filter((block) => !block.hidden);
    const identity = visible.find((block) => block.id === "block-identity");
    const accent = visible.find((block) => block.id === "block-accent");

    assert.ok(identity);
    assert.equal(identity.role, "identity");
    assert.equal(identity.source, "headline");
    assert.ok((identity.minVisualPower ?? 0) >= 96);
    assert.ok(accent);
    assert.equal(accent.role, "accent");
    assert.equal(accent.source, "accent");
    assert.ok(composition.blocks.every((block) => block.pinned === true));
    assert.deepEqual(
      composition.blocks.map((block) => block.source),
      [
        "presenter",
        "headline",
        "accent",
        "date",
        "time",
        "details2",
        "details",
        "venue",
        "footer",
        "price",
        "compliance",
      ]
    );

    for (const block of visible) {
      assert.equal(
        intersectionArea(block.rect, FACE_RECT),
        0,
        `${format} ${block.id} overlaps the protected face`
      );
    }

    for (let first = 0; first < visible.length; first += 1) {
      for (let second = first + 1; second < visible.length; second += 1) {
        const left = visible[first];
        const right = visible[second];
        const overlap = overlapRatio(left.rect, right.rect, "min");
        assert.equal(
          overlap,
          0,
          `${format} has unintended overlap between ${left.id} and ${right.id}`
        );
      }
    }
  }
});

for (const format of ["square", "story"] as const) {
  test(`the selected Golden Hero family survives the ${format} composition tournament`, () => {
    const result = directCocoComposition(buildInput(format));
    assert.equal(result.winner.family, "golden-hero-editorial");
    assert.equal(result.winner.score.hasCriticalProtectionViolation, false);
    assert.equal(result.winner.score.hasBlockOverlap, false);
  });
}

test("the app composition contract exposes the same Golden Hero v2 renderer zones", () => {
  for (const format of ["square", "story"] as const) {
    const input = buildInput(format);
    const fallback = {
      date: { x: 0, y: 0, width: 1, height: 1 },
      headline: { x: 0, y: 0, width: 1, height: 1 },
      leftInfo: { x: 0, y: 0, width: 1, height: 1 },
      presenter: { x: 0, y: 0, width: 1, height: 1 },
      price: { x: 0, y: 0, width: 1, height: 1 },
      rightInfo: { x: 0, y: 0, width: 1, height: 1 },
      script: { x: 0, y: 0, width: 1, height: 1 },
      subject: input.subject?.rect ?? { x: 42, y: 5, width: 58, height: 95 },
      subtag: { x: 0, y: 0, width: 1, height: 1 },
      venue: { x: 0, y: 0, width: 1, height: 1 },
    };
    const composition = buildCocoCompositionSystemFromLayout({
      brief: {
        counterweight: { side: "left" },
        hierarchy: { headline: 100 },
        recommendedComposition: "golden-hero-editorial",
        rhythm: {
          accentToMeta: 4,
          dateTimeToVenue: 3,
          headlineToAccent: 1,
          metaToDateTime: 3,
        },
        scene: { subjectPosition: "right" },
        typographyColumn: { side: "left" },
      } as any,
      faceZone: FACE_RECT,
      format,
      hasSubject: true,
      layoutId: "subject-right",
      subjectZone: fallback.subject,
      text: {
        date: input.text.date,
        details: input.text.details,
        details2: input.text.details2,
        headline: input.text.headline,
        presenter: input.text.presenter,
        price: input.text.price,
        script: input.text.accent,
        subtag: input.text.time,
        venue: input.text.venue,
      },
      zones: fallback,
    });

    assert.deepEqual(composition.rendererZones?.headline, {
      align: "left",
      x: 6,
      y: format === "story" ? 6 : 7,
      width: 42,
      height: format === "story" ? 29 : 30,
    });
    assert.deepEqual(composition.rendererZones?.script, {
      align: "left",
      x: 6,
      y: format === "story" ? 36.5 : 49,
      width: format === "story" ? 36 : 34,
      height: format === "story" ? 11 : 13,
    });
    assert.deepEqual(composition.rendererZones?.rightInfo, {
      align: "left",
      x: 25,
      y: format === "story" ? 57 : 66,
      width: 67,
      height: format === "story" ? 7.5 : 6,
    });
    assert.deepEqual(composition.rendererZones?.presenter, {
      align: "right",
      x: 70,
      y: 3,
      width: 24,
      height: 7,
    });
    assert.deepEqual(composition.rendererZones?.date, {
      align: "left",
      x: 6,
      y: format === "story" ? 56.5 : 66,
      width: 15,
      height: 7,
    });
    assert.deepEqual(composition.rendererZones?.subtag, {
      align: "left",
      x: 6,
      y: format === "story" ? 64 : 74,
      width: 15,
      height: 2.5,
    });
    assert.deepEqual(composition.rendererZones?.leftInfo, {
      align: "left",
      x: 25,
      y: format === "story" ? 67.5 : 72.5,
      width: 67,
      height: format === "story" ? 5 : 4,
    });
    assert.deepEqual(composition.rendererZones?.venue, {
      align: "left",
      x: 6,
      y: 85,
      width: 34,
      height: 8,
    });
    assert.deepEqual(composition.rendererZones?.price, {
      align: "center",
      x: 84,
      y: 84,
      width: 11,
      height: 10,
    });
    assert.equal(composition.rhythm.headlineToAccent, 3);
    assert.equal(
      composition.allBlocks.find((block) => block.source === "script")?.shouldAttachTo,
      undefined
    );
    assert.equal(composition.copyTreatment.details, "hide");
    assert.equal(
      composition.allBlocks.find((block) => block.source === "details")?.hidden,
      true
    );
  }
});
