import type {
  CocoCompositionRole,
  CocoCompositionSource,
  CocoCompositionSystem,
  CocoTournamentAlign,
  CocoTournamentRect,
} from "../layoutTournament";
import type { CocoSignatureMove } from "../signatureMove/types.ts";
import type {
  CocoTypographyStackEnabledMap,
  CocoTypographyStackItem,
  CocoTypographyStackItemKind,
  CocoTypographyStackModel,
  CocoTypographyStackModelInput,
  CocoTypographyStackStyle,
} from "./types";

const DEFAULT_STYLE: CocoTypographyStackStyle = {
  color: "#ffffff",
  fontFamily: "LEMONMILK-Regular, sans-serif",
  fontSize: 12,
  fontWeight: 700,
  letterSpacingEm: 0,
  lineHeight: 1,
  textTransform: "none",
};

// Typography font sizes are expressed in the editor's design-pixel space:
// 540×540 for square and 540×960 for story. Percentage rectangles must be
// converted in that same space. Using export pixels (1080×1080/1080×1920)
// made every box appear twice as large to the fitter as the live CSS box,
// so a 126px hero zone was incorrectly treated as 251px tall.
function typographyPxPerPct(format: CocoTypographyStackModelInput["format"]) {
  return format === "story" ? 9.6 : 5.4;
}

const DEFAULT_SIGNATURE_MOVE: CocoSignatureMove = {
  id: "none",
  intensity: "subtle",
  priority: 0,
  reason: "No explicit signature move requested.",
  safety: {
    maxFaceOverlap: 0,
    maxHeadlineEdgeRisk: 0,
    mustKeepReadability: true,
  },
  target: "full-stack",
};

// CSS-compiled documents own their text geometry and use the compiled renderer.
// They intentionally do not carry the generic stack's copyTreatment/rhythm fields.
function usesCompiledTypography(composition: CocoCompositionSystem): boolean {
  const document = (composition as CocoCompositionSystem & {
    compiledDocument?: { schemaVersion?: number; objects?: unknown[] };
  }).compiledDocument;
  return Number(document?.schemaVersion ?? 0) >= 1 &&
    Array.isArray(document?.objects) && document.objects.length > 0;
}

