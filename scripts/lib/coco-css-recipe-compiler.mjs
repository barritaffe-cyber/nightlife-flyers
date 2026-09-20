import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const FORMAT_NAMES = ["square", "story"];

export const COCO_SEMANTIC_KEYWORD_RULES = Object.freeze([
  { role: "rsvpLabel", pattern: /\bVIP\s+TABLES?\s*&\s*INFO\b/i },
  { role: "lineupLabel", pattern: /\bMUSIC\s+BY\b/i },
  { role: "offerLabel", pattern: /\bSPECIAL\b/i },
  { role: "doorsLabel", pattern: /\bDOORS?\s+OPEN\b/i },
  { role: "complianceLabel", pattern: /\bID\s+REQUIRED\b/i },
  { role: "compliance", pattern: /(?:\b18\+|\b21\+|\bID\s+REQUIRED\b)/i },
  { role: "dressCode", pattern: /\bDRESS\s+TO\s+IMPRESS\b/i },
  { role: "djLineup", pattern: /\bDJ\s+[\p{L}\p{N}]/iu },
  { role: "offerCopy", pattern: /\b(?:VIP\s+TABLES?|HOOKAH|BOTTLE\s+SERVICE)\b/i },
  { role: "venue", pattern: /\b(?:AVE(?:NUE)?|ST(?:REET)?|ROAD|RD|DISTRICT|DOWNTOWN|CLUB|ROOM)\b/i },
  { role: "time", pattern: /\b\d{1,2}(?::\d{2})?\s*(?:AM|PM)\b/i },
]);

const htmlText = (value) => value
  .replace(/<br\s*\/?>/gi, "\n")
  .replace(/<\/b\s*>/gi, "\n")
  .replace(/<\/span\s*>/gi, "\n")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&nbsp;/gi, " ")
  .split(/\n+/)
  .map((part) => part.replace(/\s+/g, " ").trim())
  .filter(Boolean);

export function classifySemanticTextSegments(
  objectElements,
  objectMap,
  semanticKeywordRules = COCO_SEMANTIC_KEYWORD_RULES,
) {
  return objectElements.map((item) => ({
    objectId: item.objectId,
    stateField: objectMap[item.objectId]?.stateField,
    zone: objectMap[item.objectId]?.zone,
    segments: (item.textSegments || []).map((value, index) => ({
      value,
      lineIndex: index,
      semanticRole:
        semanticKeywordRules.find((rule) => rule.pattern.test(value))?.role ||
        (item.objectId === "headline" ? "headline" :
          item.objectId === "subheadline" ? "subheadline" :
          item.objectId === "date" ? "date" :
          item.objectId === "details" ? "eventDetails" :
          item.objectId),
    })),
  }));
}

const transformText = (value, transform, existingValue = "") => {
  if (transform === "uppercase") return value.toUpperCase();
  if (transform === "lowercase") return value.toLowerCase();
  if (transform === "preserve") return value;
  const preservesUppercase = /[A-Z]/.test(existingValue) && existingValue === existingValue.toUpperCase();
  return preservesUppercase ? value.toUpperCase() : value;
};

/**
 * Applies CSS text to Coco state using declarative adapter rules.
 *
 * Rules are keyed by CSS object ID (preferred) or Coco state field. A rule can
 * split label roles from value roles without teaching the shared compiler what
 * a DJ lineup, offer, RSVP block, or any future recipe-specific object means.
 */
