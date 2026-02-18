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
  labelColor?: string;
  tintMode?: "hue" | "colorize";

  // Optional fields for library assets (stickers/flares/images)
  url?: string;          // image source for stickers/flares
  isFlare?: boolean;     // treat as flare (screen blend, no cleanup)
  isSticker?: boolean;   // treat as sticker/graphic
  blendMode?: string;    // css mix-blend-mode
  svgTemplate?: string;  // svg template with {{COLOR}} token (optional)
  iconColor?: string;    // initial svg stroke color (optional)
  layerOffset?: number;  // per-item z-order nudge
};
