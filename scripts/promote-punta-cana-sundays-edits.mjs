import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PUNTA_CANA_SUNDAYS_RECIPE } from "../lib/recipes/puntaCanaSundays.ts";

const RECIPE_ID = "punta-cana-sundays";
const FORMATS = ["square", "story"];
const DEFAULT_INPUT_PATH = join(homedir(), "Desktop", `${RECIPE_ID}-updated.nflyer`);
const DEFAULT_OUTPUT_PATH = fileURLToPath(
  new URL(`../public/generated-flyers/${RECIPE_ID}-refinements.json`, import.meta.url),
);
const SOCIAL_ICON_TOP_LAYER_OFFSET = 180;
const EXPECTED_COMPILED_ASSET_OBJECT_IDS = [
  "background",
  "subjectGlow",
  "foliageFrame",
  "foliageForeground",
  "barcode",
  "subject",
  "dotGridLeft",
  "dotGridRight",
  "footerBand",
];
const OVERRIDE_FIELDS = ["x", "y"];

const FORMAT_FIELD_ALLOWLIST = {
  square: [
    "headAlign",
    "align",
    "bodyFamily",
    "detailsFamily",
    "bodySize",
    "detailsSize",
    "detailsRotate",
    "detailsTracking",
    "bodyTracking",
    "detailsUppercase",
    "details2Family",
    "venueSize",
    "rightRailSize",
    "leftRailX",
    "leftRailY",
    "compliance",
    "complianceEnabled",
    "qrEnabled",
    "qrX",
    "qrY",
    "qrScale",
    "cocoRushVenueStyles",
    "headShadow",
    "headShadowStrength",
    "head2Shadow",
    "head2ShadowStrength",
    "detailsShadow",
    "detailsShadowStrength",
    "details2Shadow",
    "details2ShadowStrength",
    "venueShadow",
    "venueShadowStrength",
    "vignette",
    "vignetteStrength",
    "haze",
    "grade",
  ],
  story: [
    "headlineSize",
    "headSize",
    "headManualPx",
    "headMaxPx",
    "headAlign",
    "align",
    "head2Size",
    "head2SizePx",
    "bodyFamily",
    "detailsFamily",
    "bodySize",
    "detailsSize",
    "detailsLineHeight",
    "detailsRotate",
    "detailsTracking",
    "bodyTracking",
    "details2Family",
    "details2Color",
    "venueAddress",
    "venueSize",
    "rightRailSize",
    "cocoRushVenueStyles",
    "cocoSocialHandleSize",
    "cocoSocialHandleAlign",
    "cocoSocialHandleRotation",
    "cocoManualTextColorRoles",
    "headShadow",
    "headShadowStrength",
    "head2Shadow",
    "head2ShadowStrength",
    "detailsShadow",
    "detailsShadowStrength",
    "details2Shadow",
    "details2ShadowStrength",
    "venueShadow",
    "venueShadowStrength",
    "vignette",
    "vignetteStrength",
    "haze",
    "grade",
  ],
};

const COMPILED_ASSET_PATCH_FIELDS = {
  square: {
    background: ["x", "y"],
    barcode: ["x", "y"],
    dotGridLeft: ["x", "y", "scale"],
    dotGridRight: ["scale"],
    foliageForeground: ["scale"],
    foliageFrame: ["x", "y", "scale"],
    footerBand: ["x", "y", "scale"],
    subject: ["x", "y"],
  },
  story: {
    dotGridLeft: ["x", "y", "scale"],
    dotGridRight: ["x", "y", "scale"],
    foliageForeground: ["x", "y", "scale"],
    foliageFrame: ["x", "y", "scale"],
    footerBand: ["x", "y", "scale"],
    subject: ["x", "y", "scale"],
  },
};

const ADDITION_FIELDS = [
  "id",
  "url",
  "x",
  "y",
  "scale",
  "opacity",
  "rotation",
  "locked",
  "blendMode",
  "isFlare",
  "isSticker",
  "isNightlifeGraphic",
  "label",
  "layerOffset",
  "showLabel",
  "hitTestMode",
  "svgTemplate",
  "iconColor",
];

