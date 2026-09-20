import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  getPuntaCanaSundaysFormatRecipe,
  PUNTA_CANA_SUNDAYS_RECIPE,
} from "../lib/recipes/puntaCanaSundays.ts";
import { getVisualRecipe, VISUAL_RECIPES } from "../lib/visualRecipes.ts";
import {
  buildPuntaCanaSundaysMaster,
  puntaCanaSundaysCssMasterAdapter,
} from "../scripts/build-punta-cana-sundays-master.mjs";
import { materializeCocoDocument } from "../scripts/lib/coco-materializer.mjs";

const ADAPTED_MASTER_SHA256 =
  "31b04bc5f2ea003d03668373a0765821f51ba4b3e98aae96ba5916cbb88c4680";
const SUPPLIED_SOURCE_SHA256 =
  "33329d8c31feb372986b789205cda88696afc7ce5af789af039ab39d65112f54";
const APPROVED_EDITED_PROJECT_SHA256 =
  "d611ee901fbd37c2e4c78b9279d78a6777c0e8607c68089246ea0ec7d81a772a";
const APPROVED_EDITED_SAVED_AT = "2026-09-01T22:15:07.186Z";
const APPROVED_STORY_ADDRESS =
  "•297 Grodify St • New York • NY•\n • 07345 • 978.000.0000•";
const SOCIAL_ICON_TOP_LAYER_OFFSET = 180;

const objectIds = [
  "background",
  "subjectGlow",
  "foliageFrame",
  "foliageForeground",
  "headline",
  "headline2",
  "details",
  "presenter",
  "date",
  "barcode",
  "hostedBy",
  "social",
  "subject",
  "djLineup",
  "dotGridLeft",
  "dotGridRight",
  "venue",
  "footerDetails",
  "footerBand",
  "footerAddress",
].sort();

const semanticContract = {
  headline: { role: "headline", field: "headline", text: "Punta" },
  headline2: { role: "headline2", field: "head2line", text: "Cana" },
  details: { role: "details", field: "details", text: "Sundays" },
  presenter: { role: "presenter", field: "presenter", text: "Grodify\nPresents" },
  date: { role: "date", field: "date", text: "03\n06" },
  hostedBy: { role: "hostedBy", field: "leftRail", text: "Hosted by Grodify" },
  social: { role: "social", field: "cocoSocialHandle", text: "@Grodify" },
  djLineup: { role: "djLineup", field: "details2", text: "DjName × DjName" },
  venue: { role: "venue", field: "venue", text: "Flyers HQ" },
  footerDetails: {
    role: "footerDetails",
    field: "rightRail",
    text: "Dress code strictly enforced\nBottle specials & birthday packages available",
  },
  footerAddress: {
    role: "address",
    field: "venueAddress",
    text: "297 Grodify St • New York • NY • 07345 • 978.000.0000",
  },
} as const;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function normalizedProject(project: any) {
  const normalized = clone(project);
  normalized.state.savedAt = "<normalized>";
  return normalized;
}

test("Punta Cana Sundays is one authoritative registered recipe", () => {
  assert.equal(getVisualRecipe("punta-cana-sundays"), PUNTA_CANA_SUNDAYS_RECIPE);
  assert.equal(
    VISUAL_RECIPES.filter((recipe) => recipe.id === "punta-cana-sundays").length,
    1,
  );
  assert.deepEqual(getPuntaCanaSundaysFormatRecipe("square").canvas, { width: 1080, height: 1080 });
  assert.deepEqual(getPuntaCanaSundaysFormatRecipe("story").canvas, { width: 1080, height: 1920 });
  assert.notDeepEqual(
    getPuntaCanaSundaysFormatRecipe("square").zones.subject,
    getPuntaCanaSundaysFormatRecipe("story").zones.subject,
  );
});

