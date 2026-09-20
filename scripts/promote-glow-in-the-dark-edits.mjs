import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { GLOW_IN_THE_DARK_RECIPE } from "../lib/recipes/glowInTheDark.ts";

const RECIPE_ID = "glow-in-the-dark";
const FORMATS = ["square", "story"];
const DEFAULT_INPUT_PATH = join(homedir(), "Desktop", `${RECIPE_ID}.nflyer`);
const DEFAULT_OUTPUT_PATH = fileURLToPath(
  new URL(`../public/generated-flyers/${RECIPE_ID}-refinements.json`, import.meta.url),
);
const EXPECTED_COMPILED_ASSET_OBJECT_IDS = [
  "background",
  "glow-wash",
  "smoke-frame",
  "subject-glow",
  "edge-line-left",
  "edge-line-right",
  "subject",
  "footer-band",
];
const REMOVABLE_COMPILED_ASSET_OBJECT_IDS = new Set(["smoke-frame"]);
const OVERRIDE_FIELDS = ["x", "y", "removed"];

const FORMAT_FIELD_ALLOWLIST = {
  square: [
    "detailsUppercase",
    "detailsFamily",
    "head2SizePx",
    "head2Size",
    "dateFamily",
    "subtagFamily",
    "subtagRotate",
    "venueFamily",
    "venueSize",
    "rightRail",
    "leftRailLabelColor",
    "leftRailSize",
    "priceFamily",
    "priceX",
    "priceY",
    "priceAlign",
    "priceLineHeight",
    "priceLabel",
    "priceLabelSize",
    "priceLabelColor",
    "priceLabelBgColor",
    "cocoRushVenueStyles",
  ],
  story: [
    "detailsFamily",
    "bodyFamily",
    "head2SizePx",
    "head2Size",
    "dateFamily",
    "subtagFamily",
    "subtagRotate",
    "venueFamily",
    "venueSize",
    "rightRail",
    "rightRailColor",
    "rightRailAlign",
    "cocoManualTextColorRoles",
    "leftRailLabelBgColor",
    "priceFamily",
    "priceX",
    "priceY",
    "priceAlign",
    "priceLineHeight",
    "priceLabel",
    "priceLabelSize",
    "priceLabelColor",
    "priceLabelBgColor",
    "head2Shadow",
    "head2ShadowStrength",
    "detailsShadow",
    "detailsShadowStrength",
    "details2Shadow",
    "details2ShadowStrength",
    "venueShadow",
    "venueShadowStrength",
    "subtagShadow",
    "subtagShadowStrength",
    "head2Fx",
    "textFx",
    "vignette",
    "vignetteStrength",
    "cocoRushVenueStyles",
  ],
};

const COMPILED_ASSET_PATCH_FIELDS = {
  square: {
    "edge-line-left": ["x", "y", "scale", "opacity", "rotation"],
    "edge-line-right": ["x", "y", "scale", "opacity", "rotation", "tint"],
    subject: ["x", "y", "scale"],
    "footer-band": ["x", "y", "scale"],
  },
  story: {
    "edge-line-left": ["x", "y", "scale", "opacity", "rotation", "tint", "tintMode"],
    "edge-line-right": ["x", "y", "scale", "opacity", "rotation", "tint", "tintMode"],
    subject: ["x", "y", "scale"],
    "footer-band": ["x", "y", "scale"],
  },
};

function fail(message) {
  throw new Error(`Glow refinement promotion failed: ${message}`);
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

function assertSha256(value, label) {
  assert(/^[a-f\d]{64}$/i.test(String(value || "")), `${label} must be a 64-character SHA-256`);
}

function assertFiniteNumber(value, label) {
  assert(typeof value === "number" && Number.isFinite(value), `${label} must be a finite number`);
}

function readOption(args, index, name) {
  const argument = args[index];
  const equalsPrefix = `${name}=`;
  if (argument.startsWith(equalsPrefix)) return { value: argument.slice(equalsPrefix.length), consumed: 1 };
  assert(index + 1 < args.length, `${name} needs a value`);
  return { value: args[index + 1], consumed: 2 };
}

function parseArguments(args) {
  const options = {};
  const positional = [];
  for (let index = 0; index < args.length;) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--input" || argument.startsWith("--input=")) {
      const parsed = readOption(args, index, "--input");
      assert(options.inputPath === undefined, "--input was provided more than once");
      options.inputPath = parsed.value;
      index += parsed.consumed;
      continue;
    }
    if (argument === "--output" || argument.startsWith("--output=")) {
      const parsed = readOption(args, index, "--output");
      assert(options.outputPath === undefined, "--output was provided more than once");
      options.outputPath = parsed.value;
      index += parsed.consumed;
      continue;
    }
    if (argument === "--expected-sha256" || argument.startsWith("--expected-sha256=")) {
      const parsed = readOption(args, index, "--expected-sha256");
      assert(options.expectedSha256 === undefined, "--expected-sha256 was provided more than once");
      options.expectedSha256 = parsed.value;
      index += parsed.consumed;
      continue;
    }
    assert(!argument.startsWith("-"), `unknown option ${argument}`);
    positional.push(argument);
    index += 1;
  }
  assert(positional.length <= 2, "expected at most an input path and output path");
  assert(!(options.inputPath && positional[0]), "input path was provided both positionally and with --input");
  assert(!(options.outputPath && positional[1]), "output path was provided both positionally and with --output");
  return {
    inputPath: resolve(options.inputPath || positional[0] || DEFAULT_INPUT_PATH),
    outputPath: resolve(options.outputPath || positional[1] || DEFAULT_OUTPUT_PATH),
    expectedSha256: options.expectedSha256 ? String(options.expectedSha256).toLowerCase() : undefined,
  };
}

