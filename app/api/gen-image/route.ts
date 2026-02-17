import { NextRequest, NextResponse } from 'next/server';
import dns from "node:dns/promises";
import net from "node:net";

export const runtime = 'nodejs';
export const maxDuration = 60;

type Format = 'square' | 'story';
type Provider = 'auto' | 'nano' | 'openai' | 'venice' | 'imagine' | 'fal' | 'mock';

const REFERENCE_FETCH_TIMEOUT_MS = Number(process.env.GEN_IMAGE_REF_TIMEOUT_MS || 8000);
const MAX_REFERENCE_BYTES = Number(process.env.GEN_IMAGE_REF_MAX_BYTES || 10 * 1024 * 1024);
const MAX_REFERENCE_REDIRECTS = Number(process.env.GEN_IMAGE_REF_MAX_REDIRECTS || 3);
const ALLOWED_REFERENCE_HOSTS = (process.env.GEN_IMAGE_ALLOWED_HOSTS || "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const BLOCKED_REFERENCE_HOSTS = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
]);

function sizeFor(format: Format) {
  // gpt-image-1 supports: 1024x1024, 1024x1536 (portrait), 1536x1024 (landscape), auto
  return format === 'story' ? '1024x1536' : '1024x1024';
}

function falImageSizeFor(format: Format) {
  return format === 'story' ? { width: 1024, height: 1536 } : { width: 1024, height: 1024 };
}

const FAL_API_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
const FAL_FLUX2_ENDPOINT = process.env.FAL_FLUX2_ENDPOINT || "https://fal.run/fal-ai/flux-2-pro";
const FAL_FLUX2_EDIT_ENDPOINT =
  process.env.FAL_FLUX2_EDIT_ENDPOINT || "https://fal.run/fal-ai/flux-2-pro/edit";
const FAL_ENABLE_SAFETY_CHECKER =
  String(process.env.FAL_ENABLE_SAFETY_CHECKER || "false").toLowerCase() === "true";
const FAL_SAFETY_TOLERANCE = Math.max(
  1,
  Math.min(6, Number.parseInt(String(process.env.FAL_SAFETY_TOLERANCE || "5"), 10) || 5)
);

const dataUrlToBuffer = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid data URL");
  return Buffer.from(dataUrl.slice(commaIndex + 1), "base64");
};