test("Punta CSS master is provenance-locked, local, and explicitly split", async () => {
  const masterUrl = new URL(
    "../public/generated-flyers/punta-cana-sundays-reference-master.html",
    import.meta.url,
  );
  const source = await readFile(masterUrl, "utf8");
  assert.equal(createHash("sha256").update(source).digest("hex"), ADAPTED_MASTER_SHA256);
  assert.equal(
    PUNTA_CANA_SUNDAYS_RECIPE.measurementReference?.measurements.sourceSha256,
    ADAPTED_MASTER_SHA256,
  );
  assert.equal(
    PUNTA_CANA_SUNDAYS_RECIPE.measurementReference?.measurements.suppliedSourceSha256,
    SUPPLIED_SOURCE_SHA256,
  );
  assert.doesNotMatch(source, /(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(source, /url\(["']?https?:\/\//i);
  assert.match(source, /requestedFormat === "square" \|\| requestedFormat === "story"/);
  assert.match(source, /\.canvas\[data-format="square"\] \{ aspect-ratio: 1; \}/);
  assert.match(source, /\.canvas\[data-format="story"\] \{ aspect-ratio: 9 \/ 16; \}/);

  for (const id of objectIds) {
    assert.match(source, new RegExp(`data-region="${id}"`), `${id} needs a stable region`);
    assert.match(source, new RegExp(`data-coco-object="${id}"`), `${id} needs provenance identity`);
  }
  assert.doesNotMatch(source, />\s*Punta\s+Cana\s+Sundays\s*</i);
  assert.equal((source.match(/data-coco-role="details"/g) || []).length, 1);
  assert.equal((source.match(/data-coco-role="hostedBy"/g) || []).length, 1);
  assert.equal((source.match(/data-coco-role="social"/g) || []).length, 1);
  assert.equal((source.match(/data-coco-role="footerDetails"/g) || []).length, 1);

  const publicRoot = new URL("../public/", import.meta.url);
  const localResources = [
    ...source.matchAll(/(?:src|url\()=["']?([^"')]+)|url\(["']([^"']+)["']\)/g),
  ]
    .flatMap((match) => [match[1], match[2]])
    .filter((value): value is string => Boolean(value?.startsWith("/")));
  for (const resource of localResources) {
    const fileUrl = new URL(`.${decodeURIComponent(resource)}`, publicRoot);
    const info = await stat(fileUrl);
    assert.equal(info.isFile(), true, `${resource} must resolve to a local file`);
  }
});

test("Punta edited-master refinements are provenance-locked and narrowly projected", async () => {
  const refinement = JSON.parse(
    await readFile(
      new URL("../public/generated-flyers/punta-cana-sundays-refinements.json", import.meta.url),
      "utf8",
    ),
  );

  assert.equal(refinement.schemaVersion, 1);
  assert.equal(refinement.recipeId, "punta-cana-sundays");
  assert.equal(refinement.recipeVersion, 2);
  assert.equal(refinement.sourceHash, ADAPTED_MASTER_SHA256);
  assert.equal(refinement.sourceProjectSha256, APPROVED_EDITED_PROJECT_SHA256);
  assert.equal(refinement.sourceSavedAt, APPROVED_EDITED_SAVED_AT);
  assert.deepEqual(Object.keys(refinement.formats).sort(), ["square", "story"]);

  const square = refinement.formats.square;
  assert.equal(square.fields.align, "left");
  assert.equal(square.fields.detailsFamily, "Bebas Neue");
  assert.equal(square.fields.detailsSize, 27.5);
  assert.equal(square.fields.detailsRotate, 90);
  assert.equal(square.fields.bodyTracking, 0.04);
  assert.equal(square.fields.venueSize, 25);
  assert.equal(square.fields.cocoRushVenueStyles.addressSize, 7);
  assert.equal(square.fields.compliance, "18+");
  assert.equal(square.fields.complianceEnabled, true);
  assert.equal(square.fields.qrEnabled, true);
  assert.equal(square.fields.qrScale, 0.89);
  assert.equal(square.fields.vignette, false);
  assert.equal(square.fields.vignetteStrength, 0.1);
  assert.equal(square.fields.haze, 0.5);
  assert.equal(square.fields.grade, 0.35);
  assert.equal(Object.keys(square.compiledObjectOverrides).length, 9);
  assert.deepEqual(square.compiledObjectOverrides.headline, {
    x: 23.90480324074074,
    y: 9.852430555555557,
  });
  assert.deepEqual(square.assets.additions, []);
  assert.deepEqual(square.assets.patchCompiledByObjectId.footerBand, {
    x: 51.15523726851852,
    y: 97.05367476851852,
    scale: 1.69,
  });

  const story = refinement.formats.story;
  assert.equal(story.fields.headlineSize, 112);
  assert.equal(story.fields.headManualPx, 112);
  assert.equal(story.fields.headMaxPx, 112);
  assert.equal(story.fields.align, "center");
  assert.equal(story.fields.head2Size, 130);
  assert.equal(story.fields.detailsSize, 32);
  assert.equal(story.fields.detailsRotate, 90);
  assert.equal(story.fields.bodyTracking, 0.04);
  assert.equal(story.fields.details2Color, "#EAF418");
  assert.equal(story.fields.venueAddress, APPROVED_STORY_ADDRESS);
  assert.equal(story.fields.venueSize, 27);
  assert.equal(story.fields.cocoRushVenueStyles.addressSize, 10);
  assert.equal(story.fields.cocoSocialHandleRotation, 0);
  assert.equal(story.fields.vignette, true);
  assert.equal(story.fields.vignetteStrength, 0.5);
  assert.equal(story.fields.haze, 0.5);
  assert.equal(story.fields.grade, 0.35);
  assert.deepEqual(story.fields.cocoManualTextColorRoles, { details2: true });
  assert.equal(Object.keys(story.compiledObjectOverrides).length, 11);
  assert.deepEqual(story.compiledObjectOverrides.footerAddress, {
    x: 47.8052662037037,
    y: 94.30460611979167,
  });
  assert.deepEqual(story.assets.patchCompiledByObjectId.subject, {
    x: 48.61689814814815,
    y: 54.44783528645833,
    scale: 1.22,
  });

  const additions = story.assets.additions;
  assert.deepEqual(
    additions.map((asset: any) => asset.id),
    [
      "flare_flareBlack_1788295687667_8n6od",
      "sticker_instagram_logo_1788295812318_m9nsw",
      "sticker_facebook_logo_1788295974410_oob7e",
      "sticker_youtube_logo_1788296011818_9sbh7",
    ],
  );
  const socialAdditions = additions.filter((asset: any) => asset.isSocialIcon);
  assert.deepEqual(
    socialAdditions.map((asset: any) => asset.socialPlatform),
    ["instagram", "facebook", "youtube"],
  );
  assert.ok(
    socialAdditions.every((asset: any) => asset.layerOffset === SOCIAL_ICON_TOP_LAYER_OFFSET),
  );
  assert.ok(additions.every((asset: any) => !("tint" in asset) && !("labelBg" in asset)));
});

test("compiled Punta project preserves every independent semantic object", async () => {
  const project = JSON.parse(
    await readFile(
      new URL("../public/generated-flyers/punta-cana-sundays.nflyer", import.meta.url),
      "utf8",
    ),
  );
  const state = project.state;
  for (const format of ["square", "story"] as const) {
    const variant = state.session[format];
    const ir = variant.cocoCssCompiler.ir;
    const byId = Object.fromEntries(ir.objects.map((object: any) => [object.id, object]));
    assert.equal(variant.format, format);
    assert.equal(variant.cocoVisualRecipeId, "punta-cana-sundays");
    assert.equal(variant.cocoVisualRecipeVersion, 2);
    assert.deepEqual(
      ir.canvas,
      format === "square" ? { width: 540, height: 540 } : { width: 540, height: 960 },
    );
    assert.deepEqual(ir.objects.map((object: any) => object.id).sort(), objectIds);
    assert.equal(ir.objects.filter((object: any) => object.kind === "text").length, 11);
    assert.equal(ir.objects.filter((object: any) => object.kind === "image").length, 3);
    assert.equal(ir.objects.filter((object: any) => object.kind === "shape").length, 6);
    assert.deepEqual(variant.cocoCssCompiler.report, {
      compiled: 20,
      approximated: 0,
      unsupported: 0,
      warnings: [],
    });
    assert.equal(ir.provenance.renderedFormat, format);
    assert.deepEqual(ir.provenance.externalRequests, []);
    const loadedFonts = new Set(
      ir.provenance.fontFaces
        .filter((face: any) => face.status === "loaded")
        .map((face: any) => String(face.family).replace(/^['\"]|['\"]$/g, "")),
    );
    assert.ok(loadedFonts.has("PuntaDisplay"));
    assert.ok(loadedFonts.has("PuntaScript"));
    assert.ok(loadedFonts.has("PuntaSans"));

    const stateFields: string[] = [];
    for (const [id, expected] of Object.entries(semanticContract)) {
      const object = byId[id];
      const materializedText =
        id === "footerAddress" && format === "story"
          ? APPROVED_STORY_ADDRESS
          : expected.text;
      assert.equal(object.semanticRole, expected.role, `${id} role`);
      assert.equal(object.binding.text, expected.field, `${id} state field`);
      assert.equal(object.text, expected.text, `${id} initial text`);
      assert.equal(variant[expected.field], materializedText, `${id} materialized text`);
      stateFields.push(expected.field);
    }
    assert.equal(new Set(stateFields).size, stateFields.length);
    assert.equal(byId.subject.semanticRole, "subject");
    assert.equal(byId.subject.binding.text, undefined);
    assert.equal(variant.details, "Sundays");
    assert.equal(variant.leftRail, "Hosted by Grodify");
    assert.equal(variant.cocoSocialHandle, "@Grodify");
    assert.equal(
      variant.rightRail,
      "Dress code strictly enforced\nBottle specials & birthday packages available",
    );
    assert.equal(
      variant.venueAddress,
      format === "story" ? APPROVED_STORY_ADDRESS : semanticContract.footerAddress.text,
    );
    assert.equal(byId.headline.typography.fontFamily, "Avigea");
    assert.equal(byId.details.typography.fontFamily, "OpenScript");
    assert.equal(byId.hostedBy.typography.fontFamily, "LEMONMILK-Bold");
    assert.equal(byId.hostedBy.transform.rotate, -90);
    assert.equal(byId.social.transform.rotate, -90);
    assert.notDeepEqual(byId.hostedBy.bounds, byId.social.bounds);

    const compilerAssets = variant.emojiList.filter(
      (asset: any) => typeof asset.cocoCompiledObjectId === "string",
    );
    assert.equal(compilerAssets.length, 9);
    assert.equal(
      new Set(compilerAssets.map((asset: any) => asset.cocoCompiledObjectId)).size,
      compilerAssets.length,
    );
    assert.equal(compilerAssets.filter((asset: any) => asset.isExtracted).length, 1);
    assert.equal(
      compilerAssets.find((asset: any) => asset.isExtracted)?.cocoCompiledObjectId,
      "subject",
    );
    assert.equal(
      compilerAssets.filter((asset: any) => String(asset.cocoCompiledObjectId).startsWith("foliage")).length,
      2,
    );
    assert.ok(
      ir.objects
        .filter((object: any) => object.kind === "image")
        .every((object: any) => object.image.naturalWidth > 0 && object.image.naturalHeight > 0),
    );
    assert.deepEqual(variant.portraits, variant.emojiList);
    assert.deepEqual(state.portraits[format], variant.emojiList);
    assert.deepEqual(variant.cocoCompositionSystem.compiledDocument, ir);
    assert.equal(variant.cocoCompositionSystem.patternId, "tropical-center-subject-vertical-rail");
    assert.equal(variant.cocoCompositionSystem.styleId, "tropical-editorial");
    assert.equal(variant.cocoCompositionSystem.authority.layout, "compiled-document-ir");
    assert.deepEqual(
      state.cocoLayoutSessions[format][variant.cocoCenterLayoutOptionId],
      variant,
    );
    const additions = variant.emojiList.filter((asset: any) => !asset.cocoCompiledObjectId);
    assert.equal(additions.length, format === "story" ? 4 : 0);
    assert.equal(
      Object.keys(variant.cocoCompositionSystem.compiledObjectOverrides).length,
      format === "story" ? 11 : 9,
    );
    if (format === "square") {
      assert.equal(variant.detailsSize, 27.5);
      assert.equal(variant.align, "left");
      assert.equal(variant.bodyTracking, 0.04);
      assert.equal(variant.cocoRushVenueStyles.addressSize, 7);
      assert.equal(variant.qrEnabled, true);
      assert.equal(variant.complianceEnabled, true);
      assert.equal(variant.vignette, false);
      assert.equal(variant.vignetteStrength, 0.1);
    } else {
      assert.equal(variant.headlineSize, 112);
      assert.equal(variant.headManualPx, 112);
      assert.equal(variant.headMaxPx, 112);
      assert.equal(variant.head2Size, 130);
      assert.equal(variant.detailsSize, 32);
      assert.equal(variant.align, "center");
      assert.equal(variant.bodyTracking, 0.04);
      assert.equal(variant.cocoRushVenueStyles.addressSize, 10);
      assert.equal(variant.vignette, true);
      assert.equal(variant.vignetteStrength, 0.5);
      assert.ok(
        additions
          .filter((asset: any) => asset.isSocialIcon)
          .every((asset: any) => asset.layerOffset === SOCIAL_ICON_TOP_LAYER_OFFSET),
      );
    }
  }
  assert.notDeepEqual(
    state.session.square.cocoCssCompiler.ir.objects.find((object: any) => object.id === "headline").bounds,
    state.session.story.cocoCssCompiler.ir.objects.find((object: any) => object.id === "headline").bounds,
  );
  assert.notDeepEqual(
    state.session.square.cocoCssCompiler.ir.objects.find((object: any) => object.id === "subject").bounds,
    state.session.story.cocoCssCompiler.ir.objects.find((object: any) => object.id === "subject").bounds,
  );
  assert.equal(PUNTA_CANA_SUNDAYS_RECIPE.runtime.authority.layout.genericTemplateMayOverride, false);
  assert.equal(PUNTA_CANA_SUNDAYS_RECIPE.runtime.authority.palette.generatedPaletteMayOverride, false);
  assert.equal(PUNTA_CANA_SUNDAYS_RECIPE.runtime.authority.assets.generatedBackgroundAllowed, false);
});

test("Punta committed project is a fresh deterministic browser compilation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "coco-punta-master-"));
  const outputPath = join(directory, "punta-cana-sundays.nflyer");
  try {
    const result = await buildPuntaCanaSundaysMaster({ outputPath });
    const committed = JSON.parse(
      await readFile(
        new URL("../public/generated-flyers/punta-cana-sundays.nflyer", import.meta.url),
        "utf8",
      ),
    );
    assert.equal(result.sourceHash, ADAPTED_MASTER_SHA256);
    assert.deepEqual(normalizedProject(result.project), normalizedProject(committed));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("materializer rejects editable text objects that share one state field", () => {
  const textObject = (id: string) => ({
    id,
    sourceObjectId: id,
    assetRole: null,
    kind: "text",
    semanticRole: "details",
    editable: true,
    text: id,
    textRuns: [],
    bounds: { x: 0, y: 0, width: 10, height: 10 },
    paintBounds: { x: 0, y: 0, width: 10, height: 10 },
    transform: { rotate: 0, scaleX: 1, scaleY: 1, skewX: 0, originX: 50, originY: 50 },
    paint: { opacity: 1, color: "#fff" },
    stacking: { order: 0, zIndex: 1, effectiveZIndex: 1, contextPath: [] },
    compileStatus: "compiled",
    warnings: [],
    typography: {
      fontFamily: "LEMONMILK-Bold",
      fontSizePx: 20,
      fontWeight: "700",
      fontStyle: "normal",
      lineHeightPx: 20,
      lineHeight: 1,
      letterSpacingPx: 0,
      letterSpacingEm: 0,
      align: "left",
      textTransform: "none",
      textDecoration: "none",
      whiteSpace: "normal",
    },
    binding: { semanticRole: "details" },
  });
  const document = {
    schemaVersion: 1,
    id: "collision",
    format: "square",
    canvas: { width: 540, height: 540 },
    objects: [textObject("sundays"), textObject("hosted")],
    report: { compiled: 2, approximated: 0, unsupported: 0, warnings: [] },
    provenance: { sourceHash: "x", extractor: "test", viewport: { width: 540, height: 540 } },
  };
  assert.throws(
    () => materializeCocoDocument({
      document,
      recipe: puntaCanaSundaysCssMasterAdapter.recipe,
      eventBrief: puntaCanaSundaysCssMasterAdapter.eventBrief,
      palette: puntaCanaSundaysCssMasterAdapter.recipe.runtime.palette,
      authority: puntaCanaSundaysCssMasterAdapter.recipe.runtime.authority,
    }),
    /both bind state field details/,
  );
});

test("compiled renderer has live aliases for the independent social object", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /cocoSocialHandle: socialHandle/);
  assert.match(page, /cocoSocialHandleFamily: socialHandleFamily/);
  assert.match(page, /cocoSocialHandleRotation: socialHandleRotation/);
});