function usage() {
  return [
    "Usage:",
    "  node scripts/promote-glow-in-the-dark-edits.mjs [authoritative.nflyer] [refinements.json] [--expected-sha256 <sha256>]",
    "",
    `Default input:  ${DEFAULT_INPUT_PATH}`,
    `Default output: ${DEFAULT_OUTPUT_PATH}`,
    "",
    "The input project is read only. Pass --expected-sha256 to pin promotion to an exact approved file.",
  ].join("\n");
}

function pickFields(session, format) {
  const fields = {};
  for (const field of FORMAT_FIELD_ALLOWLIST[format]) {
    assert(Object.hasOwn(session, field), `${format} active session is missing approved field ${field}`);
    fields[field] = clone(session[field]);
  }
  return fields;
}

function extractCompiledObjectOverrides(session, format, compiledObjectIds, activeCompiledAssetIds) {
  const source = session.cocoCompositionSystem?.compiledObjectOverrides || {};
  assert(source && typeof source === "object" && !Array.isArray(source), `${format} compiledObjectOverrides must be an object`);
  const result = {};
  for (const objectId of Object.keys(source).sort()) {
    assert(compiledObjectIds.has(objectId), `${format} override targets unknown compiled object ${objectId}`);
    const override = source[objectId];
    assert(override && typeof override === "object" && !Array.isArray(override), `${format} override ${objectId} must be an object`);
    const unexpected = Object.keys(override).filter((field) => !OVERRIDE_FIELDS.includes(field));
    assert(unexpected.length === 0, `${format} override ${objectId} contains unapproved fields: ${unexpected.join(", ")}`);
    const approved = {};
    for (const field of OVERRIDE_FIELDS) {
      if (!Object.hasOwn(override, field)) continue;
      if (field === "removed") {
        assert(override.removed === true, `${format} override ${objectId}.removed must be true when present`);
        assert(REMOVABLE_COMPILED_ASSET_OBJECT_IDS.has(objectId), `${format} cannot remove required compiled object ${objectId}`);
        assert(!activeCompiledAssetIds.has(objectId), `${format} marks active asset ${objectId} as removed`);
      } else {
        assertFiniteNumber(override[field], `${format} override ${objectId}.${field}`);
      }
      approved[field] = override[field];
    }
    assert(Object.keys(approved).length > 0, `${format} override ${objectId} is empty`);
    result[objectId] = approved;
  }
  return result;
}

function assertAddition(asset, format) {
  assert(asset && typeof asset === "object" && !Array.isArray(asset), `${format} addition must be an object`);
  assert(typeof asset.id === "string" && asset.id.length > 0, `${format} addition has no stable id`);
  assert(typeof asset.url === "string" && asset.url.length > 0, `${format} addition ${asset.id} has no url`);
  assert(
    asset.url.startsWith("/") || asset.url.startsWith("data:image/"),
    `${format} addition ${asset.id} must use a project-local or embedded image`,
  );
  assert(!asset.cocoCompiledObjectId, `${format} addition ${asset.id} unexpectedly targets a compiled object`);
  assert(
    asset.isFlare === true || asset.isDesignElement === true,
    `${format} addition ${asset.id} is not an approved flare or design element`,
  );
  assertFiniteNumber(asset.x, `${format} addition ${asset.id}.x`);
  assertFiniteNumber(asset.y, `${format} addition ${asset.id}.y`);
  assertFiniteNumber(asset.scale, `${format} addition ${asset.id}.scale`);
}

