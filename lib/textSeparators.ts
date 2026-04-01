export type TextSeparatorGraphic = {
  id: string;
  label: string;
};

export const TEXT_SEPARATOR_GRAPHICS: ReadonlyArray<TextSeparatorGraphic> = [
  { id: "divider_diamond", label: "Diamond Divider" },
  { id: "divider_dots", label: "Dot Divider" },
  { id: "divider_banner", label: "Banner Divider" },
  { id: "divider_brackets", label: "Bracket Divider" },
  { id: "divider_chevrons", label: "Chevron Divider" },
] as const;

export function buildSeparatorSvgMarkup(
  kind: string,
  color: string,
  width: number,
  offset = 0
): string {
  const w = Math.max(128, Math.round(width));
  const h = 128;
  const outerPad = 10;
  const motifHalf =
    kind === "divider_chevrons" ? 30 :
    kind === "divider_banner" ? 26 :
    kind === "divider_dots" ? 24 :
    24;
  const safeOffset = Math.max(
    -(w / 2 - outerPad - motifHalf - 8),
    Math.min(w / 2 - outerPad - motifHalf - 8, Number(offset) || 0)
  );
  const cx = w / 2 + safeOffset;
  const nearPad = kind === "divider_diamond" ? 18 : motifHalf;
  const leftOuter = outerPad;
  const rightOuter = w - outerPad;
  const leftInner = cx - nearPad;
  const rightInner = cx + nearPad;

  let paths: string[] = [];
  switch (kind) {
    case "divider_diamond":
      paths = [
        `M${leftOuter} 64H${leftInner}`,
        `M${rightInner} 64H${rightOuter}`,
        `M${cx} 46L${cx + 18} 64L${cx} 82L${cx - 18} 64Z`,
      ];
      break;
    case "divider_dots":
      paths = [
        `M${leftOuter} 64H${cx - 24}`,
        `M${cx + 24} 64H${rightOuter}`,
        `M${cx - 18} 64A4 4 0 1 0 ${cx - 18.01} 64Z`,
        `M${cx} 64A6 6 0 1 0 ${cx - 0.01} 64Z`,
        `M${cx + 18} 64A4 4 0 1 0 ${cx + 17.99} 64Z`,
      ];
      break;
    case "divider_banner":
      paths = [
        `M${leftOuter} 64H${cx - 26}`,
        `M${cx + 26} 64H${rightOuter}`,
        `M${cx - 26} 64L${cx - 12} 50H${cx + 12}L${cx + 26} 64L${cx + 12} 78H${cx - 12}Z`,
      ];
      break;
    case "divider_brackets":
      paths = [
        `M${leftOuter} 64H${cx - 24}`,
        `M${cx + 24} 64H${rightOuter}`,
        `M${cx - 24} 64C${cx - 16} 64 ${cx - 14} 56 ${cx - 6} 56`,
        `M${cx + 6} 56C${cx + 14} 56 ${cx + 16} 64 ${cx + 24} 64`,
        `M${cx - 24} 64C${cx - 16} 64 ${cx - 14} 72 ${cx - 6} 72`,
        `M${cx + 6} 72C${cx + 14} 72 ${cx + 16} 64 ${cx + 24} 64`,
      ];
      break;
    case "divider_chevrons":
      paths = [
        `M${leftOuter} 64H${cx - 30}`,
        `M${cx + 30} 64H${rightOuter}`,
        `M${cx - 30} 64L${cx - 14} 52L${cx} 64L${cx + 14} 52L${cx + 30} 64`,
        `M${cx - 30} 64L${cx - 14} 76L${cx} 64L${cx + 14} 76L${cx + 30} 64`,
      ];
      break;
    default:
      paths = [
        `M${leftOuter} 64H${leftInner}`,
        `M${rightInner} 64H${rightOuter}`,
      ];
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${paths
    .map((d) => `<path d="${d}"/>`)
    .join("")}</svg>`;
}

export function buildSeparatorSvgDataUrl(
  kind: string,
  color: string,
  width: number,
  offset = 0
): string {
  const svg = buildSeparatorSvgMarkup(kind, color, width, offset);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
