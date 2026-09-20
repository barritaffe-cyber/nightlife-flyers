import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BLACK_GOLD_PARTY_RECIPE } from "../lib/recipes/blackGoldParty.ts";
import {
  BLACK_GOLD_PARTY_REFINEMENT_FIELDS,
  blackGoldPartyCssMasterAdapter,
} from "./build-black-gold-party-master.mjs";

const RECIPE_ID = "black-gold-party";
const FORMATS = ["square", "story"];
const DEFAULT_INPUT_PATH = join(homedir(), "Desktop", `${RECIPE_ID}-updated.nflyer`);
const DEFAULT_OUTPUT_PATH = fileURLToPath(
  new URL(`../public/generated-flyers/${RECIPE_ID}-refinements.json`, import.meta.url),
);
const EXPECTED_COMPILED_ASSET_OBJECT_IDS = [
  "background",
  "ambience",
  "constellations",
  "edge-bar-left",
  "edge-bar-right",
  "portrait-frame",
  "smoke",
  "subject",
  "shards",
  "date-medallion",
  "brand-one",
  "brand-two",
  "brand-three",
  "grain",
];
const REMOVABLE_COMPILED_ASSET_OBJECT_IDS = new Set(["brand-two"]);
const ASSET_PATCH_FIELDS = blackGoldPartyCssMasterAdapter.refinementPolicy.compiledAssetPatchFields;
const ADDITION_FIELDS = blackGoldPartyCssMasterAdapter.refinementPolicy.additionFields;

function fail(message) {
  throw new Error(`Black Gold Party refinement promotion failed: ${message}`);
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

function finite(value, label) {
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
    "  node scripts/promote-black-gold-party-edits.mjs [authoritative.nflyer] [refinements.json]",
    "",
    `Default input:  ${DEFAULT_INPUT_PATH}`,
    `Default output: ${DEFAULT_OUTPUT_PATH}`,
  ].join("\n");
}

function pickFields(session, format) {
  const fields = {};
  for (const field of BLACK_GOLD_PARTY_REFINEMENT_FIELDS) {
    if (!Object.hasOwn(session, field)) continue;
    fields[field] = clone(session[field]);
  }
  assert(Object.keys(fields).length > 0, `${format} has no approved refinement fields`);
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
    for (const field of ["x", "y", "removed"]) {
      if (!Object.hasOwn(sourceOverride, field)) continue;
      if (field === "removed") {
        assert(sourceOverride.removed === true, `${format} ${objectId}.removed must be true`);
        assert(REMOVABLE_COMPILED_ASSET_OBJECT_IDS.has(objectId), `${format} cannot remove required object ${objectId}`);
      } else {
        finite(sourceOverride[field], `${format} ${objectId}.${field}`);
      }
      override[field] = sourceOverride[field];
    }
    if (Object.keys(override).length > 0) result[objectId] = override;
  }
  return result;
}

function pickAssetFields(asset, fields, format, label) {
  const picked = {};
  for (const field of fields) {
    if (!Object.hasOwn(asset, field)) continue;
    const value = asset[field];
    if (["x", "y", "scale", "opacity", "rotation", "tint", "layerOffset"].includes(field)) {
      finite(value, `${format} ${label}.${field}`);
    }
    picked[field] = clone(value);
  }
  return picked;
}

function extractAssets(session, format, compiledObjectIds, compiledObjectOverrides) {
  const assets = session.emojiList;
  assert(Array.isArray(assets), `${format} session has no emojiList`);
  assert(Array.isArray(session.portraits), `${format} session has no portraits`);
  assert(JSON.stringify(assets) === JSON.stringify(session.portraits), `${format} emojiList and portraits disagree`);

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
      blackGoldPartyCssMasterAdapter.refinementPolicy.additionIdPrefixes.some((prefix) => asset.id.startsWith(prefix)),
      `${format} addition ${asset.id} is not an approved design asset`,
    );
    const addition = pickAssetFields(asset, ADDITION_FIELDS, format, asset.id);
    assert(typeof addition.url === "string" && addition.url.length > 0, `${format} addition ${asset.id} has no URL`);
    additions.push(addition);
  }

  const removeCompiledObjectIds = [];
  for (const objectId of EXPECTED_COMPILED_ASSET_OBJECT_IDS) {
    if (activeCompiledIds.has(objectId)) continue;
    assert(REMOVABLE_COMPILED_ASSET_OBJECT_IDS.has(objectId), `${format} is missing required compiled asset ${objectId}`);
    assert(compiledObjectOverrides[objectId]?.removed === true, `${format} removed ${objectId} has no tombstone`);
    removeCompiledObjectIds.push(objectId);
  }
  assert(
    activeCompiledIds.size + removeCompiledObjectIds.length === EXPECTED_COMPILED_ASSET_OBJECT_IDS.length,
    `${format} exposes an unexpected compiled asset`,
  );

  return { removeCompiledObjectIds, patchCompiledByObjectId, additions };
}

