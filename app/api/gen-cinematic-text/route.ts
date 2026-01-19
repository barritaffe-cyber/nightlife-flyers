import { NextResponse } from "next/server";
import sharp from "sharp";

// Helper for normalization
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const dataUrlToBuffer = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid data URL");
  return Buffer.from(dataUrl.slice(commaIndex + 1), "base64");
};

const bufferToDataUrl = (buf: Buffer, mime: string) =>
  `data:${mime};base64,${buf.toString("base64")}`;

const compositeWrapTextureOverRender = async (baseDataUrl: string, renderUrl: string) => {
  const [baseRes, renderRes] = await Promise.all([fetch(baseDataUrl), fetch(renderUrl)]);
  if (!baseRes.ok || !renderRes.ok) throw new Error("Failed to fetch composite images");
  const [baseBuf, renderBuf] = await Promise.all([
    baseRes.arrayBuffer(),
    renderRes.arrayBuffer(),
  ]);

  const base = sharp(Buffer.from(baseBuf));
  const render = sharp(Buffer.from(renderBuf));
  const baseMeta = await base.metadata();
  const renderMeta = await render.metadata();
  const width = baseMeta.width || renderMeta.width;
  const height = baseMeta.height || renderMeta.height;
  if (!width || !height) throw new Error("Missing composite dimensions");

  const renderPng = await render
    .resize(width, height, { fit: "fill" })
    .png()
    .toBuffer();

  const composed = await base
    .resize(width, height, { fit: "fill" })
    .composite([
      { input: renderPng, blend: "screen" },
    ])
    .png()
    .toBuffer();

  return bufferToDataUrl(composed, "image/png");
};

// =========================================================
// ✅ Replicate runner (create + poll)
// =========================================================
async function runReplicate(
  apiKey: string,
  version: string,
  input: any,
  isRetry = false
) {
  const startRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Prefer: "wait",
    },
    body: JSON.stringify({ version, input }),
  });

  if (startRes.status === 429 && !isRetry) {
    console.log("⚠️ Rate limited (429). Retrying in 5s...");
    await new Promise((r) => setTimeout(r, 5000));
    return runReplicate(apiKey, version, input, true);
  }

  const startText = await startRes.text();
  let startData: any = null;
  try {
    startData = startText ? JSON.parse(startText) : null;
  } catch {
    startData = { raw: startText };
  }

  if (!startRes.ok) {
    throw new Error(
      `Replicate Create Error (${startRes.status}): ${JSON.stringify(startData)}`
    );
  }

  const predictionId = startData?.id;
  if (!predictionId) throw new Error(`No prediction id: ${JSON.stringify(startData)}`);

  if (startData?.status === "succeeded") {
    const out = startData?.output;
    return Array.isArray(out) ? out[0] : out;
  }

  // Poll loop
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      }
    );

    const pollText = await pollRes.text();
    let pollData: any = null;
    try {
      pollData = pollText ? JSON.parse(pollText) : null;
    } catch {
      pollData = { raw: pollText };
    }

    if (!pollRes.ok) {
      throw new Error(
        `Replicate Poll Error (${pollRes.status}): ${JSON.stringify(pollData)}`
      );
    }

    if (pollData?.status === "succeeded") {
      const out = pollData?.output;
      return Array.isArray(out) ? out[0] : out;
    }

    if (pollData?.status === "failed" || pollData?.status === "canceled") {
      throw new Error(
        `Replicate Prediction failed: ${JSON.stringify({
          predictionId,
          err: pollData?.error ?? null,
          logs: pollData?.logs ?? null,
        })}`
      );
    }
  }

  throw new Error(`Timeout waiting for prediction: ${predictionId}`);
}

// =========================================================
// ✅ LOCKED MATERIAL SET (ONLY 3 FOR NOW)
// =========================================================
type MaterialKey = "gold" | "silver" | "chrome";
const ALLOWED_MATERIALS: MaterialKey[] = ["gold", "silver", "chrome"];

function normalizeMaterial(x: any): MaterialKey {
  const v = String(x ?? "gold").toLowerCase();
  return (ALLOWED_MATERIALS as string[]).includes(v) ? (v as MaterialKey) : "gold";
}

// =========================================================
// ✅ NEUTRALIZED MATERIAL PROMPTS (ONLY 3)
// =========================================================
const MATERIAL_PROMPTS: Record<MaterialKey, string> = {
  gold: [
    "rich warm gold metal",
    "deep amber highlights",
    "warm specular reflections",
    "3d beveled metal text",
    "high clarity reflections",
    "sharp chamfered edges",
    "clean geometric bevels",
    "avoid pale silver tone",
  ].join(", "),

  silver: [
    "cool silver metal",
    "brushed satin finish",
    "soft clean reflections",
    "fine micro-scratches",
    "subtle texture breakup",
    "3d metal text",
    "high albedo",
    "clean chamfers",
    "machined aesthetic",
  ].join(", "),

  chrome: [
    "mirror polished chrome",
    "cool neutral tone",
    "subtle smudges and micro-scratches",
    "extreme reflectivity",
    "crisp studio reflections",
    "hard rectangular light panels",
    "high contrast mirror reflections",
    "3d beveled metal text",
    "hard edge highlights",
    "deep contrast",
    "liquid metal aesthetic",
  ].join(", "),
};

