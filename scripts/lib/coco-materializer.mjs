const ROLE_BINDINGS = Object.freeze({
  presenter: { text: "presenter", enabled: "presenterEnabled", family: "presenterFamily", color: "presenterColor", size: "presenterSize", x: "presenterX", y: "presenterY", align: "presenterAlign", lineHeight: "presenterLineHeight", tracking: "presenterTracking", rotation: "presenterRotation", panel: "presenter", moveTarget: "presenter", zone: "presenter" },
  headline: { text: "headline", family: "headlineFamily", color: "headColor", size: "headManualPx", x: "headX", y: "headY", align: "headAlign", lineHeight: "lineHeight", tracking: "headTracking", rotation: "headRotate", panel: "headline", moveTarget: "headline", zone: "headline" },
  headline2: { text: "head2line", enabled: "head2Enabled", family: "head2Family", color: "head2Color", size: "head2SizePx", x: "head2X", y: "head2Y", align: "head2Align", lineHeight: "head2LineHeight", rotation: "head2Rotate", panel: "head2", moveTarget: "headline2", zone: "script" },
  details: { text: "details", enabled: "detailsEnabled", family: "detailsFamily", color: "detailsColor", size: "detailsSize", x: "detailsX", y: "detailsY", align: "detailsAlign", lineHeight: "detailsLineHeight", tracking: "bodyTracking", rotation: "detailsRotate", panel: "details", moveTarget: "details", zone: "leftInfo" },
  date: { text: "date", enabled: "dateEnabled", family: "dateFamily", color: "dateColor", size: "dateSize", x: "dateX", y: "dateY", align: "dateAlign", lineHeight: "dateLineHeight", rotation: "dateRotation", panel: "date", moveTarget: "date", zone: "date" },
  time: { text: "time", family: "timeFamily", color: "timeColor", size: "timeSize", x: "timeX", y: "timeY", align: "timeAlign", lineHeight: "timeLineHeight", rotation: "timeRotation", panel: "date", moveTarget: "time", zone: "doors" },
  subtag: { text: "subtag", enabled: "subtagEnabled", family: "subtagFamily", color: "subtagTextColor", size: "subtagSize", x: "subtagX", y: "subtagY", align: "subtagAlign", lineHeight: "subtagLineHeight", rotation: "subtagRotate", panel: "subtag", moveTarget: "subtag", zone: "subtag" },
  djLineup: { text: "details2", enabled: "details2Enabled", family: "details2Family", color: "details2Color", size: "details2Size", x: "details2X", y: "details2Y", align: "details2Align", lineHeight: "details2LineHeight", tracking: "details2LetterSpacing", rotation: "details2Rotate", panel: "details2", moveTarget: "details2", zone: "rightInfo" },
  djLineupLabel: { text: "djLineupLabel", family: "djLineupLabelFamily", color: "djLineupLabelColor", size: "djLineupLabelSize", lineHeight: "details2LineHeight", panel: "details2", moveTarget: "details2", zone: "djLineupLabel" },
  venue: { text: "venue", enabled: "venueEnabled", family: "venueFamily", color: "venueColor", size: "venueSize", x: "venueX", y: "venueY", align: "venueAlign", lineHeight: "venueLineHeight", rotation: "venueRotate", panel: "venue", moveTarget: "venue", zone: "venue" },
  address: { text: "venueAddress", family: "venueAddressFamily", color: "venueAddressColor", size: "venueAddressSize", x: "venueAddressX", y: "venueAddressY", align: "venueAddressAlign", lineHeight: "venueAddressLineHeight", rotation: "venueAddressRotation", panel: "venue", moveTarget: "venue", zone: "address" },
  rsvpLabel: { text: "leftRailLabel", family: "leftRailLabelFamily", color: "leftRailLabelColor", size: "leftRailLabelSize", x: "leftRailLabelX", y: "leftRailLabelY", align: "leftRailLabelAlign", lineHeight: "leftRailLabelLineHeight", rotation: "leftRailLabelRotation", panel: "leftRail", moveTarget: "leftRail", zone: "leftRailLabel" },
  rsvp: { text: "leftRail", enabled: "leftRailEnabled", family: "leftRailFamily", color: "leftRailColor", size: "leftRailSize", x: "leftRailX", y: "leftRailY", align: "leftRailAlign", lineHeight: "leftRailLineHeight", rotation: "leftRailRotation", panel: "leftRail", moveTarget: "leftRail", zone: "leftRail" },
  hostedBy: { text: "leftRail", enabled: "leftRailEnabled", family: "leftRailFamily", color: "leftRailColor", size: "leftRailSize", x: "leftRailX", y: "leftRailY", align: "leftRailAlign", lineHeight: "leftRailLineHeight", rotation: "leftRailRotation", panel: "leftRail", moveTarget: "leftRail", zone: "hostedBy" },
  social: { text: "cocoSocialHandle", enabled: "cocoSocialHandleEnabled", family: "cocoSocialHandleFamily", color: "cocoSocialHandleColor", size: "cocoSocialHandleSize", x: "cocoSocialHandleX", y: "cocoSocialHandleY", align: "cocoSocialHandleAlign", lineHeight: "cocoSocialHandleLineHeight", rotation: "cocoSocialHandleRotation", panel: "socialHandle", moveTarget: "socialHandle", zone: "social" },
  compliance: { text: "compliance", enabled: "complianceEnabled", family: "complianceFamily", color: "complianceColor", size: "complianceSize", x: "complianceX", y: "complianceY", align: "complianceAlign", lineHeight: "complianceLineHeight", panel: "compliance", moveTarget: "compliance", zone: "compliance" },
  footerDetails: { text: "rightRail", enabled: "rightRailEnabled", family: "rightRailFamily", color: "rightRailColor", size: "rightRailSize", x: "rightRailX", y: "rightRailY", align: "rightRailAlign", lineHeight: "rightRailLineHeight", rotation: "rightRailRotation", panel: "rightRail", moveTarget: "rightRail", zone: "rightRail" },
  price: { text: "price", enabled: "priceEnabled", family: "priceFamily", color: "priceColor", size: "priceSize", x: "priceX", y: "priceY", align: "priceAlign", lineHeight: "priceLineHeight", panel: "price", moveTarget: "price", zone: "price" },
});

