import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import type { CocoGeneratedCopy } from "../lib/coco/copy.ts";
import type { CocoSubjectDecision } from "../lib/coco/subjectAuthority.ts";
import {
  COCO_PORTABLE_RECIPE_PROJECT_URLS,
  isCocoPortableRecipeId,
  materializeCocoPortableRecipeTemplate,
  materializeCocoPortableRecipeVariant,
  replaceCocoRecipeSubjectInVariant,
  type CocoPortableRecipeComposer,
  type CocoPortableRecipeId,
  type CocoPortableRecipeProject,
} from "../lib/coco/portableRecipeRuntime.ts";
import {
  getMaterializedCocoVisualRecipe,
  getVisualRecipe,
} from "../lib/visualRecipes.ts";

const FORMATS = ["square", "story"] as const;

const SUBJECT_URL = "data:image/png;base64,dGVzdC1zdWJqZWN0";
const SUBJECT_SOURCE_URL = "data:image/jpeg;base64,dGVzdC1zb3VyY2U=";
const SUBJECT_BOUNDS = {
  width: 640,
  height: 960,
  alpha: { x: 40, y: 30, width: 540, height: 880 },
  core: { x: 90, y: 75, width: 430, height: 810 },
};

const GENERATED_COPY: CocoGeneratedCopy = {
  presenter: "AI Presenter",
  headline: "AI Headline",
  subheadline: "AI Subheadline",
  details: "All Night Energy",
  details2: "Second Detail",
  venue: "AI Venue",
  date: "AI Date",
  price: "50",
  socials: "AI Social",
  subtag: "AI Tag",
  compliance: "AI Compliance",
  djLineup: "AI DJ",
  musicPolicy: "House",
  rsvpContact: "AI Contact",
  addons: "AI Addons",
};

const EVENT_BRIEF: CocoPortableRecipeComposer["eventBrief"] = {
  description: "A luminous party.",
  subtitle: "in the",
  presenterName: "Nova House Presents",
  date: "July 18, 2026",
  startTime: "9:30 PM",
  venueName: "Skyline Hall",
  address: "12 Aurora Avenue",
  djs: "Sounds By DJ Luna × DJ Echo",
  hosts: "Hype By MC Vega",
  performers: "",
  additionalActs: "",
  eventDetails: "Laser tunnel",
  dressCode: "Midnight chic",
  experienceFeatures: ["Photo wall"],
  mainPromotion: "Birthday packages",
  bottleSpecials: "Two-for-one bottles",
  drinkSpecials: "",
  foodSpecials: "",
  hookahSpecials: "",
  additionalOffers: "VIP tables",
  entryFee: "50",
  ageRequirement: "21+",
  responsibleDrinking: "Drink Responsibly",
  rsvpContact: "+1 212 555 0199",
  bookingContact: "",
  socials: "@NovaHouse",
};

test("Baddies accepts natural date input and preserves its three-line date lockup", () => {
  for (const input of ["December 1, 2026", "December 1,2026", "Dec 1 2026"]) {
    const variant = materializeCocoPortableRecipeVariant(
      "baddies-n-bundles",
      { cocoVisualRecipeId: "baddies-n-bundles" },
      {
        eventName: "Baddies N Bundles",
        eventBrief: { date: input },
      },
    );

    assert.equal(variant.date, "TUESDAY\n1\nDEC", input);
    assert.equal(variant.cocoEventBrief.date, input, "the editable field should retain natural input");
  }
});

type RecipeCase = {
  eventName: string;
  expectedFields: Readonly<Record<string, string>>;
  id: CocoPortableRecipeId;
  sourceHash: string;
  usesSubject?: boolean;
};

