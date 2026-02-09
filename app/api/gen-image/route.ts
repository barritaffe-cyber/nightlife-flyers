import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Format = 'square' | 'story';

function sizeFor(format: Format) {
  // gpt-image-1 supports: 1024x1024, 1024x1536 (portrait), 1536x1024 (landscape), auto
  return format === 'story' ? '1024x1536' : '1024x1024';
}

const dataUrlToBuffer = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid data URL");
  return Buffer.from(dataUrl.slice(commaIndex + 1), "base64");
};

async function toBufferFromAnyImage(input: string, origin: string): Promise<Buffer> {
  if (typeof input !== "string") throw new Error("Invalid image input");
  if (input.startsWith("data:image/")) return dataUrlToBuffer(input);
  if (input.startsWith("/")) {
    const res = await fetch(`${origin}${input}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch image URL: ${res.status} ${res.statusText}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  if (input.startsWith("http")) {
    const res = await fetch(input);
    if (!res.ok) {
      throw new Error(`Failed to fetch image URL: ${res.status} ${res.statusText}`);
    }
    return Buffer.from(await res.arrayBuffer());
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
  origin?: string
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
    if (reference && origin) {
      const refBuf = await toBufferFromAnyImage(reference, origin);
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
  format: Format,
  reference?: string,
  origin?: string
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
    const provider = (body?.provider || 'auto') as
      | 'auto'
      | 'nano'
      | 'openai'
      | 'venice'
      | 'imagine'
      | 'mock';
    const format = (body?.format || 'square') as Format;
    const reference = typeof body?.reference === "string" ? body.reference : undefined;

    if (!prompt) {
      return NextResponse.json({ error: "Missing 'prompt'" }, { status: 400 });
    }

    // Provider matrix
    if (provider === 'mock') {
      return NextResponse.json({ placeholder: placeholderDataURL(format, 'mock') });
    }

    // For now, “nano” == fast OpenAI call. Swap this later for your local / alt service.
    if (provider === 'venice' || provider === 'imagine') {
      const origin = new URL(req.url).origin;
      const r = await genWithImagine(prompt, format, reference, origin);
      if (!r.ok) {
        return NextResponse.json({ error: r.error, placeholder: r.placeholder }, { status: 200 });
      }
      if (r.b64) return NextResponse.json({ b64: r.b64 });
      if (r.url) return NextResponse.json({ url: r.url });
      return NextResponse.json({ placeholder: placeholderDataURL(format, 'empty result') });
    }

    if (provider === 'nano' || provider === 'auto' || provider === 'openai') {
      const origin = new URL(req.url).origin;
      const r = await genWithOpenAI(prompt, format, reference, origin);
      if (!r.ok) {
        // still return a placeholder so your UI can keep going
        return NextResponse.json({ error: r.error, placeholder: r.placeholder }, { status: 200 });
      }
      if (r.b64) return NextResponse.json({ b64: r.b64 });
      if (r.url) return NextResponse.json({ url: r.url });
      // safety net
      return NextResponse.json({ placeholder: placeholderDataURL(format, 'empty result') });
    }

    // unknown provider
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
