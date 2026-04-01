"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Pt = { x: number; y: number };
type Fragment = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  delay: number;
  duration: number;
  size: number;
  spin: number;
  tint: "cyan" | "purple";
};

const LOOP_MS = 2200;

function clamp(v: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number) {
  const c = clamp(t);
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

function wrap01(t: number) {
  return ((t % 1) + 1) % 1;
}

function gaussPulse(t: number, center: number, width: number) {
  const d = (t - center) / Math.max(1e-6, width);
  return Math.exp(-d * d);
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePolyline(points: Pt[], count: number): Pt[] {
  if (points.length < 2 || count < 2) return points.slice();

  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.hypot(dx, dy);
    segLens.push(len);
    total += len;
  }
  if (total <= 1e-6) return Array.from({ length: count }, () => ({ ...points[0] }));

  const out: Pt[] = [];
  for (let i = 0; i < count; i += 1) {
    const dist = (i / (count - 1)) * total;
    let run = 0;
    let seg = 0;
    while (seg < segLens.length - 1 && run + segLens[seg] < dist) {
      run += segLens[seg];
      seg += 1;
    }
    const segLen = Math.max(1e-6, segLens[seg]);
    const local = clamp((dist - run) / segLen);
    const a = points[seg];
    const b = points[seg + 1];
    out.push({ x: lerp(a.x, b.x, local), y: lerp(a.y, b.y, local) });
  }
  return out;
}

function createFragments(seed: number, count: number, targets: Pt[]): Fragment[] {
  const rnd = mulberry32(seed);
  const frags: Fragment[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = targets[Math.floor(rnd() * targets.length)] ?? { x: 0.5, y: 0.5 };
    const side = Math.floor(rnd() * 4);
    let sx = rnd();
    let sy = rnd();
    if (side === 0) {
      sx = -0.2 - rnd() * 0.15;
    } else if (side === 1) {
      sx = 1.2 + rnd() * 0.15;
    } else if (side === 2) {
      sy = -0.2 - rnd() * 0.15;
    } else {
      sy = 1.2 + rnd() * 0.15;
    }

    frags.push({
      sx,
      sy,
      tx: t.x + (rnd() - 0.5) * 0.03,
      ty: t.y + (rnd() - 0.5) * 0.03,
      delay: 0.16 + rnd() * 0.28,
      duration: 0.12 + rnd() * 0.2,
      size: 1.5 + rnd() * 6.5,
      spin: (rnd() - 0.5) * 18,
      tint: rnd() > 0.5 ? "cyan" : "purple",
    });
  }
  return frags;
}

function drawNeonStroke(ctx: CanvasRenderingContext2D, pts: Pt[], w: number, h: number, width: number, alpha: number) {
  if (pts.length < 2) return;
  const grad = ctx.createLinearGradient(0.25 * w, 0.2 * h, 0.75 * w, 0.78 * h);
  grad.addColorStop(0, "#22d3ee");
  grad.addColorStop(0.55, "#60a5fa");
  grad.addColorStop(1, "#a855f7");

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(pts[0].x * w, pts[0].y * h);
  for (let i = 1; i < pts.length; i += 1) {
    ctx.lineTo(pts[i].x * w, pts[i].y * h);
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = grad;

  ctx.shadowColor = "rgba(168,85,247,0.85)";
  ctx.shadowBlur = width * 3.4;
  ctx.lineWidth = width * 1.8;
  ctx.stroke();

  ctx.shadowColor = "rgba(34,211,238,0.9)";
  ctx.shadowBlur = width * 2.2;
  ctx.lineWidth = width * 1.1;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function drawTrimmedSegment(
  ctx: CanvasRenderingContext2D,
  a: Pt,
  b: Pt,
  t: number,
  w: number,
  h: number,
  width: number,
  alpha: number
) {
  const p = clamp(t);
  if (p <= 0) return;
  const x2 = lerp(a.x, b.x, p);
  const y2 = lerp(a.y, b.y, p);
  drawNeonStroke(
    ctx,
    [
      { x: a.x, y: a.y },
      { x: x2, y: y2 },
    ],
    w,
    h,
    width,
    alpha
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tRaw: number,
  startPts: Pt[],
  endPts: Pt[],
  fragments: Fragment[],
  sceneAlpha: number
) {
  const t = wrap01(tRaw);
  const cx = w * 0.5;
  const cy = h * 0.5;
  const baseWidth = Math.min(w, h) * 0.013;

  const morph = smoothstep(0.1, 0.44, t);
  const pulse = gaussPulse(t, 0.08, 0.055);
  const ring = smoothstep(0.34, 0.7, t);
  const bar1 = smoothstep(0.38, 0.53, t);
  const bar2 = smoothstep(0.46, 0.62, t);

  const pts = startPts.map((p, i) => ({
    x: lerp(p.x, endPts[i].x, morph),
    y: lerp(p.y, endPts[i].y, morph),
  }));

  drawNeonStroke(ctx, pts, w, h, baseWidth * (1 + pulse * 0.5), sceneAlpha);

  const fBarTopA = { x: 0.584, y: 0.364 };
  const fBarTopB = { x: 0.692, y: 0.337 };
  const fBarMidA = { x: 0.565, y: 0.457 };
  const fBarMidB = { x: 0.668, y: 0.426 };
  drawTrimmedSegment(ctx, fBarTopA, fBarTopB, bar1, w, h, baseWidth * 0.82, sceneAlpha * 0.95);
  drawTrimmedSegment(ctx, fBarMidA, fBarMidB, bar2, w, h, baseWidth * 0.76, sceneAlpha * 0.9);

  if (ring > 0.001) {
    ctx.save();
    ctx.globalAlpha = sceneAlpha * (0.66 + 0.34 * ring);
    const radius = Math.min(w, h) * 0.296;
    const startAngle = -Math.PI * 0.5;
    const endAngle = startAngle + Math.PI * 2 * ring;
    const ringWidth = baseWidth * 0.88;

    const ringGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    ringGrad.addColorStop(0, "#22d3ee");
    ringGrad.addColorStop(0.5, "#60a5fa");
    ringGrad.addColorStop(1, "#a855f7");

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = ringGrad;
    ctx.lineCap = "round";
    ctx.lineWidth = ringWidth * 1.9;
    ctx.shadowColor = "rgba(34,211,238,0.9)";
    ctx.shadowBlur = ringWidth * 3.1;
    ctx.stroke();

    ctx.lineWidth = ringWidth;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  }

  const fragRamp = smoothstep(0.15, 0.4, t) * (1 - smoothstep(0.7, 0.93, t));
  if (fragRamp > 0.001) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const f of fragments) {
      const p = clamp((t - f.delay) / f.duration);
      if (p <= 0 || p >= 1) continue;
      const e = easeOutCubic(p);
      const x = lerp(f.sx, f.tx, e) * w;
      const y = lerp(f.sy, f.ty, e) * h;
      const alpha = (1 - p) * fragRamp * sceneAlpha * 0.95;
      if (alpha <= 0.01) continue;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((f.spin * (1 - p) * Math.PI) / 180);
      ctx.fillStyle = f.tint === "cyan" ? `rgba(34,211,238,${alpha})` : `rgba(168,85,247,${alpha})`;
      const s = f.size * (1 - p * 0.16);
      ctx.fillRect(-s * 0.65, -s * 0.2, s * 1.3, s * 0.4);
      ctx.restore();
    }
    ctx.restore();
  }

  const glitch = gaussPulse(t, 0.48, 0.017) + gaussPulse(t, 0.67, 0.02) + gaussPulse(t, 0.84, 0.015);
  if (glitch > 0.002) {
    const jitterX = (Math.sin(t * 930) + Math.cos(t * 610)) * 7.5 * glitch;
    const jitterY = Math.sin(t * 780) * 3.6 * glitch;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(0.9, glitch * 0.7) * sceneAlpha;
    ctx.translate(jitterX, jitterY);
    drawNeonStroke(ctx, pts, w, h, baseWidth * 0.78, 0.8);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = Math.min(0.32, glitch * 0.25) * sceneAlpha;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    const rows = 7;
    for (let i = 0; i < rows; i += 1) {
      const y = (0.26 + i * 0.078 + Math.sin((t + i) * 85) * 0.004) * h;
      ctx.fillRect(w * 0.24, y, w * 0.52, 1.5);
    }
    ctx.restore();
  }
}

export default function LogoAnimationPage() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    const start = performance.now();
    let width = 0;
    let height = 0;
    let dpr = 1;

    let startPts: Pt[] = [];
    let endPts: Pt[] = [];
    let fragments: Fragment[] = [];

    const baseLine = samplePolyline(
      [
        { x: 0.32, y: 0.505 },
        { x: 0.68, y: 0.505 },
      ],
      160
    );

    const nfPath = samplePolyline(
      [
        { x: 0.395, y: 0.69 },
        { x: 0.446, y: 0.385 },
        { x: 0.534, y: 0.635 },
        { x: 0.592, y: 0.322 },
        { x: 0.688, y: 0.286 },
      ],
      160
    );

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      startPts = baseLine;
      endPts = nfPath;
      fragments = createFragments(1701, 96, endPts);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    const frame = (now: number) => {
      const local = wrap01((now - start) / LOOP_MS);

      ctx.fillStyle = "rgb(0,0,0)";
      ctx.fillRect(0, 0, width, height);

      const samples = [
        { dt: 0, a: 1 },
        { dt: -0.012, a: 0.25 },
        { dt: -0.024, a: 0.12 },
      ];
      for (const s of samples) {
        drawScene(ctx, width, height, local + s.dt, startPts, endPts, fragments, s.a);
      }

      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,transparent_40%,rgba(0,0,0,0.58)_100%)]" />

      <div className="relative z-10 flex items-start justify-between p-4 sm:p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/45 px-3 py-1.5 text-xs text-white/85 backdrop-blur"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <div className="rounded-md border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/75 backdrop-blur">
          NF Monogram Prototype
        </div>
      </div>
    </main>
  );
}
