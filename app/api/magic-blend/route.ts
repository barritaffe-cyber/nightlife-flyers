import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

// Replicate model endpoint
const FLUX_ENDPOINT =
  "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions";

const AI_API_KEY = process.env.REPLICATE_API_TOKEN;
const FAL_API_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL =
  process.env.STABILITY_API_URL ||
  "https://api.stability.ai/v2beta/stable-image/generate/sd3";
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

Core matching requirements (must match Image 2):
- light direction
- color temperature
- contrast level
- shadow softness

Blend requirements (critical):
- match the background lighting direction, color temperature, and contrast
- relight the entire subject using Image 2 as the lighting source (face, hair, skin, clothing, hands, legs, shoes)
- keep lighting physically consistent across the whole body (same key/fill/rim logic, falloff, and shadow softness)
- add realistic contact shadows at feet/base and soft ambient occlusion around edges
- add believable cast shadows from the subject onto nearby ground/surfaces when those shadows should exist
- add subtle edge color bleed and light wrap from the environment
- match lens and depth-of-field; soften cutout edges slightly
- preserve subject identity, face, hairstyle, clothing, and pose from Image 1
- do not change facial features or body proportions; keep the same facial likeness

Grounding:
- align subject scale and perspective to the background
- keep the subject on a believable ground plane (no floating)

Framing lock (critical):
- treat Image 1 as a hard placement map for the subject
- keep subject position, scale, and orientation matched to Image 1
- do not recenter, reframe, zoom out, or shift the subject to another area
- do not alter pose, limb placement, or body angle
- if any instruction conflicts, preserve Image 1 framing first

Background integrity:
- preserve the background scene from Image 2 (no new objects, no major layout changes)
- keep background people/subjects, but push them back in depth and contrast

Lighting interaction:
- only use light sources that already exist in Image 2
- if there are no beams, do not add beams
- atmosphere allowed when requested by the style; avoid heavy fog
- subject should block light beams and receive color spill from the scene
- subtle environmental color spill from surroundings onto skin and clothing
- match scene-specific highlight/shadow placement on every region of the subject, not just face/upper body
- no studio lighting, no beauty lighting, no flat fill
- if the scene is dark and moody, keep the subject darker and cinematic (no bright/exposed subject)
- edge light and rim light are allowed only where matching practical light sources exist in Image 2

Occlusion integrity (critical):
- subject body and clothing must remain fully opaque (no translucency through torso, arms, legs, or face)
- no table/floor/wall texture bleeding through the subject
- no double-exposure or ghosted overlay on the subject
- if foreground objects in Image 2 occlude the subject, occlusion edges must be clean and physically correct
- do not let floor/desk/booth lines pass through visible subject regions

Look:
- strong contrast with clean blacks/highlights
- natural skin tones influenced by scene lighting
- realistic exposure and dynamic range across face, skin, clothing, and hair
- no halos, no glow outlines, no sticker/cutout look
- no text, no logos, no watermarks, no extra people
- no face distortion, identity change, or altered facial features
- no overexposed skin, artificial glow, flat lighting, or studio lighting

Safety:
- fully clothed, family-friendly, non-suggestive attire`;

// -----------------------------
// STYLE SUFFIXES (APPEND ONLY)
// -----------------------------
type MagicBlendStyle = "club" | "tropical" | "jazz_bar" | "outdoor_summer";

const STYLE_SUFFIX: Record<MagicBlendStyle, string> = {
  club: `Club style bias:
- preserve the exact venue in Image 2; no environment replacement
- favor moody nightlife contrast and practical-light realism
- emphasize believable neon/practical spill only where those sources are present
- keep distant background slightly softer than subject for depth
- optional subtle haze only around existing fixtures and beams

Avoid:
- daylight look, flat studio fill, fake CGI glow
- inventing new lights, structures, or crowd subjects`,
  tropical: `Environment styling:
- preserve the exact venue in Image 2; no environment replacement
- warm evening nightlife tone with realistic practical spill and soft highlights
- subtle atmosphere only if already supported by the scene
- keep natural skin tones and physically plausible shadow falloff

Avoid:
- nightclub lasers or stage strobes
- heavy magenta club lighting or EDM concert beams`,
  jazz_bar: `Environment styling (intimate jazz bar):
- preserve the exact venue in Image 2; no environment replacement
- intimate low-key mood with practical amber spill where lamps/bars exist
- keep realistic shadow gradients and avoid over-bright skin lift
- maintain premium editorial texture, not glossy studio polish

Avoid:
- nightclub strobe lighting
- neon rave colors
- flat lighting`,
  outdoor_summer: `Environment styling:
