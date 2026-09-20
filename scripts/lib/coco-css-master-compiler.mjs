import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractCssMaster } from "./coco-css-browser-extractor.mjs";
import { bindSemanticRoles } from "./coco-semantic-binder.mjs";
import { createPortableCocoProject, materializeCocoDocument } from "./coco-materializer.mjs";

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const clone = (value) => JSON.parse(JSON.stringify(value));

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(`CSS master compile failed: ${message}`);
}

function asPath(value) {
  return value instanceof URL ? fileURLToPath(value) : resolve(String(value));
}

function assertOnlyKeys(value, allowed, label) {
  assert(isRecord(value), `${label} must be an object`);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  assert(unexpected.length === 0, `${label} contains unsupported keys: ${unexpected.join(", ")}`);
}

function validateFiniteFields(value, fields, label) {
  for (const field of fields) {
    if (!own(value, field)) continue;
    assert(Number.isFinite(Number(value[field])), `${label}.${field} must be finite`);
  }
}

function validateRefinementDocument(document, adapter, sourceHash) {
  assert(isRecord(document), "format refinements must be an object");
  assertOnlyKeys(
    document,
    new Set([
      "schemaVersion",
      "recipeId",
      "recipeVersion",
      "sourceHash",
      "sourceProjectSha256",
      "sourceSavedAt",
      "formats",
    ]),
    "format refinements",
  );
  assert(document.schemaVersion === 1, "format refinements need schemaVersion 1");
  assert(document.recipeId === adapter.id, `format refinements target ${document.recipeId || "an unknown recipe"}, expected ${adapter.id}`);
  assert(document.recipeVersion === adapter.recipe.version, `format refinements target recipe version ${document.recipeVersion}, expected ${adapter.recipe.version}`);
  assert(document.sourceHash === sourceHash, "format refinements were approved against a different CSS master");
  assert(/^[a-f0-9]{64}$/.test(String(document.sourceProjectSha256 || "")), "format refinements need the authoritative project SHA-256");
  assert(typeof document.sourceSavedAt === "string" && document.sourceSavedAt.length > 0, "format refinements need the authoritative save timestamp");
  assert(isRecord(document.formats), "format refinements need formats");
  assertOnlyKeys(document.formats, new Set(["square", "story"]), "format refinements.formats");
  for (const format of ["square", "story"]) {
    assert(isRecord(document.formats[format]), `format refinements need ${format}`);
  }
  return document;
}

async function resolveRefinementDocument(adapter, overrides, sourceHash) {
  let document;
  if (own(overrides, "formatRefinements")) {
    document = overrides.formatRefinements;
  } else if (adapter.refinementPath) {
    document = JSON.parse(await readFile(asPath(adapter.refinementPath), "utf8"));
  }
  if (document === false || document == null || (isRecord(document) && Object.keys(document).length === 0)) return null;
  return validateRefinementDocument(document, adapter, sourceHash);
}

function validateOverrideValue(value, label) {
  assert(isRecord(value), `${label} must be an object`);
  validateFiniteFields(value, ["x", "y", "layerZ"], label);
  if (own(value, "removed")) assert(typeof value.removed === "boolean", `${label}.removed must be boolean`);
}

function validateAssetValue(value, label) {
  validateFiniteFields(value, ["x", "y", "scale", "opacity", "rotation", "tint", "layerOffset"], label);
  if (own(value, "locked")) assert(typeof value.locked === "boolean", `${label}.locked must be boolean`);
  if (own(value, "url")) assert(typeof value.url === "string" && value.url.length > 0, `${label}.url must be non-empty`);
}

/**
 * Applies only the editor-authored values explicitly approved by an adapter.
 * Compiler IR, recipe identity, authority, and layout-session containers cannot
 * be supplied by the refinement document.
 */
