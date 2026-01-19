export const canvasRefs = {
  // ROOT CANVAS WRAPPER
  root: null as HTMLDivElement | null,

  // TEXT BLOCKS
  headline: null as HTMLDivElement | null,
  headline2: null as HTMLDivElement | null,
  details: null as HTMLDivElement | null,
  details2: null as HTMLDivElement | null,
  venue: null as HTMLDivElement | null,
  subtag: null as HTMLDivElement | null,

  // SPECIAL ELEMENTS
  portrait: null as HTMLDivElement | null,
  logo: null as HTMLDivElement | null,

  // ICONS (4 slots)
  icon1: null as HTMLDivElement | null,
  icon2: null as HTMLDivElement | null,
  icon3: null as HTMLDivElement | null,
  icon4: null as HTMLDivElement | null,

  // MEASURING / BACKGROUND
  measure: null as HTMLHeadingElement | null,
  bgImage: null as HTMLImageElement | null,

  // ⭐ ADD THIS ⭐
  background: null as HTMLDivElement | null,

  // OPTIONAL LAYERS
  shapesLayer: null as SVGSVGElement | null,
  iconsLayer: null as HTMLDivElement | null,

  // === RUNTIME (non-React) DRAG CACHE ===
  bgPreview: null as { x: number; y: number } | null,
  bgRafId: null as number | null,

  portraitImgs: {} as Record<string, HTMLImageElement | null>,
};
