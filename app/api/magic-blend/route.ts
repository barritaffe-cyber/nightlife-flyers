import { NextResponse } from "next/server";
import sharp from "sharp";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { supabaseAuth } from "../../../lib/supabase/auth";
import { extractClientTrackingPayload, insertAnalyticsEventForUser } from "../../../lib/analytics/server";
import { refundReservedUnits, reserveGenerationUnits } from "../../../lib/accessQuota";

export const runtime = "nodejs";

// Replicate model endpoint
const FLUX_ENDPOINT =
  "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions";
const REPLICATE_INPAINT_ENDPOINT =
  process.env.REPLICATE_INPAINT_ENDPOINT ||
  "https://api.replicate.com/v1/models/black-forest-labs/flux-fill/predictions";
const REPLICATE_INPAINT_VERSION = process.env.REPLICATE_INPAINT_VERSION;
const REPLICATE_FILES_ENDPOINT = "https://api.replicate.com/v1/files";

const AI_API_KEY = process.env.REPLICATE_API_TOKEN;
const FAL_API_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL =
  process.env.STABILITY_API_URL ||
  "https://api.stability.ai/v2beta/stable-image/generate/sd3";
const REMOVE_BG_API_URL =
  (process.env.REMOVE_BG_API_URL || "https://api.remove.bg/v1.0/removebg").trim();
const FAL_FLUX2_EDIT_ENDPOINT =
  process.env.FAL_FLUX2_EDIT_ENDPOINT || "https://fal.run/fal-ai/flux-2-pro/edit";
const FAL_ENABLE_SAFETY_CHECKER =
  String(process.env.FAL_ENABLE_SAFETY_CHECKER || "false").toLowerCase() === "true";
const FAL_SAFETY_TOLERANCE = Math.max(
  1,
  Math.min(6, Number.parseInt(String(process.env.FAL_SAFETY_TOLERANCE || "5"), 10) || 5)
);

// -----------------------------
// MASTER INTERNAL PROMPT (BASE)
// -----------------------------
const BASE_PROMPT = `Cinematic photo composite. Integrate the subject into the background environment so it looks shot in-camera.

Core matching requirements (must match the Background Reference):
- light direction
- color temperature
- contrast level
- shadow softness

Blend requirements (critical):
- match the background lighting direction, color temperature, and contrast
- relight the entire subject using the Background Reference lighting source (face, hair, skin, clothing, hands, legs, shoes)
- keep lighting physically consistent across the whole body (same key/fill/rim logic, falloff, and shadow softness)
- add realistic contact shadows at feet/base and soft ambient occlusion around edges
- add believable cast shadows from the subject onto nearby ground/surfaces when those shadows should exist
- add subtle edge color bleed and light wrap from the environment
- match lens and depth-of-field; soften cutout edges slightly
- preserve subject identity, face, hairstyle, clothing, and pose from the Subject Identity and Placement references
- do not change facial features or body proportions; keep the same facial likeness
- preserve exact face geometry (jawline, cheekbone width, nose shape, eye spacing, lip shape, ear placement)
- preserve exact body geometry (shoulder width, torso length, waist-hip ratio, limb lengths, hand size)
- no body reshaping, no slimming/bulking, no limb stretching, no head-size changes

Grounding:
- align subject scale and perspective to the background
- keep the subject on a believable ground plane (no floating)

Framing lock (critical):
- treat the Placement Reference as a hard placement map for the subject
- keep subject position, scale, and orientation matched to the Placement Reference
- do not recenter, reframe, zoom out, or shift the subject to another area
- do not alter pose, limb placement, or body angle
- if any instruction conflicts, preserve the Placement Reference framing first

Background integrity:
- preserve the background scene from the Background Reference (no new objects, no major layout changes)
- keep background people/subjects, but push them back in depth and contrast

Lighting interaction:
- only use light sources that already exist in the Background Reference
- if there are no beams, do not add beams
- atmosphere allowed when requested by the style; avoid heavy fog
- subject should block light beams and receive color spill from the scene
- subtle environmental color spill from surroundings onto skin and clothing
- match scene-specific highlight/shadow placement on every region of the subject, not just face/upper body
- no studio lighting, no beauty lighting, no flat fill
- if the scene is dark and moody, keep the subject darker and cinematic (no bright/exposed subject)
- edge light and rim light are allowed only where matching practical light sources exist in the Background Reference

Occlusion integrity (critical):
- subject body and clothing must remain fully opaque (no translucency through torso, arms, legs, or face)
- no table/floor/wall texture bleeding through the subject
- no double-exposure or ghosted overlay on the subject
- if foreground objects in the Background Reference occlude the subject, occlusion edges must be clean and physically correct
- do not let floor/desk/booth lines pass through visible subject regions

Look:
- strong contrast with clean blacks/highlights
- natural skin tones influenced by scene lighting
- realistic exposure and dynamic range across face, skin, clothing, and hair
- no halos, no glow outlines, no sticker/cutout look
- no text, no logos, no watermarks, no extra people
- no face distortion, identity change, or altered facial features
- no anatomy drift, no altered body ratios, no stylized proportions
- no overexposed skin, artificial glow, flat lighting, or studio lighting

Safety:
- fully clothed, family-friendly, non-suggestive attire`;

