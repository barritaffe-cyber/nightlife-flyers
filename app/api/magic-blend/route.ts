import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

// Replicate model endpoint
const FLUX_ENDPOINT =
  "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions";

const AI_API_KEY = process.env.REPLICATE_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_URL =
  process.env.STABILITY_API_URL ||
  "https://api.stability.ai/v2beta/stable-image/generate/sd3";

// -----------------------------
// MASTER INTERNAL PROMPT (BASE)
// -----------------------------
const BASE_PROMPT = `Cinematic photo composite. Integrate the subject into the background environment so it looks shot in-camera.

Blend requirements (critical):
- match the background lighting direction, color temperature, and contrast
- add realistic contact shadows at feet/base and soft ambient occlusion around edges
- add subtle edge color bleed and light wrap from the environment
- match lens and depth-of-field; soften cutout edges slightly
- preserve subject identity, face, hairstyle, clothing, and pose from Image 1
- do not change facial features or body proportions; keep the same facial likeness

Grounding:
- align subject scale and perspective to the background
- keep the subject on a believable ground plane (no floating)

Background integrity:
- preserve the background scene from Image 2 (no new objects, no major layout changes)
- keep background people/subjects, but push them back in depth and contrast

Lighting interaction:
- only use light sources that already exist in Image 2
- if there are no beams, do not add beams
- atmosphere allowed when requested by the style; avoid heavy fog
- subject should block light beams and receive color spill from the scene
- no studio lighting, no beauty lighting, no flat fill
- if the scene is dark and moody, keep the subject darker and cinematic (no bright/exposed subject)
- add left and right edge key lights sampled from the scene’s colors to sculpt the subject

Look:
- strong contrast with clean blacks/highlights
- natural skin tones influenced by scene lighting
- no halos, no glow outlines, no sticker/cutout look
- no text, no logos, no watermarks, no extra people

Safety:
- fully clothed, family-friendly, non-suggestive attire`;

// -----------------------------
// STYLE SUFFIXES (APPEND ONLY)
// -----------------------------
type MagicBlendStyle = "club" | "tropical" | "jazz_bar" | "outdoor_summer";

