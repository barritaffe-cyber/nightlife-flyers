import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BADDIES_N_BUNDLES_RECIPE } from "../lib/recipes/baddiesNBundles.ts";
import {
  BADDIES_N_BUNDLES_REFINEMENT_FIELDS,
  baddiesNBundlesCssMasterAdapter,
} from "./build-baddies-n-bundles-master.mjs";

const RECIPE_ID = "baddies-n-bundles";
const FORMATS = ["square", "story"];
const DEFAULT_INPUT_PATH = join(homedir(), "Desktop", `${RECIPE_ID}-fixed-v2.nflyer`);
const DEFAULT_OUTPUT_PATH = fileURLToPath(
  new URL(`../public/generated-flyers/${RECIPE_ID}-refinements.json`, import.meta.url),
);
const EXPECTED_COMPILED_ASSET_OBJECT_IDS = [
  "background",
  "green-glow",
  "stripe-left",
  "stripe-orb-top",
  "stripe-orb-right",
  "stripe-orb-bottom",
  "dot-trail",
  "accent-plus",
  "accent-waves-left",
  "accent-waves-right",
  "logo",
  "connector-disc",
  "subject",
  "date-frame",
  "venue-pin",
  "address-band",
];
const ASSET_PATCH_FIELDS = baddiesNBundlesCssMasterAdapter.refinementPolicy.compiledAssetPatchFields;
const ADDITION_FIELDS = baddiesNBundlesCssMasterAdapter.refinementPolicy.additionFields;

