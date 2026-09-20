import { useEffect, useRef, useState } from 'react';

/** Anchor to painted pixels on K's upper outline, including script fonts. */
export function HeadlineGlint({ id, text, fontSize, family, tracking, weight = 400, fontStyle = 'normal' }: {
  id: string; text: string; fontSize: number; family: string; tracking: number; weight?: number | string; fontStyle?: string;
}) {
  const ref = useRef<SVGGElement>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setPoint(null);
    const font = `${fontStyle} ${weight} ${fontSize}px ${family}`;
    document.fonts.load(font, text).then(() => document.fonts.ready).then(() => {
      if (cancelled) return;
      const glyphs = ref.current?.ownerSVGElement?.querySelector('mask text') as SVGTextElement | null;
      const rendered = glyphs?.textContent || text;
      const index = Math.max(rendered.lastIndexOf('K'), rendered.lastIndexOf('k'));
      if (!glyphs || index < 0 || index >= glyphs.getNumberOfChars()) { setPoint(null); return; }
      const start = glyphs.getStartPositionOfChar(index);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.font = font;
      const metrics = context.measureText(rendered[index]);
      const pad = 4;
      canvas.width = Math.ceil(metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) + pad * 2;
      canvas.height = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + pad * 2;
      context.font = font;
      const originX = pad + metrics.actualBoundingBoxLeft;
      const baseline = pad + metrics.actualBoundingBoxAscent;
      context.fillText(rendered[index], originX, baseline);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      // Find the uppermost ink, then a stable point near the left stem in that row.
      for (let y = 0; y < canvas.height; y++) {
        const xs: number[] = [];
        for (let x = 0; x < canvas.width; x++) if (pixels[(y * canvas.width + x) * 4 + 3] >= 128) xs.push(x);
        if (!xs.length) continue;
        const target = canvas.width * .35;
        const x = xs.reduce((best, candidate) => Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best);
        setPoint({ x: start.x + x - originX, y: start.y + y - baseline });
        break;
      }
    }).catch(() => { if (!cancelled) setPoint(null); });
    return () => { cancelled = true; };
  }, [text, fontSize, family, tracking, weight, fontStyle]);
  const r = fontSize * .17;
  return <g ref={ref} data-headline-specular-glint="true" pointerEvents="none">
    <defs>
      <radialGradient id={`${id}-glint-halo`}>
        <stop offset="0" stopColor="#fffdf3" stopOpacity=".95" />
        <stop offset=".16" stopColor="#ffe1a0" stopOpacity=".65" />
        <stop offset="1" stopColor="#ffb95e" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-glint-ray`}>
        <stop offset="0" stopColor="#fff" />
        <stop offset=".2" stopColor="#fff8dc" />
        <stop offset="1" stopColor="#ffd894" stopOpacity="0" />
      </radialGradient>
    </defs>
    {point && <g transform={`translate(${point.x} ${point.y})`}>
      <circle r={r} fill={`url(#${id}-glint-halo)`} opacity=".22" />
      <path d={`M ${-r} 0 L -1 -.65 L 0 ${-r*.8} L 1 -.65 L ${r} 0 L 1 .65 L 0 ${r*.8} L -1 .65 Z`} fill={`url(#${id}-glint-ray)`} />
      <path d={`M ${-r*.8} 0 L -.5 -.4 L 0 ${-r*.65} L .5 -.4 L ${r*.8} 0 L .5 .4 L 0 ${r*.65} L -.5 .4 Z`} transform="rotate(-42)" fill={`url(#${id}-glint-ray)`} opacity=".75" />
      <circle r={fontSize*.008} fill="#fffef6" />
    </g>}
  </g>;
}