function fail(message) {
  throw new Error(`Punta Cana Sundays refinement promotion failed: ${message}`);
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
      options.inputPath = parsed.value;
      index += parsed.consumed;
      continue;
    }
    if (argument === "--output" || argument.startsWith("--output=")) {
      const parsed = readOption(args, index, "--output");
      options.outputPath = parsed.value;
      index += parsed.consumed;
      continue;
    }
    if (argument === "--expected-sha256" || argument.startsWith("--expected-sha256=")) {
      const parsed = readOption(args, index, "--expected-sha256");
      options.expectedSha256 = parsed.value;
      index += parsed.consumed;
      continue;
    }
    assert(!argument.startsWith("-"), `unknown option ${argument}`);
    positional.push(argument);
    index += 1;
  }
  assert(positional.length <= 2, "expected at most an input path and output path");
  assert(!(options.inputPath && positional[0]), "input path was provided twice");
  assert(!(options.outputPath && positional[1]), "output path was provided twice");
  return {
    inputPath: resolve(options.inputPath || positional[0] || DEFAULT_INPUT_PATH),
    outputPath: resolve(options.outputPath || positional[1] || DEFAULT_OUTPUT_PATH),
    expectedSha256: options.expectedSha256 ? String(options.expectedSha256).toLowerCase() : undefined,
  };
}

function usage() {
  return [
    "Usage:",
    "  node scripts/promote-punta-cana-sundays-edits.mjs [authoritative.nflyer] [refinements.json] [--expected-sha256 <sha256>]",
    "",
    `Default input:  ${DEFAULT_INPUT_PATH}`,
    `Default output: ${DEFAULT_OUTPUT_PATH}`,
    "",
    "The input project is read only. Pass --expected-sha256 to pin promotion to an exact approved file.",
  ].join("\n");
}

function pickFields(session, format) {
  return Object.fromEntries(FORMAT_FIELD_ALLOWLIST[format].map((field) => {
    assert(Object.hasOwn(session, field), `${format} active session is missing approved field ${field}`);
    // The editor save path currently updates the headline aliases but can
    // leave headManualPx stale. Reopening reads headManualPx, so normalize it
    // from the visible approved headline size during promotion.
    if (format === "story" && field === "headManualPx") {
      assertFiniteNumber(session.headlineSize, `${format} headlineSize`);
      return [field, session.headlineSize];
    }
    // Details spacing has the same legacy alias split: the save payload writes
    // detailsTracking while reopening consumes bodyTracking.
    if (field === "bodyTracking") {
      assertFiniteNumber(session.detailsTracking, `${format} detailsTracking`);
      return [field, session.detailsTracking];
    }
    return [field, clone(session[field])];
  }));
}

function extractCompiledObjectOverrides(session, format, compiledObjectIds) {
  const source = session.cocoCompositionSystem?.compiledObjectOverrides || {};
  assert(source && typeof source === "object" && !Array.isArray(source), `${format} overrides must be an object`);
  const result = {};
  for (const objectId of Object.keys(source).sort()) {
    assert(compiledObjectIds.has(objectId), `${format} override targets unknown object ${objectId}`);
    const override = source[objectId];
    const unexpected = Object.keys(override).filter((field) => !OVERRIDE_FIELDS.includes(field));
    assert(unexpected.length === 0, `${format} override ${objectId} contains unapproved fields: ${unexpected.join(", ")}`);
    result[objectId] = {};
    for (const field of OVERRIDE_FIELDS) {
      if (!Object.hasOwn(override, field)) continue;
      assertFiniteNumber(override[field], `${format} override ${objectId}.${field}`);
      result[objectId][field] = override[field];
    }
    assert(Object.keys(result[objectId]).length > 0, `${format} override ${objectId} is empty`);
  }
  return result;
}

function socialPlatformForAsset(asset) {
  const identity = [asset?.id, asset?.label].filter(Boolean).join(" ").toLowerCase();
  if (identity.includes("instagram")) return "instagram";
  if (identity.includes("facebook")) return "facebook";
  if (identity.includes("youtube")) return "youtube";
  return null;
}