export function applySemanticTextBindings(variant, bindings, bindingRules = {}) {
  for (const binding of bindings) {
    if (!binding.stateField || binding.stateField.includes(".")) continue;
    const segments = binding.segments || [];
    if (!segments.length) continue;
    const rule = bindingRules[binding.objectId] || bindingRules[binding.stateField] || {};
    const valueField = rule.valueField || binding.stateField;
    const labelRoles = new Set(rule.labelRoles || []);
    const labelSegments = segments.filter((segment) => labelRoles.has(segment.semanticRole));
    const valueSegments = segments.filter((segment) => !labelRoles.has(segment.semanticRole));
    const joinWith = rule.joinWith ?? "\n";
    const mappedText = valueSegments.map((segment) => segment.value).join(joinWith);
    variant[valueField] = transformText(mappedText, rule.transform, String(variant[valueField] || ""));

    if (rule.labelField && labelSegments.length) {
      const labelText = labelSegments.map((segment) => segment.value).join(rule.labelJoinWith ?? "\n");
      variant[rule.labelField] = transformText(
        labelText,
        rule.labelTransform ?? rule.transform,
        String(variant[rule.labelField] || ""),
      );
    }

    if (rule.mirror?.field) {
      const mirror = { ...(variant[rule.mirror.field] || {}) };
      if (rule.mirror.valueKey) mirror[rule.mirror.valueKey] = variant[valueField];
      if (rule.mirror.labelKey && rule.labelField) mirror[rule.mirror.labelKey] = variant[rule.labelField] || "";
      variant[rule.mirror.field] = mirror;
    }
  }
  return variant;
}

function assert(condition, message) {
  if (!condition) throw new Error(`CSS recipe compile failed: ${message}`);
}

function readAttribute(source, name) {
  const match = source.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? match[1] ?? match[2] ?? "" : null;
}