const RECIPE_CASES: readonly RecipeCase[] = [
  {
    id: "black-gold-party",
    eventName: "Black Gold Party",
    sourceHash: "e59b82119ff615a6f9ba4f6934087835c35f6d2afd41df141c9e29e362ca0f50",
    expectedFields: {
      presenter: "Nova House Presents",
      headline: "Black",
      head2line: "Gold",
      subtag: "Party",
      date: "JUL\n18",
      venue: "Skyline Hall",
      details2: "DJ Luna × DJ Echo",
      time: "Starts At 9:30 PM",
      details: "Laser tunnel",
      price: "Entry $50",
    },
  },
  {
    id: "neon-night-shift",
    eventName: "Electric After Hours",
    sourceHash: "e2837e8455345939c589c163ed169213a09a46a3e3982136979fd1edb3c2c5a1",
    expectedFields: {
      headline: "Electric After",
      head2line: "Hours",
      details: "All Night Energy",
      details2: "DJ Luna × DJ Echo",
      date: "SAT\nJUL\n18",
      timeLabel: "DOORS OPEN",
      time: "9:30 PM",
      complianceLabel: "ID REQUIRED",
      compliance: "21+",
      rightRailLabel: "SPECIAL",
      rightRail: "Birthday packages\nTwo-for-one bottles\nVIP tables",
      leftRailLabel: "VIP TABLES & INFO",
      leftRail: "+1 212 555 0199",
      venue: "Skyline Hall • 12 Aurora Avenue",
      subtag: "Midnight chic",
    },
  },
  {
    id: "glow-in-the-dark",
    eventName: "Glow in the Dark",
    sourceHash: "762588dc2998d526ddc436be53614f59739139df0797a77822a0275493ef89af",
    expectedFields: {
      presenter: "Nova House Presents",
      headline: "Glow",
      details: "in the",
      head2line: "Dark",
      date: "JUL\n18",
      time: "09:30\nPM",
      subtag: "SATURDAY",
      details2: "DJ Luna × DJ Echo",
      venue: "Skyline Hall",
      rightRail: "Laser tunnel\nPhoto wall\nMidnight chic\nAll Night Energy",
      venueAddress: "12 Aurora Avenue",
      leftRailLabel: "R.S.V.P",
      leftRail: "+1 212 555 0199",
      price: "$50",
    },
  },
  {
    id: "punta-cana-sundays",
    eventName: "Punta Sol Sundays",
    sourceHash: "31b04bc5f2ea003d03668373a0765821f51ba4b3e98aae96ba5916cbb88c4680",
    expectedFields: {
      headline: "Punta",
      head2line: "Sol",
      details: "Sundays",
      presenter: "Nova House Presents",
      date: "18\nJUL",
      leftRail: "Hosted By MC Vega",
      cocoSocialHandle: "@NovaHouse",
      details2: "DJ Luna × DJ Echo",
      venue: "Skyline Hall",
      rightRail: "Midnight chic\nLaser tunnel\nBirthday packages\nTwo-for-one bottles",
      venueAddress: "12 Aurora Avenue • +1 212 555 0199",
      compliance: "21+",
    },
  },
  {
    id: "baddies-n-bundles",
    eventName: "Baddies N Braids",
    sourceHash: "e844a26b68859728a82672020bf958081d64781bcb60958b531610dd62ddf695",
    expectedFields: {
      presenter: "Nova House Presents",
      headline: "Baddies\nBraids",
      head2line: "N",
      date: "SATURDAY\n18\nJUL",
      time: "Doors Open\n9:30PM",
      details: "MC Vega",
      details2: "DJ Luna × DJ Echo",
      venue: "Skyline Hall",
      venueAddress: "12 Aurora Avenue",
      leftRailLabel: "For Info & Reservations:",
      leftRail: "+1 212 555 0199",
      rightRail: "Drink Responsibly",
      subtag: "21+",
    },
  },
  {
    id: "city-nights",
    eventName: "City Nights",
    sourceHash: "1535ea7f8934788b2da4be666369c2889d47d6d7efc09872806f93a1b0162c73",
    usesSubject: false,
    expectedFields: {
      presenter: "Nova House Presents",
      headline: "City",
      head2line: "Nights",
      date: "SATURDAY\n18\nJUL",
      time: "Doors\nOpen\n9:30PM",
      details: "Birthday packages",
      details2: "DJ Luna × DJ Echo",
      djLineupLabel: "Music By",
      rightRail: "House",
      leftRailLabel: "Tickets & Tables:",
      leftRail: "+1 212 555 0199",
      venue: "Skyline Hall",
      venueAddress: "12 Aurora Avenue",
      subtag: "21+",
    },
  },
];

type RuntimeVariant = Record<string, any>;
type RuntimeTemplate = Record<string, any> & {
  formats: Record<string, RuntimeVariant>;
};