function projectAddition(asset, format) {
  assert(asset && typeof asset === "object" && !Array.isArray(asset), `${format} addition must be an object`);
  assert(typeof asset.id === "string" && asset.id.length > 0, `${format} addition needs an id`);
  assert(typeof asset.url === "string" && asset.url.length > 0, `${format} addition ${asset.id} needs a url`);
  assert(asset.id.startsWith("flare_") || asset.id.startsWith("sticker_"), `${format} addition ${asset.id} is not approved`);
  assert(asset.isFlare === true || asset.isSticker === true, `${format} addition ${asset.id} is not a flare or sticker`);
  for (const field of ["x", "y", "scale"]) assertFiniteNumber(asset[field], `${format} addition ${asset.id}.${field}`);

  const projected = {};
  for (const field of ADDITION_FIELDS) {
    if (Object.hasOwn(asset, field)) projected[field] = clone(asset[field]);
  }
  const socialPlatform = socialPlatformForAsset(asset);
  if (socialPlatform) {
    assert(asset.isSticker === true, `${format} social addition ${asset.id} must be a sticker`);
    projected.isSocialIcon = true;
    projected.socialPlatform = socialPlatform;
    projected.layerOffset = SOCIAL_ICON_TOP_LAYER_OFFSET;
    projected.showLabel = false;
  }
  return projected;
}

function extractAssets(session, format, compiledObjectIds) {
  assert(Array.isArray(session.emojiList), `${format} active session has no emojiList`);
  assert(Array.isArray(session.portraits), `${format} active session has no portraits`);
  assert(JSON.stringify(session.emojiList) === JSON.stringify(session.portraits), `${format} emojiList and portraits disagree`);
  const compiledByObjectId = new Map();
  const additions = [];
  const assetIds = new Set();
  for (const asset of session.emojiList) {
    assert(!assetIds.has(asset.id), `${format} has duplicate asset id ${asset.id}`);
    assetIds.add(asset.id);
    if (asset.cocoCompiledObjectId) {
      const objectId = String(asset.cocoCompiledObjectId);
      assert(compiledObjectIds.has(objectId), `${format} asset ${asset.id} targets unknown object ${objectId}`);
      assert(!compiledByObjectId.has(objectId), `${format} repeats compiled asset ${objectId}`);
      compiledByObjectId.set(objectId, asset);
    } else {
      additions.push(projectAddition(asset, format));
    }
  }
  assert(compiledByObjectId.size === EXPECTED_COMPILED_ASSET_OBJECT_IDS.length, `${format} compiled asset count changed`);
  for (const objectId of EXPECTED_COMPILED_ASSET_OBJECT_IDS) {
    assert(compiledByObjectId.has(objectId), `${format} is missing compiled asset ${objectId}`);
  }

  const patchCompiledByObjectId = {};
  for (const [objectId, fields] of Object.entries(COMPILED_ASSET_PATCH_FIELDS[format])) {
    const asset = compiledByObjectId.get(objectId);
    patchCompiledByObjectId[objectId] = {};
    for (const field of fields) {
      assertFiniteNumber(asset[field], `${format} asset ${objectId}.${field}`);
      patchCompiledByObjectId[objectId][field] = asset[field];
    }
  }
  return {
    removeCompiledObjectIds: [],
    patchCompiledByObjectId,
    additions,
  };
}

function assertFormatIdentity(session, format, expectedSourceHash) {
  assert(session && typeof session === "object" && !Array.isArray(session), `project has no ${format} session`);
  assert(session.format === format, `${format} session declares format ${session.format}`);
  assert(session.cocoVisualRecipeId === RECIPE_ID, `${format} session belongs to ${session.cocoVisualRecipeId}`);
  assert(Number(session.cocoVisualRecipeVersion) === PUNTA_CANA_SUNDAYS_RECIPE.version, `${format} recipe version is stale`);
  assert(Number(session.cocoVisualRecipeMaterializedVersion) === PUNTA_CANA_SUNDAYS_RECIPE.version, `${format} materialized version is stale`);
  const compiler = session.cocoCssCompiler;
  const document = session.cocoCompositionSystem?.compiledDocument;
  assert(compiler?.sourceHash === expectedSourceHash, `${format} compiler sourceHash is stale`);
  assert(compiler?.ir?.provenance?.sourceHash === expectedSourceHash, `${format} compiler IR sourceHash is stale`);
  assert(document?.provenance?.sourceHash === expectedSourceHash, `${format} compiled document sourceHash is stale`);
  assert(JSON.stringify(compiler.ir) === JSON.stringify(document), `${format} compiler IR and compiled document disagree`);
  return new Set(document.objects.map((object) => object.id));
}

