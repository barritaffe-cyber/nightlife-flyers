// /app/types/emoji.ts

export type Emoji = {
  id: string;
  kind: 'emoji' | 'flare' | 'sticker';
  char: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  locked: boolean;
  opacity: number;
  tint?: number;        // hue-rotate degrees for tinting (optional)
  label?: string;       // optional on-canvas label for stickers/flares
  showLabel?: boolean;
  labelBg?: boolean;
  labelSize?: number;
  labelLineHeight?: number;
  labelColor?: string;
  tintMode?: "hue" | "colorize";

  // Optional fields for library assets (stickers/flares/images)
  url?: string;          // image source for stickers/flares
  isFlare?: boolean;     // treat as flare (screen blend, no cleanup)
  isSticker?: boolean;   // treat as sticker/graphic
  isTexture?: boolean;   // treat as palette-tintable texture/strip
  isNightlifeGraphic?: boolean; // use alpha-bounds and editor behavior for app vector graphics
  isExtracted?: boolean;  // treat as an extracted foreground subject/cutout
  isShapeGraphic?: boolean;
  blendMode?: string;    // css mix-blend-mode
  svgTemplate?: string;  // svg template with {{COLOR}} token (optional)
  iconColor?: string;    // initial svg stroke color (optional)
  shapeKind?: string;
  shapeGradient?: boolean;
  shapeLength?: number;
  shapeSkew?: number;
  isSeparator?: boolean;
  separatorKind?: string;
  separatorWidth?: number;
  separatorOffset?: number;
  paletteRole?: 'base' | 'primary' | 'secondary' | 'accent' | 'neutral';
  layerOffset?: number;  // per-item z-order nudge
  shadowBlur?: number;
  shadowAlpha?: number;
  blur?: number;
  hitTestMode?: "alpha-bounds";
};
