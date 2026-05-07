import { NextResponse } from "next/server";
import sharp from "sharp";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { supabaseAuth } from "../../../lib/supabase/auth";
import { extractClientTrackingPayload, insertAnalyticsEventForUser } from "../../../lib/analytics/server";
import { refundReservedUnits, reserveGenerationUnits } from "../../../lib/accessQuota";

export const runtime = "nodejs";

const REPLICATE_INPAINT_ENDPOINT =
  process.env.REPLICATE_INPAINT_ENDPOINT ||
  "https://api.replicate.com/v1/models/black-forest-labs/flux-fill/predictions";
const REPLICATE_INPAINT_VERSION = process.env.REPLICATE_INPAINT_VERSION;
const REPLICATE_FILES_ENDPOINT = "https://api.replicate.com/v1/files";

const AI_API_KEY = process.env.REPLICATE_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REMOVE_BG_API_URL =
  (process.env.REMOVE_BG_API_URL || "https://api.remove.bg/v1.0/removebg").trim();

// -----------------------------
// STYLE SUFFIXES (APPEND ONLY)
// -----------------------------
type MagicBlendStyle = "club" | "tropical" | "jazz_bar" | "outdoor_summer";

// -----------------------------
// image helpers
// -----------------------------
function isDataUrl(v: string) {
  return typeof v === "string" && v.startsWith("data:image/");
}

function dataUrlToBuffer(dataUrl: string) {
  if (!dataUrl.startsWith("data:")) throw new Error("Invalid data URL");
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Invalid data URL");
  const meta = dataUrl.slice(5, comma);
  const data = dataUrl.slice(comma + 1);
  if (!data) throw new Error("Invalid data URL");
  if (meta.includes(";base64")) return Buffer.from(data, "base64");
  return Buffer.from(decodeURIComponent(data), "base64");
}

function isProbablyBase64(v: string) {
  if (typeof v !== "string") return false;
  if (v.length < 64) return false;
  return /^[A-Za-z0-9+/=]+$/.test(v);
}