function isHostAllowed(hostname: string): boolean {
  if (ALLOWED_REFERENCE_HOSTS.length === 0) return true;
  return ALLOWED_REFERENCE_HOSTS.some((entry) => {
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

async function assertSafeRemoteUrl(target: URL): Promise<void> {
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  if (target.username || target.password) {
    throw new Error("URL credentials are not allowed");
  }

  const host = target.hostname.toLowerCase();
  if (BLOCKED_REFERENCE_HOSTS.has(host)) {
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

function isSupportedImageContentType(raw: string): boolean {
  const base = raw.split(";")[0].trim().toLowerCase();
  return (
    base.startsWith("image/") ||
    base === "application/octet-stream" ||
    base === "binary/octet-stream"
  );
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

async function fetchWithValidatedRedirects(
  input: URL,
  signal: AbortSignal,
  opts?: { skipRemoteChecks?: boolean }
): Promise<Response> {
  let current = input;
  for (let i = 0; i <= MAX_REFERENCE_REDIRECTS; i += 1) {
    const res = await fetch(current.toString(), {
      cache: "no-store",
      redirect: "manual",
      signal,
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "nightlife-gen-image/1.0",
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
    const isSameOrigin = next.origin === input.origin;
    if (!opts?.skipRemoteChecks || !isSameOrigin) {
      await assertSafeRemoteUrl(next);
    }
    current = next;
  }

  throw new Error("Too many redirects");
}

async function fetchImageBuffer(
  target: URL,
  opts?: { skipRemoteChecks?: boolean }
): Promise<Buffer> {
  if (!opts?.skipRemoteChecks) {
    await assertSafeRemoteUrl(target);
  }
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), REFERENCE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetchWithValidatedRedirects(target, abortController.signal, opts);
    if (!res.ok) {
      throw new Error(`Failed to fetch image URL: ${res.status} ${res.statusText}`);
    }

    const contentTypeRaw = res.headers.get("content-type") || "";
    if (contentTypeRaw && !isSupportedImageContentType(contentTypeRaw)) {
      throw new Error(`Unsupported content type: ${contentTypeRaw}`);
    }

    const bytes = await readBodyWithLimit(res, MAX_REFERENCE_BYTES);
    return Buffer.from(bytes);
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new Error("Reference image fetch timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function toBufferFromAnyImage(input: string, origin: string): Promise<Buffer> {
  if (typeof input !== "string") throw new Error("Invalid image input");
  if (input.startsWith("data:image/")) {
    const buf = dataUrlToBuffer(input);
    if (buf.byteLength > MAX_REFERENCE_BYTES) {
      throw new Error("Reference image too large");
    }
    return buf;
  }
  if (input.startsWith("/")) {
    if (input.startsWith("//")) {
      throw new Error("Protocol-relative URLs are not allowed");
    }
    if (input.startsWith("/api/")) {
      throw new Error("Relative /api URLs are not allowed as image references");
    }
    const localUrl = new URL(input, origin);
    return fetchImageBuffer(localUrl, { skipRemoteChecks: true });
  }
  if (input.startsWith("http://") || input.startsWith("https://")) {
    let remoteUrl: URL;
    try {
      remoteUrl = new URL(input);
    } catch {
      throw new Error("Invalid image URL");
    }
    return fetchImageBuffer(remoteUrl);
  }
  throw new Error("Invalid image input. Expected data URL or http(s) URL.");
}

// tiny SVG gradient as a safe placeholder
function placeholderDataURL(format: Format, note = 'placeholder') {
  const w = format === 'story' ? 1024 : 1024;
  const h = format === 'story' ? 1792 : 1024;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#111827"/>
          <stop offset="1" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <text x="50%" y="50%" font-family="Inter,system-ui" font-size="28" fill="#9ca3af" text-anchor="middle">
        ${note}
      </text>
    </svg>`;
  const b64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${b64}`;
}

async function genWithOpenAI(
  prompt: string,
  format: Format,
  reference?: string,
  origin?: string,
  references?: string[]
) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: 'Missing OPENAI_API_KEY',
      placeholder: placeholderDataURL(format, 'OPENAI key missing'),
    };
  }

  const size = sizeFor(format);

  let res: Response;
  try {
    const inputRefs =
      Array.isArray(references) && references.length > 0
        ? references
        : reference
          ? [reference]
          : [];
    if (inputRefs.length > 0 && origin) {
      const refBuf = await toBufferFromAnyImage(inputRefs[0], origin);
      const form = new FormData();
      const blob = new Blob([new Uint8Array(refBuf)], { type: "image/png" });
      form.append("image", blob, "reference.png");
      form.append("model", "gpt-image-1");
      form.append("prompt", prompt);
      form.append("size", size);
      res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
      });
    } else {
      res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          size,            // <- 1024x1024 or 1024x1536 (for story)
          // no "response_format" (causes error)
        }),
      });
    }
  } catch (err: any) {
    const msg = `OpenAI request failed: ${String(err?.message || err)}`;
    return {
      ok: false,
      error: msg,
      placeholder: placeholderDataURL(format, 'OpenAI request failed'),
    };
  }

  const j = await res.json().catch(() => ({} as any));

  if (!res.ok) {
    const msg = j?.error?.message || `OpenAI HTTP ${res.status}`;
    return {
      ok: false,
      error: msg,
      placeholder: placeholderDataURL(format, 'OpenAI error'),
    };
  }

  const out = j?.data?.[0];
  if (!out) {
    return {
      ok: false,
      error: 'No image in OpenAI response',
      placeholder: placeholderDataURL(format, 'No image'),
    };
  }

  // OpenAI can return either a URL or base64
  const url = out.url as string | undefined;
  const b64 = out.b64_json as string | undefined;

  return { ok: true, url, b64 };
}

function extractFalImagePayload(j: any): { url?: string; b64?: string } {
  const first = j?.images?.[0];
  const raw =
    first?.url ??
    first?.image?.url ??
    first?.image ??
    j?.image?.url ??
    j?.image ??
    j?.output?.[0]?.url ??
    j?.output?.[0];

  if (typeof raw === "string") {
    if (raw.startsWith("data:image/")) return { url: raw };
    if (raw.startsWith("http://") || raw.startsWith("https://")) return { url: raw };
    return { b64: raw };
  }
  return {};
}