export function readSemanticCssMaster(html, geometryScriptId) {
  const objectElements = [];
  const assetElements = [];
  const elementPattern = /<([a-z][\w:-]*)\b([^>]*\bdata-coco-object=(?:"[^"]+"|'[^']+')[^>]*)>/gi;
  for (const match of html.matchAll(elementPattern)) {
    const closingTag = `</${match[1]}>`;
    const contentStart = Number(match.index) + match[0].length;
    const contentEnd = html.toLowerCase().indexOf(closingTag.toLowerCase(), contentStart);
    objectElements.push({
      element: match[1].toLowerCase(),
      objectId: readAttribute(match[2], "data-coco-object"),
      regionId: readAttribute(match[2], "data-region"),
      textSegments: contentEnd >= 0 ? htmlText(html.slice(contentStart, contentEnd)) : [],
    });
  }

  const assetPattern = /<([a-z][\w:-]*)\b([^>]*\bdata-coco-asset=(?:"[^"]+"|'[^']+')[^>]*)>/gi;
  for (const match of html.matchAll(assetPattern)) {
    const regionId = readAttribute(match[2], "data-region");
    for (const assetId of String(readAttribute(match[2], "data-coco-asset") || "").split(/\s+/).filter(Boolean)) {
      assetElements.push({ assetId, element: match[1].toLowerCase(), regionId });
    }
  }

  const escapedId = geometryScriptId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const scriptMatch = html.match(
    new RegExp(`<script[^>]*\\bid=["']${escapedId}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i")
  );
  assert(scriptMatch, `missing geometry contract #${geometryScriptId}`);

  let geometry;
  try {
    geometry = JSON.parse(scriptMatch[1]);
  } catch (error) {
    throw new Error(`CSS recipe compile failed: invalid geometry JSON (${error.message})`);
  }

  return {
    geometry,
    assetElements,
    objectElements,
    sha256: createHash("sha256").update(html).digest("hex"),
  };
}

function validateRect(rect, label) {
  assert(rect && typeof rect === "object", `${label} has no rectangle`);
  for (const key of ["x", "y", "width", "height"]) {
    assert(Number.isFinite(Number(rect[key])), `${label}.${key} is not numeric`);
  }
  assert(Number(rect.width) > 0 && Number(rect.height) > 0, `${label} has an empty rectangle`);
}

function validateElement(element, label) {
  assert(element && typeof element === "object", `${label} has no element contract`);
  assert(element.id, `${label} has no stable ID`);
  assert(["text", "image", "shape", "texture"].includes(element.type), `${label} has an unsupported type`);
  validateRect(element.rect, `${label}.rect`);
  assert(Number.isFinite(Number(element.stacking?.zIndex)), `${label}.stacking.zIndex is not numeric`);
  if (element.type === "text") {
    assert(element.typography?.sourceFamily, `${label} does not preserve its source font family`);
    assert(element.typography?.runtimeFamily, `${label} has no runtime font mapping`);
    assert(Number.isFinite(Number(element.typography?.fontSize)), `${label}.typography.fontSize is not numeric`);
    assert(element.paint?.fill, `${label} has no paint contract`);
    assert(element.transform, `${label} has no transform contract`);
  }
  if (element.type === "image") {
    assert(element.image?.fit, `${label} has no image fit`);
    assert(element.image?.position, `${label} has no image position`);
  }
}

function zonesFromElements(elements) {
  return Object.fromEntries(Object.entries(elements || {}).map(([id, element]) => [id, element.rect]));
}

function resolveFormatElements(geometry, format) {
  const styles = geometry.elementStyles || {};
  const declarations = geometry.formats?.[format]?.elements || Object.fromEntries(
    Object.entries(geometry.formats?.[format]?.zones || {}).map(([id, rect]) => [id, { style: id, rect }]),
  );
  return Object.fromEntries(Object.entries(declarations).map(([id, element]) => {
    const style = element.style ? styles[element.style] : null;
    assert(!element.style || style, `${format}.${id} references missing element style ${element.style}`);
    const typography = style?.typography || element.typography
      ? { ...(style?.typography || {}), ...(geometry.runtimeTypography?.[id] || {}), ...(element.typography || {}) }
      : undefined;
    return [id, { ...(style || {}), ...element, ...(typography ? { typography } : {}), id, style: undefined }];
  }));
}

export function validateSemanticRecipe({ master, objectMap, formatZones, formatElements, recipe }) {
  assert(recipe?.id, "recipe has no stable ID");
  assert(Number(recipe?.version) > 0, `${recipe?.id || "recipe"} has no positive version`);
  assert(master.objectElements.length > 0, "CSS master has no data-coco-object elements");

  const seenMarkupObjects = new Set();
  for (const item of master.objectElements) {
    assert(item.objectId, "data-coco-object cannot be empty");
    assert(!seenMarkupObjects.has(item.objectId), `duplicate CSS object ${item.objectId}`);
    assert(item.regionId, `${item.objectId} needs data-region for measurement`);
    seenMarkupObjects.add(item.objectId);
  }

  const seenStateFields = new Set();
  for (const [objectId, mapping] of Object.entries(objectMap)) {
    assert(seenMarkupObjects.has(objectId), `${objectId} is mapped but absent from CSS markup`);
    assert(mapping?.stateField, `${objectId} has no Coco stateField`);
    assert(!seenStateFields.has(mapping.stateField), `${mapping.stateField} is assigned to multiple CSS objects`);
    seenStateFields.add(mapping.stateField);
    for (const format of FORMAT_NAMES) validateRect(formatZones[format]?.[mapping.zone], `${format}.${objectId}`);
  }

  for (const objectId of seenMarkupObjects) {
    assert(objectMap[objectId], `${objectId} has no Coco object mapping`);
  }

  if (formatElements) {
    for (const format of FORMAT_NAMES) {
      const elements = formatElements[format];
      assert(elements && Object.keys(elements).length > 0, `${format} has no authoritative element contract`);
      for (const [elementId, element] of Object.entries(elements)) {
        assert(element.id === elementId, `${format}.${elementId} stable ID disagrees with its key`);
        validateElement(element, `${format}.${elementId}`);
      }
      for (const objectId of seenMarkupObjects) {
        const elementId = objectMap[objectId]?.zone || objectId;
        assert(elements[elementId], `${format}.${objectId} has no authoritative element contract at ${elementId}`);
      }
      for (const assetId of new Set((master.assetElements || []).map((item) => item.assetId))) {
        assert(elements[assetId], `${format}.${assetId} asset has no authoritative element contract`);
      }
    }
  }

  const seenAssets = new Set();
  for (const item of master.assetElements || []) {
    assert(item.assetId, "data-coco-asset cannot be empty");
    assert(!seenAssets.has(item.assetId), `duplicate CSS asset ${item.assetId}`);
    seenAssets.add(item.assetId);
    for (const format of FORMAT_NAMES) {
      assert(formatZones[format]?.[item.assetId], `${format}.${item.assetId} has no authored asset zone`);
      validateRect(formatZones[format][item.assetId], `${format}.${item.assetId}`);
    }
  }

  assert(master.geometry.deniedUses?.includes("generic layout replacement"), "contract must deny generic layout replacement");
  return true;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const REFINEMENT_PROTECTED_FIELDS = new Set([
  "format",
  "cocoVisualRecipeId",
  "cocoVisualRecipeVersion",
  "cocoVisualRecipeMaterializedVersion",
  "session",
  "cocoLayoutSessions",
]);

function mergeArrayByStableId(baseline, refinement) {
  const refinedById = new Map(refinement.filter((item) => item?.id).map((item) => [item.id, item]));
  const merged = baseline.map((item) => refinedById.has(item?.id) ? clone(refinedById.get(item.id)) : item);
  const baselineIds = new Set(baseline.map((item) => item?.id).filter(Boolean));
  for (const item of refinement) if (!item?.id || !baselineIds.has(item.id)) merged.push(clone(item));
  return merged;
}

function applyFormatRefinement(variant, refinement, coordinateBindings = [], mergeArrayByIdFields = []) {
  if (refinement && typeof refinement === "object") {
    for (const [key, value] of Object.entries(refinement)) {
      if (REFINEMENT_PROTECTED_FIELDS.has(key)) continue;
      variant[key] = mergeArrayByIdFields.includes(key) && Array.isArray(variant[key]) && Array.isArray(value)
        ? mergeArrayByStableId(variant[key], value)
        : clone(value);
    }
  }
  for (const binding of coordinateBindings) {
    const x = Number(variant[binding.xField]);
    const y = Number(variant[binding.yField]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    for (const containerName of ["cocoCompositionSystem", "cocoCompositionMap"]) {
      const container = variant[containerName];
      const rect = container?.rendererZones?.[binding.zone];
      if (rect) container.rendererZones[binding.zone] = { ...rect, x, y };
    }
  }
  return variant;
}

export async function compileSemanticCssRecipe({
  geometryScriptId,
  masterPath,
  objectMap,
  outputPath,
  recipe,
  materializeFormat,
  semanticBindingRules = {},
  semanticKeywordRules = COCO_SEMANTIC_KEYWORD_RULES,
  formatRefinements = {},
  coordinateBindings = [],
  mergeArrayByIdFields = [],
}) {
  const html = await readFile(masterPath, "utf8");
  const master = readSemanticCssMaster(html, geometryScriptId);
  const hasAuthoritativeElements = Boolean(master.geometry.elementStyles) && FORMAT_NAMES.every(
    (format) => master.geometry.formats?.[format]?.elements || master.geometry.formats?.[format]?.zones,
  );
  const formatElements = hasAuthoritativeElements ? {
    square: resolveFormatElements(master.geometry, "square"),
    story: resolveFormatElements(master.geometry, "story"),
  } : null;
  const formatZones = {
    square: formatElements ? zonesFromElements(formatElements.square) : master.geometry.formats?.square?.zones,
    story: formatElements ? zonesFromElements(formatElements.story) : master.geometry.formats?.story?.zones,
  };
  assert(formatZones.square && formatZones.story, "geometry contract must author Square and Story zones");
  for (const format of FORMAT_NAMES) {
    if (formatElements && master.geometry.formats[format].zones) {
      assert(
        stableJson(formatZones[format]) === stableJson(master.geometry.formats[format].zones),
        `${format} zones must be derived from and agree with authoritative elements`,
      );
    }
    assert(
      stableJson(formatZones[format]) === stableJson(recipe.runtime.formats[format].zones),
      `${format} CSS geometry and registered recipe geometry disagree`
    );
    if (formatElements) {
      assert(
        stableJson(formatElements[format]) === stableJson(recipe.runtime.formats[format].elements),
        `${format} CSS elements and registered recipe elements disagree`,
      );
    }
  }
  validateSemanticRecipe({ master, objectMap, formatZones, formatElements, recipe });
  const semanticTextBindings = classifySemanticTextSegments(
    master.objectElements,
    objectMap,
    semanticKeywordRules,
  );

  const compileFormat = (format) => {
    const materializedVariant = applySemanticTextBindings(materializeFormat(format, {
      geometry: master.geometry,
      objectMap,
      sourceHash: master.sha256,
      semanticTextBindings,
      semanticAssets: master.assetElements,
      elements: formatElements?.[format] || null,
    }), semanticTextBindings, semanticBindingRules);
    assert(materializedVariant?.cocoVisualRecipeId === recipe.id, `${format} lost recipe provenance`);
    assert(Number(materializedVariant?.cocoVisualRecipeMaterializedVersion) >= Number(recipe.version), `${format} is not materialized`);
    assert(materializedVariant?.cocoCompositionSystem?.patternId === recipe.runtime.compositionPattern, `${format} has the wrong composition pattern`);
    const materializedAssetRoles = new Set((materializedVariant.portraits || []).map((item) => item.cocoAssetRole).filter(Boolean));
    for (const item of master.assetElements || []) {
      assert(materializedAssetRoles.has(item.assetId), `${format} did not materialize CSS asset ${item.assetId}`);
    }
    const variant = applyFormatRefinement(
      materializedVariant,
      formatRefinements[format],
      coordinateBindings,
      mergeArrayByIdFields,
    );
    assert(variant?.cocoVisualRecipeId === recipe.id, `${format} refinement changed recipe provenance`);
    assert(Number(variant?.cocoVisualRecipeMaterializedVersion) >= Number(recipe.version), `${format} refinement removed materialization`);
    return variant;
  };

  const square = compileFormat("square");
  const story = compileFormat("story");
  const state = {
    ...clone(square),
    savedAt: new Date().toISOString(),
    format: "square",
    sessionDirty: false,
    session: { square: clone(square), story: clone(story) },
    cocoLayoutSessions: {
      square: { [square.cocoCenterLayoutOptionId]: clone(square) },
      story: { [story.cocoCenterLayoutOptionId]: clone(story) },
    },
    portraits: { square: clone(square.portraits), story: clone(story.portraits) },
    emojiList: clone(square.emojiList),
  };
  await writeFile(outputPath, `${JSON.stringify({ state }, null, 2)}\n`, "utf8");
  return { master, state };
}

/** Compile any compliant CSS master through a recipe adapter. */
export async function compileCssRecipeAdapter(adapter, overrides = {}) {
  assert(adapter && typeof adapter === "object", "adapter must export an object");
  assert(adapter.id, "adapter has no stable ID");
  assert(adapter.masterPath, `${adapter.id} adapter has no masterPath`);
  assert(adapter.outputPath, `${adapter.id} adapter has no outputPath`);
  assert(adapter.geometryScriptId, `${adapter.id} adapter has no geometryScriptId`);
  assert(adapter.objectMap, `${adapter.id} adapter has no objectMap`);
  assert(typeof adapter.materializeFormat === "function", `${adapter.id} adapter has no materializeFormat function`);
  let formatRefinements = overrides.formatRefinements;
  if (formatRefinements === undefined && adapter.refinementPath) {
    try {
      const refinementDocument = JSON.parse(await readFile(adapter.refinementPath, "utf8"));
      assert(refinementDocument.recipeId === adapter.id, `${adapter.id} refinement belongs to ${refinementDocument.recipeId}`);
      assert(Number(refinementDocument.recipeVersion) === Number(adapter.recipe?.version), `${adapter.id} refinement version is stale`);
      formatRefinements = refinementDocument.formats || {};
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return compileSemanticCssRecipe({
    ...adapter,
    ...overrides,
    formatRefinements: formatRefinements || {},
    masterPath: overrides.masterPath || adapter.masterPath,
    outputPath: overrides.outputPath || adapter.outputPath,
  });
}
