import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

// Replicate model endpoint
const FLUX_ENDPOINT =
  "https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions";

const AI_API_KEY = process.env.REPLICATE_API_TOKEN;

// -----------------------------
// MASTER INTERNAL PROMPT (BASE)
// -----------------------------
const BASE_PROMPT = `High-impact cinematic flyer image with strong depth and energy.

The person is photographed inside the background environment and must feel physically embedded in the scene.
The subject must be re-lit by the environment, with lighting visibly interacting with surfaces and atmosphere.
No halos, no outlines, no artificial glow around the subject.

SUBJECT FIDELITY (critical):
- preserve the same person, face, hairstyle, clothing, and pose from Image 1
- do not change identity, outfit, or body shape
- do not stylize the subject or alter facial features
- keep the same facial likeness, skin tone, and body proportions as Image 1
- keep the same expression and eye direction as Image 1

GROUNDING (critical):
- subject must be grounded on a surface with a visible contact shadow
- match the scene perspective and horizon line from Image 2
- match subject scale to the environment so it does not appear floating
- subject feet/base must align to a plausible ground plane

BACKGROUND SUBJECTS (keep but de-emphasize):
- keep any existing people or subjects from Image 2, but push them back in depth
- reduce their contrast and sharpness so the main subject remains dominant
- do not remove them entirely; they should remain in the scene as background context

Safety:
- fully clothed, family-friendly, non-suggestive attire
- no nudity, no lingerie, no explicit or sexualized content

LIGHT → ATMOSPHERE → SUBJECT INTERACTION (critical):
- use only the existing light sources from Image 2 (do not invent new light rigs)
- if the background has no beams/lasers, do not add them
- subtle atmospheric haze only if already present in the background
- atmospheric light softly carries color onto the subject’s skin and clothing
- colored light spills gently across fabric folds and facial planes
- light intensity falls off naturally across the subject, not flat
- the subject blocks and shapes light beams, creating natural occlusion

DEPTH AND OCCLUSION:
- minimal foreground smoke and particles exist between the camera and the subject
- mid-ground smoke lightly surrounds the subject for integration
- background lights sit behind the subject and are partially diffused by atmosphere
- subject edges are softened by depth and light interaction, never clean or cut out
- add a grounded contact shadow beneath the subject (feet or base) so they are not floating

COLOR AND CONTRAST (for pop, not glow):
- high contrast with deep blacks and bright highlights
- strong black point and clean white point
- subtle S-curve contrast for punch and depth
- vibrance and color separation driven by light intensity, not saturation
- natural skin tones influenced by scene lighting

DEPTH OF FIELD:
- shallow depth of field with clear separation between planes
- foreground atmosphere slightly out of focus
- subject remains sharp
- background lights fall into soft, colorful bokeh

MOTION AND ENERGY:
- floating particles and subtle sparks catch highlights for motion and texture
- light motion blur on lights and particles only (subject remains sharp)

Cinematic poster composition:
- tight, confident framing
- subject dominates but feels grounded in the environment
- bold, graphic contrast suitable for nightlife flyers

Avoid heavy fog, avoid smoky wash, avoid halos, avoid flat lighting.
No text, no logos, no watermarks, no extra people.`;

// -----------------------------
// STYLE SUFFIXES (APPEND ONLY)
// -----------------------------
type MagicBlendStyle = "club" | "tropical" | "jazz_bar" | "outdoor_summer";