export function buildTypographyStackModel(
  input: CocoTypographyStackModelInput
): CocoTypographyStackModel | null {
  const composition = input.composition;
  // A zone-scoped call (see buildTypographyZoneModels) explicitly disables
  // headline via enabled.headline===false for every zone that isn't the
  // hero title - it has nothing to do with headline text being missing, so
  // it must not bail out the same way "headline wanted but text is empty"
  // does for the main single-column call.
  const headlineWanted = input.enabled?.headline !== false;
  const rawHeadlineText = headlineWanted ? cleanStackText(input.text.headline) : "";
  if (!composition || usesCompiledTypography(composition)) return null;
  if (headlineWanted && !rawHeadlineText) return null;
  const splitEditorialStack = composition.patternId === "split-hero-editorial";
  const opticalSideStack = isOpticalSideStack(composition.patternId);
  // A split editorial has its own deliberate, panel-backed type field. It
  // can therefore carry a larger readability floor than type placed
  // directly over photography, without the face/subject fitter reducing
  // every support line to utility copy.
  const minReadableSize = Math.max(
    1,
    input.minReadableSize ?? 10,
    splitEditorialStack ? (input.format === "story" ? 16 : 15) : 1
  );
  const headlineBase = styleFor(input, "headline");
  const headlineText = splitEditorialStack
    ? chooseSplitEditorialHeadlineLineBreak(rawHeadlineText, headlineBase)
    : chooseHeadlineLineBreak(rawHeadlineText);
  const headlineLineCount = headlineText.split("\n").filter(Boolean).length;
  const rawAccentText =
    composition.copyTreatment.script === "accent-support" && input.enabled?.script !== false
      ? cleanStackText(input.text.script)
      : "";
  const signatureMove = input.authoritativeReference
    ? DEFAULT_SIGNATURE_MOVE
    : input.signatureMove ?? DEFAULT_SIGNATURE_MOVE;
  const ownedSources = ownedSourcesForComposition(input);
  const headlineSize = Math.max(
    minReadableSize,
    Math.round(headlineBase.fontSize * (signatureMove.typography?.headlineScaleMultiplier ?? 1))
  );
  const gates = composition.gates;
  const scriptMaxRatio =
    gates?.scriptMaxHeadlineRatio ??
    composition.hierarchy.accentPowerMaxRatio ??
    0.42;
  const bodyMaxRatio =
    gates?.detailsMaxHeadlineRatio ??
    composition.hierarchy.bodyPowerMaxRatio ??
    0.3;
  const venueMaxRatio = gates?.venueMaxHeadlineRatio ?? 0.24;
  const metadataMaxRatio = composition.hierarchy.metadataPowerMaxRatio ?? 0.26;
  const roleSize = (size: number, ratio: number) =>
    input.authoritativeReference
      ? Math.max(minReadableSize, Number(size) || minReadableSize)
      : capSize(size, headlineSize, ratio, minReadableSize);
  const items: CocoTypographyStackItem[] = [];

  // Every family reads headline-then-accent by default. A hero lockup
  // (script welded onto a bold word) needs the opposite order - accent
  // first, near-zero gap, headline immediately beneath it - so headline
  // and accent are built as standalone item factories (spacing supplied by
  // the caller, based on which one ends up first) instead of pushed inline.
  const buildHeadlineItem = (spacingBeforePct: number) =>
    buildItem({
      align: composition.alignment,
      id: "coco-stack-headline",
      kind: "headline",
      // The full given space (step 1 of the headline pipeline: space,
      // then font, then font size fit to that space, then the box built
      // to fit the resulting content). This used to be a fixed guessed
      // fraction (0.76/0.88) that the box was stuck at regardless of what
      // the headline said - fitHeadlineBoxToContent below replaces it with
      // a tight box sized from the actual text once the font size is
      // final, capped at this same full-space value so it can never
      // exceed what was actually allocated.
      maxWidthRatio: 1,
      role: "headline",
      source: "headline",
      sources: ["headline"],
      spacingBeforePct,
      style: {
        ...headlineBase,
        letterSpacingEm:
          opticalSideStack
            ? Math.min(
                -0.018,
                Number(headlineBase.letterSpacingEm ?? 0) +
                  Number(signatureMove.typography?.headlineTrackingDelta ?? 0)
              )
            : Number(headlineBase.letterSpacingEm ?? 0) +
              Number(signatureMove.typography?.headlineTrackingDelta ?? 0),
        fontSize: headlineSize,
        // A resolved analyzer plan may intentionally supply two lines. A
        // line-height that tight only works when there's no second line
        // below to collide with; floor genuine multi-line lockups safely.
        lineHeight: input.authoritativeReference
          ? Math.max(0.1, Number(headlineBase.lineHeight ?? 1))
          : opticalSideStack
          ? Math.max(1, Number(headlineBase.lineHeight ?? 1))
          : Math.max(
              headlineLineCount > 1 ? 1.02 : 1,
              Number(headlineBase.lineHeight ?? 1)
            ),
      },
      text: headlineText,
      visualPower: Math.max(90, composition.hierarchy.headlinePowerMin),
    });

  const accentText = rawAccentText;
  const buildAccentItem = (spacingBeforePct: number) => {
    const style = styleFor(input, "accent");
    return buildItem({
      align: composition.alignment,
      id: "coco-stack-accent",
      kind: "accent",
      maxWidthRatio: opticalSideStack ? 0.58 : 0.92,
      role: "accent",
      source: "script",
      sources: ["script"],
      offsetXPct: opticalSideStack ? (composition.alignment === "right" ? -2 : 2) : undefined,
      // Side stacks already flow headline -> accent. Translating the accent
      // upward made it paint through the second headline line even though
      // both items individually fit their boxes.
      offsetYPct: opticalSideStack ? 0 : undefined,
      rotationDeg: opticalSideStack && isScriptLikeFont(style.fontFamily) ? -5 : undefined,
      spacingBeforePct,
      style: {
        ...style,
        fontSize: roleSize(style.fontSize, scriptMaxRatio),
      },
      text: accentText,
      visualPower: Math.round(100 * Math.min(scriptMaxRatio, 0.48)),
    });
  };

  if (input.stackOrder === "accent-headline" && accentText && rawHeadlineText) {
    items.push(buildAccentItem(0));
    items.push(buildHeadlineItem(rhythmGap(composition.rhythm.headlineToAccent, 0.15, 1.35)));
  } else {
    if (rawHeadlineText) items.push(buildHeadlineItem(0));
    if (accentText) {
      items.push(
        buildAccentItem(
          opticalSideStack ? 1.15 : rhythmGap(composition.rhythm.headlineToAccent, 0.8, 1.35)
        )
      );
    }
  }

  const metadata = buildMetadataText(input);
  if (metadata.text) {
    const style = styleFor(input, "metadata");
    items.push(
      buildItem({
        align: composition.alignment,
        id: "coco-stack-metadata",
        kind: "metadata",
        maxWidthRatio: opticalSideStack ? 0.62 : 0.78,
        role: "primaryMeta",
        source: "details",
        sources: metadata.sources,
        spacingBeforePct: opticalSideStack
          ? 2.35
          : rhythmGap(composition.rhythm.accentToMeta, 1.25, 1.95),
        style: {
          ...style,
          fontSize: roleSize(style.fontSize, bodyMaxRatio),
          // Several legacy templates stored sub-1 line heights for short,
          // manually authored two-line labels. Generated copy can occupy
          // three or more real lines; preserving 0.62 literally makes the
          // glyph rows paint through one another. Coordinates and size stay
          // authoritative, while multiline leading gets the minimum needed
          // to remain readable inside the same reference box.
          lineHeight:
            input.authoritativeReference && metadata.text.includes("\n")
              ? Math.max(1, Number(style.lineHeight ?? 1))
              : style.lineHeight,
          textTransform: "uppercase",
        },
        text: metadata.text,
        visualPower: Math.round(100 * Math.min(bodyMaxRatio, 0.32)),
      })
    );
  }

  const secondary = buildSecondaryText(input);
  if (secondary.text) {
    const style = styleFor(input, "footer");
    items.push(
      buildItem({
        align: composition.alignment,
        id: "coco-stack-secondary",
        kind: "footer",
        maxWidthRatio: opticalSideStack ? 0.62 : 0.78,
        role: "secondaryMeta",
        source: "details2",
        sources: secondary.sources,
        spacingBeforePct: 1,
        style: {
          ...style,
          fontSize: roleSize(style.fontSize, bodyMaxRatio * 0.82),
          textTransform: "uppercase",
        },
        text: secondary.text,
        visualPower: Math.round(100 * Math.min(bodyMaxRatio * 0.82, 0.26)),
      })
    );
  }

  const dateText =
    composition.copyTreatment.date === "metadata" && input.enabled?.date !== false
      ? normalizeMetaLine(input.text.date)
      : "";
  if (dateText) {
    const style = styleFor(input, "dateTime");
    items.push(
      buildItem({
        align: composition.alignment,
        id: "coco-stack-date",
        kind: "dateTime",
        maxWidthRatio: opticalSideStack ? 0.62 : 0.72,
        role: "dateTime",
        source: "date",
        sources: ["date"],
        spacingBeforePct: rhythmGap(composition.rhythm.metaToDateTime, 1.8, 2.6),
        style: {
          ...style,
          fontSize: roleSize(style.fontSize, metadataMaxRatio),
          textTransform: "uppercase",
        },
        text: dateText,
        visualPower: Math.round(100 * Math.min(metadataMaxRatio, 0.3)),
      })
    );
  }

  const venueText =
    composition.copyTreatment.venue === "lock-to-stack" && input.enabled?.venue !== false
      ? normalizeMetaLine(input.text.venue)
      : "";
  if (venueText) {
    const style = styleFor(input, "venue");
    items.push(
      buildItem({
        align: composition.alignment,
        id: "coco-stack-venue",
        kind: "venue",
        maxWidthRatio: opticalSideStack ? 0.62 : 0.9,
        role: "venue",
        source: "venue",
        sources: ["venue"],
        spacingBeforePct: rhythmGap(composition.rhythm.dateTimeToVenue, 0.8, 1.35),
        style: {
          ...style,
          fontSize: roleSize(style.fontSize, venueMaxRatio),
          textTransform: "uppercase",
        },
        text: venueText,
        visualPower: Math.round(100 * Math.min(venueMaxRatio, 0.26)),
      })
    );
  }

  // presenter/badge have no upstream copyTreatment gate (unlike details/
  // details2/date/venue, which every other family has always routed
  // through) - they're driven directly by input.enabled, same as every
  // zone-scoped call from buildTypographyZoneModels restricts itself to
  // exactly one source.
  const presenterText =
    input.enabled?.presenter !== false ? normalizeMetaBlock(input.text.presenter, 3) : "";
  if (presenterText) {
    const style = styleFor(input, "presenter");
    items.push(
      buildItem({
        align: composition.alignment,
        id: "coco-stack-presenter",
        kind: "presenter",
        maxWidthRatio: 1,
        role: "footer",
        source: "presenter",
        sources: ["presenter"],
        spacingBeforePct: 0,
        style: {
          ...style,
          fontSize: roleSize(style.fontSize, bodyMaxRatio),
          textTransform: "uppercase",
        },
        text: presenterText,
        visualPower: Math.round(100 * Math.min(bodyMaxRatio, 0.32)),
      })
    );
  }

  const priceText =
    input.enabled?.price !== false ? normalizeMetaBlock(input.text.price, 3) : "";
  if (priceText) {
    const style = styleFor(input, "badge");
    items.push(
      buildItem({
        align: composition.alignment,
        id: "coco-stack-badge",
        kind: "badge",
        maxWidthRatio: 1,
        role: "badge",
        source: "price",
        sources: ["price"],
        spacingBeforePct: 0,
        style: {
          ...style,
          fontSize: roleSize(style.fontSize, bodyMaxRatio),
          textTransform: "uppercase",
        },
        text: priceText,
        visualPower: Math.round(100 * Math.min(bodyMaxRatio, 0.32)),
      })
    );
  }

  // subtag (tagline, e.g. "DRINKS I HOOKAH I STRIPPERS") and compliance
  // (e.g. "18+") are two distinct real sources now, each with its own zone
  // - deliberately not reusing the existing "footer" kind/buildSecondaryText
  // pair, since that's already wired to details2/copyTreatment specifically
  // for the brand-header zone and would collide with it.
  const taglineText =
    input.enabled?.subtag !== false ? normalizeMetaBlock(input.text.subtag, 2) : "";
  if (taglineText) {
    const style = styleFor(input, "tagline");
    items.push(
      buildItem({
        align: composition.alignment,
        id: "coco-stack-tagline",
        kind: "tagline",
        maxWidthRatio: 1,
        role: "footer",
        source: "subtag",
        sources: ["subtag"],
        spacingBeforePct: 0,
        style: {
          ...style,
          fontSize: roleSize(style.fontSize, bodyMaxRatio * 0.82),
          textTransform: "uppercase",
        },
        text: taglineText,
        visualPower: Math.round(100 * Math.min(bodyMaxRatio * 0.82, 0.26)),
      })
    );
  }

  const complianceText =
    input.enabled?.compliance !== false ? normalizeMetaBlock(input.text.compliance, 2) : "";
  if (complianceText) {
    const style = styleFor(input, "compliance");
    items.push(
      buildItem({
        align: composition.alignment,
        id: "coco-stack-compliance",
        kind: "compliance",
        maxWidthRatio: 1,
        role: "footer",
        source: "compliance",
        sources: ["compliance"],
        spacingBeforePct: 0,
        style: {
          ...style,
          fontSize: roleSize(style.fontSize, bodyMaxRatio * 0.7),
          textTransform: "uppercase",
        },
        text: complianceText,
        visualPower: Math.round(100 * Math.min(bodyMaxRatio * 0.7, 0.22)),
      })
    );
  }

  if (!items.length) return null;
  const signedItems = items.map((item) =>
    applySignatureToItem(item, signatureMove, {
      bodyMaxRatio,
      headlineSize,
      metadataMaxRatio,
      minReadableSize,
      scriptMaxRatio,
      venueMaxRatio,
    })
  );
  const grammaredItems = splitEditorialStack
    ? applySplitEditorialTypographyGrammar(signedItems, input.format)
    : signedItems;
  const boundsPolicy = input.boundsPolicy ?? "scale-to-fit";
  const stackRect = splitEditorialStack
    ? splitEditorialTextRect(composition.alignment, input.format)
    : protectStackRect(
        offsetRect(composition.textColumn, {
          x: signatureMove.layout?.stackOffsetX ?? 0,
          y: Number(signatureMove.layout?.stackOffsetY ?? 0) + (opticalSideStack ? 2.5 : 0),
        }),
        input
      );
  // Resolve the headline's share before globally scaling the stack.
  // Previously the oversized selector value (often 190-210px) forced every
  // supporting role down to its minimum; only afterward was the headline
  // fitted, leaving a huge title beside tiny metadata.
  const headlinePreFittedItems = fitHeadlineToBox(
    grammaredItems,
    stackRect,
    input.format,
    minReadableSize,
    opticalSideStack,
    splitEditorialStack
  );
  const fittedItems = fitItemsToStackBounds(
    headlinePreFittedItems,
    stackRect,
    input.format,
    minReadableSize,
    boundsPolicy,
    splitEditorialStack
  );
  // fitItemsToStackBounds computes one global scale from a single width
  // estimate - a reasonable first pass, but not a guarantee. This is the
  // guarantee: per item, keep re-measuring and shrinking until it actually
  // fits its own column, the way Canva's "shrink to fit" text boxes work.
  // Without this, overflow:hidden in TypographyStack.tsx would be the only
  // thing standing between an under-shrunk estimate and text getting
  // clipped mid-word instead of properly sized. Headline is handled
  // separately below (fitHeadlineToContent) - one unified pass instead of
  // two, so there's exactly one calculation deciding both its font size and
  // its box, the same way every other item only ever has one.
  const columnFittedItems = enforceColumnFit(
    fittedItems,
    stackRect,
    input.format,
    minReadableSize,
    splitEditorialStack
  );
  const headlineFittedItems = fitHeadlineToBox(
    columnFittedItems,
    stackRect,
    input.format,
    minReadableSize,
    opticalSideStack,
    splitEditorialStack
  );
  const hierarchyFittedItems = enforceHeadlineAccentInlineWidth(
    headlineFittedItems
  );
  const verticallyBalancedItems = balanceStackVerticalSpace(
    hierarchyFittedItems,
    stackRect,
    input.format,
    opticalSideStack && !splitEditorialStack
  );
  const measuredBalancedItems = attachMeasuredRects(
    verticallyBalancedItems,
    stackRect,
    input.format,
    splitEditorialStack
  );
  // The contrast panel is the split family's explicit safe surface. Its
  // fixed inner text field and the subject crop are resolved together, so
  // applying the photographic face clamp again here merely collapses the
  // approved column and makes all supporting copy tiny.
  const faceSafeItems = splitEditorialStack
    ? measuredBalancedItems
    : enforceHardFaceAvoidance(
        measuredBalancedItems,
        stackRect,
        input.format,
        input.faceZone,
        minReadableSize
      );
  // Face avoidance can independently shrink the headline after the first
  // hierarchy pass. Reapply the relational cap, then refresh measured rects
  // so preview/export consumers see the final, constrained ink widths.
  const measuredItems = attachMeasuredRects(
    enforceHeadlineAccentInlineWidth(faceSafeItems),
    stackRect,
    input.format,
    splitEditorialStack
  );

  return {
    alignment: composition.alignment,
    boundsPolicy,
    composition: {
      copyTreatment: composition.copyTreatment,
      gates: composition.gates,
      hierarchy: composition.hierarchy,
      patternId: composition.patternId,
      rhythm: composition.rhythm,
    },
    debug: {
      gates: debugGates(composition.gates),
      reason:
        input.debugReason ??
        composition.explanation ??
        "Typography stack rendered from Coco composition system.",
    },
    format: input.format,
    items: measuredItems,
    ownedSources,
    rect: {
      ...stackRect,
      align: composition.alignment,
    },
    signatureMove,
  };
}

// Normal block flow always starts at y=0. That wastes any spare height at
// the bottom of a tall side column while putting the first headline's ink
// directly against the stack's clipping edge. Use the space the fitter has
// already proven is free: reserve ascender clearance above the headline,
// then share the rest between populated rows so the column breathes.
function balanceStackVerticalSpace(
  items: CocoTypographyStackItem[],
  stackRect: CocoTournamentRect,
  format: CocoTypographyStackModelInput["format"],
  opticalSideStack: boolean
): CocoTypographyStackItem[] {
  if (!opticalSideStack || items.length === 0) return items;

  const pxPerPct = typographyPxPerPct(format);
  const stackHeightPx = Math.max(1, stackRect.height * pxPerPct);
  const stackWidthPx = Math.max(1, stackRect.width * pxPerPct);
  const usedHeightPx = items.reduce((sum, item) => {
    const fontSize = Math.max(1, Number(item.style.fontSize) || 1);
    const opticalSafety = item.kind === "headline" ? 0.88 : 0.95;
    const itemWidthPx = Math.max(
      1,
      stackWidthPx * Math.max(0.1, item.maxWidthRatio) * opticalSafety
    );
    return sum + item.spacingBeforePct * pxPerPct + itemFlowHeightPx(item, fontSize, itemWidthPx);
  }, 0);
  const slackPx = Math.max(0, stackHeightPx - usedHeightPx);
  if (slackPx < 1) return items;

  const headline = items.find((item) => item.kind === "headline");
  const headlineSize = Math.max(1, Number(headline?.style.fontSize) || 1);
  // Decorative display faces commonly paint 6-10% above their CSS line
  // box. Keep that ink inside the outer overflow boundary.
  const desiredTopInsetPx = Math.max(pxPerPct * 1.2, headlineSize * 0.1);
  const topInsetPx = Math.min(desiredTopInsetPx, slackPx * 0.45);
  const distributablePx = Math.max(0, slackPx - topInsetPx);
  const gapIndexes = items
    .map((item, index) => ({ index, item }))
    .filter(({ index, item }) => index > 0 && item.spacingBeforePct > 0)
    .map(({ index }) => index);
  // Retain a small bottom inset; use the rest of the formerly dead area as
  // breathing room between the actual populated rows.
  const sharedGapPx =
    gapIndexes.length > 0 ? (distributablePx * 0.82) / gapIndexes.length : 0;
  const gapIndexSet = new Set(gapIndexes);

  return items.map((item, index) => ({
    ...item,
    spacingBeforePct: round(
      item.spacingBeforePct +
        (index === 0 ? topInsetPx / pxPerPct : 0) +
        (gapIndexSet.has(index) ? sharedGapPx / pxPerPct : 0)
    ),
  }));
}

