import type { CocoTypographyStackModel, CocoTypographyStackTextLayer } from "./types";
import type { CocoTypographyZoneModel } from "./buildTypographyStackModel";

type DrawTypographyStackInput = {
  height: number;
  model: CocoTypographyStackModel;
  scaleText?: (value: number) => number;
  z?: Partial<Record<CocoTypographyStackModel["items"][number]["kind"], number>>;
};

const DEFAULT_Z = {
  accent: 132,
  badge: 132,
  compliance: 132,
  dateTime: 132,
  footer: 132,
  headline: 132,
  metadata: 132,
  presenter: 132,
  tagline: 132,
  venue: 132,
} satisfies NonNullable<DrawTypographyStackInput["z"]>;

export function drawTypographyStackTextLayers({
  height,
  model,
  scaleText,
  z,
}: DrawTypographyStackInput): CocoTypographyStackTextLayer[] {
  const scale = scaleText ?? ((value: number) => value);
  const safeHeight = Math.max(1, height);
  const layers: CocoTypographyStackTextLayer[] = [];
  let cursorY = model.rect.y;

  for (const item of model.items) {
    cursorY += item.spacingBeforePct;
    const style = item.style;
    const fontSize = Math.max(1, scale(style.fontSize));
    const lineHeight = Number(style.lineHeight ?? 1) || 1;
    const lineCount = Math.max(1, item.text.split(/\r?\n/).length);
    // The model's measured height is the same ink-aware flow height reserved
    // by TypographyStack.tsx. Prefer that percentage-space authority so
    // export advances to the next row exactly where preview does; retain the
    // legacy calculation only for older stored models without measuredRect.
    const heightPct = item.measuredRect?.height ??
      ((fontSize * lineHeight * lineCount) / safeHeight) * 100;

    layers.push({
      align: item.align,
      color: style.color,
      effects: item.effects,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontStyle: style.fontStyle,
      fontWeight: style.fontWeight,
      id: item.id,
      kind: "text",
      letterSpacingEm: style.letterSpacingEm,
      lineHeight,
      opacity: style.opacity,
      rotation: item.rotationDeg,
      strokeColor: style.strokeColor,
      strokeWidth: style.strokeWidth,
      text: item.text,
      textShadow: stackTextShadow(style.shadow, item.effects, style.color),
      uppercase: style.textTransform === "uppercase",
      widthPct: model.rect.width * item.maxWidthRatio,
      xPct: model.rect.x + Number(item.offsetXPct ?? 0),
      yPct: cursorY + Number(item.offsetYPct ?? 0),
      z: z?.[item.kind] ?? DEFAULT_Z[item.kind] ?? 132,
    });

    cursorY += heightPct;
  }

  return layers;
}

export function drawTypographyZoneTextLayer({
  model,
  z,
}: {
  model: CocoTypographyZoneModel;
  z?: Partial<Record<CocoTypographyStackModel["items"][number]["kind"], number>>;
}): CocoTypographyStackTextLayer {
  const item = model.item;
  const style = item.style;
  return {
    align: item.align,
    color: style.color,
    effects: item.effects,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontStyle: style.fontStyle,
    fontWeight: style.fontWeight,
    id: item.id,
    kind: "text",
    letterSpacingEm: style.letterSpacingEm,
    lineHeight: Number(style.lineHeight ?? 1) || 1,
    opacity: style.opacity,
    rotation: item.rotationDeg,
    strokeColor: style.strokeColor,
    strokeWidth: style.strokeWidth,
    text: item.text,
    textShadow: stackTextShadow(style.shadow, item.effects, style.color),
    uppercase: style.textTransform === "uppercase",
    widthPct: model.rect.width * item.maxWidthRatio,
    xPct: model.rect.x + Number(item.offsetXPct ?? 0),
    yPct: model.rect.y + item.spacingBeforePct + Number(item.offsetYPct ?? 0),
    z: z?.[item.kind] ?? DEFAULT_Z[item.kind] ?? 132,
  };
}

function stackTextShadow(
  baseShadow: string | undefined,
  effects: CocoTypographyStackModel["items"][number]["effects"],
  color: string | undefined
) {
  const shadows = [];
  if (baseShadow && baseShadow !== "none") shadows.push(baseShadow);
  const boost = Math.max(0, Number(effects?.glowBoost ?? 0));
  const glowColor = color || "#ffffff";
  if (boost > 0) shadows.push(`0 0 ${Math.round(boost * 24)}px ${glowColor}`);
  if (effects?.softBloom) shadows.push(`0 0 18px ${glowColor}`);
  return shadows.length ? shadows.join(", ") : undefined;
}