async function genWithFal(
  prompt: string,
  format: Format,
  reference?: string,
  origin?: string,
  references?: string[]
) {
  if (!FAL_API_KEY) {
    return {
      ok: false,
      error: 'Missing FAL_KEY / FAL_API_KEY',
      placeholder: placeholderDataURL(format, 'FAL key missing'),
    };
  }

  const image_size = falImageSizeFor(format);
  const payload: Record<string, any> = {
    prompt,
    image_size,
    output_format: "png",
    enable_safety_checker: FAL_ENABLE_SAFETY_CHECKER,
    safety_tolerance: FAL_SAFETY_TOLERANCE,
    sync_mode: true,
  };

  let endpoint = FAL_FLUX2_ENDPOINT;
  const inputRefs =
    Array.isArray(references) && references.length > 0
      ? references
      : reference
        ? [reference]
        : [];
  if (inputRefs.length > 0 && origin) {
    const imageUrls: string[] = [];
    for (const ref of inputRefs.slice(0, 3)) {
      const refBuf = await toBufferFromAnyImage(ref, origin);
      imageUrls.push(`data:image/png;base64,${refBuf.toString("base64")}`);
    }
    payload.image_urls = imageUrls;
    endpoint = FAL_FLUX2_EDIT_ENDPOINT;
  }

  let res: Response;
  let rawText = "";
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    rawText = await res.text();
  } catch (err: any) {
    const msg = `FAL request failed: ${String(err?.message || err)}`;
    return {
      ok: false,
      error: msg,
      placeholder: placeholderDataURL(format, "FAL request failed"),
    };
  }

  let j: any = {};
  try {
    j = rawText ? JSON.parse(rawText) : {};
  } catch {
    j = {};
  }

  if (!res.ok) {
    const msg =
      j?.detail?.[0]?.msg ||
      j?.error?.message ||
      j?.error ||
      j?.message ||
      `FAL HTTP ${res.status}`;
    return {
      ok: false,
      error: msg,
      placeholder: placeholderDataURL(format, "FAL error"),
    };
  }

  const out = extractFalImagePayload(j);
  if (!out.url && !out.b64) {
    return {
      ok: false,
      error: "No image in FAL response",
      placeholder: placeholderDataURL(format, "No image"),
    };
  }
  return { ok: true, ...out };
}

function clampPrompt(prompt: string, max = 1500) {
  if (prompt.length <= max) return prompt;
  const head = Math.floor(max * 0.7);
  const tail = max - head - 20;
  return `${prompt.slice(0, head)}… [trimmed] …${prompt.slice(-tail)}`;
}

function truncatePromptAscii(prompt: string, max: number) {
  if (prompt.length <= max) return prompt;
  const head = Math.floor(max * 0.7);
  const tail = max - head - 12;
  return `${prompt.slice(0, head)} [trimmed] ${prompt.slice(-tail)}`;
}

function sanitizeImaginePrompt(prompt: string, max: number) {
  let cleaned = String(prompt || "");
  const lower = cleaned.toLowerCase();
  const negIdx = lower.indexOf("negative prompt");
  if (negIdx !== -1) cleaned = cleaned.slice(0, negIdx);
  const sepIdx = cleaned.indexOf("||");
  if (sepIdx !== -1) cleaned = cleaned.slice(0, sepIdx);
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return truncatePromptAscii(cleaned, max);
}