async function toBufferFromAnyImage(input: string): Promise<Buffer> {
  if (typeof input !== "string") throw new Error("Invalid image input");
  if (input.startsWith("blob:")) {
    throw new Error(
      "Got blob: URL. Send data:image/... base64 from client instead."
    );
  }
  if (isDataUrl(input)) return dataUrlToBuffer(input);
  if (!input.startsWith("http")) {
    if (isProbablyBase64(input)) return Buffer.from(input, "base64");
    throw new Error("Invalid image input. Expected data URL or http(s) URL.");
  }

  const res = await fetch(input);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch image URL: ${res.status} ${res.statusText}`
    );
  }
  return Buffer.from(await res.arrayBuffer());
}

function bufferToDataUrlPng(buf: Buffer) {
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function clampInt(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function getRemoveBgApiKey() {
  return (
    process.env.REMOVE_BG_API_KEY ||
    process.env.REMOVEBG_API_KEY ||
    process.env.REMOVE_BG_KEY ||
    ""
  ).trim();
}

function pickRemoveBgErrorMessage(status: number, bodyText: string) {
  if (!bodyText) return `remove.bg failed (${status})`;
  try {
    const parsed = JSON.parse(bodyText);
    const msg =
      parsed?.errors?.[0]?.title ||
      parsed?.errors?.[0]?.detail ||
      parsed?.error?.message ||
      parsed?.message;
    return msg ? String(msg) : `remove.bg failed (${status})`;
  } catch {
    return bodyText.slice(0, 240);
  }
}

type AlphaBounds = { left: number; top: number; width: number; height: number };
type SubjectIsolationAssessment = {
  transparentRatio: number;
  edgeOpaqueRatio: number;
  brightEdgeRatio: number;
  usable: boolean;
};

async function detectOpaqueBounds(buf: Buffer, alphaThreshold = 10): Promise<AlphaBounds | null> {
  const raw = await sharp(buf)
    .ensureAlpha()
    .extractChannel("alpha")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const w = info.width;
  const h = info.height;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (data[row + x] > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

async function hasMeaningfulTransparency(buf: Buffer) {
  const raw = await sharp(buf)
    .ensureAlpha()
    .extractChannel("alpha")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const total = raw.info.width * raw.info.height;
  if (!total) return false;
  let transparentPixels = 0;
  for (let i = 0; i < raw.data.length; i++) {
    if (raw.data[i] < 5) transparentPixels++;
  }
  return transparentPixels / total > 0.01;
}

async function assessSubjectIsolation(buf: Buffer): Promise<SubjectIsolationAssessment> {
  const raw = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const w = info.width;
  const h = info.height;
  const total = w * h;
  if (!total) {
    return {
      transparentRatio: 0,
      edgeOpaqueRatio: 1,
      brightEdgeRatio: 1,
      usable: false,
    };
  }

  const border = Math.max(1, Math.round(Math.min(w, h) * 0.03));
  let transparentPixels = 0;
  let edgePixels = 0;
  let edgeOpaquePixels = 0;
  let brightEdgePixels = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * info.channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 8) transparentPixels += 1;

      const onEdge =
        x < border || y < border || x >= w - border || y >= h - border;
      if (!onEdge) continue;

      edgePixels += 1;
      if (a > 245) {
        edgeOpaquePixels += 1;
        const lum = luminance(r, g, b);
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        if (lum > 230 && chroma < 20) {
          brightEdgePixels += 1;
        }
      }
    }
  }

  const transparentRatio = transparentPixels / total;
  const edgeOpaqueRatio = edgeOpaquePixels / Math.max(edgePixels, 1);
  const brightEdgeRatio = brightEdgePixels / Math.max(edgePixels, 1);
  const looksLikeWhitePlate =
    transparentRatio < 0.03 &&
    edgeOpaqueRatio > 0.94 &&
    brightEdgeRatio > 0.6;
  const usable = transparentRatio > 0.03 && !looksLikeWhitePlate;

  return {
    transparentRatio,
    edgeOpaqueRatio,
    brightEdgeRatio,
    usable,
  };
}

async function removeSubjectBackground(buf: Buffer): Promise<Buffer> {
  const apiKey = getRemoveBgApiKey();
  if (!apiKey) {
    throw new Error("Missing REMOVE_BG_API_KEY");
  }

  const png = await sharp(buf).png().toBuffer();
  const form = new FormData();
  const blob = new Blob([new Uint8Array(png)], { type: "image/png" });
  form.append("image_file", blob, "subject.png");
  form.append("size", "auto");
  form.append("format", "png");

  const upstream = await fetch(REMOVE_BG_API_URL, {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const errorText = await upstream.text().catch(() => "");
    throw new Error(pickRemoveBgErrorMessage(upstream.status, errorText));
  }

  return Buffer.from(await upstream.arrayBuffer());
}

/* eslint-disable @typescript-eslint/no-unused-vars */
async function buildReplacementCompositeAssets(opts: {
  bgCanvas: Buffer;
  subjectBuf: Buffer;
  placementMaskBuf: Buffer;
  sceneProfile: SceneLightingProfile;
}) {
  const bgMeta = await sharp(opts.bgCanvas).metadata();
  if (!bgMeta.width || !bgMeta.height) {
    throw new Error("Invalid background canvas for replacement.");
  }
  const sizeW = bgMeta.width;
  const sizeH = bgMeta.height;
  const maskBounds = await detectOpaqueBounds(opts.placementMaskBuf, 8);
  if (!maskBounds) {
    throw new Error("Placement mask is empty.");
  }

  const padX = Math.round(maskBounds.width * 0.06);
  const padTop = Math.round(maskBounds.height * 0.04);
  const padBottom = Math.round(maskBounds.height * 0.08);
  const regionLeft = clampInt(maskBounds.left - padX, 0, sizeW - 1);
  const regionTop = clampInt(maskBounds.top - padTop, 0, sizeH - 1);
  const regionWidth = clampInt(maskBounds.width + padX * 2, 1, sizeW - regionLeft);
  const regionHeight = clampInt(
    maskBounds.height + padTop + padBottom,
    1,
    sizeH - regionTop
  );

  const normalized = await sharp(opts.subjectBuf).ensureAlpha().png().toBuffer();
  const subjectBounds = (await detectOpaqueBounds(normalized, 8)) || {
    left: 0,
    top: 0,
    width: (await sharp(normalized).metadata()).width || regionWidth,
    height: (await sharp(normalized).metadata()).height || regionHeight,
  };

  const croppedSubject = await sharp(normalized)
    .extract(subjectBounds)
    .png()
    .toBuffer();

  const fitScale = Math.min(
    regionWidth / Math.max(subjectBounds.width, 1),
    regionHeight / Math.max(subjectBounds.height, 1)
  );
  const drawW = Math.max(1, Math.round(subjectBounds.width * fitScale));
  const drawH = Math.max(1, Math.round(subjectBounds.height * fitScale));
  const drawLeft = regionLeft + Math.round((regionWidth - drawW) / 2);
  const drawTop = regionTop + Math.round(regionHeight - drawH);

  const placedSubject = await sharp(croppedSubject)
    .resize(drawW, drawH, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const placedAlpha = await sharp(placedSubject)
    .extractChannel("alpha")
    .blur(1.2)
    .png()
    .toBuffer();

  const shadowOpacity =
    opts.sceneProfile.brightness === "dark"
      ? 0.38
      : opts.sceneProfile.brightness === "mid"
      ? 0.28
      : 0.18;

  const shadowOffsetX =
    opts.sceneProfile.keyDirection.includes("left")
      ? 10
      : opts.sceneProfile.keyDirection.includes("right")
      ? -10
      : 0;
  const shadowOffsetY = 14;
  const shadowAlpha = await sharp(placedAlpha).blur(10).png().toBuffer();
  const shadowTile = await sharp({
    create: {
      width: drawW,
      height: drawH,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .joinChannel(shadowAlpha)
    .png()
    .toBuffer();
  const contactShadow = await sharp(shadowTile)
    .ensureAlpha(shadowOpacity)
    .png()
    .toBuffer();

  const edgeWrap = await sharp(await sharp(opts.bgCanvas)
    .extract({
      left: clampInt(drawLeft, 0, sizeW - 1),
      top: clampInt(drawTop, 0, sizeH - 1),
      width: clampInt(drawW, 1, sizeW - clampInt(drawLeft, 0, sizeW - 1)),
      height: clampInt(drawH, 1, sizeH - clampInt(drawTop, 0, sizeH - 1)),
    })
    .blur(6)
    .png()
    .toBuffer())
    .joinChannel(placedAlpha)
    .blur(1.4)
    .png()
    .toBuffer();

  const composite = await sharp(opts.bgCanvas)
    .composite([
      {
        input: contactShadow,
        left: clampInt(drawLeft + shadowOffsetX, 0, sizeW - 1),
        top: clampInt(drawTop + shadowOffsetY, 0, sizeH - 1),
        blend: "multiply",
      },
      { input: edgeWrap, left: drawLeft, top: drawTop, blend: "screen" },
      { input: placedSubject, left: drawLeft, top: drawTop },
    ])
    .png()
    .toBuffer();

  const localMaskBase = await sharp({
    create: {
      width: sizeW,
      height: sizeH,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([{ input: placedAlpha, left: drawLeft, top: drawTop }])
    .png()
    .toBuffer();

  const localMask = await sharp(localMaskBase)
    .grayscale()
    .blur(12)
    .linear(1.4, 0)
    .threshold(10)
    .png()
    .toBuffer();

  return { composite, localMask };
}

type SceneLightingProfile = {
  keyDirection: string;
  verticalBias: string;
  temperature: string;
  contrast: string;
  shadowSoftness: string;
  brightness: string;
  saturation: string;
  highlightHex: string;
  shadowHex: string;
};

type CameraZoom = "full body" | "three-quarter" | "waist-up" | "chest-up" | "auto";

function normalizeCameraZoom(raw: string): CameraZoom {
  const z = String(raw || "auto").trim().toLowerCase();
  if (z === "full body" || z === "full-body") return "full body";
  if (z === "three-quarter" || z === "three quarter" || z === "3/4") return "three-quarter";
  if (z === "waist-up" || z === "waist up") return "waist-up";
  if (z === "chest-up" || z === "chest up" || z === "close-up" || z === "close up") return "chest-up";
  return "auto";
}

function toHexByte(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)))
    .toString(16)
    .padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

type RgbColor = { r: number; g: number; b: number };

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(a: RgbColor, b: RgbColor, amount: number): RgbColor {
  const t = Math.max(0, Math.min(1, amount));
  return {
    r: clampByte(a.r * (1 - t) + b.r * t),
    g: clampByte(a.g * (1 - t) + b.g * t),
    b: clampByte(a.b * (1 - t) + b.b * t),
  };
}

function luminanceOfColor(color: RgbColor) {
  return luminance(color.r, color.g, color.b);
}

function scaleAlpha(raw: Buffer, opacity: number) {
  const out = Buffer.alloc(raw.length);
  const factor = Math.max(0, Math.min(1, opacity));
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = Math.max(0, Math.min(255, Math.round(raw[i] * factor)));
  }
  return out;
}

async function detectMaskBounds(buf: Buffer, threshold = 10): Promise<AlphaBounds | null> {
  const raw = await sharp(buf)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const w = info.width;
  const h = info.height;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    for (let x = 0; x < w; x += 1) {
      if (data[row + x] > threshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

async function computeSceneLuminance(buf: Buffer) {
  const raw = await sharp(buf)
    .resize(48, 48, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  let total = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < pixels; i += 1) {
    const o = i * info.channels;
    total += luminance(data[o], data[o + 1], data[o + 2]);
  }
  return pixels ? total / pixels : 96;
}

async function computeMaskedLuminance(buf: Buffer, maskBuf: Buffer) {
  const [imageRaw, maskRaw] = await Promise.all([
    sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(maskBuf).extractChannel(0).raw().toBuffer({ resolveWithObject: true }),
  ]);

  const { data, info } = imageRaw;
  let total = 0;
  let weight = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < pixels; i += 1) {
    const mask = maskRaw.data[i] / 255;
    if (mask <= 0.02) continue;
    const o = i * info.channels;
    const alpha = info.channels > 3 ? data[o + 3] / 255 : 1;
    const w = mask * alpha;
    if (w <= 0.01) continue;
    total += luminance(data[o], data[o + 1], data[o + 2]) * w;
    weight += w;
  }
  return weight > 0 ? total / weight : 96;
}

async function trimSubjectToAlpha(buf: Buffer) {
  const normalized = await sharp(buf).ensureAlpha().png().toBuffer();
  const alphaBuf = await sharp(normalized).extractChannel("alpha").png().toBuffer();
  const bounds = await detectOpaqueBounds(normalized, 8);
  const meta = await sharp(normalized).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Invalid subject image.");
  }
  if (!bounds) {
    return {
      subjectBuf: normalized,
      maskBuf: alphaBuf,
      bounds: { left: 0, top: 0, width: meta.width, height: meta.height },
    };
  }

  const extractArea = {
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
  };

  const [subjectBuf, maskBuf] = await Promise.all([
    sharp(normalized).extract(extractArea).png().toBuffer(),
    sharp(alphaBuf).extract(extractArea).png().toBuffer(),
  ]);

  return { subjectBuf, maskBuf, bounds };
}

async function buildSubjectIdentityReference(buf: Buffer) {
  const trimmed = await trimSubjectToAlpha(buf);
  const subjectBoard = await sharp({
    create: {
      width: 1024,
      height: 1536,
      channels: 3,
      background: { r: 238, g: 233, b: 226 },
    },
  })
    .composite([
      {
        input: await sharp(trimmed.subjectBuf)
          .resize(860, 1320, {
            fit: "contain",
            withoutEnlargement: false,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer(),
        left: 82,
        top: 118,
      },
    ])
    .png()
    .toBuffer();

  return sharp(subjectBoard)
    .modulate({ brightness: 1.02, saturation: 1.02 })
    .png()
    .toBuffer();
}

async function renderPlacedSubjectFromSource(
  sourceSubjectBuf: Buffer,
  placementMaskBuf: Buffer,
  canvasWidth: number,
  canvasHeight: number
) {
  const placementBounds = await detectMaskBounds(placementMaskBuf, 12);
  if (!placementBounds) throw new Error("Could not determine subject placement.");

  const trimmed = await trimSubjectToAlpha(sourceSubjectBuf);
  const [resizedSubjectBuf, resizedMaskBuf] = await Promise.all([
    sharp(trimmed.subjectBuf)
      .resize(placementBounds.width, placementBounds.height, { fit: "fill" })
      .png()
      .toBuffer(),
    sharp(trimmed.maskBuf)
      .resize(placementBounds.width, placementBounds.height, { fit: "fill" })
      .png()
      .toBuffer(),
  ]);

  const placedSubjectBuf = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedSubjectBuf, left: placementBounds.left, top: placementBounds.top }])
    .png()
    .toBuffer();

  const placedMaskBuf = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: resizedMaskBuf, left: placementBounds.left, top: placementBounds.top }])
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .grayscale()
    .png()
    .toBuffer();

  return {
    placedSubjectBuf,
    placedMaskBuf,
    placementBounds,
  };
}

async function detectSceneLighting(
  bgBuf: Buffer,
  maskBuf: Buffer
): Promise<{ lightSide: "left" | "right"; highlightColor: RgbColor; sideContrast: number }> {
  const bounds = await detectMaskBounds(maskBuf, 12);
  if (!bounds) {
    return {
      lightSide: "left",
      highlightColor: { r: 244, g: 218, b: 188 },
      sideContrast: 32,
    };
  }

  const raw = await sharp(bgBuf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const stripW = Math.max(16, Math.round(bounds.width * 0.18));
  const leftStart = Math.max(0, bounds.left - stripW);
  const leftEnd = Math.max(leftStart + 1, bounds.left);
  const rightStart = Math.min(info.width - 1, bounds.left + bounds.width);
  const rightEnd = Math.min(info.width, rightStart + stripW);
  const top = Math.max(0, bounds.top + Math.round(bounds.height * 0.06));
  const bottom = Math.min(info.height, bounds.top + Math.round(bounds.height * 0.9));
  const topBand = Math.max(14, Math.round(bounds.height * 0.18));
  const topStart = Math.max(0, bounds.top - topBand);
  const topEnd = Math.max(topStart + 1, bounds.top);

  const sampleRegion = (x0: number, x1: number, y0: number, y1: number) => {
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let totalL = 0;
    let count = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const o = (y * info.width + x) * info.channels;
        const r = data[o];
        const g = data[o + 1];
        const b = data[o + 2];
        totalR += r;
        totalG += g;
        totalB += b;
        totalL += luminance(r, g, b);
        count += 1;
      }
    }
    if (!count) {
      return { color: { r: 224, g: 200, b: 178 }, luminance: 128 };
    }
    return {
      color: {
        r: clampByte(totalR / count),
        g: clampByte(totalG / count),
        b: clampByte(totalB / count),
      },
      luminance: totalL / count,
    };
  };

  const leftSample = sampleRegion(leftStart, leftEnd, top, bottom);
  const rightSample = sampleRegion(rightStart, rightEnd, top, bottom);
  const topSample = sampleRegion(bounds.left, bounds.left + bounds.width, topStart, topEnd);
  const lightSide = leftSample.luminance >= rightSample.luminance ? "left" : "right";
  const sideColor = lightSide === "left" ? leftSample.color : rightSample.color;
  const sideContrast = Math.abs(leftSample.luminance - rightSample.luminance);
  const liftTowardWhite = sideContrast > 26 ? 0.62 : sideContrast > 14 ? 0.52 : 0.44;
  const liftedSideColor = mixColor(sideColor, { r: 255, g: 248, b: 238 }, liftTowardWhite);
  const topLiftedColor = mixColor(topSample.color, { r: 255, g: 246, b: 236 }, 0.42);
  const highlightColor = mixColor(liftedSideColor, topLiftedColor, 0.48);

  return { lightSide, highlightColor, sideContrast };
}

async function buildDirectionalSubjectMasks(maskBuf: Buffer, lightSide: "left" | "right") {
  const normalized = await sharp(maskBuf).grayscale().png().toBuffer();
  const meta = await sharp(normalized).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Invalid placement mask.");
  }

  const coreRaw = await sharp(normalized).threshold(12).raw().toBuffer({ resolveWithObject: true });
  const highlightGradientSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}">
      <defs>
        <linearGradient id="hx" x1="${lightSide === "left" ? "0%" : "100%"}" y1="0%" x2="${lightSide === "left" ? "100%" : "0%"}" y2="0%">
          <stop offset="0%" stop-color="white" stop-opacity="1" />
          <stop offset="52%" stop-color="white" stop-opacity="0.56" />
          <stop offset="100%" stop-color="white" stop-opacity="0.06" />
        </linearGradient>
        <linearGradient id="hy" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="1" />
          <stop offset="68%" stop-color="white" stop-opacity="0.46" />
          <stop offset="100%" stop-color="white" stop-opacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hx)" />
      <rect width="100%" height="100%" fill="url(#hy)" />
    </svg>`
  );
  const shadowGradientSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}">
      <defs>
        <linearGradient id="sx" x1="${lightSide === "left" ? "100%" : "0%"}" y1="0%" x2="${lightSide === "left" ? "0%" : "100%"}" y2="0%">
          <stop offset="0%" stop-color="white" stop-opacity="1" />
          <stop offset="66%" stop-color="white" stop-opacity="0.4" />
          <stop offset="100%" stop-color="white" stop-opacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#sx)" />
    </svg>`
  );

  const toGrayRaw = async (svg: Buffer) =>
    sharp({
      create: {
        width: meta.width,
        height: meta.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .composite([{ input: svg }])
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .grayscale()
      .raw()
      .toBuffer();

  const highlightRaw = await toGrayRaw(highlightGradientSvg);
  const shadowRaw = await toGrayRaw(shadowGradientSvg);
  const highlightMaskRaw = Buffer.alloc(coreRaw.data.length);
  const shadowMaskRaw = Buffer.alloc(coreRaw.data.length);

  for (let i = 0; i < coreRaw.data.length; i += 1) {
    const core = coreRaw.data[i] / 255;
    const hi = highlightRaw[i] / 255;
    const sh = shadowRaw[i] / 255;
    highlightMaskRaw[i] = Math.round(255 * core * hi);
    shadowMaskRaw[i] = Math.round(255 * core * sh);
  }

  const toMaskPng = (rawBuf: Buffer) =>
    sharp(rawBuf, {
      raw: { width: meta.width, height: meta.height, channels: 1 },
    })
      .blur(4.4)
      .png()
      .toBuffer();

  return {
    subjectHighlightMask: await toMaskPng(highlightMaskRaw),
    subjectShadowMask: await toMaskPng(shadowMaskRaw),
  };
}

async function buildIntegrationMasks(maskBuf: Buffer) {
  const normalized = await sharp(maskBuf).grayscale().png().toBuffer();
  const meta = await sharp(normalized).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Invalid placement mask.");
  }

  const coreRaw = await sharp(normalized).threshold(12).raw().toBuffer({ resolveWithObject: true });
  const outerRaw = await sharp(normalized).blur(4.5).threshold(6).raw().toBuffer({ resolveWithObject: true });
  const innerRaw = await sharp(normalized).blur(1.8).threshold(200).raw().toBuffer({ resolveWithObject: true });

  const ring = Buffer.alloc(coreRaw.info.width * coreRaw.info.height);
  const innerBand = Buffer.alloc(coreRaw.info.width * coreRaw.info.height);
  for (let i = 0; i < ring.length; i += 1) {
    const coreOn = coreRaw.data[i] > 12;
    const outerOn = outerRaw.data[i] > 10;
    const innerOn = innerRaw.data[i] > 180;
    ring[i] = outerOn && !coreOn ? 255 : 0;
    innerBand[i] = coreOn && !innerOn ? 255 : 0;
  }

  const bounds = await detectMaskBounds(normalized, 12);
  const shadow = Buffer.alloc(ring.length);
  if (bounds) {
    const cx = bounds.left + bounds.width / 2;
    const cy = Math.min(meta.height - 1, bounds.top + bounds.height + bounds.height * 0.06);
    const rx = Math.max(16, bounds.width * 0.26);
    const ry = Math.max(8, bounds.height * 0.055);
    const shadowSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}">
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" />
      </svg>`
    );
    const shadowRaw = await sharp({
      create: {
        width: meta.width,
        height: meta.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .composite([{ input: shadowSvg }])
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .grayscale()
      .blur(14)
      .raw()
      .toBuffer();

    for (let i = 0; i < shadow.length; i += 1) {
      const coreOn = coreRaw.data[i] > 12;
      shadow[i] = coreOn ? 0 : shadowRaw[i];
    }
  }

  const ringMask = await sharp(ring, {
    raw: { width: meta.width, height: meta.height, channels: 1 },
  })
    .blur(0.35)
    .png()
    .toBuffer();
  const shadowMask = await sharp(shadow, {
    raw: { width: meta.width, height: meta.height, channels: 1 },
  }).png().toBuffer();
  const innerSpillMask = await sharp(innerBand, {
    raw: { width: meta.width, height: meta.height, channels: 1 },
  })
    .blur(0.6)
    .png()
    .toBuffer();

  return { ringMask, shadowMask, innerSpillMask };
}

async function buildAlphaOverlay(rgbBuf: Buffer, maskBuf: Buffer, opacity: number) {
  const rgb = await sharp(rgbBuf).removeAlpha().png().toBuffer();
  const alphaRaw = await sharp(maskBuf).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const scaledAlpha = scaleAlpha(alphaRaw.data, opacity);
  return sharp(rgb)
    .joinChannel(
      await sharp(scaledAlpha, {
        raw: { width: alphaRaw.info.width, height: alphaRaw.info.height, channels: 1 },
      }).png().toBuffer()
    )
    .png()
    .toBuffer();
}

async function buildBlackOverlay(width: number, height: number, maskBuf: Buffer, opacity: number) {
  const alphaRaw = await sharp(maskBuf).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const scaledAlpha = scaleAlpha(alphaRaw.data, opacity);
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .joinChannel(
      await sharp(scaledAlpha, {
        raw: { width: alphaRaw.info.width, height: alphaRaw.info.height, channels: 1 },
      }).png().toBuffer()
    )
    .png()
    .toBuffer();
}

async function buildColorOverlay(
  width: number,
  height: number,
  maskBuf: Buffer,
  opacity: number,
  color: RgbColor
) {
  const alphaRaw = await sharp(maskBuf).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const scaledAlpha = scaleAlpha(alphaRaw.data, opacity);
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .joinChannel(
      await sharp(scaledAlpha, {
        raw: { width: alphaRaw.info.width, height: alphaRaw.info.height, channels: 1 },
      }).png().toBuffer()
    )
    .png()
    .toBuffer();
}

async function buildUnionMask(buffers: Buffer[], blur = 1.8): Promise<Buffer> {
  if (!buffers.length) {
    throw new Error("No masks provided.");
  }

  const raws = await Promise.all(
    buffers.map((buf) =>
      sharp(buf)
        .extractChannel(0)
        .raw()
        .toBuffer({ resolveWithObject: true })
    )
  );

  const first = raws[0];
  const out = Buffer.alloc(first.info.width * first.info.height);
  for (let i = 0; i < out.length; i += 1) {
    let max = 0;
    for (const raw of raws) {
      const next = raw.data[i];
      if (next > max) max = next;
    }
    out[i] = max;
  }

  return sharp(out, {
    raw: {
      width: first.info.width,
      height: first.info.height,
      channels: 1,
    },
  })
    .blur(blur)
    .png()
    .toBuffer();
}

type EditSize = "1024x1024" | "1024x1536" | "1536x1024";
type LocalizedEditPatch = {
  cropImage: Buffer;
  cropMask: Buffer;
  editSize: EditSize;
  left: number;
  top: number;
  width: number;
  height: number;
};

function pickLocalizedEditSize(width: number, height: number): EditSize {
  const aspect = width / Math.max(height, 1);
  if (aspect <= 0.76) return "1024x1536";
  if (aspect >= 1.32) return "1536x1024";
  return "1024x1024";
}

function getEditAspect(size: EditSize) {
  if (size === "1024x1536") return 1024 / 1536;
  if (size === "1536x1024") return 1536 / 1024;
  return 1;
}

function fitRectToAspect(
  rect: AlphaBounds,
  canvasWidth: number,
  canvasHeight: number,
  targetAspect: number
): AlphaBounds {
  let left = rect.left;
  let top = rect.top;
  let width = rect.width;
  let height = rect.height;

  if (width / Math.max(height, 1) < targetAspect) {
    const desiredWidth = Math.min(canvasWidth, Math.max(width, Math.round(height * targetAspect)));
    left = clampInt(Math.round(left + width / 2 - desiredWidth / 2), 0, canvasWidth - desiredWidth);
    width = desiredWidth;
  } else {
    const desiredHeight = Math.min(
      canvasHeight,
      Math.max(height, Math.round(width / Math.max(targetAspect, 0.001)))
    );
    top = clampInt(Math.round(top + height / 2 - desiredHeight / 2), 0, canvasHeight - desiredHeight);
    height = desiredHeight;
  }

  return { left, top, width, height };
}

async function buildLocalizedEditPatch(
  imageBuf: Buffer,
  maskBuf: Buffer
): Promise<LocalizedEditPatch | null> {
  const bounds = await detectMaskBounds(maskBuf, 10);
  const meta = await sharp(imageBuf).metadata();
  if (!bounds || !meta.width || !meta.height) {
    return null;
  }

  const padX = Math.max(80, Math.round(bounds.width * 0.22));
  const padTop = Math.max(72, Math.round(bounds.height * 0.18));
  const padBottom = Math.max(96, Math.round(bounds.height * 0.32));
  const padded: AlphaBounds = {
    left: clampInt(bounds.left - padX, 0, meta.width - 1),
    top: clampInt(bounds.top - padTop, 0, meta.height - 1),
    width: clampInt(bounds.width + padX * 2, 1, meta.width),
    height: clampInt(bounds.height + padTop + padBottom, 1, meta.height),
  };
  padded.width = Math.min(padded.width, meta.width - padded.left);
  padded.height = Math.min(padded.height, meta.height - padded.top);

  const editSize = pickLocalizedEditSize(padded.width, padded.height);
  const cropRect = fitRectToAspect(padded, meta.width, meta.height, getEditAspect(editSize));
  const extractArea = {
    left: cropRect.left,
    top: cropRect.top,
    width: cropRect.width,
    height: cropRect.height,
  };
  const [cropImage, cropMask] = await Promise.all([
    sharp(imageBuf).extract(extractArea).png().toBuffer(),
    sharp(maskBuf).extract(extractArea).png().toBuffer(),
  ]);

  return {
    cropImage,
    cropMask,
    editSize,
    left: cropRect.left,
    top: cropRect.top,
    width: cropRect.width,
    height: cropRect.height,
  };
}

async function mergeLocalizedEditPatch(
  baseImageBuf: Buffer,
  patchBuf: Buffer,
  patch: LocalizedEditPatch,
  mergeMaskBuf?: Buffer
) {
  const [resizedPatch, resizedMask] = await Promise.all([
    sharp(patchBuf)
      .resize(patch.width, patch.height, { fit: "fill" })
      .ensureAlpha()
      .png()
      .toBuffer(),
    sharp(mergeMaskBuf || patch.cropMask)
      .resize(patch.width, patch.height, { fit: "fill" })
      .extractChannel(0)
      .png()
      .toBuffer(),
  ]);

  const maskedPatch = await sharp(await sharp(resizedPatch).removeAlpha().png().toBuffer())
    .joinChannel(resizedMask)
    .png()
    .toBuffer();

  return sharp(baseImageBuf)
    .composite([{ input: maskedPatch, left: patch.left, top: patch.top }])
    .png()
    .toBuffer();
}

function getCameraFramingLock(
  rawZoom: string,
  format: "square" | "story" | "portrait",
  lowAngleHint = false
) {
  const z = normalizeCameraZoom(rawZoom);
  const base =
    "Camera framing lock (strict): selected framing is a hard requirement. Keep the subject in the same placement anchor from the Placement Reference (Image 2). Do not recenter. Do not shift horizon. Do not change perspective.";
  const lensCritical =
    "Lens matching (critical): match scene lens perspective from the Background Reference (Image 3). Wide room/deep perspective -> 24-35mm. Natural perspective -> 50mm. Cinematic compression -> 85mm+. Do not default to generic portrait compression.";

  if (z === "full body") {
    const lowAngleLine = lowAngleHint
      ? "- low angle full-body shot, slight upward perspective, 28mm lens"
      : "- camera at eye level, 35mm lens perspective consistent with background";
    return `${base}
- full-body framing is a preference, not permission to break scene realism
- keep as much of the body visible as the placement guide and scene naturally allow
${lowAngleLine}
- preserve natural body proportions; no stretch
- do not create extra headroom/foot room by shrinking the subject into a separate framed insert
- feet must be grounded with realistic contact shadow under shoes
- correct scale relative to surrounding architecture and objects
- keep the subject embedded in the scene; do not isolate the subject on a plain backdrop, clean studio setup, white card, or seamless background
- do not create a poster cutout, model comp card, standalone fashion render, inset image, or image-within-image panel
- adjust perspective and scale to match the environment naturally
- ${lensCritical}`;
  }
  if (z === "three-quarter") {
    return `${base}
- three-quarter body shot: frame from mid-thigh to top of head
- natural perspective consistent with background depth and horizon
- camera at subject chest height, 50mm lens
- both hands should remain visible when present in the Placement Reference (Image 2)
- avoid tight crop and avoid full-body zoom-out
- adjust perspective and scale to match the environment naturally
- ${lensCritical}`;
  }
  if (z === "waist-up") {
    return `${base}
- waist-up framing: frame from waist/upper-hip to top of head
- waist-up portrait with realistic shoulder width and torso proportions
- eye-level camera, 50mm lens natural perspective
- preserve shoulder width and arm proportions
- do not collapse into chest-up or close-up
- adjust perspective and scale to match the environment naturally
- ${lensCritical}`;
  }
  if (z === "chest-up") {
    return `${base}
- close-up portrait framing: frame from upper chest to top of head
- 85mm lens compression; shallow depth of field only if scene supports it
- keep full hairline and chin visible; no forehead/chin crop
- do not zoom out to waist/full body
- adjust perspective and scale to match the environment naturally
- ${lensCritical}`;
  }
  const formatHint =
    format === "story"
      ? "vertical composition priority"
      : format === "portrait"
      ? "4:5 portrait composition priority"
      : "square composition priority";
  return `${base}
- honor ${formatHint}
- keep subject size and crop matched to the Placement Reference (Image 2)
- prioritize lens/perspective consistency with the Background Reference (Image 3) over generic portrait look
- adjust perspective and scale to match the environment naturally
- ${lensCritical}`;
}

async function analyzeSceneLighting(bgCanvas: Buffer): Promise<SceneLightingProfile> {
  const tiny = await sharp(bgCanvas)
    .resize(96, 96, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = tiny;
  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  const cx = w / 2;
  const cy = h / 2;

  let lumSum = 0;
  let lumSqSum = 0;
  let satSum = 0;
  let total = 0;

  let leftLum = 0;
  let rightLum = 0;
  let topLum = 0;
  let bottomLum = 0;
  let leftCount = 0;
  let rightCount = 0;
  let topCount = 0;
  let bottomCount = 0;

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;

  let hiR = 0;
  let hiG = 0;
  let hiB = 0;
  let hiCount = 0;

  let loR = 0;
  let loG = 0;
  let loB = 0;
  let loCount = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = luminance(r, g, b);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max - min;

      total += 1;
      lumSum += lum;
      lumSqSum += lum * lum;
      satSum += sat;
      rSum += r;
      gSum += g;
      bSum += b;

      if (x < cx) {
        leftLum += lum;
        leftCount += 1;
      } else {
        rightLum += lum;
        rightCount += 1;
      }
      if (y < cy) {
        topLum += lum;
        topCount += 1;
      } else {
        bottomLum += lum;
        bottomCount += 1;
      }

      if (lum >= 188) {
        hiR += r;
        hiG += g;
        hiB += b;
        hiCount += 1;
      }
      if (lum <= 70) {
        loR += r;
        loG += g;
        loB += b;
        loCount += 1;
      }
    }
  }

  const meanLum = lumSum / Math.max(total, 1);
  const varLum = lumSqSum / Math.max(total, 1) - meanLum * meanLum;
  const stdLum = Math.sqrt(Math.max(0, varLum));
  const meanSat = satSum / Math.max(total, 1);
  const meanR = rSum / Math.max(total, 1);
  const meanB = bSum / Math.max(total, 1);

  const leftMean = leftLum / Math.max(leftCount, 1);
  const rightMean = rightLum / Math.max(rightCount, 1);
  const topMean = topLum / Math.max(topCount, 1);
  const bottomMean = bottomLum / Math.max(bottomCount, 1);

  const horizDelta = leftMean - rightMean;
  const vertDelta = topMean - bottomMean;

  let keyDirection = "mixed ambient";
  if (Math.abs(horizDelta) >= 6 || Math.abs(vertDelta) >= 6) {
    const horiz =
      Math.abs(horizDelta) >= 6 ? (horizDelta > 0 ? "left" : "right") : "";
    const vert =
      Math.abs(vertDelta) >= 6 ? (vertDelta > 0 ? "top" : "bottom") : "";
    keyDirection = horiz && vert ? `${vert}-${horiz}` : horiz || vert;
  }

  const verticalBias =
    vertDelta > 6 ? "top-bright" : vertDelta < -6 ? "bottom-bright" : "balanced";
  const temperature =
    meanR - meanB > 12 ? "warm" : meanR - meanB < -12 ? "cool" : "neutral";
  const contrast = stdLum > 60 ? "high" : stdLum > 35 ? "medium" : "low";
  const shadowSoftness =
    contrast === "high" ? "hard-edged" : contrast === "medium" ? "medium" : "soft";
  const brightness = meanLum > 148 ? "bright" : meanLum > 95 ? "mid" : "dark";
  const saturation = meanSat > 70 ? "vivid" : meanSat > 38 ? "moderate" : "muted";

  const hiAvg = {
    r: hiCount ? hiR / hiCount : meanR,
    g: hiCount ? hiG / hiCount : gSum / Math.max(total, 1),
    b: hiCount ? hiB / hiCount : meanB,
  };
  const loAvg = {
    r: loCount ? loR / loCount : meanR * 0.35,
    g: loCount ? loG / loCount : (gSum / Math.max(total, 1)) * 0.35,
    b: loCount ? loB / loCount : meanB * 0.35,
  };

  return {
    keyDirection,
    verticalBias,
    temperature,
    contrast,
    shadowSoftness,
    brightness,
    saturation,
    highlightHex: rgbToHex(hiAvg.r, hiAvg.g, hiAvg.b),
    shadowHex: rgbToHex(loAvg.r, loAvg.g, loAvg.b),
  };
}