// =========================================================
// ✅ PER-MATERIAL PROMPT STRENGTH (ONLY 3) — SOURCE OF TRUTH
// =========================================================
const STRENGTH_BY_MATERIAL: Record<MaterialKey, { withCanny: number; noCanny: number }> = {
  gold:   { withCanny: 0.26, noCanny: 0.60 },
  silver: { withCanny: 0.22, noCanny: 0.52 },
  chrome: { withCanny: 0.30, noCanny: 0.56 },
};

// =========================================================
// ✅ POST HANDLER
// =========================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1) EXTRACT PARAMETERS
  const {
      base,
      texture,
      control_edge,
      edge,
      material = "gold",
      lighting = 60,    // 0..100
      reflections = 60, // 0..100
      warmth = 0,       // -1..1
      wrap_preset = "none",
    } = body ?? {};

    const apiKey = process.env.NANO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing NANO_API_KEY" }, { status: 500 });
    }

    // 2) INPUT VALIDATION (data:image/...)
    const baseDataUrl =
      typeof base === "string" && base.startsWith("data:image/")
        ? base
        : typeof texture === "string" && texture.startsWith("data:image/")
        ? texture
        : null;

    if (!baseDataUrl) {
      return NextResponse.json(
        {
          error: "Missing/invalid base (data:image/...)",
          fix: "Client must send { base: dataUrl } (or legacy { texture: dataUrl })",
        },
        { status: 400 }
      );
    }

    const edgeDataUrl =
      typeof control_edge === "string" && control_edge.startsWith("data:image/")
        ? control_edge
        : typeof edge === "string" && edge.startsWith("data:image/")
        ? edge
        : null;

    // 3) NORMALIZE SLIDERS
    const L = clamp(Number(lighting) || 60, 0, 100) / 100;    // 0..1
    const R = clamp(Number(reflections) || 60, 0, 100) / 100; // 0..1
    const W = clamp(Number(warmth) || 0, -1, 1);              // -1..1

    const warmthTag =
      W > 0.15
        ? "warm highlights, amber reflections, slightly warmer white balance"
        : W < -0.15
        ? "cool highlights, bluish reflections, slightly cooler white balance"
        : "neutral studio lighting, pure white balance";

    const FLUX_CANNY_VERSION =
      process.env.FLUX_CANNY_VERSION ||
      "4592f58955b1b0afad4ed66600b63d76a808abae2d0f7dfb2ba175f442ace739";

    const FLUX_DEV_VERSION =
      process.env.FLUX_DEV_VERSION ||
      "93d72f81bd019dde2bfcba9585a6f74e600b13a43a96eb01a42da54f5ab4df6a";

    // ✅ HARD-LOCK: only gold/silver/chrome (unknown -> gold)
    const matKey = normalizeMaterial(material);
    const mat = MATERIAL_PROMPTS[matKey];

    const WRAP_PROMPTS: Record<string, string> = {
      none: "",
      zebra: "wrapped in zebra stripe pattern, pure black and white stripes, high-contrast stripes, preserve base texture",
      tiger: "wrapped in tiger stripe pattern, organic stripes, preserve base texture",
      carbon_fiber: "wrapped in carbon fiber weave, subtle diagonal twill, preserve base texture",
      snakeskin: "wrapped in snakeskin texture, fine scale pattern, preserve base texture",
      geometric: "wrapped in geometric weave pattern, repeating tessellation, preserve base texture",
    };
    const wrapKey = String(wrap_preset || "none");
    const wrapPrompt = WRAP_PROMPTS[wrapKey] || "";
    const isWrapped = wrapKey !== "none";

    const materialPrompt = isWrapped
      ? "non-metallic wrapped finish, no metal, no chrome, no gold, no silver, no metallic sheen"
      : mat;

    const LIGHTING_VARIANTS = [
      "hard top light with sharp shadows",
      "softbox overhead with wide highlights",
      "double rim lights with strong edge glow",
      "side key light with aggressive falloff",
      "moody low-key lighting, deep shadows",
      "high-key studio lighting, even exposure",
      "tight spotlight beam, hard speculars",
      "diffuse ambient light with soft rolloff",
    ];
    const REFLECTION_VARIANTS = [
      "wild reflections",
      "chaotic highlight breakup",
      "complex light reflections",
      "irregular specular flicker",
      "dramatic reflection streaks",
      "unexpected reflection patterning",
    ];
    const lightingFlavor =
      LIGHTING_VARIANTS[Math.floor(Math.random() * LIGHTING_VARIANTS.length)];
    const reflectionFlavor =
      REFLECTION_VARIANTS[Math.floor(Math.random() * REFLECTION_VARIANTS.length)];

    const rand = () => Math.random() * 2 - 1; // -1..1
    const Lr = clamp(L + rand() * 0.6, 0, 1);
    const Rr = clamp(R + rand() * 0.7, 0, 1);

    const texturePreserveTag = isWrapped
      ? "preserve provided texture map, keep pattern sharp, no smoothing, no blur, no washout"
      : "preserve input reflection map, keep reflection patterns and light streaks from input texture";

    const useCanny = !!edgeDataUrl;
    let shapeUrl = baseDataUrl;

    // Flags (single place)
    const isChrome = matKey === "chrome";
    const isSilver = matKey === "silver";
    // gold is default else

    // =========================================================
    // PASS 1: STRUCTURE LOCK (Canny)
    // =========================================================
    const cannyPrompt = [
      "studio product render",
      "3d text",
      materialPrompt,
      wrapPrompt,
      texturePreserveTag,
      isWrapped ? "use provided texture map as albedo, preserve pattern, no relighting" : "",
      isWrapped ? "flat wrapped surface, no metallic sheen, no specular" : "strong specular highlights",
      isWrapped ? "" : "clean bevel shading",
      isWrapped ? "" : "high contrast reflections",
      "do not change the silhouette",
      "solid black background (#000000)",
      "no gradients in background",
    ].filter(Boolean).join(", ");

    if (useCanny) {
      shapeUrl = await runReplicate(apiKey, FLUX_CANNY_VERSION, {
        prompt: cannyPrompt,
        image: baseDataUrl,
        control_image: edgeDataUrl,

        // guidance: keep lower for wraps so texture stays intact
        guidance: isWrapped
          ? clamp(4.5 + rand() * 0.8, 3.5, 6)
          : clamp((isChrome ? 7.5 : 9.5) + (Lr * 1.5) + rand() * 1.2, 4, 10),

        num_inference_steps: isWrapped
          ? clamp(Math.round(14 + rand() * 4), 10, 20)
          : clamp(Math.round(24 + (Rr * 8) + rand() * 6), 18, 40),
        output_format: "png",
        output_quality: 95,
        megapixels: "1",
        disable_safety_checker: true,
        seed: Math.floor(Math.random() * 9999999),
      });
    }

    // =========================================================
    // PASS 2: POLISH & LIGHTING (Flux Dev)
    // =========================================================
    const polishPrompt = [
      "studio product render",
      "3d text",
      materialPrompt,
      wrapPrompt,
      texturePreserveTag,
      warmthTag,
      lightingFlavor,
      reflectionFlavor,
      isWrapped ? "preserve control-edge silhouette, no filled rectangle" : "",
      "crisp reflections",
      "rectangular softbox highlights",
      "sharper bevel shading",
      "higher contrast specular",
      "do not change the silhouette",
      "solid black background (#000000)",
      "no gradients in background",
    ].join(", ");

    const strengthPreset = STRENGTH_BY_MATERIAL[matKey];
    const baseStrength = useCanny ? strengthPreset.withCanny : strengthPreset.noCanny;

    // Slider-driven boost: lighting increases “burn-in”, reflections pushes detail slightly
    const strengthBoost = (0.14 * Lr) + (0.06 * Rr) + (isWrapped ? 0.12 : 0);
    const prompt_strength = clamp(baseStrength + strengthBoost + rand() * 0.2, 0.2, 0.85);

    if (isWrapped && useCanny) {
      return NextResponse.json({
        url: baseDataUrl,
        intermediate: useCanny ? { canny: shapeUrl } : {},
        status: "succeeded_wrap_flat",
        material: matKey,
      });
    }

    const polishedUrl = await runReplicate(apiKey, FLUX_DEV_VERSION, {
      prompt: polishPrompt,
      image: shapeUrl,

      // L (Lighting): higher guidance pushes studio lighting stronger
      guidance: isWrapped
        ? clamp(4.5 + rand() * 0.8, 3.5, 6)
        : clamp(6 + (Lr * 2.5) + rand() * 1.5, 4, 10),

      // R (Reflections): higher steps resolve finer detail
      num_inference_steps: isWrapped
        ? clamp(Math.round(14 + rand() * 4), 10, 20)
        : clamp(Math.round(20 + (Rr * 20) + rand() * 6), 16, 50),

      prompt_strength,

      output_format: "png",
      output_quality: 95,
      disable_safety_checker: true,
      seed: Math.floor(Math.random() * 9999999),
    });

    return NextResponse.json({
      url: polishedUrl,
      intermediate: useCanny ? { canny: shapeUrl } : {},
      status: useCanny ? "succeeded_flux_canny_then_flux_dev" : "succeeded_flux_dev_only",
      material: matKey, // ✅ echo back the locked material
    });
  } catch (error: any) {
    console.error("🔥 API Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
