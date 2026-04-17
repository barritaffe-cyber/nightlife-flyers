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

  return {
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
    if (!background) {
      return NextResponse.json({ error: "Missing background image." }, { status: 400 });
    }

    await trackAnalytics("auto_layout_started", {
      format,
      text_mode: textMode,
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
      "Goal: choose readable negative space, choose fitting fonts from the app's current font inventory, choose palette colors sampled from the scene, and place text so it avoids the focal subject.",
      "If the image has a strong subject on one side, push text to the opposite side. If the image already feels centered, use centered composition only when it will remain readable.",
      textMode === "provided"
        ? "Use the supplied flyer text exactly as provided. Do not rewrite it, embellish it, or invent missing fields."
        : "Create new nightlife/event copy from the image itself. Use current text hints only as semantic anchors when they help, but rewrite them into stronger copy instead of repeating them literally.",
      `Computed safe text zone: side ${textZone.side}, align ${textZone.align}, x ${textZone.xMin}-${textZone.xMax}, y ${textZone.yMin}-${textZone.yMax}, zone brightness ${textZone.meanBrightness.toFixed(1)}, detail ${textZone.detailScore.toFixed(1)}.`,
      "Treat that computed zone as the designated text area. Keep the whole text stack inside it.",
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
      "- do not scatter text around the poster; design one coherent stack inside the designated text zone",
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
    });

    await trackAnalytics("auto_layout_succeeded", {
      format,
      text_mode: textMode,
      brightness: analysisImage.brightness,
      temperature: analysisImage.temperature,
      side: textZone.side,
      align: textZone.align,
    });

    return NextResponse.json({
      layout,
      rationale: layout.rationale,
      text_zone: textZone,
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
      { status: 500 }
    );
  }
}