export function applyCompiledMasterRefinement({ variant, document, format, refinement, policy }) {
  assert(isRecord(refinement), `${format} refinement must be an object`);
  assertOnlyKeys(refinement, new Set(["fields", "compiledObjectOverrides", "assets"]), `${format} refinement`);

  const allowedFields = new Set(policy?.fields || []);
  const fields = refinement.fields || {};
  assertOnlyKeys(fields, allowedFields, `${format} refinement.fields`);
  for (const [field, value] of Object.entries(fields)) variant[field] = clone(value);

  const documentObjectIds = new Set(document.objects.map((object) => object.id));
  const allowedOverrideFields = new Set(policy?.compiledObjectOverrideFields || ["x", "y", "layerZ", "removed"]);
  const refinedOverrides = refinement.compiledObjectOverrides || {};
  assert(isRecord(refinedOverrides), `${format} refinement.compiledObjectOverrides must be an object`);
  const compiledObjectOverrides = clone(variant.cocoCompositionSystem.compiledObjectOverrides || {});
  for (const [objectId, objectOverride] of Object.entries(refinedOverrides)) {
    assert(documentObjectIds.has(objectId), `${format} refinement overrides unknown compiled object ${objectId}`);
    assertOnlyKeys(objectOverride, allowedOverrideFields, `${format} refinement.compiledObjectOverrides.${objectId}`);
    validateOverrideValue(objectOverride, `${format} refinement.compiledObjectOverrides.${objectId}`);
    compiledObjectOverrides[objectId] = {
      ...(compiledObjectOverrides[objectId] || {}),
      ...clone(objectOverride),
    };
  }
  variant.cocoCompositionSystem.compiledObjectOverrides = compiledObjectOverrides;

  const assets = refinement.assets || {};
  assertOnlyKeys(assets, new Set(["removeCompiledObjectIds", "patchCompiledByObjectId", "additions"]), `${format} refinement.assets`);
  const removeCompiledObjectIds = assets.removeCompiledObjectIds || [];
  const patchCompiledByObjectId = assets.patchCompiledByObjectId || {};
  const additions = assets.additions || [];
  assert(Array.isArray(removeCompiledObjectIds), `${format} refinement.assets.removeCompiledObjectIds must be an array`);
  assert(isRecord(patchCompiledByObjectId), `${format} refinement.assets.patchCompiledByObjectId must be an object`);
  assert(Array.isArray(additions), `${format} refinement.assets.additions must be an array`);

  const baseAssets = clone(variant.emojiList || []);
  const compiledAssetIds = new Set(baseAssets.map((asset) => asset.cocoCompiledObjectId).filter(Boolean));
  const removeSet = new Set(removeCompiledObjectIds);
  assert(removeSet.size === removeCompiledObjectIds.length, `${format} refinement has duplicate asset removals`);
  for (const objectId of removeSet) {
    assert(compiledAssetIds.has(objectId), `${format} refinement removes unknown compiled asset ${objectId}`);
    assert(refinedOverrides[objectId]?.removed === true, `${format} refinement removal ${objectId} needs a removed:true object override`);
  }

  const allowedAssetPatchFields = new Set(policy?.compiledAssetPatchFields || [
    "x", "y", "scale", "opacity", "rotation", "locked", "blendMode", "tint", "tintMode", "layerOffset",
  ]);
  const patchedObjectIds = new Set();
  const canonicalAssets = baseAssets
    .filter((asset) => !removeSet.has(asset.cocoCompiledObjectId))
    .map((asset) => {
      const objectId = asset.cocoCompiledObjectId;
      const patch = objectId ? patchCompiledByObjectId[objectId] : undefined;
      if (!patch) return asset;
      assertOnlyKeys(patch, allowedAssetPatchFields, `${format} refinement.assets.patchCompiledByObjectId.${objectId}`);
      validateAssetValue(patch, `${format} refinement.assets.patchCompiledByObjectId.${objectId}`);
      patchedObjectIds.add(objectId);
      return { ...asset, ...clone(patch) };
    });

  // Some recipe surfaces are structural rather than editor artwork. Keep
  // those assets locked even when an imported refinement was saved from a
  // session where the lock was toggled off. This is intentionally adapter
  // owned so other recipes retain their authored lock behavior.
  const lockedCompiledObjectIds = new Set(policy?.lockedCompiledObjectIds || []);
  for (const asset of canonicalAssets) {
    if (lockedCompiledObjectIds.has(asset.cocoCompiledObjectId)) asset.locked = true;
  }
  const unknownLockedObjectIds = [...lockedCompiledObjectIds].filter(
    (objectId) => !canonicalAssets.some((asset) => asset.cocoCompiledObjectId === objectId),
  );
  assert(
    unknownLockedObjectIds.length === 0,
    `${format} refinement locks missing compiled assets: ${unknownLockedObjectIds.join(", ")}`,
  );
  const unknownPatches = Object.keys(patchCompiledByObjectId).filter((objectId) => !patchedObjectIds.has(objectId));
  assert(unknownPatches.length === 0, `${format} refinement patches missing or removed compiled assets: ${unknownPatches.join(", ")}`);

  const allowedAdditionFields = new Set(policy?.additionFields || [
    "id", "url", "x", "y", "scale", "opacity", "rotation", "locked", "blendMode", "isFlare",
    "isSticker", "isDesignElement", "label", "layerOffset", "showLabel", "hitTestMode", "svgTemplate", "iconColor",
  ]);
  const additionIdPrefixes = policy?.additionIdPrefixes || ["flare_", "design_"];
  const assetIds = new Set(canonicalAssets.map((asset) => asset.id));
  for (const addition of additions) {
    assertOnlyKeys(addition, allowedAdditionFields, `${format} refinement asset addition`);
    assert(typeof addition.id === "string" && addition.id.length > 0, `${format} refinement asset addition needs an id`);
    assert(additionIdPrefixes.some((prefix) => addition.id.startsWith(prefix)), `${format} refinement asset id ${addition.id} is not approved`);
    assert(!own(addition, "cocoCompiledObjectId"), `${format} refinement additions cannot impersonate compiled assets`);
    assert(!assetIds.has(addition.id), `${format} refinement has duplicate asset id ${addition.id}`);
    validateAssetValue(addition, `${format} refinement asset ${addition.id}`);
    assetIds.add(addition.id);
    canonicalAssets.push(clone(addition));
  }

  variant.emojiList = canonicalAssets;
  variant.portraits = clone(canonicalAssets);
  return variant;
}

