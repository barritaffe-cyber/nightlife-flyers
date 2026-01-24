import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SAM_ENDPOINT =
  process.env.REPLICATE_SAM_ENDPOINT || "https://api.replicate.com/v1/predictions";
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
  if (data.status === "failed") throw new Error(data.error || "Replicate failed");

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
    if (out.status === "failed") throw new Error(out.error || "Replicate failed");
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

async function uploadToReplicate(dataUrl: string, token: string): Promise<string> {
  const { mime, buf } = dataUrlToBuffer(dataUrl);
  const form = new FormData();
  const blob = new Blob([buf], { type: mime });
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let image = String(body?.image || "");
    const box = body?.box;
    const width = Number(body?.width);
    const height = Number(body?.height);
    const point = body?.point;

    if (!image || !box || !width || !height) {
      return NextResponse.json({ error: "Missing image or box" }, { status: 400 });
    }
    if (!REPLICATE_TOKEN) {
      return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 200 });
    }

    if (isDataUrl(image)) image = await uploadToReplicate(image, REPLICATE_TOKEN);
    if (!isHttpUrl(image)) {
      return NextResponse.json({ error: "Image must be a public URL or data URL" }, { status: 200 });
    }

    const version = SAM_ENDPOINT.includes("/models/") ? undefined : SAM_VERSION;
    if (!SAM_ENDPOINT.includes("/models/") && !version) {
      return NextResponse.json({ error: "Missing REPLICATE_SAM_VERSION" }, { status: 200 });
    }

    const input: any = { image };
    if (box?.x1 != null && box?.y1 != null && box?.x2 != null && box?.y2 != null) {
      input.input_box = [
        Math.round(box.x1 * width),
        Math.round(box.y1 * height),
        Math.round(box.x2 * width),
        Math.round(box.y2 * height),
      ];
    }
    if (point?.x != null && point?.y != null) {
      input.input_points = [[Math.round(point.x * width), Math.round(point.y * height)]];
      input.input_labels = [1];
    }

    const output = await runReplicate(SAM_ENDPOINT, REPLICATE_TOKEN, input, version);
    const maskUrl = Array.isArray(output)
      ? output[0]
      : output?.combined_mask || output?.mask || null;

    if (!maskUrl) {
      return NextResponse.json({ error: "No mask returned" }, { status: 200 });
    }
    return NextResponse.json({ maskUrl });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 200 });
  }
}