async function assertDifferentFiles(inputPath, outputPath) {
  assert(inputPath !== outputPath, "input and output paths must be different");
  const inputStat = await stat(inputPath);
  try {
    const outputStat = await stat(outputPath);
    assert(inputStat.dev !== outputStat.dev || inputStat.ino !== outputStat.ino, "input and output resolve to the same file");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function promotePuntaCanaSundaysEdits({
  inputPath = DEFAULT_INPUT_PATH,
  outputPath = DEFAULT_OUTPUT_PATH,
  expectedSha256,
  write = true,
} = {}) {
  const resolvedInputPath = resolve(inputPath);
  const resolvedOutputPath = resolve(outputPath);
  await assertDifferentFiles(resolvedInputPath, resolvedOutputPath);
  const source = await readFile(resolvedInputPath);
  const sourceProjectSha256 = sha256(source);
  if (expectedSha256) {
    assertSha256(expectedSha256, "expected source project hash");
    assert(sourceProjectSha256 === String(expectedSha256).toLowerCase(), `source SHA-256 is ${sourceProjectSha256}`);
  }
  let project;
  try {
    project = JSON.parse(source.toString("utf8"));
  } catch (error) {
    fail(`input is not valid JSON (${error.message})`);
  }
  const state = project?.state;
  assert(state && typeof state === "object" && !Array.isArray(state), "input has no state object");
  assert(typeof state.savedAt === "string" && !Number.isNaN(Date.parse(state.savedAt)), "input savedAt is invalid");
  const expectedSourceHash = PUNTA_CANA_SUNDAYS_RECIPE.measurementReference?.measurements?.sourceSha256;
  assertSha256(expectedSourceHash, "recipe sourceHash");

  const formats = {};
  for (const format of FORMATS) {
    const session = state.session?.[format];
    const compiledObjectIds = assertFormatIdentity(session, format, expectedSourceHash);
    formats[format] = {
      fields: pickFields(session, format),
      compiledObjectOverrides: extractCompiledObjectOverrides(session, format, compiledObjectIds),
      assets: extractAssets(session, format, compiledObjectIds),
    };
  }
  assert(formats.square.assets.additions.length === 0, "Square unexpectedly contains authored additions");
  assert(formats.story.assets.additions.length === 4, "Story must contain the approved flare and three social icons");

  const refinementDocument = {
    schemaVersion: 1,
    recipeId: RECIPE_ID,
    recipeVersion: PUNTA_CANA_SUNDAYS_RECIPE.version,
    sourceHash: expectedSourceHash,
    sourceProjectSha256,
    sourceSavedAt: state.savedAt,
    formats,
  };
  if (write) {
    assert(dirname(resolvedOutputPath) !== resolvedOutputPath, "output path has no parent directory");
    await writeFile(resolvedOutputPath, `${JSON.stringify(refinementDocument, null, 2)}\n`, "utf8");
  }
  return { inputPath: resolvedInputPath, outputPath: resolvedOutputPath, refinementDocument };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
  } else {
    const result = await promotePuntaCanaSundaysEdits(options);
    console.log(
      `Promoted read-only source ${result.refinementDocument.sourceProjectSha256} to ${result.outputPath} `
      + `(${Object.keys(result.refinementDocument.formats.square.compiledObjectOverrides).length} Square moves; `
      + `${Object.keys(result.refinementDocument.formats.story.compiledObjectOverrides).length} Story moves; `
      + `${result.refinementDocument.formats.story.assets.additions.length} Story additions)`,
    );
  }
}
