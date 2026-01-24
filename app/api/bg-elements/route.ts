import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SAM_ENDPOINT =
  process.env.REPLICATE_SAM_ENDPOINT ||
  "https://api.replicate.com/v1/models/meta/sam-2/predictions";
const SAM_VERSION = process.env.REPLICATE_SAM_VERSION;
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_FILES_ENDPOINT = "https://api.replicate.com/v1/files";

async function runReplicate(
  endpoint: string,
  token: string,
  input: any,
  version?: string
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Prefer: "wait",
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
  while (Date.now() - start < 120000) {
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
    if (!image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }
    if (!REPLICATE_TOKEN) {
      return NextResponse.json({ elements: [], error: "Missing REPLICATE_API_TOKEN" });
    }

    const version = SAM_ENDPOINT.includes("/models/") ? undefined : SAM_VERSION;
    if (!SAM_ENDPOINT.includes("/models/") && !version) {
      return NextResponse.json(
        { elements: [], error: "Missing REPLICATE_SAM_VERSION" },
        { status: 200 }
      );
    }
    stage = "upload";
    if (isDataUrl(image)) {
      image = await uploadToReplicate(image, REPLICATE_TOKEN);
    }
    if (!isHttpUrl(image)) {
      return NextResponse.json(
        { elements: [], error: "Background image must be a public URL or data URL." },
        { status: 200 }
      );
    }

    stage = "predict";
    const output = await runReplicate(
      SAM_ENDPOINT,
      REPLICATE_TOKEN,
      { image },
      version
    );

    const masks = Array.isArray(output)
      ? output
      : Array.isArray(output?.masks)
      ? output.masks
      : output?.mask
      ? [output.mask]
      : [];

    const elements = masks.slice(0, 6).map((maskUrl: string, idx: number) => ({
      id: `m${idx}`,
      maskUrl,
    }));

    return NextResponse.json({ elements });
  } catch (err: any) {
    return NextResponse.json(
      {
        elements: [],
        error: String(err?.message || err),
        endpoint: SAM_ENDPOINT,
        version: SAM_ENDPOINT.includes("/models/") ? undefined : SAM_VERSION,
        stage,
      },
      { status: 200 }
    );
  }
}
