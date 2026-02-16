// app/api/generate/route.ts
/* =========================================
   API: Generate Background
   - provider: "openai" | "mock" (auto-mock if no key or USE_MOCK_IMAGES=1)
   - size: allowed OpenAI sizes only
   - returns: { dataUrl }
   ========================================= */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type AllowedSize =
  | "256x256"
  | "512x512"
  | "1024x1024"
  | "1024x1536"
  | "1536x1024"
  | "1024x1792"
  | "1792x1024"
  | "auto";

type GenRequest = {
  provider?: "openai" | "mock";
  format?: "square" | "story";
  prompt: string;
  size?: AllowedSize;
};

export const runtime = "nodejs";

/* ===== helper: mock bg generator (SVG gradient + grain) ===== */
function mockDataUrl(format: "square" | "story", prompt: string) {
  const w = format === "story" ? 1080 : 1080;
  const h = format === "story" ? 1920 : 1080;
  const hue = Math.abs([...prompt].reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},75%,42%)"/>
        <stop offset="100%" stop-color="hsl(${(hue+36)%360},75%,26%)"/>
      </linearGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComposite operator="in" in2="SourceGraphic"/>
      </filter>
    </defs>
    <rect fill="url(#g)" x="0" y="0" width="100%" height="100%"/>
    <rect width="100%" height="100%" filter="url(#grain)" opacity=".08"/>
    <g fill="rgba(0,0,0,.35)">
      <rect x="4%" y="5%" width="48%" height="30%" rx="16"/>
    </g>
    <text x="6%" y="12%" fill="#fff" font-family="system-ui, sans-serif" font-size="28" font-weight="700">
      MOCK BACKGROUND
    </text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/* ===== GET: diag — http://localhost:3000/api/generate?diag=1 ===== */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("diag") === "1") {
    const hasKey = !!(process.env.OPENAI_API_KEY || "").trim();
    const mock = process.env.USE_MOCK_IMAGES === "1" || !hasKey;
    return NextResponse.json({ ok: true, hasKey, mock });
  }
  return NextResponse.json({ ok: true });
}

/* ===== POST: generate ===== */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenRequest;
    const format = body.format ?? "square";
    const promptRaw = (body.prompt || "").trim();
    const providerReq = body.provider ?? "openai";

    // pick size
    const size: AllowedSize =
      body.size ?? (format === "story" ? "1024x1792" : "1024x1024");

    // final prompt tail to minimize accidental text/logos
    const finalPrompt =
      `${promptRaw}, high dynamic range, deep blacks, filmic, typography-ready, ` +
      `no text, no letters, no words, no logos, no watermark`;

    // choose provider
    const hasKey = !!(process.env.OPENAI_API_KEY || "").trim();
    const useMock = process.env.USE_MOCK_IMAGES === "1" || !hasKey || providerReq === "mock";
    if (useMock) {
      return NextResponse.json(
        { dataUrl: mockDataUrl(format, finalPrompt) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // OpenAI path
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const gen = await client.images.generate({
      model: "gpt-image-1",
      prompt: finalPrompt,
      size,
      n: 1,
      // style: "vivid" | "natural"
    });

    const b64 = gen.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { error: "Image generation failed (empty response)" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { dataUrl: `data:image/png;base64,${b64}` },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("AI generate error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
