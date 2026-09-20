import type {
  CenterLayoutRect,
  CocoCenterLayoutZones,
} from "./buildCenterLayoutZones";

type NativeReferenceLayoutId = "subject-center" | "subject-left" | "subject-right";
type NativeLayoutRect = Omit<CenterLayoutRect, "align"> & {
  align?: CenterLayoutRect["align"];
};
type NativeComposerZones = Record<
  | "subject"
  | "headline"
  | "script"
  | "presenter"
  | "leftInfo"
  | "rightInfo"
  | "date"
  | "price"
  | "venue"
  | "subtag",
  NativeLayoutRect
>;

const mirrorRect = (zone: NativeLayoutRect): NativeLayoutRect => ({
  ...zone,
  x: Math.max(0, Math.min(100 - zone.width, 100 - zone.x - zone.width)),
  // Alignment is part of the reference's text treatment. Flipping it makes
  // oversized display faces paint outside an otherwise valid mirrored box.
  align: zone.align,
});

/**
 * Re-orients the winning reference as one rigid composition. Widths and
 * vertical rhythm stay untouched, so the reference's font sizes still fit.
 * The old implementation replaced these boxes with unrelated procedural
 * side-layout boxes, which made reference-sized type spill off the canvas.
 */
export function orientNativeReferenceZones({
  layoutId,
  sourceLayoutId,
  zones,
}: {
  layoutId: Exclude<NativeReferenceLayoutId, "subject-center">;
  sourceLayoutId?: NativeReferenceLayoutId | null;
  zones: NativeComposerZones;
}): NativeComposerZones {
  const subjectIsLeft =
    sourceLayoutId === "subject-left"
      ? true
      : sourceLayoutId === "subject-right"
      ? false
      : zones.subject.x + zones.subject.width / 2 < 50;
  const wantsSubjectLeft = layoutId === "subject-left";
  if (subjectIsLeft === wantsSubjectLeft) return zones;
  return Object.fromEntries(
    Object.entries(zones).map(([role, zone]) => [role, mirrorRect(zone)])
  ) as NativeComposerZones;
}

const zoneAlign = (zone: NativeLayoutRect) => zone.align ?? "center";

// The artboard text nodes position their outer box with CSS `left: x%` and
// apply text alignment *inside* that box. Their x coordinate is therefore
// always the zone's left edge. Feeding them a typographic anchor (center or
// right edge) shifts the entire box by half/full width and sends it off-canvas.
const boxLeftX = (zone: NativeLayoutRect) => zone.x;

/**
 * Geometry-only patch for changing a native reference layout. This function
 * deliberately has no access to text, fonts, sizes, effects, palette, or copy
 * treatment, so a layout click cannot redesign the selected template.
 */
