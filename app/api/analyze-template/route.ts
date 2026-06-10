import { NextResponse } from "next/server";
import sharp from "sharp";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { supabaseAuth } from "../../../lib/supabase/auth";
import { extractClientTrackingPayload, insertAnalyticsEventForUser } from "../../../lib/analytics/server";
import {
  getAccessSnapshotForUser,
  refundGenerationUnits,
  reserveGenerationUnits,
} from "../../../lib/accessQuota";
import {
  BODY_FONTS_LOCAL,
  HEADLINE2_FONTS_LOCAL,
  HEADLINE_FONTS_LOCAL,
  SUBTAG_FONTS_LOCAL,
  VENUE_FONTS_LOCAL,
} from "../../../lib/fonts";
import type {
  CreativeBrief,
  ImageLayer,
  PosterSize,
  Rect,
  SceneLayer,
  SubjectAnalysis,
  Vibe,
} from "../../../lib/artDirectorEngine";
import {
  findBlueprintLayerBySlot,
  findBlueprintTextLayer,
  generatePosterFromBlueprint,
} from "../../../lib/posterBlueprintEngine";
import { getCinematicDepthEditorFx } from "../../../lib/cinematicDepthEngine";
import { getSubjectCameraProfile } from "../../../lib/subjectCameraComposer";
import {
  classifyTextContentSemanticPriority,
  compressPromotionText,
} from "../../../lib/semanticImportanceDirector";
import { directSemanticHierarchy } from "../../../lib/semanticHierarchyDirector";
import {
  coordinatePlanToEditorPatch,
  createOptimizedCoordinatePlan,
  type FlyerStyle,
  type SubjectCrop,
  type SubjectOrientation,
} from "../../../lib/coordinateDirector";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_LAYOUT_MODEL = process.env.OPENAI_LAYOUT_MODEL || "gpt-4o-2024-08-06";

const HEADLINE_FONT_CHOICES = [...HEADLINE_FONTS_LOCAL];
const HEAD2_FONT_CHOICES = [...HEADLINE2_FONTS_LOCAL];
const BODY_FONT_CHOICES = [...BODY_FONTS_LOCAL];
const VENUE_FONT_CHOICES = [...VENUE_FONTS_LOCAL];
const SUBTAG_FONT_CHOICES = [...SUBTAG_FONTS_LOCAL];

const STYLE_CHOICES = ["urban", "neon", "vintage", "tropical"] as const;
const ALIGN_CHOICES = ["left", "center", "right"] as const;
const FORMAT_CHOICES = ["square", "story"] as const;

type Format = (typeof FORMAT_CHOICES)[number];
type TextZone = {
  side: "left" | "center" | "right";
  align: "left" | "center" | "right";
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  meanBrightness: number;
  detailScore: number;
};

type SceneProfile = {
  brightness: "bright" | "mid" | "dark";
  temperature: "warm" | "cool" | "neutral";
};

type AutoLayoutTextMode = "generate" | "provided";
type FlyerTextInput = {
  headline: string;
  head2line: string;
  details: string;
  details2: string;
  venue: string;
  subtag: string;
};
type SubjectBoundsBox = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};
type VisualMassAnalysis = {
  silhouetteBounds: SubjectBoundsBox;
  massCenter: {
    x: number;
    y: number;
  };
  occupiedRatio: number;
  edgeComplexity: number;
  verticalWeight: number;
  horizontalWeight: number;
  visualPressure: number;
};
type RenderedSubjectBounds = SubjectBoundsBox & {
  visualMass?: VisualMassAnalysis | null;
};
type SubjectPlacementInput = {
  id?: string;
  x?: number;
  y?: number;
  scale?: number;
  renderedBounds?: RenderedSubjectBounds | null;
};
type SubjectPosterContext = {
  placement: Required<Pick<SubjectPlacementInput, "x" | "y" | "scale">> & { id?: string };
  renderedBounds: RenderedSubjectBounds | null;
  bounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  } | null;
  side: "left" | "center" | "right";
  mode: "CENTER_HERO" | "LEFT_DOMINANT" | "RIGHT_DOMINANT" | "CLOSEUP_CROP";
  transparentPct: number | null;
  visualMass: VisualMassAnalysis | null;
};

class AutoLayoutInputError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AutoLayoutInputError";
    this.status = status;
  }
}

function isDataUrl(v: string) {
  return typeof v === "string" && v.startsWith("data:image/");
}

function dataUrlToBuffer(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Invalid data URL");
  return Buffer.from(dataUrl.slice(comma + 1), "base64");
}