// -----------------------------
// STYLE SUFFIXES (APPEND ONLY)
// -----------------------------
type MagicBlendStyle = "club" | "tropical" | "jazz_bar" | "outdoor_summer";

const STYLE_SUFFIX: Record<MagicBlendStyle, string> = {
  club: `Club style bias:
- preserve the exact venue from the Background Reference; no environment replacement
- favor moody nightlife contrast and practical-light realism
- emphasize believable neon/practical spill only where those sources are present
- keep distant background slightly softer than subject for depth
- optional subtle haze only around existing fixtures and beams

Avoid:
- daylight look, flat studio fill, fake CGI glow
- inventing new lights, structures, or crowd subjects`,
  tropical: `Environment styling:
- preserve the exact venue from the Background Reference; no environment replacement
- warm evening nightlife tone with realistic practical spill and soft highlights
- subtle atmosphere only if already supported by the scene
- keep natural skin tones and physically plausible shadow falloff

Avoid:
- nightclub lasers or stage strobes
- heavy magenta club lighting or EDM concert beams`,
  jazz_bar: `Environment styling (intimate jazz bar):
- preserve the exact venue from the Background Reference; no environment replacement
- intimate low-key mood with practical amber spill where lamps/bars exist
- keep realistic shadow gradients and avoid over-bright skin lift
- maintain premium editorial texture, not glossy studio polish

Avoid:
- nightclub strobe lighting
- neon rave colors
- flat lighting`,
  outdoor_summer: `Environment styling:
- preserve the exact environment from the Background Reference; no environment replacement
- bright natural outdoor light behavior with realistic sun direction and cast shadows
- breathable summer atmosphere with controlled saturation and skin realism
- maintain scene depth and horizon/perspective consistency

Avoid:
- nightclub lasers, concert strobes, or heavy club lighting
- dark indoor jazz bar interiors`,

};

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

