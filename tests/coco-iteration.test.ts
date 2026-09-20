import test from "node:test";
import assert from "node:assert/strict";

import { runCocoDesignIteration } from "../components/coco/iteration/index.ts";
import { buildTypographyStackModel } from "../components/coco/typographyStack/buildTypographyStackModel.ts";
import type {
  CocoCompositionSystem,
  CocoTournamentZoneMap,
} from "../components/coco/layoutTournament/types.ts";

const zones: CocoTournamentZoneMap = {
  date: { align: "left", height: 5, width: 25, x: 6, y: 64 },
  headline: { align: "left", height: 20, width: 45, x: 6, y: 15 },
  leftInfo: { align: "left", height: 8, width: 35, x: 6, y: 47 },
  presenter: { align: "left", height: 4, width: 30, x: 6, y: 5 },
  price: { align: "center", height: 10, width: 12, x: 78, y: 7 },
  rightInfo: { align: "left", height: 1, width: 1, x: 6, y: 56 },
  script: { align: "left", height: 6, width: 30, x: 6, y: 37 },
  subject: { align: "center", height: 78, width: 38, x: 60, y: 10 },
  subtag: { align: "left", height: 4, width: 20, x: 6, y: 75 },
  venue: { align: "left", height: 5, width: 35, x: 6, y: 73 },
};

const composition: CocoCompositionSystem = {
  alignment: "left",
  anchorSide: "left",
  blocks: [],
  copyTreatment: {
    date: "metadata",
    details: "primary-meta",
    details2: "merge",
    script: "accent-support",
    venue: "lock-to-stack",
  },
  explanation: "Test left stack composition.",
  gates: {
    detailsMaxHeadlineRatio: 0.3,
    headlineOverBodyMin: 2.6,
    headlineOverScriptMin: 1.9,
    scriptMaxHeadlineRatio: 0.45,
    venueMaxHeadlineRatio: 0.24,
  },
  hierarchy: {
    accentPowerMaxRatio: 0.45,
    bodyPowerMaxRatio: 0.3,
    headlinePowerMin: 90,
    metadataPowerMaxRatio: 0.26,
  },
  layoutId: "subject-right",
  patternId: "left-premium-stack",
  rhythm: {
    accentToMeta: 4,
    dateTimeToVenue: 4,
    headlineToAccent: 2,
    metaToDateTime: 8,
  },
  score: 96,
  textColumn: { align: "left", height: 68, width: 45, x: 6, y: 14 },
};

function buildStack() {
  const model = buildTypographyStackModel({
    composition,
    format: "square",
    minReadableSize: 10,
    styles: {
      accent: { color: "#fff", fontFamily: "Bebas Neue", fontSize: 90 },
      dateTime: { color: "#fff", fontFamily: "Inter", fontSize: 34 },
      headline: { color: "#fff4aa", fontFamily: "Bebas Neue", fontSize: 100 },
      metadata: { color: "#fff", fontFamily: "Inter", fontSize: 44 },
      venue: { color: "#fff", fontFamily: "Inter", fontSize: 30 },
    },
    text: {
      date: "Monday • 4PM-10PM",
      details: "Tropical Rhythms • Cocktails • Afrobeats",
      details2: "Island Energy",
      headline: "Mojito Mondaze",
      script: "Brunch Bliss",
      venue: "Sky Lounge Miami",
    },
  });
  assert.ok(model);
  return model;
}

test("design iteration moves a badge that collides with the headline", () => {
  const stack = buildStack();
  const result = runCocoDesignIteration({
    badgeZone: { align: "center", height: 11, width: 11, x: 8, y: 15 },
    stack,
    subjectZone: zones.subject,
    zones,
  });

  assert.ok(result.badgePatch);
  assert.ok(result.applied.some((entry) => entry.critique.id === "badge-interferes"));
  assert.ok((result.badgePatch?.scale ?? 1) < 1);
  assert.ok((result.debug?.evaluatedCandidates ?? 0) > 1);
});

test("design iteration separates a badge from the presenter strip", () => {
  const stack = buildStack();
  const result = runCocoDesignIteration({
    badgeZone: { align: "center", height: 8, width: 8, x: 12, y: 4 },
    presenterZone: { align: "left", height: 4, width: 34, x: 6, y: 5 },
    stack,
    subjectZone: zones.subject,
    zones,
  });

  assert.ok(result.badgePatch);
  assert.equal(result.applied[0]?.critique.id, "badge-presenter-collision");
  assert.ok(
    (result.badgePatch?.offsetX ?? 0) > 10 || (result.badgePatch?.scale ?? 1) < 0.8
  );
  assert.ok((result.debug?.evaluatedCandidates ?? 0) >= 3);
});

test("design iteration moves a detached stack toward the subject", () => {
  const stack = buildStack();
  const result = runCocoDesignIteration({
    badgeZone: zones.price,
    stack,
    subjectZone: zones.subject,
    zones,
  });

  assert.equal(result.applied[0]?.critique.id, "text-detached-from-image");
  assert.equal(result.applied[0]?.improvement.action, "moveStack");
  assert.ok(result.stack.rect.x > stack.rect.x);
});