async function genWithImagine(
  prompt: string,
  format: Format
) {
  const key = process.env.IMAGINE_API_KEY || process.env.VENICE_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: 'Missing IMAGINE_API_KEY',
      placeholder: placeholderDataURL(format, 'Imagine key missing'),
    };
  }

  const aspectRatio = format === 'story' ? '9:16' : '1:1';
  const styleIdRaw =
    process.env.IMAGINE_STYLE_ID ||
    process.env.IMAGINE_IMAGE_STYLE_ID ||
    '29';
  const parsedStyleId = Number.parseInt(String(styleIdRaw).trim(), 10);
  const styleId = Number.isFinite(parsedStyleId) ? String(parsedStyleId) : '29';
  const styleName = process.env.IMAGINE_IMAGE_STYLE || 'realistic';
  const variationModeRaw = (process.env.IMAGINE_VARIATION_MODE || 'create').trim().toLowerCase();
  const variationMode =
    variationModeRaw === 'variation' || variationModeRaw === 'edit' || variationModeRaw === 'upscale'
      ? variationModeRaw
      : 'create';
  const promptMax =
    Number(process.env.IMAGINE_PROMPT_MAX || 400) || 400;
  const safePrompt = sanitizeImaginePrompt(prompt, promptMax) || clampPrompt(prompt, 400);
  const form = new FormData();
  form.append('prompt', safePrompt);
  form.append('style_id', styleId);
  form.append('style', styleName);
  form.append('aspect_ratio', aspectRatio);
  form.append('variation', variationMode);

  const cfg = process.env.IMAGINE_CFG;
  if (cfg) form.append('cfg', String(cfg));

  const res = await fetch('https://api.vyro.ai/v2/image/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
    },
    body: form,
  });

  const contentType = res.headers.get('content-type') || '';
  const buf = Buffer.from(await res.arrayBuffer());
  const rawText = contentType.includes('text') || contentType.includes('json')
    ? buf.toString('utf8')
    : '';

  if (!res.ok) {
    let msg = `Imagine HTTP ${res.status}`;
    if (contentType.includes('application/json')) {
      try {
        const j = JSON.parse(rawText || '{}');
        msg = j?.error?.message || j?.error || j?.message || msg;
      } catch {}
    } else if (rawText) {
      msg = rawText;
    }
    if (rawText && rawText !== msg) msg = `${msg} | ${rawText}`;
    return {
      ok: false,
      error: msg,
      placeholder: placeholderDataURL(format, 'Imagine error'),
    };
  }

  if (contentType.startsWith('image/') || contentType.includes('octet-stream')) {
    const mime = contentType.startsWith('image/') ? contentType.split(';')[0] : 'image/png';
    return { ok: true, url: `data:${mime};base64,${buf.toString('base64')}` };
  }

  if (contentType.includes('application/json')) {
    try {
      const j = JSON.parse(rawText || '{}');
      const out =
        j?.data?.[0] ||
        j?.output?.[0] ||
        j?.image ||
        j?.image_base64 ||
        j?.result;
      if (typeof out === 'string') {
        if (out.startsWith('data:image/')) return { ok: true, url: out };
        const isUrl = out.startsWith('http');
        return isUrl ? { ok: true, url: out } : { ok: true, b64: out };
      }
      if (out?.b64_json) return { ok: true, b64: out.b64_json };
      if (out?.url) return { ok: true, url: out.url };
    } catch {}
  }

  return {
    ok: false,
    error: 'No image in Imagine response',
    placeholder: placeholderDataURL(format, 'No image'),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || '').trim();
    const provider = (body?.provider || 'auto') as Provider;
    const format = (body?.format || 'square') as Format;
    const reference = typeof body?.reference === "string" ? body.reference : undefined;
    const references =
      Array.isArray(body?.references)
        ? body.references.filter((v: unknown): v is string => typeof v === "string" && v.trim().length > 0)
        : [];
    const normalizedReferences = Array.from(
      new Set([reference, ...references].filter((v): v is string => Boolean(v)))
    ).slice(0, 3);

    if (!prompt) {
      return NextResponse.json({ error: "Missing 'prompt'" }, { status: 400 });
    }

    // Provider matrix
    if (provider === 'mock') {
      return NextResponse.json({ placeholder: placeholderDataURL(format, 'mock') });
    }

    if (provider === 'venice' || provider === 'imagine') {
      const r = await genWithImagine(prompt, format);
      if (!r.ok) {
        return NextResponse.json({ error: r.error, placeholder: r.placeholder }, { status: 200 });
      }
      if (r.b64) return NextResponse.json({ b64: r.b64 });
      if (r.url) return NextResponse.json({ url: r.url });
      return NextResponse.json({ placeholder: placeholderDataURL(format, 'empty result') });
    }

    if (provider === 'openai') {
      const origin = new URL(req.url).origin;
      const r = await genWithOpenAI(prompt, format, reference, origin, normalizedReferences);
      if (!r.ok) {
        // still return a placeholder so your UI can keep going
        return NextResponse.json({ error: r.error, placeholder: r.placeholder }, { status: 200 });
      }
      if (r.b64) return NextResponse.json({ b64: r.b64 });
      if (r.url) return NextResponse.json({ url: r.url });
      // safety net
      return NextResponse.json({ placeholder: placeholderDataURL(format, 'empty result') });
    }

    // Default "nano/auto" path now uses FLUX 2 Pro via fal.
    if (provider === 'nano' || provider === 'auto' || provider === 'fal') {
      const origin = new URL(req.url).origin;
      const rFal = await genWithFal(prompt, format, reference, origin, normalizedReferences);
      if (rFal.ok) {
        const falB64 = (rFal as any).b64 as string | undefined;
        const falUrl = (rFal as any).url as string | undefined;
        if (falB64) return NextResponse.json({ b64: falB64 });
        if (falUrl) return NextResponse.json({ url: falUrl });
      }

      // Graceful fallback to OpenAI if fal fails or is not configured.
      const rOpenAI = await genWithOpenAI(prompt, format, reference, origin, normalizedReferences);
      if (rOpenAI.ok) {
        if (rOpenAI.b64) return NextResponse.json({ b64: rOpenAI.b64 });
        if (rOpenAI.url) return NextResponse.json({ url: rOpenAI.url });
      }

      return NextResponse.json(
        {
          error: rFal.error || rOpenAI.error || "Generation failed",
          placeholder: rFal.placeholder || rOpenAI.placeholder || placeholderDataURL(format, "generation error"),
        },
        { status: 200 }
      );
    }

    // unknown provider
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