const clone = (value) => JSON.parse(JSON.stringify(value));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function anchorX(bounds, align) {
  if (align === "right") return bounds.x + bounds.width;
  if (align === "center") return bounds.x + bounds.width / 2;
  return bounds.x;
}

function textColor(object) {
  const runColor = object.textRuns?.find((run) => run.color && run.color !== "rgba(0, 0, 0, 0)")?.color;
  return object.paint?.color && object.paint.color !== "rgba(0, 0, 0, 0)"
    ? object.paint.color
    : runColor || "#ffffff";
}

function dataSvg(markup) {
  return `data:image/svg+xml;base64,${Buffer.from(markup).toString("base64")}`;
}

function placeholderSvg(object) {
  const color = object.paint?.backgroundColor && object.paint.backgroundColor !== "rgba(0, 0, 0, 0)"
    ? object.paint.backgroundColor
    : "transparent";
  return dataSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}"/></svg>`);
}

function assetForObject(document, object) {
  const isImage = object.kind === "image" || object.kind === "texture";
  const isLogo = object.assetRole === "logo";
  const url = isImage
    ? object.image.src
    : object.kind === "svg" && object.svg?.markup
      ? dataSvg(object.svg.markup)
      : placeholderSvg(object);
  return {
    id: `coco_css_${document.id}_${document.format}_${object.id}`,
    cocoCompiledObjectId: object.id,
    cocoAssetRole: object.assetRole || object.semanticRole || object.id,
    label: object.binding?.label || object.id,
    url,
    x: object.bounds.x + object.bounds.width / 2,
    y: object.bounds.y + object.bounds.height / 2,
    scale: 1,
    opacity: finite(object.paint?.opacity, 1),
    rotation: finite(object.transform?.rotate),
    locked: !object.editable,
    blendMode: object.paint?.blendMode || "normal",
    isFlare: false,
    isSticker: object.semanticRole !== "subject" && !isLogo,
    isTexture: object.kind === "texture",
    isExtracted: object.semanticRole === "subject",
    isLogo,
    isBrandFace: false,
    isShapeGraphic: object.kind === "shape" || object.kind === "svg",
    isDesignElement: object.semanticRole !== "subject" && !isLogo,
    isSeparator: false,
    isNightlifeGraphic: false,
    layerOffset: finite(object.stacking?.effectiveZIndex, finite(object.stacking?.zIndex)),
    showLabel: false,
    labelBg: true,
    cocoCssBounds: {
      ...object.bounds,
      centerX: object.bounds.x + object.bounds.width / 2,
      centerY: object.bounds.y + object.bounds.height / 2,
    },
    cocoCssFit: object.image?.fit || "fill",
  };
}

function resolveBinding(object) {
  const configured = object.binding ?? {};
  const defaults = ROLE_BINDINGS[object.semanticRole] ?? {};
  return { ...defaults, ...configured };
}