function extractAssets(session, format, compiledObjectIds) {
  const assets = session.emojiList;
  assert(Array.isArray(assets), `${format} active session has no emojiList`);
  assert(Array.isArray(session.portraits), `${format} active session has no portraits`);
  assert(
    JSON.stringify(assets) === JSON.stringify(session.portraits),
    `${format} emojiList and portraits disagree; refusing to guess which asset state is authoritative`,
  );
  const assetIds = new Set();
  const activeCompiledAssetIds = new Set();
  const compiledByObjectId = new Map();
  const additions = [];
  for (const asset of assets) {
    assert(asset && typeof asset === "object" && !Array.isArray(asset), `${format} contains an invalid asset`);
    assert(typeof asset.id === "string" && asset.id.length > 0, `${format} contains an asset without an id`);
    assert(!assetIds.has(asset.id), `${format} has duplicate asset id ${asset.id}`);
    assetIds.add(asset.id);
    if (asset.cocoCompiledObjectId) {
      const objectId = String(asset.cocoCompiledObjectId);
      assert(compiledObjectIds.has(objectId), `${format} asset ${asset.id} targets unknown compiled object ${objectId}`);
      assert(!activeCompiledAssetIds.has(objectId), `${format} has more than one active asset for compiled object ${objectId}`);
      activeCompiledAssetIds.add(objectId);
      compiledByObjectId.set(objectId, asset);
    } else {
      assertAddition(asset, format);
      additions.push(clone(asset));
    }
  }

  const expected = new Set(EXPECTED_COMPILED_ASSET_OBJECT_IDS);
  for (const objectId of activeCompiledAssetIds) {
    assert(expected.has(objectId), `${format} exposes unexpected compiled asset ${objectId}`);
  }
  const preliminaryOverrides = session.cocoCompositionSystem?.compiledObjectOverrides || {};
  const removeCompiledObjectIds = EXPECTED_COMPILED_ASSET_OBJECT_IDS.filter((objectId) => {
    if (activeCompiledAssetIds.has(objectId)) return false;
    assert(
      preliminaryOverrides[objectId]?.removed === true,
      `${format} is missing compiled asset ${objectId} without a removal tombstone`,
    );
    assert(REMOVABLE_COMPILED_ASSET_OBJECT_IDS.has(objectId), `${format} cannot remove required compiled asset ${objectId}`);
    return true;
  });

  const patchCompiledByObjectId = {};
  for (const [objectId, fields] of Object.entries(COMPILED_ASSET_PATCH_FIELDS[format])) {
    const asset = compiledByObjectId.get(objectId);
    assert(asset, `${format} is missing patchable compiled asset ${objectId}`);
    const patch = {};
    for (const field of fields) {
      assert(Object.hasOwn(asset, field), `${format} asset ${objectId} is missing approved patch field ${field}`);
      if (field === "tintMode") {
        assert(typeof asset[field] === "string" && asset[field].length > 0, `${format} asset ${objectId}.${field} must be a string`);
      } else {
        assertFiniteNumber(asset[field], `${format} asset ${objectId}.${field}`);
      }
      patch[field] = asset[field];
    }
    patchCompiledByObjectId[objectId] = patch;
  }

  return {
    activeCompiledAssetIds,
    assets: {
      removeCompiledObjectIds,
      patchCompiledByObjectId,
      additions,
    },
  };
}

