import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function toBase64(bytes: ArrayBuffer): string {
  let binary = "";
  const u8 = new Uint8Array(bytes);
  const chunkSize = 0x8000;
  for (let i = 0; i < u8.length; i += chunkSize) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunkSize));
  }
  return Buffer.from(binary, "binary").toString("base64");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!/^https?:$/.test(target.protocol)) {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    }
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buf = await res.arrayBuffer();
    const base64 = toBase64(buf);
    const dataUrl = `data:${contentType};base64,${base64}`;
    return NextResponse.json({ dataUrl });
  } catch {
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}
