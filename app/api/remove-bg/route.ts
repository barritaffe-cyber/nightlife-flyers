import { NextResponse } from "next/server";

export const runtime = "nodejs";

const REMOVE_BG_API_URL =
  (process.env.REMOVE_BG_API_URL || "https://api.remove.bg/v1.0/removebg").trim();

function getRemoveBgApiKey(): string {
  return (
    process.env.REMOVE_BG_API_KEY ||
    process.env.REMOVEBG_API_KEY ||
    process.env.REMOVE_BG_KEY ||
    ""
  ).trim();
}

function pickErrorMessage(status: number, bodyText: string): string {
  if (!bodyText) return `remove.bg failed (${status})`;
  try {
    const parsed = JSON.parse(bodyText);
    const msg =
      parsed?.errors?.[0]?.title ||
      parsed?.errors?.[0]?.detail ||
      parsed?.error?.message ||
      parsed?.message;
    return msg ? String(msg) : `remove.bg failed (${status})`;
  } catch {
    return bodyText.slice(0, 240);
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = getRemoveBgApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing REMOVE_BG_API_KEY" },
        { status: 503 }
      );
    }

    const incoming = await req.formData();
    const imageEntry = incoming.get("image") || incoming.get("image_file");
    if (!(imageEntry instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing image file in form-data (field: image)" },
        { status: 400 }
      );
    }

    const imageName =
      imageEntry instanceof File && imageEntry.name ? imageEntry.name : "image.png";
    const imageType = imageEntry.type || "image/png";

    const body = new FormData();
    body.append("image_file", imageEntry, imageName);
    body.append("size", "auto");
    body.append("format", imageType === "image/jpeg" ? "jpg" : "png");

    const upstream = await fetch(REMOVE_BG_API_URL, {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body,
      cache: "no-store",
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: pickErrorMessage(upstream.status, errorText) },
        { status: 502 }
      );
    }

    const output = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/png";

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "remove.bg request failed" },
      { status: 500 }
    );
  }
}

