import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = Number(process.env.IMAGE_PROXY_TIMEOUT_MS || 8000);
const MAX_RESPONSE_BYTES = Number(process.env.IMAGE_PROXY_MAX_BYTES || 5 * 1024 * 1024);
const MAX_REDIRECTS = Number(process.env.IMAGE_PROXY_MAX_REDIRECTS || 3);
const ALLOWED_HOSTS = (process.env.IMAGE_PROXY_ALLOWED_HOSTS || "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const BLOCKED_HOSTS = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
]);

function isHostAllowed(hostname: string): boolean {
  if (ALLOWED_HOSTS.length === 0) return true;
  return ALLOWED_HOSTS.some((entry) => {
    if (entry.startsWith("*.")) {
      const suffix = entry.slice(2);
      return hostname === suffix || hostname.endsWith(`.${suffix}`);
    }
    return hostname === entry;
  });
}

function isPrivateOrLocalIp(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) {
    const parts = address.split(".").map((x) => Number(x));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return true;
    }
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (family === 6) {
    const v6 = address.toLowerCase();
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fc") || v6.startsWith("fd")) return true; // fc00::/7
    if (
      v6.startsWith("fe8") ||
      v6.startsWith("fe9") ||
      v6.startsWith("fea") ||
      v6.startsWith("feb")
    ) {
      return true; // fe80::/10
    }
    return false;
  }
  return false;
}

async function assertSafeTarget(target: URL): Promise<void> {
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  if (target.username || target.password) {
    throw new Error("URL credentials are not allowed");
  }

  const host = target.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) {
    throw new Error("Blocked host");
  }
  if (!isHostAllowed(host)) {
    throw new Error("Host not allowed");
  }
  if (isPrivateOrLocalIp(host)) {
    throw new Error("Private or local IP is not allowed");
  }

  const resolved = await dns.lookup(host, { all: true, verbatim: true });
  if (!resolved.length) {
    throw new Error("Unable to resolve host");
  }
  for (const addr of resolved) {
    if (isPrivateOrLocalIp(addr.address)) {
      throw new Error("Resolved to private/local IP");
    }
  }
}

function isRedirectStatus(code: number): boolean {
  return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
}

async function fetchWithValidatedRedirects(input: URL, signal: AbortSignal): Promise<Response> {
  let current = input;
  for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
    const res = await fetch(current.toString(), {
      cache: "no-store",
      redirect: "manual",
      signal,
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "nightlife-image-proxy/1.0",
      },
    });

    if (!isRedirectStatus(res.status)) {
      return res;
    }

    const location = res.headers.get("location");
    if (!location) {
      throw new Error("Redirect target missing");
    }
    const next = new URL(location, current);
    await assertSafeTarget(next);
    current = next;
  }

  throw new Error("Too many redirects");
}

async function readBodyWithLimit(res: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) {
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) throw new Error("Response too large");
    return buf;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {}
      throw new Error("Response too large");
    }
    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
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

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

  try {
    await assertSafeTarget(target);
    const res = await fetchWithValidatedRedirects(target, abortController.signal);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed (${res.status})` },
        { status: 502 }
      );
    }

    const contentTypeRaw = res.headers.get("content-type") || "application/octet-stream";
    const contentType = contentTypeRaw.split(";")[0].trim().toLowerCase();
    if (
      !contentType.startsWith("image/") &&
      contentType !== "application/octet-stream" &&
      contentType !== "binary/octet-stream"
    ) {
      return NextResponse.json(
        { error: `Unsupported content type: ${contentType || "unknown"}` },
        { status: 415 }
      );
    }

    const bytes = await readBodyWithLimit(res, MAX_RESPONSE_BYTES);
    const dataUrl = `data:${contentTypeRaw};base64,${Buffer.from(bytes).toString("base64")}`;
    return NextResponse.json({ dataUrl });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      return NextResponse.json({ error: "Upstream timeout" }, { status: 504 });
    }
    const msg = String((err as Error)?.message || "Proxy error");
    if (
      msg.includes("Invalid URL") ||
      msg.includes("Only http/https") ||
      msg.includes("URL credentials")
    ) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (
      msg.includes("Blocked host") ||
      msg.includes("Host not allowed") ||
      msg.includes("private/local IP")
    ) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    if (msg.includes("Response too large")) {
      return NextResponse.json({ error: msg }, { status: 413 });
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
