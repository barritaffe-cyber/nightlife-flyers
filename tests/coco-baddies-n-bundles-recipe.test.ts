import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";

import {
  BADDIES_N_BUNDLES_RECIPE,
  getBaddiesNBundlesFormatRecipe,
} from "../lib/recipes/baddiesNBundles.ts";
import { getVisualRecipe, VISUAL_RECIPES } from "../lib/visualRecipes.ts";
import {
  baddiesNBundlesCssMasterAdapter,
} from "../scripts/build-baddies-n-bundles-master.mjs";
import { materializeCocoDocument } from "../scripts/lib/coco-materializer.mjs";

const RECIPE_ID = "baddies-n-bundles";
const MASTER_URL = new URL(
  "../public/generated-flyers/baddies-n-bundles-reference-master.html",
  import.meta.url,
);
const PROJECT_URL = new URL(
  "../public/generated-flyers/baddies-n-bundles.nflyer",
  import.meta.url,
);
const REFINEMENT_URL = new URL(
  "../public/generated-flyers/baddies-n-bundles-refinements.json",
  import.meta.url,
);
const PUBLIC_ROOT_URL = new URL("../public/", import.meta.url);
const SUBJECT_URL = "/generated-flyers/assets/baddies-n-bundles-subject-v1.png";
const LOGO_URL = "/generated-flyers/assets/baddies-n-bundles-logo-v1.png";
const AUTHORITATIVE_PROJECT_SHA256 =
  "f8d4a6df13c5da974de9cc223bebd7acff6f97f5ec5d765d6fd94b4f0b37d763";

const semanticContract = {
  presenter: "presenter",
  headline: "headline",
  connector: "headline2",
  date: "date",
  doors: "time",
  hype: "details",
  "dj-lineup": "djLineup",
  venue: "venue",
  address: "address",
  "reservation-label": "rsvpLabel",
  "reservation-value": "rsvp",
  responsible: "footerDetails",
  age: "subtag",
  subject: "subject",
} as const;

const expectedRoles = Object.values(semanticContract).sort();
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function localPublicUrl(resource: string) {
  assert.ok(resource.startsWith("/"), `${resource} must be public-root relative`);
  return new URL(`.${decodeURIComponent(resource)}`, PUBLIC_ROOT_URL);
}

test("Baddies N Bundles is one authoritative registered Square and Story recipe", () => {
  assert.equal(getVisualRecipe(RECIPE_ID), BADDIES_N_BUNDLES_RECIPE);
  assert.equal(
    VISUAL_RECIPES.filter((recipe) => recipe.id === RECIPE_ID).length,
    1,
  );

  const square = getBaddiesNBundlesFormatRecipe("square");
  const story = getBaddiesNBundlesFormatRecipe("story");
  assert.deepEqual(square.canvas, { width: 1080, height: 1080 });
  assert.deepEqual(story.canvas, { width: 1080, height: 1920 });
  assert.notDeepEqual(square.zones, story.zones);

  for (const id of ["headline", "subject", "date", "address"] as const) {
    assert.ok(square.zones[id], `Square needs an authored ${id} zone`);
    assert.ok(story.zones[id], `Story needs an authored ${id} zone`);
    assert.notDeepEqual(
      square.zones[id],
      story.zones[id],
      `${id} must be deliberately recomposed rather than copied between formats`,
    );
  }

  const commonZoneIds = Object.keys(square.zones).filter((id) => id in story.zones);
  const changedZoneIds = commonZoneIds.filter(
    (id) => JSON.stringify(square.zones[id]) !== JSON.stringify(story.zones[id]),
  );
  assert.ok(changedZoneIds.length >= 4, "Square and Story need materially distinct geometry");

  assert.deepEqual(
    [...new Set(baddiesNBundlesCssMasterAdapter.requiredRoles)].sort(),
    expectedRoles,
  );
  for (const [objectId, semanticRole] of Object.entries(semanticContract)) {
    assert.equal(
      baddiesNBundlesCssMasterAdapter.semanticRoles[objectId]?.semanticRole,
      semanticRole,
      `${objectId} must bind the ${semanticRole} semantic role`,
    );
  }

  assert.equal(
    BADDIES_N_BUNDLES_RECIPE.runtime.authority.layout.genericTemplateMayOverride,
    false,
  );
  assert.equal(
    BADDIES_N_BUNDLES_RECIPE.runtime.authority.palette.generatedPaletteMayOverride,
    false,
  );
  assert.equal(
    BADDIES_N_BUNDLES_RECIPE.runtime.authority.assets.generatedBackgroundAllowed,
    false,
  );
});

