export type ShapeGraphic = {
  id: string;
  label: string;
};

export const SHAPE_GRAPHICS: ReadonlyArray<ShapeGraphic> = [
  { id: "shape_square", label: "Square" },
  { id: "shape_circle", label: "Circle" },
] as const;

export function buildShapeSvgMarkup(kind: string, color: string, gradient = true): string {
  const viewBox = "0 0 256 256";

  switch (kind) {
    case "shape_square":
      return gradient
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${viewBox}" preserveAspectRatio="none" fill="none"><defs><linearGradient id="shapeFade" x1="0" y1="0.5" x2="1" y2="0.5"><stop offset="0%" stop-color="${color}" stop-opacity="1"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><rect x="0" y="0" width="256" height="256" fill="url(#shapeFade)"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${viewBox}" preserveAspectRatio="none" fill="none"><rect x="0" y="0" width="256" height="256" fill="${color}"/></svg>`;
    case "shape_circle":
      return gradient
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${viewBox}" preserveAspectRatio="none" fill="none"><defs><radialGradient id="shapeFade" cx="50%" cy="50%" r="50%"><stop offset="20%" stop-color="${color}" stop-opacity="1"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="128" cy="128" r="128" fill="url(#shapeFade)"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${viewBox}" preserveAspectRatio="none" fill="none"><circle cx="128" cy="128" r="128" fill="${color}"/></svg>`;
    default:
      return gradient
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${viewBox}" preserveAspectRatio="none" fill="none"><defs><linearGradient id="shapeFade" x1="0" y1="0.5" x2="1" y2="0.5"><stop offset="0%" stop-color="${color}" stop-opacity="1"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><rect x="0" y="0" width="256" height="256" fill="url(#shapeFade)"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="${viewBox}" preserveAspectRatio="none" fill="none"><rect x="0" y="0" width="256" height="256" fill="${color}"/></svg>`;
  }
}

export function buildShapeSvgDataUrl(kind: string, color: string, gradient = true): string {
  const svg = buildShapeSvgMarkup(kind, color, gradient);
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