function applyTextObject(variant, object, rendererZones) {
  if (!object.semanticRole) return;
  const binding = resolveBinding(object);
  if (!binding.text) return;
  const typography = object.typography ?? {};
  const align = typography.align === "right" || typography.align === "center" ? typography.align : "left";
  const initial = {
    text: object.text ?? "",
    family: typography.fontFamily,
    color: textColor(object),
    size: finite(typography.fontSizePx, 16),
    x: anchorX(object.bounds, align),
    y: object.bounds.y,
    align,
    lineHeight: finite(typography.lineHeight, 1),
    tracking: finite(typography.letterSpacingEm),
    rotation: finite(object.transform?.rotate),
  };
  object.binding = { ...binding, initial };
  variant[binding.text] = initial.text;
  if (binding.enabled) variant[binding.enabled] = true;
  const setDefault = (field, value) => {
    if (field && variant[field] === undefined) variant[field] = value;
  };
  setDefault(binding.family, initial.family);
  setDefault(binding.color, initial.color);
  setDefault(binding.size, initial.size);
  setDefault(binding.x, initial.x);
  setDefault(binding.y, initial.y);
  setDefault(binding.align, initial.align);
  setDefault(binding.lineHeight, initial.lineHeight);
  setDefault(binding.tracking, initial.tracking);
  setDefault(binding.rotation, initial.rotation);
  if (binding.zone) rendererZones[binding.zone] = { ...object.bounds, align: initial.align };
}