function projectSessions(project: CocoPortableRecipeProject) {
  const session = (project.state ?? project).session;
  assert.ok(session?.square, "portable project needs an authored Square session");
  assert.ok(session.story, "portable project needs an authored Story session");
  return session as { square: RuntimeVariant; story: RuntimeVariant };
}

async function readProject(recipeId: CocoPortableRecipeId) {
  const source = await readFile(
    new URL(`../public/generated-flyers/${recipeId}.nflyer`, import.meta.url),
    "utf8",
  );
  return JSON.parse(source) as CocoPortableRecipeProject;
}

function isSubjectAsset(asset: RuntimeVariant) {
  return (
    asset.cocoCompiledObjectId === "subject" ||
    asset.cocoAssetRole === "subject" ||
    (asset.cocoCompiledObjectId == null &&
      asset.cocoAssetRole == null &&
      asset.isExtracted === true)
  );
}

function expectedPatchedAssets(sourceAssets: RuntimeVariant[]) {
  return sourceAssets.map((asset) =>
    isSubjectAsset(asset)
      ? {
          ...asset,
          cocoSubjectBounds: SUBJECT_BOUNDS,
          isExtracted: true,
          isSticker: false,
          label: "Subject",
          locked: false,
          url: SUBJECT_URL,
        }
      : asset,
  );
}

function assertSubjectPatched(
  source: RuntimeVariant,
  target: RuntimeVariant,
  recipeId: CocoPortableRecipeId,
  format: (typeof FORMATS)[number],
) {
  const sourceAssets = source.emojiList as RuntimeVariant[];
  assert.ok(Array.isArray(sourceAssets), `${recipeId} ${format} needs authored assets`);
  assert.deepEqual(
    sourceAssets,
    source.portraits,
    `${recipeId} ${format} must begin with one canonical authored stack`,
  );

  const expectedAssets = expectedPatchedAssets(sourceAssets);
  assert.deepEqual(target.emojiList, expectedAssets);
  assert.deepEqual(target.portraits, expectedAssets);
  assert.notStrictEqual(target.emojiList, sourceAssets);
  assert.notStrictEqual(target.portraits, source.portraits);
  assert.notStrictEqual(target.emojiList, target.portraits);

  const sourceSubjects = sourceAssets.filter(isSubjectAsset);
  const emojiSubjects = (target.emojiList as RuntimeVariant[]).filter(isSubjectAsset);
  const portraitSubjects = (target.portraits as RuntimeVariant[]).filter(isSubjectAsset);
  assert.equal(sourceSubjects.length, 1, `${recipeId} ${format} needs one authored subject`);
  assert.equal(emojiSubjects.length, 1, `${recipeId} ${format} needs one runtime emoji subject`);
  assert.equal(portraitSubjects.length, 1, `${recipeId} ${format} needs one runtime portrait subject`);

  for (const subject of [...emojiSubjects, ...portraitSubjects]) {
    assert.equal(subject.url, SUBJECT_URL);
    assert.deepEqual(subject.cocoSubjectBounds, SUBJECT_BOUNDS);
    assert.notStrictEqual(subject.cocoSubjectBounds, SUBJECT_BOUNDS);
    assert.equal(subject.id, sourceSubjects[0].id);
    assert.equal(subject.cocoCompiledObjectId, sourceSubjects[0].cocoCompiledObjectId);
    assert.equal(subject.cocoAssetRole, sourceSubjects[0].cocoAssetRole);
    assert.equal(subject.x, sourceSubjects[0].x);
    assert.equal(subject.y, sourceSubjects[0].y);
    assert.equal(subject.scale, sourceSubjects[0].scale);
    assert.equal(subject.rotation, sourceSubjects[0].rotation);
    assert.equal(subject.layerOffset, sourceSubjects[0].layerOffset);
  }
}

