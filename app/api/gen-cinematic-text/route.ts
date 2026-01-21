import { NextResponse } from "next/server";
import sharp from "sharp";

const dataUrlToBuffer = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid data URL");
  return Buffer.from(dataUrl.slice(commaIndex + 1), "base64");
};

const bufferToDataUrl = (buf: Buffer, mime: string) =>
  `data:${mime};base64,${buf.toString("base64")}`;

async function toBufferFromAnyImage(input: string): Promise<Buffer> {
  if (typeof input !== "string") throw new Error("Invalid image input");
  if (input.startsWith("data:image/")) return dataUrlToBuffer(input);
  if (input.startsWith("http")) {
    const res = await fetch(input);
    if (!res.ok) {
      throw new Error(`Failed to fetch image URL: ${res.status} ${res.statusText}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("Invalid image input. Expected data URL or http(s) URL.");
}

async function removeNearBlackBackground(buf: Buffer, threshold = 8) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (r <= threshold && g <= threshold && b <= threshold) {
      out[i + 3] = 0;
    }
  }

  return await sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reference, text } = body ?? {};

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    if (!reference || !text) {
      return NextResponse.json(
        { error: "Missing reference or text" },
        { status: 400 }
      );
    }

    const refBuf = await toBufferFromAnyImage(String(reference));
    const prompt =
      `Change the text in the image to "${String(text)}". ` +
      "Keep the same style, lighting, materials, and composition. " +
      "Only replace the letters; do not alter the background.";

    const form = new FormData();
    const blob = new Blob([new Uint8Array(refBuf)], { type: "image/png" });
    form.append("image", blob, "reference.png");
    form.append("model", "gpt-image-1");
    form.append("prompt", prompt);
    form.append("size", "1024x1024");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const j = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const msg = j?.error?.message || `OpenAI HTTP ${res.status}`;
      throw new Error(msg);
    }

    const out = j?.data?.[0];
    if (!out) throw new Error("No image in OpenAI response");

    let outBuf: Buffer | null = null;
    if (out.b64_json) {
      outBuf = Buffer.from(out.b64_json, "base64");
    } else if (out.url) {
      outBuf = await toBufferFromAnyImage(out.url as string);
    }
    if (!outBuf) throw new Error("OpenAI returned empty image");

    const cleaned = await removeNearBlackBackground(outBuf);
    return NextResponse.json({ url: bufferToDataUrl(cleaned, "image/png") });

    throw new Error("OpenAI returned empty image");
  } catch (error: any) {
    console.error("🔥 API Error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