function fail(message) {
  throw new Error(`Baddies N Bundles refinement promotion failed: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertFiniteNumber(value, label) {
  assert(typeof value === "number" && Number.isFinite(value), `${label} must be a finite number`);
}

function parseArguments(args) {
  const positional = args.filter((argument) => {
    assert(!argument.startsWith("-"), `unknown option ${argument}`);
    return true;
  });
  assert(positional.length <= 2, "expected at most an input path and output path");
  return {
    inputPath: resolve(positional[0] || DEFAULT_INPUT_PATH),
    outputPath: resolve(positional[1] || DEFAULT_OUTPUT_PATH),
  };
}

function usage() {
  return [
    "Usage:",
    "  node scripts/promote-baddies-n-bundles-edits.mjs [authoritative.nflyer] [refinements.json]",
    "",
    `Default input:  ${DEFAULT_INPUT_PATH}`,
    `Default output: ${DEFAULT_OUTPUT_PATH}`,
  ].join("\n");
}

function pickFields(session, format) {
  const fields = {};
  for (const field of BADDIES_N_BUNDLES_REFINEMENT_FIELDS) {
    assert(Object.hasOwn(session, field), `${format} session is missing approved field ${field}`);
    fields[field] = clone(session[field]);
  }
  return fields;
}

function extractCompiledObjectOverrides(session, format, compiledObjectIds) {
  const source = session.cocoCompositionSystem?.compiledObjectOverrides || {};
  assert(source && typeof source === "object" && !Array.isArray(source), `${format} compiledObjectOverrides must be an object`);
  const result = {};
  for (const objectId of Object.keys(source).sort()) {
    assert(compiledObjectIds.has(objectId), `${format} override targets unknown object ${objectId}`);
    const sourceOverride = source[objectId];
    const override = {};
    for (const field of ["x", "y"]) {
      if (!Object.hasOwn(sourceOverride, field)) continue;
      assertFiniteNumber(sourceOverride[field], `${format} override ${objectId}.${field}`);
      override[field] = sourceOverride[field];
    }
    assert(Object.keys(override).length > 0, `${format} override ${objectId} has no approved coordinates`);
    result[objectId] = override;
  }
  return result;
}

function pickAssetFields(asset, fields, format, label) {
  const picked = {};
  for (const field of fields) {
    if (!Object.hasOwn(asset, field)) continue;
    const value = asset[field];
    if (["x", "y", "scale", "opacity", "rotation", "tint", "layerOffset"].includes(field)) {
      assertFiniteNumber(value, `${format} ${label}.${field}`);
    }
    picked[field] = clone(value);
  }
  return picked;
}

function extractAssets(session, format, compiledObjectIds) {
  const assets = session.emojiList;
  assert(Array.isArray(assets), `${format} session has no emojiList`);
  assert(Array.isArray(session.portraits), `${format} session has no portraits`);
  assert(
    JSON.stringify(assets) === JSON.stringify(session.portraits),
    `${format} emojiList and portraits disagree`,
  );

  const patchCompiledByObjectId = {};
  const additions = [];
  const activeCompiledIds = new Set();
  const assetIds = new Set();
  for (const asset of assets) {
    assert(asset && typeof asset === "object" && !Array.isArray(asset), `${format} contains an invalid asset`);
    assert(typeof asset.id === "string" && asset.id.length > 0, `${format} contains an asset without an id`);
    assert(!assetIds.has(asset.id), `${format} repeats asset id ${asset.id}`);
    assetIds.add(asset.id);
    if (asset.cocoCompiledObjectId) {
      const objectId = String(asset.cocoCompiledObjectId);
      assert(compiledObjectIds.has(objectId), `${format} asset ${asset.id} targets unknown object ${objectId}`);
      assert(!activeCompiledIds.has(objectId), `${format} repeats compiled asset ${objectId}`);
      activeCompiledIds.add(objectId);
      patchCompiledByObjectId[objectId] = pickAssetFields(asset, ASSET_PATCH_FIELDS, format, objectId);
      continue;
    }

    assert(
      baddiesNBundlesCssMasterAdapter.refinementPolicy.additionIdPrefixes.some((prefix) => asset.id.startsWith(prefix)),
      `${format} addition ${asset.id} is not an approved design element`,
    );
    const addition = pickAssetFields(asset, ADDITION_FIELDS, format, asset.id);
    assert(typeof addition.url === "string" && addition.url.length > 0, `${format} addition ${asset.id} has no URL`);
    additions.push(addition);
  }

  for (const objectId of EXPECTED_COMPILED_ASSET_OBJECT_IDS) {
    assert(activeCompiledIds.has(objectId), `${format} is missing compiled asset ${objectId}`);
  }
  assert(
    activeCompiledIds.size === EXPECTED_COMPILED_ASSET_OBJECT_IDS.length,
    `${format} exposes an unexpected compiled asset`,
  );

  return {
    removeCompiledObjectIds: [],
    patchCompiledByObjectId,
    additions,
  };
}

function assertFormatIdentity(session, format, expectedSourceHash) {
  assert(session && typeof session === "object" && !Array.isArray(session), `project has no ${format} session`);
  assert(session.format === format, `${format} session declares format ${session.format}`);
  assert(session.cocoVisualRecipeId === RECIPE_ID, `${format} belongs to ${session.cocoVisualRecipeId}`);
  assert(
    [1, 2, BADDIES_N_BUNDLES_RECIPE.version].includes(Number(session.cocoVisualRecipeVersion)),
    `${format} has unsupported recipe version ${session.cocoVisualRecipeVersion}`,
  );
  const compiler = session.cocoCssCompiler;
  const compiledDocument = session.cocoCompositionSystem?.compiledDocument;
  assert(compiler?.sourceHash === expectedSourceHash, `${format} compiler source hash is stale`);
  assert(compiledDocument?.provenance?.sourceHash === expectedSourceHash, `${format} compiled document source hash is stale`);
  const objectIds = new Set((compiledDocument.objects || []).map((object) => object.id));
  assert(objectIds.size > 0, `${format} compiled document has no objects`);
  return objectIds;
}

async function assertDifferentFiles(inputPath, outputPath) {
  assert(inputPath !== outputPath, "input and output paths must be different");
  const inputStat = await stat(inputPath);
  try {
    const outputStat = await stat(outputPath);
    assert(
      inputStat.dev !== outputStat.dev || inputStat.ino !== outputStat.ino,
      "input and output resolve to the same file",
    );
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function promoteBaddiesNBundlesEdits({
  inputPath = DEFAULT_INPUT_PATH,
  outputPath = DEFAULT_OUTPUT_PATH,
} = {}) {
  const resolvedInputPath = resolve(inputPath);
  const resolvedOutputPath = resolve(outputPath);
  await assertDifferentFiles(resolvedInputPath, resolvedOutputPath);
  const source = await readFile(resolvedInputPath);
  const project = JSON.parse(source.toString("utf8"));
  const state = project?.state;
  assert(state && typeof state === "object" && !Array.isArray(state), "input has no state object");
  assert(typeof state.savedAt === "string" && !Number.isNaN(Date.parse(state.savedAt)), "input has no valid savedAt timestamp");
  const sessions = state.session;
  assert(sessions && typeof sessions === "object" && !Array.isArray(sessions), "input has no session map");

  const sourceHash = BADDIES_N_BUNDLES_RECIPE.measurementReference.measurements.sourceSha256;
  const formats = {};
  for (const format of FORMATS) {
    const session = sessions[format];
    const compiledObjectIds = assertFormatIdentity(session, format, sourceHash);
    formats[format] = {
      fields: pickFields(session, format),
      compiledObjectOverrides: extractCompiledObjectOverrides(session, format, compiledObjectIds),
      assets: extractAssets(session, format, compiledObjectIds),
    };
  }

  const refinementDocument = {
    schemaVersion: 1,
    recipeId: RECIPE_ID,
    recipeVersion: BADDIES_N_BUNDLES_RECIPE.version,
    sourceHash,
    sourceProjectSha256: sha256(source),
    sourceSavedAt: state.savedAt,
    formats,
  };
  assert(dirname(resolvedOutputPath) !== resolvedOutputPath, "output path has no parent directory");
  await writeFile(resolvedOutputPath, `${JSON.stringify(refinementDocument, null, 2)}\n`, "utf8");
  return { inputPath: resolvedInputPath, outputPath: resolvedOutputPath, refinementDocument };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
  } else {
    const result = await promoteBaddiesNBundlesEdits(parseArguments(process.argv.slice(2)));
    const counts = Object.fromEntries(FORMATS.map((format) => [format, {
      overrides: Object.keys(result.refinementDocument.formats[format].compiledObjectOverrides).length,
      patched: Object.keys(result.refinementDocument.formats[format].assets.patchCompiledByObjectId).length,
      added: result.refinementDocument.formats[format].assets.additions.length,
    }]));
    console.log(
      `Promoted ${result.refinementDocument.sourceProjectSha256} to ${result.outputPath} `
      + `(${counts.square.overrides} overrides/${counts.square.patched} patched/${counts.square.added} added Square; `
      + `${counts.story.overrides} overrides/${counts.story.patched} patched/${counts.story.added} added Story)`,
    );
  }
}
