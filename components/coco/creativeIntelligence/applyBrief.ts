import type {
  CocoCreativeBrief,
  CocoTournamentAlign,
  CocoTournamentRect,
  CocoTournamentText,
  CocoTournamentZoneMap,
} from "../layoutTournament";

export function applyCreativeBriefToZones(
  zones: CocoTournamentZoneMap,
  brief: CocoCreativeBrief,
  text: CocoTournamentText
): CocoTournamentZoneMap {
  if (!brief.polishRules?.useOneTypeColumn) return zones;

  const column = columnForBrief(brief);
  const premiumStack =
    brief.recommendedComposition === "left-premium-stack" ||
    brief.recommendedComposition === "right-premium-stack";
  const story = brief.storyId;
  const headlineHeight = premiumStack ? (story === "luxury-tropical-brunch" ? 27 : 25) : 18;
  const accentHeight = premiumStack ? 5.8 : 6.5;
  const metaHeight = premiumStack ? 7.5 : 7;
  const dateHeight = premiumStack ? 5.6 : 6;
  const venueHeight = premiumStack ? 5.2 : 5.6;
  const headlineToAccent = premiumStack ? 2.4 : 3.2;
  const accentToMeta = premiumStack ? 5.8 : 6.8;
  const metaToDate = premiumStack ? 9.2 : 10;
  const dateToVenue = premiumStack ? 4.8 : 5.5;

  const headline = stackRect(column, column.y, column.width, headlineHeight);
  const script = stackRect(
    column,
    headline.y + headline.height + headlineToAccent,
    column.width * (premiumStack ? 0.62 : 0.74),
    accentHeight
  );
  const details = stackRect(
    column,
    script.y + script.height + accentToMeta,
    column.width * (premiumStack ? 0.82 : 0.86),
    metaHeight
  );
  const date = stackRect(
    column,
    details.y + details.height + metaToDate,
    column.width * (premiumStack ? 0.56 : 0.62),
    dateHeight
  );
  const venue = stackRect(
    column,
    date.y + date.height + dateToVenue,
    column.width * (premiumStack ? 0.74 : 0.78),
    venueHeight
  );
  const presenter = zones.presenter
    ? preserveUtilityZone(zones.presenter, column, "presenter")
    : zones.presenter;
  const price = zones.price
    ? preserveUtilityZone(zones.price, column, "price")
    : zones.price;

  return {
    ...zones,
    date: clampRect(date),
    headline: clampRect(headline),
    leftInfo: clampRect(details),
    presenter: clampRect(presenter),
    price: clampRect(price),
    rightInfo: secondaryZoneForBrief(zones.rightInfo, column, brief, text),
    script: clampRect(script),
    subtag: hiddenRect(column),
    venue: clampRect(venue),
  };
}

function columnForBrief(brief: CocoCreativeBrief): CocoTournamentRect {
  switch (brief.recommendedComposition) {
    case "left-premium-stack":
      return {
        align: "left",
        height: 76,
        width: 42,
        x: 6,
        y: 15,
      };
    case "right-premium-stack":
      return {
        align: "right",
        height: 76,
        width: 38,
        x: 56,
        y: 18,
      };
    case "bottom-lockup":
      return {
        align: "center",
        height: 34,
        width: 84,
        x: 8,
        y: 58,
      };
    case "center-poster-stack":
    default:
      return {
        align: "center",
        height: 70,
        width: 76,
        x: 12,
        y: 12,
      };
  }
}

function secondaryZoneForBrief(
  fallback: CocoTournamentRect,
  column: CocoTournamentRect,
  brief: CocoCreativeBrief,
  text: CocoTournamentText
) {
  const hasSecondary = Boolean(String(text.details2 ?? "").trim());
  if (!hasSecondary || brief.polishRules?.mergeSecondaryCopy || brief.polishRules?.preferMetadataOverBodyCopy) {
    return hiddenRect(column);
  }

  return clampRect(
    stackRect(
      column,
      column.y + column.height - 7,
      column.width * 0.7,
      5
    )
  ) ?? fallback;
}

function preserveUtilityZone(
  zone: CocoTournamentRect,
  column: CocoTournamentRect,
  role: "presenter" | "price"
): CocoTournamentRect {
  if (role === "presenter") {
    return {
      ...zone,
      align: column.align,
      width: Math.min(zone.width, column.width * 0.72),
      x: column.align === "right" ? column.x + column.width * 0.28 : column.x,
    };
  }

  return zone;
}

function hiddenRect(column: CocoTournamentRect): CocoTournamentRect {
  return {
    align: column.align,
    height: 1,
    width: 1,
    x: column.x,
    y: column.y + column.height - 1,
  };
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  align: CocoTournamentAlign | undefined
): CocoTournamentRect {
  return {
    align,
    height,
    width,
    x,
    y,
  };
}

function stackRect(
  column: CocoTournamentRect,
  y: number,
  width: number,
  height: number
): CocoTournamentRect {
  const safeWidth = Math.max(1, width);
  const x = column.align === "right" ? column.x + column.width - safeWidth : column.x;
  return rect(x, y, safeWidth, height, column.align);
}

function clampRect<T extends CocoTournamentRect | undefined>(rect: T): T {
  if (!rect) return rect;
  const width = clamp(rect.width, 1, 100);
  const height = clamp(rect.height, 1, 100);
  return {
    ...rect,
    height: Number(height.toFixed(3)),
    width: Number(width.toFixed(3)),
    x: Number(clamp(rect.x, 0, 100 - width).toFixed(3)),
    y: Number(clamp(rect.y, 0, 100 - height).toFixed(3)),
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