test("Baddies CSS master is provenance-linked, local-only, and semantically split", async () => {
  const source = await readFile(MASTER_URL, "utf8");
  const sourceHash = createHash("sha256").update(source).digest("hex");

  assert.equal(sourceHash.length, 64);
  assert.equal(
    BADDIES_N_BUNDLES_RECIPE.measurementReference?.measurements.sourceSha256,
    sourceHash,
  );
  assert.doesNotMatch(source, /(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(source, /url\(\s*["']?https?:\/\//i);
  assert.match(source, /data-format=["']square["']/);
  assert.match(source, /data-format=["']story["']/);

  for (const [objectId, semanticRole] of Object.entries(semanticContract)) {
    assert.match(
      source,
      new RegExp(
        `<[^>]*data-region=["']${objectId}["'][^>]*data-coco-object=["'][^"']+["']`,
      ),
      `${objectId} needs stable compiler identity`,
    );
    assert.match(
      source,
      new RegExp(`data-region=["']${objectId}["']`),
      `${objectId} needs a stable measurement region`,
    );
    assert.equal(
      (source.match(new RegExp(`data-coco-role=["']${semanticRole}["']`, "g")) ?? [])
        .length,
      1,
      `${semanticRole} must be represented by exactly one editable object`,
    );
  }
  assert.match(source, /data-coco-asset=["']subject["']/);
  assert.match(source, /data-coco-asset=["']logo["']/);
  assert.match(source, new RegExp(SUBJECT_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(source, new RegExp(LOGO_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const localResources = [
    ...[...source.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)].map(
      (match) => match[1],
    ),
    ...[...source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map(
      (match) => match[1],
    ),
  ].filter((resource) => resource.startsWith("/"));
  assert.ok(localResources.includes(SUBJECT_URL));
  assert.ok(localResources.includes(LOGO_URL));
  for (const resource of new Set(localResources)) {
    const info = await stat(localPublicUrl(resource));
    assert.equal(info.isFile(), true, `${resource} must resolve inside public/`);
  }
});

test("Baddies subject and logo are real transparent local PNG assets", async () => {
  for (const [label, resource] of [
    ["subject", SUBJECT_URL],
    ["logo", LOGO_URL],
  ] as const) {
    const fileUrl = localPublicUrl(resource);
    const info = await stat(fileUrl);
    assert.equal(info.isFile(), true);
    assert.ok(info.size > 10_000, `${label} must not be a placeholder image`);

    const image = sharp(fileURLToPath(fileUrl));
    const [metadata, statistics] = await Promise.all([image.metadata(), image.stats()]);
    assert.equal(metadata.format, "png");
    assert.equal(metadata.channels, 4, `${label} needs an RGBA channel layout`);
    assert.equal(metadata.hasAlpha, true, `${label} needs an alpha channel`);
    assert.ok((metadata.width ?? 0) >= 500, `${label} width must be usable at export size`);
    assert.ok((metadata.height ?? 0) >= 500, `${label} height must be usable at export size`);
    assert.equal(statistics.isOpaque, false, `${label} must contain transparent pixels`);
    assert.equal(statistics.channels[3]?.min, 0, `${label} must contain fully clear pixels`);
    assert.equal(statistics.channels[3]?.max, 255, `${label} must retain opaque artwork`);
  }
});

test("compiled Baddies project preserves semantic objects and materialization invariants", async () => {
  const [projectSource, masterSource, refinementSource] = await Promise.all([
    readFile(PROJECT_URL, "utf8"),
    readFile(MASTER_URL),
    readFile(REFINEMENT_URL, "utf8"),
  ]);
  const project = JSON.parse(projectSource);
  const refinements = JSON.parse(refinementSource);
  const state = project.state;
  const sourceHash = createHash("sha256").update(masterSource).digest("hex");

  assert.equal(refinements.recipeId, RECIPE_ID);
  assert.equal(refinements.recipeVersion, BADDIES_N_BUNDLES_RECIPE.version);
  assert.equal(refinements.sourceHash, sourceHash);
  assert.equal(
    refinements.sourceProjectSha256,
    "f8d4a6df13c5da974de9cc223bebd7acff6f97f5ec5d765d6fd94b4f0b37d763",
  );

  for (const format of ["square", "story"] as const) {
    const variant = state.session[format];
    const ir = variant.cocoCssCompiler.ir;
    const objectsById = Object.fromEntries(
      ir.objects.map((object: any) => [object.id, object]),
    );

    assert.equal(variant.format, format);
    assert.equal(variant.cocoVisualRecipeId, RECIPE_ID);
    assert.equal(variant.cocoVisualRecipeVersion, BADDIES_N_BUNDLES_RECIPE.version);
    assert.equal(
      variant.cocoVisualRecipeMaterializedVersion,
      BADDIES_N_BUNDLES_RECIPE.version,
    );
    assert.equal(variant.cocoCssCompiler.schemaVersion, 4);
    assert.equal(variant.cocoCssCompiler.sourceHash, sourceHash);
    assert.equal(ir.provenance.sourceHash, sourceHash);
    assert.equal(ir.provenance.renderedFormat, format);
    assert.deepEqual(ir.provenance.externalRequests, []);
    assert.deepEqual(
      ir.canvas,
      format === "square" ? { width: 540, height: 540 } : { width: 540, height: 960 },
    );
    assert.deepEqual(variant.cocoCssCompiler.sourceCanvas, ir.canvas);
    assert.equal(new Set(ir.objects.map((object: any) => object.id)).size, ir.objects.length);
    assert.ok(ir.objects.every((object: any) => object.compileStatus === "compiled"));
    assert.ok(ir.objects.every((object: any) => object.warnings.length === 0));
    assert.deepEqual(variant.cocoCssCompiler.report, {
      compiled: ir.objects.length,
      approximated: 0,
      unsupported: 0,
      warnings: [],
    });

    const boundTextFields: string[] = [];
    for (const [objectId, semanticRole] of Object.entries(semanticContract)) {
      const object = objectsById[objectId];
      assert.ok(object, `${format} must retain ${objectId}`);
      assert.equal(object.semanticRole, semanticRole, `${format} ${objectId} role`);
      assert.equal(
        ir.objects.filter((item: any) => item.semanticRole === semanticRole).length,
        1,
        `${format} ${semanticRole} must stay independently editable`,
      );
      assert.equal(
        variant.cocoCssCompiler.semanticObjects[object.sourceObjectId || objectId]?.objectId,
        objectId,
      );
      assert.equal(
        variant.cocoCssCompiler.semanticObjects[object.sourceObjectId || objectId]?.semanticRole,
        semanticRole,
      );
      if (object.kind === "text") {
        assert.equal(typeof object.binding?.text, "string");
        assert.ok(object.binding.text.length > 0);
        assert.ok(
          Object.hasOwn(variant, object.binding.text),
          `${format} must retain the authoritative ${object.binding.text} editor field`,
        );
        boundTextFields.push(object.binding.text);
      }
    }
    assert.equal(new Set(boundTextFields).size, boundTextFields.length);

    const subject = objectsById.subject;
    const logo = objectsById.logo;
    assert.equal(subject.kind, "image");
    assert.equal(subject.image.src, SUBJECT_URL);
    assert.equal(subject.semanticRole, "subject");
    assert.ok(subject.image.naturalWidth > 0 && subject.image.naturalHeight > 0);
    assert.equal(logo.kind, "image");
    assert.equal(logo.assetRole, "logo");
    assert.equal(logo.image.src, LOGO_URL);
    assert.ok(logo.image.naturalWidth > 0 && logo.image.naturalHeight > 0);

    const compiledAssets = variant.emojiList.filter(
      (asset: any) => typeof asset.cocoCompiledObjectId === "string",
    );
    assert.equal(
      new Set(compiledAssets.map((asset: any) => asset.cocoCompiledObjectId)).size,
      compiledAssets.length,
    );
    assert.match(
      compiledAssets.find((asset: any) => asset.cocoCompiledObjectId === "subject")?.url ?? "",
      /^data:image\/png;base64,/,
      `${format} must retain the subject embedded by the authoritative project`,
    );
    assert.equal(
      compiledAssets.find((asset: any) => asset.cocoCompiledObjectId === "logo")?.url,
      LOGO_URL,
    );
    assert.equal(
      compiledAssets.find((asset: any) => asset.cocoCompiledObjectId === "background")?.locked,
      true,
      `${format} base background must stay locked by recipe policy`,
    );
    const compiledLogo = compiledAssets.find(
      (asset: any) => asset.cocoCompiledObjectId === "logo",
    );
    assert.equal(compiledLogo?.isLogo, true);
    assert.equal(compiledLogo?.isSticker, false);
    const dotTrail = objectsById["dot-trail"];
    assert.match(dotTrail.paint.backgroundRepeat, /repeat-x/);
    assert.match(dotTrail.paint.backgroundSize, /12\.5%/);
    assert.deepEqual(variant.portraits, variant.emojiList);
    const styledRunFamilies = new Set(
      ir.objects
        .filter((object: any) => object.kind === "text")
        .flatMap((object: any) => object.textRuns ?? [])
        .map((run: any) => run.runtimeFontFamily)
        .filter(Boolean),
    );
    for (const family of ["Anton", "Antonio", "Bebas Neue", "LEMONMILK-Bold", "LEMONMILK-Regular"]) {
      assert.ok(styledRunFamilies.has(family), `compiled runs need runtime family ${family}`);
    }
    assert.deepEqual(state.portraits[format], variant.emojiList);
    assert.deepEqual(variant.cocoCompositionSystem.compiledDocument, ir);
    assert.equal(variant.cocoCompositionSystem.authority.layout, "compiled-document-ir");
    assert.equal(
      variant.cocoSubjectLayoutId,
      format === "square" ? "subject-right" : "subject-center",
      `${format} must retain the authoritative subject placement`,
    );
    assert.equal(variant.headBehindPortrait, true);
    assert.ok(
      variant.cocoCompositionSystem.layerOrder.indexOf("headline") <
        variant.cocoCompositionSystem.layerOrder.indexOf("subject"),
    );

    const materialize = () =>
      materializeCocoDocument({
        document: clone(ir),
        recipe: baddiesNBundlesCssMasterAdapter.recipe,
        eventBrief: baddiesNBundlesCssMasterAdapter.eventBrief,
        palette:
          baddiesNBundlesCssMasterAdapter.palette ??
          baddiesNBundlesCssMasterAdapter.recipe.runtime.palette,
        authority: baddiesNBundlesCssMasterAdapter.recipe.runtime.authority,
      });
    assert.deepEqual(materialize(), materialize(), `${format} materialization must be deterministic`);
  }

  for (const id of ["headline", "subject", "date", "address"] as const) {
    const squareObject = state.session.square.cocoCssCompiler.ir.objects.find(
      (object: any) => object.id === id,
    );
    const storyObject = state.session.story.cocoCssCompiler.ir.objects.find(
      (object: any) => object.id === id,
    );
    assert.notDeepEqual(squareObject.bounds, storyObject.bounds, `${id} needs format geometry`);
  }
});

test("committed Baddies project is the exact approved authored project", async () => {
  const projectSource = await readFile(PROJECT_URL);
  assert.equal(
    createHash("sha256").update(projectSource).digest("hex"),
    AUTHORITATIVE_PROJECT_SHA256,
  );
});
