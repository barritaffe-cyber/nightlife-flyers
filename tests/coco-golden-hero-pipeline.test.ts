import assert from "node:assert/strict";
import test from "node:test";

import { buildCocoMoodProfile } from "../components/coco/moodDirector/engine.ts";
import {
  runCocoPipeline,
  type CocoPipelineInput,
} from "../components/coco/pipeline/index.ts";
import { chooseCocoTypography } from "../components/coco/typographyDirector/engine.ts";
import type {
  CocoTournamentRect,
  CocoTournamentZoneMap,
} from "../components/coco/layoutTournament/types.ts";
import { FASHION_CLUB_VERTICAL_RECIPE } from "../lib/recipes/fashionClubVertical.ts";

const rect = (
  x: number,
  y: number,
  width: number,
  height: number
): CocoTournamentRect => ({ x, y, width, height });

const faceZone = rect(67, 14, 22, 24);
const subjectZone = rect(42, 5, 58, 95);
const zones: CocoTournamentZoneMap = {
  presenter: rect(70, 3, 24, 7),
  headline: rect(6, 7, 42, 30),
  script: rect(6, 49, 34, 13),
  date: rect(6, 66, 15, 7),
  leftInfo: rect(25, 72.5, 67, 4),
  subtag: rect(6, 74, 15, 2.5),
  venue: rect(6, 85, 34, 8),
  rightInfo: rect(25, 66, 67, 6),
  price: rect(84, 84, 11, 10),
  subject: subjectZone,
};

const text = {
  headline: "TRIBAL NIGHT",
  script: "Friday",
  presenter: "DTL",
  date: "JULY 25TH",
  details: "A warm, premium nightlife experience",
  details2: "HYPEMAN · VIBE KING – T BRAINS",
  venue: "DOWNTOWN LOUNGE · 47 GRAND AVENUE",
  subtag: "10PM",
  price: "ENTRY · $25",
};

const availableFonts = {
  body: ["LEMONMILK-Regular", "Inter"],
  body2: ["LEMONMILK-Bold", "Inter"],
  headline: ["Anton", "Coolvetica Hv Comp", "Bebas Neue", "Inter"],
  headline2: ["OpenScript", "Good Brush", "Inter"],
  utility: ["LEMONMILK-Bold", "Bebas Neue", "Inter"],
};

const baseMoodProfile = buildCocoMoodProfile({
  event: {
    description: [text.details, text.details2].join(" "),
    subtitle: text.script,
    title: text.headline,
    venue: text.venue,
  },
  nightlifeStyle: "afrobeats",
});

const input: CocoPipelineInput = {
  selectedDirectionId: "golden-hero-editorial",
  sceneInput: {
    eventName: text.headline,
    faceZone,
    format: "square",
    hasSubject: true,
    nightlifeStyle: "afrobeats",
    preferredLayoutId: "subject-right",
    subjectBounds: {
      alpha: { x: 454, y: 54, width: 626, height: 1026 },
      face: { x: 724, y: 151, width: 238, height: 259, confidence: 0.96 },
      height: 1080,
      width: 1080,
    },
    subjectZone,
    text,
  },
  conceptInput: {
    availableFonts,
    baseMoodProfile,
    baseZones: zones,
    chooseEffects: () => ({ preset: "golden-hero-test" }),
    chooseLayout: (picker) => ({
      layoutId: picker.layoutId,
      patternId: picker.direction.id,
      zones,
    }),
    choosePalette: () => ({
      date: "#FFF3D8",
      details: "#FFF3D8",
      details2: "#FFF3D8",
      headline: "#E89300",
      presenter: "#FFF3D8",
      price: "#FFF3D8",
      subheadline: "#FF8B00",
      subtag: "#FFF3D8",
      utility: "#FFF3D8",
      venue: "#FFF3D8",
      palette: {
        accent: "#FF8B00",
        bgFrom: "#050403",
        bgTo: "#130B05",
        neutral: "#FFF3D8",
        primary: "#E89300",
        secondary: "#A95000",
      },
    }),
    chooseTypography: (picker) =>
      chooseCocoTypography({
        availableFonts,
        composition: picker.layout?.composition,
        eventName: picker.eventName,
        format: picker.format,
        layoutId: picker.layoutId,
        moodProfile: picker.moodProfile,
        nightlifeStyle: picker.nightlifeStyle,
        text: picker.text,
        zones: picker.layout?.zones ?? zones,
      }),
    event: {
      description: [text.details, text.details2].join(" "),
      subtitle: text.script,
      title: text.headline,
      venue: text.venue,
    },
    eventName: text.headline,
    faceZone,
    format: "square",
    hasSubject: true,
    nightlifeStyle: "afrobeats",
    preferredLayoutId: "subject-right",
    subjectZone,
    text,
  },
};

test("the removed Golden Hero direction cannot survive pipeline selection", () => {
  const state = runCocoPipeline(input);

  assert.notEqual(state.winner.direction.id, "golden-hero-editorial");
  assert.notEqual(state.creativeDirection?.id, "concept-direction:golden-hero-editorial");
  assert.notEqual(state.creativeBrief.recommendedComposition, "golden-hero-editorial");
  assert.ok(
    !state.renderer.rendererMustObey.includes(
      "selected-direction:golden-hero-editorial"
    )
  );
});

test("the selected Fashion Club direction consumes the canonical hierarchy and rhythm", () => {
  const state = runCocoPipeline({
    ...input,
    selectedDirectionId: "fashion-club-vertical",
    sceneInput: {
      ...input.sceneInput,
      eventName: "FRIDAY FEVER",
      nightlifeStyle: "luxury-club",
      text: { ...input.sceneInput.text, headline: "FRIDAY FEVER" },
    },
    conceptInput: {
      ...input.conceptInput,
      event: {
        ...input.conceptInput.event,
        title: "FRIDAY FEVER",
      },
      eventName: "FRIDAY FEVER",
      nightlifeStyle: "luxury-club",
      text: { ...input.conceptInput.text, headline: "FRIDAY FEVER" },
    },
  });
  const hierarchy = FASHION_CLUB_VERTICAL_RECIPE.runtime.hierarchy;
  const rhythm = FASHION_CLUB_VERTICAL_RECIPE.runtime.rhythm;

  assert.equal(state.creativeDirection?.id, "concept-direction:fashion-club-vertical");
  assert.equal(
    state.creativeDirection?.hierarchy.accentMaxRatio,
    hierarchy.accentPowerMaxRatio
  );
  assert.equal(
    state.creativeDirection?.hierarchy.bodyMaxRatio,
    hierarchy.bodyPowerMaxRatio
  );
  assert.equal(
    state.creativeDirection?.hierarchy.headlinePower,
    hierarchy.headlinePowerMin
  );
  assert.equal(
    state.creativeDirection?.hierarchy.headlineMustWinBy,
    1 / Math.max(
      hierarchy.accentPowerMaxRatio,
      hierarchy.bodyPowerMaxRatio,
      hierarchy.metadataPowerMaxRatio
    )
  );
  assert.deepEqual(state.creativeBrief.rhythm, {
    accentToMeta: rhythm.accentToMeta,
    dateTimeToVenue: rhythm.dateTimeToVenue,
    headlineToAccent: rhythm.headlineToAccent,
    metaToDateTime: rhythm.metaToDateTime,
  });
});