function assertCompilerAndProvenancePreserved(
  source: RuntimeVariant,
  target: RuntimeVariant,
  sourceHash: string,
) {
  assert.deepEqual(target.cocoCompositionSystem, source.cocoCompositionSystem);
  assert.notStrictEqual(target.cocoCompositionSystem, source.cocoCompositionSystem);
  assert.deepEqual(target.cocoCssCompiler, source.cocoCssCompiler);
  assert.notStrictEqual(target.cocoCssCompiler, source.cocoCssCompiler);
  assert.equal(source.cocoCssCompiler.sourceHash, sourceHash);
  assert.equal(target.cocoCssCompiler.sourceHash, sourceHash);

  const sourceDocument = source.cocoCompositionSystem?.compiledDocument;
  const targetDocument = target.cocoCompositionSystem?.compiledDocument;
  assert.deepEqual(targetDocument, sourceDocument);
  if (sourceDocument) {
    assert.notStrictEqual(targetDocument, sourceDocument);
    assert.equal(targetDocument.provenance.sourceHash, sourceHash);
  }

  const sourceIr = source.cocoCssCompiler?.ir;
  const targetIr = target.cocoCssCompiler?.ir;
  assert.deepEqual(targetIr, sourceIr);
  if (sourceIr) {
    assert.notStrictEqual(targetIr, sourceIr);
    assert.equal(targetIr.provenance.sourceHash, sourceHash);
  }

  assert.deepEqual(target.cocoCompositionMap, source.cocoCompositionMap);
  assert.deepEqual(target.cocoRecipeAuthority, source.cocoRecipeAuthority);
}

test("portable recipe registry and URL guard expose every authored master", () => {
  assert.deepEqual(Object.keys(COCO_PORTABLE_RECIPE_PROJECT_URLS), [
    "brunch-saturday",
    "brunch-vibes",
    "black-gold-party",
    "neon-night-shift",
    "glow-in-the-dark",
    "punta-cana-sundays",
    "baddies-n-bundles",
    "city-nights",
    "grey-rave-festival",
    "dodge-night-rides",
  ]);

  for (const { id } of RECIPE_CASES) {
    assert.equal(isCocoPortableRecipeId(id), true);
    assert.equal(
      COCO_PORTABLE_RECIPE_PROJECT_URLS[id],
      `/generated-flyers/${id}.nflyer`,
    );
  }
  assert.equal(isCocoPortableRecipeId("unknown-recipe"), false);
  assert.equal(isCocoPortableRecipeId(null), false);
});