async function buildIdentityReferenceBoard(subjectBuf: Buffer) {
  const normalized = await sharp(subjectBuf)
    .ensureAlpha()
    .resize(1536, 1536, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const meta = await sharp(normalized).metadata();
  const w = meta.width || 1536;
  const h = meta.height || 1536;
  const bounds = await detectOpaqueBounds(normalized);

  if (!bounds) {
    return sharp(normalized)
      .resize(1024, 1024, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  }

  const padX = Math.max(8, Math.round(bounds.width * 0.08));
  const padY = Math.max(8, Math.round(bounds.height * 0.06));
  const bodyLeft = clampInt(bounds.left - padX, 0, w - 1);
  const bodyTop = clampInt(bounds.top - padY, 0, h - 1);
  const bodyWidth = clampInt(
    bounds.width + padX * 2,
    1,
    w - bodyLeft
  );
  const bodyHeight = clampInt(
    bounds.height + padY * 2,
    1,
    h - bodyTop
  );

  const facePadX = Math.max(8, Math.round(bounds.width * 0.06));
  const faceLeft = clampInt(bounds.left - facePadX, 0, w - 1);
  const faceTop = clampInt(bounds.top, 0, h - 1);
  const faceWidth = clampInt(
    bounds.width + facePadX * 2,
    1,
    w - faceLeft
  );
  const faceHeight = clampInt(Math.round(bounds.height * 0.58), 1, h - faceTop);

  const bodyTile = await sharp(normalized)
    .extract({
      left: bodyLeft,
      top: bodyTop,
      width: bodyWidth,
      height: bodyHeight,
    })
    .resize(576, 1024, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const faceTile = await sharp(normalized)
    .extract({
      left: faceLeft,
      top: faceTop,
      width: faceWidth,
      height: faceHeight,
    })
    .resize(448, 1024, {
      fit: "cover",
      position: "north",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: bodyTile, left: 0, top: 0 },
      { input: faceTile, left: 576, top: 0 },
    ])
    .png()
    .toBuffer();
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

async function pollForCompletion(url: string, token: string): Promise<string> {
  for (let i = 0; i < 180; i++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.status === "succeeded") {
      const out = data.output;
      return Array.isArray(out) ? out[0] : out;
    }
    if (data.status === "failed") {
      throw new Error(data.error || "AI generation failed during polling");
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("AI generation timed out");
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

async function runFlux(opts: {
  imageDataUrls: string[]; // ✅ multiple
  prompt: string;
  token: string;
  aspect_ratio: "1:1" | "9:16" | "4:5";
  safety_tolerance?: number;
}) {
  const response = await fetch(FLUX_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.token}`,
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        prompt: opts.prompt,
        input_images: opts.imageDataUrls, // ✅ IMPORTANT: pass both images
        resolution: "1 MP",
        aspect_ratio: opts.aspect_ratio,
        output_format: "png",
        output_quality: 95,
        safety_tolerance: opts.safety_tolerance ?? 2,
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(`AI Provider failed: ${raw}`);

  const result = JSON.parse(raw);

  if (result.status === "processing" || result.status === "starting") {
    if (!result?.urls?.get) throw new Error(`AI Provider failed: ${raw}`);
    return await pollForCompletion(result.urls.get, opts.token);
  }

  if (result.output) {
    return Array.isArray(result.output) ? result.output[0] : result.output;
  }

  throw new Error(`AI Provider failed: ${raw}`);
}

async function runOpenAIEdit(opts: {
  image: Buffer;
  mask?: Buffer;
  prompt: string;
  size: "1024x1024" | "1024x1792" | "1792x1024";
}) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in .env.local");
  }

  const form = new FormData();
  const blob = new Blob([new Uint8Array(opts.image)], { type: "image/png" });
  form.append("image", blob, "image.png");
  if (opts.mask) {
    const maskBlob = new Blob([new Uint8Array(opts.mask)], { type: "image/png" });
    form.append("mask", maskBlob, "mask.png");
  }
  form.append("model", "gpt-image-1");
  form.append("prompt", opts.prompt);
  form.append("size", opts.size);

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

async function runStabilityEdit(opts: {
  image: Buffer;
  prompt: string;
  size: "1024x1024" | "1024x1792" | "1792x1024";
}) {
  if (!STABILITY_API_KEY) {
    throw new Error("Missing STABILITY_API_KEY in .env.local");
  }

  const form = new FormData();
  const blob = new Blob([new Uint8Array(opts.image)], { type: "image/png" });
  form.append("mode", "image-to-image");
  form.append("image", blob, "image.png");
  form.append("prompt", opts.prompt);
  form.append("output_format", "png");
  const width = opts.size === "1024x1792" ? 1024 : opts.size === "1792x1024" ? 1792 : 1024;
  const height = opts.size === "1024x1792" ? 1792 : opts.size === "1792x1024" ? 1024 : 1024;
  form.append("width", String(width));
  form.append("height", String(height));
  // Keep denoise in the safer identity-preserving range for composites.
  form.append("strength", "0.42");

  const res = await fetch(STABILITY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: "application/json",
    },
    body: form,
  });

  const contentType = res.headers.get("content-type") || "";
  const rawText = await res.text();
  if (!res.ok) {
    let msg = `Stability HTTP ${res.status}`;
    try {
      if (contentType.includes("application/json")) {
        const j = JSON.parse(rawText);
        msg = j?.message || j?.error || msg;
      } else if (rawText) {
        msg = rawText;
      }
    } catch {}
    console.error("Stability error:", res.status, contentType, rawText);
    throw new Error(`${msg} | ${rawText || "no body"}`);
  }

  if (contentType.includes("application/json")) {
    const j = JSON.parse(rawText || "{}");
    const img = j?.image || j?.data?.[0]?.image;
    if (!img) throw new Error("No image in Stability response");
    return `data:image/png;base64,${img}`;
  }

  const buf = Buffer.from(rawText, "base64");
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function runFalEdit(opts: {
  imageDataUrls: string[];
  prompt: string;
  format: "square" | "story" | "portrait";
}) {
  if (!FAL_API_KEY) {
    throw new Error("Missing FAL_KEY / FAL_API_KEY in .env.local");
  }

  const image_size =
    opts.format === "story"
      ? { width: 1024, height: 1536 }
      : opts.format === "portrait"
      ? { width: 1024, height: 1280 }
      : { width: 1024, height: 1024 };

  const payload = {
    prompt: opts.prompt,
    image_urls: opts.imageDataUrls,
    image_size,
    output_format: "png",
    enable_safety_checker: FAL_ENABLE_SAFETY_CHECKER,
    safety_tolerance: FAL_SAFETY_TOLERANCE,
    sync_mode: true,
  };

  const res = await fetch(FAL_FLUX2_EDIT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let j: any = {};
  try {
    j = raw ? JSON.parse(raw) : {};
  } catch {
    j = {};
  }

  if (!res.ok) {
    const msg =
      j?.detail?.[0]?.msg ||
      j?.error?.message ||
      j?.error ||
      j?.message ||
      `FAL HTTP ${res.status}`;
    throw new Error(msg);
  }

  const out =
    j?.images?.[0]?.url ||
    j?.images?.[0]?.image?.url ||
    j?.images?.[0]?.image ||
    j?.image?.url ||
    j?.image;
  if (!out) throw new Error("No image in FAL response");
  if (typeof out === "string") {
    if (out.startsWith("data:image/")) return out;
    if (out.startsWith("http://") || out.startsWith("https://")) return out;
    return `data:image/png;base64,${out}`;
  }
  throw new Error("Unexpected FAL response format");
}

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
    stage = "check-keys";
    if (!OPENAI_API_KEY && !AI_API_KEY && !STABILITY_API_KEY && !FAL_API_KEY) {
      return NextResponse.json(
        { error: "Missing STABILITY_API_KEY / OPENAI_API_KEY / REPLICATE_API_TOKEN / FAL_KEY in .env.local" },
        { status: 500 }
      );
    }

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
      provider = "replicate",
      extraPrompt = "",
      cameraZoom = "auto",
    } = body as {
      subject: string;
      background: string;
      placementReference?: string;
      placementMask?: string;
      replaceSubject?: boolean;
      style?: MagicBlendStyle;
      format?: "square" | "story" | "portrait";
      provider?: "stability" | "openai" | "replicate" | "nano" | "fal";
      extraPrompt?: string;
      cameraZoom?: string;
    };
    const resolvedProvider =
      provider === "nano" ? "fal" : provider;
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
    const aspect_ratio: "1:1" | "9:16" | "4:5" =
      format === "story" ? "9:16" : format === "portrait" ? "4:5" : "1:1";

    // --- Precomposite subject onto background (conditioning image) ---
    const sizeW = format === "story" ? 1024 : format === "portrait" ? 1024 : 1024;
    const sizeH = format === "story" ? 1792 : format === "portrait" ? 1280 : 1024;
    const baseSize = Math.min(sizeW, sizeH);

    // 1) Background canvas (this is the "truth" reference)
    stage = "load-background";
    const bgBuf = await toBufferFromAnyImage(background);
    const bgCanvas = await sharp(bgBuf)
      .resize(sizeW, sizeH, { fit: "cover" })
      .png()
      .toBuffer();
    const sceneProfile = await analyzeSceneLighting(bgCanvas);
    const placementReferenceBuf =
      typeof placementReference === "string" && placementReference
        ? await sharp(await toBufferFromAnyImage(placementReference))
            .resize(sizeW, sizeH, { fit: "cover" })
            .png()
            .toBuffer()
        : null;
    const placementMaskBuf =
      typeof placementMask === "string" && placementMask
        ? await sharp(await toBufferFromAnyImage(placementMask))
            .resize(sizeW, sizeH, { fit: "cover" })
            .png()
            .toBuffer()
        : null;
    const useReplacementWorkflow = Boolean(replaceSubject && placementMaskBuf);

    // 2) Subject buffer
    stage = "load-subject";
    let subjBuf = await toBufferFromAnyImage(subject);
    if (useReplacementWorkflow) {
      stage = "subject:assess-cutout";
      const initialIsolation = await assessSubjectIsolation(subjBuf);
      if (!initialIsolation.usable) {
        stage = "subject:auto-remove-bg";
        subjBuf = await removeSubjectBackground(subjBuf);
      }
    }

    // Subject framing: bigger & slightly lifted (poster feel)
    // NOTE: if background adherence is still weak, drop this to 0.88–0.92
    const zoom = normalizeCameraZoom(cameraZoom);
    const zoomScaleMap: Record<string, number> = {
      "full body": format === "story" ? 0.66 : format === "portrait" ? 0.7 : 0.72,
      "three-quarter": format === "story" ? 0.82 : format === "portrait" ? 0.86 : 0.88,
      "waist-up": format === "story" ? 1.08 : format === "portrait" ? 1.14 : 1.18,
      "chest-up": format === "story" ? 1.26 : format === "portrait" ? 1.34 : 1.4,
      auto: safeStyle === "club" ? 0.98 : 0.92,
    };
    const subjectScale = Math.max(
      0.58,
      Math.min(1.45, zoomScaleMap[zoom] ?? zoomScaleMap.auto)
    );
    const subjSize = Math.min(
      Math.round(baseSize * subjectScale),
      sizeW,
      sizeH
    );
    const subjLeft = Math.max(0, Math.round((sizeW - subjSize) / 2));
    const yLiftMap: Record<CameraZoom, number> = {
      "full body": -0.02,
      "three-quarter": 0.02,
      "waist-up": 0.08,
      "chest-up": 0.14,
      auto: safeStyle === "tropical" ? 0.01 : 0.05,
    };
    const yLift = Math.round(baseSize * (yLiftMap[zoom] ?? yLiftMap.auto));
    const subjTop = Math.max(0, Math.round((sizeH - subjSize) / 2) - yLift);

    async function hardenSubjectAlpha(buf: Buffer) {
      try {
        const normalized = await sharp(buf).ensureAlpha().png().toBuffer();
        const alpha = await sharp(normalized)
          .extractChannel("alpha")
          .linear(1.12, -10)
          .threshold(8)
          .blur(0.35)
          .png()
          .toBuffer();
        return await sharp(normalized)
          .removeAlpha()
          .joinChannel(alpha)
          .png()
          .toBuffer();
      } catch {
        return buf;
      }
    }

    async function safeCropSubject(buf: Buffer) {
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
        const extractWidth = clampInt(
          cropBase.width + sidePad * 2,
          1,
          meta.width - extractLeft
        );
        const desiredHeight = cropBase.height * cropRatio + topPad + bottomPad;
        const extractHeight = clampInt(
          desiredHeight,
          1,
          meta.height - extractTop
        );
        return await sharp(normalized)
          .extract({
            left: extractLeft,
            top: extractTop,
            width: extractWidth,
            height: extractHeight,
          })
          .png()
          .toBuffer();
      } catch {
        return buf;
      }
    }

    async function buildCompositeBundle(subjInput: Buffer) {
      const subjPng = await sharp(subjInput)
        .resize(subjSize, subjSize, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      const composite = await sharp(bgCanvas)
        .composite([{ input: subjPng, left: subjLeft, top: subjTop }])
        .png()
        .toBuffer();

      // Build a hard matte reference: white subject on black background.
      const subjAlpha = await sharp(subjPng)
        .extractChannel("alpha")
        .threshold(10)
        .png()
        .toBuffer();
      const whiteRgb = await sharp({
        create: {
          width: subjSize,
          height: subjSize,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();
      const whiteSubject = await sharp(whiteRgb)
        .joinChannel(subjAlpha)
        .png()
        .toBuffer();
      const matte = await sharp({
        create: {
          width: sizeW,
          height: sizeH,
          channels: 3,
          background: { r: 0, g: 0, b: 0 },
        },
      })
        .composite([{ input: whiteSubject, left: subjLeft, top: subjTop }])
        .png()
        .toBuffer();

      return { composite, matte };
    }

    // 3) Composite subject onto the background for placement reference
    stage = "harden-alpha";
    const hardenedSubjBuf = await hardenSubjectAlpha(subjBuf);
    if (useReplacementWorkflow) {
      stage = "subject:verify-cutout";
      const subjectIsolation = await assessSubjectIsolation(hardenedSubjBuf);
      const subjectHasTransparency = await hasMeaningfulTransparency(hardenedSubjBuf);
      if (!subjectHasTransparency || !subjectIsolation.usable) {
        throw new Error(
          "Subject still includes its background. Upload a transparent PNG cutout or enable server-side background removal."
        );
      }
    }
    stage = "safe-crop";
    const safeSubjBuf = await safeCropSubject(hardenedSubjBuf);
    stage = "build-composite";
    const { composite: generatedCompositeBuf, matte: subjectMatteBuf } =
      await buildCompositeBundle(safeSubjBuf);
    const preCompositeBuf = placementReferenceBuf || generatedCompositeBuf;

    // 4) Convert all references to data URLs (order matters)
    stage = "data-urls";
    const bgOnlyDataUrl = bufferToDataUrlPng(bgCanvas);
    const subjectMatteDataUrl = bufferToDataUrlPng(
      placementMaskBuf || subjectMatteBuf
    );
    const subjectIdentityBuf = await buildIdentityReferenceBoard(hardenedSubjBuf);
    const subjectIdentityDataUrl = bufferToDataUrlPng(subjectIdentityBuf);
    const placementGuideDataUrl = placementReferenceBuf
      ? bufferToDataUrlPng(placementReferenceBuf)
      : bufferToDataUrlPng(generatedCompositeBuf);
    const replacementCompositeAssets =
      useReplacementWorkflow && placementMaskBuf
        ? await buildReplacementCompositeAssets({
            bgCanvas,
            subjectBuf: safeSubjBuf,
            placementMaskBuf,
            sceneProfile,
          })
        : null;

    // --- Build prompt (reference map + BASE + SUFFIX + background lock) ---
    stage = "build-prompt";
    const referenceMap = `Reference map (strict):
- Image 1 = Subject identity board (left panel = body proportions, right panel = face likeness lock)
- Image 2 = Subject placement reference (composite framing/pose/scale)
- Image 3 = Background reference (environment truth)
- Image 4 = Subject matte reference (solidity mask)`;
    const backgroundLock =
      safeStyle === "club"
        ? `Background lock (guided):
- Image 2 is the subject placement and framing reference.
- Image 3 is the background reference and should remain recognizable.
- Image 4 is the subject matte reference (white subject shape on black background).
- Preserve the background’s layout, architecture, and key features from Image 3.
- Do not replace the environment or move the scene.
- Preserve the original background aesthetic from Image 3: venue mood, color palette, haze, lighting character, and composition.
- Do not redesign the scene, add new decor, or change background styling.
- Subject relighting must be derived from Image 3 lighting only (direction, color, intensity, contrast).
- Subject framing must remain matched to Image 2 (same placement, scale, and pose).
- Keep the same time of day and lighting direction as Image 3.`
        : `Background lock (strict):
- Image 2 is the subject placement and framing reference.
- Image 3 is the background reference and MUST be preserved exactly.
- Image 4 is the subject matte reference (white subject shape on black background).
- Preserve the background’s layout, architecture, structure, and key features from Image 3.
- Do not replace the environment. Do not invent a new background. Do not move the scene.
- Preserve the original background aesthetic from Image 3: venue mood, color palette, haze, lighting character, and composition.
- Subject relighting must be derived from Image 3 lighting only (direction, color, intensity, contrast).
- Subject framing must remain matched to Image 2 (same placement, scale, and pose).
- Keep the same time of day and lighting direction as Image 3.
- Do not change the weather or season.
- Only add subtle atmosphere and a few small accent lights; no scene overhaul.`;
    const sceneCueBlock = `Scene-derived lighting lock (strict, from Image 3):
- key direction: ${sceneProfile.keyDirection}
- vertical brightness bias: ${sceneProfile.verticalBias}
- color temperature: ${sceneProfile.temperature}
- contrast level: ${sceneProfile.contrast}
- shadow softness: ${sceneProfile.shadowSoftness}
- scene brightness: ${sceneProfile.brightness}
- scene saturation: ${sceneProfile.saturation}
- highlight color cue: ${sceneProfile.highlightHex}
- shadow color cue: ${sceneProfile.shadowHex}

Rules:
- relight subject using this direction/contrast/temperature/shadow-softness profile
- keep highlight spill close to ${sceneProfile.highlightHex}; keep occluded regions near ${sceneProfile.shadowHex}
- preserve lighting asymmetry from Image 3; do not evenly light both sides of the face/body unless Image 3 is actually even
- do not add frontal beauty light, flat key light, or clean studio fill
- if Image 3 is dark, keep the subject dark and scene-embedded rather than brightened for clarity
- practical light color from the scene must visibly affect skin, clothing, hair, and legs, not just facial highlights
- preserve nightlife atmosphere: local haze glow, beam spill, and colored edge wrap should stay subtle but physically tied to the actual fixtures in Image 3
- no light source invention and no global relight that conflicts with Image 3`;
    const occlusionLock = `Occlusion lock (strict):
- Treat Image 4 matte as solidity guidance: white area is subject body volume.
- Subject body/clothing must stay fully opaque; no translucency and no double-exposure.
- Do not let floor/table/booth/background textures pass through visible subject regions.
- If a foreground object from Image 3 occludes the subject, occlusion must be crisp and physically plausible.
- Maintain contact grounding at the feet/base with realistic contact shadow.`;
    const identityLock = `Identity and proportion lock (strict):
- use Image 1 identity board to preserve exact face geometry and body ratios
- prioritize the right panel of Image 1 for facial likeness (eyes, nose, lips, jawline, skin texture)
- preserve skull/face structure exactly; do not alter nose/eyes/lips/jaw shape
- preserve shoulder width, torso length, limb lengths, and hand size proportions
- no beauty filter smoothing, no stylization, no body morphing`;
    const lowAngleHint = /low[\s-]?angle|upward perspective|camera from below/i.test(
      String(extraPrompt || "")
    );
    const cameraFramingBlock = getCameraFramingLock(cameraZoom, format, lowAngleHint);

    const extraBlock =
      typeof extraPrompt === "string" && extraPrompt.trim()
        ? `\n\nAdditional directives:\n${extraPrompt.trim()}`
        : "";
    const nanoTone =
      provider === "nano"
        ? `\n\nStyle tone:\n- nightlife editorial, moody, cinematic\n- avoid corporate/stock photo look\n- gritty texture, candid energy\n- no sterile studio feel`
        : "";
    const finalPrompt = `${referenceMap}

${BASE_PROMPT}

${sceneCueBlock}

${occlusionLock}

${identityLock}

${cameraFramingBlock}

${STYLE_SUFFIX[safeStyle]}

${backgroundLock}${extraBlock}${nanoTone}`;

    const replacementPrompt = `Reference map (strict):
- Image 1 = Clean background plate (environment truth)
- Image 2 = Neutral placement guide (subject slot, pose, framing, and scale only)
- Image 3 = Subject identity board (face and body likeness lock)
- Image 4 = Subject placement mask (the only region where the subject may appear)

Core objective:
- integrate the uploaded subject from Image 3 into the exact background from Image 1 so the result looks like one real photograph
- use Image 2 only as pose/framing/placement guidance, not as identity guidance
- use Image 4 as the only allowed subject region
- keep the exact placement, pose, crop, and scale indicated by Image 2 and Image 4
- keep the exact background aesthetic from Image 1: venue mood, palette, haze, lighting character, and composition
- the only human subject allowed in the final image is the uploaded subject from Image 3
- ${useReplacementWorkflow ? "the placeholder person implied by Image 2 must be fully replaced by the uploaded subject from Image 3" : "do not invent or preserve any additional person outside the uploaded subject"}

Hard rules:
- exactly one primary human subject in the final image
- that subject must be the uploaded subject from Image 3
- do not create a duplicate subject
- do not create a second person with the same face, hair, clothing, or silhouette
- no extra body, no second head, no double exposure, no reflection clone, no background duplicate of the subject
- do not render the subject on white, gray, solid-color, or seamless studio background
- do not produce a comp card, product cutout, poster plate, or isolated model render
- do not create an inset image, framed insert, vertical panel, or image-within-image composition
- do not generate any person outside the white region in Image 4
- preserve the background from Image 1 outside the subject integration area
- do not redesign, replace, restyle, relight, or rearrange the background scene
- do not add new decor, props, furniture, signage, smoke, lights, or people unless already present in Image 1
- only adjust local contact shadow and local light wrapping needed to seat the subject naturally into the scene
- preserve exact face geometry and body proportions from Image 3
- preserve exact background perspective and camera framing from Image 1
- keep the camera shot from Image 1 exactly: same lens feel, crop, horizon, and subject scale in frame
- match lighting from Image 1 exactly across the full body, not just the face
- subject luminance should sit naturally inside the scene; do not make the subject brighter, cleaner, or more polished than nearby people at the same depth
- keep lighting moody and venue-driven; no studio glamour pass, no cosmetic skin lift, no commercial beauty retouch
- no subject scaling drift, no pose drift, no new angle

${sceneCueBlock}

${identityLock}

${cameraFramingBlock}

${STYLE_SUFFIX[safeStyle]}${extraBlock}`;

    const harmonizationPrompt = `Harmonize the already placed subject into the scene so the image reads as one real photograph.

Input truth:
- the current image already contains the subject in the correct placement, scale, pose, and framing
- there is exactly one subject already present in the image
- preserve the current subject identity, silhouette, body proportions, pose, and exact placement
- preserve the current background composition and camera shot exactly

Allowed changes only:
- local lighting integration across the full body
- environmental color spill from the scene
- contact shadow and grounding at feet/base
- subtle edge blending, haze interaction, and depth consistency
- local shadow shaping needed to match the scene

Hard rules:
- do not move, resize, duplicate, or replace the subject
- do not generate a second version, close-up, crop, reflection, echo, or duplicate of the subject
- do not change the subject's face, hair, body proportions, clothing, or pose
- do not alter the background outside the masked harmonization region
- do not create extra people
- do not create an inset frame, white backdrop, comp card, or isolated model render
- do not brighten the subject beyond the scene lighting
- keep the subject embedded in the environment, not studio-lit

${sceneCueBlock}

${identityLock}

${cameraFramingBlock}

${STYLE_SUFFIX[safeStyle]}${extraBlock}`;

    // --- Single unified pass with multiple reference images ---
    const isReplacementMode = Boolean(replacementCompositeAssets);
    const sizeStr =
      format === "story" ? "1024x1792" : format === "portrait" ? "1024x1024" : "1024x1024";
    const standardReferenceImageDataUrls = [
      subjectIdentityDataUrl,
      placementGuideDataUrl,
      bgOnlyDataUrl,
      subjectMatteDataUrl,
    ];
    const replacementReferenceImageDataUrls = [
      bgOnlyDataUrl,
      placementGuideDataUrl,
      subjectIdentityDataUrl,
      subjectMatteDataUrl,
    ];
    const primaryImageDataUrls = isReplacementMode
      ? replacementReferenceImageDataUrls
      : standardReferenceImageDataUrls;
    const primaryPrompt = isReplacementMode ? replacementPrompt : finalPrompt;
    const stagedCompositeDataUrl = replacementCompositeAssets
      ? bufferToDataUrlPng(replacementCompositeAssets.composite)
      : null;
    const stagedMaskDataUrl = replacementCompositeAssets
      ? bufferToDataUrlPng(replacementCompositeAssets.localMask)
      : null;
    const stagedOpenAiMask = replacementCompositeAssets
      ? await buildOpenAiEditMask(replacementCompositeAssets.localMask)
      : null;
    const stagedEditInput = replacementCompositeAssets?.composite || preCompositeBuf;
    const stagedPrompt = isReplacementMode ? harmonizationPrompt : finalPrompt;

    if (isReplacementMode) {
      if (stagedCompositeDataUrl && stagedMaskDataUrl && AI_API_KEY) {
        try {
          stage = "replacement:replicate-inpaint";
          const outUrl = await runReplicateInpaint({
            imageDataUrl: stagedCompositeDataUrl,
            maskDataUrl: stagedMaskDataUrl,
            prompt: harmonizationPrompt,
          });
          return successResponse("replicate_inpaint", outUrl);
        } catch (err) {
          console.error("magic-blend replacement replicate masked fallback", err);
        }
      }

      if (replacementCompositeAssets && stagedOpenAiMask && OPENAI_API_KEY) {
        try {
          stage = "replacement:openai-mask";
          const outUrl = await runOpenAIEdit({
            image: replacementCompositeAssets.composite,
            mask: stagedOpenAiMask,
            prompt: harmonizationPrompt,
            size: sizeStr,
          });
          return successResponse("openai_mask", outUrl);
        } catch (err) {
          console.error("magic-blend replacement openai masked fallback", err);
        }
      }

      if (resolvedProvider === "fal") {
        try {
          stage = "fal:run";
          const outUrl = await runFalEdit({
            imageDataUrls: primaryImageDataUrls,
            prompt: primaryPrompt,
            format,
          });
          return successResponse("fal", outUrl);
        } catch (err) {
          console.error("magic-blend replacement fal freeform fallback", err);
        }
      }

      if (resolvedProvider === "replicate") {
        stage = "replicate:prep";
        try {
          stage = "replicate:run";
          const outUrl = await runFlux({
            imageDataUrls: primaryImageDataUrls,
            prompt: primaryPrompt,
            token: AI_API_KEY as string,
            aspect_ratio,
            safety_tolerance: 2,
          });
          return successResponse("replicate", outUrl);
        } catch (err) {
          console.error("magic-blend replacement replicate freeform fallback", err);
        }
      }

      throw new Error(
        "Replacement generation failed before any AI pass succeeded. Deterministic fallback is disabled because it ignores lighting and camera controls."
      );
    }

    if (resolvedProvider === "fal") {
      stage = "fal:run";
      const outUrl = await runFalEdit({
        imageDataUrls: primaryImageDataUrls,
        prompt: primaryPrompt,
        format,
      });
      return successResponse("fal", outUrl);
    }

    if (resolvedProvider === "replicate") {
      stage = "replicate:prep";
      try {
        stage = "replicate:run";
        const outUrl = await runFlux({
          imageDataUrls: primaryImageDataUrls,
          prompt: primaryPrompt,
          token: AI_API_KEY as string,
          aspect_ratio,
          safety_tolerance: 2,
        });
        return successResponse("replicate", outUrl);
      } catch (err: any) {
        const msg = String(err?.message || err || "");
        const msgLower = msg.toLowerCase();
        const isSensitive =
          msgLower.includes("sensitive") ||
          msgLower.includes("safety") ||
          msgLower.includes("nsfw");
        const isQuotaOrCredits =
          msgLower.includes("not enough tokens") ||
          msgLower.includes("insufficient") ||
          msgLower.includes("quota") ||
          msgLower.includes("credit") ||
          msgLower.includes("payment required");

        if (isQuotaOrCredits) {
          // Replicate credit/token exhaustion: gracefully fail over to available providers.
          try {
            stage = "replicate:fallback-openai";
            const outUrl = await runOpenAIEdit({
              image: stagedEditInput,
              prompt: stagedPrompt,
              size: sizeStr,
            });
            return successResponse("openai_fallback", outUrl);
          } catch {
            try {
              stage = "replicate:fallback-stability";
              const outUrl = await runStabilityEdit({
                image: stagedEditInput,
                prompt: stagedPrompt,
                size: sizeStr,
              });
              return successResponse("stability_fallback", outUrl);
            } catch {
              throw new Error(
                `Replicate credits exhausted and fallback providers failed. Original: ${msg}`
              );
            }
          }
        }

        if (!isSensitive) throw err;

        stage = "replicate:safe-retry";
        const safePrompt =
          `Preserve the exact subject identity from Image 3 (face, skin tone, hair, clothing). ` +
          `Preserve exact face geometry and body proportions from the uploaded subject reference. ` +
          `Do not change ethnicity, age, or gender. ` +
          `Preserve the background from Image 1 exactly. ` +
          `Keep subject framing matched to Image 2 (same placement, scale, and pose). ` +
          `Relight the subject using only Image 1 scene lighting for seamless integration. ` +
          `Subject must remain fully opaque; no table/floor texture bleed-through. ` +
          `Use scene cues: key ${sceneProfile.keyDirection}, temperature ${sceneProfile.temperature}, contrast ${sceneProfile.contrast}. ` +
          `Family-friendly, non-suggestive styling.`;
        stage = "replicate:safe-run";
        const outUrl = await runFlux({
          imageDataUrls: standardReferenceImageDataUrls,
          prompt: `${finalPrompt}\n\nAdditional safety emphasis:\n${safePrompt}`,
          token: AI_API_KEY as string,
          aspect_ratio,
          safety_tolerance: 1,
        });
        return successResponse("replicate_safe_retry", outUrl);
      }
    }

    if (resolvedProvider === "openai") {
      stage = "openai:run";
      const outUrl = await runOpenAIEdit({
        image: stagedEditInput,
        prompt: stagedPrompt,
        size: sizeStr,
      });
      return successResponse("openai", outUrl);
    }

    stage = "stability:run";
    const outUrl = await runStabilityEdit({
      image: stagedEditInput,
      prompt: stagedPrompt,
      size: sizeStr,
    });
    return successResponse("stability", outUrl);
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