export async function compileCssMaster(adapter, overrides = {}) {
  assert(adapter?.id, "adapter needs an id");
  assert(adapter?.masterPath, `${adapter.id} needs a masterPath`);
  assert(adapter?.outputPath, `${adapter.id} needs an outputPath`);
  assert(adapter?.recipe, `${adapter.id} needs a recipe`);
  const masterPath = asPath(overrides.masterPath || adapter.masterPath);
  const outputPath = asPath(overrides.outputPath || adapter.outputPath);
  const publicRoot = asPath(overrides.publicRoot || adapter.publicRoot || resolve(dirname(masterPath), "../.."));
  const source = await readFile(masterPath);
  const sourceHash = createHash("sha256").update(source).digest("hex");
  const refinementDocument = await resolveRefinementDocument(adapter, overrides, sourceHash);
  const compileFormat = async (format) => {
    const canvas = adapter.recipe.runtime.formats[format].canvas;
    const extracted = await extractCssMaster({
      id: adapter.id,
      masterPath,
      publicRoot,
      format,
      canvas,
      sourceHash,
    });
    const document = bindSemanticRoles(extracted, adapter.semanticRoles, adapter.fontMap);
    const expectedAspect = Number(canvas.width) / Number(canvas.height);
    const renderedAspect = Number(document.canvas.width) / Number(document.canvas.height);
    if (adapter.requireFormatCanvas !== false) {
      assert(document.provenance.renderedFormat === format, `${format} rendered data-format ${document.provenance.renderedFormat || "is missing"}`);
      assert(Math.abs(expectedAspect - renderedAspect) < 0.001, `${format} rendered aspect ${renderedAspect}, expected ${expectedAspect}`);
    }
    if (adapter.allowRemoteResources !== true) {
      assert((document.provenance.externalRequests || []).length === 0, `${format} requested remote resources: ${(document.provenance.externalRequests || []).join(", ")}`);
    }
    const loadedFontFamilies = new Set(
      (document.provenance.fontFaces || [])
        .filter((face) => face.status === "loaded")
        .map((face) => String(face.family || "").replace(/^['\"]|['\"]$/g, "").toLowerCase()),
    );
    const missingFonts = (adapter.requiredFonts || []).filter(
      (family) => !loadedFontFamilies.has(String(family).replace(/^['\"]|['\"]$/g, "").toLowerCase()),
    );
    assert(missingFonts.length === 0, `${format} did not load required fonts: ${missingFonts.join(", ")}`);
    const requiredRoles = new Set(adapter.requiredRoles || []);
    const roleCounts = new Map();
    for (const object of document.objects) {
      if (object.semanticRole) roleCounts.set(object.semanticRole, (roleCounts.get(object.semanticRole) || 0) + 1);
      requiredRoles.delete(object.semanticRole);
    }
    assert(requiredRoles.size === 0, `${format} is missing roles: ${[...requiredRoles].join(", ")}`);
    const uniqueRoles = adapter.uniqueRoles === false
      ? []
      : adapter.uniqueRoles || adapter.requiredRoles || [];
    const duplicateRoles = uniqueRoles.filter((role) => (roleCounts.get(role) || 0) > 1);
    assert(duplicateRoles.length === 0, `${format} repeats unique roles: ${duplicateRoles.join(", ")}`);
    assert(document.report.unsupported === 0, `${format} contains unsupported objects`);
    const unloadedImages = document.objects
      .filter((object) => (object.kind === "image" || object.kind === "texture") && (!object.image?.naturalWidth || !object.image?.naturalHeight))
      .map((object) => object.id);
    assert(unloadedImages.length === 0, `${format} has unloaded image assets: ${unloadedImages.join(", ")}`);
    if (adapter.failOnWarnings !== false) {
      assert(document.report.warnings.length === 0, `${format} has browser warnings: ${document.report.warnings.join(" | ")}`);
    }
    const variant = materializeCocoDocument({
      document,
      recipe: adapter.recipe,
      eventBrief: adapter.eventBrief,
      palette: adapter.palette || adapter.recipe.runtime.palette,
      authority: adapter.recipe.runtime.authority,
      editorTextScale: adapter.editorTextScale,
      editorTextScales: adapter.editorTextScales,
      nativeQr: adapter.nativeQr,
    });
    const refinement = refinementDocument?.formats?.[format];
    return refinement
      ? applyCompiledMasterRefinement({
        variant,
        document,
        format,
        refinement,
        policy: adapter.refinementPolicy,
      })
      : variant;
  };
  const square = await compileFormat("square");
  const story = await compileFormat("story");
  const project = createPortableCocoProject({ square, story });
  await writeFile(outputPath, `${JSON.stringify(project, null, 2)}\n`, "utf8");
  return { project, sourceHash, square, story };
}
