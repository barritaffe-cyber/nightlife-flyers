import { NextResponse } from "next/server";
import Replicate from "replicate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  imageUrl: string;
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  prompt: string;
  imageWidth?: number;
  imageHeight?: number;
};

// Default models (override via env if needed)
const SEG_MODEL = process.env.REPLICATE_SEGMENT_MODEL || "meta/sam-2";
const SEG_VERSION =
  process.env.REPLICATE_SEGMENT_VERSION ||
  "fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83";
const INPAINT_MODEL =
  process.env.REPLICATE_INPAINT_MODEL || "black-forest-labs/flux-fill";
const INPAINT_VERSION = process.env.REPLICATE_INPAINT_VERSION || "";

const isPublicUrl = (url: string) =>
  /^https?:\/\//i.test(url) &&
  !url.includes("localhost") &&
  !url.includes("127.0.0.1");

async function getImageDimensions(url: string): Promise<{
  width: number;
  height: number;
}> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Unable to fetch image for dimensions`);
  const buf = Buffer.from(await res.arrayBuffer());

  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buf).metadata();
    const width = meta.width ?? 1024;
    const height = meta.height ?? 1024;
    return { width, height };
  } catch {
    return { width: 1024, height: 1024 };
  }
}

const extractUrls = (val: any): string[] => {
  const urls: string[] = [];
  const tryAdd = (v: any) => {
    if (!v) return;
    if (typeof v === "string") urls.push(v);
    else if (typeof v.url === "string") urls.push(v.url);
    else if (typeof v.mask === "string") urls.push(v.mask);
    else if (v.file?.url) urls.push(v.file.url);
  };
  tryAdd(val);
  if (Array.isArray(val)) val.forEach(tryAdd);
  if (val?.individual_masks) tryAdd(val.individual_masks);
  if (val?.masks) tryAdd(val.masks);
  if (val?.combined_mask) tryAdd(val.combined_mask);
  if (val?.output) tryAdd(val.output);
  return urls;
};

async function toPublicImageUrl(source: string): Promise<string> {
  if (isPublicUrl(source)) return source;

  const blobToken = (process.env.BLOB_READ_WRITE_TOKEN || "").trim();
  if (!blobToken) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN missing. Cannot upload image for AI edit."
    );
  }

  let contentType = "application/octet-stream";
  let buffer: Buffer;

  if (source.startsWith("data:")) {
    const [meta, data] = source.split(",", 2);
    const match = /^data:(.*?);base64$/i.exec(meta);
    contentType = match?.[1] || "application/octet-stream";
    buffer = Buffer.from(data, "base64");
  } else {
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`Unable to fetch image for upload (${res.status})`);
    }
    contentType = res.headers.get("content-type") || contentType;
    const arrayBuf = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuf);
  }

  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("jpeg") || contentType.includes("jpg")
    ? "jpg"
    : contentType.includes("webp")
    ? "webp"
    : "bin";

  const filename = `edit-region/${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}.${ext}`;

  const res = await fetch("https://api.vercel.com/v2/blobs/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${blobToken}`,
      "Content-Type": contentType,
      "x-vercel-filename": filename,
      "x-vercel-blob-public": "true",
    },
    body: buffer as any, // Buffer is fine at runtime; cast for TS
  });

  if (!res.ok) {
    throw new Error(
      `Blob upload failed (${res.status} ${res.statusText}): ${await res.text()}`
    );
  }

  const json = (await res.json()) as { url?: string };
  if (!json.url) throw new Error("Blob upload did not return a URL");
  const url = json.url;

  return url;
}