// Final, universal correction: applied directly to an ALREADY-BUILT model,
// regardless of which of several possible upstream sources produced it
// (fresh build here, a stored session snapshot from generation time, or a
// separate design-iteration pass) - none of those other sources know about
// face avoidance, so this is the one guaranteed place it actually happens
// before the model reaches the renderer. Safe to call on any model; a
// no-op if there's no faceZone or nothing overlaps.
export function enforceCocoTypographyStackFaceAvoidance(
  model: CocoTypographyStackModel | null | undefined,
  faceZone: CocoTournamentRect | null | undefined,
  minReadableSize = 10
): CocoTypographyStackModel | null | undefined {
  if (!model || !faceZone) return model;
  const measured = model.items.every((item) => item.measuredRect)
    ? model.items
    : attachMeasuredRects(model.items, model.rect, model.format);
  const corrected = enforceHardFaceAvoidance(measured, model.rect, model.format, faceZone, minReadableSize);
  if (corrected === model.items) return model;
  return { ...model, items: corrected };
}

export function stackOwnsSource(
  model: CocoTypographyStackModel | null | undefined,
  source: CocoCompositionSource
) {
  return Boolean(model?.ownedSources.includes(source));
}

export type CocoTypographyZoneId =
  | "brand-header"
  | "left-info"
  | "right-info"
  | "headline"
  | "accent"
  | "details"
  | "date-card"
  | "venue-footer"
  | "tagline"
  | "compliance-badge";

export type CocoTypographyZoneModel = {
  alignment: CocoTournamentAlign;
  format: CocoTypographyStackModelInput["format"];
  item: CocoTypographyStackItem;
  ownedSources: CocoCompositionSource[];
  rect: CocoTournamentRect;
  zoneId: CocoTypographyZoneId;
};

export type CocoResolvedTypographyZoneSnapshot = {
  fontSize: number;
  glyphRect: CocoTournamentRect;
  lineHeight: number;
  text: string;
  zoneId: CocoTypographyZoneId;
  zoneRect: CocoTournamentRect;
};

export function applyResolvedTypographyZoneSnapshot(
  zone: CocoTypographyZoneModel,
  snapshot: CocoResolvedTypographyZoneSnapshot | null | undefined,
  tolerance = 0.05
): CocoTypographyZoneModel {
  if (!snapshot || snapshot.zoneId !== zone.zoneId || snapshot.text !== zone.item.text) return zone;
  const sameRect =
    Math.abs(snapshot.zoneRect.x - zone.rect.x) < tolerance &&
    Math.abs(snapshot.zoneRect.y - zone.rect.y) < tolerance &&
    Math.abs(snapshot.zoneRect.width - zone.rect.width) < tolerance &&
    Math.abs(snapshot.zoneRect.height - zone.rect.height) < tolerance;
  if (!sameRect) return zone;
  return {
    ...zone,
    item: {
      ...zone.item,
      measuredRect: snapshot.glyphRect,
      style: {
        ...zone.item.style,
        fontSize: snapshot.fontSize,
        lineHeight: snapshot.lineHeight,
      },
      text: snapshot.text,
    },
  };
}

export function zoneOwnsSource(
  zone: CocoTypographyZoneModel | null | undefined,
  source: CocoCompositionSource
) {
  return Boolean(zone?.ownedSources.includes(source));
}

const ZONE_ENABLED_BASE: Required<
  Pick<
    CocoTypographyStackEnabledMap,
    | "headline"
    | "script"
    | "details"
    | "details2"
    | "date"
    | "venue"
    | "presenter"
    | "price"
    | "subtag"
    | "compliance"
  >
> = {
  headline: false,
  script: false,
  details: false,
  details2: false,
  date: false,
  venue: false,
  presenter: false,
  price: false,
  subtag: false,
  compliance: false,
};

// A center-hero-event-poster composition (coco-composition-director's
// buildCenterHeroEventPosterBlocks) is five independent zones around the
// subject instead of one flowing column - brand mark up top, DJ/lineup and
// offer info flanking the subject, a hero title crossing the torso, date
// and venue side by side at the bottom. Rather than teach this file a
// second layout model, each zone reuses buildTypographyStackModel exactly
// as-is, just pointed at that zone's own rect with every other source
// disabled - all the real text-fitting work (fitItemsToStackBounds,
// enforceColumnFit, fitHeadlineToContent, attachMeasuredRects) already
// works correctly against whatever single rect it's handed. Returns one
// model per zone that actually has a block and produced content; a zone
// with no matching block, or one whose text is empty, is simply absent
// from the result rather than an empty placeholder.
export function buildTypographyZoneModels(
  input: CocoTypographyStackModelInput
): CocoTypographyZoneModel[] {
  const composition = input.composition;
  if (!composition || usesCompiledTypography(composition) || composition.patternId !== "center-hero-event-poster") return [];
  const results: CocoTypographyZoneModel[] = [];

  const buildZone = (
    zoneId: CocoTypographyZoneId,
    rect: CocoTournamentRect,
    align: CocoTournamentAlign,
    enabledOverrides: Partial<CocoTypographyStackEnabledMap>,
    copyTreatmentOverrides?: Partial<CocoCompositionSystem["copyTreatment"]>,
    stackOrder?: CocoTypographyStackModelInput["stackOrder"]
  ) => {
    const model = buildTypographyStackModel({
      ...input,
      composition: {
        ...composition,
        alignment: align,
        copyTreatment: { ...composition.copyTreatment, ...copyTreatmentOverrides },
        textColumn: rect,
      },
      enabled: { ...ZONE_ENABLED_BASE, ...enabledOverrides },
      // This rectangle is already the Composition Director's final,
      // interaction-validated placement. Do not silently narrow a torso-
      // crossing hero against the broad silhouette; faceZone remains the
      // hard protection boundary inside buildTypographyStackModel.
      subjectZone: null,
      // A zone is already the final placement decision. Signature layout
      // offsets belong to the old shared-stack model and must not move an
      // item out of its assigned rectangle. Typography/effects remain.
      signatureMove: input.signatureMove
        ? {
            ...input.signatureMove,
            layout: {
              ...input.signatureMove.layout,
              stackOffsetX: 0,
              stackOffsetY: 0,
              accentOffsetX: 0,
              accentOffsetY: 0,
              metadataOffsetY: 0,
            },
          }
        : input.signatureMove,
      stackOrder,
    });
    // Every zone enables exactly one source. Return a direct zone-text
    // model so downstream renderers never receive or flow a stack.
    if (model?.items.length === 1) {
      results.push({
        alignment: model.alignment,
        format: model.format,
        item: model.items[0],
        ownedSources: model.ownedSources,
        rect: model.rect,
        zoneId,
      });
    }
  };

  // Headline and accent are independently selected composition zones.
  // Do not union them into a synthetic hero stack: that discarded both
  // selected y positions and let the headline size itself against all the
  // space between the two rectangles.
  const accentBlock = composition.blocks.find((b) => b.role === "accent");
  if (accentBlock) {
    buildZone("accent", accentBlock.rect, accentBlock.align, { script: true });
  }
  const headlineHeroBlock = composition.blocks.find((b) => b.role === "headline");
  if (headlineHeroBlock) {
    buildZone("headline", headlineHeroBlock.rect, headlineHeroBlock.align, { headline: true });
  }

  const brandHeaderBlock = composition.blocks.find((b) => b.role === "secondaryMeta");
  if (brandHeaderBlock) {
    buildZone("brand-header", brandHeaderBlock.rect, brandHeaderBlock.align, { details2: true }, {
      details2: "footer",
    });
  }

  const detailsBlock = composition.blocks.find(
    (b) => b.role === "primaryMeta" && b.source === "details"
  );
  if (detailsBlock) {
    buildZone("details", detailsBlock.rect, detailsBlock.align, { details: true });
  }

  const leftInfoBlock = composition.blocks.find((b) => b.role === "footer" && b.source === "presenter");
  if (leftInfoBlock) {
    buildZone("left-info", leftInfoBlock.rect, leftInfoBlock.align, { presenter: true });
  }

  const rightInfoBlock = composition.blocks.find((b) => b.role === "badge");
  if (rightInfoBlock) {
    buildZone("right-info", rightInfoBlock.rect, rightInfoBlock.align, { price: true });
  }

  const dateBlock = composition.blocks.find((b) => b.role === "dateTime");
  if (dateBlock) {
    buildZone("date-card", dateBlock.rect, dateBlock.align, { date: true });
  }

  const venueBlock = composition.blocks.find((b) => b.role === "venue");
  if (venueBlock) {
    buildZone("venue-footer", venueBlock.rect, venueBlock.align, { venue: true });
  }

  const taglineBlock = composition.blocks.find((b) => b.role === "footer" && b.source === "subtag");
  if (taglineBlock) {
    buildZone("tagline", taglineBlock.rect, taglineBlock.align, { subtag: true });
  }

  const complianceBlock = composition.blocks.find((b) => b.role === "footer" && b.source === "compliance");
  if (complianceBlock) {
    buildZone("compliance-badge", complianceBlock.rect, complianceBlock.align, { compliance: true });
  }

  const headlineZone = results.find((zone) => zone.zoneId === "headline");
  const accentZoneIndex = results.findIndex((zone) => zone.zoneId === "accent");
  if (headlineZone && accentZoneIndex >= 0) {
    const accentZone = results[accentZoneIndex];
    const constrainedItems = enforceHeadlineAccentInlineWidth([
      headlineZone.item,
      accentZone.item,
    ]);
    const constrainedAccent = constrainedItems.find((item) => item.kind === "accent");
    if (constrainedAccent && constrainedAccent !== accentZone.item) {
      results[accentZoneIndex] = {
        ...accentZone,
        // Keep the director-authored zone coordinates intact. Only the
        // accent's font size changes; its measured ink rect is refreshed
        // against the same zone for downstream preview/export checks.
        item: attachMeasuredRects([constrainedAccent], accentZone.rect, input.format)[0],
      };
    }
  }

  return results;
}