async function toBufferFromAnyImage(input: string): Promise<Buffer> {
  if (typeof input !== "string") throw new Error("Invalid image input");
  if (input.startsWith("blob:")) {
    throw new Error("Blob URLs are not supported. Send a data URL or http(s) URL.");
  }
  if (isDataUrl(input)) return dataUrlToBuffer(input);
  if (!/^https?:\/\//i.test(input)) {
    throw new Error("Invalid image input. Expected data URL or http(s) URL.");
  }

  const res = await fetch(input);
  if (!res.ok) {
    throw new Error(`Failed to fetch image URL: ${res.status} ${res.statusText}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function bufferToDataUrl(buf: Buffer, mime: string) {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function asTrimmedString(v: unknown, fallback = "", maxLen = 180) {
  const clean = String(v ?? fallback)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean) return fallback;
  return clean.slice(0, maxLen);
}

function pickEnum<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  const normalized = String(value || "").trim();
  return (allowed as readonly string[]).includes(normalized) ? (normalized as T[number]) : fallback;
}

function normalizeHex(value: unknown, fallback: string) {
  const raw = String(value || "").trim();
  return /^#([0-9a-f]{6})$/i.test(raw) ? raw.toUpperCase() : fallback;
}

function asFiniteNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSubjectBoundsBox(value: unknown): SubjectBoundsBox | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const centerX = asFiniteNumber(raw.centerX, NaN);
  const centerY = asFiniteNumber(raw.centerY, NaN);
  const width = asFiniteNumber(raw.width, NaN);
  const height = asFiniteNumber(raw.height, NaN);
  if (![centerX, centerY, width, height].every(Number.isFinite)) return null;
  if (width <= 0 || height <= 0) return null;
  return {
    centerX: clamp(centerX, -20, 120),
    centerY: clamp(centerY, -20, 120),
    width: clamp(width, 1, 180),
    height: clamp(height, 1, 180),
  };
}

function normalizeVisualMassAnalysis(value: unknown): VisualMassAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const silhouetteBounds = normalizeSubjectBoundsBox(raw.silhouetteBounds);
  const massCenterRaw = raw.massCenter;
  if (!silhouetteBounds || !massCenterRaw || typeof massCenterRaw !== "object") return null;

  const massCenter = massCenterRaw as Record<string, unknown>;
  const x = asFiniteNumber(massCenter.x, NaN);
  const y = asFiniteNumber(massCenter.y, NaN);
  if (![x, y].every(Number.isFinite)) return null;

  const occupiedRatio = clamp(asFiniteNumber(raw.occupiedRatio, 0.62), 0.02, 1);
  const visualPressure = asFiniteNumber(raw.visualPressure, NaN);

  return {
    silhouetteBounds,
    massCenter: {
      x: clamp(x, -20, 120),
      y: clamp(y, -20, 120),
    },
    occupiedRatio,
    edgeComplexity: clamp(asFiniteNumber(raw.edgeComplexity, 0), 0, 100),
    verticalWeight: clamp(asFiniteNumber(raw.verticalWeight, 0.5), 0, 1),
    horizontalWeight: clamp(asFiniteNumber(raw.horizontalWeight, 0.5), 0, 1),
    visualPressure: Number.isFinite(visualPressure)
      ? clamp(visualPressure, 0.01, 1.6)
      : measureVisualPressure(silhouetteBounds, occupiedRatio),
  };
}

function normalizeRenderedSubjectBounds(value: unknown): RenderedSubjectBounds | null {
  const box = normalizeSubjectBoundsBox(value);
  if (!box || !value || typeof value !== "object") return box;
  const raw = value as Record<string, unknown>;
  const visualMass = normalizeVisualMassAnalysis(raw.visualMass);
  return visualMass ? { ...box, visualMass } : box;
}

function hasCurrentSubjectPlacement(
  placement: SubjectPlacementInput | null
): placement is SubjectPlacementInput & Required<Pick<SubjectPlacementInput, "x" | "y" | "scale">> {
  return (
    !!placement &&
    Number.isFinite(placement.x) &&
    Number.isFinite(placement.y) &&
    Number.isFinite(placement.scale) &&
    Number(placement.scale) > 0
  );
}

function assertRequiredSubjectInput(subjectImageUrl: string, placement: SubjectPlacementInput | null) {
  if (!subjectImageUrl) {
    throw new AutoLayoutInputError("Missing subject imageUrl");
  }
  if (!hasCurrentSubjectPlacement(placement)) {
    throw new AutoLayoutInputError("Missing current subject placement");
  }
  if (!placement.renderedBounds) {
    throw new AutoLayoutInputError("Missing rendered subject bounds");
  }
}

async function buildCompressedAnalysisImage(buf: Buffer): Promise<{
  dataUrl: string;
  brightness: SceneProfile["brightness"];
  temperature: SceneProfile["temperature"];
}> {
  const resized = await sharp(buf)
    .resize(1400, 1400, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const stats = await sharp(resized).removeAlpha().stats();
  const r = stats.channels[0]?.mean ?? 128;
  const g = stats.channels[1]?.mean ?? 128;
  const b = stats.channels[2]?.mean ?? 128;
  const brightness = (r + g + b) / 3;
  const warmth = r - b;

  return {
    dataUrl: bufferToDataUrl(resized, "image/jpeg"),
    brightness:
      brightness > 175 ? "bright" : brightness > 105 ? "mid" : "dark",
    temperature:
      warmth > 12 ? "warm" : warmth < -12 ? "cool" : "neutral",
  };
}

async function analyzeSubjectForPoster(
  subject: string,
  placementInput?: SubjectPlacementInput | null
): Promise<SubjectPosterContext | null> {
  const src = String(subject || "").trim();
  if (!src) return null;

  const placement = {
    id: typeof placementInput?.id === "string" ? placementInput.id : undefined,
    x: clamp(asFiniteNumber(placementInput?.x, 50), 0, 100),
    y: clamp(asFiniteNumber(placementInput?.y, 50), 0, 100),
    scale: clamp(asFiniteNumber(placementInput?.scale, 1), 0.1, 5),
  };
  const renderedBounds = normalizeRenderedSubjectBounds(placementInput?.renderedBounds);

  let bounds: SubjectPosterContext["bounds"] = null;
  let transparentPct: number | null = null;
  let sourceVisualMass: VisualMassAnalysis | null = null;

  const buf = await toBufferFromAnyImage(src);
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mass = analyzeVisualMassFromAlpha(data, info.width, info.height, info.channels);
  transparentPct = mass.transparentPct;
  sourceVisualMass = mass.visualMass;

  if (!sourceVisualMass) {
    throw new Error("No visible pixels found");
  }

  const xMin = sourceVisualMass.silhouetteBounds.centerX - sourceVisualMass.silhouetteBounds.width / 2;
  const xMax = sourceVisualMass.silhouetteBounds.centerX + sourceVisualMass.silhouetteBounds.width / 2;
  const yMin = sourceVisualMass.silhouetteBounds.centerY - sourceVisualMass.silhouetteBounds.height / 2;
  const yMax = sourceVisualMass.silhouetteBounds.centerY + sourceVisualMass.silhouetteBounds.height / 2;
  bounds = {
    xMin,
    xMax,
    yMin,
    yMax,
    width: xMax - xMin,
    height: yMax - yMin,
    centerX: (xMin + xMax) / 2,
    centerY: (yMin + yMax) / 2,
  };

  const visualMass =
    renderedBounds?.visualMass ??
    (sourceVisualMass
      ? renderedBounds
        ? projectSourceVisualMassToCanvas(sourceVisualMass, renderedBounds)
        : estimateSourceVisualMassToCanvas(placement, sourceVisualMass)
      : renderedBounds
      ? createVisualMassFromBounds(renderedBounds)
      : null);

  const side =
    placement.x < 43 ? "left" : placement.x > 57 ? "right" : "center";
  const estimatedDominance = (visualMass?.silhouetteBounds.height ?? bounds?.height ?? 72) * placement.scale;
  const mode =
    estimatedDominance > 96
      ? "CLOSEUP_CROP"
      : side === "left"
      ? "LEFT_DOMINANT"
      : side === "right"
      ? "RIGHT_DOMINANT"
      : "CENTER_HERO";

  return { placement, renderedBounds, bounds, side, mode, transparentPct, visualMass };
}

function analyzeVisualMassFromAlpha(
  data: Buffer,
  width: number,
  height: number,
  channels: number
): {
  transparentPct: number | null;
  visualMass: VisualMassAnalysis | null;
} {
  if (!width || !height || !channels) return { transparentPct: null, visualMass: null };

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let transparent = 0;
  let alphaMass = 0;
  let weightedX = 0;
  let weightedY = 0;
  let opaqueCount = 0;
  const total = width * height;
  const mask = new Uint8Array(total);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * channels + 3] ?? 255;
      if (alpha <= 8) transparent += 1;
      if (alpha <= 18) continue;

      const index = y * width + x;
      const weight = alpha / 255;
      mask[index] = 1;
      alphaMass += weight;
      weightedX += (x + 0.5) * weight;
      weightedY += (y + 0.5) * weight;
      opaqueCount += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const transparentPct = total ? Number(((transparent / total) * 100).toFixed(2)) : null;
  if (maxX < minX || maxY < minY || alphaMass <= 0) return { transparentPct, visualMass: null };

  let edgeCount = 0;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const index = y * width + x;
      if (!mask[index]) continue;
      if (
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        !mask[index - 1] ||
        !mask[index + 1] ||
        !mask[index - width] ||
        !mask[index + width]
      ) {
        edgeCount += 1;
      }
    }
  }

  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;
  const silhouetteBounds = {
    centerX: Number((((minX + boxWidth / 2) / width) * 100).toFixed(2)),
    centerY: Number((((minY + boxHeight / 2) / height) * 100).toFixed(2)),
    width: Number(((boxWidth / width) * 100).toFixed(2)),
    height: Number(((boxHeight / height) * 100).toFixed(2)),
  };
  const occupiedRatio = clamp(alphaMass / Math.max(1, boxWidth * boxHeight), 0.02, 1);

  const visualMass: VisualMassAnalysis = {
    silhouetteBounds,
    massCenter: {
      x: Number(((weightedX / alphaMass / width) * 100).toFixed(2)),
      y: Number(((weightedY / alphaMass / height) * 100).toFixed(2)),
    },
    occupiedRatio: Number(occupiedRatio.toFixed(3)),
    edgeComplexity: Number(clamp(edgeCount / Math.max(1, Math.sqrt(opaqueCount)), 0, 100).toFixed(2)),
    verticalWeight: Number(clamp(weightedY / alphaMass / height, 0, 1).toFixed(3)),
    horizontalWeight: Number(clamp(weightedX / alphaMass / width, 0, 1).toFixed(3)),
    visualPressure: 0,
  };
  visualMass.visualPressure = measureVisualPressure(visualMass.silhouetteBounds, visualMass.occupiedRatio);

  return { transparentPct, visualMass };
}

function projectSourceVisualMassToCanvas(
  sourceMass: VisualMassAnalysis,
  renderedFullBounds: SubjectBoundsBox
): VisualMassAnalysis {
  const left = renderedFullBounds.centerX - renderedFullBounds.width / 2;
  const top = renderedFullBounds.centerY - renderedFullBounds.height / 2;
  const sourceBounds = sourceMass.silhouetteBounds;
  const silhouetteBounds = {
    centerX: left + (sourceBounds.centerX / 100) * renderedFullBounds.width,
    centerY: top + (sourceBounds.centerY / 100) * renderedFullBounds.height,
    width: (sourceBounds.width / 100) * renderedFullBounds.width,
    height: (sourceBounds.height / 100) * renderedFullBounds.height,
  };
  const massCenter = {
    x: left + (sourceMass.massCenter.x / 100) * renderedFullBounds.width,
    y: top + (sourceMass.massCenter.y / 100) * renderedFullBounds.height,
  };

  return {
    ...sourceMass,
    silhouetteBounds,
    massCenter,
    visualPressure: measureVisualPressure(silhouetteBounds, sourceMass.occupiedRatio),
  };
}

function estimateSourceVisualMassToCanvas(
  placement: Required<Pick<SubjectPlacementInput, "x" | "y" | "scale">> & { id?: string },
  sourceMass: VisualMassAnalysis
): VisualMassAnalysis {
  const sourceBounds = sourceMass.silhouetteBounds;
  const silhouetteBounds = {
    centerX: placement.x + (sourceBounds.centerX - 50) * placement.scale,
    centerY: placement.y + (sourceBounds.centerY - 50) * placement.scale,
    width: sourceBounds.width * placement.scale,
    height: sourceBounds.height * placement.scale,
  };
  const massCenter = {
    x: placement.x + (sourceMass.massCenter.x - 50) * placement.scale,
    y: placement.y + (sourceMass.massCenter.y - 50) * placement.scale,
  };

  return {
    ...sourceMass,
    silhouetteBounds,
    massCenter,
    visualPressure: measureVisualPressure(silhouetteBounds, sourceMass.occupiedRatio),
  };
}

function createVisualMassFromBounds(bounds: SubjectBoundsBox): VisualMassAnalysis {
  return {
    silhouetteBounds: bounds,
    massCenter: {
      x: bounds.centerX,
      y: bounds.centerY,
    },
    occupiedRatio: 0.62,
    edgeComplexity: 0,
    verticalWeight: 0.5,
    horizontalWeight: 0.5,
    visualPressure: measureVisualPressure(bounds, 0.62),
  };
}

function measureVisualPressure(bounds: SubjectBoundsBox, occupiedRatio = 0.62): number {
  const boxArea = (Math.max(0, bounds.width) * Math.max(0, bounds.height)) / 10000;
  const density = clamp(occupiedRatio, 0.2, 1);
  return Number(clamp(boxArea * (0.72 + density * 0.28), 0.01, 1.6).toFixed(3));
}

function pickFirstAvailable(choices: string[], allowed: string[], fallback: string) {
  return choices.find((choice) => allowed.includes(choice)) || fallback;
}

function lineCount(text: string) {
  return Math.max(1, String(text || "").split("\n").length);
}

function maxLineLength(text: string) {
  return String(text || "")
    .split("\n")
    .reduce((max, line) => Math.max(max, line.trim().length), 0);
}

function buildTypographyPreset(
  style: (typeof STYLE_CHOICES)[number],
  scene: SceneProfile,
  format: Format,
  copy: { headline: string; head2line: string; details: string; details2: string; venue: string; subtag: string }
) {
  const pools = {
    tropical: {
      headline: ["African", "ChettaVissto", "Bebas Neue", "Azonix", "Maglisto"],
      head2: ["OpenScript", "Maglisto", "ChettaVissto", "Bebas Neue"],
      body: ["LEMONMILK-Regular", "LEMONMILK-Light", "Nexa-Heavy", "Coolvetica Hv Comp"],
      venue: ["LEMONMILK-Light", "Bebas Neue", "Nexa-Heavy"],
      subtag: ["Nexa-Heavy", "Coolvetica Hv Comp", "LEMONMILK-Regular"],
    },
    neon: {
      headline: ["Doctor Glitch", "Game Of Squids", "Galaxia Personal Used", "Aliens Among Us", "Designer"],
      head2: ["Galaxia Personal Used", "Game Of Squids", "OpenScript", "Bebas Neue"],
      body: ["LEMONMILK-Regular", "Nexa-Heavy", "LEMONMILK-Light", "Coolvetica Hv Comp"],
      venue: ["LEMONMILK-Light", "Bebas Neue", "Nexa-Heavy"],
      subtag: ["Coolvetica Hv Comp", "Nexa-Heavy", "LEMONMILK-Regular"],
    },
    urban: {
      headline: ["Designer", "Bebas Neue", "Antonio", "Octin College Rg", "Nexa-Heavy"],
      head2: ["OpenScript", "Antonio", "Bebas Neue", "Nexa-Heavy"],
      body: ["LEMONMILK-Regular", "Nexa-Heavy", "LEMONMILK-Light", "Coolvetica Hv Comp"],
      venue: ["Bebas Neue", "LEMONMILK-Light", "Nexa-Heavy"],
      subtag: ["Nexa-Heavy", "Coolvetica Hv Comp", "LEMONMILK-Regular"],
    },
    vintage: {
      headline: ["Maglisto", "Brich", "Atlantis Famingo DEMO VERSION", "Bebas Neue", "ChettaVissto"],
      head2: ["OpenScript", "Maglisto", "Atlantis Famingo DEMO VERSION", "Bebas Neue"],
      body: ["LEMONMILK-Regular", "LEMONMILK-Light", "Coolvetica Hv Comp", "Nexa-Heavy"],
      venue: ["LEMONMILK-Light", "Maglisto", "Bebas Neue"],
      subtag: ["Coolvetica Hv Comp", "LEMONMILK-Regular", "Nexa-Heavy"],
    },
  }[style];

  const headlineLines = lineCount(copy.headline);
  const headlineLongest = maxLineLength(copy.headline);
  const head2Lines = lineCount(copy.head2line);
  const head2Longest = maxLineLength(copy.head2line);
  const detailsLines = lineCount(copy.details);
  const details2Lines = lineCount(copy.details2);
  const venueLines = lineCount(copy.venue);

  const compactHeadline = headlineLines > 2 || headlineLongest > 14;
  const compactHead2 = head2Lines > 1 || head2Longest > 18;
  const denseDetails = detailsLines >= 3 || maxLineLength(copy.details) > 22;

  const readableHeadlinePool =
    style === "neon"
      ? ["Bebas Neue", "Designer", "Antonio", "Nexa-Heavy", ...pools.headline]
      : style === "tropical"
      ? ["Bebas Neue", "ChettaVissto", "Azonix", "Nexa-Heavy", ...pools.headline]
      : style === "vintage"
      ? ["Bebas Neue", "Maglisto", "Brich", "Nexa-Heavy", ...pools.headline]
      : ["Bebas Neue", "Antonio", "Nexa-Heavy", "Designer", ...pools.headline];
  const readableHead2Pool =
    compactHead2
      ? ["Bebas Neue", "Antonio", "Nexa-Heavy", ...pools.head2]
      : pools.head2;
  const readableBodyPool =
    denseDetails
      ? ["LEMONMILK-Light", "LEMONMILK-Regular", "Coolvetica Hv Comp", "Nexa-Heavy", ...pools.body]
      : pools.body;

  const headlineFamily = pickFirstAvailable(
    compactHeadline ? readableHeadlinePool : pools.headline,
    HEADLINE_FONT_CHOICES,
    HEADLINE_FONT_CHOICES[0] || "Bebas Neue"
  );
  const head2Family = pickFirstAvailable(
    readableHead2Pool,
    HEAD2_FONT_CHOICES,
    HEAD2_FONT_CHOICES[0] || headlineFamily
  );
  const detailsFamily = pickFirstAvailable(
    readableBodyPool,
    BODY_FONT_CHOICES,
    BODY_FONT_CHOICES[0] || "LEMONMILK-Regular"
  );
  const details2Family = pickFirstAvailable(
    scene.brightness === "dark"
      ? ["LEMONMILK-Light", "Coolvetica Hv Comp", "LEMONMILK-Regular"]
      : pools.body,
    BODY_FONT_CHOICES,
    BODY_FONT_CHOICES[0] || detailsFamily
  );
  const venueFamily = pickFirstAvailable(pools.venue, VENUE_FONT_CHOICES, VENUE_FONT_CHOICES[0] || detailsFamily);
  const subtagFamily = pickFirstAvailable(pools.subtag, SUBTAG_FONT_CHOICES, SUBTAG_FONT_CHOICES[0] || detailsFamily);

  const headlineSizeBase =
    style === "neon" ? (format === "story" ? 118 : 96) :
    style === "tropical" ? (format === "story" ? 112 : 92) :
    style === "vintage" ? (format === "story" ? 104 : 86) :
    (format === "story" ? 110 : 90);

  return {
    headlineFamily,
    head2Family,
    detailsFamily,
    details2Family,
    venueFamily,
    subtagFamily,
    headlineSize: clamp(
      headlineSizeBase - Math.max(0, headlineLines - 1) * 10 - Math.max(0, headlineLongest - 12) * 1.4,
      42,
      160
    ),
    headlineHeight:
      headlineFamily === "African" || headlineFamily === "ChettaVissto"
        ? (headlineLines > 1 ? 0.9 : 0.94)
        : headlineFamily === "Bebas Neue" || headlineFamily === "Antonio"
        ? (headlineLines > 1 ? 0.88 : 0.92)
        : headlineLines > 1
        ? 0.92
        : 0.96,
    head2Size:
      style === "vintage" ? (format === "story" ? 78 : 62) :
      style === "neon" ? (format === "story" ? 82 : 66) :
      (format === "story" ? 74 : 58) - Math.max(0, head2Longest - 14) * 1.2,
    head2LineHeight:
      head2Family === "OpenScript" || head2Family === "Maglisto"
        ? 1.02
        : compactHead2
        ? 0.98
        : 0.94,
    detailsSize: denseDetails ? (format === "story" ? 16 : 15) : format === "story" ? 17 : 16,
    detailsLineHeight:
      detailsFamily.includes("LEMONMILK") || detailsFamily === "Nexa-Heavy"
        ? (detailsLines >= 3 ? 1.02 : 0.98)
        : detailsFamily.includes("Coolvetica")
        ? 1.04
        : 1.08,
    details2Size: format === "story" ? 13 : 12,
    details2LineHeight: details2Lines > 1 ? 1.02 : 0.98,
    venueSize:
      venueFamily === "Bebas Neue"
        ? (format === "story" ? 28 : 24)
        : (format === "story" ? 22 : 19),
    venueLineHeight: venueLines > 1 ? 1.02 : 0.96,
    subtagSize: format === "story" ? 17 : 15,
  };
}

function buildColorPreset(
  style: (typeof STYLE_CHOICES)[number],
  scene: SceneProfile,
  zoneBrightness: number
) {
  const isBrightZone = zoneBrightness > 155;
  const darkBase = "#0F172A";
  const darkWarm = "#2B1608";
  const lightBase = "#FFFFFF";
  const lightWarm = "#FFF4D6";

  if (style === "tropical") {
    return {
      headColor: isBrightZone ? darkWarm : lightWarm,
      head2Color: scene.temperature === "cool" ? "#2DD4BF" : "#FF7A18",
      bodyColor: isBrightZone ? "#1F2937" : "#FFF4D6",
      details2Color: isBrightZone ? "#334155" : "#E5E7EB",
      venueColor: isBrightZone ? darkWarm : "#FFFFFF",
      subtagTextColor: "#FFFFFF",
    };
  }

  if (style === "neon") {
    return {
      headColor: isBrightZone ? darkBase : "#F8FAFC",
      head2Color: scene.temperature === "warm" ? "#FF4D8D" : "#22D3EE",
      bodyColor: isBrightZone ? "#111827" : "#F8FAFC",
      details2Color: isBrightZone ? "#334155" : "#C7D2FE",
      venueColor: isBrightZone ? "#111827" : "#FDE68A",
      subtagTextColor: "#FFFFFF",
    };
  }

  if (style === "vintage") {
    return {
      headColor: isBrightZone ? darkWarm : lightWarm,
      head2Color: scene.temperature === "cool" ? "#93C5FD" : "#D97706",
      bodyColor: isBrightZone ? "#2B2118" : "#F5E7CC",
      details2Color: isBrightZone ? "#57534E" : "#E7D7B7",
      venueColor: isBrightZone ? "#2B1608" : "#FFF7D6",
      subtagTextColor: "#FFFFFF",
    };
  }

  return {
    headColor: isBrightZone ? darkBase : lightBase,
    head2Color: scene.temperature === "warm" ? "#F97316" : "#38BDF8",
    bodyColor: isBrightZone ? "#111827" : "#F8FAFC",
    details2Color: isBrightZone ? "#475569" : "#CBD5E1",
    venueColor: isBrightZone ? "#111827" : "#F8FAFC",
    subtagTextColor: "#FFFFFF",
  };
}

async function analyzeTextZone(buf: Buffer, format: Format): Promise<TextZone> {
  const raw = await sharp(buf)
    .resize(96, 96, { fit: "cover" })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = raw;
  const cols = 6;
  const rows = 6;
  const cellW = Math.max(1, Math.floor(info.width / cols));
  const cellH = Math.max(1, Math.floor(info.height / rows));
  const scores: { detail: number; brightness: number }[][] = [];

  for (let cy = 0; cy < rows; cy += 1) {
    const row: { detail: number; brightness: number }[] = [];
    for (let cx = 0; cx < cols; cx += 1) {
      let brightSum = 0;
      let gradSum = 0;
      let count = 0;
      for (let y = cy * cellH; y < Math.min(info.height, (cy + 1) * cellH); y += 1) {
        for (let x = cx * cellW; x < Math.min(info.width, (cx + 1) * cellW); x += 1) {
          const i = y * info.width + x;
          const v = data[i];
          const right = x + 1 < info.width ? data[i + 1] : v;
          const down = y + 1 < info.height ? data[i + info.width] : v;
          brightSum += v;
          gradSum += Math.abs(v - right) + Math.abs(v - down);
          count += 1;
        }
      }
      row.push({
        detail: count ? gradSum / count : 0,
        brightness: count ? brightSum / count : 128,
      });
    }
    scores.push(row);
  }

  const zoneDefs = [
    { side: "left" as const, align: "left" as const, cols: [0, 1], xMin: 6, xMax: format === "story" ? 44 : 42 },
    { side: "center" as const, align: "center" as const, cols: [2, 3], xMin: 24, xMax: 76 },
    { side: "right" as const, align: "right" as const, cols: [4, 5], xMin: format === "story" ? 56 : 58, xMax: 94 },
  ];

  const best = zoneDefs
    .map((zone) => {
      let detail = 0;
      let brightness = 0;
      let count = 0;
      for (let ry = 0; ry < rows; ry += 1) {
        for (const cx of zone.cols) {
          detail += scores[ry][cx].detail;
          brightness += scores[ry][cx].brightness;
          count += 1;
        }
      }
      return {
        ...zone,
        detailScore: count ? detail / count : 0,
        meanBrightness: count ? brightness / count : 128,
      };
    })
    .sort((a, b) => a.detailScore - b.detailScore)[0];

  const verticalBands = [
    { yMin: 8, yMax: format === "story" ? 52 : 46, rows: [0, 1] },
    { yMin: format === "story" ? 18 : 20, yMax: format === "story" ? 76 : 72, rows: [2, 3] },
    { yMin: format === "story" ? 38 : 34, yMax: 92, rows: [4, 5] },
  ];

  const bestBand = verticalBands
    .map((band) => {
      let detail = 0;
      let brightness = 0;
      let count = 0;
      for (const ry of band.rows) {
        for (const cx of best.cols) {
          detail += scores[ry][cx].detail;
          brightness += scores[ry][cx].brightness;
          count += 1;
        }
      }
      return {
        ...band,
        detailScore: count ? detail / count : 0,
        meanBrightness: count ? brightness / count : 128,
      };
    })
    .sort((a, b) => a.detailScore - b.detailScore)[0];

  return {
    side: best.side,
    align: best.align,
    xMin: best.xMin,
    xMax: best.xMax,
    yMin: bestBand.yMin,
    yMax: bestBand.yMax,
    meanBrightness: bestBand.meanBrightness,
    detailScore: bestBand.detailScore,
  };
}

function fitColorToZone(hex: string, zoneBrightness: number, lightFallback: string, darkFallback: string) {
  const raw = normalizeHex(hex, zoneBrightness > 155 ? darkFallback : lightFallback);
  const r = Number.parseInt(raw.slice(1, 3), 16);
  const g = Number.parseInt(raw.slice(3, 5), 16);
  const b = Number.parseInt(raw.slice(5, 7), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const contrast = Math.abs(lum - zoneBrightness);
  if (contrast >= 85) return raw;
  return zoneBrightness > 155 ? darkFallback : lightFallback;
}

function buildStackPositions(
  zone: TextZone,
  format: Format,
  opts: { head2Enabled: boolean; details2Enabled: boolean; subtagEnabled: boolean }
) {
  const textColWidth = clamp(Math.round(zone.xMax - zone.xMin), format === "story" ? 34 : 32, 70);
  const columnLeft =
    zone.align === "center"
      ? 50 - textColWidth / 2
      : zone.xMin + 1;
  const x = clamp(columnLeft, 2, 98 - textColWidth);
  const startY = clamp(zone.yMin, 8, format === "story" ? 38 : 28);
  const endY = clamp(zone.yMax, format === "story" ? 62 : 56, 92);
  const usable = Math.max(24, endY - startY);

  const headY = startY;
  const head2Y = clamp(startY + usable * 0.18, headY + 10, endY);
  const subtagY = clamp(startY + usable * 0.34, head2Y + 8, endY);
  const detailsY = clamp(startY + usable * 0.46, opts.subtagEnabled ? subtagY + 7 : head2Y + 10, endY);
  const details2Y = clamp(startY + usable * 0.67, detailsY + 10, endY);
  const venueY = clamp(endY, details2Y + 8, 92);

  return {
    align: zone.align,
    textColWidth,
    headX: x,
    headY,
    head2X: x,
    head2Y: opts.head2Enabled ? head2Y : headY,
    subtagX: x,
    subtagY: opts.subtagEnabled ? subtagY : detailsY,
    detailsX: x,
    detailsY,
    details2X: x,
    details2Y: opts.details2Enabled ? details2Y : detailsY,
    venueX: x,
    venueY,
  };
}

function splitPosterHeadline(copy: FlyerTextInput) {
  const raw = asTrimmedString(copy.headline, "EVENT", 64);
  const explicitAccent = asTrimmedString(copy.head2line, "", 64);
  const oneLine = raw.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  const parts = oneLine.split(" ").filter(Boolean);

  if (explicitAccent) {
    return { primary: raw, accent: explicitAccent };
  }

  if (parts.length >= 2 && parts.length <= 4) {
    return {
      primary: parts[0],
      accent: parts.slice(1).join(" "),
    };
  }

  return { primary: raw, accent: "" };
}

function posterSizeForFormat(format: Format): PosterSize {
  return format === "story" ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 };
}

function layerLeftPct(layer: SceneLayer | undefined, size: PosterSize, fallback: number) {
  if (!layer) return fallback;
  return Number(((layer.bounds.x / size.width) * 100).toFixed(2));
}

function layerTopPct(layer: SceneLayer | undefined, size: PosterSize, fallback: number) {
  if (!layer) return fallback;
  return Number(((layer.bounds.y / size.height) * 100).toFixed(2));
}

function layerWidthPct(layer: SceneLayer | undefined, size: PosterSize, fallback: number) {
  if (!layer) return fallback;
  return Number(((layer.bounds.width / size.width) * 100).toFixed(2));
}

function posterFontSizeFromLayer(
  layer: SceneLayer | undefined,
  size: PosterSize,
  fallback: number,
  range: { min: number; max: number },
  scaleOverride?: number
) {
  if (!layer || !("fontSize" in layer)) return fallback;
  const scale = scaleOverride ?? (size.height >= 1600 ? 0.44 : 0.58);
  return Math.round(clamp(layer.fontSize * scale, range.min, range.max));
}

function pxTrackingToEditorEm(layer: SceneLayer | undefined, fallback: number, min = -0.08, max = 0.12) {
  if (!layer || !("letterSpacing" in layer) || !("fontSize" in layer) || layer.fontSize <= 0) {
    return fallback;
  }
  return Number(clamp(layer.letterSpacing / layer.fontSize, min, max).toFixed(3));
}

function mapAutoLayoutStyleToVibe(
  style: (typeof STYLE_CHOICES)[number],
  scene: SceneProfile,
  copy: FlyerTextInput
): Vibe {
  const text = `${copy.headline} ${copy.head2line} ${copy.subtag} ${copy.venue}`.toLowerCase();
  if (/\b(ladies|girls|soiree|soirée|fashion|elite|vip)\b/.test(text)) return "miami_luxe";
  if (/\b(afro|dancehall|soca|reggae)\b/.test(text)) return "afrobeats";
  if (/\b(latin|salsa|bachata|havana|reggaeton)\b/.test(text)) return "latin_night";
  if (style === "neon") return "neon_club";
  if (style === "tropical") return "latin_night";
  if (style === "vintage") return "luxury_lounge";
  return scene.temperature === "warm" ? "miami_luxe" : "trap_urban";
}

function buildCreativeBriefFromCopy(
  copy: FlyerTextInput,
  style: (typeof STYLE_CHOICES)[number],
  scene: SceneProfile
): CreativeBrief {
  const { primary, accent } = splitPosterHeadline(copy);
  const detailsLines = copy.details
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const footerLines = copy.details2
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    eventType: "club",
    vibe: mapAutoLayoutStyleToVibe(style, scene, copy),
    audience: /\b(vip|elite|soiree|soirée|fashion)\b/i.test(`${copy.headline} ${copy.subtag}`)
      ? "vip"
      : "mixed",
    energy: style === "neon" || style === "urban" ? 4 : 3,
    venueTier: style === "vintage" ? "luxury" : "premium",
    mainSubject: "person",
    title: primary || copy.headline || "EVENT",
    accentTitle: accent || undefined,
    date: detailsLines[0] || undefined,
    time: detailsLines[1] || undefined,
    ageLimit: detailsLines.find((line) => /\b(18|21)\+/.test(line)) || undefined,
    venue: copy.venue || undefined,
    location: footerLines[0] || undefined,
    callToAction: copy.subtag || undefined,
    lineup: footerLines.length > 1 ? footerLines.slice(1, 3) : undefined,
    socials: undefined,
  };
}

function buildSubjectAnalysisForArtDirector(
  subject: SubjectPosterContext,
  size: PosterSize
): SubjectAnalysis {
  const scale = clamp(subject.placement.scale, 0.1, 5);
  const rendered = getVisualSubjectBounds(subject);
  const estimatedWidthPct = rendered
    ? clamp(rendered.width, 12, 140)
    : clamp((subject.bounds?.width ?? 46) * scale, 24, 84);
  const estimatedHeightPct = rendered
    ? clamp(rendered.height, 18, 150)
    : clamp((subject.bounds?.height ?? 76) * scale, 42, 118);
  const centerX = rendered?.centerX ?? subject.placement.x;
  const centerY = rendered?.centerY ?? subject.placement.y;
  const leftPct = centerX - estimatedWidthPct / 2;
  const topPct = centerY - estimatedHeightPct / 2;
  const originalBounds: Rect = {
    x: (leftPct / 100) * size.width,
    y: (topPct / 100) * size.height,
    width: (estimatedWidthPct / 100) * size.width,
    height: (estimatedHeightPct / 100) * size.height,
  };

  return {
    kind: "person",
    originalBounds,
    confidence: subject.bounds ? 0.82 : 0.56,
    visualWeightCenter: {
      x: clamp(centerX / 100, 0, 1),
      y: clamp(centerY / 100, 0, 1),
    },
    faceBox: {
      x: 0.32,
      y: subject.mode === "CLOSEUP_CROP" ? 0.1 : 0.14,
      width: 0.36,
      height: 0.22,
    },
    torsoBox: {
      x: 0.22,
      y: 0.36,
      width: 0.56,
      height: 0.42,
    },
  };
}

function rectToPct(rect: Rect, size: PosterSize) {
  const width = (rect.width / size.width) * 100;
  const height = (rect.height / size.height) * 100;
  return {
    x: (rect.x / size.width) * 100,
    y: (rect.y / size.height) * 100,
    width,
    height,
    centerX: ((rect.x + rect.width / 2) / size.width) * 100,
    centerY: ((rect.y + rect.height / 2) / size.height) * 100,
  };
}

function estimateRenderedSubjectBounds(subject: SubjectPosterContext): RenderedSubjectBounds {
  const scale = clamp(subject.placement.scale, 0.1, 5);
  if (subject.bounds) {
    return {
      centerX: subject.placement.x + (subject.bounds.centerX - 50) * scale,
      centerY: subject.placement.y + (subject.bounds.centerY - 50) * scale,
      width: clamp(subject.bounds.width * scale, 12, 140),
      height: clamp(subject.bounds.height * scale, 18, 150),
      visualMass: subject.visualMass,
    };
  }

  return {
    centerX: subject.placement.x,
    centerY: subject.placement.y,
    width: clamp(46 * scale, 12, 140),
    height: clamp(76 * scale, 18, 150),
    visualMass: subject.visualMass,
  };
}

function getVisualSubjectBounds(subject: SubjectPosterContext): SubjectBoundsBox | null {
  return (
    subject.visualMass?.silhouetteBounds ??
    subject.renderedBounds?.visualMass?.silhouetteBounds ??
    subject.renderedBounds ??
    null
  );
}

function buildSubjectCameraPlacementPatch(
  subject: SubjectPosterContext,
  size: PosterSize,
  subjectLayer?: ImageLayer
) {
  if (!subjectLayer) return null;
  const cameraRect = rectToPct(subjectLayer.bounds, size);
  const measuredFull = subject.renderedBounds ?? estimateRenderedSubjectBounds(subject);
  const visualMass = subject.visualMass ?? measuredFull.visualMass ?? createVisualMassFromBounds(measuredFull);
  const measured = visualMass.silhouetteBounds;
  const widthRatio = cameraRect.width / Math.max(1, measured.width);
  const heightRatio = cameraRect.height / Math.max(1, measured.height);
  const desiredVisualPressure = getDesiredSubjectVisualPressure(cameraRect, subject);
  const pressureRatio = Math.sqrt(desiredVisualPressure / Math.max(0.01, visualMass.visualPressure));
  const scaleRatio = clamp(Math.min(widthRatio, heightRatio, pressureRatio) * 0.9, 0.18, 4.5);
  const nextScale = clamp(subject.placement.scale * scaleRatio, 0.05, 5);
  const measuredOffsetX = measured.centerX - subject.placement.x;
  const measuredOffsetY = measured.centerY - subject.placement.y;
  const nextX = cameraRect.centerX - measuredOffsetX * scaleRatio;
  let nextY = cameraRect.centerY - measuredOffsetY * scaleRatio;
  const visualTop = nextY + measuredOffsetY * scaleRatio - (measured.height * scaleRatio) / 2;
  const minHeadroom = getMinimumSubjectHeadroom(cameraRect, subject);
  if (visualTop < minHeadroom) {
    nextY += minHeadroom - visualTop;
  }

  return {
    id: subject.placement.id ?? null,
    x: Number(clamp(nextX, 0, 100).toFixed(2)),
    y: Number(clamp(nextY, 0, 100).toFixed(2)),
    scale: Number(nextScale.toFixed(3)),
    cameraRect: {
      x: Number(cameraRect.x.toFixed(2)),
      y: Number(cameraRect.y.toFixed(2)),
      width: Number(cameraRect.width.toFixed(2)),
      height: Number(cameraRect.height.toFixed(2)),
      centerX: Number(cameraRect.centerX.toFixed(2)),
      centerY: Number(cameraRect.centerY.toFixed(2)),
    },
    measuredBounds: {
      centerX: Number(measured.centerX.toFixed(2)),
      centerY: Number(measured.centerY.toFixed(2)),
      width: Number(measured.width.toFixed(2)),
      height: Number(measured.height.toFixed(2)),
    },
    visualMass: {
      silhouetteBounds: {
        centerX: Number(measured.centerX.toFixed(2)),
        centerY: Number(measured.centerY.toFixed(2)),
        width: Number(measured.width.toFixed(2)),
        height: Number(measured.height.toFixed(2)),
      },
      massCenter: {
        x: Number(visualMass.massCenter.x.toFixed(2)),
        y: Number(visualMass.massCenter.y.toFixed(2)),
      },
      occupiedRatio: visualMass.occupiedRatio,
      edgeComplexity: visualMass.edgeComplexity,
      verticalWeight: visualMass.verticalWeight,
      horizontalWeight: visualMass.horizontalWeight,
      visualPressure: visualMass.visualPressure,
      desiredVisualPressure: Number(desiredVisualPressure.toFixed(3)),
    },
  };
}

function getDesiredSubjectVisualPressure(cameraRect: SubjectBoundsBox, subject: SubjectPosterContext): number {
  const cameraArea = (cameraRect.width * cameraRect.height) / 10000;
  const styleTarget = subject.mode === "CLOSEUP_CROP" ? 0.36 : 0.32;
  return clamp(Math.min(styleTarget, cameraArea * 0.92), 0.24, 0.38);
}

function getMinimumSubjectHeadroom(cameraRect: SubjectBoundsBox & { y: number }, subject: SubjectPosterContext): number {
  const base = subject.mode === "CLOSEUP_CROP" ? 6.5 : 8.5;
  return clamp(Math.max(base, cameraRect.y + 1.5), 6, 18);
}

function flyerStyleFromBlueprintId(id: string): FlyerStyle {
  if (id.includes("BOTTLE")) return "bottle_service";
  if (id.includes("MIAMI")) return "miami_luxe";
  if (id.includes("NEON")) return "neon_club";
  if (id.includes("EDITORIAL")) return "editorial";
  return "red_only_center_hero";
}

function subjectCropFromCameraCrop(crop: string): SubjectCrop {
  if (crop === "product") return "product";
  if (crop === "closeup" || crop === "extreme_closeup") return "closeup";
  if (crop === "half_body") return "half_body";
  if (crop === "full_body") return "full_body";
  return "three_quarter";
}

function subjectOrientationFromCameraOrientation(orientation: string): SubjectOrientation {
  if (orientation === "left_facing") return "facing_left";
  if (orientation === "right_facing") return "facing_right";
  if (orientation === "left_weighted") return "weight_left";
  if (orientation === "right_weighted") return "weight_right";
  return "front";
}

function numberFromPatch(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildSubjectPosterPatch(
  base: Record<string, any>,
  format: Format,
  subject: SubjectPosterContext,
  scene: SceneProfile,
  copy: FlyerTextInput,
  style: (typeof STYLE_CHOICES)[number]
) {
  const story = format === "story";
  const { primary: rawPrimary, accent: rawAccent } = splitPosterHeadline(copy);
  const subjectSide = subject.side;
  const isWarm = scene.temperature === "warm" || style === "tropical" || style === "vintage";
  const ghostColor =
    style === "tropical"
      ? "#E0004D"
      : style === "vintage"
      ? "#D8A13A"
      : isWarm
      ? "#FF2D55"
      : "#D1005B";
  const bodyColor = scene.brightness === "bright" ? "#101018" : "#F8FBFF";
  const mutedColor = scene.brightness === "bright" ? "#243044" : "#D7F9FF";
  const accentColor = isWarm ? "#FFE0A3" : "#BDF7FF";
  const scriptFamily = pickFirstAvailable(
    ["Dear Script (Demo_Font)", "OpenScript", "Maglisto", "Atlantis Famingo DEMO VERSION"],
    HEAD2_FONT_CHOICES,
    base.head2Family || HEAD2_FONT_CHOICES[0] || "Bebas Neue"
  );
  const headlineFamily = pickFirstAvailable(
    ["Bebas Neue", "Antonio", "Designer", "Nexa-Heavy", "Doctor Glitch"],
    HEADLINE_FONT_CHOICES,
    base.headlineFamily || HEADLINE_FONT_CHOICES[0] || "Bebas Neue"
  );
  const bodyFamily = pickFirstAvailable(
    ["LEMONMILK-Regular", "Nexa-Heavy", "Coolvetica Hv Comp", "LEMONMILK-Light"],
    BODY_FONT_CHOICES,
    base.detailsFamily || BODY_FONT_CHOICES[0] || "LEMONMILK-Regular"
  );

  const posterSize = posterSizeForFormat(format);
  const brief = buildCreativeBriefFromCopy(copy, style, scene);
  const hierarchy = directSemanticHierarchy(brief);
  const primary = hierarchy.heroTitle || rawPrimary;
  const accent = hierarchy.scriptAccent || rawAccent;
  const artDirection = generatePosterFromBlueprint({
    size: posterSize,
    candidateCount: 96,
    brief: hierarchy.brief,
    subject: buildSubjectAnalysisForArtDirector(subject, posterSize),
  });
  const artCandidate = artDirection.best;
  const subjectLayer = findBlueprintLayerBySlot<ImageLayer>(artCandidate, "subject");
  const cameraProfile = getSubjectCameraProfile(artCandidate);
  const subjectCameraPlacement = buildSubjectCameraPlacementPatch(subject, posterSize, subjectLayer);
  const coordinatePlan = createOptimizedCoordinatePlan({
    flyerStyle: flyerStyleFromBlueprintId(artDirection.selectedBlueprint.id),
    subjectCrop: subjectCropFromCameraCrop(String(cameraProfile?.crop || "")),
    subjectOrientation: subjectOrientationFromCameraOrientation(String(cameraProfile?.orientation || "")),
    textPriority: {
      hero: primary,
      support: accent,
      metadata: [copy.details, copy.details2, copy.venue, copy.subtag].filter(Boolean),
      suppressed: artCandidate.score?.failures ?? [],
    },
    requiredTextZones: [
      "topPresenter",
      "ghostTitle",
      "scriptAccent",
      "heroTitle",
      "leftDate",
      "rightArtist",
      "bottomOffer",
      "bottomFooter",
      "fineprint",
    ],
    overlapIntent: {
      ghostTitle: "behind_subject",
      scriptAccent: "cross_torso",
      heroTitle: "overlap_lower_body",
    },
    negativeSpaceNeed: 0.7,
    subjectVisualPressure: subject.visualMass?.visualPressure ?? undefined,
    visiblePixelRatio: subject.transparentPct != null ? 1 - subject.transparentPct : undefined,
    candidateCount: 1050,
  });
  const coordinateEditorPatch = coordinatePlanToEditorPatch(coordinatePlan);
  const ghostLayer = findBlueprintTextLayer(artCandidate, "ghostTitle");
  const titleLayer = ghostLayer;
  const scriptLayer = findBlueprintTextLayer(artCandidate, "scriptAccent");
  const dateLayer = findBlueprintTextLayer(artCandidate, "dateBlock");
  const artistLayer = findBlueprintTextLayer(artCandidate, "artistBlock");
  const offerLayer = findBlueprintTextLayer(artCandidate, "offerLine");
  const footerTitleLayer = findBlueprintTextLayer(artCandidate, "footerTitle");
  const addressLayer = findBlueprintTextLayer(artCandidate, "addressLine");
  const metadataLayer = dateLayer ?? artistLayer;
  const footerLayer = footerTitleLayer ?? addressLayer ?? offerLayer;
  const detailsInfoLayer = footerTitleLayer ?? addressLayer ?? footerLayer;
  const venueLayer = addressLayer ?? footerTitleLayer ?? footerLayer;
  const scoreRejected = Boolean(artCandidate.score?.rejected);
  const depthFx = getCinematicDepthEditorFx(artCandidate);
  const cinematicDepthLayerCount = artCandidate.layers.filter((layer) => layer.meta?.cinematicDepth === true).length;

  const titleX =
    subjectSide === "right" ? (story ? 3 : 4) : subjectSide === "left" ? (story ? 16 : 12) : story ? 3 : 5;
  const titleY =
    subject.mode === "CLOSEUP_CROP" ? (story ? 5 : 4) : story ? 7 : 8;
  const titleWidth =
    subjectSide === "center" ? (story ? 104 : 98) : story ? 94 : 88;
  const titleSize =
    subject.mode === "CLOSEUP_CROP"
      ? story
        ? 214
        : 176
      : story
      ? 190
      : 154;
  const scriptY = clamp(
    (subject.bounds?.yMin ?? 12) + (story ? 28 : 30),
    story ? 28 : 30,
    story ? 49 : 56
  );

  const titleSizeFromArtDirector = posterFontSizeFromLayer(titleLayer, posterSize, titleSize, {
    min: story ? 144 : 112,
    max: story ? 238 : 196,
  }, story ? 0.72 : 0.6);
  const scriptSizeFromArtDirector = posterFontSizeFromLayer(scriptLayer, posterSize, story ? 86 : 70, {
    min: story ? 56 : 44,
    max: story ? 104 : 84,
  }, story ? 0.64 : 0.58);
  const metadataSizeFromArtDirector = posterFontSizeFromLayer(
    metadataLayer,
    posterSize,
    story ? 18 : 16,
    {
      min: story ? 15 : 13,
      max: story ? 24 : 21,
    },
    story ? 0.36 : 0.3
  );
  const footerSizeFromArtDirector = posterFontSizeFromLayer(footerLayer, posterSize, story ? 15 : 13, {
    min: story ? 13 : 11,
    max: story ? 20 : 17,
  }, story ? 0.36 : 0.3);
  const offerSemantic = classifyTextContentSemanticPriority(copy.subtag, "offerLine");
  const footerSemantic = classifyTextContentSemanticPriority(copy.details2, "addressLine");
  const suppressOfferPill =
    Boolean(copy.subtag) &&
    (offerSemantic.priority === "suppressed" || offerSemantic.contentType === "promotion");
  const compressedOffer = suppressOfferPill ? hierarchy.offerLine || compressPromotionText(copy.subtag) : copy.subtag;
  const hierarchyFineprint = hierarchy.fineprint || (footerSemantic.priority === "fineprint" ? "" : copy.details2);
  const footerLines = [
    ...(suppressOfferPill && compressedOffer ? [compressedOffer] : []),
    ...(hierarchyFineprint ? [hierarchyFineprint] : []),
  ];
  const semanticFooterCopy = footerLines.join("\n");
  const effectiveFooterSize =
    suppressOfferPill || footerSemantic.priority === "fineprint"
      ? Math.min(footerSizeFromArtDirector, story ? 14 : 12)
      : footerSizeFromArtDirector;
  const effectiveSubtag = suppressOfferPill ? "" : copy.subtag;
  const effectiveSubtagSize =
    offerSemantic.priority === "metadata" ? Math.min(story ? 14 : 12, story ? 16 : 14) : story ? 16 : 14;
  const headlineLaneY = scoreRejected
    ? titleY
    : clamp(layerTopPct(titleLayer, posterSize, titleY), story ? 5 : 5, story ? 15 : 14);
  const scriptLaneY = scoreRejected
    ? scriptY
    : clamp(layerTopPct(scriptLayer, posterSize, scriptY), story ? 32 : 34, story ? 54 : 56);
  const dateLaneX = scoreRejected
    ? story ? 14 : 12
    : clamp(layerLeftPct(dateLayer, posterSize, story ? 8 : 8), story ? 5 : 5, story ? 24 : 26);
  const dateLaneY = scoreRejected
    ? story ? 31 : 28
    : clamp(layerTopPct(dateLayer, posterSize, story ? 49 : 49), story ? 42 : 44, story ? 62 : 64);
  const offerLaneX = scoreRejected
    ? story ? 13 : 11
    : clamp(layerLeftPct(offerLayer, posterSize, story ? 16 : 16), story ? 8 : 8, story ? 28 : 30);
  const offerLaneY = scoreRejected
    ? story ? 77 : 76
    : clamp(layerTopPct(offerLayer, posterSize, story ? 78 : 78), story ? 74 : 76, story ? 83 : 82);
  const footerLaneX = scoreRejected
    ? story ? 13 : 11
    : clamp(layerLeftPct(detailsInfoLayer, posterSize, story ? 14 : 14), story ? 8 : 8, story ? 26 : 28);
  const footerLaneY = scoreRejected
    ? story ? 83 : 82
    : clamp(layerTopPct(detailsInfoLayer, posterSize, story ? 84 : 83), story ? 82 : 82, story ? 88 : 87);
  const venueLaneX = scoreRejected
    ? story ? 13 : 11
    : clamp(layerLeftPct(venueLayer, posterSize, story ? 18 : 18), story ? 8 : 8, story ? 30 : 32);
  const venueLaneY = scoreRejected
    ? story ? 91 : 91
    : clamp(layerTopPct(venueLayer, posterSize, story ? 90 : 90), story ? 89 : 89, story ? 94 : 93);

  return {
    compositionMode: "subject-poster",
    posterMode: artCandidate.compositionMode,
    subjectPosterMode: subject.mode,
    blueprintId: artDirection.selectedBlueprint.id,
    blueprintLabel: artDirection.selectedBlueprint.label,
    artDirectorCandidateId: artCandidate.id,
    artDirectorScore: artCandidate.score,
    artDirectorLayers: artCandidate.layers,
    coordinatePlan,
    subjectCameraProfile: cameraProfile ?? null,
    subjectCameraPlacement,
    rationale:
      `Subject-poster mode: selected blueprint ${artDirection.selectedBlueprint.label}, ran coordinate search for subjectVisibleRect, generated ${artDirection.candidates.length} candidates, and selected ${artCandidate.id} with score ${artCandidate.score?.total ?? "n/a"}. Coordinate score ${coordinatePlan.score.total}; text lanes are patched from the selected coordinate plan. ${scoreRejected ? `Quality gate warnings: ${artCandidate.score?.failures.join("; ")}. Applied conservative fallback lanes. ` : ""}Oversized ghost title, subject isolation, date block, offer line, footer, and ${cinematicDepthLayerCount} cinematic depth planes are composed as semantic lanes.`,

    headline: primary,
    headlineFamily,
    headlineSize: titleSizeFromArtDirector,
    headlineLineHeight: 0.78,
    headlineHeight: 0.78,
    headColor: ghostColor,
    headX: numberFromPatch(coordinateEditorPatch.headX, scoreRejected ? titleX : layerLeftPct(titleLayer, posterSize, titleX)),
    headY: numberFromPatch(coordinateEditorPatch.headY, headlineLaneY),
    headAlign: titleLayer?.align ?? "center",
    align: titleLayer?.align ?? "center",
    textAlign: titleLayer?.align ?? "center",
    textColWidth: numberFromPatch(
      coordinateEditorPatch.textColWidth,
      scoreRejected ? titleWidth : clamp(layerWidthPct(titleLayer, posterSize, titleWidth), 54, story ? 100 : 96)
    ),
    headBehindPortrait: true,
    headTracking: pxTrackingToEditorEm(titleLayer, -0.055, -0.09, 0.02),
    headStrokeWidth: story ? 1.4 : 1.2,
    headStrokeColor: "#18020C",
    headGlow: 0.1,
    headShadow: true,
    headShadowStrength: 0.7,
    headRotate: titleLayer?.rotation ?? 0,
    headAlpha: ghostLayer?.opacity ?? (scene.brightness === "dark" ? 0.62 : 0.52),
    textFx: {
      ...(base.textFx || {}),
      uppercase: true,
      bold: true,
      italic: false,
      tracking: pxTrackingToEditorEm(titleLayer, -0.055, -0.09, 0.02),
      gradient: false,
      color: ghostColor,
      gradFrom: ghostColor,
      gradTo: ghostColor,
      strokeWidth: story ? 1.4 : 1.2,
      strokeColor: "#18020C",
      shadow: 0.7,
      glow: 0.1,
      alpha: ghostLayer?.opacity ?? (scene.brightness === "dark" ? 0.62 : 0.52),
      shadowEnabled: true,
    },

    head2Enabled: Boolean(accent),
    head2line: accent,
    head2Family: scriptFamily,
    head2Color: accentColor,
    head2Size: scriptSizeFromArtDirector,
    head2LineHeight: 0.92,
    head2X: numberFromPatch(
      coordinateEditorPatch.head2X,
      scoreRejected ? (story ? 22 : 21) : layerLeftPct(scriptLayer, posterSize, subjectSide === "right" ? (story ? 18 : 16) : story ? 13 : 13)
    ),
    head2Y: numberFromPatch(coordinateEditorPatch.head2Y, scriptLaneY),
    head2ColWidth: numberFromPatch(coordinateEditorPatch.head2ColWidth, story ? 74 : 70),
    head2Align: scriptLayer?.align ?? "center",
    head2Rotate: scriptLayer?.rotation ?? -5,
    head2Shadow: true,
    head2ShadowStrength: 1,
    head2Fx: {
      ...(base.head2Fx || {}),
      uppercase: false,
      bold: false,
      italic: true,
      tracking: pxTrackingToEditorEm(scriptLayer, -0.01, -0.03, 0.03),
      gradient: false,
      color: accentColor,
      gradFrom: accentColor,
      gradTo: accentColor,
      strokeWidth: 0,
      strokeColor: "#000000",
      shadow: 0.8,
      glow: 0.2,
      alpha: 1,
      shadowEnabled: true,
    },

    details: hierarchy.dateModule || copy.details || base.details,
    detailsFamily: bodyFamily,
    bodyFamily,
    bodyColor,
    detailsSize: metadataSizeFromArtDirector,
    detailsLineHeight: 1.06,
    detailsTracking: scoreRejected ? 0.04 : pxTrackingToEditorEm(metadataLayer, 0.04, 0, 0.08),
    detailsUppercase: true,
    detailsBold: true,
    detailsX: numberFromPatch(coordinateEditorPatch.detailsX, dateLaneX),
    detailsY: numberFromPatch(coordinateEditorPatch.detailsY, dateLaneY),
    detailsAlign: dateLayer?.align ?? "center",
    detailsRotate: 0,
    detailsShadow: true,
    detailsShadowStrength: 0.8,

    details2Enabled: Boolean(semanticFooterCopy),
    details2: semanticFooterCopy,
    details2Family: bodyFamily,
    details2Color: mutedColor,
    details2Size: effectiveFooterSize,
    details2LineHeight: 1.18,
    details2LetterSpacing: scoreRejected ? 0.035 : pxTrackingToEditorEm(detailsInfoLayer, 0.035, 0, 0.06),
    details2X: numberFromPatch(coordinateEditorPatch.details2X, footerLaneX),
    details2Y: numberFromPatch(coordinateEditorPatch.details2Y, footerLaneY),
    details2Align: detailsInfoLayer?.align ?? "center",
    details2Rotate: 0,
    details2Uppercase: true,
    details2Bold: true,
    details2Shadow: true,
    details2ShadowStrength: 0.75,

    subtagEnabled: Boolean(effectiveSubtag),
    subtag: effectiveSubtag,
    subtagFamily: bodyFamily,
    subtagTextColor: accentColor,
    subtagBgColor: "#050508",
    subtagAlpha: offerSemantic.priority === "metadata" ? 0.38 : 0.72,
    subtagSize: effectiveSubtagSize,
    subtagX: numberFromPatch(coordinateEditorPatch.subtagX, offerLaneX),
    subtagY: numberFromPatch(coordinateEditorPatch.subtagY, offerLaneY),
    subtagAlign: offerLayer?.align ?? "center",
    subtagUppercase: true,
    subtagBold: true,
    subtagShadow: true,
    subtagShadowStrength: 0.4,

    venue: copy.venue || hierarchy.footerMain || base.venue,
    venueFamily: pickFirstAvailable(
      ["LEMONMILK-Regular", "Bebas Neue", "Nexa-Heavy"],
      VENUE_FONT_CHOICES,
      base.venueFamily || VENUE_FONT_CHOICES[0] || bodyFamily
    ),
    venueColor: bodyColor,
    venueSize: story ? 25 : 22,
    venueLineHeight: 0.96,
    venueX: numberFromPatch(coordinateEditorPatch.venueX, venueLaneX),
    venueY: numberFromPatch(coordinateEditorPatch.venueY, venueLaneY),
    venueAlign: venueLayer?.align ?? "center",
    venueRotate: 0,
    venueUppercase: true,
    venueBold: true,
    venueShadow: true,
    venueShadowStrength: 0.85,

    bgScale: subject.mode === "CLOSEUP_CROP" ? 1.12 : 1.06,
    ...depthFx,

    textLayerOffset: {
      headline: 0,
      headline2: 76,
      details: 76,
      details2: 76,
      venue: 76,
      subtag: 76,
    },
  };
}

const RESPONSE_SCHEMA = {
  name: "background_layout_suggestion",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      rationale: { type: "string" },
      style: { type: "string", enum: [...STYLE_CHOICES] },
      headline: { type: "string" },
      head2line: { type: "string" },
      details: { type: "string" },
      details2: { type: "string" },
      venue: { type: "string" },
      subtag: { type: "string" },
      headlineFamily: { type: "string", enum: HEADLINE_FONT_CHOICES },
      head2Family: { type: "string", enum: HEAD2_FONT_CHOICES },
      detailsFamily: { type: "string", enum: BODY_FONT_CHOICES },
      details2Family: { type: "string", enum: BODY_FONT_CHOICES },
      venueFamily: { type: "string", enum: VENUE_FONT_CHOICES },
      subtagFamily: { type: "string", enum: SUBTAG_FONT_CHOICES },
      headColor: { type: "string" },
      head2Color: { type: "string" },
      bodyColor: { type: "string" },
      details2Color: { type: "string" },
      venueColor: { type: "string" },
      subtagTextColor: { type: "string" },
      align: { type: "string", enum: [...ALIGN_CHOICES] },
      headAlign: { type: "string", enum: [...ALIGN_CHOICES] },
      head2Align: { type: "string", enum: [...ALIGN_CHOICES] },
      detailsAlign: { type: "string", enum: [...ALIGN_CHOICES] },
      details2Align: { type: "string", enum: [...ALIGN_CHOICES] },
      venueAlign: { type: "string", enum: [...ALIGN_CHOICES] },
      textColWidth: { type: "number" },
      headX: { type: "number" },
      headY: { type: "number" },
      head2X: { type: "number" },
      head2Y: { type: "number" },
      detailsX: { type: "number" },
      detailsY: { type: "number" },
      details2X: { type: "number" },
      details2Y: { type: "number" },
      venueX: { type: "number" },
      venueY: { type: "number" },
      subtagX: { type: "number" },
      subtagY: { type: "number" },
      headlineSize: { type: "number" },
      headlineHeight: { type: "number" },
      head2Size: { type: "number" },
      head2LineHeight: { type: "number" },
      detailsSize: { type: "number" },
      detailsLineHeight: { type: "number" },
      details2Size: { type: "number" },
      details2LineHeight: { type: "number" },
      venueSize: { type: "number" },
      venueLineHeight: { type: "number" },
      subtagSize: { type: "number" },
      bgPosX: { type: "number" },
      bgPosY: { type: "number" },
      bgScale: { type: "number" },
      vignetteStrength: { type: "number" },
      headShadow: { type: "boolean" },
      headShadowStrength: { type: "number" },
      head2Enabled: { type: "boolean" },
      details2Enabled: { type: "boolean" },
      subtagEnabled: { type: "boolean" },
      vignette: { type: "boolean" },
    },
    required: [
      "rationale",
      "style",
      "headline",
      "head2line",
      "details",
      "details2",
      "venue",
      "subtag",
      "headlineFamily",
      "head2Family",
      "detailsFamily",
      "details2Family",
      "venueFamily",
      "subtagFamily",
      "headColor",
      "head2Color",
      "bodyColor",
      "details2Color",
      "venueColor",
      "subtagTextColor",
      "align",
      "headAlign",
      "head2Align",
      "detailsAlign",
      "details2Align",
      "venueAlign",
      "textColWidth",
      "headX",
      "headY",
      "head2X",
      "head2Y",
      "detailsX",
      "detailsY",
      "details2X",
      "details2Y",
      "venueX",
      "venueY",
      "subtagX",
      "subtagY",
      "headlineSize",
      "headlineHeight",
      "head2Size",
      "head2LineHeight",
      "detailsSize",
      "detailsLineHeight",
      "details2Size",
      "details2LineHeight",
      "venueSize",
      "venueLineHeight",
      "subtagSize",
      "bgPosX",
      "bgPosY",
      "bgScale",
      "vignetteStrength",
      "headShadow",
      "headShadowStrength",
      "head2Enabled",
      "details2Enabled",
      "subtagEnabled",
      "vignette",
    ],
  },
} as const;

function sanitizeLayout(
  raw: any,
  format: Format,
  zone: TextZone,
  scene: SceneProfile,
  opts?: {
    textMode?: AutoLayoutTextMode;
    providedText?: FlyerTextInput;
    subject?: SubjectPosterContext | null;
  }
) {
  const textMode = opts?.textMode || "generate";
  const providedText = opts?.providedText;
  const style = pickEnum(raw?.style, STYLE_CHOICES, "urban");
  const head2Requested =
    textMode === "provided" ? Boolean(providedText?.head2line) : Boolean(raw?.head2Enabled);
  const details2Requested =
    textMode === "provided" ? Boolean(providedText?.details2) : Boolean(raw?.details2Enabled);
  const subtagRequested =
    textMode === "provided" ? Boolean(providedText?.subtag) : Boolean(raw?.subtagEnabled);
  let head2Enabled = head2Requested;
  let details2Enabled = details2Requested;
  let subtagEnabled = subtagRequested;
  const copy: FlyerTextInput =
    textMode === "provided"
      ? {
          headline: asTrimmedString(providedText?.headline, "", 64),
          head2line: head2Requested ? asTrimmedString(providedText?.head2line, "", 64) : "",
          details: asTrimmedString(providedText?.details, "", 220),
          details2: details2Requested ? asTrimmedString(providedText?.details2, "", 220) : "",
          venue: asTrimmedString(providedText?.venue, "", 80),
          subtag: subtagRequested ? asTrimmedString(providedText?.subtag, "", 48) : "",
        }
      : {
          headline: asTrimmedString(raw?.headline, "EVENT NAME", 42),
          head2line: head2Requested ? asTrimmedString(raw?.head2line, "", 32) : "",
          details: asTrimmedString(raw?.details, "FRI • 10 PM\nSPECIAL GUESTS\nVIP TABLES", 120),
          details2: details2Requested ? asTrimmedString(raw?.details2, "", 140) : "",
          venue: asTrimmedString(raw?.venue, "VENUE NAME", 48),
          subtag: subtagRequested ? asTrimmedString(raw?.subtag, "", 32) : "",
        };
  if (format === "square") {
    const accentPriority =
      style === "tropical" || style === "vintage"
        ? ([
            copy.subtag ? "subtag" : null,
            copy.head2line ? "head2" : null,
            copy.details2 ? "details2" : null,
          ].find(Boolean) as "subtag" | "head2" | "details2" | undefined)
        : ([
            copy.head2line ? "head2" : null,
            copy.subtag ? "subtag" : null,
            copy.details2 ? "details2" : null,
          ].find(Boolean) as "subtag" | "head2" | "details2" | undefined);
    head2Enabled = accentPriority === "head2";
    details2Enabled = accentPriority === "details2";
    subtagEnabled = accentPriority === "subtag";
  }
  const stack = buildStackPositions(zone, format, {
    head2Enabled,
    details2Enabled,
    subtagEnabled,
  });
  const typePreset = buildTypographyPreset(style, scene, format, copy);
  const colorPreset = buildColorPreset(style, scene, zone.meanBrightness);
  const headColor = fitColorToZone(
    colorPreset.headColor,
    zone.meanBrightness,
    "#FFFFFF",
    "#111827"
  );
  const head2Color = fitColorToZone(
    colorPreset.head2Color,
    zone.meanBrightness,
    "#E0F2FE",
    "#0F172A"
  );
  const bodyColor = fitColorToZone(
    colorPreset.bodyColor,
    zone.meanBrightness,
    "#F8FAFC",
    "#111827"
  );
  const details2Color = fitColorToZone(
    colorPreset.details2Color,
    zone.meanBrightness,
    "#E2E8F0",
    "#334155"
  );
  const venueColor = fitColorToZone(
    colorPreset.venueColor,
    zone.meanBrightness,
    "#FFFFFF",
    "#111827"
  );
  const subtagTextColor = fitColorToZone(
    colorPreset.subtagTextColor,
    zone.meanBrightness,
    "#FFFFFF",
    "#0F172A"
  );
  const headlineTracking =
    typePreset.headlineFamily === "Bebas Neue" || typePreset.headlineFamily === "Antonio"
      ? 0.012
      : typePreset.headlineFamily === "African" || typePreset.headlineFamily === "ChettaVissto"
      ? 0.004
      : 0.008;
  const head2IsScript =
    typePreset.head2Family === "OpenScript" ||
    typePreset.head2Family === "Maglisto" ||
    typePreset.head2Family === "Atlantis Famingo DEMO VERSION";
  const detailsAreCondensed =
    typePreset.detailsFamily.includes("LEMONMILK") ||
    typePreset.detailsFamily === "Nexa-Heavy";
  const detailsUppercase = style === "urban" || style === "neon";
  const detailsBold = !typePreset.detailsFamily.includes("Light");
  const detailsTracking = detailsAreCondensed ? 0.03 : 0.012;

  const layout = {
    style,
    rationale: asTrimmedString(raw?.rationale, "", 240),
    headline: copy.headline,
    head2line: copy.head2line,
    details: copy.details,
    details2: copy.details2,
    venue: copy.venue,
    subtag: copy.subtag,
    headlineFamily: typePreset.headlineFamily,
    bodyFamily: typePreset.detailsFamily,
    head2Family: typePreset.head2Family,
    detailsFamily: typePreset.detailsFamily,
    details2Family: typePreset.details2Family,
    venueFamily: typePreset.venueFamily,
    subtagFamily: typePreset.subtagFamily,
    headColor,
    head2Color,
    bodyColor,
    details2Color,
    venueColor,
    subtagTextColor,
    align: stack.align,
    textAlign: stack.align,
    headAlign: stack.align,
    head2Align: stack.align,
    detailsAlign: stack.align,
    details2Align: stack.align,
    venueAlign: stack.align,
    textColWidth: stack.textColWidth,
    headX: stack.headX,
    headY: stack.headY,
    head2X: stack.head2X,
    head2Y: stack.head2Y,
    detailsX: stack.detailsX,
    detailsY: stack.detailsY,
    details2X: stack.details2X,
    details2Y: stack.details2Y,
    venueX: stack.venueX,
    venueY: stack.venueY,
    subtagX: stack.subtagX,
    subtagY: stack.subtagY,
    headlineSize: typePreset.headlineSize,
    headlineHeight: typePreset.headlineHeight,
    head2Size: typePreset.head2Size,
    head2LineHeight: typePreset.head2LineHeight,
    detailsSize: typePreset.detailsSize,
    detailsLineHeight: typePreset.detailsLineHeight,
    details2Size: typePreset.details2Size,
    details2LineHeight: typePreset.details2LineHeight,
    venueSize: typePreset.venueSize,
    venueLineHeight: typePreset.venueLineHeight,
    subtagSize: typePreset.subtagSize,
    bgPosX: clamp(Number(raw?.bgPosX) || 50, 0, 100),
    bgPosY: clamp(Number(raw?.bgPosY) || 50, 0, 100),
    bgScale: clamp(Number(raw?.bgScale) || 1.08, 0.75, 1.8),
    vignette: raw?.vignette !== false,
    vignetteStrength: clamp(Number(raw?.vignetteStrength) || 0.1, 0, 0.35),
    headShadow: raw?.headShadow !== false,
    headShadowStrength: clamp(Number(raw?.headShadowStrength) || 0.7, 0, 1.5),
    head2Enabled,
    details2Enabled,
    subtagEnabled,
    headlineUppercase: true,
    textFx: {
      uppercase: true,
      bold: true,
      italic: false,
      underline: false,
      tracking: headlineTracking,
      gradient: false,
      gradFrom: headColor,
      gradTo: headColor,
      color: headColor,
      strokeWidth: 0,
      strokeColor: "#000000",
      shadow: clamp(Number(raw?.headShadowStrength) || 0.7, 0, 1.5),
      glow: style === "neon" ? 0.18 : 0.08,
      shadowEnabled: raw?.headShadow !== false,
    },
    head2Fx: {
      uppercase: !head2IsScript && style !== "vintage",
      bold: !head2IsScript,
      italic: head2IsScript,
      underline: false,
      tracking: head2IsScript ? 0 : 0.012,
      gradient: false,
      gradFrom: head2Color,
      gradTo: head2Color,
      color: head2Color,
      strokeWidth: 0,
      strokeColor: "#000000",
      shadow: style === "neon" ? 0.6 : 0.35,
      glow: style === "neon" ? 0.16 : 0.04,
      shadowEnabled: true,
    },
    detailsUppercase,
    detailsBold,
    detailsItalic: false,
    detailsUnderline: false,
    detailsTracking,
    detailsShadow: true,
    detailsShadowStrength: scene.brightness === "dark" ? 0.55 : 0.3,
    details2Uppercase: false,
    details2Bold: false,
    details2Italic: false,
    details2Underline: false,
    details2Shadow: true,
    details2ShadowStrength: scene.brightness === "dark" ? 0.45 : 0.2,
    venueBold: !typePreset.venueFamily.includes("Light"),
    venueUppercase: !typePreset.venueFamily.includes("Maglisto"),
    venueItalic: false,
    venueShadow: true,
    venueShadowStrength: scene.brightness === "dark" ? 0.6 : 0.3,
    subtagBold: true,
    subtagItalic: false,
    subtagUnderline: false,
    subtagBgColor: zone.meanBrightness > 155 ? "#0F172A" : "#FFFFFF",
    subtagAlpha: zone.meanBrightness > 155 ? 0.82 : 0.92,
    subtagShadow: false,
    subtagShadowStrength: 0,
  };

  if (opts?.subject) {
    return {
      ...layout,
      ...buildSubjectPosterPatch(layout, format, opts.subject, scene, copy, style),
    };
  }

  return layout;
}

export async function POST(req: Request) {
  let reservedUserId: string | null = null;
  let previousUsed: number | null = null;
  let usageBucket: "standard" | "starter" = "standard";
  let analyticsAdmin: ReturnType<typeof supabaseAdmin> | null = null;
  let analyticsUser: User | null = null;
  let analyticsTracking: ReturnType<typeof extractClientTrackingPayload> | null = null;

  const trackAnalytics = async (
    eventName: "auto_layout_started" | "auto_layout_succeeded" | "auto_layout_failed",
    properties: Record<string, unknown>
  ) => {
    if (!analyticsAdmin || !analyticsUser || !analyticsTracking) return;
    try {
      await insertAnalyticsEventForUser(analyticsAdmin, eventName, {
        req,
        user: analyticsUser,
        path: analyticsTracking.path,
        anonId: analyticsTracking.anonId,
        sessionId: analyticsTracking.sessionId,
        referrer: analyticsTracking.referrer,
        utmSource: analyticsTracking.utmSource,
        utmMedium: analyticsTracking.utmMedium,
        utmCampaign: analyticsTracking.utmCampaign,
        utmTerm: analyticsTracking.utmTerm,
        utmContent: analyticsTracking.utmContent,
        landingPath: analyticsTracking.landingPath,
        properties,
      });
    } catch (error) {
      console.error(`Analytics ${eventName} failed`, error);
    }
  };

  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Login required for auto layout." }, { status: 401 });
    }

    const authClient = supabaseAuth();
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const admin = supabaseAdmin();
    analyticsAdmin = admin;
    const snapshot = await getAccessSnapshotForUser(admin, userData.user.id);
    if (!snapshot || snapshot.status !== "active") {
      return NextResponse.json(
        { error: "Creator subscription required for Auto Layout." },
        { status: 403 }
      );
    }

    const normalizedPlan = String(snapshot.profile.plan || "").trim().toLowerCase();
    if (normalizedPlan !== "creator" && normalizedPlan !== "studio") {
      return NextResponse.json(
        { error: "Creator subscription required for Auto Layout." },
        { status: 403 }
      );
    }

    const reservation = await reserveGenerationUnits(admin, userData.user.id, 1);
    if (!reservation.ok) {
      return NextResponse.json(
        {
          error: reservation.message,
          generation_limit: reservation.snapshot?.generationLimit ?? 0,
          generation_remaining: reservation.snapshot?.generationRemaining ?? 0,
        },
        { status: reservation.code }
      );
    }

    reservedUserId = userData.user.id;
    previousUsed = reservation.previousUsed;
    usageBucket = reservation.usageBucket;
    analyticsUser = userData.user;

    const body = await req.json();
    const trackingBody =
      body?.tracking && typeof body.tracking === "object" ? body.tracking : body;
    analyticsTracking = extractClientTrackingPayload(req, trackingBody);
    const background = String(body?.background || "");
    const format = pickEnum(body?.format, FORMAT_CHOICES, "square");
    const textMode: AutoLayoutTextMode =
      body?.textMode === "provided" ? "provided" : "generate";
    const currentText = body?.currentText && typeof body.currentText === "object" ? body.currentText : {};
    const rawSubjectPlacement =
      body?.subjectPlacement && typeof body.subjectPlacement === "object"
        ? (body.subjectPlacement as Record<string, unknown>)
        : null;
    const subjectPlacement =
      rawSubjectPlacement
        ? {
            id:
              typeof rawSubjectPlacement.id === "string"
                ? rawSubjectPlacement.id
                : undefined,
            x: asFiniteNumber(rawSubjectPlacement.x, NaN),
            y: asFiniteNumber(rawSubjectPlacement.y, NaN),
            scale: asFiniteNumber(rawSubjectPlacement.scale, NaN),
            renderedBounds: normalizeRenderedSubjectBounds(
              rawSubjectPlacement.renderedBounds
            ),
          }
        : null;
    const requireSubject = body?.requireSubject === true;
    const subjectImageUrl = typeof body?.subject === "string" ? body.subject.trim() : "";
    if (!background) {
      throw new AutoLayoutInputError("Missing background image.");
    }
    if (requireSubject || subjectImageUrl) {
      assertRequiredSubjectInput(subjectImageUrl, subjectPlacement);
    }

    const subjectContext =
      subjectImageUrl
        ? await analyzeSubjectForPoster(subjectImageUrl, subjectPlacement)
        : null;
    const compositionMode = subjectContext ? "subject-poster" : "safe";

    await trackAnalytics("auto_layout_started", {
      format,
      text_mode: textMode,
      composition_mode: compositionMode,
    });

    const sourceBuf = await toBufferFromAnyImage(background);
    const analysisImage = await buildCompressedAnalysisImage(sourceBuf);
    const textZone = await analyzeTextZone(sourceBuf, format);
    const textHints: FlyerTextInput = {
      headline: asTrimmedString(currentText?.headline, "", 64),
      head2line: asTrimmedString(currentText?.head2 ?? currentText?.head2line, "", 64),
      details: asTrimmedString(currentText?.details, "", 180),
      details2: asTrimmedString(currentText?.details2, "", 180),
      venue: asTrimmedString(currentText?.venue, "", 64),
      subtag: asTrimmedString(currentText?.subtag, "", 64),
    };

    const prompt = [
      "Analyze this nightlife/background image and produce a flyer text layout that feels like a human-made template.",
      `Target format: ${format}.`,
      `Scene lighting profile: brightness ${analysisImage.brightness}, temperature ${analysisImage.temperature}.`,
      subjectContext
        ? `Composition mode: SUBJECT POSTER. Isolated subject placement x ${subjectContext.placement.x}, y ${subjectContext.placement.y}, scale ${subjectContext.placement.scale}, mode ${subjectContext.mode}.`
        : "Composition mode: SAFE BACKGROUND LAYOUT.",
      subjectContext
        ? "Goal: build a poster composition around the dominant subject, with oversized ghost typography behind the subject, controlled overlap, metadata rails, and a grouped footer system."
        : "Goal: choose readable negative space, choose fitting fonts from the app's current font inventory, choose palette colors sampled from the scene, and place text so it avoids the focal subject.",
      subjectContext
        ? "Do not treat all copy as floating boxes. The subject is the center of gravity; typography should orbit it with deliberate hierarchy."
        : "If the image has a strong subject on one side, push text to the opposite side. If the image already feels centered, use centered composition only when it will remain readable.",
      textMode === "provided"
        ? "Use the supplied flyer text exactly as provided. Do not rewrite it, embellish it, or invent missing fields."
        : "Create new nightlife/event copy from the image itself. Use current text hints only as semantic anchors when they help, but rewrite them into stronger copy instead of repeating them literally.",
      `Computed safe text zone: side ${textZone.side}, align ${textZone.align}, x ${textZone.xMin}-${textZone.xMax}, y ${textZone.yMin}-${textZone.yMax}, zone brightness ${textZone.meanBrightness.toFixed(1)}, detail ${textZone.detailScore.toFixed(1)}.`,
      subjectContext
        ? "Use the safe text zone only for supporting copy. The main title may crop, overflow, and sit behind the subject."
        : "Treat that computed zone as the designated text area. Keep the whole text stack inside it.",
      textMode === "provided" ? "Provided flyer text:" : "Current text hints:",
      JSON.stringify(textHints),
      "Rules:",
      textMode === "provided"
        ? "- only place text fields that are non-empty in the provided payload"
        : "- headline should be short and impactful",
      textMode === "provided"
        ? "- blank fields must stay blank and should not become visible text objects"
        : "- headline may use line breaks for 1-2 strong lines",
      textMode === "provided"
        ? "- preserve provided wording, punctuation, and line breaks unless minor line wrapping is needed for fit"
        : "- head2line should be short or empty",
      textMode === "provided"
        ? "- do not create extra promotional copy beyond the provided fields"
        : "- details should be 2-4 short lines and read like a real flyer",
      textMode === "provided"
        ? "- focus on typography, hierarchy, alignment, and fit"
        : "- details2 should be one short supporting line or empty",
      textMode === "provided" ? "- venue and subtag may be empty" : "- venue should be short",
      textMode === "provided" ? "- keep the result looking premium and editorial" : "- subtag should be very short or empty",
      "- format the copy cleanly with intentional line breaks and readable casing",
      subjectContext
        ? "- create hierarchy: ghost title, script/accent if useful, side metadata, footer information system"
        : "- do not scatter text around the poster; design one coherent stack inside the designated text zone",
      subjectContext
        ? "- never cover eyes, mouth, or the core face with foreground text"
        : "- keep all important text inside the chosen safe zone",
      "- prefer readable contrast; avoid illegible low-contrast picks",
      "- only return the JSON requested by schema",
    ].join("\n");

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_LAYOUT_MODEL,
        temperature: 0.4,
        max_tokens: 1400,
        response_format: {
          type: "json_schema",
          json_schema: RESPONSE_SCHEMA,
        },
        messages: [
          {
            role: "system",
            content:
              "You are a senior flyer designer. You analyze a background and return structured layout decisions only. Choose from the provided font enums. Avoid generic centered layouts when the image clearly wants left or right placement.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: analysisImage.dataUrl,
                  detail: "high",
                },
              },
            ],
          },
        ],
      }),
    });

    const raw = await openAiRes.text();
    let json: any = {};
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      json = {};
    }

    if (!openAiRes.ok) {
      const message =
        json?.error?.message ||
        json?.message ||
        raw ||
        `OpenAI HTTP ${openAiRes.status}`;
      throw new Error(message);
    }

    const content = json?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("OpenAI returned no layout content.");
    }

    const parsed = JSON.parse(content);
    const layout = sanitizeLayout(parsed, format, textZone, {
      brightness: analysisImage.brightness,
      temperature: analysisImage.temperature,
    }, {
      textMode,
      providedText: textHints,
      subject: subjectContext,
    });

    const layoutWithCamera = layout as typeof layout & {
      subjectCameraPlacement?: unknown;
      subjectCameraProfile?: unknown;
    };
    if (requireSubject && !layoutWithCamera.subjectCameraPlacement) {
      throw new Error("Missing director subject coordinates");
    }

    await trackAnalytics("auto_layout_succeeded", {
      format,
      text_mode: textMode,
      composition_mode: compositionMode,
      poster_mode: subjectContext?.mode ?? null,
      brightness: analysisImage.brightness,
      temperature: analysisImage.temperature,
      side: textZone.side,
      align: textZone.align,
    });

    return NextResponse.json({
      layout,
      rationale: layout.rationale,
      text_zone: textZone,
      composition_mode: compositionMode,
      subject: subjectContext,
      subject_camera: layoutWithCamera.subjectCameraPlacement
        ? {
            placement: layoutWithCamera.subjectCameraPlacement,
            profile: layoutWithCamera.subjectCameraProfile ?? null,
          }
        : null,
      generation_limit: reservation.snapshot.generationLimit,
      generation_used: reservation.snapshot.generationUsed,
      generation_remaining: reservation.snapshot.generationRemaining,
    });
  } catch (err: any) {
    await trackAnalytics("auto_layout_failed", {
      message: err?.message || "Auto layout failed.",
    });
    if (reservedUserId && previousUsed != null) {
      try {
        const admin = supabaseAdmin();
        await refundGenerationUnits(admin, reservedUserId, previousUsed, usageBucket);
      } catch {}
    }
    return NextResponse.json(
      { error: err?.message || "Auto layout failed." },
      { status: err instanceof AutoLayoutInputError ? err.status : 500 }
    );
  }
}