for (const recipeCase of RECIPE_CASES) {
  test(`${recipeCase.id} rebinds both formats without weakening recipe authority`, async () => {
    const project = await readProject(recipeCase.id);
    const sourceSnapshot = structuredClone(project);
    const sourceSessions = projectSessions(project);
    const recipe = getVisualRecipe(recipeCase.id);
    assert.ok(recipe, `${recipeCase.id} must be registered`);

    const composer: CocoPortableRecipeComposer = {
      eventName: recipeCase.eventName,
      eventBrief: structuredClone(EVENT_BRIEF),
      copy: { ...GENERATED_COPY },
      selectedConceptDirectionId: recipeCase.id,
      styleDecision: { style: "nightlife" },
      subjectBounds: structuredClone(SUBJECT_BOUNDS),
      subjectDataUrl: SUBJECT_URL,
    };
    const baseTemplate: RuntimeTemplate = {
      id: "__seed__",
      label: "Seed",
      tags: ["Portable", "Coco"],
      formats: { seed: { preserved: true } },
      registryMarker: { preserved: true },
    };

    const template = materializeCocoPortableRecipeTemplate({
      baseTemplate,
      composer,
      project,
      recipeId: recipeCase.id,
    });

    assert.equal(template.id, `__coco_composer__${recipeCase.id}`);
    assert.equal(template.label, recipe.name);
    assert.deepEqual(template.tags, ["Portable", "Coco", recipeCase.id]);
    assert.deepEqual(template.formats.seed, { preserved: true });
    assert.deepEqual(template.registryMarker, { preserved: true });

    for (const format of FORMATS) {
      const source = sourceSessions[format];
      const target = template.formats[format];

      assert.ok(target, `${recipeCase.id} must materialize ${format}`);
      assert.equal(target.format, format);
      for (const [field, value] of Object.entries(recipeCase.expectedFields)) {
        assert.equal(target[field], value, `${recipeCase.id} ${format} must rebind ${field}`);
      }
      if (recipeCase.id === "baddies-n-bundles") {
        assert.equal(target.detailsLabel, source.detailsLabel, `${format} must retain its authored host label`);
        assert.equal(target.djLineupLabel, source.djLineupLabel, `${format} must retain its authored music label`);
      }

      assert.equal(target.cocoEventName, recipeCase.eventName);
      assert.equal(target.cocoCampaignDirectionId, recipeCase.id);
      assert.deepEqual(target.cocoEventBrief, composer.eventBrief);
      assert.notStrictEqual(target.cocoEventBrief, composer.eventBrief);
      assert.equal(target.cocoGeneratedCopy.presenter, "Nova House Presents");
      assert.equal(target.cocoGeneratedCopy.venue, "Skyline Hall\n12 Aurora Avenue");
      assert.equal(target.cocoGeneratedCopy.date, "July 18, 2026\n9:30 PM");
      assert.equal(target.cocoGeneratedCopy.price, "50");
      assert.equal(target.cocoGeneratedCopy.socials, "@NovaHouse");
      assert.equal(target.cocoGeneratedCopy.compliance, "21+");
      assert.equal(target.cocoGeneratedCopy.djLineup, "Sounds By DJ Luna × DJ Echo");
      assert.equal(target.cocoGeneratedCopy.rsvpContact, "+1 212 555 0199");
      assert.notStrictEqual(target.cocoGeneratedCopy, source.cocoGeneratedCopy);

      assert.equal(target.cocoVisualRecipeId, recipeCase.id);
      assert.equal(target.cocoVisualRecipeVersion, recipe.version);
      assert.equal(target.cocoVisualRecipeMaterializedVersion, recipe.version);
      assert.strictEqual(getMaterializedCocoVisualRecipe(target), recipe);
      assert.equal(target.head2Enabled, true);
      assert.equal(target.headline2Enabled, true);
      if (Object.prototype.hasOwnProperty.call(recipeCase.expectedFields, "compliance")) {
        assert.equal(target.complianceEnabled, true);
      }
      for (const key of [
        "cocoCampaignId",
        "cocoVisualRecipeSummary",
        "cocoSubjectLayoutId",
        "cocoCenterLayoutOptionId",
      ]) {
        assert.deepEqual(target[key], source[key], `${recipeCase.id} ${format} changed ${key}`);
      }

      assertCompilerAndProvenancePreserved(source, target, recipeCase.sourceHash);
      if (recipeCase.usesSubject !== false) {
        assertSubjectPatched(source, target, recipeCase.id, format);
      } else {
        assert.equal(
          (target.portraits as RuntimeVariant[]).filter(isSubjectAsset).length,
          0,
          `${recipeCase.id} ${format} must remain subject-free`,
        );
      }
    }

    assert.notStrictEqual(template.formats.square, template.formats.story);
    assert.notStrictEqual(
      template.formats.square.cocoCssCompiler,
      template.formats.story.cocoCssCompiler,
    );
    assert.notStrictEqual(
      template.formats.square.cocoEventBrief,
      template.formats.story.cocoEventBrief,
    );
    assert.deepEqual(project, sourceSnapshot, `${recipeCase.id} source project was mutated`);
  });
}

test("optional subject bounds and empty compliance do not leave stale authored state", async () => {
  for (const recipeCase of RECIPE_CASES) {
    const project = await readProject(recipeCase.id);
    const sessions = projectSessions(project);
    const eventBrief = structuredClone(EVENT_BRIEF);
    eventBrief.ageRequirement = "";
    const copy = { ...GENERATED_COPY, compliance: "" };

    for (const format of FORMATS) {
      const source = sessions[format];
      const target = materializeCocoPortableRecipeVariant(recipeCase.id, source, {
        eventName: recipeCase.eventName,
        eventBrief,
        copy,
        subjectDataUrl: SUBJECT_URL,
      });
      const sourceSubject = (source.emojiList as RuntimeVariant[]).find(isSubjectAsset);
      const targetSubject = (target.emojiList as RuntimeVariant[]).find(isSubjectAsset);
      if (recipeCase.usesSubject === false) {
        assert.equal(sourceSubject, undefined);
        assert.equal(targetSubject, undefined);
      } else {
        assert.ok(sourceSubject);
        assert.ok(targetSubject);
        assert.equal(
          Object.prototype.hasOwnProperty.call(targetSubject, "cocoSubjectBounds"),
          Object.prototype.hasOwnProperty.call(sourceSubject, "cocoSubjectBounds"),
          `${recipeCase.id} ${format} must preserve whether authored subject bounds exist`,
        );
        assert.deepEqual(targetSubject.cocoSubjectBounds, sourceSubject.cocoSubjectBounds);
      }

      if (recipeCase.id === "neon-night-shift" || recipeCase.id === "punta-cana-sundays") {
        assert.equal(target.compliance, "");
        assert.equal(target.complianceEnabled, false);
      }
    }
  }
});

