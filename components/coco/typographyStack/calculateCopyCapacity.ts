import type { SubjectCopyRole } from "../subjectGeometry/buildSubjectInteractionMap.ts";

export type CopyMeasureResult = {
  width: number;
  ascent?: number;
  descent?: number;
};

export type CopyCapacityResult = {
  role: SubjectCopyRole;
  fits: boolean;
  fontSize: number;
  lines: string[];
  lineCount: number;
  textWidth: number;
  textHeight: number;
  occupancy: number;
  breathingRoom: number;
  reason?: "empty-copy" | "below-minimum-size" | "too-many-lines";
};

export type CopyCapacityStyle = {
  fontFamily: string;
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic";
  letterSpacingEm?: number;
  letterSpacingPx?: number;
  lineHeight?: number;
  strokeWidth?: number;
  minFontSize?: number;
  maxFontSize?: number;
  maxLines?: number;
};

const ROLE_LIMITS: Record<
  SubjectCopyRole,
  { minSize: number; maxSize: number; maxLines: number }
> = {
  headline: { minSize: 28, maxSize: 180, maxLines: 3 },
  accent: { minSize: 13, maxSize: 72, maxLines: 2 },
  presenter: { minSize: 11, maxSize: 40, maxLines: 3 },
  details: { minSize: 10, maxSize: 34, maxLines: 6 },
  date: { minSize: 12, maxSize: 52, maxLines: 3 },
  price: { minSize: 14, maxSize: 64, maxLines: 3 },
  venue: { minSize: 10, maxSize: 38, maxLines: 3 },
  compliance: { minSize: 8, maxSize: 22, maxLines: 4 },
};

function measuredWidth(
  text: string,
  size: number,
  style: CopyCapacityStyle,
  measure: (text: string, size: number, style: CopyCapacityStyle) => CopyMeasureResult
) {
  const spacing = Math.max(0, text.length - 1) * Number(style.letterSpacingPx ?? 0);
  return measure(text || " ", size, style).width + spacing;
}

function splitLongToken(
  token: string,
  maxWidth: number,
  size: number,
  style: CopyCapacityStyle,
  measure: (text: string, size: number, style: CopyCapacityStyle) => CopyMeasureResult
) {
  const parts: string[] = [];
  let current = "";
  for (const character of token) {
    const next = current + character;
    if (current && measuredWidth(next, size, style, measure) > maxWidth) {
      parts.push(current);
      current = character;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapCopy(
  text: string,
  maxWidth: number,
  size: number,
  style: CopyCapacityStyle,
  measure: (text: string, size: number, style: CopyCapacityStyle) => CopyMeasureResult
) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n/)) {
    const tokens = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    let current = "";
    for (const token of tokens) {
      const pieces =
        measuredWidth(token, size, style, measure) > maxWidth
          ? splitLongToken(token, maxWidth, size, style, measure)
          : [token];
      for (const piece of pieces) {
        const next = current ? `${current} ${piece}` : piece;
        if (current && measuredWidth(next, size, style, measure) > maxWidth) {
          lines.push(current);
          current = piece;
        } else {
          current = next;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export function calculateCopyCapacity(input: {
  role: SubjectCopyRole;
  text: string;
  zone: { width: number; height: number };
  style: CopyCapacityStyle;
  measure: (text: string, size: number, style: CopyCapacityStyle) => CopyMeasureResult;
}): CopyCapacityResult {
  const text = input.text.trim();
  const limits = ROLE_LIMITS[input.role];
  const minSize = Math.max(1, input.style.minFontSize ?? limits.minSize);
  const maxSize = Math.max(minSize, input.style.maxFontSize ?? limits.maxSize);
  const maxLines = Math.max(1, input.style.maxLines ?? limits.maxLines);
  const lineHeight = Math.max(0.8, input.style.lineHeight ?? 1.05);
  const usableWidth = Math.max(1, input.zone.width * 0.9);
  const usableHeight = Math.max(1, input.zone.height * 0.86);

  if (!text) {
    return {
      role: input.role,
      fits: false,
      fontSize: 0,
      lines: [],
      lineCount: 0,
      textWidth: 0,
      textHeight: 0,
      occupancy: 0,
      breathingRoom: 1,
      reason: "empty-copy",
    };
  }

  const layoutAt = (size: number) => {
    const lines = wrapCopy(text, usableWidth, size, input.style, input.measure);
    const textWidth = Math.max(
      0,
      ...lines.map((line) => measuredWidth(line, size, input.style, input.measure))
    );
    const textHeight = lines.length * size * lineHeight;
    return {
      lines,
      textWidth,
      textHeight,
      fits: lines.length <= maxLines && textHeight <= usableHeight,
    };
  };

  const minimum = layoutAt(minSize);
  if (!minimum.fits) {
    return {
      role: input.role,
      fits: false,
      fontSize: minSize,
      lines: minimum.lines,
      lineCount: minimum.lines.length,
      textWidth: minimum.textWidth,
      textHeight: minimum.textHeight,
      occupancy: Math.min(
        1,
        minimum.textWidth * minimum.textHeight /
          Math.max(1, usableWidth * usableHeight)
      ),
      breathingRoom: 0,
      reason: minimum.lines.length > maxLines ? "too-many-lines" : "below-minimum-size",
    };
  }

  let low = minSize;
  let high = maxSize;
  let best = minimum;
  for (let iteration = 0; iteration < 12 && high - low > 0.25; iteration += 1) {
    const size = (low + high) / 2;
    const layout = layoutAt(size);
    if (layout.fits) {
      low = size;
      best = layout;
    } else {
      high = size;
    }
  }
  const fontSize = Math.floor(low * 10) / 10;
  best = layoutAt(fontSize);
  const widthUse = best.textWidth / usableWidth;
  const heightUse = best.textHeight / usableHeight;
  return {
    role: input.role,
    fits: true,
    fontSize,
    lines: best.lines,
    lineCount: best.lines.length,
    textWidth: best.textWidth,
    textHeight: best.textHeight,
    occupancy: Math.min(1, widthUse * heightUse),
    breathingRoom: Math.max(0, 1 - Math.max(widthUse, heightUse)),
  };
}