function buildItem(input: {
  align: CocoTournamentAlign;
  effects?: CocoTypographyStackItem["effects"];
  id: string;
  kind: CocoTypographyStackItemKind;
  maxWidthRatio: number;
  offsetXPct?: number;
  offsetYPct?: number;
  rotationDeg?: number;
  role: CocoCompositionRole;
  source: CocoCompositionSource;
  sources: CocoCompositionSource[];
  spacingBeforePct: number;
  style: CocoTypographyStackStyle;
  text: string;
  visualPower: number;
}): CocoTypographyStackItem {
  return input;
}

function applySignatureToItem(
  item: CocoTypographyStackItem,
  signatureMove: CocoSignatureMove,
  caps: {
    bodyMaxRatio: number;
    headlineSize: number;
    metadataMaxRatio: number;
    minReadableSize: number;
    scriptMaxRatio: number;
    venueMaxRatio: number;
  }
): CocoTypographyStackItem {
  if (signatureMove.id === "none") return item;

  if (item.kind === "headline") {
    return {
      ...item,
      effects: mergeEffects(item.effects, {
        glowBoost: signatureMove.effects?.headlineGlowBoost,
        softBloom: signatureMove.effects?.addSoftBehindTextBloom,
      }),
    };
  }

  if (item.kind === "accent") {
    const style = item.style;
    const nextSize = capSize(
      style.fontSize * (signatureMove.typography?.accentScaleMultiplier ?? 1),
      caps.headlineSize,
      caps.scriptMaxRatio,
      caps.minReadableSize
    );
    return {
      ...item,
      effects: mergeEffects(item.effects, {
        glowBoost: signatureMove.effects?.accentGlowBoost,
      }),
      offsetXPct: round((item.offsetXPct ?? 0) + Number(signatureMove.layout?.accentOffsetX ?? 0)),
      offsetYPct: round((item.offsetYPct ?? 0) + Number(signatureMove.layout?.accentOffsetY ?? 0)),
      rotationDeg: round(Number(signatureMove.typography?.accentRotationDeg ?? item.rotationDeg ?? 0)),
      style: {
        ...style,
        fontSize: nextSize,
        letterSpacingEm:
          Number(style.letterSpacingEm ?? 0) +
          Number(signatureMove.typography?.accentTrackingDelta ?? 0),
      },
    };
  }

  if (item.kind === "metadata") {
    return {
      ...item,
      spacingBeforePct: round(
        item.spacingBeforePct + Number(signatureMove.layout?.metadataOffsetY ?? 0)
      ),
      style: {
        ...item.style,
        fontSize: capSize(
          item.style.fontSize,
          caps.headlineSize,
          caps.bodyMaxRatio,
          caps.minReadableSize
        ),
      },
    };
  }

  if (item.kind === "dateTime") {
    return {
      ...item,
      style: {
        ...item.style,
        fontSize: capSize(
          item.style.fontSize,
          caps.headlineSize,
          caps.metadataMaxRatio,
          caps.minReadableSize
        ),
      },
    };
  }

  if (item.kind === "venue") {
    return {
      ...item,
      style: {
        ...item.style,
        fontSize: capSize(
          item.style.fontSize,
          caps.headlineSize,
          caps.venueMaxRatio,
          caps.minReadableSize
        ),
      },
    };
  }

  return item;
}

function mergeEffects(
  base: CocoTypographyStackItem["effects"],
  next: CocoTypographyStackItem["effects"]
): CocoTypographyStackItem["effects"] | undefined {
  const glowBoost = Number(base?.glowBoost ?? 0) + Number(next?.glowBoost ?? 0);
  const merged = {
    glowBoost: Number.isFinite(glowBoost) ? glowBoost : 0,
    softBloom: Boolean(base?.softBloom || next?.softBloom),
  };
  if (
    !merged.glowBoost &&
    !merged.softBloom
  ) {
    return undefined;
  }
  return merged;
}

function styleFor(
  input: CocoTypographyStackModelInput,
  kind: CocoTypographyStackItemKind
): CocoTypographyStackStyle {
  const style = {
    ...DEFAULT_STYLE,
    ...(input.styles[kind] ?? {}),
    fontSize: Math.max(1, Number(input.styles[kind]?.fontSize ?? DEFAULT_STYLE.fontSize)),
  };
  return {
    ...style,
    fontFamily: stripInterFontFamilyStack(style.fontFamily, DEFAULT_STYLE.fontFamily),
  };
}