async function uploadToReplicate(dataUrl: string, token: string): Promise<string> {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  const mime = match[1];
  const buf = Buffer.from(match[2], "base64");
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buf)], { type: mime });
  form.append("content", blob, "upload.png");

  const res = await fetch(REPLICATE_FILES_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(raw || "Replicate file upload failed");
  const data = JSON.parse(raw);
  const url = data?.urls?.get || data?.url || data?.file;
  if (!url) throw new Error("Missing uploaded file url");
  return url;
}

async function runReplicatePrediction(
  endpoint: string,
  token: string,
  input: Record<string, unknown>,
  version?: string
) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(version ? { version, input } : { input }),
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(raw || "Replicate request failed");
  const data = JSON.parse(raw);
  if (data.status === "succeeded") return data.output;
  if (data.status === "failed") {
    throw new Error(data.error || "Replicate prediction failed");
  }
  const pollUrl = data?.urls?.get;
  if (!pollUrl) throw new Error("Missing polling URL");

  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const poll = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const out = await poll.json();
    if (out.status === "succeeded") return out.output;
    if (out.status === "failed") {
      throw new Error(out.error || "Replicate prediction failed");
    }
  }
  throw new Error("Replicate timed out");
}

async function runReplicateInpaint(opts: {
  imageDataUrl: string;
  maskDataUrl: string;
  prompt: string;
}) {
  if (!AI_API_KEY) {
    throw new Error("Missing REPLICATE_API_TOKEN in .env.local");
  }

  const version = REPLICATE_INPAINT_ENDPOINT.includes("/models/")
    ? undefined
    : REPLICATE_INPAINT_VERSION;
  if (!REPLICATE_INPAINT_ENDPOINT.includes("/models/") && !version) {
    throw new Error("Missing REPLICATE_INPAINT_VERSION");
  }

  let image = opts.imageDataUrl;
  let mask = opts.maskDataUrl;
  if (isDataUrl(image)) image = await uploadToReplicate(image, AI_API_KEY);
  if (isDataUrl(mask)) mask = await uploadToReplicate(mask, AI_API_KEY);
  if (!isHttpUrl(image) || !isHttpUrl(mask)) {
    throw new Error("Replicate inpaint requires image and mask URLs.");
  }

  const output = await runReplicatePrediction(
    REPLICATE_INPAINT_ENDPOINT,
    AI_API_KEY,
    {
      image,
      mask,
      prompt: opts.prompt,
      output_format: "png",
    },
    version
  );

  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  if (typeof output === "string") return output;
  if (output?.image && typeof output.image === "string") return output.image;
  if (output?.url && typeof output.url === "string") return output.url;
  if (Array.isArray(output?.images) && typeof output.images[0] === "string") {
    return output.images[0];
  }
  throw new Error("Replicate inpaint returned no image");
}

