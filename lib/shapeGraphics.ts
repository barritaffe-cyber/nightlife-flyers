export type ShapeGraphic = {
  id: string;
  label: string;
};

export const SHAPE_GRAPHICS: ReadonlyArray<ShapeGraphic> = [
  { id: "shape_square", label: "Square" },
  { id: "shape_circle", label: "Circle" },
] as const;

export function buildShapeSvgMarkup(kind: string, color: string): string {
  const viewBox = "0 0 256 256";

  switch (kind) {
    case "shape_square":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${viewBox}" preserveAspectRatio="none" fill="none"><rect x="0" y="0" width="256" height="256" fill="${color}"/></svg>`;
    case "shape_circle":
      return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${viewBox}" preserveAspectRatio="none" fill="none"><circle cx="128" cy="128" r="128" fill="${color}"/></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${viewBox}" preserveAspectRatio="none" fill="none"><rect x="0" y="0" width="256" height="256" fill="${color}"/></svg>`;
  }
}

export function buildShapeSvgDataUrl(kind: string, color: string): string {
  const svg = buildShapeSvgMarkup(kind, color);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