function assertFormatIdentity(session, format, expectedSourceHash) {
  assert(session && typeof session === "object" && !Array.isArray(session), `project has no active ${format} session`);
  assert(session.format === format, `${format} session declares format ${session.format}`);
  assert(session.cocoVisualRecipeId === RECIPE_ID, `${format} session belongs to ${session.cocoVisualRecipeId}`);
  assert(
    Number(session.cocoVisualRecipeVersion) === Number(GLOW_IN_THE_DARK_RECIPE.version),
    `${format} recipe version ${session.cocoVisualRecipeVersion} does not match ${GLOW_IN_THE_DARK_RECIPE.version}`,
  );
  assert(
    Number(session.cocoVisualRecipeMaterializedVersion) === Number(GLOW_IN_THE_DARK_RECIPE.version),
    `${format} materialized version ${session.cocoVisualRecipeMaterializedVersion} does not match ${GLOW_IN_THE_DARK_RECIPE.version}`,
  );
  const compiler = session.cocoCssCompiler;
  const compiledDocument = session.cocoCompositionSystem?.compiledDocument;
  assert(compiler?.sourceHash === expectedSourceHash, `${format} compiler sourceHash is stale`);
  assert(compiler?.ir?.provenance?.sourceHash === expectedSourceHash, `${format} compiler IR sourceHash is stale`);
  assert(compiledDocument?.provenance?.sourceHash === expectedSourceHash, `${format} compiled document sourceHash is stale`);
  assert(
    JSON.stringify(compiler.ir) === JSON.stringify(compiledDocument),
    `${format} compiler IR and compiled document disagree`,
  );
  const objectIds = new Set();
  for (const object of compiledDocument.objects || []) {
    assert(typeof object?.id === "string" && object.id.length > 0, `${format} compiled document contains an object without an id`);
    assert(!objectIds.has(object.id), `${format} compiled document has duplicate object ${object.id}`);
    objectIds.add(object.id);
  }
  for (const objectId of EXPECTED_COMPILED_ASSET_OBJECT_IDS) {
    assert(objectIds.has(objectId), `${format} compiled document is missing asset object ${objectId}`);
  }
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

export async function promoteGlowInTheDarkEdits({
  inputPath = DEFAULT_INPUT_PATH,
  outputPath = DEFAULT_OUTPUT_PATH,
  expectedSha256,
} = {}) {
  const resolvedInputPath = resolve(inputPath);
  const resolvedOutputPath = resolve(outputPath);
  await assertDifferentFiles(resolvedInputPath, resolvedOutputPath);
  const source = await readFile(resolvedInputPath);
  const sourceProjectSha256 = sha256(source);
  if (expectedSha256) {
    assertSha256(expectedSha256, "expected source project hash");
    assert(
      sourceProjectSha256 === String(expectedSha256).toLowerCase(),
      `source project SHA-256 is ${sourceProjectSha256}, expected ${String(expectedSha256).toLowerCase()}`,
    );
  }

  let project;
  try {
    project = JSON.parse(source.toString("utf8"));
  } catch (error) {
    fail(`input is not valid JSON (${error.message})`);
  }
  const state = project?.state;
  assert(state && typeof state === "object" && !Array.isArray(state), "input has no state object");
  assert(typeof state.savedAt === "string" && state.savedAt.length > 0, "input has no savedAt timestamp");
  assert(!Number.isNaN(Date.parse(state.savedAt)), `input savedAt is invalid: ${state.savedAt}`);
  const sessions = state.session;
  assert(sessions && typeof sessions === "object" && !Array.isArray(sessions), "input has no active session map");

  const sourceHash = GLOW_IN_THE_DARK_RECIPE.measurementReference?.measurements?.sourceSha256;
  assertSha256(sourceHash, "recipe sourceHash");
  const formats = {};
  for (const format of FORMATS) {
    const session = sessions[format];
    const compiledObjectIds = assertFormatIdentity(session, format, sourceHash);
    const extractedAssets = extractAssets(session, format, compiledObjectIds);
    formats[format] = {
      fields: pickFields(session, format),
      compiledObjectOverrides: extractCompiledObjectOverrides(
        session,
        format,
        compiledObjectIds,
        extractedAssets.activeCompiledAssetIds,
      ),
      assets: extractedAssets.assets,
    };
  }

  const refinementDocument = {
    schemaVersion: 1,
    recipeId: RECIPE_ID,
    recipeVersion: GLOW_IN_THE_DARK_RECIPE.version,
    sourceHash,
    sourceProjectSha256,
    sourceSavedAt: state.savedAt,
    formats,
  };
  assert(dirname(resolvedOutputPath) !== resolvedOutputPath, "output path has no parent directory");
  await writeFile(resolvedOutputPath, `${JSON.stringify(refinementDocument, null, 2)}\n`, "utf8");
  return { inputPath: resolvedInputPath, outputPath: resolvedOutputPath, refinementDocument };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    const result = await promoteGlowInTheDarkEdits(options);
    const counts = Object.fromEntries(
      FORMATS.map((format) => [format, {
        removed: result.refinementDocument.formats[format].assets.removeCompiledObjectIds.length,
        patched: Object.keys(result.refinementDocument.formats[format].assets.patchCompiledByObjectId).length,
        added: result.refinementDocument.formats[format].assets.additions.length,
      }]),
    );
    console.log(
      `Promoted read-only source ${result.refinementDocument.sourceProjectSha256} to ${result.outputPath} `
      + `(${counts.square.removed} removed/${counts.square.patched} patched/${counts.square.added} added Square; `
      + `${counts.story.removed} removed/${counts.story.patched} patched/${counts.story.added} added Story)`,
    );
  }
}
