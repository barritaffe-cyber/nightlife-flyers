import { NextResponse } from "next/server";

export const runtime = "nodejs";

const INPAINT_ENDPOINT =
  process.env.REPLICATE_INPAINT_ENDPOINT ||
  "https://api.replicate.com/v1/models/stability-ai/sdxl-inpainting/predictions";
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

async function runReplicate(endpoint: string, token: string, input: any) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Prefer: "wait",
    },
    body: JSON.stringify({ input }),
  });

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const image = String(body?.image || "");
    const mask = String(body?.mask || "");
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

    const output = await runReplicate(INPAINT_ENDPOINT, REPLICATE_TOKEN, {
      image,
      mask,
      prompt,
      num_outputs: count,
      output_format: "png",
      seed,
    });

    const variants = Array.isArray(output)
      ? output
      : output?.images || output?.output || [];
    return NextResponse.json({ variants });
  } catch (err: any) {
    return NextResponse.json(
      { variants: [], error: String(err?.message || err) },
      { status: 200 }
    );
  }
}