export function buildNativeReferenceLayoutPatch({
  centerZones,
  existingTextLayerOffset,
  existingTextZones,
  layoutId,
  zones,
}: {
  centerZones?: CocoCenterLayoutZones | null;
  existingTextLayerOffset?: Partial<
    Record<"headline" | "headline2" | "details" | "details2" | "venue" | "subtag", number>
  >;
  existingTextZones?: Record<string, unknown>;
  layoutId: NativeReferenceLayoutId;
  zones: NativeComposerZones;
}) {
  const textLayerOffset = {
    headline: Math.max(Number(existingTextLayerOffset?.headline ?? 0), 118),
    headline2: Math.max(Number(existingTextLayerOffset?.headline2 ?? 0), 118),
    details: Math.max(Number(existingTextLayerOffset?.details ?? 0), 116),
    details2: Math.max(Number(existingTextLayerOffset?.details2 ?? 0), 116),
    venue: Math.max(Number(existingTextLayerOffset?.venue ?? 0), 118),
    subtag: Math.max(Number(existingTextLayerOffset?.subtag ?? 0), 120),
  };
  return {
    // Until region-level occlusion exists, a reflow must not leave moved type
    // hidden behind the entire subject layer.
    headBehindPortrait: false,
    textLayerOffset,
    headX: boxLeftX(zones.headline),
    headY: zones.headline.y,
    headAlign: zoneAlign(zones.headline),
    align: zoneAlign(zones.headline),
    textAlign: zoneAlign(zones.headline),
    textColWidth: zones.headline.width,
    head2X: boxLeftX(zones.script),
    head2Y: zones.script.y,
    head2Align: zoneAlign(zones.script),
    head2ColWidth: zones.script.width,
    presenterX: boxLeftX(zones.presenter),
    presenterY: zones.presenter.y,
    presenterWidth: zones.presenter.width,
    presenterAlign: zoneAlign(zones.presenter),
    detailsX: boxLeftX(zones.leftInfo),
    detailsY: zones.leftInfo.y,
    detailsAlign: zoneAlign(zones.leftInfo),
    details2X: boxLeftX(zones.rightInfo),
    details2Y: zones.rightInfo.y,
    details2Align: zoneAlign(zones.rightInfo),
    dateX: boxLeftX(zones.date),
    dateY: zones.date.y,
    dateAlign: zoneAlign(zones.date),
    priceX: boxLeftX(zones.price),
    priceY: zones.price.y,
    priceAlign: zoneAlign(zones.price),
    venueX: boxLeftX(zones.venue),
    venueY: zones.venue.y,
    venueAlign: zoneAlign(zones.venue),
    subtagX: boxLeftX(zones.subtag),
    subtagY: zones.subtag.y,
    subtagAlign: zoneAlign(zones.subtag),
    subjectVisibleRect: zones.subject,
    mainTitleRect: zones.headline,
    scriptRect: zones.script,
    leftMetaRect: zones.leftInfo,
    rightMetaRect: zones.rightInfo,
    footerRect: zones.venue,
    priceRect: zones.price,
    cocoSubjectLayoutId: layoutId,
    cocoCenterZones: centerZones ?? null,
    ...(centerZones
      ? {
          complianceX: boxLeftX(centerZones.compliance),
          complianceY: centerZones.compliance.y,
          complianceAlign: centerZones.compliance.align,
          qrX: boxLeftX(centerZones.qr),
          qrY: centerZones.qr.y,
          leftRailX: boxLeftX(centerZones.rsvpContact),
          leftRailY: centerZones.rsvpContact.y,
          rightRailX: boxLeftX(centerZones.musicPolicy),
          rightRailY: centerZones.musicPolicy.y,
        }
      : {}),
    textZones: {
      ...(existingTextZones ?? {}),
      promoter: zones.presenter,
      centerSubject: zones.subject,
      blockHeadline: zones.headline,
      scriptTitle: zones.script,
      leftDjLane: zones.leftInfo,
      rightPriceLane: zones.rightInfo,
      dateBadge: zones.date,
      price: zones.price,
      footerInfo: zones.venue,
      subtag: zones.subtag,
      ...(centerZones
        ? {
            footerBand: centerZones.venueBand,
            footerVenue: centerZones.venueBand,
            footerSocials: centerZones.socialRail,
            footerMeta: centerZones.footerRight,
            headlineZone: centerZones.headlineZone,
            leftZone: centerZones.leftZone,
            rightZone: centerZones.rightZone,
            footerZone: centerZones.footerZone,
            eventName: centerZones.eventName,
            presenter: centerZones.presenter,
            dateTime: centerZones.dateTime,
            venueAddress: centerZones.venueAddress,
            eventDetails: centerZones.eventDetails,
            musicPolicy: centerZones.musicPolicy,
            rsvpContact: centerZones.rsvpContact,
            addons: centerZones.addons,
            djLineup: centerZones.djLineup,
            entryPrice: centerZones.entryPrice,
            social: centerZones.social,
            compliance: centerZones.compliance,
            qr: centerZones.qr,
          }
        : {}),
    },
  };
}