async function runOpenAIEdit(opts: {
  image: Buffer | Buffer[];
  mask?: Buffer;
  prompt: string;
  size: EditSize;
  inputFidelity?: "high" | "low";
  quality?: "high" | "medium" | "low" | "auto";
  background?: "opaque" | "transparent" | "auto";
}) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in .env.local");
  }

  const form = new FormData();
  const images = Array.isArray(opts.image) ? opts.image : [opts.image];
  images.forEach((imageBuf, index) => {
    const blob = new Blob([new Uint8Array(imageBuf)], { type: "image/png" });
    if (images.length > 1) {
      form.append("image[]", blob, `image-${index + 1}.png`);
    } else {
      form.append("image", blob, "image.png");
    }
  });
  if (opts.mask) {
    const maskBlob = new Blob([new Uint8Array(opts.mask)], { type: "image/png" });
    form.append("mask", maskBlob, "mask.png");
  }
  form.append("model", "gpt-image-1");
  form.append("prompt", opts.prompt);
  form.append("size", opts.size);
  if (opts.inputFidelity) {
    form.append("input_fidelity", opts.inputFidelity);
  }
  if (opts.quality) {
    form.append("quality", opts.quality);
  }
  if (opts.background) {
    form.append("background", opts.background);
  }

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: form,
  });

  const j = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    const msg = j?.error?.message || `OpenAI HTTP ${res.status}`;
    throw new Error(msg);
  }

  const out = j?.data?.[0];
  if (!out) throw new Error("No image in OpenAI response");

  if (out.b64_json) {
    return `data:image/png;base64,${out.b64_json}`;
  }
  if (out.url) return out.url as string;
  throw new Error("OpenAI returned empty image");
}