function stripInterFontFamilyStack(fontFamily: string, fallback: string) {
  const families = String(fontFamily || "")
    .split(",")
    .map((family) => family.trim())
    .filter(
      (family) => family.replace(/^['"]|['"]$/g, "").toLowerCase() !== "inter"
    );
  return families.length ? families.join(", ") : fallback;
}

function buildMetadataText(input: CocoTypographyStackModelInput) {
  const treatment = input.composition?.copyTreatment;
  const details =
    treatment?.details === "primary-meta" && input.enabled?.details !== false
      ? normalizeMetaBlock(input.text.details, 3)
      : "";
  const details2 =
    treatment?.details2 === "merge" && input.enabled?.details2 !== false
      ? normalizeMetaBlock(input.text.details2, 3)
      : "";
  const compressed = compressExperienceCopy([details, details2].filter(Boolean).join("\n"));
  return {
    sources: [
      ...(details ? (["details"] as CocoCompositionSource[]) : []),
      ...(details2 ? (["details2"] as CocoCompositionSource[]) : []),
    ],
    text: compressed,
  };
}

function buildSecondaryText(input: CocoTypographyStackModelInput) {
  const treatment = input.composition?.copyTreatment.details2;
  if (input.enabled?.details2 === false) return { sources: [], text: "" };
  if (treatment !== "keep" && treatment !== "footer") return { sources: [], text: "" };
  const text = treatment === "footer"
    ? normalizeMetaLine(input.text.details2)
    : normalizeMetaBlock(input.text.details2, 1);
  return {
    sources: text ? (["details2"] as CocoCompositionSource[]) : [],
    text,
  };
}

function ownedSourcesForComposition(input: CocoTypographyStackModelInput): CocoCompositionSource[] {
  const composition = input.composition;
  if (!composition) return [];
  const owned = new Set<CocoCompositionSource>();
  const enabled = (source: CocoCompositionSource) => input.enabled?.[source] !== false;
  if (enabled("headline")) owned.add("headline");
  if (
    enabled("script") &&
    composition.copyTreatment.script === "accent-support"
  ) {
    owned.add("script");
  }
  if (
    enabled("details") &&
    (composition.copyTreatment.details === "primary-meta" || composition.copyTreatment.details === "hide")
  ) {
    owned.add("details");
  }
  if (enabled("details2") && composition.copyTreatment.details2) owned.add("details2");
  if (enabled("date") && composition.copyTreatment.date === "metadata") owned.add("date");
  if (enabled("venue") && composition.copyTreatment.venue === "lock-to-stack") owned.add("venue");
  // Unlike headline (required - the function bails out entirely if it's
  // wanted but empty, so "enabled" alone always implies "was built"),
  // presenter/price are optional: claiming ownership regardless of whether
  // there's actually text would make cocoTypographyStackOwns("presenter")
  // return true for every ordinary flyer, wrongly suppressing the legacy
  // presenter/badge divs even when coco itself renders nothing for them.
  if (enabled("presenter") && String(input.text.presenter ?? "").trim()) owned.add("presenter");
  if (enabled("price") && String(input.text.price ?? "").trim()) owned.add("price");
  if (enabled("subtag") && String(input.text.subtag ?? "").trim()) owned.add("subtag");
  if (enabled("compliance") && String(input.text.compliance ?? "").trim()) owned.add("compliance");
  return Array.from(owned);
}

function cleanStackText(value: unknown) {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim();
}

function chooseHeadlineLineBreak(value: unknown) {
  const raw = String(value ?? "").replace(/\r\n?/g, "\n").trim();
  // Composition owns structural line breaks. The Typography Stack only
  // normalizes the decision it receives; it must never reinterpret an
  // unbroken title from word count before the safe zone and actual font have
  // been measured.
  if (raw.includes("\n")) {
    return raw
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
  }
  const clean = raw
    .split("\n")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return clean;
}

// The contrast-panel composition has a known 36%-wide inner field. Short
// event names should not be allowed to become a timid single line merely
// because they technically fit: if the one-line solution would fall below
// a strong display size, compare every word boundary and use the most
// balanced two-line lockup when that materially increases scale. Explicit
// director/user breaks remain authoritative.
function chooseSplitEditorialHeadlineLineBreak(
  value: unknown,
  style: CocoTypographyStackStyle
) {
  const clean = chooseHeadlineLineBreak(value);
  if (!clean || clean.includes("\n")) return clean;

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5 || clean.length > 34) return clean;

  const usableWidthPx = 36 * 5.4 * 0.92;
  const lineUnits = (line: string) => approximateHeadlineLineUnits(line, style);
  const oneLineSize = usableWidthPx / Math.max(0.01, lineUnits(clean));
  // Below this point the title reads like supporting copy on a 540px-wide
  // canvas. It is a visual threshold, independent of whatever oversized
  // selector value happened to enter the fitter.
  if (oneLineSize >= 44) return clean;

  let best:
    | { first: string; second: string; maxUnits: number; score: number }
    | undefined;
  for (let index = 1; index < words.length; index += 1) {
    const first = words.slice(0, index).join(" ");
    const second = words.slice(index).join(" ");
    const firstUnits = lineUnits(first);
    const secondUnits = lineUnits(second);
    const maxUnits = Math.max(firstUnits, secondUnits);
    const imbalance = Math.abs(firstUnits - secondUnits);
    const orphanPenalty =
      Math.min(first.length, second.length) <= 2 ? maxUnits * 0.35 : 0;
    const score = maxUnits + imbalance * 0.42 + orphanPenalty;
    if (!best || score < best.score) {
      best = { first, second, maxUnits, score };
    }
  }

  if (!best) return clean;
  const twoLineSize = usableWidthPx / Math.max(0.01, best.maxUnits);
  return twoLineSize >= oneLineSize * 1.18
    ? `${best.first}\n${best.second}`
    : clean;
}

function approximateHeadlineLineUnits(
  value: string,
  style: CocoTypographyStackStyle
) {
  const transformed = applyTextTransformForMeasurement(
    value,
    style.textTransform
  );
  const familyFactor = headlineGlyphFactor(String(style.fontFamily ?? ""));
  const tracking = Number(style.letterSpacingEm ?? 0);
  return Array.from(transformed).reduce((total, glyph, index, glyphs) => {
    const width =
      glyph === " "
        ? 0.34
        : /[MW@%]/i.test(glyph)
        ? familyFactor * 1.12
        : /[I1'.,:]/i.test(glyph)
        ? familyFactor * 0.52
        : familyFactor;
    return total + width + (index < glyphs.length - 1 ? tracking : 0);
  }, 0);
}

function splitEditorialTextRect(
  alignment: CocoTournamentAlign,
  format: CocoTypographyStackModelInput["format"]
): CocoTournamentRect {
  const width = 36;
  const rightAligned = alignment === "right";
  return {
    align: rightAligned ? "right" : "left",
    height: format === "story" ? 86 : 84,
    width,
    x: rightAligned ? 100 - 6 - width : 6,
    y: format === "story" ? 7 : 8,
  };
}

// Split editorial is a designed reading sequence, not a bag of separately
// positioned labels. Keep every row on the panel's inner field, establish
// a clear eyebrow/title/support hierarchy, and use compact pixel-based gaps
// so Story does not turn extra height into empty holes.
function applySplitEditorialTypographyGrammar(
  items: CocoTypographyStackItem[],
  format: CocoTypographyStackModelInput["format"]
) {
  const order: Record<CocoTypographyStackItemKind, number> = {
    presenter: 0,
    dateTime: 1,
    headline: 2,
    accent: 3,
    tagline: 4,
    metadata: 5,
    footer: 6,
    venue: 7,
    badge: 8,
    compliance: 9,
  };
  const indexed = items.map((item, index) => ({ index, item }));
  indexed.sort((a, b) => order[a.item.kind] - order[b.item.kind] || a.index - b.index);

  const minimumSize: Record<CocoTypographyStackItemKind, number> = {
    headline: 1,
    accent: format === "story" ? 20 : 19,
    presenter: format === "story" ? 16 : 15,
    dateTime: format === "story" ? 19 : 18,
    tagline: format === "story" ? 18 : 17,
    metadata: format === "story" ? 17 : 16,
    footer: format === "story" ? 16 : 15,
    venue: format === "story" ? 16 : 15,
    badge: format === "story" ? 16 : 15,
    compliance: format === "story" ? 16 : 15,
  };
  const maxWidth: Record<CocoTypographyStackItemKind, number> = {
    headline: 1,
    accent: 1,
    presenter: 0.92,
    dateTime: 1,
    tagline: 1,
    metadata: 1,
    footer: 1,
    venue: 1,
    badge: 0.78,
    compliance: 0.78,
  };
  const minimumLineHeight: Record<CocoTypographyStackItemKind, number> = {
    headline: 1,
    accent: 1,
    presenter: 1.08,
    dateTime: 1.08,
    tagline: 1.08,
    metadata: 1.16,
    footer: 1.12,
    venue: 1.1,
    badge: 1.08,
    compliance: 1.08,
  };
  const pxPerPct = typographyPxPerPct(format);

  return indexed.map(({ item }, index, ordered) => {
    const previous = index > 0 ? ordered[index - 1].item : undefined;
    return {
      ...item,
      maxWidthRatio: maxWidth[item.kind],
      // Signature moves may add energy to glyph treatment, but the reading
      // field itself remains one disciplined column.
      offsetXPct: 0,
      offsetYPct: 0,
      spacingBeforePct:
        index === 0
          ? 0
          : round(splitEditorialGapPx(previous?.kind, item.kind) / pxPerPct),
      style: {
        ...item.style,
        fontSize: Math.max(minimumSize[item.kind], Number(item.style.fontSize) || 1),
        lineHeight: Math.max(
          minimumLineHeight[item.kind],
          Number(item.style.lineHeight ?? 1) || 1
        ),
      },
    };
  });
}

function splitEditorialGapPx(
  previous: CocoTypographyStackItemKind | undefined,
  current: CocoTypographyStackItemKind
) {
  if (!previous) return 0;
  if (current === "dateTime") return 9;
  if (current === "headline") return 17;
  if (current === "accent") return 5;
  if (current === "tagline") return previous === "headline" ? 7 : 5;
  if (current === "metadata") return 13;
  if (current === "footer") return 6;
  if (current === "venue") return 12;
  return 8;
}

function isOpticalSideStack(patternId: string | undefined) {
  return (
    patternId === "left-premium-stack" ||
    patternId === "right-premium-stack" ||
    patternId === "split-hero-editorial"
  );
}

function isScriptLikeFont(fontFamily: unknown) {
  return /(script|brush|paint|signature|hand|good brush|openscript|adelia|lacheyard|dear|satisfy|vibes|cursive)/i.test(
    String(fontFamily ?? "")
  );
}

function splitMeta(value: unknown) {
  return cleanStackText(value)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .flatMap((line) => {
      const parts = line.split(/\s*[•|/]\s*/).map((item) => item.trim()).filter(Boolean);
      return parts.length > 1 ? parts : [line];
    });
}

function normalizeMetaLine(value: unknown) {
  return splitMeta(value).join(" • ");
}

function normalizeMetaBlock(value: unknown, maxLines = 2) {
  const items = splitMeta(value);
  if (!items.length) return "";
  const safeMaxLines = Math.max(1, maxLines);
  if (items.length <= safeMaxLines) return items.join("\n");
  const perLine = Math.ceil(items.length / safeMaxLines);
  const lines: string[] = [];
  for (let index = 0; index < items.length; index += perLine) {
    lines.push(items.slice(index, index + perLine).join(" • "));
  }
  return lines.slice(0, safeMaxLines).join("\n");
}

function compressExperienceCopy(value: unknown, maxItems = 3, maxWordsPerItem = 3) {
  const phrases = splitMeta(value)
    .map(removeWeakExperienceLanguage)
    .map((phrase) => phrase.split(/\s+/).filter(Boolean).slice(0, maxWordsPerItem).join(" "))
    .map((phrase) => phrase.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const compact: string[] = [];
  for (const phrase of phrases) {
    const key = phrase.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    compact.push(phrase.toUpperCase());
    if (compact.length >= maxItems) break;
  }
  return compact.join("\n");
}

function removeWeakExperienceLanguage(value: string) {
  return String(value || "")
    .replace(/\b(sip on|indulge in|enjoy|experience|friends and drinks|good people|good music)\b/gi, "")
    .replace(/\b(vibes|energy|await|classic(?:s)? await|refreshing|delectable|delicious)\b/gi, "")
    .replace(/\b(and|with|the|our|your)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function capSize(size: number, headlineSize: number, ratio: number, minReadableSize: number) {
  const capped = Math.min(size, headlineSize * ratio);
  return Math.round(Math.max(minReadableSize, capped));
}

function fitItemsToStackBounds(
  items: CocoTypographyStackItem[],
  rect: CocoTournamentRect,
  format: CocoTypographyStackModelInput["format"],
  minReadableSize: number,
  boundsPolicy: CocoTypographyStackModel["boundsPolicy"],
  useCanvasWidth = false
) {
  if (boundsPolicy !== "scale-to-fit" || !items.length) return items;

  const pxPerPct = typographyPxPerPct(format);
  const widthPx = Math.max(1, rect.width * (useCanvasWidth ? 5.4 : pxPerPct));
  const heightPx = Math.max(1, rect.height * pxPerPct);
  let scale = 1;
  let estimatedHeight = 0;

  for (const item of items) {
    const fontSize = Math.max(1, Number(item.style.fontSize) || 1);
    const opticalSafety = item.kind === "headline" ? 0.88 : 0.95;
    const itemWidthPx = Math.max(1, widthPx * Math.max(0.1, item.maxWidthRatio) * opticalSafety);
    // Headline gets its own dedicated width/font-size fit (fitHeadlineToContent,
    // right after this runs) - letting its width also drive this global scale
    // would shrink every other item too, based on a cruder pass headline no
    // longer relies on. Still counted toward the height estimate below, since
    // this function's height check is the only place vertical fit is
    // considered before the stack actually gets laid out.
    if (item.kind !== "headline") {
      const width = estimateStackTextWidth(item, fontSize);
      if (width > itemWidthPx) {
        scale = Math.min(scale, itemWidthPx / width);
      }
    }
    estimatedHeight += item.spacingBeforePct * pxPerPct + itemFlowHeightPx(item, fontSize, itemWidthPx);
  }

  if (estimatedHeight > heightPx) {
    scale = Math.min(scale, heightPx / estimatedHeight);
  }

  // No artificial floor here beyond minReadableSize (applied per-item
  // below): a floor like "never shrink past 34% of the original size"
  // sounds reasonable but silently guarantees overflow whenever a word
  // genuinely needs more reduction than that to fit its column - exactly
  // what happened with "MONDAZE" spilling into the face zone. The real
  // legibility floor is minReadableSize; let scale go as low as the real
  // measured text actually requires to fit.
  const safeScale = Math.max(0, Math.min(1, scale));
  if (safeScale >= 0.995) return items;

  return items.map((item) => ({
    ...item,
    spacingBeforePct: round(item.spacingBeforePct * safeScale),
    style: {
      ...item.style,
      fontSize: Math.max(minReadableSize, Math.round(item.style.fontSize * safeScale)),
    },
  }));
}

// Simulates the same top-to-bottom, margin-top-gap stacking the browser
// does (see TypographyStack.tsx's marginTop-from-spacingBeforePct), using
// each item's REAL measured width/height at its final font size, so
// downstream collision/protection checks (renderedSnapshot.ts) see the
// actual glyph footprint instead of the full, content-agnostic column width.
function attachMeasuredRects(
  items: CocoTypographyStackItem[],
  stackRect: CocoTournamentRect,
  format: CocoTypographyStackModelInput["format"],
  useCanvasWidth = false
): CocoTypographyStackItem[] {
  const pxPerPct = typographyPxPerPct(format);
  const widthPxPerPct = useCanvasWidth ? 5.4 : pxPerPct;
  const stackWidthPx = Math.max(1, stackRect.width * widthPxPerPct);
  let cursorYPx = 0;

  return items.map((item) => {
    const fontSize = Math.max(1, Number(item.style.fontSize) || 1);
    const opticalSafety = item.kind === "headline" ? 0.88 : 0.95;
    const columnWidthPx = Math.max(0.1, stackWidthPx * Math.max(0.1, item.maxWidthRatio) * opticalSafety);
    // No Math.min cap here: the actual rendered CSS has overflow: visible
    // (TypographyStack.tsx), so text that's wider than its column really
    // does spill out - measuredRect needs to reflect that truth, or every
    // overlap/collision check reading it (renderedSnapshot.ts,
    // enforceHardFaceAvoidance below) would never see the real overflow.
    const measuredWidthPx = estimateStackTextWidth(item, fontSize);
    const measuredHeightPx = itemFlowHeightPx(item, fontSize, columnWidthPx);

    cursorYPx += item.spacingBeforePct * pxPerPct;
    const itemTopPx = cursorYPx;
    cursorYPx += measuredHeightPx;

    const columnLeftPct = stackRect.x + (item.offsetXPct ?? 0);
    const columnWidthPct = columnWidthPx / widthPxPerPct;
    const measuredWidthPct = measuredWidthPx / widthPxPerPct;
    const alignedLeftPct =
      item.align === "right"
        ? columnLeftPct + columnWidthPct - measuredWidthPct
        : item.align === "center"
        ? columnLeftPct + (columnWidthPct - measuredWidthPct) / 2
        : columnLeftPct;

    const measuredRect: CocoTournamentRect = {
      align: item.align,
      height: round(measuredHeightPx / pxPerPct),
      width: round(measuredWidthPct),
      x: round(alignedLeftPct),
      y: round(stackRect.y + (item.offsetYPct ?? 0) + itemTopPx / pxPerPct),
    };

    return { ...item, measuredRect };
  });
}

function rectsOverlap(a: CocoTournamentRect, b: CocoTournamentRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// The accent/subheadline is subordinate to the headline as a painted title
// line, not merely as a point-size ratio. A longer word or wider font can be
// visually wider at a much smaller size, so compare the natural (unwrapped)
// inline ink of the two final items and reduce the accent only. This never
// changes a director-authored rect, alignment, offset, or text value.
function enforceHeadlineAccentInlineWidth(
  items: CocoTypographyStackItem[]
): CocoTypographyStackItem[] {
  const headline = items.find((item) => item.kind === "headline");
  const accentIndex = items.findIndex((item) => item.kind === "accent");
  if (!headline || accentIndex < 0) return items;

  const naturalInlineInkWidth = (item: CocoTypographyStackItem, fontSize: number) =>
    estimateStackTextWidth(item, fontSize) +
    Math.max(0, Number(item.style.strokeWidth ?? 0)) * 2;
  const headlineFontSize = Math.max(0.01, Number(headline.style.fontSize) || 0.01);
  const headlineWidth = naturalInlineInkWidth(headline, headlineFontSize);
  if (!Number.isFinite(headlineWidth) || headlineWidth <= 0) return items;

  let accent = items[accentIndex];
  let guard = 0;
  while (guard < 12) {
    const accentFontSize = Math.max(0.01, Number(accent.style.fontSize) || 0.01);
    const accentWidth = naturalInlineInkWidth(accent, accentFontSize);
    if (!Number.isFinite(accentWidth) || accentWidth <= headlineWidth + 0.01) break;

    // Width is effectively linear with font size. Canvas estimates can be a
    // few percent narrower than the browser's loaded display face, so keep a
    // small optical reserve. The live DOM pass then only has to absorb true
    // font-paint edge cases instead of visibly resizing the authored model.
    const nextFontSize = Math.max(
      0.01,
      accentFontSize * Math.min(0.98, (headlineWidth / accentWidth) * 0.955)
    );
    if (nextFontSize >= accentFontSize - 0.001) break;
    accent = { ...accent, style: { ...accent.style, fontSize: nextFontSize } };
    guard += 1;
  }

  if (accent === items[accentIndex]) return items;
  const constrained = [...items];
  constrained[accentIndex] = accent;
  return constrained;
}

// Per-item, iterative, re-measures at every step: shrinks a single item's
// font size until its text genuinely fits its own declared column width,
// the way a real "shrink to fit" text box works (Canva, PowerPoint
// autofit) - not a one-shot ratio guess. Measure each authored line at its
// natural width without inserting wraps, then shrink down to minReadableSize.
function enforceColumnFit(
  items: CocoTypographyStackItem[],
  stackRect: CocoTournamentRect,
  format: CocoTypographyStackModelInput["format"],
  minReadableSize: number,
  useCanvasWidth = false
): CocoTypographyStackItem[] {
  const pxPerPct = typographyPxPerPct(format);
  const stackWidthPx = Math.max(
    1,
    stackRect.width * (useCanvasWidth ? 5.4 : pxPerPct)
  );

  return items.map((item) => {
    // Headline is handled by fitHeadlineToContent instead - one unified
    // pass that decides its font size and its box together, rather than
    // this generic per-item fit (font size only, against a fixed box)
    // running first and something else adjusting the box afterward.
    if (item.kind === "headline") return item;

    const opticalSafety = 0.95;
    const columnWidthPx = Math.max(0.1, stackWidthPx * Math.max(0.1, item.maxWidthRatio) * opticalSafety);
    // Real DOM layout and this function's own measurement are now the same
    // engine, but a small margin is still kept here as breathing room
    // rather than fitting to the exact mathematical edge.
    const targetWidthPx = columnWidthPx * 0.92;

    let current = item;
    let guard = 0;
    while (guard < 32) {
      const fontSize = Math.max(1, Number(current.style.fontSize) || 1);
      if (fontSize <= minReadableSize) break;
      const width = estimateStackTextWidth(current, fontSize);
      if (width <= targetWidthPx) break;

      const ratio = Math.max(0.5, Math.min(0.98, targetWidthPx / width));
      const nextFontSize = Math.max(minReadableSize, Math.floor(fontSize * ratio));
      if (nextFontSize >= fontSize) break;

      current = { ...current, style: { ...current.style, fontSize: nextFontSize } };
      guard += 1;
    }

    return current;
  });
}

// Single source of truth for the headline's font size. This used to be two
// separate passes - fitHeadlineToContent (width only) then
// enforceStackHeightFit (height + rotation, run AFTER width was already
// decided, able to shrink what the width pass had just picked without the
// width pass ever knowing). Two passes that don't know about each other's
// constraints can each look individually correct and still disagree - that
// mismatch is what put a headline's own two lines on top of each other
// instead of stacked (a height correction applied after the width/line
// layout was already locked in). This is one function, one loop: width and
// height are checked together on every iteration, so the result is
// guaranteed to satisfy both at once, not whichever was computed last.
function fitHeadlineToBox(
  items: CocoTypographyStackItem[],
  stackRect: CocoTournamentRect,
  format: CocoTypographyStackModelInput["format"],
  minReadableSize: number,
  opticalSideStack = false,
  useCanvasWidth = false
): CocoTypographyStackItem[] {
  const pxPerPct = typographyPxPerPct(format);
  const stackWidthPx = Math.max(
    1,
    stackRect.width * (useCanvasWidth ? 5.4 : pxPerPct)
  );
  // 6% padding, same margin the old height pass used.
  const stackHeightPx = Math.max(1, stackRect.height * pxPerPct * 0.94);

  const headlineIndex = items.findIndex((item) => item.kind === "headline");

  // A rotated item (the accent line's signature-move tilt) needs a taller
  // real bounding box than its own unrotated line height - rotating a
  // wide, short box around its center pushes its top edge above where an
  // unrotated box of the same height would sit. The stack's first item
  // starts flush with the box's own top, so reserve that extra height as
  // spacingBeforePct before anything else is sized against it.
  const withRotationHeadroom = items.map((item, index) => {
    if (index !== 0 || !item.rotationDeg) return item;
    const fontSize = Math.max(1, Number(item.style.fontSize) || 1);
    const widthPx = stackWidthPx * item.maxWidthRatio;
    const heightPx = itemFlowHeightPx(item, fontSize, widthPx);
    const angle = (Math.abs(item.rotationDeg) * Math.PI) / 180;
    const rotatedHeightPx = widthPx * Math.sin(angle) + heightPx * Math.cos(angle);
    const extraPct = Math.max(0, (rotatedHeightPx - heightPx) / 2 / pxPerPct);
    return extraPct > 0 ? { ...item, spacingBeforePct: item.spacingBeforePct + extraPct } : item;
  });

  if (headlineIndex === -1) return withRotationHeadroom;

  // What every OTHER item in the stack (accent, in a hero lockup) actually
  // needs at its own already-fitted size - what's left over is headline's
  // real height budget, not a guess.
  const otherItemsHeightPx = withRotationHeadroom.reduce((sum, item, index) => {
    if (index === headlineIndex) return sum;
    const fontSize = Math.max(1, Number(item.style.fontSize) || 1);
    const opticalSafety = item.kind === "headline" ? 0.88 : 0.95;
    const itemWidthPx = Math.max(
      1,
      stackWidthPx * Math.max(0.1, item.maxWidthRatio) * opticalSafety
    );
    return sum + item.spacingBeforePct * pxPerPct + itemFlowHeightPx(item, fontSize, itemWidthPx);
  }, 0);
  const headlineSpacingPx = withRotationHeadroom[headlineIndex].spacingBeforePct * pxPerPct;
  const remainingHeightBudgetPx = Math.max(
    minReadableSize,
    stackHeightPx - otherItemsHeightPx - headlineSpacingPx
  );
  // A side-layout title is one member of a long editorial column, not an
  // independent hero zone. Giving it every leftover pixel allowed a
  // two-line title to occupy roughly half the column and crushed all
  // supporting copy. Keep the title dominant, but reserve the hierarchy.
  const headlineShareCapPx = opticalSideStack
    ? Math.max(minReadableSize, stackHeightPx * 0.39)
    : Number.POSITIVE_INFINITY;
  const heightBudgetPx = Math.min(remainingHeightBudgetPx, headlineShareCapPx);

  const opticalSafety = 0.88;
  const targetWidthPx = Math.max(0.1, stackWidthPx * opticalSafety);
  // Measured against a very wide bound so a director-resolved line never gets
  // artificially wrapped mid-measurement. This needs the true natural width
  // of the widest line, not a width already capped by the same column.
  const unwrapWidthPx = targetWidthPx * 20;

  let current = withRotationHeadroom[headlineIndex];

  // Fill available space - grow OR shrink - but never past either
  // constraint. Both are recomputed every iteration, so a size that would
  // fit width but blow the height budget (or vice versa) never survives.
  let guard = 0;
  while (guard < 8) {
    const fontSize = Math.max(1, Number(current.style.fontSize) || 1);
    const neededHeightPx = estimateStackTextHeight(current, fontSize, unwrapWidthPx);
    const naturalWidthPx = estimateStackTextWidth(current, fontSize);
    if (naturalWidthPx <= 0) break;

    const widthScale = targetWidthPx / naturalWidthPx;
    const heightScale = heightBudgetPx / neededHeightPx;
    const scale = Math.min(widthScale, heightScale);
    const nextFontSize = Math.max(
      minReadableSize,
      Math.round(fontSize * Math.max(0.5, Math.min(scale, 1.5)))
    );
    if (nextFontSize === fontSize) break;

    current = { ...current, style: { ...current.style, fontSize: nextFontSize } };
    guard += 1;
  }

  // The fill loop above computes what SHOULD fit - it doesn't verify
  // against what actually renders. Real observed cases ("MAERTINI" clipped
  // to "MAER", "BEACH SUNDAYS" clipped to "BEAC"/"SUND") show that estimate
  // can still overshoot. Hard guarantee: re-measure against the REAL
  // rendered width (100% of the stack, matching TypographyStack.tsx's
  // width: itemWidth CSS) AND the same height budget together, and keep
  // shrinking until both genuinely fit.
  const realWidthPx = Math.max(0.1, stackWidthPx * Math.max(0.1, current.maxWidthRatio));
  let finalGuard = 0;
  while (finalGuard < 16) {
    const fontSize = Math.max(1, Number(current.style.fontSize) || 1);
    if (fontSize <= minReadableSize) break;
    const neededHeightPx = estimateStackTextHeight(current, fontSize, unwrapWidthPx);
    const renderedWidthPx = estimateStackTextWidth(current, fontSize);
    const widthOk = renderedWidthPx <= realWidthPx * 0.92;
    const heightOk = neededHeightPx <= heightBudgetPx;
    if (widthOk && heightOk) break;

    const widthRatio = widthOk ? 1 : (realWidthPx * 0.92) / renderedWidthPx;
    const heightRatio = heightOk ? 1 : heightBudgetPx / neededHeightPx;
    const ratio = Math.max(0.5, Math.min(0.98, Math.min(widthRatio, heightRatio)));
    const nextFontSize = Math.max(minReadableSize, Math.floor(fontSize * ratio));
    if (nextFontSize >= fontSize) break;

    current = { ...current, style: { ...current.style, fontSize: nextFontSize } };
    finalGuard += 1;
  }

  const result = [...withRotationHeadroom];
  result[headlineIndex] = current;
  return result;
}

// Last-resort, guaranteed enforcement. The shrink-to-fit pass and the
// stack-width clamp above are both still estimates computed before the
// fact; this checks the ACTUAL measured rect (now honest, see the fix in
// attachMeasuredRects above) against the real face zone and, if it still
// overlaps, forcibly shrinks that item's font size in a closed loop until
// it clears or hits the readable-size floor. This is a hard guarantee, not
// a probability.
function enforceHardFaceAvoidance(
  items: CocoTypographyStackItem[],
  stackRect: CocoTournamentRect,
  format: CocoTypographyStackModelInput["format"],
  faceZone: CocoTournamentRect | null | undefined,
  minReadableSize: number
): CocoTypographyStackItem[] {
  if (!faceZone) return items;

  const pxPerPct = typographyPxPerPct(format);
  const stackWidthPx = Math.max(1, stackRect.width * pxPerPct);

  return items.map((item) => {
    if (!item.measuredRect || !rectsOverlap(item.measuredRect, faceZone)) return item;

    let current = item;
    let guard = 0;
    while (guard < 16 && current.measuredRect && rectsOverlap(current.measuredRect, faceZone)) {
      const nextFontSize = Math.max(minReadableSize, Math.round(current.style.fontSize * 0.9));
      if (nextFontSize >= current.style.fontSize) break;

      const opticalSafety = current.kind === "headline" ? 0.88 : 0.95;
      const columnWidthPx = Math.max(0.1, stackWidthPx * Math.max(0.1, current.maxWidthRatio) * opticalSafety);
      const measuredWidthPx = estimateStackTextWidth(current, nextFontSize);
      const measuredHeightPx = itemFlowHeightPx(current, nextFontSize, columnWidthPx);

      const columnLeftPct = stackRect.x + (current.offsetXPct ?? 0);
      const columnWidthPct = columnWidthPx / pxPerPct;
      const measuredWidthPct = measuredWidthPx / pxPerPct;
      const alignedLeftPct =
        current.align === "right"
          ? columnLeftPct + columnWidthPct - measuredWidthPct
          : current.align === "center"
          ? columnLeftPct + (columnWidthPct - measuredWidthPct) / 2
          : columnLeftPct;

      current = {
        ...current,
        style: { ...current.style, fontSize: nextFontSize },
        measuredRect: {
          ...current.measuredRect,
          height: round(measuredHeightPx / pxPerPct),
          width: round(measuredWidthPct),
          x: round(alignedLeftPct),
        },
      };
      guard += 1;
    }

    return current;
  });
}

function estimateStackTextWidth(item: CocoTypographyStackItem, fontSize: number) {
  return Math.max(1, ...stackTextLines(item.text).map(line => estimateTextRunWidth(line, item, fontSize)));
}

// One vertical authority for fitting, model snapshots, live DOM flow, and
// export. CSS line boxes can be shorter than the glyph ink painted by a
// display face. Reserve the larger of explicit line boxes and glyph ink.
function itemFlowHeightPx(
  item: CocoTypographyStackItem,
  fontSize: number,
  widthPx: number
) {
  const lineHeight = Math.max(0.2, Number(item.style.lineHeight ?? 1) || 1);
  const explicitLineBoxHeight =
    stackTextLines(item.text).length * fontSize * lineHeight;
  return Math.max(
    explicitLineBoxHeight,
    estimateStackTextHeight(item, fontSize, widthPx)
  );
}

// Real glyph measurement using an actual hidden DOM element, not a Canvas
// approximation. Canvas's measureText() is a *separate* text-layout engine
// from the one that actually draws the page - close, but not guaranteed to
// agree, which is what all of tonight's padding/margin tuning was really
// fighting. Measuring a real DOM element styled identically to the real
// render (same font-family, size, weight, letter-spacing, text-transform)
// means there's no second approximation to diverge from: the measurement
// IS the render. Only available in a browser; the pipeline's real call
// sites are all client-only (app/page.tsx, 'use client').
let measurementElement: HTMLDivElement | null | undefined;

function getMeasurementElement(): HTMLDivElement | null {
  if (measurementElement) return measurementElement;
  // Only cache a successfully-created element. This function's first call
  // in a Next.js app is during the server render of the initial HTML
  // (client components still render once on the server before hydration),
  // where document doesn't exist - caching null there would permanently
  // disable real measurement for the page's entire lifetime, since nothing
  // ever clears a module-level cache to force a retry. Not caching the
  // "no document yet" case means the next call, once actually in the
  // browser, tries again instead of being stuck on the server's answer.
  if (typeof document === "undefined") return null;
  try {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.position = "fixed";
    el.style.left = "-99999px";
    el.style.top = "0";
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    el.style.whiteSpace = "nowrap";
    document.body.appendChild(el);
    measurementElement = el;
  } catch {
    return null;
  }
  return measurementElement;
}

// The Node test environment (and any other non-browser context) has no DOM
// to measure with. Falling back to the old per-glyph guess in that case
// would silently reintroduce the same under-measurement bug it's meant to
// replace, so the fallback pads the guess to deliberately over-estimate -
// text may end up very slightly smaller than optimal outside a real
// browser, but it will never under-shrink and overflow its box.
const FALLBACK_SAFETY_MARGIN = 1.15;

// Measuring before a custom @font-face has actually finished downloading
// silently measures with the browser's substitute font instead - usually
// close enough to pass unnoticed, but for a narrow zone the font-fit loop
// can converge on a font size that's wildly wrong once the real (often
// much wider/display-style) font swaps in after the measurement already
// locked in a size, since nothing here ever recomputes afterward. A narrow
// hero-title box exposes this far worse than the wide columns every other
// family used until tonight - document.fonts.check() confirms the exact
// family/weight/size used for THIS measurement is actually ready before
// trusting it; if not, this falls through to the same padded legacy
// estimate already used for "no DOM" and "bogus zero" cases, which never
// depends on font loading at all.
function isFontReadyForMeasurement(
  fontFamily: string | undefined,
  fontSize: number,
  fontWeight: string | number | undefined,
  sampleText: string
): boolean {
  if (typeof document === "undefined" || !document.fonts || typeof document.fonts.check !== "function") {
    return true;
  }
  try {
    const family = String(fontFamily ?? "sans-serif");
    const weight = String(Number(fontWeight) || 700);
    return document.fonts.check(`${weight} ${fontSize}px ${family}`, sampleText || " ");
  } catch {
    return true;
  }
}

// Separate cached element from getMeasurementElement() above: that one is
// permanently whiteSpace:"nowrap" (right for measuring a single run's
// width) which collapses "\n" into a space instead of a real line break -
// wrong for measuring how tall a genuinely multi-line headline actually
// renders. Use pre to measure only explicit newlines, matching TypographyStack.
let measurementHeightElement: HTMLDivElement | null | undefined;

function getMeasurementHeightElement(): HTMLDivElement | null {
  if (measurementHeightElement) return measurementHeightElement;
  if (typeof document === "undefined") return null;
  try {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.position = "fixed";
    el.style.left = "-99999px";
    el.style.top = "0";
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    el.style.whiteSpace = "pre";
    document.body.appendChild(el);
    measurementHeightElement = el;
  } catch {
    return null;
  }
  return measurementHeightElement;
}

// Real height, same reasoning as estimateTextRunWidth's real width below:
// "fontSize * lineHeight * lineCount" assumes a font's true line-box
// height matches that multiplication exactly. It doesn't for every
// font/weight - a font with taller-than-average ascent/descent can render
// visibly taller lines than the arithmetic predicts, so a loop trusting
// only the formula can conclude "fits" while the real glyphs overlap the
// next line. Preserve explicit newlines without adding width-based breaks.
function estimateStackTextHeight(item: CocoTypographyStackItem, fontSize: number, widthPx: number) {
  const lineHeight = Number(item.style.lineHeight ?? 1) || 1;
  const lineCount = Math.max(1, item.text.split(/\r?\n/).length);
  const fallback = fontSize * lineHeight * lineCount;
  const inkHeight = estimateStackGlyphInkHeight(item, fontSize);

  const el = getMeasurementHeightElement();
  if (el && isFontReadyForMeasurement(item.style.fontFamily, fontSize, item.style.fontWeight, item.text)) {
    const family = String(item.style.fontFamily ?? "sans-serif");
    el.style.fontFamily = family;
    el.style.fontSize = `${fontSize}px`;
    el.style.fontWeight = String(Number(item.style.fontWeight) || 700);
    el.style.fontStyle = item.style.fontStyle ?? "normal";
    el.style.letterSpacing = `${Number(item.style.letterSpacingEm ?? 0)}em`;
    el.style.lineHeight = String(lineHeight);
    el.style.width = `${Math.max(1, widthPx)}px`;
    el.style.textTransform =
      item.style.textTransform === "uppercase"
        ? "uppercase"
        : item.style.textTransform === "titlecase"
        ? "capitalize"
        : "none";
    el.textContent = item.text || " ";
    const measured = el.getBoundingClientRect().height;
    // Same "never trust a bogus 0" reasoning as the width measurement.
    if (measured > 0.5) return Math.max(measured, inkHeight);
  }

  return Math.max(fallback * FALLBACK_SAFETY_MARGIN, inkHeight);
}

let measurementCanvasContext: CanvasRenderingContext2D | null | undefined;

function getMeasurementCanvasContext(): CanvasRenderingContext2D | null {
  if (measurementCanvasContext) return measurementCanvasContext;
  if (typeof document === "undefined") return null;
  try {
    measurementCanvasContext = document.createElement("canvas").getContext("2d");
  } catch {
    return null;
  }
  return measurementCanvasContext;
}

// getBoundingClientRect() measures a CSS line box, not the pixels a display
// font paints outside that box. actualBoundingBoxAscent/Descent describe the
// ink itself, which is the quantity overflow clipping acts on. For multiple
// explicit lines, include the real baseline advances plus the first/last
// line's ink extents.
function estimateStackGlyphInkHeight(item: CocoTypographyStackItem, fontSize: number): number {
  const lineHeight = Math.max(0.2, Number(item.style.lineHeight ?? 1) || 1);
  const lines = stackTextLines(item.text);
  const safeLines = lines.length ? lines : [" "];
  const ctx = getMeasurementCanvasContext();

  if (
    ctx &&
    isFontReadyForMeasurement(item.style.fontFamily, fontSize, item.style.fontWeight, item.text)
  ) {
    const family = String(item.style.fontFamily ?? "sans-serif");
    const style = item.style.fontStyle ?? "normal";
    const weight = String(Number(item.style.fontWeight) || 700);
    ctx.font = `${style} ${weight} ${fontSize}px ${family}`;

    let firstAscent = 0;
    let lastDescent = 0;
    let tallestInk = 0;
    safeLines.forEach((line, index) => {
      const transformed = applyTextTransformForMeasurement(line, item.style.textTransform);
      const metrics = ctx.measureText(transformed || " ");
      const ascent = Number(metrics.actualBoundingBoxAscent) || fontSize * 0.9;
      const descent = Number(metrics.actualBoundingBoxDescent) || fontSize * 0.3;
      if (index === 0) firstAscent = ascent;
      if (index === safeLines.length - 1) lastDescent = descent;
      tallestInk = Math.max(tallestInk, ascent + descent);
    });

    return Math.max(
      tallestInk,
      firstAscent + (safeLines.length - 1) * fontSize * lineHeight + lastDescent
    );
  }

  // Conservative when the real font has not loaded yet. Display faces often
  // paint well beyond a tight 1em line box, so never size against less than
  // 1.28em of ink for the first line.
  return fontSize * (1.28 + Math.max(0, safeLines.length - 1) * lineHeight);
}

function estimateTextRunWidth(itemText: string, item: CocoTypographyStackItem, fontSize: number) {
  const el = getMeasurementElement();

  if (el && isFontReadyForMeasurement(item.style.fontFamily, fontSize, item.style.fontWeight, itemText)) {
    const family = String(item.style.fontFamily ?? "sans-serif");
    el.style.fontFamily = family;
    el.style.fontSize = `${fontSize}px`;
    el.style.fontWeight = String(Number(item.style.fontWeight) || 700);
    el.style.fontStyle = item.style.fontStyle ?? "normal";
    el.style.letterSpacing = `${Number(item.style.letterSpacingEm ?? 0)}em`;
    // The same CSS property TypographyStack.tsx applies at render time,
    // applied here to the same raw, untransformed text - so casing (e.g.
    // "Martini" -> "MARTINI") is handled identically in both places
    // instead of this function guessing at it separately.
    el.style.textTransform =
      item.style.textTransform === "uppercase"
        ? "uppercase"
        : item.style.textTransform === "titlecase"
        ? "capitalize"
        : "none";
    el.textContent = itemText || " ";
    const measured = el.getBoundingClientRect().width;
    // A real, non-empty string rendered at a real font size can never
    // legitimately measure to ~0px - if this element was ever detached, not
    // yet laid out, or failed to pick up the styles just set on it for any
    // reason, this is the only signal available that something went wrong.
    // Trusting a bad 0 here would starve the box down to its floor while
    // the font size stays full - worse than never having measured at all -
    // so a bogus 0 for real text falls back to the padded guess instead of
    // being trusted.
    if (measured > 0.5 || !(itemText || "").trim()) return measured;
  }

  const transformedText = applyTextTransformForMeasurement(itemText, item.style.textTransform);
  const letterSpacing = fontSize * Number(item.style.letterSpacingEm ?? 0);
  const glyphs = Array.from(transformedText || " ");
  return legacyEstimateRunWidth(transformedText, item, fontSize, glyphs, letterSpacing) * FALLBACK_SAFETY_MARGIN;
}

function applyTextTransformForMeasurement(
  text: string,
  textTransform: CocoTypographyStackStyle["textTransform"]
): string {
  if (textTransform === "uppercase") return text.toUpperCase();
  if (textTransform === "titlecase") {
    return text.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
  }
  return text;
}

function legacyEstimateRunWidth(
  itemText: string,
  item: CocoTypographyStackItem,
  fontSize: number,
  glyphs: string[],
  letterSpacing: number
) {
  const family = String(item.style.fontFamily ?? "");
  const kindFactor =
    item.kind === "headline"
      ? headlineGlyphFactor(family)
      : item.kind === "accent"
      ? accentGlyphFactor(family)
      : 0.58;
  return glyphs.reduce((width, glyph, index) => {
    const glyphFactor = glyph === " " ? 0.34 : /[A-Z0-9]/.test(glyph) ? kindFactor : kindFactor * 0.9;
    return width + fontSize * glyphFactor + (index < glyphs.length - 1 ? letterSpacing : 0);
  }, 0);
}

function headlineGlyphFactor(fontFamily: string) {
  if (/(bebas|anton|cond|comp|compressed|narrow)/i.test(fontFamily)) return 0.56;
  if (/(lemon|gotham|mont|futura|avant|poppins|geometric)/i.test(fontFamily)) return 0.9;
  return 0.78;
}

function accentGlyphFactor(fontFamily: string) {
  if (/(script|brush|paint|signature|hand|good brush|openscript|adelia|lacheyard)/i.test(fontFamily)) return 0.66;
  return 0.6;
}

function stackTextLines(text: string) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
}

function protectStackRect(
  rect: CocoTournamentRect,
  input: CocoTypographyStackModelInput
): CocoTournamentRect {
  if (!input.hasSubject) return rect;
  let protectedRect = rect;
  // A side portrait is a real boundary for a side-column composition. The
  // center layout is deliberately different: its headline may cross the
  // torso and relies on the face zone as the hard exclusion below.
  if (input.subjectZone && input.composition?.layoutId !== "subject-center") {
    const minWidth = input.format === "story" ? 22 : 24;
    protectedRect = clampRectAgainstZone(
      protectedRect,
      input.subjectZone,
      input.format,
      minWidth
    );
  }
  // The portrait silhouette is usable editorial space. Coco protects the
  // detected face below while allowing type across the rest of the subject.
  if (input.faceZone) {
    if (input.composition?.layoutId === "subject-center") {
      // A centered face is an obstacle inside the text column, not a side
      // boundary that can be solved by shaving a little width off. Reserve
      // a complete horizontal face lane and place the uninterrupted stack
      // in whichever remaining vertical lane has more usable room.
      protectedRect = clampCenterStackOutsideFaceLane(
        protectedRect,
        input.faceZone,
        input.format
      );
      return protectedRect;
    }
    // The face zone is real per-photo detection (not a template guess -
    // see effectiveFaceZone in app/page.tsx), and is the hardest
    // constraint: crossing a face is never acceptable, even where the
    // wider subject-silhouette clamp above tolerates some overlap. Uses a
    // much smaller width floor than the subject clamp - avoiding the face
    // wins over keeping a "comfortable" column width.
    const minWidth = input.format === "story" ? 16 : 18;
    protectedRect = clampRectAgainstZone(protectedRect, input.faceZone, input.format, minWidth);
  }
  return protectedRect;
}

function clampCenterStackOutsideFaceLane(
  rect: CocoTournamentRect,
  faceZone: CocoTournamentRect,
  format: CocoTypographyStackModelInput["format"]
): CocoTournamentRect {
  if (!rectsOverlap(rect, faceZone)) return rect;

  const gutter = format === "story" ? 3.25 : 2.75;
  const rectBottom = rect.y + rect.height;
  const faceTop = faceZone.y - gutter;
  const faceBottom = faceZone.y + faceZone.height + gutter;
  const topHeight = Math.max(0, faceTop - rect.y);
  const bottomY = Math.max(rect.y, faceBottom);
  const bottomHeight = Math.max(0, rectBottom - bottomY);

  if (bottomHeight > topHeight) {
    return {
      ...rect,
      height: round(bottomHeight),
      y: round(bottomY),
    };
  }

  return {
    ...rect,
    height: round(topHeight),
  };
}

function clampRectAgainstZone(
  rect: CocoTournamentRect,
  zone: CocoTournamentRect,
  format: CocoTypographyStackModelInput["format"],
  minWidth: number
): CocoTournamentRect {
  const zoneLeft = Number(zone.x);
  const zoneRight = Number(zone.x) + Number(zone.width);
  const rectRight = rect.x + rect.width;
  const gutter = format === "story" ? 3.25 : 2.75;

  if (rect.align !== "right" && rect.x < zoneLeft && rectRight > zoneLeft - gutter) {
    const width = Math.max(minWidth, zoneLeft - gutter - rect.x);
    return {
      ...rect,
      width: round(Math.min(rect.width, width)),
    };
  }

  if (rect.align === "right" && rect.x < zoneRight + gutter && rectRight > zoneRight) {
    const nextX = Math.min(100 - minWidth, zoneRight + gutter);
    return {
      ...rect,
      width: round(Math.max(minWidth, rectRight - nextX)),
      x: round(nextX),
    };
  }

  return rect;
}

function offsetRect(rect: CocoTournamentRect, offset: { x: number; y: number }): CocoTournamentRect {
  const width = Math.max(1, Math.min(100, Number(rect.width) || 1));
  const height = Math.max(1, Math.min(100, Number(rect.height) || 1));
  const x = Math.max(0, Math.min(100 - width, Number(rect.x) + Number(offset.x || 0)));
  const y = Math.max(0, Math.min(100 - height, Number(rect.y) + Number(offset.y || 0)));
  return {
    ...rect,
    height: round(height),
    width: round(width),
    x: round(x),
    y: round(y),
  };
}

function rhythmGap(value: number, min: number, max: number) {
  return round(Math.max(min, Math.min(max, value * 0.42)));
}

function debugGates(gates: CocoTypographyStackModel["composition"]["gates"]) {
  if (!gates) return [];
  return [
    `headline/script >= ${gates.headlineOverScriptMin}`,
    `headline/body >= ${gates.headlineOverBodyMin}`,
    `script <= ${Math.round(gates.scriptMaxHeadlineRatio * 100)}% headline`,
    `details <= ${Math.round(gates.detailsMaxHeadlineRatio * 100)}% headline`,
    `venue <= ${Math.round(gates.venueMaxHeadlineRatio * 100)}% headline`,
  ];
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