test("portable age fields normalize numeric form input to an age badge", async () => {
  for (const recipeId of ["neon-night-shift", "punta-cana-sundays", "baddies-n-bundles", "city-nights"] as const) {
    const project = await readProject(recipeId);
    const source = projectSessions(project).square;
    const eventBrief = structuredClone(EVENT_BRIEF);
    eventBrief.ageRequirement = "21";
    const target = materializeCocoPortableRecipeVariant(recipeId, source, {
      eventName: "Test Event",
      eventBrief,
      copy: { ...GENERATED_COPY },
    });
    assert.equal(
      recipeId === "baddies-n-bundles" || recipeId === "city-nights"
        ? target.subtag
        : target.compliance,
      "21+",
    );
  }
});

test("City Nights ships the corrected versioned canvas geometry in its .nflyer", async () => {
  const project = await readProject("city-nights");
  for (const [format, variant] of Object.entries(projectSessions(project))) {
    assert.equal(variant.cocoVisualRecipeVersion, 3, `${format} recipe version`);
    assert.equal(variant.cocoVisualRecipeMaterializedVersion, 3, `${format} materialized version`);
    assert.ok(variant.headManualPx < 160, `${format} headline must use canvas-relative sizing`);
    const headline = variant.cocoCompositionSystem.compiledDocument.objects.find(
      (object: RuntimeVariant) => object.id === "headline",
    );
    assert.ok(headline, `${format} compiled CITY headline`);
    assert.equal(headline.text, "City");
    assert.equal(headline.paint.backgroundImage, "none");
    assert.equal(headline.paint.backgroundClip, "border-box");
    assert.equal(headline.paint.color, "rgb(246, 242, 239)");
    assert.equal(headline.binding.size, "headManualPx");
    const subHeadline = variant.cocoCompositionSystem.compiledDocument.objects.find(
      (object: RuntimeVariant) => object.id === "headline2",
    );
    assert.equal(subHeadline?.binding.size, "head2SizePx");
    const musicLabel = variant.cocoCompositionSystem.compiledDocument.objects.find(
      (object: RuntimeVariant) => object.id === "music-label",
    );
    assert.equal(musicLabel?.binding.text, "djLineupLabel");
    assert.equal(musicLabel?.binding.size, "djLineupLabelSize");
    assert.equal(musicLabel?.binding.color, "djLineupLabelColor");
    assert.equal(musicLabel?.binding.panel, "details2");
    const ticketLabel = variant.cocoCompositionSystem.compiledDocument.objects.find(
      (object: RuntimeVariant) => object.id === "ticket-label",
    );
    assert.equal(ticketLabel?.binding.text, "leftRailLabel");
  }
});

test("quick-edit rebinding shares immutable compiler metadata without mutating the session", async () => {
  const project = await readProject("glow-in-the-dark");
  const source = projectSessions(project).square;
  const sourceSnapshot = structuredClone(source);
  const target = materializeCocoPortableRecipeVariant(
    "glow-in-the-dark",
    source,
    {
      eventName: "Neon in the Night",
      eventBrief: structuredClone(EVENT_BRIEF),
      copy: { ...GENERATED_COPY },
      subjectBounds: structuredClone(SUBJECT_BOUNDS),
      subjectDataUrl: SUBJECT_URL,
    },
    { cloneSource: false },
  );

  assert.notStrictEqual(target, source);
  assert.strictEqual(target.cocoCompositionSystem, source.cocoCompositionSystem);
  assert.strictEqual(target.cocoCssCompiler, source.cocoCssCompiler);
  assert.strictEqual(target.cocoCompositionMap, source.cocoCompositionMap);
  assert.notStrictEqual(target.emojiList, source.emojiList);
  assert.notStrictEqual(target.portraits, source.portraits);
  assert.notStrictEqual(target.cocoEventBrief, source.cocoEventBrief);
  assert.deepEqual(source, sourceSnapshot);
});