async function buildOpenAiEditMask(maskBuf: Buffer): Promise<Buffer> {
  const raw = await sharp(maskBuf)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = raw;
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const v = data[i];
    const o = i * 4;
    out[o] = 255;
    out[o + 1] = 255;
    out[o + 2] = 255;
    out[o + 3] = 255 - v;
  }

  return sharp(out, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

async function buildEdgeBandEditMask(maskBuf: Buffer): Promise<Buffer> {
  const normalized = await sharp(maskBuf)
    .grayscale()
    .threshold(10)
    .png()
    .toBuffer();

  const expanded = await sharp(normalized).dilate(24).raw().toBuffer({ resolveWithObject: true });
  const contracted = await sharp(normalized).erode(10).raw().toBuffer({ resolveWithObject: true });
  const { data: expandedData, info } = expanded;
  const { data: contractedData } = contracted;
  const ring = Buffer.alloc(info.width * info.height);
  let nonZero = 0;

  for (let i = 0; i < ring.length; i += 1) {
    const value = Math.max(0, expandedData[i] - contractedData[i]);
    ring[i] = value;
    if (value > 0) nonZero += 1;
  }

  if (!nonZero) {
    return normalized;
  }

  return sharp(ring, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 1,
    },
  })
    .blur(2.4)
    .png()
    .toBuffer();
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// -----------------------------
// route
// -----------------------------
export async function POST(req: Request) {
  let stage = "init";
  let activeProvider: "stability" | "openai" | "replicate" | "nano" | "fal" | undefined;
  let reservedUserId: string | null = null;
  let previousUsed: number | null = null;
  let usageBucket: "standard" | "starter" = "standard";
  let analyticsAdmin: ReturnType<typeof supabaseAdmin> | null = null;
  let analyticsUser: User | null = null;
  let analyticsTracking: ReturnType<typeof extractClientTrackingPayload> | null = null;

  const trackAnalytics = async (
    eventName: "magic_blend_started" | "magic_blend_succeeded" | "magic_blend_failed",
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
    stage = "parse-body";
    const body = await req.json();
    const trackingBody =
      body?.tracking && typeof body.tracking === "object" ? body.tracking : body;
    analyticsTracking = extractClientTrackingPayload(req, trackingBody);
    const {
      subject,
      background,
      placementReference,
      placementMask,
      replaceSubject = false,
      style = "club",
      format = "square",
      provider = "openai",
      cameraZoom = "auto",
      extraPrompt = "",
    } = body as {
      subject: string;
      background: string;
      placementReference?: string;
      placementMask?: string;
      replaceSubject?: boolean;
      style?: MagicBlendStyle;
      format?: "square" | "story" | "portrait";
      provider?: "stability" | "openai" | "replicate" | "nano" | "fal";
      cameraZoom?: string;
      extraPrompt?: string;
    };
    activeProvider = provider;

    stage = "validate-inputs";
    if (!subject || !background) {
      return NextResponse.json(
        { error: "Missing required fields: subject, background." },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Login required for Magic Blend." }, { status: 401 });
    }

    const authClient = supabaseAuth();
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    reservedUserId = userData.user.id;
    analyticsUser = userData.user;
    const admin = supabaseAdmin();
    analyticsAdmin = admin;
    const reservation = await reserveGenerationUnits(admin, reservedUserId, 2);
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
    previousUsed = reservation.previousUsed;
    usageBucket = reservation.usageBucket;
    const quotaMeta = {
      generation_limit: reservation.snapshot.generationLimit,
      generation_used: reservation.snapshot.generationUsed,
      generation_remaining: reservation.snapshot.generationRemaining,
    };

    await trackAnalytics("magic_blend_started", {
      provider,
      format,
      replace_subject: Boolean(replaceSubject),
      usage_bucket: usageBucket,
    });

    stage = "resolve-style";
    const safeStyle: MagicBlendStyle =
      style === "tropical" || style === "jazz_bar" || style === "outdoor_summer"
        ? style
        : "club";

    const successResponse = async (providerName: string, outUrl: string) => {
      await trackAnalytics("magic_blend_succeeded", {
        provider: providerName,
        format,
        style: safeStyle,
        replace_subject: Boolean(replaceSubject),
      });
      return NextResponse.json({ url: outUrl, style: safeStyle, format, ...quotaMeta });
    };

    stage = "resolve-format";
    const sizeW = 1024;
    const sizeH = format === "story" ? 1792 : format === "portrait" ? 1280 : 1024;
    const baseSize = Math.min(sizeW, sizeH);

    stage = "load";
    const [bgCanvas, placementReferenceBuf, maskInputBuf] = await Promise.all([
      sharp(await toBufferFromAnyImage(background))
        .resize(sizeW, sizeH, { fit: "cover" })
        .png()
        .toBuffer(),
      typeof placementReference === "string" && placementReference
        ? sharp(await toBufferFromAnyImage(placementReference))
            .resize(sizeW, sizeH, { fit: "cover" })
            .png()
            .toBuffer()
        : Promise.resolve<Buffer | null>(null),
      typeof placementMask === "string" && placementMask
        ? sharp(await toBufferFromAnyImage(placementMask))
            .resize(sizeW, sizeH, { fit: "cover" })
            .grayscale()
            .png()
            .toBuffer()
        : Promise.resolve<Buffer | null>(null),
    ]);

    stage = "load-subject";
    let subjBuf = await toBufferFromAnyImage(subject);
    const initialIsolation = await assessSubjectIsolation(subjBuf);
    const subjectHasTransparency = await hasMeaningfulTransparency(subjBuf);
    if (!subjectHasTransparency || !initialIsolation.usable) {
      try {
        stage = "subject:auto-remove-bg";
        subjBuf = await removeSubjectBackground(subjBuf);
      } catch {
        if (replaceSubject) {
          throw new Error(
            "Subject still includes its background. Upload a transparent PNG cutout or enable server-side background removal."
          );
        }
      }
    }

    stage = "normalize-subject";
    const hardenedSubjBuf = await (async (buf: Buffer) => {
      try {
        const normalized = await sharp(buf).ensureAlpha().png().toBuffer();
        const alpha = await sharp(normalized)
          .extractChannel("alpha")
          .linear(1.12, -10)
          .threshold(8)
          .blur(0.35)
          .png()
          .toBuffer();
        return await sharp(normalized).removeAlpha().joinChannel(alpha).png().toBuffer();
      } catch {
        return buf;
      }
    })(subjBuf);
    const safeSubjBuf = await (async (buf: Buffer) => {
      try {
        const normalized = await sharp(buf).ensureAlpha().png().toBuffer();
        const meta = await sharp(normalized).metadata();
        if (!meta.width || !meta.height) return buf;
        const subjectBounds = await detectOpaqueBounds(normalized, 8);
        const cropBase = subjectBounds || {
          left: 0,
          top: 0,
          width: meta.width,
          height: meta.height,
        };
        const zoom = normalizeCameraZoom(cameraZoom);
        const cropRatioByZoom: Record<CameraZoom, number> = {
          "full body": 1,
          "three-quarter": 0.88,
          "waist-up": 0.72,
          "chest-up": 0.52,
          auto: 0.88,
        };
        const cropRatio = cropRatioByZoom[zoom] ?? cropRatioByZoom.auto;
        const sidePad = Math.max(0, Math.round(cropBase.width * 0.04));
        const topPad = Math.max(0, Math.round(cropBase.height * 0.03));
        const bottomPad = zoom === "full body" ? Math.max(0, Math.round(cropBase.height * 0.04)) : 0;
        const extractLeft = clampInt(cropBase.left - sidePad, 0, meta.width - 1);
        const extractTop = clampInt(cropBase.top - topPad, 0, meta.height - 1);
        const extractWidth = clampInt(cropBase.width + sidePad * 2, 1, meta.width - extractLeft);
        const desiredHeight = cropBase.height * cropRatio + topPad + bottomPad;
        const extractHeight = clampInt(desiredHeight, 1, meta.height - extractTop);
        return await sharp(normalized)
          .extract({ left: extractLeft, top: extractTop, width: extractWidth, height: extractHeight })
          .png()
          .toBuffer();
      } catch {
        return buf;
      }
    })(hardenedSubjBuf);
    const sizeStr: EditSize = format === "square" ? "1024x1024" : "1024x1536";
    const reinterpretStyleHint =
      safeStyle === "tropical" || safeStyle === "outdoor_summer"
        ? "Keep the original environment recognizably similar with warm sunset or summer light, believable water reflections, and a polished travel-editorial look."
        : safeStyle === "jazz_bar"
        ? "Keep the original environment recognizably similar with warm practical lighting, intimate ambience, and premium editorial realism."
        : "Keep the original environment recognizably similar with coherent nightlife lighting, natural depth, and a polished photographed look.";
    const extraPromptText =
      typeof extraPrompt === "string" && extraPrompt.trim() ? ` ${extraPrompt.trim()}` : "";

    if (provider === "openai" && placementReferenceBuf && OPENAI_API_KEY) {
      try {
        stage = "reinterpret:openai";
        const subjectReferenceBuf = await buildSubjectIdentityReference(hardenedSubjBuf);
        const reinterpretPrompt = [
          "Reference map:",
          "Image 1 = subject identity reference.",
          "Image 2 = composition and placement guide.",
          "Image 3 = original background reference.",
          "Create one coherent, photorealistic image that looks like a real photo taken in camera.",
          "The person must remain recognizably the same as Image 1: same face, skin tone, hairstyle, body proportions, clothing, and overall likeness.",
          "Use Image 2 to match framing, pose anchor, placement, scale, and camera composition.",
          "Use Image 3 to preserve the original location's key elements, layout, horizon, major objects, palette, and lighting direction.",
          "Controlled reinterpretation is allowed: minor natural drift is acceptable, but do not turn this into a different person or a different location.",
          "Finish as a well-lit, naturally exposed, unified editorial photo rather than a pasted composite.",
          "No black box, no plain backdrop, no comp card, no isolated cutout, no poster layout, no text, and no extra people.",
          reinterpretStyleHint + extraPromptText,
        ].join(" ");
        const outUrl = await runOpenAIEdit({
          image: [subjectReferenceBuf, placementReferenceBuf, bgCanvas],
          prompt: reinterpretPrompt,
          size: sizeStr,
          inputFidelity: "high",
          quality: "high",
          background: "opaque",
        });
        return successResponse("openai_controlled_reinterpretation", outUrl);
      } catch (err) {
        console.error("magic-blend openai reinterpretation fallback", err);
      }
    }

    stage = "place-subject";
    const zoom = normalizeCameraZoom(cameraZoom);
    const placement = maskInputBuf
      ? await renderPlacedSubjectFromSource(safeSubjBuf, maskInputBuf, sizeW, sizeH)
      : await (async () => {
          const trimmed = await trimSubjectToAlpha(safeSubjBuf);
          const zoomScaleMap: Record<CameraZoom, number> = {
            "full body": format === "story" ? 0.66 : format === "portrait" ? 0.7 : 0.72,
            "three-quarter": format === "story" ? 0.82 : format === "portrait" ? 0.86 : 0.88,
            "waist-up": format === "story" ? 1.08 : format === "portrait" ? 1.14 : 1.18,
            "chest-up": format === "story" ? 1.26 : format === "portrait" ? 1.34 : 1.4,
            auto: safeStyle === "club" ? 0.98 : 0.92,
          };
          const subjectScale = Math.max(0.58, Math.min(1.45, zoomScaleMap[zoom] ?? zoomScaleMap.auto));
          const slotSize = Math.min(Math.round(baseSize * subjectScale), sizeW, sizeH);
          const yLiftMap: Record<CameraZoom, number> = {
            "full body": -0.02,
            "three-quarter": 0.02,
            "waist-up": 0.08,
            "chest-up": 0.14,
            auto: safeStyle === "tropical" ? 0.01 : 0.05,
          };
          const yLift = Math.round(baseSize * (yLiftMap[zoom] ?? yLiftMap.auto));
          const resizedSubjectBuf = await sharp(trimmed.subjectBuf)
            .resize(slotSize, slotSize, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer();
          const resizedMaskBuf = await sharp(trimmed.maskBuf)
            .resize(slotSize, slotSize, {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer();
          const left = Math.max(0, Math.round((sizeW - slotSize) / 2));
          const top = Math.max(0, Math.round((sizeH - slotSize) / 2) - yLift);
          const placedSubjectBuf = await sharp({
            create: {
              width: sizeW,
              height: sizeH,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
          })
            .composite([{ input: resizedSubjectBuf, left, top }])
            .png()
            .toBuffer();
          const placedMaskBuf = await sharp({
            create: {
              width: sizeW,
              height: sizeH,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 1 },
            },
          })
            .composite([{ input: resizedMaskBuf, left, top }])
            .flatten({ background: { r: 0, g: 0, b: 0 } })
            .grayscale()
            .png()
            .toBuffer();
          return { placedSubjectBuf, placedMaskBuf };
        })();

    stage = "scene-analysis";
    const placedSubjectBuf = placement.placedSubjectBuf;
    const placedMaskBuf = placement.placedMaskBuf;
    const { ringMask, shadowMask, innerSpillMask } = await buildIntegrationMasks(placedMaskBuf);
    const { lightSide, highlightColor, sideContrast } = await detectSceneLighting(bgCanvas, placedMaskBuf);
    const { subjectHighlightMask, subjectShadowMask } = await buildDirectionalSubjectMasks(
      placedMaskBuf,
      lightSide
    );
    const sceneLuminance = await computeSceneLuminance(bgCanvas);
    const subjectLuminance = await computeMaskedLuminance(placedSubjectBuf, placedMaskBuf);
    const highlightLuminance = luminanceOfColor(highlightColor);
    const sceneIsDark = sceneLuminance < 88;
    const shadowOpacity = sceneIsDark ? 0.34 : sceneLuminance < 138 ? 0.24 : 0.16;
    const ringDarkOpacity = sceneIsDark ? 0.18 : sceneLuminance < 138 ? 0.12 : 0.08;
    const wrapOpacity = sceneIsDark ? 0.18 : sceneLuminance < 138 ? 0.14 : 0.11;
    const spillOpacity = sceneIsDark ? 0.12 : sceneLuminance < 138 ? 0.1 : 0.08;
    const subjectHighlightOpacity =
      sideContrast > 26
        ? sceneIsDark
          ? 0.48
          : sceneLuminance < 138
          ? 0.42
          : 0.34
        : sceneIsDark
        ? 0.4
        : sceneLuminance < 138
        ? 0.34
        : 0.28;
    const subjectShadowOpacity =
      sideContrast > 26
        ? sceneIsDark
          ? 0.26
          : sceneLuminance < 138
          ? 0.22
          : 0.18
        : sceneIsDark
        ? 0.22
        : sceneLuminance < 138
        ? 0.18
        : 0.14;
    const subjectHighlightOverlayOpacity = sideContrast > 26 ? 0.22 : 0.16;
    const highlightDelta = highlightLuminance - subjectLuminance;
    const subjectBrightness = Math.max(
      0.92,
      Math.min(1.42, 1 + (highlightDelta / 255) * (sideContrast > 26 ? 0.7 : 0.46))
    );
    const subjectSaturation = sceneIsDark ? 1.04 : sceneLuminance < 138 ? 1.08 : 1.12;

    stage = "scene-overlays";
    const backgroundWrapSource = await sharp(bgCanvas).blur(14).png().toBuffer();
    const backgroundSpillSource = await sharp(bgCanvas).blur(22).png().toBuffer();
    const litSubjectBase = await sharp(placedSubjectBuf)
      .modulate({
        brightness: subjectBrightness,
        saturation: subjectSaturation,
      })
      .png()
      .toBuffer();
    const edgeWrapOverlay = await buildAlphaOverlay(backgroundWrapSource, ringMask, wrapOpacity);
    const subjectSpillOverlay = await buildAlphaOverlay(backgroundSpillSource, innerSpillMask, spillOpacity);
    const subjectHighlightOverlay = await buildColorOverlay(
      sizeW,
      sizeH,
      subjectHighlightMask,
      subjectHighlightOpacity,
      highlightColor
    );
    const subjectHighlightOverlayStrong = await buildColorOverlay(
      sizeW,
      sizeH,
      subjectHighlightMask,
      subjectHighlightOverlayOpacity,
      mixColor(highlightColor, { r: 255, g: 250, b: 244 }, 0.58)
    );
    const ringDarkOverlay = await buildBlackOverlay(sizeW, sizeH, ringMask, ringDarkOpacity);
    const shadowOverlay = await buildBlackOverlay(sizeW, sizeH, shadowMask, shadowOpacity);
    const subjectShadowOverlay = await buildBlackOverlay(
      sizeW,
      sizeH,
      subjectShadowMask,
      subjectShadowOpacity
    );
    const litSubjectBuf = await sharp(litSubjectBase)
      .composite([
        { input: subjectShadowOverlay, blend: "multiply" },
        { input: subjectSpillOverlay, blend: "soft-light" },
        { input: subjectHighlightOverlay, blend: "overlay" },
        { input: subjectHighlightOverlayStrong, blend: "screen" },
      ])
      .png()
      .toBuffer();

    stage = "compose";
    const output = await sharp(bgCanvas)
      .composite([
        { input: litSubjectBuf },
        { input: shadowOverlay, blend: "multiply" },
        { input: ringDarkOverlay, blend: "multiply" },
        { input: edgeWrapOverlay, blend: "screen" },
      ])
      .png()
      .toBuffer();
    const deterministicUrl = bufferToDataUrlPng(output);
    const harmonizationMask = await buildUnionMask([
      ringMask,
      innerSpillMask,
      shadowMask,
    ]);
    const localizedPatch = await buildLocalizedEditPatch(output, harmonizationMask);
    const styleHint =
      safeStyle === "tropical" || safeStyle === "outdoor_summer"
        ? "Preserve sunlit outdoor atmosphere, water realism, and natural warm spill."
        : safeStyle === "jazz_bar"
        ? "Preserve intimate low-light ambience, warm practical spill, and soft shadow rolloff."
        : "Preserve nightlife contrast, moody ambience, practical color spill, and scene depth.";
    const harmonizationPrompt = [
      "Edit only the masked local scene-integration region so the subject feels photographed inside the existing scene.",
      "Preserve the exact subject identity, face, hair, body proportions, clothing, pose, and framing.",
      "Preserve the exact background composition, objects, text, and layout outside the masked area and keep the full frame composition stable.",
      "Improve only local scene integration: edge continuity, grounding, contact shadow, environmental spill, haze interaction, reflected light, texture continuity around the silhouette, and believable local relighting tied to the scene.",
      "Do not redraw the person, do not swap the face, do not restyle clothing, do not move the subject, and do not change the background plate.",
      "Do not create a poster-card cutout, clean studio backdrop, halo, or pasted look.",
      "This is a local patch edit, not a full-image redesign.",
      styleHint,
    ].join(" ");

    const allowsAiHarmonization = provider === "openai" || provider === "replicate";
    const preferredProvider = provider === "replicate" ? "replicate" : "openai";
    const providerOrder = preferredProvider === "replicate"
      ? (["replicate", "openai"] as const)
      : (["openai", "replicate"] as const);

    if (allowsAiHarmonization && localizedPatch) {
      const localizedEdgeMask = await buildEdgeBandEditMask(localizedPatch.cropMask);
      for (const harmonizer of providerOrder) {
        if (harmonizer === "openai" && OPENAI_API_KEY) {
          try {
            stage = "harmonize:openai-mask";
            const outUrl = await runOpenAIEdit({
              image: localizedPatch.cropImage,
              mask: await buildOpenAiEditMask(localizedEdgeMask),
              prompt: harmonizationPrompt,
              size: localizedPatch.editSize,
            });
            const merged = await mergeLocalizedEditPatch(
              output,
              await toBufferFromAnyImage(outUrl),
              localizedPatch,
              localizedEdgeMask
            );
            return successResponse("openai_harmonize_patch", bufferToDataUrlPng(merged));
          } catch (err) {
            console.error("magic-blend openai harmonization fallback", err);
          }
        }

        if (harmonizer === "replicate" && AI_API_KEY) {
          try {
            stage = "harmonize:replicate-inpaint";
            const outUrl = await runReplicateInpaint({
              imageDataUrl: bufferToDataUrlPng(localizedPatch.cropImage),
              maskDataUrl: bufferToDataUrlPng(localizedEdgeMask),
              prompt: harmonizationPrompt,
            });
            const merged = await mergeLocalizedEditPatch(
              output,
              await toBufferFromAnyImage(outUrl),
              localizedPatch,
              localizedEdgeMask
            );
            return successResponse("replicate_harmonize_patch", bufferToDataUrlPng(merged));
          } catch (err) {
            console.error("magic-blend replicate harmonization fallback", err);
          }
        }
      }
    }

    return successResponse("deterministic_composite", deterministicUrl);
  } catch (err: any) {
    await trackAnalytics("magic_blend_failed", {
      stage,
      provider: activeProvider,
      message: err?.message || String(err),
    });
    if (reservedUserId && previousUsed != null) {
      try {
        const admin = supabaseAdmin();
        await refundReservedUnits(admin, reservedUserId, previousUsed, 2, usageBucket);
      } catch {}
    }
    const message = err?.message || String(err);
    console.error("❌ MAGIC BLEND ERROR:", { stage, provider: activeProvider, message, err });
    return NextResponse.json(
      {
        error: message,
        debug: {
          stage,
          provider: activeProvider,
          name: err?.name,
          stack: err?.stack,
        },
      },
      { status: 500 }
    );
  }
}