- preserve the exact environment in Image 2; no environment replacement
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
    "Camera framing lock (strict): selected framing is a hard requirement. Keep the subject in the same placement anchor from Image 1. Do not recenter. Do not shift horizon. Do not change perspective.";
  const lensCritical =
    "Lens matching (critical): match scene lens perspective from Image 2. Wide room/deep perspective -> 24-35mm. Natural perspective -> 50mm. Cinematic compression -> 85mm+. Do not default to generic portrait compression.";

  if (z === "full body") {
    const lowAngleLine = lowAngleHint
      ? "- low angle full-body shot, slight upward perspective, 28mm lens"
      : "- camera at eye level, 35mm lens perspective consistent with background";
    return `${base}
- full-body framing: head-to-toe visible, feet visible, no cropped limbs
- realistic full body shot with natural stance on the ground plane
${lowAngleLine}
- preserve natural body proportions; no stretch
- keep headroom and foot room balanced
- feet must be grounded with realistic contact shadow under shoes
- correct scale relative to surrounding architecture and objects
- adjust perspective and scale to match the environment naturally
- ${lensCritical}`;
  }
  if (z === "three-quarter") {
    return `${base}
- three-quarter body shot: frame from mid-thigh to top of head
- natural perspective consistent with background depth and horizon
- camera at subject chest height, 50mm lens
- both hands should remain visible when present in Image 1
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
- keep subject size and crop matched to Image 1
- prioritize lens/perspective consistency with Image 2 over generic portrait look
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
  prompt: string;
  size: "1024x1024" | "1024x1792" | "1792x1024";
}) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in .env.local");
  }

  const form = new FormData();
  const blob = new Blob([new Uint8Array(opts.image)], { type: "image/png" });
  form.append("image", blob, "image.png");
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
  size: "1024x1024" | "1024x1792" | "1792x1024";
}) {
  if (!FAL_API_KEY) {
    throw new Error("Missing FAL_KEY / FAL_API_KEY in .env.local");
  }

  const image_size =
    opts.size === "1024x1792"
      ? { width: 1024, height: 1536 }
      : opts.size === "1792x1024"
      ? { width: 1536, height: 1024 }
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
    const {
      subject,
      background,
      style = "club",
      format = "square",
      provider = "replicate",
      extraPrompt = "",
      cameraZoom = "auto",
    } = body as {
      subject: string;
      background: string;
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

    stage = "resolve-style";
    const safeStyle: MagicBlendStyle =
      style === "tropical" || style === "jazz_bar" || style === "outdoor_summer"
        ? style
        : "club";

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

    // 2) Subject buffer
    stage = "load-subject";
    const subjBuf = await toBufferFromAnyImage(subject);

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
        const meta = await sharp(buf).metadata();
        if (!meta.width || !meta.height) return buf;
        const cropRatioByZoom: Record<CameraZoom, number> = {
          "full body": 1,
          "three-quarter": 0.82,
          "waist-up": 0.66,
          "chest-up": 0.52,
          auto: 0.78,
        };
        const cropRatio = cropRatioByZoom[zoom] ?? cropRatioByZoom.auto;
        const cropH = Math.max(1, Math.round(meta.height * cropRatio));
        return await sharp(buf)
          .extract({ left: 0, top: 0, width: meta.width, height: cropH })
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
    stage = "safe-crop";
    const safeSubjBuf = await safeCropSubject(hardenedSubjBuf);
    stage = "build-composite";
    const { composite: preCompositeBuf, matte: subjectMatteBuf } =
      await buildCompositeBundle(safeSubjBuf);

    // 4) Convert both images to data URLs (order matters)
    stage = "data-urls";
    const bgOnlyDataUrl = bufferToDataUrlPng(bgCanvas);
    const subjectMatteDataUrl = bufferToDataUrlPng(subjectMatteBuf);

    // --- Build prompt (BASE + SUFFIX + background lock) ---
    stage = "build-prompt";
    const backgroundLock =
      safeStyle === "club"
        ? `Background lock (guided):
- Image 1 is the subject placement and framing reference.
- Image 2 is the background reference and should remain recognizable.
- Image 3 is the subject matte reference (white subject shape on black background).
- Preserve the background’s layout, architecture, and key features from Image 2.
- Do not replace the environment or move the scene.
- Subject relighting must be derived from Image 2 lighting only (direction, color, intensity, contrast).
- Subject framing must remain matched to Image 1 (same placement, scale, and pose).
- It is allowed to intensify existing lighting, haze, and neon accents to match subject energy.
- It is allowed to add atmospheric smoke around the subject for depth, even if subtle in Image 2.
- Keep the same time of day and lighting direction as Image 2.`
        : `Background lock (strict):
- Image 1 is the subject placement and framing reference.
- Image 2 is the background reference and MUST be preserved exactly.
- Image 3 is the subject matte reference (white subject shape on black background).
- Preserve the background’s layout, architecture, structure, and key features from Image 2.
- Do not replace the environment. Do not invent a new background. Do not move the scene.
- Subject relighting must be derived from Image 2 lighting only (direction, color, intensity, contrast).
- Subject framing must remain matched to Image 1 (same placement, scale, and pose).
- Keep the same time of day and lighting direction as Image 2.
- Do not change the weather or season.
- Only add subtle atmosphere and a few small accent lights; no scene overhaul.`;
    const sceneCueBlock = `Scene-derived lighting lock (strict, from Image 2):
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
- no light source invention and no global relight that conflicts with Image 2`;
    const occlusionLock = `Occlusion lock (strict):
- Treat Image 3 matte as solidity guidance: white area is subject body volume.
- Subject body/clothing must stay fully opaque; no translucency and no double-exposure.
- Do not let floor/table/booth/background textures pass through visible subject regions.
- If a foreground object from Image 2 occludes the subject, occlusion must be crisp and physically plausible.
- Maintain contact grounding at the feet/base with realistic contact shadow.`;
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

    const finalPrompt = `${BASE_PROMPT}

${sceneCueBlock}

${occlusionLock}

${cameraFramingBlock}

${STYLE_SUFFIX[safeStyle]}

${backgroundLock}${extraBlock}${nanoTone}`;

    // --- Single unified pass with TWO reference images (Imagine Art style) ---
    const sizeStr =
      format === "story" ? "1024x1792" : format === "portrait" ? "1024x1024" : "1024x1024";

    if (resolvedProvider === "fal") {
      stage = "fal:run";
      const safeCompositeDataUrl = bufferToDataUrlPng(preCompositeBuf);
      const outUrl = await runFalEdit({
        imageDataUrls: [safeCompositeDataUrl, bgOnlyDataUrl, subjectMatteDataUrl],
        prompt: finalPrompt,
        size: sizeStr,
      });
      return NextResponse.json({ url: outUrl, style: safeStyle, format });
    }

    if (resolvedProvider === "replicate") {
      stage = "replicate:prep";
      const safeSubjBuf = await safeCropSubject(hardenedSubjBuf);
      const { composite: safeCompositeBuf } = await buildCompositeBundle(safeSubjBuf);
      const safeCompositeDataUrl = bufferToDataUrlPng(safeCompositeBuf);
      try {
        stage = "replicate:run";
        const outUrl = await runFlux({
          imageDataUrls: [safeCompositeDataUrl, bgOnlyDataUrl, subjectMatteDataUrl],
          prompt: finalPrompt,
          token: AI_API_KEY as string,
          aspect_ratio,
          safety_tolerance: 2,
        });
        return NextResponse.json({ url: outUrl, style: safeStyle, format });
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
              image: preCompositeBuf,
              prompt: finalPrompt,
              size: sizeStr,
            });
            return NextResponse.json({ url: outUrl, style: safeStyle, format });
          } catch {
            try {
              stage = "replicate:fallback-stability";
              const outUrl = await runStabilityEdit({
                image: preCompositeBuf,
                prompt: finalPrompt,
                size: sizeStr,
              });
              return NextResponse.json({ url: outUrl, style: safeStyle, format });
            } catch {
              throw new Error(
                `Replicate credits exhausted and fallback providers failed. Original: ${msg}`
              );
            }
          }
        }

        if (!isSensitive) throw err;

        stage = "replicate:safe-retry";
        const softenedSubj = await sharp(safeSubjBuf)
          .modulate({ saturation: 0.85 })
          .blur(0.3)
          .png()
          .toBuffer();
        const { composite: safeCompositeBuf2 } = await buildCompositeBundle(softenedSubj);
        const safeCompositeDataUrl2 = bufferToDataUrlPng(safeCompositeBuf2);
        const safePrompt =
          `Preserve the exact subject identity from Image 1 (face, skin tone, hair, clothing). ` +
          `Do not change ethnicity, age, or gender. ` +
          `Preserve the background from Image 2 exactly. ` +
          `Keep subject framing matched to Image 1 (same placement, scale, and pose). ` +
          `Relight the subject using only Image 2 scene lighting for seamless integration. ` +
          `Subject must remain fully opaque; no table/floor texture bleed-through. ` +
          `Use scene cues: key ${sceneProfile.keyDirection}, temperature ${sceneProfile.temperature}, contrast ${sceneProfile.contrast}. ` +
          `Family-friendly, non-suggestive styling.`;
        stage = "replicate:safe-run";
        const outUrl = await runFlux({
          imageDataUrls: [safeCompositeDataUrl2, bgOnlyDataUrl, subjectMatteDataUrl],
          prompt: safePrompt,
          token: AI_API_KEY as string,
          aspect_ratio,
          safety_tolerance: 1,
        });
        return NextResponse.json({ url: outUrl, style: safeStyle, format });
      }
    }

    if (resolvedProvider === "openai") {
      stage = "openai:run";
      const outUrl = await runOpenAIEdit({
        image: preCompositeBuf,
        prompt: finalPrompt,
        size: sizeStr,
      });
      return NextResponse.json({ url: outUrl, style: safeStyle, format });
    }

    stage = "stability:run";
    const outUrl = await runStabilityEdit({
      image: preCompositeBuf,
      prompt: finalPrompt,
      size: sizeStr,
    });
    return NextResponse.json({ url: outUrl, style: safeStyle, format });
  } catch (err: any) {
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