test("subject replacement resolves Story from its session before Story is mounted", async () => {
  const project = await readProject("glow-in-the-dark");
  const sessions = projectSessions(project);
  const sourceSnapshot = structuredClone(sessions);
  const squareSubject = (sessions.square.portraits as RuntimeVariant[]).find(isSubjectAsset);
  const storySubject = (sessions.story.portraits as RuntimeVariant[]).find(isSubjectAsset);
  assert.ok(squareSubject);
  assert.ok(storySubject);
  assert.notEqual(squareSubject.id, storySubject.id);

  const patch = {
    cleanupBaseUrl: "data:image/jpeg;base64,c291cmNl",
    cocoSubjectBounds: undefined,
    isExtracted: true,
    url: SUBJECT_URL,
  };
  const squareReplacement = replaceCocoRecipeSubjectInVariant(
    sessions.square,
    squareSubject.id,
    patch,
  );
  const storyReplacement = replaceCocoRecipeSubjectInVariant(
    sessions.story,
    squareSubject.id,
    patch,
  );
  assert.ok(squareReplacement);
  assert.ok(storyReplacement);
  assert.equal(squareReplacement.subjectId, squareSubject.id);
  assert.equal(storyReplacement.subjectId, storySubject.id);

  for (const replacement of [squareReplacement, storyReplacement]) {
    const portraitSubject = (replacement.variant.portraits as RuntimeVariant[]).find(
      isSubjectAsset,
    );
    const emojiSubject = (replacement.variant.emojiList as RuntimeVariant[]).find(
      isSubjectAsset,
    );
    assert.equal(portraitSubject?.url, SUBJECT_URL);
    assert.equal(emojiSubject?.url, SUBJECT_URL);
    assert.equal(portraitSubject?.cleanupBaseUrl, patch.cleanupBaseUrl);
    assert.equal(emojiSubject?.cleanupBaseUrl, patch.cleanupBaseUrl);
  }
  assert.strictEqual(
    squareReplacement.variant.cocoCssCompiler,
    sessions.square.cocoCssCompiler,
  );
  assert.strictEqual(
    storyReplacement.variant.cocoCssCompiler,
    sessions.story.cocoCssCompiler,
  );
  assert.deepEqual(sessions, sourceSnapshot);
});

test("portable recipes preserve subject decisions and cleanup sources across both formats", async () => {
  const project = await readProject("glow-in-the-dark");
  const subjectDecision: CocoSubjectDecision = {
    intent: "user",
    quality: "weak",
    source: "uploaded-photo",
    reasons: ["possible-edge-halo"],
  };
  const template = materializeCocoPortableRecipeTemplate({
    baseTemplate: {
      id: "__seed__",
      label: "Seed",
      formats: {},
    },
    composer: {
      eventName: "Glow Authority",
      eventBrief: structuredClone(EVENT_BRIEF),
      copy: { ...GENERATED_COPY },
      subjectBounds: structuredClone(SUBJECT_BOUNDS),
      subjectDataUrl: SUBJECT_URL,
      subjectDecision,
      subjectSourceDataUrl: SUBJECT_SOURCE_URL,
    },
    project,
    recipeId: "glow-in-the-dark",
  }) as RuntimeTemplate;

  for (const format of FORMATS) {
    const variant = template.formats[format];
    assert.deepEqual(variant.cocoSubjectDecision, subjectDecision);
    assert.notStrictEqual(variant.cocoSubjectDecision, subjectDecision);

    for (const assetKey of ["emojiList", "portraits"] as const) {
      const subject = (variant[assetKey] as RuntimeVariant[]).find(isSubjectAsset);
      assert.ok(subject, `${format} ${assetKey} needs its recipe subject`);
      assert.equal(subject.url, SUBJECT_URL);
      assert.equal(subject.cleanupBaseUrl, SUBJECT_SOURCE_URL);
      assert.deepEqual(subject.cocoSubjectBounds, SUBJECT_BOUNDS);
    }
  }

  assert.notStrictEqual(
    template.formats.square.cocoSubjectDecision,
    template.formats.story.cocoSubjectDecision,
  );
});
