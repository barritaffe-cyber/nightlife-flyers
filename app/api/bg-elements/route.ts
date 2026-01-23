import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SAM_ENDPOINT =
  process.env.REPLICATE_SAM_ENDPOINT ||
  "https://api.replicate.com/v1/models/meta/sam-2/predictions";
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const image = String(body?.image || "");
    if (!image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }
    if (!REPLICATE_TOKEN) {
      return NextResponse.json({ elements: [], error: "Missing REPLICATE_API_TOKEN" });
    }

    const output = await runReplicate(SAM_ENDPOINT, REPLICATE_TOKEN, {
      image,
    });

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
      { elements: [], error: String(err?.message || err) },
      { status: 200 }
    );
  }
}