export async function POST(req: Request) {
  try {
    const { imageUrl, x, y, prompt, imageWidth, imageHeight } =
      (await req.json()) as Body;
    const token = (process.env.REPLICATE_API_TOKEN ?? "").trim();
    const urlDebug = new URL(req.url);
    const debug = urlDebug.searchParams.get("debug") === "1";
    if (!token) {
      return NextResponse.json(
        { error: "REPLICATE_API_TOKEN is not set" },
        { status: 500 }
      );
    }
    if (!imageUrl || x == null || y == null || !prompt) {
      return NextResponse.json(
        { error: "Missing imageUrl, x, y, or prompt" },
        { status: 400 }
      );
    }

    // Resolve relative paths (e.g. /templates/foo.jpg) against the current host
    const origin = new URL(req.url).origin;
    const resolvedUrl =
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("data:")
        ? imageUrl
        : new URL(imageUrl, origin).toString();

    // Ensure the image is publicly reachable (Replicate requires an https URL)
    const publicImageUrl = await toPublicImageUrl(resolvedUrl);
    const dims =
      imageWidth && imageHeight
        ? { width: imageWidth, height: imageHeight }
        : await getImageDimensions(publicImageUrl);
    const { width, height } = dims;
    const px = Math.max(0, Math.min(width - 1, Math.floor(x * width)));
    const py = Math.max(0, Math.min(height - 1, Math.floor(y * height)));

    const delta = Math.max(4, Math.round(0.008 * Math.min(width, height)));
    const points = [
      [px, py],
      [px + delta, py],
      [px - delta, py],
      [px, py + delta],
      [px, py - delta],
    ].map(([ax, ay]) => [
      Math.max(0, Math.min(width - 1, ax)),
      Math.max(0, Math.min(height - 1, ay)),
    ]);

    const boxSizePx = Math.max(
      24,
      Math.round(0.05 * Math.min(width, height))
    );
    const half = Math.floor(boxSizePx / 2);
    const box = [
      Math.max(0, px - half),
      Math.max(0, py - half),
      Math.min(width - 1, px + half),
      Math.min(height - 1, py + half),
    ];

    const replicate = new Replicate({ auth: token });

    // 1) Segment with SAM 2
    const predictionPayload: any = {
      input: {
        image: publicImageUrl,
        input_points: JSON.stringify(points),
        input_labels: JSON.stringify(new Array(points.length).fill(1)),
        input_boxes: JSON.stringify([box]),
        multimask_output: true,
        mask_limit: 1,
      },
      wait: true,
    };
    if (SEG_VERSION) {
      predictionPayload.version = SEG_VERSION;
    } else {
      predictionPayload.model = SEG_MODEL;
    }

    const prediction = await replicate.predictions.create(predictionPayload);
    const maskOutput = prediction.output;
    const debugPredictionUrl = prediction.urls.get;
    if (debug && debugPredictionUrl) console.log("SAM debug url:", debugPredictionUrl);

    let maskUrl: string | null = null;
    const candidates = extractUrls(maskOutput);
    const combinedRaw =
      (maskOutput as any)?.combined_mask ||
      (maskOutput as any)?.mask ||
      (maskOutput as any)?.url;
    const combinedUrl =
      typeof combinedRaw === "string"
        ? combinedRaw
        : combinedRaw?.url ?? combinedRaw?.mask ?? null;
    if (combinedUrl) candidates.unshift(combinedUrl);
    maskUrl = candidates.length ? candidates[0] : null;

    // Fallback: auto masks (M2M) and pick closest bbox center to click
    if (!maskUrl) {
      return NextResponse.json(
        {
          error:
            "AI couldn’t find a clear object at that spot. Try tapping nearer the center of the object.",
          debug: debug
            ? {
                maskOutputKeys: maskOutput
                  ? Object.keys(maskOutput as any)
                  : [],
                predictionUrl: debugPredictionUrl ?? null,
              }
            : undefined,
        },
        { status: 422 }
      );
    }

    // 2) Inpaint
    const inpaintModelId = INPAINT_VERSION
      ? `${INPAINT_MODEL}:${INPAINT_VERSION}`
      : INPAINT_MODEL;
    const inpaintRaw = (await replicate.run(inpaintModelId as any, {
      input: {
        image: publicImageUrl,
        mask: maskUrl,
        prompt,
      },
    })) as any;

    const inpaintCandidates = extractUrls(inpaintRaw);
    const newImageUrl =
      (Array.isArray(inpaintRaw) && typeof inpaintRaw[0] === "string"
        ? inpaintRaw[0]
        : null) || (inpaintCandidates.length ? inpaintCandidates[0] : null);

    if (!newImageUrl || typeof newImageUrl !== "string" || newImageUrl.length < 8) {
      return NextResponse.json(
        {
          error: "Inpaint failed to return an image",
          debug: debug
            ? {
                predictionUrl: prediction.urls.get ?? null,
                maskUrl,
                inpaintKeys: inpaintRaw ? Object.keys(inpaintRaw as any) : [],
              }
            : undefined,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ newImageUrl });
  } catch (err: any) {
    console.error("edit-region error", err);
    return NextResponse.json(
      {
        error: err?.message || "Unknown error",
        debug: (() => {
          try {
            const isDbg = new URL(req.url).searchParams.get("debug") === "1";
            return isDbg ? { stack: err?.stack } : undefined;
          } catch {
            return undefined;
          }
        })(),
      },
      { status: 500 }
    );
  }
}