const STYLE_SUFFIX: Record<MagicBlendStyle, string> = {
  club: `Environment styling:
- modern nightclub or concert venue
- cyan and magenta neon tube lighting with bright accents
- visible atmospheric haze so beams and light cones read clearly (medium+ density)
- 50mm lens, pronounced depth of field with background bokeh; subject stays sharp
- overhead blue/cyan key light (club spot) with warm side rim from practicals
- visible light cones in haze; moody contrast with bright highlights
- strong directional rim light from neon sources (clearly visible on hair/shoulders)
- stronger key/fill contrast with deep shadow pockets (avoid flat lighting)
- colored rim light and floor bounce should match background lights and feel energetic
- add subtle motion energy via light streaks and slight background motion blur (subject stays sharp)
- prioritize the subject with stronger local contrast and clarity
- make the background noticeably softer so the subject pops
- boost subject energy with brighter speculars and vivid neon color spill
- tighter framing / camera zoom toward the subject for premium focus
- rim light should visibly sculpt the subject’s silhouette and edges
- dynamic rim lighting wraps shoulders, hair, arms; rim lights interact with silhouette
- light atmospheric smoke interacts with the subject: smoke passes in front of and behind for depth
- light smoke around legs, very subtle around waist; smoke catches rim lights and glows with scene color
- light bloom on distant lights only (no bloom on the subject’s face)
- visual energy funnels toward the subject as the scene’s focal point
- architectural lighting, glossy surfaces, high-end atmosphere

Avoid:
- tropical elements (palms, beach, sunset, tiki decor)
- jazz bar cues (smoke-filled lounge, brass instruments, vintage bar ambience)
- outdoor daytime lighting or bright sun 
 - no extra people, no silhouettes, no background figures`,
  tropical: `Environment styling:
- tropical night venue or rooftop lounge
- warm ambient lighting with palms or outdoor elements
- golden and warm accent lights mixed with subtle color
- relaxed but vibrant atmosphere
- minimal atmosphere; no visible beams unless already present
- keep the background scene intact and unchanged
- warm lantern glow and string lights; cozy evening vibe
- shallow depth of field with soft bokeh on lights; subject stays sharp
- subject receives warm wrap light and soft rim from practicals
- contact shadow and gentle ground bounce to anchor the subject
- atmospheric smoke in front and behind the subject for depth
- light smoke around legs, very subtle around waist

Avoid:
- nightclub lasers or stage strobes
- heavy magenta club lighting or EDM concert beams
- jazz bar interior cues (dark lounge, leather booths, brass instruments)
- concert lighting rigs, beam arrays, or stage spotlights`,
  jazz_bar: `Environment styling (intimate jazz bar):
- warm amber practicals (bar pendants, lamps, candles) dominate the scene
- rich, moody bar interior with bottle backlighting and wood/brick textures
- soft bokeh on background bottles and lights; subject stays sharp
- cinematic, low-key lighting with deep shadows and glowing highlights
- cozy, intimate, premium atmosphere (luxury lounge, not chaotic)
- no outdoor rooftop cues or skyline

Lighting integration:
- warm key light from practicals; subtle warm rim on hair/shoulders
- subject must pick up amber color spill from nearby lights (skin and fabric)
- realistic contact shadow to ground the subject; avoid studio-flat lighting

Color & lighting modifiers:
- warm golds, ambers, candlelight orange
- subtle deep reds/browns in shadows
- soft bloom on distant lights only

Avoid:
- rooftop or skyline views
- nightclub strobe lighting
- neon rave colors
- overcrowded party
- flat lighting
- no text, no logos, no watermarks`,
  outdoor_summer: `Environment styling:
- vibrant daytime outdoor party by the water (lake, pool, or beachside deck)
- bright natural sunlight with warm golden highlights and clean shadows
- visible water spray/mist in the air catching sunlight for energy
- lively crowd energy with raised hands and candid movement
- sun-kissed skin tones, bright colorful summer outfits
- shallow depth of field; background crowd softened, subject sharp
- golden hour sunlight option: warm sun flare, lens flare orbs, and glowing foliage
- soft airy atmosphere with light bloom and warm amber tones

Color grading:
- warm highlights, rich natural skin tones
- vibrant but controlled saturation
- deep contrast without crushing shadows

Mood:
- carefree, energetic, celebratory
- daytime festival / pool party vibe

Style keywords:
- cinematic summer, daytime party, lifestyle promo
- lively crowd energy, premium outdoor event

Quality:
- crisp detail, modern editorial look, high-end
- no low-res, no artifacts, no warped faces

Avoid:
- nightclub lasers, concert strobes, or heavy club lighting
- dark indoor jazz bar interiors
- smoky haze typical of clubs (keep only light outdoor heat haze)`,

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
  form.append("strength", "0.6");

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

// -----------------------------
// route
// -----------------------------
export async function POST(req: Request) {
  let stage = "init";
  let activeProvider: "stability" | "openai" | "replicate" | undefined;
  try {
    stage = "check-keys";
    if (!OPENAI_API_KEY && !AI_API_KEY && !STABILITY_API_KEY) {
      return NextResponse.json(
        { error: "Missing STABILITY_API_KEY / OPENAI_API_KEY / REPLICATE_API_TOKEN in .env.local" },
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
    } = body as {
      subject: string;
      background: string;
      style?: MagicBlendStyle;
      format?: "square" | "story" | "portrait";
      provider?: "stability" | "openai" | "replicate";
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

    stage = "resolve-style";
    const safeStyle: MagicBlendStyle =
      style === "tropical" || style === "jazz_bar" || style === "outdoor_summer"
        ? style
        : "club";

    stage = "resolve-format";
    const aspect_ratio: "1:1" | "9:16" | "4:5" =
      format === "story" ? "9:16" : format === "portrait" ? "4:5" : "1:1";

    // --- Precomposite subject onto background (conditioning image) ---
    const sizeW = format === "story" ? 1024 : 1024;
    const sizeH = format === "story" ? 1792 : 1024;
    const baseSize = Math.min(sizeW, sizeH);

    // 1) Background canvas (this is the "truth" reference)
    stage = "load-background";
    const bgBuf = await toBufferFromAnyImage(background);
    const bgCanvas = await sharp(bgBuf)
      .resize(sizeW, sizeH, { fit: "cover" })
      .png()
      .toBuffer();

    // 2) Subject buffer
    stage = "load-subject";
    const subjBuf = await toBufferFromAnyImage(subject);

    // Subject framing: bigger & slightly lifted (poster feel)
    // NOTE: if background adherence is still weak, drop this to 0.88–0.92
    const subjectScale = safeStyle === "club" ? 1.08 : 0.96;
    const subjSize = Math.min(
      Math.round(baseSize * subjectScale),
      sizeW,
      sizeH
    );
    const subjLeft = Math.max(0, Math.round((sizeW - subjSize) / 2));
    const yLift = Math.round(baseSize * (safeStyle === "tropical" ? 0.02 : 0.06));
    const subjTop = Math.max(0, Math.round((sizeH - subjSize) / 2) - yLift);

    async function safeCropSubject(buf: Buffer) {
      try {
        const meta = await sharp(buf).metadata();
        if (!meta.width || !meta.height) return buf;
        const cropH = Math.max(1, Math.round(meta.height * 0.75));
        return await sharp(buf)
          .extract({ left: 0, top: 0, width: meta.width, height: cropH })
          .png()
          .toBuffer();
      } catch {
        return buf;
      }
    }

    async function buildComposite(subjInput: Buffer) {
      const subjPng = await sharp(subjInput)
        .resize(subjSize, subjSize, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      return await sharp(bgCanvas)
        .composite([{ input: subjPng, left: subjLeft, top: subjTop }])
        .png()
        .toBuffer();
    }

    // 3) Composite subject onto the background for placement reference
    stage = "safe-crop";
    const safeSubjBuf = await safeCropSubject(subjBuf);
    stage = "build-composite";
    const preCompositeBuf = await buildComposite(safeSubjBuf);

    // 4) Convert both images to data URLs (order matters)
    stage = "data-urls";
    const preCompositeDataUrl = bufferToDataUrlPng(preCompositeBuf);
    const bgOnlyDataUrl = bufferToDataUrlPng(bgCanvas);

    // --- Build prompt (BASE + SUFFIX + background lock) ---
    stage = "build-prompt";
    const backgroundLock =
      safeStyle === "club"
        ? `Background lock (guided):
- Image 1 is the subject placement and framing reference.
- Image 2 is the background reference and should remain recognizable.
- Preserve the background’s layout, architecture, and key features from Image 2.
- Do not replace the environment or move the scene.
- It is allowed to intensify existing lighting, haze, and neon accents to match subject energy.
- It is allowed to add atmospheric smoke around the subject for depth, even if subtle in Image 2.
- Keep the same time of day and lighting direction as Image 2.`
        : `Background lock (strict):
- Image 1 is the subject placement and framing reference.
- Image 2 is the background reference and MUST be preserved exactly.
- Preserve the background’s layout, architecture, structure, and key features from Image 2.
- Do not replace the environment. Do not invent a new background. Do not move the scene.
- Keep the same time of day and lighting direction as Image 2.
- Do not change the weather or season.
- Only add subtle atmosphere and a few small accent lights; no scene overhaul.`;

    const extraBlock =
      typeof extraPrompt === "string" && extraPrompt.trim()
        ? `\n\nAdditional directives:\n${extraPrompt.trim()}`
        : "";

    const finalPrompt = `${BASE_PROMPT}

${STYLE_SUFFIX[safeStyle]}

${backgroundLock}${extraBlock}`;

    // --- Single unified pass with TWO reference images (Imagine Art style) ---
    const sizeStr = format === "story" ? "1024x1792" : "1024x1024";

    if (provider === "replicate") {
      stage = "replicate:prep";
      const safeSubjBuf = await safeCropSubject(subjBuf);
      const safeCompositeBuf = await buildComposite(safeSubjBuf);
      const safeCompositeDataUrl = bufferToDataUrlPng(safeCompositeBuf);
      try {
        stage = "replicate:run";
        const outUrl = await runFlux({
          imageDataUrls: [safeCompositeDataUrl, bgOnlyDataUrl],
          prompt: finalPrompt,
          token: AI_API_KEY as string,
          aspect_ratio,
          safety_tolerance: 2,
        });
        return NextResponse.json({ url: outUrl, style: safeStyle, format });
      } catch (err: any) {
        const msg = String(err?.message || err || "");
        const isSensitive = msg.toLowerCase().includes("sensitive");
        if (!isSensitive) throw err;

        stage = "replicate:safe-retry";
        const softenedSubj = await sharp(safeSubjBuf)
          .modulate({ saturation: 0.85 })
          .blur(0.3)
          .png()
          .toBuffer();
        const safeCompositeBuf2 = await buildComposite(softenedSubj);
        const safeCompositeDataUrl2 = bufferToDataUrlPng(safeCompositeBuf2);
        const safePrompt =
          `Preserve the exact subject identity from Image 1 (face, skin tone, hair, clothing). ` +
          `Do not change ethnicity, age, or gender. ` +
          `Preserve the background from Image 2 exactly. ` +
          `Family-friendly, non-suggestive, neutral lighting.`;
        stage = "replicate:safe-run";
        const outUrl = await runFlux({
          imageDataUrls: [safeCompositeDataUrl2, bgOnlyDataUrl],
          prompt: safePrompt,
          token: AI_API_KEY as string,
          aspect_ratio,
          safety_tolerance: 1,
        });
        return NextResponse.json({ url: outUrl, style: safeStyle, format });
      }
    }

    if (provider === "openai") {
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