const STYLE_SUFFIX: Record<MagicBlendStyle, string> = {
  club: `Environment styling:
- modern nightclub or concert venue
- bold stage lighting in reds, magentas, and ambers
- energetic light beams and lasers behind the subject
- high-energy nightlife atmosphere

Avoid:
- tropical elements (palms, beach, sunset, tiki decor)
- jazz bar cues (smoke-filled lounge, brass instruments, vintage bar ambience)
- outdoor daytime lighting or bright sun`,
  tropical: `Environment styling:
- tropical night venue or rooftop lounge
- warm ambient lighting with palms or outdoor elements
- golden and warm accent lights mixed with subtle color
- relaxed but vibrant nightlife energy
- minimal atmosphere; no visible beams unless already present
- keep the background scene intact and unchanged

Avoid:
- nightclub lasers or stage strobes
- heavy magenta club lighting or EDM concert beams
- jazz bar interior cues (dark lounge, leather booths, brass instruments)
- concert lighting rigs, beam arrays, or stage spotlights`,
  jazz_bar: `Environment styling (minimal change / preserve background):
- Preserve the original background from Image 2 as much as possible.
- Do NOT add new objects, signs, decor, furniture, or architectural changes.
- Do NOT change the room layout, wall patterns, ceiling features, or key light positions.
- Only enhance the existing scene with cinematic lighting, atmosphere, and depth.

Lighting integration (depth layers):
- Add subtle practical light sources that match the background’s existing vibe (warm bar lights, stage spot, sconces).
- Include lighting behind the subject (backlights) to create separation through contrast, NOT through glow/halos.
- Include lighting in front of the subject (soft key/fill) that is motivated by the environment.
- Include mid-layer lighting beams that pass through atmosphere.

Atmosphere interaction:
- Use a light amount of smoke/haze only to reveal beams and add depth.
- Smoke must exist in front of AND behind the subject (depth), but remain subtle.
- Lights must illuminate the smoke (visible volumetric response) and cast soft color spill onto skin and clothing.
- Subject must block beams and shape the light (occlusion), edges must never look cut out.

DOF / bokeh:
- Strong shallow depth of field.
- Background practical lights fall into soft bokeh.
- Subject remains sharp, atmosphere closest to camera slightly out of focus.

Style:
- Premium cinematic jazz bar mood, warm highlights, deep shadows, rich blacks.
- No text, no logos, no watermarks, no extra people.

Avoid:
- nightclub lasers, concert beams, or strobe effects
- tropical decor, palms, beach, or sunset lighting
- outdoor daytime lighting or bright sun`,
  outdoor_summer: `Environment styling:
- vibrant, cinematic summer day-party atmosphere (hot, joyful, alive)
- bright natural sunlight with warm golden highlights and soft, flattering shadows
- subtle heat haze and gentle light bloom; fine dust specks catching sunlight
- rich saturated blue sky with soft gradients, open and clean
- sun-kissed palms and background elements, softened by shallow depth of field
- rhythmic crowd energy via motion cues (raised hands, hair/fabric movement, light motion blur)

Color grading:
- warm highlights, rich natural skin tones
- vibrant but controlled saturation
- deep contrast without crushing shadows

Mood:
- pool party / carnival-inspired luxury
- carefree, stylish, euphoric

Style keywords:
- cinematic summer, Afrobeat energy, luxury day party, tropical heat
- joyful chaos, lifestyle promo, high-end event atmosphere

Quality:
- ultra-realistic, clean detail, soft motion blur
- no artificial effects, no text, no logos, no watermarks, no extra people

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

// -----------------------------
// route
// -----------------------------
export async function POST(req: Request) {
  try {
    if (!AI_API_KEY) {
      return NextResponse.json(
        { error: "Missing REPLICATE_API_TOKEN in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { subject, background, style = "club", format = "square" } = body as {
      subject: string;
      background: string;
      style?: MagicBlendStyle;
      format?: "square" | "story" | "portrait";
    };

    if (!subject || !background) {
      return NextResponse.json(
        { error: "Missing required fields: subject, background." },
        { status: 400 }
      );
    }

    const safeStyle: MagicBlendStyle =
      style === "tropical" || style === "jazz_bar" || style === "outdoor_summer"
        ? style
        : "club";

    const aspect_ratio: "1:1" | "9:16" | "4:5" =
      format === "story" ? "9:16" : format === "portrait" ? "4:5" : "1:1";

    // --- Precomposite subject onto background (conditioning image) ---
    const size = 1024;

    // 1) Background canvas (this is the "truth" reference)
    const bgBuf = await toBufferFromAnyImage(background);
    const bgCanvas = await sharp(bgBuf)
      .resize(size, size, { fit: "cover" })
      .png()
      .toBuffer();

    // 2) Subject buffer
    const subjBuf = await toBufferFromAnyImage(subject);

    // Subject framing: bigger & slightly lifted (poster feel)
    // NOTE: if background adherence is still weak, drop this to 0.88–0.92
    const subjectScale = 0.96;
    const subjSize = Math.round(size * subjectScale);
    const subjLeft = Math.round((size - subjSize) / 2);
    const yLift = Math.round(size * (safeStyle === "tropical" ? 0.02 : 0.06));
    const subjTop = Math.round((size - subjSize) / 2) - yLift;

    async function buildComposite(subjInput: Buffer) {
      const subjPng = await sharp(subjInput)
        .resize(subjSize, subjSize, { fit: "contain" })
        .png()
        .toBuffer();
      return await sharp(bgCanvas)
        .composite([{ input: subjPng, left: subjLeft, top: subjTop }])
        .png()
        .toBuffer();
    }

    // 3) Composite subject onto the background for placement reference
    const preCompositeBuf = await buildComposite(subjBuf);

    // 4) Convert both images to data URLs (order matters)
    const preCompositeDataUrl = bufferToDataUrlPng(preCompositeBuf);
    const bgOnlyDataUrl = bufferToDataUrlPng(bgCanvas);

    // --- Build prompt (BASE + SUFFIX + background lock) ---
    const finalPrompt = `${BASE_PROMPT}

${STYLE_SUFFIX[safeStyle]}

Background lock (strict):
- Image 1 is the subject placement and framing reference.
- Image 2 is the background reference and MUST be preserved exactly.
- Preserve the background’s layout, architecture, structure, and key features from Image 2.
- Do not replace the environment. Do not invent a new background. Do not move the scene.
- Keep the same time of day and lighting direction as Image 2.
- Do not change the weather or season.
- Only add subtle atmosphere and a few small accent lights; no scene overhaul.`;

    // --- Single unified pass with TWO reference images (Imagine Art style) ---
    let outUrl: string;
    try {
      outUrl = await runFlux({
        imageDataUrls: [preCompositeDataUrl, bgOnlyDataUrl],
        prompt: finalPrompt,
        token: AI_API_KEY,
        aspect_ratio,
        safety_tolerance: 2,
      });
    } catch (err: any) {
      const msg = String(err?.message || err || "");
      const isSensitive = msg.toLowerCase().includes("sensitive");
      if (!isSensitive) throw err;

      let safeSubj = subjBuf;
      try {
        const meta = await sharp(subjBuf).metadata();
        if (meta.width && meta.height) {
          const cropH = Math.max(1, Math.round(meta.height * 0.75));
          safeSubj = await sharp(subjBuf)
            .extract({ left: 0, top: 0, width: meta.width, height: cropH })
            .png()
            .toBuffer();
        }
      } catch {
        // keep original if cropping fails
      }

      const safeCompositeBuf = await buildComposite(safeSubj);
      const safeCompositeDataUrl = bufferToDataUrlPng(safeCompositeBuf);
      const safePrompt =
        `${finalPrompt}\n\nSafety override: fully clothed, high-fashion portrait, no skin emphasis, non-suggestive.`;
      outUrl = await runFlux({
        imageDataUrls: [safeCompositeDataUrl, bgOnlyDataUrl],
        prompt: safePrompt,
        token: AI_API_KEY,
        aspect_ratio,
        safety_tolerance: 1,
      });
    }

    return NextResponse.json({ url: outUrl, style: safeStyle, format });
  } catch (err: any) {
    console.error("❌ MAGIC BLEND ERROR:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
