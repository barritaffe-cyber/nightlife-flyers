'use client';
import { useEffect, useState } from 'react';
import { cocoDjFrameLayout, cocoDjFrameRuns, type CocoDjFrameSource, type CocoFrameTextRun } from '../../lib/coco/djFrameLayout';

const font = (run: CocoFrameTextRun) => {
  const family = /[()\d]/.test(run.family) && !/^["']/.test(run.family) ? JSON.stringify(run.family) : run.family;
  return `${run.style} ${run.weight} ${run.size}px ${family}`;
};
let measureContext: CanvasRenderingContext2D | null = null;

export function useCocoDjFrameLayout(source: CocoDjFrameSource) {
  const [, refresh] = useState(0);
  const fontKey = JSON.stringify(cocoDjFrameRuns(source).map(run => [font(run), run.text]));
  useEffect(() => {
    let active = true;
    const fonts: [string, string][] = JSON.parse(fontKey);
    if (fonts.length) void Promise.all(fonts.map(([css, text]) => document.fonts.load(css, text || 'DJ')))
      .then(() => { if (active) refresh(n => n + 1); }).catch(() => {});
    return () => { active = false; };
  }, [fontKey]);
  return cocoDjFrameLayout(source, (run, line) => {
    if (!measureContext && typeof document !== 'undefined') measureContext = document.createElement('canvas').getContext('2d');
    if (measureContext) measureContext.font = font(run);
    const metrics = measureContext?.measureText(line);
    const ink = metrics ? Math.max(metrics.width, metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) : line.length * run.size * .6;
    return Math.max(0, ink + Math.max(0, Array.from(line).length - 1) * run.tracking * run.size);
  });
}
