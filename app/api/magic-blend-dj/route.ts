import { NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { supabaseAuth } from "../../../lib/supabase/auth";
import { getAccessSnapshotForUser } from "../../../lib/accessQuota";

export const runtime = "nodejs";

type AlphaBounds = { left: number; top: number; width: number; height: number };
type RgbColor = { r: number; g: number; b: number };

function isDataUrl(v: string) {
  return typeof v === "string" && v.startsWith("data:image/");
}

function dataUrlToBuffer(dataUrl: string) {
  if (!dataUrl.startsWith("data:")) throw new Error("Invalid data URL");
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Invalid data URL");
  const meta = dataUrl.slice(5, comma);
  const data = dataUrl.slice(comma + 1);
  if (!data) throw new Error("Invalid data URL");
  if (meta.includes(";base64")) return Buffer.from(data, "base64");
  return Buffer.from(decodeURIComponent(data), "base64");
}

function isProbablyBase64(v: string) {
  if (typeof v !== "string") return false;
  if (v.length < 64) return false;
  return /^[A-Za-z0-9+/=]+$/.test(v);
}

async function toBufferFromAnyImage(input: string): Promise<Buffer> {
  if (typeof input !== "string") throw new Error("Invalid image input");
  if (input.startsWith("blob:")) {
    throw new Error("Got blob: URL. Send data:image/... base64 from client instead.");
  }
  if (isDataUrl(input)) return dataUrlToBuffer(input);
  if (!input.startsWith("http")) {
    if (isProbablyBase64(input)) return Buffer.from(input, "base64");
    throw new Error("Invalid image input. Expected data URL or http(s) URL.");
  }

  const res = await fetch(input);
  if (!res.ok) {
    throw new Error(`Failed to fetch image URL: ${res.status} ${res.statusText}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function bufferToDataUrlPng(buf: Buffer) {
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixColor(a: RgbColor, b: RgbColor, amount: number): RgbColor {
  const t = Math.max(0, Math.min(1, amount));
  return {
    r: clampByte(a.r * (1 - t) + b.r * t),
    g: clampByte(a.g * (1 - t) + b.g * t),
    b: clampByte(a.b * (1 - t) + b.b * t),
  };
}

function luminanceOfColor(color: RgbColor) {
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

function scaleAlpha(raw: Buffer, opacity: number) {
  const out = Buffer.alloc(raw.length);
  const factor = Math.max(0, Math.min(1, opacity));
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = Math.max(0, Math.min(255, Math.round(raw[i] * factor)));
  }
  return out;
}

async function detectMaskBounds(buf: Buffer, threshold = 10): Promise<AlphaBounds | null> {
  const raw = await sharp(buf)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const w = info.width;
  const h = info.height;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    for (let x = 0; x < w; x += 1) {
      if (data[row + x] > threshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

async function computeSceneLuminance(buf: Buffer) {
  const raw = await sharp(buf)
    .resize(48, 48, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  let total = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < pixels; i += 1) {
    const o = i * info.channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return pixels ? total / pixels : 96;
}

async function computeMaskedLuminance(buf: Buffer, maskBuf: Buffer) {
  const [imageRaw, maskRaw] = await Promise.all([
    sharp(buf)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }),
    sharp(maskBuf)
      .extractChannel(0)
      .raw()
      .toBuffer({ resolveWithObject: true }),
  ]);

  const { data, info } = imageRaw;
  let total = 0;
  let weight = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < pixels; i += 1) {
    const mask = maskRaw.data[i] / 255;
    if (mask <= 0.02) continue;
    const o = i * info.channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const alpha = info.channels > 3 ? data[o + 3] / 255 : 1;
    const w = mask * alpha;
    if (w <= 0.01) continue;
    total += (0.2126 * r + 0.7152 * g + 0.0722 * b) * w;
    weight += w;
  }
  return weight > 0 ? total / weight : 96;
}

async function extractAlphaMask(buf: Buffer) {
  return sharp(buf)
    .ensureAlpha()
    .extractChannel(3)
    .png()
    .toBuffer();
}

async function buildMaskedSubjectImage(sourceBuf: Buffer, maskBuf: Buffer) {
  const alphaPng = await sharp(maskBuf).extractChannel(0).png().toBuffer();
  return sharp(sourceBuf)
    .removeAlpha()
    .joinChannel(alphaPng)
    .png()
    .toBuffer();
}

async function trimSubjectToAlpha(buf: Buffer) {
  const normalized = await sharp(buf).ensureAlpha().png().toBuffer();
  const alphaBuf = await extractAlphaMask(normalized);
  const bounds = await detectMaskBounds(alphaBuf, 8);
  const meta = await sharp(normalized).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Invalid subject image.");
  }
  if (!bounds) {
    return {
      subjectBuf: normalized,
      maskBuf: alphaBuf,
      bounds: { left: 0, top: 0, width: meta.width, height: meta.height },
    };
  }

  const extractArea = {
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
  };

  const [subjectBuf, maskBuf] = await Promise.all([
    sharp(normalized).extract(extractArea).png().toBuffer(),
    sharp(alphaBuf).extract(extractArea).png().toBuffer(),
  ]);

  return { subjectBuf, maskBuf, bounds };
}

async function renderPlacedSubjectFromSource(
  sourceSubjectBuf: Buffer,
  placementMaskBuf: Buffer,
  canvasWidth: number,
  canvasHeight: number
) {
  const placementBounds = await detectMaskBounds(placementMaskBuf, 12);
  if (!placementBounds) throw new Error("Could not determine subject placement.");

  const trimmed = await trimSubjectToAlpha(sourceSubjectBuf);
  const [resizedSubjectBuf, resizedMaskBuf] = await Promise.all([
    sharp(trimmed.subjectBuf)
      .resize(placementBounds.width, placementBounds.height, { fit: "fill" })
      .png()
      .toBuffer(),
    sharp(trimmed.maskBuf)
      .resize(placementBounds.width, placementBounds.height, { fit: "fill" })
      .png()
      .toBuffer(),
  ]);

  const placedSubjectBuf = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedSubjectBuf, left: placementBounds.left, top: placementBounds.top }])
    .png()
    .toBuffer();

  const placedMaskBuf = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: resizedMaskBuf, left: placementBounds.left, top: placementBounds.top }])
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .grayscale()
    .png()
    .toBuffer();

  return {
    placedSubjectBuf,
    placedMaskBuf,
    placementBounds,
    resizedSubjectBuf,
    resizedMaskBuf,
  };
}

async function detectSceneLighting(
  bgBuf: Buffer,
  maskBuf: Buffer
): Promise<{ lightSide: "left" | "right"; highlightColor: RgbColor; sideContrast: number }> {
  const bounds = await detectMaskBounds(maskBuf, 12);
  if (!bounds) {
    return {
      lightSide: "left",
      highlightColor: { r: 244, g: 218, b: 188 },
      sideContrast: 32,
    };
  }

  const raw = await sharp(bgBuf)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const stripW = Math.max(16, Math.round(bounds.width * 0.18));
  const leftStart = Math.max(0, bounds.left - stripW);
  const leftEnd = Math.max(leftStart + 1, bounds.left);
  const rightStart = Math.min(info.width - 1, bounds.left + bounds.width);
  const rightEnd = Math.min(info.width, rightStart + stripW);
  const top = Math.max(0, bounds.top + Math.round(bounds.height * 0.06));
  const bottom = Math.min(info.height, bounds.top + Math.round(bounds.height * 0.9));
  const topBand = Math.max(14, Math.round(bounds.height * 0.18));
  const topStart = Math.max(0, bounds.top - topBand);
  const topEnd = Math.max(topStart + 1, bounds.top);

  const sampleRegion = (x0: number, x1: number, y0: number, y1: number) => {
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let totalL = 0;
    let count = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const o = (y * info.width + x) * info.channels;
        const r = data[o];
        const g = data[o + 1];
        const b = data[o + 2];
        totalR += r;
        totalG += g;
        totalB += b;
        totalL += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        count += 1;
      }
    }
    if (!count) {
      return {
        color: { r: 224, g: 200, b: 178 },
        luminance: 128,
      };
    }
    return {
      color: {
        r: clampByte(totalR / count),
        g: clampByte(totalG / count),
        b: clampByte(totalB / count),
      },
      luminance: totalL / count,
    };
  };

  const leftSample = sampleRegion(leftStart, leftEnd, top, bottom);
  const rightSample = sampleRegion(rightStart, rightEnd, top, bottom);
  const topSample = sampleRegion(bounds.left, bounds.left + bounds.width, topStart, topEnd);
  const lightSide = leftSample.luminance >= rightSample.luminance ? "left" : "right";
  const sideColor = lightSide === "left" ? leftSample.color : rightSample.color;
  const sideContrast = Math.abs(leftSample.luminance - rightSample.luminance);
  const liftTowardWhite = sideContrast > 26 ? 0.62 : sideContrast > 14 ? 0.52 : 0.44;
  const liftedSideColor = mixColor(sideColor, { r: 255, g: 248, b: 238 }, liftTowardWhite);
  const topLiftedColor = mixColor(topSample.color, { r: 255, g: 246, b: 236 }, 0.42);
  const highlightColor = mixColor(liftedSideColor, topLiftedColor, 0.48);

  return { lightSide, highlightColor, sideContrast };
}

async function buildDirectionalSubjectMasks(
  maskBuf: Buffer,
  lightSide: "left" | "right"
) {
  const normalized = await sharp(maskBuf).grayscale().png().toBuffer();
  const meta = await sharp(normalized).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Invalid placement mask.");
  }

  const coreRaw = await sharp(normalized)
    .threshold(12)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const highlightGradientSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}">
      <defs>
        <linearGradient id="hx" x1="${lightSide === "left" ? "0%" : "100%"}" y1="0%" x2="${lightSide === "left" ? "100%" : "0%"}" y2="0%">
          <stop offset="0%" stop-color="white" stop-opacity="1" />
          <stop offset="52%" stop-color="white" stop-opacity="0.56" />
          <stop offset="100%" stop-color="white" stop-opacity="0.06" />
        </linearGradient>
        <linearGradient id="hy" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="white" stop-opacity="1" />
          <stop offset="68%" stop-color="white" stop-opacity="0.46" />
          <stop offset="100%" stop-color="white" stop-opacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hx)" />
      <rect width="100%" height="100%" fill="url(#hy)" />
    </svg>`
  );
  const shadowGradientSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}">
      <defs>
        <linearGradient id="sx" x1="${lightSide === "left" ? "100%" : "0%"}" y1="0%" x2="${lightSide === "left" ? "0%" : "100%"}" y2="0%">
          <stop offset="0%" stop-color="white" stop-opacity="1" />
          <stop offset="66%" stop-color="white" stop-opacity="0.4" />
          <stop offset="100%" stop-color="white" stop-opacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#sx)" />
    </svg>`
  );

  const toGrayRaw = async (svg: Buffer) =>
    sharp({
      create: {
        width: meta.width,
        height: meta.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .composite([{ input: svg }])
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .grayscale()
      .raw()
      .toBuffer();

  const highlightRaw = await toGrayRaw(highlightGradientSvg);
  const shadowRaw = await toGrayRaw(shadowGradientSvg);
  const highlightMaskRaw = Buffer.alloc(coreRaw.data.length);
  const shadowMaskRaw = Buffer.alloc(coreRaw.data.length);

  for (let i = 0; i < coreRaw.data.length; i += 1) {
    const core = coreRaw.data[i] / 255;
    const hi = highlightRaw[i] / 255;
    const sh = shadowRaw[i] / 255;
    highlightMaskRaw[i] = Math.round(255 * core * hi);
    shadowMaskRaw[i] = Math.round(255 * core * sh);
  }

  const toMaskPng = (rawBuf: Buffer) =>
    sharp(rawBuf, {
      raw: {
        width: meta.width,
        height: meta.height,
        channels: 1,
      },
    })
      .blur(4.4)
      .png()
      .toBuffer();

  return {
    subjectHighlightMask: await toMaskPng(highlightMaskRaw),
    subjectShadowMask: await toMaskPng(shadowMaskRaw),
  };
}

async function buildIntegrationMasks(maskBuf: Buffer) {
  const normalized = await sharp(maskBuf).grayscale().png().toBuffer();
  const meta = await sharp(normalized).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("Invalid placement mask.");
  }

  const coreRaw = await sharp(normalized)
    .threshold(12)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const outerRaw = await sharp(normalized)
    .blur(4.5)
    .threshold(6)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const innerRaw = await sharp(normalized)
    .blur(1.8)
    .threshold(200)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ring = Buffer.alloc(coreRaw.info.width * coreRaw.info.height);
  const innerBand = Buffer.alloc(coreRaw.info.width * coreRaw.info.height);
  for (let i = 0; i < ring.length; i += 1) {
    const coreOn = coreRaw.data[i] > 12;
    const outerOn = outerRaw.data[i] > 10;
    const innerOn = innerRaw.data[i] > 180;
    ring[i] = outerOn && !coreOn ? 255 : 0;
    innerBand[i] = coreOn && !innerOn ? 255 : 0;
  }

  const bounds = await detectMaskBounds(normalized, 12);
  const shadow = Buffer.alloc(ring.length);
  if (bounds) {
    const cx = bounds.left + bounds.width / 2;
    const cy = Math.min(meta.height - 1, bounds.top + bounds.height + bounds.height * 0.06);
    const rx = Math.max(16, bounds.width * 0.26);
    const ry = Math.max(8, bounds.height * 0.055);
    const shadowSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}">
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" />
      </svg>`
    );
    const shadowRaw = await sharp({
      create: {
        width: meta.width,
        height: meta.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .composite([{ input: shadowSvg }])
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .grayscale()
      .blur(14)
      .raw()
      .toBuffer();

    for (let i = 0; i < shadow.length; i += 1) {
      const coreOn = coreRaw.data[i] > 12;
      shadow[i] = coreOn ? 0 : shadowRaw[i];
    }
  }

  const ringMask = await sharp(ring, {
    raw: {
      width: meta.width,
      height: meta.height,
      channels: 1,
    },
  })
    .blur(0.35)
    .png()
    .toBuffer();
  const shadowMask = await sharp(shadow, {
    raw: {
      width: meta.width,
      height: meta.height,
      channels: 1,
    },
  })
    .png()
    .toBuffer();
  const innerSpillMask = await sharp(innerBand, {
    raw: {
      width: meta.width,
      height: meta.height,
      channels: 1,
    },
  })
    .blur(0.6)
    .png()
    .toBuffer();

  return { ringMask, shadowMask, innerSpillMask };
}

async function buildAlphaOverlay(rgbBuf: Buffer, maskBuf: Buffer, opacity: number) {
  const rgb = await sharp(rgbBuf).removeAlpha().png().toBuffer();
  const alphaRaw = await sharp(maskBuf)
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const scaledAlpha = scaleAlpha(alphaRaw.data, opacity);
  return sharp(rgb)
    .joinChannel(
      await sharp(scaledAlpha, {
        raw: {
          width: alphaRaw.info.width,
          height: alphaRaw.info.height,
          channels: 1,
        },
      })
        .png()
        .toBuffer()
    )
    .png()
    .toBuffer();
}

async function buildBlackOverlay(width: number, height: number, maskBuf: Buffer, opacity: number) {
  const alphaRaw = await sharp(maskBuf)
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const scaledAlpha = scaleAlpha(alphaRaw.data, opacity);
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .joinChannel(
      await sharp(scaledAlpha, {
        raw: {
          width: alphaRaw.info.width,
          height: alphaRaw.info.height,
          channels: 1,
        },
      })
        .png()
        .toBuffer()
    )
    .png()
    .toBuffer();
}

async function buildColorOverlay(
  width: number,
  height: number,
  maskBuf: Buffer,
  opacity: number,
  color: RgbColor
) {
  const alphaRaw = await sharp(maskBuf)
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const scaledAlpha = scaleAlpha(alphaRaw.data, opacity);
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .joinChannel(
      await sharp(scaledAlpha, {
        raw: {
          width: alphaRaw.info.width,
          height: alphaRaw.info.height,
          channels: 1,
        },
      })
        .png()
        .toBuffer()
    )
    .png()
    .toBuffer();
}

export async function POST(req: Request) {
  let stage = "init";
  try {
    stage = "parse-body";
    const body = await req.json();
    const {
      subject,
      background,
      placementReference,
      placementMask,
      format = "square",
    } = body as {
      subject?: string;
      background?: string;
      placementReference?: string;
      placementMask?: string;
      format?: "square" | "story" | "portrait";
    };

    if (!background || !placementReference || !placementMask) {
      return NextResponse.json(
        { error: "Missing required fields: background, placementReference, placementMask." },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Login required for DJ scene bake." }, { status: 401 });
    }

    stage = "auth";
    const authClient = supabaseAuth();
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const snapshot = await getAccessSnapshotForUser(admin, userData.user.id);
    if (!snapshot || snapshot.status === "inactive") {
      return NextResponse.json(
        { error: "Paid access required for DJ scene bake." },
        { status: 403 }
      );
    }

    const quotaMeta = {
      generation_limit: snapshot.generationLimit,
      generation_used: snapshot.generationUsed,
      generation_remaining: snapshot.generationRemaining,
    };

    const sizeW = 1024;
    const sizeH = format === "story" ? 1792 : format === "portrait" ? 1280 : 1024;

    stage = "load";
    const [backgroundBuf, placementReferenceBuf, placementMaskBuf, subjectBuf] = await Promise.all([
      sharp(await toBufferFromAnyImage(background))
        .resize(sizeW, sizeH, { fit: "cover" })
        .png()
        .toBuffer(),
      sharp(await toBufferFromAnyImage(placementReference))
        .resize(sizeW, sizeH, { fit: "cover" })
        .png()
        .toBuffer(),
      sharp(await toBufferFromAnyImage(placementMask))
        .resize(sizeW, sizeH, { fit: "cover" })
        .grayscale()
        .png()
        .toBuffer(),
      subject
        ? sharp(await toBufferFromAnyImage(subject))
            .png()
            .toBuffer()
        : Promise.resolve<Buffer | null>(null),
    ]);

    stage = "subject-isolation";
    const placedSubjectFromSnapshotBuf = await buildMaskedSubjectImage(
      placementReferenceBuf,
      placementMaskBuf
    );
    const renderedSubject = subjectBuf
      ? await renderPlacedSubjectFromSource(subjectBuf, placementMaskBuf, sizeW, sizeH)
      : null;
    const placedSubjectBuf = placedSubjectFromSnapshotBuf;
    const subjectLightingMaskBuf = placementMaskBuf;
    const subjectAnalysisMaskBuf = renderedSubject?.placedMaskBuf || placementMaskBuf;
    const subjectAnalysisBuf = renderedSubject?.placedSubjectBuf || placedSubjectBuf;

    stage = "masks";
    const { ringMask, shadowMask, innerSpillMask } = await buildIntegrationMasks(placementMaskBuf);
    const { lightSide, highlightColor, sideContrast } = await detectSceneLighting(
      backgroundBuf,
      subjectLightingMaskBuf
    );
    const { subjectHighlightMask, subjectShadowMask } = await buildDirectionalSubjectMasks(
      subjectLightingMaskBuf,
      lightSide
    );
    const luminance = await computeSceneLuminance(backgroundBuf);
    const subjectLuminance = await computeMaskedLuminance(
      subjectAnalysisBuf,
      subjectAnalysisMaskBuf
    );
    const highlightLuminance = luminanceOfColor(highlightColor);
    const sceneIsDark = luminance < 88;
    const shadowOpacity = sceneIsDark ? 0.34 : luminance < 138 ? 0.24 : 0.16;
    const ringDarkOpacity = sceneIsDark ? 0.18 : luminance < 138 ? 0.12 : 0.08;
    const wrapOpacity = sceneIsDark ? 0.18 : luminance < 138 ? 0.14 : 0.11;
    const spillOpacity = sceneIsDark ? 0.12 : luminance < 138 ? 0.1 : 0.08;
    const subjectHighlightOpacity = sideContrast > 26
      ? sceneIsDark ? 0.48 : luminance < 138 ? 0.42 : 0.34
      : sceneIsDark ? 0.4 : luminance < 138 ? 0.34 : 0.28;
    const subjectShadowOpacity = sideContrast > 26
      ? sceneIsDark ? 0.26 : luminance < 138 ? 0.22 : 0.18
      : sceneIsDark ? 0.22 : luminance < 138 ? 0.18 : 0.14;
    const subjectHighlightOverlayOpacity = sideContrast > 26 ? 0.22 : 0.16;
    const highlightDelta = highlightLuminance - subjectLuminance;
    const subjectBrightness = Math.max(
      0.92,
      Math.min(1.42, 1 + highlightDelta / 255 * (sideContrast > 26 ? 0.7 : 0.46))
    );
    const subjectSaturation = sceneIsDark ? 1.04 : luminance < 138 ? 1.08 : 1.12;

    stage = "overlays";
    const backgroundWrapSource = await sharp(backgroundBuf).blur(14).png().toBuffer();
    const backgroundSpillSource = await sharp(backgroundBuf).blur(22).png().toBuffer();
    const litSubjectBase = await sharp(placedSubjectBuf)
      .modulate({
        brightness: subjectBrightness,
        saturation: subjectSaturation,
      })
      .png()
      .toBuffer();
    const edgeWrapOverlay = await buildAlphaOverlay(backgroundWrapSource, ringMask, wrapOpacity);
    const subjectSpillOverlay = await buildAlphaOverlay(
      backgroundSpillSource,
      innerSpillMask,
      spillOpacity
    );
    const subjectHighlightOverlay = await buildColorOverlay(
      sizeW,
      sizeH,
      subjectHighlightMask,
      subjectHighlightOpacity,
      highlightColor
    );
    const subjectHighlightOverlayStrong = await buildColorOverlay(
      sizeW,
      sizeH,
      subjectHighlightMask,
      subjectHighlightOverlayOpacity,
      mixColor(highlightColor, { r: 255, g: 250, b: 244 }, 0.58)
    );
    const ringDarkOverlay = await buildBlackOverlay(sizeW, sizeH, ringMask, ringDarkOpacity);
    const shadowOverlay = await buildBlackOverlay(sizeW, sizeH, shadowMask, shadowOpacity);
    const subjectShadowOverlay = await buildBlackOverlay(
      sizeW,
      sizeH,
      subjectShadowMask,
      subjectShadowOpacity
    );
    const litSubjectBuf = await sharp(litSubjectBase)
      .composite([
        { input: subjectShadowOverlay, blend: "multiply" },
        { input: subjectSpillOverlay, blend: "soft-light" },
        { input: subjectHighlightOverlay, blend: "overlay" },
        { input: subjectHighlightOverlayStrong, blend: "screen" },
      ])
      .png()
      .toBuffer();

    stage = "compose";
    const output = await sharp(backgroundBuf)
      .composite([
        { input: litSubjectBuf },
        { input: shadowOverlay, blend: "multiply" },
        { input: ringDarkOverlay, blend: "multiply" },
        { input: edgeWrapOverlay, blend: "screen" },
      ])
      .png()
      .toBuffer();

    return NextResponse.json({
      url: bufferToDataUrlPng(output),
      format,
      style: "club",
      deterministic: true,
      ...quotaMeta,
    });
  } catch (err: any) {
    const message = err?.message || String(err);
    console.error("DJ SCENE BAKE ERROR:", { stage, message, err });
    return NextResponse.json(
      {
        error: message,
        debug: {
          stage,
          name: err?.name,
          stack: err?.stack,
        },
      },
      { status: 500 }
    );
  }
}
