import { NextResponse } from "next/server";

export const runtime = "nodejs";

const INPAINT_ENDPOINT =
  process.env.REPLICATE_INPAINT_ENDPOINT ||
  "https://api.replicate.com/v1/models/stability-ai/sdxl-inpainting/predictions";
const INPAINT_VERSION = process.env.REPLICATE_INPAINT_VERSION;
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_FILES_ENDPOINT = "https://api.replicate.com/v1/files";

async function runReplicate(
  endpoint: string,
  token: string,
  input: any,
  version?: string
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(version ? { version, input } : { input }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  const raw = await res.text();
  if (!res.ok) throw new Error(raw || "Replicate request failed");

  const data = JSON.parse(raw);
  if (data.status === "succeeded") return data.output;
  if (data.status === "failed") {
    throw new Error(data.error || "Replicate prediction failed");
  }

  const pollUrl = data?.urls?.get;
  if (!pollUrl) throw new Error("Missing polling URL");

  const start = Date.now();
  while (Date.now() - start < 180000) {
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

function isDataUrl(value: string) {
  return value.startsWith("data:");
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  const mime = match[1];
  const buf = Buffer.from(match[2], "base64");
  return { mime, buf };
}

async function uploadToReplicate(
  dataUrl: string,
  token: string
): Promise<string> {
  const { mime, buf } = dataUrlToBuffer(dataUrl);
  const form = new FormData();
  const blob = new Blob([buf], { type: mime });
  form.append("content", blob, "upload.png");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  const res = await fetch(REPLICATE_FILES_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal: controller.signal,
  });
  clearTimeout(timeout);
  const raw = await res.text();
  if (!res.ok) throw new Error(raw || "Replicate file upload failed");
  const data = JSON.parse(raw);
  const url = data?.urls?.get || data?.url || data?.file;
  if (!url) throw new Error("Missing uploaded file url");
  return url;
}

export async function POST(req: Request) {
  let stage = "start";
  try {
    const body = await req.json();
    let image = String(body?.image || "");
    let mask = String(body?.mask || "");
    const prompt = String(body?.prompt || "").trim();
    const count = Math.min(3, Math.max(1, Number(body?.count || 3)));
    const seed = Number.isFinite(body?.seed) ? Number(body?.seed) : undefined;

    if (!image || !mask || !prompt) {
      return NextResponse.json(
        { error: "Missing image, mask, or prompt" },
        { status: 400 }
      );
    }
    if (!REPLICATE_TOKEN) {
      return NextResponse.json(
        { variants: [], error: "Missing REPLICATE_API_TOKEN" },
        { status: 200 }
      );
    }

    const version = INPAINT_ENDPOINT.includes("/models/") ? undefined : INPAINT_VERSION;
    if (!INPAINT_ENDPOINT.includes("/models/") && !version) {
      return NextResponse.json(
        { variants: [], error: "Missing REPLICATE_INPAINT_VERSION" },
        { status: 200 }
      );
    }

    stage = "upload";
    if (isDataUrl(image)) {
      image = await uploadToReplicate(image, REPLICATE_TOKEN);
    }
    if (isDataUrl(mask)) {
      mask = await uploadToReplicate(mask, REPLICATE_TOKEN);
    }
    if (!isHttpUrl(image)) {
      return NextResponse.json(
        { variants: [], error: "Background image must be a public URL or data URL." },
        { status: 200 }
      );
    }
    if (!isHttpUrl(mask)) {
      return NextResponse.json(
        { variants: [], error: "Mask must be a public URL or data URL." },
        { status: 200 }
      );
    }

    stage = "predict";
    const colorWords =
      /\b(red|blue|green|yellow|orange|purple|pink|black|white|gray|grey|teal|cyan|magenta|brown|beige|gold|silver)\b/i;
    const isColorEdit = colorWords.test(prompt);
    const colorLockPrompt = isColorEdit
      ? "Change only the color as requested. Shift the hue to the requested color. Preserve the exact shape, folds, texture, fabric, and lighting. No restyle, no pattern change."
      : "";
    const safetyPrompt =
      "Preserve the original photo. Keep all unmasked areas identical. " +
      "Only apply the requested change inside the mask. " +
      "No new objects, no new people, no horror, no gore, no distortions. " +
      "Maintain natural lighting, realistic textures, and original perspective.";
    const fullPrompt = [prompt, colorLockPrompt, safetyPrompt]
      .filter(Boolean)
      .join(" ");

    const output = await runReplicate(
      INPAINT_ENDPOINT,
      REPLICATE_TOKEN,
      {
        image,
        mask,
        prompt: fullPrompt,
        negative_prompt:
          "horror, creepy, gore, blood, monster, deformed, distorted, " +
          "extra limbs, extra faces, low quality, blurry, artifacts, " +
          "text, watermark, logo, glitch, pattern change, fabric change, " +
          "shape change, silhouette change",
        num_inference_steps: 22,
        guidance_scale: isColorEdit ? 7 : 5,
        strength: isColorEdit ? 0.55 : 0.35,
        num_outputs: count,
        output_format: "png",
        seed,
      },
      version
    );

    const variants = Array.isArray(output)
      ? output
      : output?.images || output?.output || [];
    return NextResponse.json({ variants });
  } catch (err: any) {
    return NextResponse.json(
      {
        variants: [],
        error: String(err?.message || err),
        endpoint: INPAINT_ENDPOINT,
        version: INPAINT_ENDPOINT.includes("/models/") ? undefined : INPAINT_VERSION,
        stage,
      },
      { status: 200 }
    );
  }
}