function assertFormatIdentity(session, format, expectedSourceHash) {
  assert(session && typeof session === "object" && !Array.isArray(session), `project has no ${format} session`);
  assert(session.format === format, `${format} session declares format ${session.format}`);
  assert(session.cocoVisualRecipeId === RECIPE_ID, `${format} belongs to ${session.cocoVisualRecipeId}`);
  assert(Number(session.cocoVisualRecipeVersion) === BLACK_GOLD_PARTY_RECIPE.version, `${format} has unsupported recipe version`);
  assert(session.cocoCssCompiler?.sourceHash === expectedSourceHash, `${format} compiler source hash is stale`);
  assert(
    session.cocoCompositionSystem?.compiledDocument?.provenance?.sourceHash === expectedSourceHash,
    `${format} compiled document source hash is stale`,
  );
  const objectIds = new Set(
    (session.cocoCompositionSystem?.compiledDocument?.objects || []).map((object) => object.id),
  );
  assert(objectIds.size > 0, `${format} compiled document has no objects`);
  return objectIds;
}

export async function promoteBlackGoldPartyEdits({
  inputPath = DEFAULT_INPUT_PATH,
  outputPath = DEFAULT_OUTPUT_PATH,
} = {}) {
  const resolvedInputPath = resolve(inputPath);
  const resolvedOutputPath = resolve(outputPath);
  assert(resolvedInputPath !== resolvedOutputPath, "input and output paths must differ");
  const source = await readFile(resolvedInputPath);
  const project = JSON.parse(source.toString("utf8"));
  const state = project?.state;
  assert(state && typeof state === "object" && !Array.isArray(state), "input has no state object");
  assert(typeof state.savedAt === "string" && !Number.isNaN(Date.parse(state.savedAt)), "input has no valid savedAt timestamp");
  assert(state.session?.square && state.session?.story, "input must contain Square and Story sessions");

  const cssSource = await readFile(fileURLToPath(blackGoldPartyCssMasterAdapter.masterPath));
  const sourceHash = sha256(cssSource);
  const formats = {};
  for (const format of FORMATS) {
    const session = state.session[format];
    const objectIds = assertFormatIdentity(session, format, sourceHash);
    const compiledObjectOverrides = extractCompiledObjectOverrides(session, format, objectIds);
    formats[format] = {
      fields: pickFields(session, format),
      compiledObjectOverrides,
      assets: extractAssets(session, format, objectIds, compiledObjectOverrides),
    };
  }

  const refinementDocument = {
    schemaVersion: 1,
    recipeId: RECIPE_ID,
    recipeVersion: BLACK_GOLD_PARTY_RECIPE.version,
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
    const result = await promoteBlackGoldPartyEdits(parseArguments(process.argv.slice(2)));
    const counts = Object.fromEntries(FORMATS.map((format) => [format, {
      overrides: Object.keys(result.refinementDocument.formats[format].compiledObjectOverrides).length,
      patched: Object.keys(result.refinementDocument.formats[format].assets.patchCompiledByObjectId).length,
      added: result.refinementDocument.formats[format].assets.additions.length,
      removed: result.refinementDocument.formats[format].assets.removeCompiledObjectIds.length,
    }]));
    console.log(
      `Promoted ${result.refinementDocument.sourceProjectSha256} to ${result.outputPath} `
      + `(${counts.square.overrides} overrides/${counts.square.patched} patched/${counts.square.added} added/${counts.square.removed} removed Square; `
      + `${counts.story.overrides} overrides/${counts.story.patched} patched/${counts.story.added} added/${counts.story.removed} removed Story)`,
    );
  }
}