export function materializeCocoDocument({ document, recipe, eventBrief, palette, authority, editorTextScale = 1, editorTextScales = {}, nativeQr = null }) {
  const resolvedEditorTextScale = Math.max(0.05, finite(editorTextScale, 1));
  if (resolvedEditorTextScale !== 1 || Object.keys(editorTextScales).length > 0) {
    for (const object of document.objects) {
      if (object.kind !== "text") continue;
      const objectScale = Math.max(0.05, finite(editorTextScales[object.id], resolvedEditorTextScale));
      if (Number.isFinite(Number(object.typography?.fontSizePx))) {
        object.typography.fontSizePx = Number(object.typography.fontSizePx) * objectScale;
      }
      if (Array.isArray(object.textRuns)) {
        for (const run of object.textRuns) {
          if (Number.isFinite(Number(run.fontSizePx))) {
            run.fontSizePx = Number(run.fontSizePx) * objectScale;
          }
        }
      }
    }
  }
  const rendererZones = {};
  const variant = {
    format: document.format,
    cocoCampaignDirectionId: recipe.id,
    cocoCampaignId: `coco-${recipe.id}-master`,
    cocoEventName: eventBrief.eventName || recipe.name,
    cocoVisualRecipeId: recipe.id,
    cocoVisualRecipeVersion: recipe.version,
    cocoVisualRecipeMaterializedVersion: recipe.version,
    cocoVisualRecipeSummary: recipe.summary,
    cocoSubjectLayoutId: "subject-center",
    cocoCenterLayoutOptionId: "subject-center",
    cocoEventBrief: clone(eventBrief),
    palette: clone(palette),
    backgroundUrl: "",
    bgUploadUrl: "",
    bgX: 0,
    bgY: 0,
    bgScale: 1,
    bgRotate: 0,
    bgBlur: 0,
    bgFitMode: true,
    bgLocked: false,
    headSizeAuto: false,
    headlineUppercase: true,
    detailsUppercase: false,
    bodyUppercase: false,
    subtagUppercase: true,
    priceRingEnabled: false,
    priceRingAlpha: 0,
    complianceEnabled: false,
    qrEnabled: false,
    cocoSocialHandleEnabled: false,
  };
  const nativeQrForFormat = nativeQr?.[document.format] ?? nativeQr;
  if (nativeQrForFormat && typeof nativeQrForFormat === "object") {
    variant.qrEnabled = nativeQrForFormat.enabled !== false;
    variant.qrImageUrl = null;
    variant.qrX = finite(nativeQrForFormat.x, 90);
    variant.qrY = finite(nativeQrForFormat.y, 86);
    variant.qrScale = finite(nativeQrForFormat.scale, 0.76);
  }

  const stateFieldOwners = new Map();
  for (const object of document.objects) {
    if (object.kind !== "text" || !object.semanticRole) continue;
    const binding = resolveBinding(object);
    if (!binding.text) continue;
    const existing = stateFieldOwners.get(binding.text);
    if (existing) {
      throw new Error(
        `Coco materialization failed: editable objects ${existing} and ${object.id} both bind state field ${binding.text}`,
      );
    }
    stateFieldOwners.set(binding.text, object.id);
  }
  for (const object of document.objects) if (object.kind === "text") applyTextObject(variant, object, rendererZones);
  if (document.objects.some((object) => object.semanticRole === "price")) {
    variant.priceLabel = String(eventBrief.entryLabel || "ENTRY");
    variant.priceLabelSize = finite(eventBrief.entryLabelSize, 8);
    variant.priceLabelColor = String(eventBrief.entryLabelColor || variant.priceColor || "#ffffff");
    variant.priceLabelBgColor = String(eventBrief.entryLabelBgColor || "transparent");
  }
  const assets = document.objects
    .filter((object) => object.kind !== "text" && object.id !== "footer-contact-group")
    .map((object) => assetForObject(document, object));
  const layerOrder = [...document.objects]
    .sort((a, b) => finite(a.stacking?.effectiveZIndex, finite(a.stacking?.zIndex)) - finite(b.stacking?.effectiveZIndex, finite(b.stacking?.zIndex)) || finite(a.stacking?.order) - finite(b.stacking?.order))
    .map((object) => object.id);
  const blocks = Object.entries(rendererZones).map(([source, rect], index) => ({
    source,
    rect,
    align: rect.align,
    priority: Math.min(5, index + 1),
    role: source,
  }));

  variant.headlineSize = variant.headManualPx;
  variant.headSize = variant.headManualPx;
  variant.head2 = variant.head2line;
  variant.head2Size = variant.head2SizePx;
  variant.bodyFamily = variant.detailsFamily;
  variant.bodyColor = variant.detailsColor;
  variant.bodySize = variant.detailsSize;
  variant.timeLabel = "";
  variant.timeLabelSize = Math.max(1, finite(variant.timeSize, 16) * 0.35);
  variant.timeLabelColor = variant.timeColor || "#ffffff";
  variant.timeLabelBgColor = "transparent";
  variant.leftRailLabelBgColor = "transparent";
  variant.rightRailLabel = "";
  variant.rightRailLabelBgColor = "transparent";
  variant.subtagGlyphColors = document.objects.find((object) => object.semanticRole === "subtag")?.textRuns?.map((run) => run.color).filter(Boolean) || [];
  variant.textFx = {
    color: variant.headColor,
    alpha: 1,
    gradient: Boolean(document.objects.find((object) => object.semanticRole === "headline")?.paint?.backgroundImage?.includes("gradient")),
    tracking: finite(variant.headTracking),
    uppercase: true,
  };
  variant.head2Fx = {
    color: variant.head2Color,
    alpha: 1,
    gradient: Boolean(document.objects.find((object) => object.semanticRole === "headline2")?.paint?.backgroundImage?.includes("gradient")),
    tracking: 0,
    uppercase: true,
  };
  variant.detailsFx = { color: variant.detailsColor, alpha: 1, tracking: finite(variant.bodyTracking) };
  const headlineObject = document.objects.find((object) => object.semanticRole === "headline");
  const subjectObject = document.objects.find((object) => object.semanticRole === "subject");
  variant.headBehindPortrait = Boolean(
    headlineObject &&
    subjectObject &&
    finite(headlineObject.stacking?.effectiveZIndex, finite(headlineObject.stacking?.zIndex)) <
      finite(subjectObject.stacking?.effectiveZIndex, finite(subjectObject.stacking?.zIndex)),
  );
  const zForRole = (role) => {
    const object = document.objects.find((item) => item.semanticRole === role);
    return object ? finite(object.stacking?.effectiveZIndex, finite(object.stacking?.zIndex)) : undefined;
  };
  variant.textLayerOffset = Object.fromEntries(
    [
      ["headline", "headline"],
      ["headline2", "headline2"],
      ["details", "details"],
      ["details2", "djLineup"],
      ["venue", "venue"],
      ["subtag", "subtag"],
    ]
      .map(([field, role]) => [field, zForRole(role)])
      .filter(([, value]) => value !== undefined),
  );
  variant.cocoRecipeImageFit = { focalTarget: { x: 50, y: 59 }, scale: 1, preserveUserScale: true };
  variant.cocoRecipeAuthority = clone(authority);
  variant.cocoCompositionMap = { patternId: recipe.runtime.compositionPattern, rendererZones };
  variant.cocoCompositionSystem = {
    patternId: recipe.runtime.compositionPattern,
    styleId: recipe.runtime.styleId,
    compiledDocument: document,
    compiledObjectOverrides: {},
    rendererZones,
    blocks,
    allBlocks: blocks,
    layerOrder,
    authority: {
      layout: "compiled-document-ir",
      palette: "compiled-object-paint",
      crop: "compiled-image-object",
      assets: "compiled-document-ir",
      background: "compiled-document-ir",
    },
  };
  variant.cocoCssCompiler = {
    schemaVersion: 4,
    sourceHash: document.provenance.sourceHash,
    sourceCanvas: document.canvas,
    extractor: document.provenance.extractor,
    ir: document,
    semanticObjects: Object.fromEntries(document.objects.filter((object) => object.semanticRole).map((object) => [object.sourceObjectId || object.id, {
      semanticRole: object.semanticRole,
      stateField: object.binding?.text,
      zone: object.binding?.zone,
      objectId: object.id,
    }])),
    report: document.report,
  };
  variant.emojiList = assets;
  variant.portraits = assets;
  return variant;
}

export function createPortableCocoProject({ square, story }) {
  const root = clone(square);
  return {
    state: {
      ...root,
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
    },
  };
}
