'use client';

/* ===== BLOCK: IMPORTS (BEGIN) ===== */
import StartupTemplates from "../components/ui/StartupTemplates";
import * as htmlToImage from 'html-to-image';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from "react-dom";
import { TEMPLATE_GALLERY } from '../lib/templates';
import type { TemplateSpec } from '../lib/templates';
import { motion, AnimatePresence } from "framer-motion"; 
import { alignHeadline } from "../lib/alignHeadline";
import { isActiveUtil } from '../lib/isActiveUtil';
import { sharedRootRef, setRootRef } from "../lib/rootRefUtil";
import { getRootRef } from "../lib/rootRefUtil";
import { useFlyerState, type Format } from "../app/state/flyerState";
import type { Emoji } from "../app/types/emoji";
import { canvasRefs } from "../lib/canvasRefs";
import type { TemplateBase } from "../lib/templates";
import type { MoveTarget } from "../app/state/flyerState";
import { removeBackgroundLocal } from "../lib/removeBgLocal";
import { cleanupCutoutUrl } from "../lib/cleanupCutoutUrl";
import * as Slider from "@radix-ui/react-slider";
import type { CleanupParams } from "../lib/cleanupCutoutUrl";
import { removeGreenScreen } from "./chromaKey";





/* ==========================================================================
   SLIDER ROW (Single Source of Truth)
   - Emits a NUMBER (never an event)
   - Guards NaN/undefined
   - Optional precision display
   - Optional disabled
   - Stops bubbling so panels don’t collapse / canvas doesn’t steal clicks
   ========================================================================== */

type SliderRowProps = {
  label: string;
  value?: number;
  min: number;
  max: number;
  step?: number;
  precision?: number; // if provided, uses toFixed(precision)
  disabled?: boolean;
  onChange: (v: number) => void;
};

function SliderRow({
  label,
  value,
  min,
  max,
  step = 0.05,
  precision,
  disabled = false,
  onChange,
}: SliderRowProps) {
  const safeValue = Number.isFinite(value) ? (value as number) : min;

  const displayValue =
    precision != null ? safeValue.toFixed(precision) : String(Math.round(safeValue * 100) / 100);

  return (
    <div
      className="select-none py-2"
      onMouseDownCapture={(e) => e.stopPropagation()}
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-400 px-0.5">
        <span>{label}</span>
        <span className="font-mono text-neutral-300">{displayValue}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1 rounded-lg appearance-none cursor-pointer transition-colors ${
          disabled
            ? "bg-neutral-800 accent-neutral-600"
            : "bg-neutral-700 accent-indigo-500 hover:accent-indigo-400"
        }`}
      />
    </div>
  );
}



type TemplateWithFormats = TemplateSpec & {
  formats?: Record<string, TemplateBase>;
};

// ——— Template variant resolver (square/story with fallbacks) ———
function getVariant(tpl: TemplateSpec, fmt: Format) {
  const withFormats = tpl as TemplateWithFormats;
  // prefer explicit format, then square fallback, then base
  return withFormats.formats?.[fmt]
      ?? withFormats.formats?.square
      ?? tpl.base
      ?? null;
}

import { loadTemplate } from '../lib/template-utils';

import {
  HEADLINE_FONTS_LOCAL,
  HEADLINE2_FONTS_LOCAL,
  BODY_FONTS_LOCAL,
  BODY_FONTS2_LOCAL,
  VENUE_FONTS_LOCAL,
  SUBTAG_FONTS_LOCAL,
} from '../lib/fonts';

// === DRAG PERFORMANCE REFS ===

// === FONT LOAD HELPER (LOCAL VERSION) ===============================
async function ensureFontLoaded(name: string) {
  try {
    // Wait until browser registers all @font-face rules
    await (document as any).fonts?.ready;
    // Try loading the font explicitly at a small size (helps Safari)
    await (document as any).fonts?.load?.(`400 16px "${name}"`);
  } catch {
    // Silently fail — browser will fall back gracefully
  }
}

/* ===== BLOCK: IMPORTS (END) ===== */

// === GOOGLE FONTS INLINE + LOAD HELPERS (for export) (BEGIN) =======================
async function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(b);
  });
}

/** Ensure the given families are actually loaded before we rasterize. */
async function waitForFamilies(
  families: (string | undefined)[],
  timeoutMs = 7000
): Promise<void> {
  const used = Array.from(new Set(families.filter(Boolean) as string[]));
  const deadline = Date.now() + timeoutMs;

  // First, wait for any pending font loads globally.
  try { await (document as any).fonts?.ready; } catch {}

  // Then explicitly request each family at a few representative sizes/weights.
  for (const fam of used) {
    const faces = [
      `400 16px "${fam}"`,
      `700 32px "${fam}"`,
      `900 48px "${fam}"`,
    ];
    for (const desc of faces) {
      try {
        const p = (document as any).fonts?.load
          ? (document as any).fonts.load(desc)
          : Promise.resolve();
        // Simple timeout guard so we don't hang forever
        const remaining = Math.max(0, deadline - Date.now());
        await Promise.race([
          p,
          new Promise((r) => setTimeout(r, Math.min(remaining, 1500))),
        ]);
      } catch {}
    }
  }
}

// ===== CLIENT REMOVE-BG (module scope) =====
function dataURLToBlob(dataURL: string): Blob {
  function blobToDataURL(b: Blob): Promise<string> {
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.readAsDataURL(b);
  });
}

  const [head, b64] = dataURL.split(',');
  const mime = head.match(/data:(.*);base64/)?.[1] || 'image/png';
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

/** Sends the image to /api/remove-bg and returns a transparent PNG dataURL */
async function removePortraitBackgroundFromURL(url: string): Promise<string> {
  const blob = url.startsWith('data:')
    ? dataURLToBlob(url)
    : await (await fetch(url, { cache: 'no-store' })).blob();

  const fd = new FormData();
  fd.append('image', blob, 'image.png');

  const r = await fetch('/api/remove-bg', { method: 'POST', body: fd });
  if (!r.ok) throw new Error(await r.text());

  const out = await r.blob();
  return await new Promise<string>((res) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.readAsDataURL(out);
  });
}
// ===== /CLIENT REMOVE-BG =====


/* ===== DECOR (global ambience) ===== */
function DecorBg() {
  return (
    
    <>
      {/* diagonal glows */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(1200px 800px at 80% -10%, rgba(99,102,241,0.18), transparent 60%),
            radial-gradient(900px 700px at 0% 110%, rgba(236,72,153,0.15), transparent 55%),
            linear-gradient(180deg, rgba(0,0,0,.0), rgba(0,0,0,.25))
          `,
          backgroundColor: '#0a0a0c'
        }}
      />
      {/* ultra-light noise */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,\
              <svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\' viewBox=\'0 0 160 160\'>\
                <filter id=\'n\'>\
                  <feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/>\
                  <feColorMatrix type=\'saturate\' values=\'0\'/>\
                  <feComponentTransfer><feFuncA type=\'linear\' slope=\'0.25\'/></feComponentTransfer>\
                </filter>\
                <rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/>\
              </svg>")',
          backgroundSize: '160px 160px'
        }}
      />
    </>
  );
}


// ===== SHARED STYLES (TOP-LEVEL) =====
const panelClass =
  "panel min-w-0 p-4 rounded-lg border border-neutral-700 bg-neutral-900/70 space-y-3";


/* ===== BLOCK: MINI-UTILS (BEGIN) ===== */
function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}

function buildPremiumTextShadow(strength: number = 1, glow: number = 0) {
  const s = Math.max(0, Number(strength) || 0);
  const g = Math.max(0, Number(glow) || 0);
  const a1 = Math.min(0.55, 0.28 + 0.18 * s);
  const a2 = Math.min(0.45, 0.22 + 0.14 * s);
  const a3 = Math.min(0.35, 0.16 + 0.12 * s);
  const shadows = [
    `0 ${2 * s}px ${6 * s}px rgba(0,0,0,${a1})`,
    `0 ${10 * s}px ${24 * s}px rgba(0,0,0,${a2})`,
    `0 ${28 * s}px ${60 * s}px rgba(0,0,0,${a3})`,
  ];
  if (g > 0) {
    shadows.push(`0 0 ${12 * g}px rgba(255,255,255,${0.18 * g})`);
  }
  return shadows.join(',');
}

type StepperProps = {
  label?: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  digits?: number; // formatting only
  disabled?: boolean;
  className?: string;
};

function Stepper({
  label,
  value,
  setValue,
  min,
  max,
  step = 1,
  digits = 0,
  disabled = false,
  className = "",
}: StepperProps) {
  const fmt = (n: number) =>
    Number.isFinite(n) ? n.toFixed(digits) : String(n ?? "");

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const onRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = clamp(parseFloat(e.target.value));
    setValue(n);
  };

  const onNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") return; // let user type
    const n = clamp(parseFloat(raw));
    if (!Number.isNaN(n)) setValue(n);
  };

  // wheel to fine-tune when focused
  const onWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (document.activeElement !== e.currentTarget) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    const next = clamp(
      parseFloat((value + dir * step).toFixed(Math.max(0, digits)))
    );
    setValue(next);
  };

  // keyboard arrows on range
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = step;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -step;
    if (delta !== 0) {
      e.preventDefault();
      const next = clamp(
        parseFloat((value + delta).toFixed(Math.max(0, digits)))
      );
      setValue(next);
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[11px] text-neutral-300">{label}</label>
      )}

     <div className="flex items-center gap-2 w-full">
      {/* NUMBER FIELD — compact width */}
      <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={onNumber}
          disabled={disabled}
          className="w-[44px] px-1 py-[2px] text-[11px] rounded bg-[#17171b] text-white border border-neutral-700 text-center"
        />

        {/* SLIDER — fills remaining space */}
       <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value as number) ? Number(value) : Number(min ?? 0)}
          onChange={onRange}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          disabled={disabled}
          aria-label={label}
          className="nf-range flex-1 h-2 appearance-none bg-transparent"
        />
      </div>

      {/* value readout (optional) */}
    
    </div>
  );
}


function Chip({ active, onClick, children, small, disabled, title, className }: {
  active?: boolean; onClick?: () => void; children: React.ReactNode; small?: boolean; disabled?: boolean; title?: string; className?: string
}) {
  // Use a div with role="button" to avoid <button> nesting issues.
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKey}
      title={title}
      aria-pressed={!!active}
      aria-disabled={disabled ? true : undefined}
      className={clsx(
        // base
        'inline-flex items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 select-none',
        small ? 'px-2 py-[3px] text-[11px]' : 'px-3 py-1 text-xs',
        // states
        disabled
          ? 'opacity-40 cursor-not-allowed bg-neutral-900/40 border-neutral-700 text-neutral-400'
          : active
          ? 'cursor-pointer bg-indigo-600 border-indigo-300 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_8px_16px_rgba(0,0,0,.35)]'
          : 'cursor-pointer bg-neutral-900/70 border-neutral-700 hover:bg-neutral-800 text-neutral-200',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Small color picker dot with side popover */
// ===== ColorDot (FULL REPLACEMENT) =====
type ColorDotProps = {
  value: string;
  onChange: (hex: string) => void;
  title?: string;
  disabled?: boolean;
};

const ColorDot: React.FC<ColorDotProps> = ({ value, onChange, title, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <span
      className="inline-flex items-center"
      style={{ position: 'relative', width: 16, height: 16 }}
    >
      {/* Visible dot */}
      <span
        title={title || 'Pick color'}
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
          background: value || '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-block',
        }}
        className="align-middle"
      />

      {/* Native color input overlaid for mobile tap support */}
      <input
        type="color"
        value={value || '#ffffff'}
        onChange={handleChange}
        disabled={!!disabled}
        title={title || 'Pick color'}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          width: 16,
          height: 16,
          padding: 0,
          margin: 0,
          border: 0,
        }}
      />
    </span>
  );
};
// ===== /ColorDot =====

/* ===== BLOCK: MINI-UTILS (END) ===== */

// ===== PATCH NAV-001: keyboard nudge helpers =====
const VIRTUAL_PAD = 120; // % travel beyond each edge allowed for text/logo/shape

// =========================================================
// ✅ UTILS (Corrected Range 0.0 - 1.0)
// =========================================================

// Standard clamp for 0-1 range (opacity, scale factor, etc.)
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

// ⚠️ NEW HELPER: Use this for sliders that go 0-100
function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function makeReadCtx(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D context");
  return ctx;
}

// allows -pad .. 100+pad (used for text/logo/shape, NOT background)
function clampVirtual(n: number, pad = VIRTUAL_PAD) {
  return Math.max(-pad, Math.min(100 + pad, n));
}

// Add global keyboard nudging when "Move" mode is on.
// Shift = 5% steps, Alt = 0.2% steps, otherwise 1% steps.
function installKeyboardNudge(getters: {
  moveMode: () => boolean;
  moveTarget: () => MoveTarget;
  getPos: (t: MoveTarget) => { x: number; y: number } | null;
  setPos: (t: MoveTarget, x: number, y: number) => void;
  getRotate?: (t: MoveTarget) => number | null;
  setRotate?: (t: MoveTarget, deg: number) => void;
}) {
  const onKey = (e: KeyboardEvent) => {
    if (!getters.moveMode()) return;

    const t = getters.moveTarget();

    // arrows: move
    const dx = (e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0);
    const dy = (e.key === 'ArrowUp'   ? -1 : e.key === 'ArrowDown'  ? 1 : 0);
   if (dx || dy) {
      e.preventDefault();
      const step = e.shiftKey ? 5 : e.altKey ? 0.2 : 1;
      const cur = getters.getPos(t); if (!cur) return;

      // Background stays hard-clamped to 0..100.
      // Everything else can wander into the virtual pad.
      const clampFn = (t === 'background') ? clamp01 : clampVirtual;

      getters.setPos(t, clampFn(cur.x + dx * step), clampFn(cur.y + dy * step));
      return;
    }


   // [ and ] : rotate (full 360, no clamp)
    if ((e.key === '[' || e.key === ']') && getters.getRotate && getters.setRotate) {
      e.preventDefault();
      const cur = getters.getRotate(t);
      if (cur == null) return;
      const step = e.shiftKey ? 15 : e.altKey ? 0.2 : 1; // nice: Shift=15°
      const delta = (e.key === ']') ? step : -step;
      // normalize to 0..359.999
      const next = ((cur + delta) % 360 + 360) % 360;
      getters.setRotate(t, next);
    }

  };

  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}

// ===== /NAV-001 =====




/* ===== BLOCK: COLLAPSIBLE (FIXED) ===== */
const Collapsible: React.FC<{
  title: string;
  storageKey: string;
  defaultOpen?: boolean;
  isOpen?: boolean;      // 👈 Controlled by parent
  onToggle?: () => void; // 👈 Controlled handler
  right?: React.ReactNode;
  children: React.ReactNode;
  titleClassName?: string;
}> = ({ title, storageKey, defaultOpen = false, isOpen, onToggle, right, children, titleClassName }) => {
  const STORAGE_VERSION = 'v1';
  const key = `${storageKey}:${STORAGE_VERSION}`;

  // Internal state (fallback if not controlled)
  const [internalOpen, setInternalOpen] = React.useState<boolean>(!!defaultOpen);
  const mountedRef = React.useRef(false);

  // 1. Determine if we are controlled (props) or uncontrolled (local state)
  const isControlled = typeof isOpen === 'boolean';
  const open = isControlled ? isOpen : internalOpen;

  // 2. Initial mount / localStorage read (Only if NOT controlled)
  React.useEffect(() => {
    mountedRef.current = true;
    if (isControlled) return; 

    try {
      const v = localStorage.getItem(key);
      if (v === '1') setInternalOpen(true);
      if (v === '0') setInternalOpen(false);
    } catch {}
    return () => { mountedRef.current = false; };
  }, [key, isControlled]);

  // 3. Persist to localStorage on change (just for history)
  React.useEffect(() => {
    if (!mountedRef.current) return;
    try { localStorage.setItem(key, open ? '1' : '0'); } catch {}
  }, [open, key]);

  const handleToggle = () => {
    if (onToggle) {
      onToggle(); // Let parent handle it
    } else {
      setInternalOpen(o => !o); // Handle internally
    }
  };

  return (
    <section className={panelClass}>
      <div className="w-full flex items-center gap-2">
        <div className="flex-1">
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={open}
            className="w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-800/40 group focus:outline-none"
          >
            <span className={clsx('inline-block transition-transform text-neutral-300 group-hover:text-white', open ? 'rotate-90' : 'rotate-0')}>
              ▸
            </span>
            <span className={clsx('text-xs uppercase tracking-wider group-hover:text-white', titleClassName ?? 'text-neutral-300')}>
              {title}
            </span>
          </button>
        </div>
        {right && (
          <div className="ml-auto flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            {right}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="mt-3 overflow-hidden px-2 pb-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

/* ===== TEMPLATE GALLERY (UPDATED) ===== */
/* ===== TEMPLATE GALLERY (LOCAL, SELF-CONTAINED) ===== */
const TemplateGalleryPanel = ({
  items,
  onApply,
  format,
  isOpen,   // 👈 NEW PROP
  onToggle  // 👈 NEW PROP
}: {
  items: TemplateSpec[];
  onApply: (tpl: TemplateSpec, opts?: { targetFormat?: Format }) => void;
  format: Format;
  isOpen?: boolean;
  onToggle?: () => void;
}) => {
  const [q, setQ] = React.useState('');
  const [tag, setTag] = React.useState<string>('All');

  const allTags = React.useMemo(() => {
    const s = new Set<string>();
    items.forEach(t => t.tags.forEach(x => s.add(x)));
    return ['All', ...Array.from(s).sort()];
  }, [items]);

  const filtered = React.useMemo(() => {
    return items.filter(t => {
      const okTag = tag === 'All' || t.tags.includes(tag);
      const okQ = !q || t.label.toLowerCase().includes(q.toLowerCase());
      return okTag && okQ;
    });
  }, [items, q, tag]);

  return (
    <Collapsible
      title="Template Gallery"
      storageKey="p:templates"
      isOpen={isOpen}     // 👈 PASS TO COLLAPSIBLE
      onToggle={onToggle} // 👈 PASS TO COLLAPSIBLE
      titleClassName={isOpen ? "text-amber-400" : ""}
      right={
        <input
          type="text"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-2 py-1 rounded-md text-xs border border-neutral-700 bg-neutral-900/80"
          style={{ width: 140 }}
        />
      }
    >
      <div className="mb-2 flex flex-wrap gap-2">
        {allTags.map(t => (
          <Chip key={t} small active={tag === t} onClick={() => setTag(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(t => (
          <div
            key={t.id}
            className="rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900/60"
          >
            <div className="relative">
              <img
                src={t.preview}
                alt={t.label}
                className="w-full h-[120px] object-cover block"
                draggable={false}
              />
              <div className="absolute left-2 top-2 flex gap-1 flex-wrap">
                {t.tags.slice(0, 2).map(x => (
                  <span
                    key={x}
                    className="text-[10px] px-2 py-[2px] rounded-full bg-black/50 border border-white/10"
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2 flex items-center justify-between gap-2">
              <div className="text-[12px] font-semibold">{t.label}</div>
              <button
                type="button"
                className="text-[12px] px-2 py-1 rounded-md border border-indigo-400/40 bg-indigo-600/20 hover:bg-indigo-600/30 focus-ring"
                onClick={() => {
                  const fullTpl = TEMPLATE_GALLERY.find(tt => tt.id === t.id);
                  if (fullTpl) onApply(fullTpl, { targetFormat: format });
                }}
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
    </Collapsible>
  );
};


type Align = 'left' | 'center' | 'right';
type TextSide = 'left' | 'right';
type GenStyle = 'urban' | 'neon' | 'vintage' | 'tropical';



// add this near your other types
type Palette = { bgFrom: string; bgTo: string };
type TextFx = {
  uppercase: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  tracking: number;
  texture?: string;


  // headline fill & gradient
  gradient: boolean;   // when true, gradient overrides fill color
  gradFrom: string;
  gradTo: string;
  color: string;       // <— NEW: solid fill color when gradient is OFF

  // outline & effects
  strokeWidth: number;
  strokeColor: string;
  shadow: number;
  glow: number;

  // NEW: enable/disable the drop shadow completely
  shadowEnabled: boolean;   // <— ADD THIS LINE
};

// === TEMPLATE DEFAULTS (auto-format-ready) ================================
const TEMPLATE = {
  square: {},
  story: {}
};



/* ===== ICON LIBRARY (BEGIN) ===== */
type IconLibraryItem = {
  key: string;
  label: string;
  type: 'svg' | 'emoji' | 'img';
  defaultSize?: number;
  // optional on all members (present only when the type matches)
  path?: string;
  url?: string;
  emoji?: string;
};


const ICON_LIBRARY: IconLibraryItem[] = [
  // Images
  {
    key: 'hookah',
    label: 'Hookah',
    type: 'img',
    url: '/emojis.com/hookah-with-smoke.png', // place file under /public/emojis.com/
    defaultSize: 9,
  },

  // Emojis
   { key: 'dj',            label: '🎧', type: 'emoji', emoji: '🎧', defaultSize: 7 },
  { key: 'mic',           label: '🎤', type: 'emoji', emoji: '🎤', defaultSize: 7 },
  { key: 'disco',         label: '🪩', type: 'emoji', emoji: '🪩', defaultSize: 7 },
  { key: 'cocktail',      label: '🍸', type: 'emoji', emoji: '🍸', defaultSize: 7 },
  { key: 'tropical',      label: '🍹', type: 'emoji', emoji: '🍹', defaultSize: 7 },
  { key: 'wine',          label: '🍷', type: 'emoji', emoji: '🍷', defaultSize: 7 },
  { key: 'champagne',     label: '🍾', type: 'emoji', emoji: '🍾', defaultSize: 7 },
  { key: 'beer',          label: '🍺', type: 'emoji', emoji: '🍺', defaultSize: 7 },
  { key: 'strawdrink',    label: '🧉', type: 'emoji', emoji: '🧉', defaultSize: 7 },
  { key: 'cheers',        label: '🥂', type: 'emoji', emoji: '🥂', defaultSize: 7 },
  { key: 'fire',          label: '🔥', type: 'emoji', emoji: '🔥', defaultSize: 7 },
  { key: 'dance',         label: '💃', type: 'emoji', emoji: '💃', defaultSize: 7 },
  { key: 'kiss',          label: '💋', type: 'emoji', emoji: '💋', defaultSize: 7 },
  { key: 'speaker',       label: '🔊', type: 'emoji', emoji: '🔊', defaultSize: 7 },
  { key: 'sound',         label: '🎶', type: 'emoji', emoji: '🎶', defaultSize: 7 },
  { key: 'sparkle',       label: '✨', type: 'emoji', emoji: '✨', defaultSize: 7 },
  { key: 'motion',        label: '💫', type: 'emoji', emoji: '💫', defaultSize: 7 },
  { key: 'party',         label: '🎉', type: 'emoji', emoji: '🎉', defaultSize: 7 },
  { key: 'camera',        label: '📸', type: 'emoji', emoji: '📸', defaultSize: 7 },
];
/* ===== ICON LIBRARY (END) ===== */

// ---- helper: safely turn a library item into a runtime Icon ----
function createIconFromLibrary(libItem: IconLibraryItem): Icon {
  return {
    id: crypto.randomUUID(),
    x: 50,
    y: 50,
    size: libItem.defaultSize ?? 9,
    rotation: 0,
    opacity: 1,

    svgPath: libItem.type === 'svg'   ? libItem.path  : undefined,
    imgUrl:  libItem.type === 'img'   ? libItem.url   : undefined,
    emoji:   libItem.type === 'emoji' ? libItem.emoji : undefined,

    // default vector styling (ignored for emoji/img)
    fill: '#ffffff',
    stroke: 'none',
    strokeWidth: 0,
    name: libItem.label,
    box: 24,
  };
}

// ===== FALLBACK BACKGROUND (simple dark gradient SVG) =====
const FALLBACK_BG =
  'data:image/svg+xml;utf8,' +
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">' +
    '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="%23131216"/>' +
        '<stop offset="100%" stop-color="%230a0a0c"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<rect width="100%" height="100%" fill="url(%23g)"/>' +
  '</svg>';


/* ===== BLOCK: PROMPT RANDOMIZER (BEGIN) ===== */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.max(0, Math.min(n, a.length)));
}
const STYLE_DB: Record<GenStyle, {
  locations: string[]; lighting: string[]; camera: string[]; micro: string[]; colorways: string[];
}> = {
  urban: {
    locations: [
      'gritty alleyway with wet asphalt', 'underground concrete bunker', 'rooftop skyline at midnight', 
      'industrial warehouse with steel trusses', 'subway station entrance with steam', 'brick wall with torn posters',
      'loading dock with metal shutters', 'chainlink fence shallow depth'
    ],
    lighting: [
      'sodium-vapor streetlights', 'cinematic rim light from far streetlamps', 'heavy volumetric fog', 
      'high contrast noir lighting', 'neon sign reflection in puddles', 'hazy backlight', 'cold blue moonlight vs warm streetlamp'
    ],
    camera: [
      '85mm portrait lens', 'low angle hero shot', 'anamorphic lens flare', 'handheld motion blur', 
      'wide aperture f/1.8', 'Leica M6 film look'
    ],
    micro: [
      'fine mist rain', 'floating dust motes', 'graffiti texture', 'metallic glints on wet surfaces', 
      'smoke machine haze', 'bokeh city lights background'
    ],
    colorways: [
      'amber and charcoal', 'teal and rusted orange', 'cool blue shadows with warm highlights', 
      'desaturated grunge palette', 'midnight blue and concrete grey'
    ],
  },
  neon: {
    locations: [
      'reflective glass corridor', 'LED infinity mirror room', 'cyberpunk night market', 
      'glossy black dance floor', 'geometric laser tunnel', 'chrome plated lounge', 
      'transparent acrylic panels', 'server room aesthetics'
    ],
    lighting: [
      'cyan and magenta laser beams', 'ultraviolet blacklight glow', 'hard rim lighting', 
      'diffused LED strip lighting', 'strobe light freeze frame', 'holographic shimmer', 
      'bioluminescent accents'
    ],
    camera: [
      '35mm wide angle', 'crisp digital clarity', 'prism filter diffraction', 'split diopter effect', 
      'macro focus on reflections', 'fast shutter speed'
    ],
    micro: [
      'digital noise grain', 'lens chromatic aberration', 'specular highlights on chrome', 
      'light trails', 'glitch art texture', 'floating confetti'
    ],
    colorways: [
      'cyberpunk cyan & pink', 'acid green and deep purple', 'electric blue and hot red', 
      'monochrome violet', 'iridescent oil slick'
    ],
  },
  vintage: {
    locations: [
      'smoky jazz lounge with velvet curtains', 'art deco bar with gold trim', 'retro 70s disco floor', 
      'mahogany paneled speakeasy', 'plush red booth seating', 'crystal chandelier background', 
      'old theater stage'
    ],
    lighting: [
      'warm tungsten practical lamps', 'soft candle flicker', 'golden hour spotlight', 
      'hazy cigarette smoke atmosphere', 'god rays through dust', 'softbox fill light'
    ],
    camera: [
      'Kodak Portra 400 film stock', 'soft focus vintage lens', 'heavy film grain', 
      'vignetted corners', 'double exposure hints', '50mm classic portrait'
    ],
    micro: [
      'dust and scratches overlay', 'paper texture', 'warm halation bloom', 'faded polaroid edges', 
      'film burn leaks', 'sepia tone hints'
    ],
    colorways: [
      'muted gold and deep burgundy', 'faded teal and cream', 'sepia and onyx', 
      'warm amber warmth', 'champagne and chocolate'
    ],
  },
  tropical: {
    locations: [
      'sunset beach club terrace', 'palm tree silhouette against sky', 'poolside cabana at night', 
      'lush jungle plant wall', 'tiki bar with bamboo', 'rooftop infinity pool', 
      'yacht deck at twilight'
    ],
    lighting: [
      'golden hour backlighting', 'warm string lights bokeh', 'underwater pool glow', 
      'fire torch flicker', 'soft moonlight on water', 'dappled shadows from palm leaves'
    ],
    camera: [
      '28mm wide lifestyle lens', 'sun flare lens artifact', 'vibrant pro-mist filter', 
      'GoPro action angle', 'clean digital HDR'
    ],
    micro: [
      'water droplets on glass', 'rising heat haze', 'floating embers', 'wet skin sheen', 
      'sand texture', 'condensation mist'
    ],
    colorways: [
      'sunset orange and teal', 'deep jungle green and gold', 'aqua blue and coral pink', 
      'miami vice pastel', 'rich emerald and violet'
    ],
  }
};



/** ===== SUPER FIRE PRESETS (drop-in base prompts) ===== */
type PromptPreset = { key: string; label: string; style: GenStyle; prompt: string };

type TemplateTag =
  | 'EDM' | 'Hip-Hop' | 'R&B Lounge' | 'Latin' | 'College' | 'Seasonal'
  | 'Neon' | 'Urban' | 'Vintage' | 'Tropical' | 'Ladies Night' | 'Techno';



// === TRENDING & FUTURIST NIGHTLIFE PRESETS (2025-2026) ===
const PRESETS: PromptPreset[] = [
  // --- TIER 1: SUMMER & OUTDOOR (NEW) ---
  {
    key: 'backyard_bbq',
    label: 'Backyard BBQ / Day Party',
    style: 'tropical', // Uses warm lighting logic
    prompt:
      'sunny backyard house party, green grass and wooden fence, smoke from barbecue grill, red solo cups, string lights, golden hour lens flare, casual summer vibes, authentic lifestyle photography, Kodachrome film look',
  },
  
  // --- TIER 2: THE "NOW" (Current High Trends) ---
  {
    key: 'boiler_room',
    label: '360° Boiler Room',
    style: 'urban',
    prompt:
      'industrial warehouse rave, 360-degree dj booth setup, raw concrete walls, sweaty atmosphere, shot on VHS camcorder style, harsh flash photography, tight crowd surrounding the center, authentic underground energy',
  },
  {
    key: 'tulum_jungle',
    label: 'Tulum / Boho House',
    style: 'tropical',
    prompt:
      'open-air jungle disco at sunset, wooden bamboo structures, massive monstera leaves, hanging woven lanterns, copal smoke haze, warm golden hour backlight, organic textures, spiritual deep house vibe',
  },
  {
    key: 'y2k_chrome',
    label: 'Y2K Chrome (Hyperpop)',
    style: 'neon',
    prompt:
      'futuristic Y2K aesthetic, liquid chrome textures, iridescent blue and hot pink lighting, fisheye lens distortion, glossy surfaces, floating geometric shards, icy atmosphere, hyper-digital look, background only',
  },

  // --- TIER 3: THE "FUTURE" (Emerging) ---
  {
    key: 'indie_sleaze',
    label: 'Indie Sleaze (2010s)',
    style: 'urban',
    prompt:
      'messy chaotic house party, direct camera flash photography, high contrast, smudged makeup vibe, polaroid texture, red solo cups, lo-fi grit, candid energy, hipster nightlife revival, american apparel aesthetic',
  },
  {
    key: 'neo_eden',
    label: 'Solarpunk / Bio-Lume',
    style: 'tropical',
    prompt:
      'futuristic organic nightclub, glowing bioluminescent plants, translucent glass architecture, soft green and aqua ambient lighting, sustainable luxury, harmonious blend of technology and nature, avatar movie aesthetic',
  },
  {
    key: 'dreamcore_cloud',
    label: 'Ethereal / Dreamcore',
    style: 'neon',
    prompt:
      'surreal dreamscape lounge, soft focus bloom, pastel clouds floating indoors, pink and lavender gradient lighting, fuzzy textures, zero gravity feeling, liminal space, heavenly atmosphere',
  },
  {
    key: 'dystopian_luxe',
    label: 'Blade Runner VIP',
    style: 'neon',
    prompt:
      'brutalist high-tech penthouse, rain streaking on glass windows, massive holographic advertisements visible outside, cold sterile lighting, expensive leather textures, cinematic orange and teal noir atmosphere',
  },

  // --- TIER 4: THE "STAPLES" ---
  {
    key: 'trapsoul_lounge',
    label: 'Trapsoul / Hookah',
    style: 'vintage',
    prompt:
      'dimly lit VIP lounge, plush red velvet booths, thick hookah smoke swirling, neon purple accent lights, expensive bottle service setup with sparklers, moody R&B atmosphere, shallow depth of field',
  },
  {
    key: 'berlin_techno',
    label: 'Berlin Industrial',
    style: 'urban',
    prompt:
      'massive brutalist concrete bunker, monochrome lighting, blinding white strobe lights cutting through heavy smoke, minimal geometry, cavernous space, dark techno atmosphere, high contrast',
  },
  {
    key: 'amapiano_sunset',
    label: 'Amapiano Rooftop',
    style: 'tropical',
    prompt:
      'luxury city rooftop at golden hour, warm orange and deep purple sky, silhouette of palm trees, string lights, vibrant patterned fabrics, joyous atmosphere, soft motion blur, high-end lifestyle photography',
  },
  {
    key: 'great_gatsby',
    label: 'Gatsby / Black Tie',
    style: 'vintage',
    prompt:
      'roaring 20s art deco ballroom, gold and black palette, falling gold confetti, crystal chandeliers, champagne tower, soft vintage film grain, halation glow, opulent luxury party',
  },
  
  // --- TIER 5: SPECIAL FX ---
  {
    key: 'matrix_rave',
    label: 'Cyberpunk / Matrix',
    style: 'neon',
    prompt:
      'underground cyber-goth rave, laser grid ceiling, green code rain reflection, wet black latex textures, industrial piping, thick fog, strobe lights freezing motion, high contrast, cinematic sci-fi mood',
  },
  {
    key: 'drill_video',
    label: 'Drill / Trap Video',
    style: 'urban',
    prompt:
      'gritty night street scene, wet asphalt reflections, expensive luxury cars in background, cold blue streetlights, cinematic anamorphic lens flare, moody shadows, music video production value',
  },
  {
    key: 'film_noir',
    label: 'Cinematic Noir',
    style: 'vintage',
    prompt:
      'black and white film photography, moody jazz club, silhouette behind frosted glass, dramatic shadows, cigarette smoke haze, spotlight on a microphone stand, timeless elegance',
  },
];


// Drop-in: populate the gallery (previews can be any image URL you have)



function buildDiversifiedPrompt(
  style: GenStyle,
  basePrompt: string,
  format: Format,
  textSide: TextSide,
  variety: number,
  seed: number,
  allowPeople: boolean
) {
  const S = STYLE_DB[style];
  const rng = mulberry32(seed);
  const pool = [...S.locations, ...S.lighting, ...S.camera, ...S.micro, ...S.colorways];
  const tokens = pickN(pool, Math.min(2 + variety * 2, 10), rng);

  // We want TEXT on the left, subject on the right.
  // If you ever flip textSide to 'right', this will mirror automatically.
  const subjectSide = (textSide === 'left') ? 'right' : 'left';

  // Stricter composition: right third anchoring + % of clean negative space.
  const NEG_SPACE_PCT = format === 'story' ? 45 : 40; // a bit more room on vertical
  const comp =
    format === 'story'
      ? [
          'vertical 9:16 poster composition',
          `subject anchored to the ${subjectSide} third`,
          `leave at least ${NEG_SPACE_PCT}% clean negative space on the ${textSide} side for bold typography`,
          `avoid busy detail on the ${textSide} half`,
          'rule-of-thirds framing, headroom preserved',
        ].join(', ')
      : [
          'square 1:1 poster composition',
          `subject anchored to the ${subjectSide} third`,
          `leave at least ${NEG_SPACE_PCT}% clean negative space on the ${textSide} side for bold typography`,
          `avoid busy detail on the ${textSide} half`,
          'rule-of-thirds framing, headroom preserved',
        ].join(', ');

  const sharedQuality = [
    'ultra-detailed, photographic realism',
    'controlled bloom and haze, balanced white balance',
    'rich textures, no banding, no oversharpening',
  ].join('. ');

  const peopleOn = [
    'single human subject facing camera 3/4 or profile',
    'natural skin texture (no plastic skin), correct hands',
    'no extra people, no crowds',
    'shallow depth of field if appropriate',
  ].join('. ');

  const peopleOff = [
    'no people, no humans, no faces, no silhouettes',
    'background/environment only',
  ].join('. ');

  // If people are OFF but user wrote “portrait/person/subject”, sanitize to “background”.
  const sanitizedBase = allowPeople
    ? basePrompt
    : basePrompt.replace(/\b(person|people|portrait|subject|model)\b/gi, 'background');

  // Strong negative list to tighten results and keep the text side clean.
  const negatives = [
    'no text, no typography, no logos, no UI',
    'no watermark, no signature, no caption',
    'no extra subjects, no duplicated bodies',
    `no clutter or high-frequency detail on the ${textSide} side`,
    'no extreme fisheye, no cartoon CGI look',
  ].join('. ');

  // Gentle guidance to make the text side visually calm.
  const textSideStyling = [
    `the ${textSide} side should be visually calm with gentle gradients or soft bokeh`,
    'keep strongest highlights and detail around the subject, not in the negative space',
  ].join('. ');

  // Assemble
  return [
    tokens.join(', '),
    comp,
    sanitizedBase.trim(),
    textSideStyling,
    sharedQuality,
    allowPeople ? peopleOn : peopleOff,
    negatives,
  ]
    .filter(Boolean)
    .join('. ');
}


/* ===== BLOCK: PROMPT RANDOMIZER (END) ===== */



/* ===== BLOCK: COLOR UTILS (BEGIN) ===== */
function hexToRgba(hex: string, alpha: number) {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map(x => x + x).join('') : m;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
/* ===== BLOCK: COLOR UTILS (END) ===== */
// --- rotation helper (top-level util) ---
const isRotated = (deg: number) => (((deg % 360) + 360) % 360) !== 0;
const normDeg = (d:number) => ((d % 360) + 360) % 360;



// === DOUBLE BREAK RENDERER (for Enter/Return) ===
function renderWithDoubleBreaks(text: string): React.ReactNode {
  const parts = String(text).replace(/\r\n?/g, '\n').split('\n'); // normalize CR/LF
  const out: React.ReactNode[] = [];
  parts.forEach((line, i) => {
    out.push(<React.Fragment key={`ln-${i}`}>{line}</React.Fragment>);
    if (i < parts.length - 1) {
      out.push(<br key={`br-a-${i}`} />);
      out.push(<br key={`br-b-${i}`} />);
    }
  });
  return out;
}

// === DOUBLE BREAK RENDERER (END) ===

/* ===== BLOCK: HEADLINE TYPE HELPERS (BEGIN) ===== */
// Simple “hang width” in ems for opening punctuation
const HANG_MAP: Record<string, number> = {
  '"': 0.06, "'": 0.05, '“': 0.08, '‘': 0.07, '«': 0.08, '(': 0.03, '[': 0.03
};

// Common kerning fixes (negative = tighten)
const KERN_MAP: Record<string, number> = {
  'AV': -0.04, 'AW': -0.035, 'AT': -0.03, 'To': -0.03, 'Ta': -0.025, 'Te': -0.02,
  'LA': -0.02, 'LY': -0.03, 'LT': -0.02, 'Yo': -0.02, 'Ya': -0.02, 'Ty': -0.03,
  'VA': -0.045, 'WA': -0.03, 'Ve': -0.02, 'We': -0.02, 'FA': -0.02
};

function applyKerning(line: string, enable = true): React.ReactNode {
  if (!enable || !line) return line;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < line.length; i++) {
    const pair = line[i] + (line[i + 1] || '');
    const adj = KERN_MAP[pair];
    if (typeof adj === 'number') {
      out.push(
        <span key={`k-${i}`} style={{ letterSpacing: `${adj}em` }}>
          {pair}
        </span>
      );
      i++; // skip the next char (already consumed in pair)
    } else {
      out.push(<span key={`c-${i}`}>{line[i]}</span>);
    }
  }
  return out;
}

/**
 * Renders headline as block lines:
 * - Adds per-line tracking (lead/last deltas)
 * - Adds optical margin (hanging opening punctuation on first char)
 * - Leaves gradient implementation to the outer wrapper (as you already do)

/* >>> BEGIN — renderHeadlineRich (Safer Version) <<< */
function renderHeadlineRich(
  text: string,
  opts: {
    baseTrackEm: number;
    leadDeltaEm: number;
    lastDeltaEm: number;
    opticalMargin: boolean;
    kerningFix: boolean;
    lineStyle?: React.CSSProperties;
    lineHeight?: React.CSSProperties["lineHeight"];
  }
) {
  const lines = String(text || "").split("\n");

  return (
    <span style={{ display: "block", width: "100%" }}>
      {lines.map((ln, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === lines.length - 1;

        const hang =
          opts.opticalMargin && ln.length ? (HANG_MAP[ln[0]] || 0) : 0;

        const track =
          (opts.baseTrackEm || 0) +
          (isFirst ? (opts.leadDeltaEm || 0) : 0) +
          (isLast ? (opts.lastDeltaEm || 0) : 0);

        return (
          <React.Fragment key={`hl-frag-${idx}`}>
            <span
              style={{
                display: "block", // 👈 This effectively acts as a <br>
                width: "100%",
                letterSpacing: `${track}em`,
                marginLeft: hang ? `-${hang}em` : undefined,
                paddingLeft: hang ? `${hang}em` : undefined,
                
                // Use the passed line height
                lineHeight: (opts.lineHeight ?? "inherit"),
                
                ...(opts.lineStyle || {}),
              }}
            >
              {ln === "" ? "\u00A0" : applyKerning(ln, opts.kerningFix)}
            </span>
            
            {/* ❌ REMOVED <br /> here. display:block already handles the break. */}
          
          </React.Fragment>
        );
      })}
    </span>
  );
}
/* >>>  END <<< */


  

/* ===== BLOCK: HEADLINE TYPE HELPERS (END) ===== */

type Shape = {
  id: string;
  kind: 'rect' | 'circle' | 'line';
  x: number; y: number;            // percent
  width?: number; height?: number; // percent (rect/line)
  r?: number;                      // circle radius (% of short edge)
  rotation?: number;               // degrees
  fill: string; stroke: string; strokeWidth: number; opacity: number;
};

type Icon = {
  id: string;
  x: number;
  y: number;
  size: number;           // percent of short edge (same as before)
  rotation: number;
  opacity: number;

  // ONE of these:
  svgPath?: string;       // vector path
  emoji?: string;         // emoji fallback
  imgUrl?: string;        // PNG/SVG image file

  // render style for vectors:
  fill: string;
  stroke: string;
  strokeWidth: number;

  // meta
  name?: string;

  // NEW: viewBox size for svgPath scaling (usually 24 or 32)
  box?: number;
};



/* ===== BLOCK: ARTBOARD (BEGIN) ===== */
//ARTBOARD PROPS//
const Artboard = React.forwardRef<HTMLDivElement, {
 
  palette: Palette; format: Format;
  portraitUrl: string | null; bgUrl: string | null; bgUploadUrl: string | null; logoUrl: string | null; opticalMargin: boolean; leadTrackDelta: number;
  lastTrackDelta: number; kerningFix: boolean; headBehindPortrait: boolean; allowPeople: boolean; 
  hue: number; haze: number; grade: number; leak: number; vignette: number; bgPosX: number; bgPosY: number; detailsFamily: string; 
  headline: string; headlineFamily: string; textFx: TextFx; align: Align; lineHeight: number; textColWidth: number; tallHeadline: boolean; headX: number; headY: number; headlineHidden: boolean;
  details: string; bodyFamily: string; bodyColor: string; bodySize: number; bodyUppercase: boolean; bodyBold: boolean; bodyItalic: boolean; bodyUnderline: boolean; bodyTracking: number; detailsX: number; detailsY: number;
  /** DETAILS 2 (new) */
  details2: string; details2X: number; 
  details2Y: number; details2Align: Align; details2LineHeight: number; details2Family?: string; details2Color?: string; details2Size: number; details2LetterSpacing: number; 
  

  venue: string; venueFamily: string; venueColor: string; venueSize: number; venueX: number; venueY: number; clarity: number; venueUppercase: boolean; venueItalic: boolean; venueBold: boolean;
  subtag: string; subtagFamily: string; subtagBgColor: string; subtagTextColor: string; subtagAlpha: number; subtagX: number; subtagY: number;
  showGuides: boolean; showFaceGuide: boolean; faceRight: number; faceTop: number; faceW: number; faceH: number; venueLineHeight: number;
  portraitX: number; portraitY: number; portraitScale: number; detailsLineHeight: number; subtagUppercase: boolean; details2Enabled: boolean; 
  headSizeAuto: boolean; headManualPx: number; headMaxPx: number;  
  subtagAlign: Align;
  subtagColor: string;

  textureOpacity: number;

  bgX: number;
  bgY: number;
  bgScale: number;
  setBgX: (v: number) => void;
  setBgY: (v: number) => void;
  bgBlur: number;

  headRotate: number; head2Rotate: number; detailsRotate: number; details2Rotate: number; venueRotate: number; subtagRotate: number; logoRotate: number;
  portraitBoxW: number; portraitBoxH: number; portraitLocked?: boolean; hideUiForExport?: boolean; headAlign: Align;
  onTogglePortraitLock: () => void;
  details2Uppercase?: boolean;
  details2Bold?: boolean;
  details2Italic?: boolean;
  details2Underline?: boolean;

  // === SHADOW ENABLE ===
  headShadow: boolean;
  head2Shadow: boolean;
  detailsShadow: boolean;
  details2Shadow: boolean;
  venueShadow: boolean;
  subtagShadow: boolean;

  // === SHADOW STRENGTH ===
  headShadowStrength: number;
  head2ShadowStrength: number;
  detailsShadowStrength: number;
  details2ShadowStrength: number;
  venueShadowStrength: number;
  subtagShadowStrength: number;


  /** HEADLINE 2 (new, independent styles) */
  head2Enabled: boolean;
  head2: string;
  head2X: number;
  head2Y: number;
  head2SizePx: number;
  head2Family: string;
  head2Align: Align;
  head2LineHeight: number;
  head2ColWidth: number;
  head2Fx: TextFx;
  head2Alpha: number;
  head2Color: string;
  setDetails2X?: React.Dispatch<React.SetStateAction<number>>;
  setDetails2Y?: React.Dispatch<React.SetStateAction<number>>;

  onPortraitScale: (s: number) => void;
  onDeletePortrait?: () => void;
  onSetPortraitUrl?: (url: string | null) => void;

  /** SUBTAG extra text styles */
  subtagBold: boolean;
  subtagItalic: boolean;
  subtagUnderline: boolean;
  subtagSize: number;  
  subtagEnabled: Record<Format, boolean>;

  emojis: Emoji[];


  logoX: number; logoY: number; logoScale: number;

  // selection + locking
  selShapeId: string | null;
  onSelectShape?: (id: string) => void;
  onToggleLock?: (t: 'shape' | 'icon', id: string) => void;
  isLocked?: (t: 'shape' | 'icon', id: string) => boolean;

  // ICON trash 
  onDeleteIcon?: (id: string) => void;


  /** ✅ shapes come in via props */
  shapes?: Shape[];
  icons?: Icon[];

  onPortraitMove?: (x: number, y: number) => void;
  onLogoMove?: (x: number, y: number) => void;
  moveMode: boolean; moveTarget: MoveTarget; snap: boolean; detailsAlign: Align; venueAlign: Align;
  onHeadMove?: (x: number, y: number) => void; 
  onDetailsMove?: (x: number, y: number) => void; 
  onDetails2Move?: (x: number, y: number) => void; 
  onVenueMove?: (x: number, y: number) => void; 
  onSubtagMove?: (x: number, y: number) => void; 
  onBgMove?: (x: number, y: number) => void;
  onBgScale?: (s: number) => void;

  onHead2Move?: (x: number, y: number) => void;
  onShapeMove?: (id: string, x: number, y: number) => void;
  onIconMove?: (id: string, x: number, y: number) => void;
  onIconResize?: (id: string, size: number) => void;

  onClearIconSelection?: () => void;
  onDeleteShape?: (id: string) => void;
  
  selIconId?: string | null;
  onSelectIcon?: (id: string) => void;

  //EMOJI
   onEmojiMove?: (id: string, x: number, y: number) => void;
  

  

}>((p, ref) => {


  // ✅ CLEAN DESTRUCTURE — do NOT put type annotations here.
  // If you previously had "shapes?: ..." inside this destructuring, remove it.
  const {
    headRotate, head2Rotate, detailsRotate, details2Rotate, venueRotate, subtagRotate, logoRotate, headAlign,
    palette, format, portraitUrl, bgUrl, bgUploadUrl, logoUrl, hue, haze, grade, leak, vignette, bgPosX, bgPosY,
    portraitScale, subtagUppercase, opticalMargin, leadTrackDelta, lastTrackDelta, kerningFix, headBehindPortrait,
    headline, headlineFamily, textFx, align, lineHeight, textColWidth, tallHeadline, headX, headY, headlineHidden,
    details, bodyFamily, bodyColor, bodySize, bodyUppercase, bodyBold, bodyItalic, bodyUnderline, bodyTracking, detailsX, detailsY,
    venue, venueFamily, venueColor, venueSize, venueX, venueY, venueLineHeight, detailsFamily, 
    subtagEnabled, subtag, subtagFamily, subtagBgColor, subtagTextColor, subtagAlpha, subtagX, subtagY,
    showGuides, showFaceGuide, faceRight, faceTop, faceW, faceH, allowPeople,
    moveMode, snap, detailsAlign, venueAlign, clarity, portraitX, portraitY, venueUppercase, 
    venueItalic, venueBold, textureOpacity,
  
    logoX, logoY, logoScale,
    detailsLineHeight, headSizeAuto, headManualPx, headMaxPx,
    // details2
    details2, details2Family, details2Color,
    details2X, details2Y, details2Align, details2LineHeight, details2Enabled, details2Size,
    // Headline 2
    head2Enabled, head2, head2X, head2Y, head2SizePx, head2Family, head2Align, head2LineHeight, head2ColWidth, head2Fx, head2Alpha, head2Color,
    // Subtag styles
    subtagBold, subtagItalic, subtagUnderline, subtagSize, subtagAlign, 
    bgX, bgY, setBgX, setBgY, bgScale, bgBlur,

     /* SHADOW ENABLE */
      headShadow,
      head2Shadow,
      detailsShadow,
      details2Shadow,
      venueShadow,
      subtagShadow,

      /* SHADOW STRENGTH */
      headShadowStrength,
      head2ShadowStrength,
      detailsShadowStrength,
      details2ShadowStrength,
      venueShadowStrength,
      subtagShadowStrength,

    // movers
    onPortraitMove, onPortraitScale, onDeletePortrait, onLogoMove, onHeadMove, onDetailsMove, onVenueMove, onSubtagMove, 
    onBgMove, onHead2Move, onDetails2Move, onShapeMove, onBgScale, onIconMove, onIconResize, onDeleteIcon,
    portraitBoxW, portraitBoxH,
    emojis,
    onEmojiMove,

    /** ✅ alias shapes prop to a local name that won’t collide with any state */
    shapes: shapesProp = [],
    icons: iconsProp = [],

    selShapeId, selIconId,
    isLocked: isLockedFn,
    onToggleLock,
    onSelectIcon,
    onSelectShape,
  } = p;

// === LOCK UI (single source) ===
const NEON = 'rgba(167,139,250,0.95)';
const GLOW = `0 0 0 2px ${NEON}, 0 0 0 6px rgba(167,139,250,0.25)`;
// dashed selection box for active text blocks
const selBox = (on: boolean) =>
  on
    ? { outline: '2px dashed #A78BFA', outlineOffset: 4, borderRadius: 8 as number }
    : {};


// Accept all targets so existing uses compile; only shape/icon actually lock.
const LockButton = ({
  t,
  id,
  x,
  y
}: {
  t:
    | 'shape'
    | 'icon'
    | 'headline'
    | 'headline2'
    | 'details'
    | 'details2'
    | 'venue'
    | 'subtag'
    | 'portrait'
    | 'logo'
    | 'background';
  id?: string;
  x: number;
  y: number;
}) => {
  const isLockable = (t === 'shape' || t === 'icon') && !!id;
  const locked = isLockable ? (p.isLocked?.(t as 'shape' | 'icon', id!) ?? false) : false;

  return (
    <button
      type="button"
      // ⬇️ This line is the fix: prevent parent icon/shape from starting a drag
      onPointerDown={(e) => { e.stopPropagation(); }}
      onClick={(e) => {
        e.stopPropagation();
        if (isLockable) p.onToggleLock?.(t as 'shape' | 'icon', id!);
      }}
      className="absolute z-[1000]"
      title={isLockable ? (locked ? 'Unlock' : 'Lock') : 'Not lockable'}
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%,-50%)',
        width: 22,
        height: 22,
        borderRadius: 6,
        background: '#0f172a',
        border: '1px solid #334155',
        color: locked ? '#70FFEA' : '#ffffff',
        boxShadow: locked ? '0 0 10px #70FFEA' : 'none',
        lineHeight: 1,
        cursor: isLockable ? 'pointer' : 'default',
        opacity: isLockable ? 1 : 0.6,
        pointerEvents: 'auto',
      }}
    >
      {isLockable ? (locked ? '🔒' : '🔓') : '🔒'}
    </button>
  );
};



  const t = {} as any;
  const head2Text = (p.head2 && p.head2.trim()) ? p.head2 : 'SUB HEADLINE';

  const size = format === 'square' ? { w: 540, h: 540 } : { w: 540, h: 960 };
  const rootRef = useRef<HTMLDivElement>(null);
  const [headlineFontTick, setHeadlineFontTick] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    ensureFontLoaded(headlineFamily).then(() => {
      if (alive) setHeadlineFontTick((v) => v + 1);
    });
    return () => {
      alive = false;
    };
  }, [headlineFamily]);


  // =========================================================
  // ✅ EXPOSE HELPER: Snapshot Background for Magic Blend
  // =========================================================
  useImperativeHandle(ref, () => {
    // 1. Get the base DOM element
    const el = rootRef.current as HTMLDivElement & { exportBackgroundDataUrl?: (opts?: { size?: number }) => Promise<string | null> };

    // 2. Attach the snapshot function
    if (el) {
      el.exportBackgroundDataUrl = async (opts?: { size?: number }) => {
        const targetSize = opts?.size ?? 1024;

        // Determine which background to use
        const bgSrc = bgUploadUrl || bgUrl;
        if (!bgSrc) return null;

        // Calculate aspect ratio from the current format size
        // (variable 'size' comes from the Artboard scope: { w, h })
        const artW = size.w;
        const artH = size.h;
        
        let outW = targetSize;
        let outH = targetSize;
        
        // Match format aspect ratio
        if (artW !== artH) {
          const ar = artW / artH;
          if (ar > 1) { 
            outW = targetSize; 
            outH = Math.round(targetSize / ar); 
          } else { 
            outH = targetSize; 
            outW = Math.round(targetSize * ar); 
          }
        }

        // Load image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = bgSrc;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load bg image"));
        });

        // Create canvas and apply Pan/Zoom logic
        const c = document.createElement("canvas");
        c.width = outW;
        c.height = outH;
        const ctx = c.getContext("2d")!;

        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        
        // "Cover" logic based on bgScale
        const scaleFactor = Math.max(outW / iw, outH / ih) * bgScale; 
        
        const dw = iw * scaleFactor;
        const dh = ih * scaleFactor;

        // Pan logic (0..100 maps to edge-to-edge range)
        const dx = (outW - dw) * (bgX / 100);
        const dy = (outH - dh) * (bgY / 100);

        ctx.drawImage(img, dx, dy, dw, dh);

        return c.toDataURL("image/jpeg", 0.95);
      };
    }

    // 3. Return the element (so other things don't break)
    return el;
  });



  const [portraitAR, setPortraitAR] = React.useState<number | null>(null);
  // === Portrait lock state ===
  const [portraitLocked, setPortraitLocked] = useState<boolean>(false);
  const [templateBase, setTemplateBase] = useState<any>(null);
  const [dragEffectsDisabled, setDragEffectsDisabled] = useState(false);
  const portraits = useFlyerState((s) => s.portraits);
  const updatePortrait = useFlyerState((s) => s.updatePortrait);
  const removePortrait = useFlyerState((s) => s.removePortrait);
  const selectedPortraitId = useFlyerState((s) => s.selectedPortraitId);

  
  
  


  // DRAG STATE FROM STORE (Zustand)
const dragging = useFlyerState((s) => s.dragging);
const setDragging = useFlyerState((s) => s.setDragging);

const moveTarget = useFlyerState((s) => s.moveTarget);
const setMoveTarget = useFlyerState((s) => s.setMoveTarget);
const setSelectedPortraitId = useFlyerState((s) => s.setSelectedPortraitId);
const dragReturnTimer = useRef<NodeJS.Timeout | null>(null);
const bgDragRef = useRef<HTMLDivElement>(null); // ✅ Dedicated ref for background

  // Stores the drag state purely in memory (immune to re-renders)
const bgDragState = useRef({
  active: false,
  startX: 0,
  startY: 0,
  startLeft: 50,
  startTop: 50,
  parentW: 1,
  parentH: 1
});







 /* >>> HEADLINE SIZE AUTO-FIT (BEGIN) <<< */
// One source of truth for internal auto size
const [headlinePx, setHeadlinePx] = useState<number>(format === 'square' ? 84 : 110);
const [bgIsLandscape, setBgIsLandscape] = useState(false);



// The size value we render (auto = computed; manual = user value)
const headDisplayPx = headSizeAuto ? headlinePx : headManualPx;
// ==== FULL-COLUMN HIGHLIGHT FOR HEADLINE (measure height) ====
const [headSelH, setHeadSelH] = React.useState(0);

React.useLayoutEffect(() => {
  const root = rootRef.current;
  const head = canvasRefs.headline;
  if (!root || !head) return;

  root.classList.add("dragging-fast");

  const update = () => {
    const R = root.getBoundingClientRect();
    const H = head.getBoundingClientRect();
    setHeadSelH((H.height / R.height) * 100);
  };

  update();

  const ro = new ResizeObserver(update);
  ro.observe(root);
 ro.observe(canvasRefs.headline!);
  return () => ro.disconnect();
}, [headline, headDisplayPx, lineHeight, textColWidth, align, headlineFontTick]);


useEffect(() => {
  // Manual mode — keep internal size in sync and skip auto-fit
  if (!headSizeAuto) {
    setHeadlinePx(headManualPx);
    return;
  }

  const root = rootRef.current;
  const h1   = canvasRefs.measure;
  if (!root || !h1) return;

  const W = root.clientWidth, H = root.clientHeight;

  // Face guide box in pixels
  const fw = (faceW / 100) * W, fh = (faceH / 100) * H,
        fl = W - (faceRight / 100) * W - fw,
        ft = (faceTop / 100) * H;

  const maxWidth  = (textColWidth / 100) * W;
  const maxHeight = (format === 'square' ? (tallHeadline ? 0.52 : 0.34) : (tallHeadline ? 0.60 : 0.42)) * H;

  const defaultStart = format === 'square' ? 84 : 110;
  const hardMax = Math.max(12, Math.round(p.headMaxPx ?? defaultStart));

  // IMPORTANT: start from the ceiling so the headline can grow
  // (the loop only ever decreases the size until it fits)
  let sizePx = hardMax;
  const minSize = Math.round(format === 'square' ? 36 : 40);

  const inter = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

  // Prepare measurer so it matches layout/line breaks & column width
  h1.style.whiteSpace = 'pre-wrap';           // respect \n
  h1.style.width = `${textColWidth}%`;        // measure within column
  h1.style.textAlign = align;                 // match column alignment
  h1.style.display = 'block';                 // block to honor width
  h1.textContent = textFx.uppercase ? (headline || '').toUpperCase() : (headline || '');

  let guard = 0;
  while (guard++ < 80 && sizePx >= minSize) {
    h1.style.fontSize      = `${sizePx}px`;
    h1.style.letterSpacing = `${textFx.tracking}em`;
    h1.style.fontWeight    = textFx.bold ? '900' : '700';
    h1.style.fontStyle     = textFx.italic ? 'italic' : 'normal';
    h1.style.textTransform = textFx.uppercase ? 'uppercase' : 'none';
    h1.style.lineHeight    = String(lineHeight);

    const hr = h1.getBoundingClientRect();
    const hb = {
      x: (headX / 100) * W, y: (headY / 100) * H,
      w: Math.min(hr.width,  maxWidth),
      h: Math.min(hr.height, maxHeight),
    };
    const fb = { x: fl, y: ft, w: fw, h: fh };

    const tooWide  = hb.w > maxWidth;
    const tooTall  = hb.h > maxHeight;
    const overlaps = showFaceGuide ? inter(hb, fb) : false;

    if (!tooWide && !tooTall && !overlaps) break;
    sizePx -= 2;
  }

  // Clamp to the ceiling/floor and commit
  const finalPx = Math.max(minSize, Math.min(sizePx, hardMax));
  setHeadlinePx(finalPx);
}, [
  // content & layout
  headline, format, tallHeadline, lineHeight, textColWidth, headX, headY, align,
  // guides
  faceH, faceRight, faceTop, faceW, showFaceGuide,
  // style
  textFx.bold, textFx.italic, textFx.tracking, textFx.uppercase,
  // mode/limits
  headSizeAuto, headManualPx, headMaxPx, headlineFontTick
]);
/* >>> HEADLINE SIZE AUTO-FIT (END) <<< */


  // drag to move positions
// drag state (unchanged)
const drag = useRef<{
  target: MoveTarget | null;
  shapeId?: string;
  offX: number;
  offY: number;
  wPct?: number;
  hPct?: number;
  curX?: number;
  curY?: number;
  baseX?: number;
  baseY?: number;
  pointerId?: number;
  resizeIcon?: boolean;
  resizePortrait?: boolean;
  rect?: DOMRect;
} | null>(null);

// Track what's currently being dragged so we can show the box while dragging
const isActive = React.useCallback(
  (t: MoveTarget) => (dragging === t) || (moveMode && moveTarget === t),
  [moveMode, moveTarget, dragging]
);
const posSnap = (v: number) => (snap ? Math.round(v) : v);

const bgDragRaf = useRef<number | null>(null);
const bgDragQueued = useRef<{ x: number; y: number } | null>(null);




// ============================================================
// === rAF DRAG THROTTLE ENGINE ===============================
// ============================================================
let __dragRAF: number | null = null;
let __dragEvt: PointerEvent | null = null;

function scheduleDragFrame(cb: (e: PointerEvent) => void, e: PointerEvent) {
  const coalesced = e.getCoalescedEvents?.();
  __dragEvt = coalesced && coalesced.length ? coalesced[coalesced.length - 1] : e;
  if (__dragRAF !== null) return;

  __dragRAF = requestAnimationFrame(() => {
    cb(__dragEvt!);
    __dragEvt = null;
    __dragRAF = null;
  });
}

function scheduleBgDragMove(el: HTMLElement, x: number, y: number) {
  bgDragQueued.current = { x, y };
  if (bgDragRaf.current != null) return;

  bgDragRaf.current = requestAnimationFrame(() => {
    const move = bgDragQueued.current;
    bgDragQueued.current = null;
    bgDragRaf.current = null;
    if (!move || el.dataset.bgdrag !== "1") return;

    const dx = move.x - parseFloat(el.dataset.px || "0");
    const dy = move.y - parseFloat(el.dataset.py || "0");
    const w = parseFloat(el.dataset.cw || "1");
    const h = parseFloat(el.dataset.ch || "1");
    const startX = parseFloat(el.dataset.sx || "50");
    const startY = parseFloat(el.dataset.sy || "50");

    const nextX = startX + (dx / w) * 100;
    const nextY = startY + (dy / h) * 100;

    el.style.left = `${nextX}%`;
    el.style.top = `${nextY}%`;
  });
}


function beginDrag(
  e: React.PointerEvent,
  target: MoveTarget,
  node?: Element | null,
  shapeId?: string
) {
  // 1. STOP & CAPTURE IMMEDIATELY (Prevents Drop-out)
  e.preventDefault();
  e.stopPropagation();

  try {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  } catch (err) {
    // ignore
  }

  // 2. LOGS & STATE UPDATES (ONE atomic update)


  // ✅ ONE state write instead of 3 separate writes (removes spam + reduces input delay)
  useFlyerState.setState({
    moveTarget: target,
    dragging: target,
    isLiveDragging: true,
  });

  // 3. CALCULATE OFFSETS
  const root = rootRef.current;
  if (!root) return;

  // Respect locks
  if (
    (target === "shape" || target === "icon") &&
    shapeId &&
    isLockedFn?.(target, shapeId)
  ) {
    return;
  }

  const rect = root.getBoundingClientRect();
  const pointerX = e.clientX - rect.left;
  const pointerY = e.clientY - rect.top;

  const getOff = (el: Element | null) => {
    if (!el) return { offX: 0, offY: 0, wPct: 0, hPct: 0 };
    const r = el.getBoundingClientRect();
    return {
      offX: pointerX - (r.left - rect.left),
      offY: pointerY - (r.top - rect.top),
      wPct: (r.width / rect.width) * 100,
      hPct: (r.height / rect.height) * 100,
    };
  };

  const elForOffset = node ?? (e.currentTarget as Element);
  const { offX, offY, wPct, hPct } = getOff(elForOffset);

  // 4. INIT DRAG REF
  drag.current = {
    target,
    shapeId,
    offX, // Mouse position relative to element start
    offY,
    wPct,
    hPct,
    baseX: bgPosX, // Snapshot current positions
    baseY: bgPosY,
    pointerId: e.pointerId,
    rect,
  };

  const end = () => {
    endDrag();
    setDragging(null); // Clear dragging state
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", end, { passive: true });
  window.addEventListener("pointercancel", end, { passive: true });
}



function beginIconResize(e: React.PointerEvent, ic: Icon) {
  e.preventDefault();
  e.stopPropagation();

  const root = rootRef.current; if (!root) return;
  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);

  const rect = root.getBoundingClientRect();

  // Tag this as an icon resize (keep a valid MoveTarget)
  drag.current = {
    target: 'icon',
    shapeId: ic.id,
    offX: e.clientX - rect.left,
    offY: e.clientY - rect.top,
    wPct: ic.size,                 // stash current size “units”
    pointerId: e.pointerId,
    resizeIcon: true,              // 👈 key line
    rect,
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', endDrag, { passive: true });
  window.addEventListener('pointercancel', endDrag, { passive: true });
}

function beginPortraitResize(e: React.PointerEvent) {
  e.preventDefault();
  e.stopPropagation();

  const root = rootRef.current; if (!root) return;
  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);

  const rect = root.getBoundingClientRect();

  // Use the current portrait box % width from the DOM
  // We already store wPct for drag — it’s used to convert px deltas into % deltas.
  const box = canvasRefs.portrait?.getBoundingClientRect();
  const wPct = box ? (box.width / rect.width) * 100 : portraitScale * 100;


  drag.current = {
    target: 'portrait',
    offX: e.clientX - rect.left,
    offY: e.clientY - rect.top,
    wPct,                      // current wrapper width in %
    pointerId: e.pointerId,
    resizePortrait: true,      // 👈 key flag
    rect,
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', endDrag, { passive: true });
  window.addEventListener('pointercancel', endDrag, { passive: true });
}




// ===============================================
// 🔥 HIGH-PERFORMANCE DRAG MOVE HANDLER (PATCH)
// ===============================================
const onMoveImmediate = (() => {
  let lastX = 0;
  let lastY = 0;

  return function onMove(ev: PointerEvent) {
    const d = drag.current;
    if (!d) return;

    const root = rootRef.current;
    if (!root) return;

    const rect = d.rect ?? root.getBoundingClientRect();
    const clientX = ev.clientX - rect.left;
    const clientY = ev.clientY - rect.top;

    // 1. Throttle slightly
    if (Math.abs(clientX - lastX) < 0.7 && Math.abs(clientY - lastY) < 0.7) return;
    lastX = clientX;
    lastY = clientY;

    // Ensure we have numbers (fix for TS error)
    const startX = d.offX ?? 0;
    const startY = d.offY ?? 0;
    const baseX  = d.baseX ?? 0;
    const baseY  = d.baseY ?? 0;

    // 2. BACKGROUND SPECIAL CASE
    if (d.target === "background") {
      // Calculate delta %
      const deltaXPct = ((clientX - startX) / rect.width) * 100;
      const deltaYPct = ((clientY - startY) / rect.height) * 100;

      // Subtract delta for panning feel
      const nx = clamp01(baseX - deltaXPct);
      const ny = clamp01(baseY - deltaYPct);

      if (canvasRefs.background) {
        canvasRefs.background.style.setProperty("background-position", `${nx}% ${ny}%`, "important");
      }

      d.curX = nx;
      d.curY = ny;
      return; 
    }

    // 3. OTHER ELEMENTS
    // Standard absolute positioning
    // ✅ FIX: Do not add baseX/baseY. Just map (Pointer - Offset) to %.
    const newXRaw = ((clientX - startX) / rect.width) * 100;
    // We explicitly cast to number to satisfy TS
    const nx = posSnap(clampVirtual(Number(newXRaw)));
    
    const newYRaw = ((clientY - startY) / rect.height) * 100;
    const ny = posSnap(clampVirtual(Number(newYRaw)));

    if (d.target && d.target !== "shape" && d.target !== "icon" && canvasRefs[d.target]) {
       const el = canvasRefs[d.target] as HTMLElement;
       el.style.left = `${nx}%`;
       el.style.top = `${ny}%`;
    }

    d.curX = nx;
    d.curY = ny;
  };
})();

function onMove(ev: PointerEvent) {
  scheduleDragFrame(onMoveImmediate, ev);
}


function endDrag() {
  const d = drag.current;
  if (!d) return;

  const st = useFlyerState.getState();
  const fmt = format;

  // commit helper (prevents NaN + keeps within 0..100-ish if you want)
  const commitXY = (x: number, y: number) => {
    const safeX = Number.isFinite(x) ? x : 0;
    const safeY = Number.isFinite(y) ? y : 0;
    return { safeX, safeY };
  };

  if (typeof d.curX === "number" && typeof d.curY === "number") {
    const { safeX, safeY } = commitXY(d.curX, d.curY);

    // ✅ background commits ONCE (and also calls onBgMove)
    if (d.target === "background") {
      p.onBgMove?.(safeX, safeY);
      st.setSessionValue(fmt, "bgPosX", safeX);
      st.setSessionValue(fmt, "bgPosY", safeY);
    } else {
      // ✅ everything else
      switch (d.target) {
        case "headline":
          st.setSessionValue(fmt, "headX", safeX);
          st.setSessionValue(fmt, "headY", safeY);
          break;
        case "headline2":
          st.setSessionValue(fmt, "head2X", safeX);
          st.setSessionValue(fmt, "head2Y", safeY);
          break;
        case "details":
          st.setSessionValue(fmt, "detailsX", safeX);
          st.setSessionValue(fmt, "detailsY", safeY);
          break;
        case "details2":
          st.setSessionValue(fmt, "details2X", safeX);
          st.setSessionValue(fmt, "details2Y", safeY);
          break;
        case "venue":
          st.setSessionValue(fmt, "venueX", safeX);
          st.setSessionValue(fmt, "venueY", safeY);
          break;
        case "subtag":
          st.setSessionValue(fmt, "subtagX", safeX);
          st.setSessionValue(fmt, "subtagY", safeY);
          break;
        case "logo":
          st.setSessionValue(fmt, "logoX", safeX);
          st.setSessionValue(fmt, "logoY", safeY);
          break;

        case "portrait":
          if (d.shapeId) {
            const list = st.portraits[fmt] || [];
            const idx = list.findIndex((p2: any) => p2.id === d.shapeId);
            if (idx !== -1) {
              const updated = [...list];
              updated[idx] = { ...updated[idx], x: safeX, y: safeY };
              st.setPortraits(fmt, updated);
            }
          }
          break;
      }
    }
  }

  // Cleanup
  st.setDragging(null);
  st.setIsLiveDragging(false);
  drag.current = null;

  window.removeEventListener("pointermove", onMove);
  window.removeEventListener("pointerup", endDrag);
  window.removeEventListener("pointercancel", endDrag);
}

    /* === PAN & ZOOM MATH (background) ===
      We pan with translate(...) and zoom with scale(...).
      When scale = 1, extraW/H = 0 so translate is 0 (no blank edges). */
    const extraW = (bgScale - 1) * size.w; // how much wider than the canvas (px)
    const extraH = (bgScale - 1) * size.h; // how much taller than the canvas (px)

    // bgPosX/Y are 0..100 (0 = left/top edge, 50 = centered, 100 = right/bottom)
    const tx = ((50 - bgPosX) / 100) * extraW; // +right / -left
    const ty = ((50 - bgPosY) / 100) * extraH; // +down  / -up
 

return (
 <div
  ref={(el) => {
    if (!el || !el.isConnected) return;
    const last = (rootRef as any)._lastFormat;
    if (!last || last !== format) {
      rootRef.current = el;
      setRootRef(el);
      (rootRef as any)._lastFormat = format;
    }
    canvasRefs.root = el;
  }}
  className="relative rounded-2xl overflow-hidden shadow-2xl select-none"

  // ✅ CLICK EMPTY STAGE => BACKGROUND MODE + CLEAR HALO
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    const store = useFlyerState.getState();

    // 1) Clear selection halo (this is what draws the blue outline)
    store.setSelectedPortraitId(null);

    // 2) Stop any drag state if your store supports it
    store.setDragging?.(null);

    // 3) Open background panels (your BGFX panel opens too if it keys off "background")
    store.setSelectedPanel("background");

    // 4) Background becomes move target for panning/zooming
    store.setMoveTarget("background");
  }}

  onWheel={(e) => {
    if (moveTarget !== "background") return;
    if (!e.ctrlKey && !e.metaKey) return;

    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;

    const zoomFactor = e.deltaY < 0 ? 1.06 : 0.94;
    const newScale = Math.max(1.0, Math.min(3.0, bgScale * zoomFactor));

    const k = (newScale - bgScale) / newScale;
    onBgScale?.(newScale);

    const nx = clamp01(bgPosX + (mx - 50) * k);
    const ny = clamp01(bgPosY + (my - 50) * k);
    onBgMove?.(nx, ny);
  }}
  style={{
    width: size.w,
    height: size.h,
    background: `linear-gradient(180deg, ${palette.bgFrom}, ${palette.bgTo})`,
    touchAction: "none",
    isolation: "isolate",
    contain: "layout paint",
    backfaceVisibility: "hidden",
  }}
>


    {/* canvas halo */}
    <div
      aria-hidden
      className="absolute -inset-3 rounded-[22px] -z-10"
      style={{
        background:
          'radial-gradient(60% 60% at 50% 0%, rgba(99,102,241,.35), rgba(236,72,153,.12) 40%, transparent 70%)',
        filter: 'blur(22px)',
      }}
    />

{/* CANVAS BACKGROUND — pan & zoom via translate+scale */}
{/* BACKGROUND LAYER (Robust Window-Listener Version) */}
  {(bgUploadUrl || bgUrl) && (
  <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
    <div
      ref={(el) => {
        if (canvasRefs) canvasRefs.background = el;
      }}
      className="absolute"
      style={{
        // 1. ANCHOR: React controls the resting position
        left: `${bgX}%`,
        top: `${bgY}%`,
        width: "100%",
        height: "100%",

        // 2. TRANSFORM: Handles Scale & Center
        transform: `translate(-50%, -50%) scale(${bgScale})`,
        transformOrigin: "center center",
        willChange: "left, top",

        pointerEvents: "auto",
        cursor: moveTarget === "background" ? "grabbing" : "grab",
        touchAction: "none",
        filter: `hue-rotate(${hue}deg) contrast(${1 + clarity * 0.2}) saturate(${1 + clarity * 0.4}) blur(${bgBlur}px)`,
      }}

      // ✅ PATCH: click background => clear selection halo + open background panels
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const store = useFlyerState.getState();

        // remove any active element halo/selection
        store.setSelectedPortraitId(null);
        store.setDragging(null);

        // open background + background effects (both are under "background")
        store.setSelectedPanel("background");
        store.setMoveTarget("background");
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const el = e.currentTarget;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {}

        const store = useFlyerState.getState();

        // ✅ PATCH: background interaction clears any active element halo immediately
        store.setSelectedPortraitId(null);
        store.setDragging(null);

        // ✅ open background panels + set move mode
        store.setMoveTarget("background");
        store.setSelectedPanel("background");

        // --- INIT DRAG ---
        el.dataset.bgdrag = "1";
        el.dataset.px = String(e.clientX);
        el.dataset.py = String(e.clientY);
        el.dataset.sx = String(bgX);
        el.dataset.sy = String(bgY);

        const root = rootRef.current || el.parentElement;
        const r = root?.getBoundingClientRect();
        el.dataset.cw = String(r?.width || 1);
        el.dataset.ch = String(r?.height || 1);

        el.style.transition = "none";
      }}
      onPointerMove={(e) => {
        const el = e.currentTarget;
        if (el.dataset.bgdrag !== "1") return;

        scheduleBgDragMove(el, e.clientX, e.clientY);

        // ❌ REMOVED: Live onBgMove call.
        // The UI numbers will stay static until you drop.
      }}
      onPointerUp={(e) => {
        const el = e.currentTarget;
        if (el.dataset.bgdrag !== "1") return;
        el.dataset.bgdrag = "0";

        try {
          el.releasePointerCapture(e.pointerId);
        } catch {}

        if (bgDragRaf.current != null) {
          cancelAnimationFrame(bgDragRaf.current);
          bgDragRaf.current = null;
        }
        bgDragQueued.current = null;

        // 3. FINAL COMMIT (React Update)
        // This triggers ONE single re-render at the end.
        const finalX = parseFloat(el.style.left) || bgX;
        const finalY = parseFloat(el.style.top) || bgY;

        setBgX(finalX);
        setBgY(finalY);

        if (onBgMove) onBgMove(finalX, finalY);
      }}
    >
      <img
        ref={(el) => {
          // ✅ FIX: Check dimensions immediately (fixes cached images stretching)
          if (el && el.complete) {
            const isWide =
              el.naturalWidth / el.naturalHeight > size.w / size.h;
            // Only update if different to prevent infinite re-renders
            if (bgIsLandscape !== isWide) setBgIsLandscape(isWide);
          }
        }}
        src={bgUploadUrl || bgUrl || ""}
        alt="background"
        draggable={false}
        // ✅ FIX: Also catch standard load events
        onLoad={(e) => {
          const img = e.currentTarget;
          const isWide = img.naturalWidth / img.naturalHeight > size.w / size.h;
          if (bgIsLandscape !== isWide) setBgIsLandscape(isWide);
        }}
        style={{
          pointerEvents: "none",
          userSelect: "none",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          // ✅ FIX: Smart Scaling (mimics 'cover' but keeps overflow)
          width: bgIsLandscape ? "auto" : "100%",
          height: bgIsLandscape ? "100%" : "auto",
          minWidth: "100%",
          minHeight: "100%",
          maxWidth: "none",
          maxHeight: "none",
        }}
      />
    </div>
  </div>
)}


{/* Vignette + haze overlays */}
<div className="absolute inset-0 pointer-events-none" style={{ zIndex: 12 }}>
  {/* Vignette: center clear → edges dark; TRIPLED intensity */}
  <div
    className="absolute inset-0"
    style={{
    background: `radial-gradient(ellipse at 50% 50%,
      rgba(0,0,0,0) 45%,
      rgba(0,0,0,${Math.min(1, vignette * 5.5)}) 85%,
      rgba(0,0,0,${Math.min(1, vignette * 8)}) 100%
    )`,
  }}
  />

  {/* Haze (unchanged) */}
  <div
    className="absolute inset-0"
    style={{
      background: `linear-gradient(180deg,
        rgba(0,0,0,${haze * 0.25}) 0%,
        rgba(0,0,0,0) 60%
      )`,
    }}
  />
  </div>


    {/* Cinematic color grade (soft-light, under text) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          mixBlendMode: 'soft-light',
          opacity: Math.max(0, Math.min(1, grade)),
          // warm/cool dual grade: warm from top-right, cool from bottom-left
          background:
            'radial-gradient(140% 100% at 75% 15%, rgba(255,190,120,0.55) 0%, rgba(0,0,0,0) 55%),' +
            'radial-gradient(140% 100% at 15% 85%, rgba(70,130,255,0.55) 0%, rgba(0,0,0,0) 52%)',
          zIndex: 12,
        }}
      />

      {/* Light leaks (screen blend corners) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          mixBlendMode: 'screen',
          opacity: Math.max(0, Math.min(1, leak)),
          // amber leak top-left, magenta leak bottom-right
          background:
            'radial-gradient(50% 40% at 0% 0%, rgba(255,80,0,0.45) 0%, rgba(255,80,0,0) 60%),' +
            'radial-gradient(55% 45% at 100% 100%, rgba(200,0,255,0.38) 0%, rgba(200,0,255,0) 58%)',
          zIndex: 13,
        }}
      />
{/* Subtle film grain */}
<div
  className="pointer-events-none absolute inset-0"
  style={{
    zIndex: 14,
    mixBlendMode: 'overlay',
    opacity: allowPeople ? 0.12 : 0.08,
    backgroundImage: `
      radial-gradient(1px 1px at 25% 20%, rgba(255,255,255,.08), transparent 60%),
      radial-gradient(1px 1px at 60% 80%, rgba(255,255,255,.06), transparent 60%),
      radial-gradient(1px 1px at 80% 40%, rgba(255,255,255,.05), transparent 60%),
      radial-gradient(1px 1px at 40% 60%, rgba(255,255,255,.07), transparent 60%)
    `,
    backgroundSize: '120px 120px',
  }}
/>
{/* ====================================================================== */}
{/* ====================== PORTRAIT LAYER (COMPLETE) ====================== */}
{/* ====================================================================== */}

{/* =======================================================
    PORTRAIT LAYER (GLOBAL ZUSTAND, LIKE EMOJIS)
    - Uses flyerState.portraits[format]
    - Draggable with beginDrag
    - Lock / delete per portrait
   ======================================================= */}
   
{/* ====================== PORTRAIT LAYER (FIXED) ====================== */}





{/* ====================== PORTRAIT LAYER (END) =========================== */}


{/* ====================================================================== */}
{/* =========================== SHAPES LAYER ============================== */}
{/* ====================================================================== */}
{Array.isArray(shapesProp) && shapesProp.length > 0 && (
  <>
    <svg
      className="absolute inset-0"
      style={{
        zIndex: 18,
        pointerEvents: 'auto',
        cursor: moveMode && moveTarget === 'shape' ? 'grab' : 'default',
      }}
    >
      {shapesProp.map((sh) => (
        <g
          key={sh.id}
          onPointerDown={(e) => {
            if (isLockedFn?.('shape', sh.id)) return;
            onSelectShape?.(sh.id);
            beginDrag(
              e as unknown as React.PointerEvent,
              'shape',
              e.currentTarget as unknown as SVGGraphicsElement,
              sh.id
            );
          }}
          onClick={() => onSelectShape?.(sh.id)}
          style={{ pointerEvents: 'auto' }}
        >
          {/* === SHAPE BASE === */}
          {sh.kind === 'rect' && (
            <rect
              x={`${sh.x}%`}
              y={`${sh.y}%`}
              width={`${(sh.width ?? 10)}%`}
              height={`${(sh.height ?? 6)}%`}
              transform={sh.rotation ? `rotate(${sh.rotation}, ${sh.x}%, ${sh.y}%)` : undefined}
              fill={sh.fill}
              stroke={sh.stroke}
              strokeWidth={sh.strokeWidth}
              opacity={sh.opacity}
              rx="2%"
              ry="2%"
            />
          )}

          {sh.kind === 'circle' && (() => {
            const px = (sh.r ?? 6) * 5.4;
            return (
              <circle
                cx={`${sh.x}%`}
                cy={`${sh.y}%`}
                r={px}
                fill={sh.fill}
                stroke={sh.stroke}
                strokeWidth={sh.strokeWidth}
                opacity={sh.opacity}
              />
            );
          })()}

          {sh.kind === 'line' && (
            <line
              x1={`${sh.x}%`}
              y1={`${sh.y}%`}
              x2={`${(sh.x + (sh.width ?? 12))}%`}
              y2={`${(sh.y + (sh.height ?? 0))}%`}
              stroke={sh.stroke}
              strokeWidth={sh.strokeWidth}
              opacity={sh.opacity}
            />
          )}

          {/* === SHAPE OUTLINE (ACTIVE) === */}
          {isActive('shape') && selShapeId === sh.id && (
            <>
              {sh.kind === 'rect' && (
                <rect
                  x={`${sh.x}%`}
                  y={`${sh.y}%`}
                  width={`${(sh.width ?? 10)}%`}
                  height={`${(sh.height ?? 6)}%`}
                  transform={sh.rotation ? `rotate(${sh.rotation}, ${sh.x}%, ${sh.y}%)` : undefined}
                  fill="none"
                  stroke={NEON}
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                  opacity={0.95}
                />
              )}

              {sh.kind === 'circle' && (() => {
                const px = (sh.r ?? 6) * 5.4;
                return (
                  <circle
                    cx={`${sh.x}%`}
                    cy={`${sh.y}%`}
                    r={px}
                    fill="none"
                    stroke={NEON}
                    strokeWidth={2.5}
                    strokeDasharray="4 3"
                    opacity={0.95}
                  />
                );
              })()}

              {sh.kind === 'line' && (
                <line
                  x1={`${sh.x}%`}
                  y1={`${sh.y}%`}
                  x2={`${(sh.x + (sh.width ?? 12))}%`}
                  y2={`${(sh.y + (sh.height ?? 0))}%`}
                  stroke={NEON}
                  strokeWidth={3}
                  strokeDasharray="4 3"
                  opacity={0.95}
                />
              )}
            </>
          )}
        </g>
      ))}
    </svg>

    {/* === SHAPE TOOLBAR (LOCK/DELETE) === */}
    {moveTarget === 'shape' && selShapeId && (() => {
      const sel = (shapesProp || []).find(s => s.id === selShapeId);
      if (!sel) return null;

      return (
        <div
          className="absolute"
          style={{
            left: `${sel.x}%`,
            top: `${sel.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1100,
            pointerEvents: 'none'
          }}
        >
          <div
            className="absolute"
            style={{
              top: 0,
              right: -18,
              display: 'flex',
              gap: 6,
              pointerEvents: 'auto'
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lock */}
            <button
              type="button"
              title={(p.isLocked?.('shape', sel.id) ?? false) ? 'Unlock' : 'Lock'}
              onClick={() => p.onToggleLock?.('shape', sel.id)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: '#0f172a',
                border: '1px solid #334155',
                color: (p.isLocked?.('shape', sel.id) ?? false) ? '#70FFEA' : '#ffffff',
                lineHeight: 1,
              }}
            >
              {(p.isLocked?.('shape', sel.id) ?? false) ? '🔒' : '🔓'}
            </button>

            {/* Portrait Actions (legacy UI kept) */}
            <div style={{ display:'flex', gap:6 }}>
              <button
                type="button"
                title={p.portraitLocked ? 'Unlock portrait' : 'Lock portrait'}
                onClick={p.onTogglePortraitLock}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                }}
              >
                {p.portraitLocked ? '🔒' : '🔓'}
              </button>

              <button
                type="button"
                title="Delete"
                onClick={() => p.onDeletePortrait?.()}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                }}
              >
                🗑️
              </button>
            </div>

          </div>
        </div>
      );
    })()}
  </>
)}
{/* =========================== SHAPES LAYER (END) ======================== */}



{/* ====================================================================== */}
{/* ============================= ICONS LAYER ============================= */}
{/* ====================================================================== */}
{Array.isArray(iconsProp) && iconsProp.length > 0 && (
  <div
    className="absolute inset-0"
    style={{ zIndex: 36, pointerEvents: 'none' }}
  >
    {iconsProp.map((ic) => (
      (() => {
        const locked = p.isLocked?.('icon', ic.id) ?? false;
        const clickThrough = locked;

        return (
      <div
        key={ic.id}
        className="group"
        style={{
          position: 'absolute',
          left: `${ic.x}%`,
          top: `${ic.y}%`,
          transform: `translate(-50%, -50%) rotate(${ic.rotation ?? 0}deg)`,
          opacity: ic.opacity ?? 1,
          zIndex: isActive('icon') && selIconId === ic.id ? 999 : 36,
          pointerEvents: clickThrough ? 'none' : 'auto',
          cursor: clickThrough ? 'default' : 'grab',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))',
          borderRadius: 8,
          outline: isActive('icon') && selIconId === ic.id
            ? '2px dashed #A78BFA'
            : undefined,
          outlineOffset: 4,
          width: `${ic.size * 5.4}px`,
          height: `${ic.size * 5.4}px`,
        }}
        onPointerDown={(e) => {
          if (clickThrough) return;
          onSelectIcon?.(ic.id);
          beginDrag(
            e as any,
            'icon',
            e.currentTarget as any,
            ic.id
          );
        }}
        onClick={() => {
          if (clickThrough) return;
          onSelectIcon?.(ic.id);
        }}
      >
        {/* === ICON IMAGE / SVG / EMOJI === */}
        {ic.svgPath ? (
          <svg width="100%" height="100%" viewBox="0 0 24 24">
            <path
              d={ic.svgPath}
              fill={ic.fill ?? 'white'}
              stroke={ic.stroke ?? 'none'}
              strokeWidth={ic.strokeWidth ?? 0}
            />
          </svg>
        ) : ic.imgUrl ? (
          <img
            src={ic.imgUrl}
            alt={ic.name || 'icon'}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        ) : (
          <span
            style={{
              fontSize: ic.size * 5.4,
              lineHeight: 1,
              color: ic.fill ?? 'white',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              display: 'inline-block'
            }}
          >
            {ic.emoji ?? '⭐️'}
          </span>
        )}

        {/* === ICON TOOLS (LOCK / DELETE) === */}
        {isActive('icon') && selIconId === ic.id && (() => {
          return (
            <div
              className="absolute"
              style={{
                top: -6,
                right: -6,
                zIndex: 1100,
                display: 'flex',
                gap: 6,
                pointerEvents: 'auto'
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lock */}
              <button
                type="button"
                title={locked ? 'Unlock' : 'Lock'}
                onClick={() => p.onToggleLock?.('icon', ic.id)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: locked ? '#70FFEA' : '#ffffff',
                  lineHeight: 1
                }}
              >
                {locked ? '🔒' : '🔓'}
              </button>

              {/* Delete */}
              <button
                type="button"
                title="Delete icon"
                onClick={() => onDeleteIcon?.(ic.id)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  lineHeight: 1
                }}
              >
                🗑️
              </button>
            </div>
          );
        })()}

        {/* === ICON RESIZE HANDLE === */}
        <button
          type="button"
          title="Resize"
          onPointerDown={(e) => {
            if (clickThrough) return;
            beginIconResize(e, ic);
          }}
          className="absolute z-[1000]"
          style={{
            right: -3,
            bottom: -3,
            width: 14,
            height: 14,
            borderRadius: 4,
            background: '#0f172a',
            border: '1px solid #334155',
            cursor: 'nwse-resize',
            pointerEvents: clickThrough ? 'none' : 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
        );
      })()
    ))}
  </div>
)}
{/* ============================= ICONS LAYER (END) ======================= */}


{/* LOGO LAYER (Fixed: Uses Props instead of Missing State) */}
       
      {/* Hidden headline measurer */}
{/* MEASUREMENT HEADLINE (remove this block) */}
<h1
  ref={(el) => {
  canvasRefs.measure = el;
}}
  className="font-black absolute opacity-0 pointer-events-none"
  style={{
    left: `${headX}%`,
    top: `${headY}%`,
    width: `${textColWidth}%`,
    fontFamily: headlineFamily,
    fontSize: headDisplayPx,
    lineHeight,
    whiteSpace: 'normal',
    letterSpacing: `${textFx.tracking}em`,
    textTransform: textFx.uppercase ? 'uppercase' : 'none',
    fontWeight: textFx.bold ? 900 : 700,
    fontStyle: textFx.italic ? 'italic' : 'normal',
    textDecorationLine: textFx.underline ? 'underline' : 'none',
    display: 'block',
    transformOrigin: '50% 50%',
    WebkitTextStrokeWidth: textFx.gradient
      ? undefined
      : textFx.strokeWidth
      ? `${textFx.strokeWidth}px`
      : undefined,
    WebkitTextStrokeColor: textFx.gradient ? undefined : textFx.strokeColor,
    color: textFx.texture
  ? 'transparent'
  : textFx.gradient
  ? undefined
  : textFx.color,

WebkitTextFillColor: textFx.texture
  ? 'transparent'
  : textFx.gradient
  ? 'transparent'
  : textFx.color,

backgroundImage: textFx.texture
  ? `url(${textFx.texture})`
  : textFx.gradient
  ? `linear-gradient(180deg, ${textFx.gradFrom}, ${textFx.gradTo})`
  : 'none',

backgroundSize: textFx.texture ? 'cover' : '100% 100%',
backgroundRepeat: 'no-repeat',
backgroundPosition: 'center',
WebkitBackgroundClip: (textFx.texture || textFx.gradient) ? 'text' : 'border-box',
backgroundClip: (textFx.texture || textFx.gradient) ? 'text' : 'border-box',

    
  }}
>
  {
    renderHeadlineRich(
      textFx.uppercase ? headline.toUpperCase() : headline,
      {
        baseTrackEm: textFx.tracking,
        leadDeltaEm: leadTrackDelta,
        lastDeltaEm: lastTrackDelta,
        opticalMargin,
        kerningFix,

        lineHeight: lineHeight,
        lineStyle: textFx.gradient
        
          ? {
              backgroundImage: `linear-gradient(180deg, ${textFx.gradFrom}, ${textFx.gradTo})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              WebkitTextStrokeWidth: textFx.strokeWidth
                ? `${textFx.strokeWidth}px`
                : undefined,
              WebkitTextStrokeColor: textFx.strokeColor,
            }
          : undefined
      }
    )
  }
</h1>



{/* HEADLINE (BEGIN) - FIXED & THROTTLED */}
<div
  ref={(el) => {
    canvasRefs.headline = el;
  }}
  data-anim-field
  data-node="headline"
  data-active={isActive("headline") ? "true" : "false"}
  className="absolute cursor-grab active:cursor-grabbing select-none"
  
  // 1. SELECT
  onClick={(e) => {
    e.stopPropagation();
    // ✅ Re-enabled: Select target and open specific panel
    useFlyerState.getState().setMoveTarget("headline");
    useFlyerState.getState().setSelectedPanel("headline"); 
  }}

  // 2. DRAG START
  onPointerDown={(e) => {
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    try { el.setPointerCapture(e.pointerId); } catch {}

    el.dataset.hdrag = "1";
    el.dataset.px = String(e.clientX);
    el.dataset.py = String(e.clientY);
    el.dataset.sx = String(headX ?? 0);
    el.dataset.sy = String(headY ?? 0);

    const parent = el.offsetParent || document.body;
    const b = parent.getBoundingClientRect();
    el.dataset.cw = String(b.width);
    el.dataset.ch = String(b.height);

    useFlyerState.getState().setFocus("headline", "headline");
    el.style.transition = "none";
  }}

  // 3. MOVE (Throttled Direct Update)
  onPointerMove={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;

    // Capture raw mouse coordinates immediately
    const clientX = e.clientX;
    const clientY = e.clientY;

    // 🔥 PERF FIX: Skip if a frame is already pending.
    // This prevents the "sluggish" feel by syncing updates to your screen rate.
    if ((el as any)._rafId) return;

    (el as any)._rafId = requestAnimationFrame(() => {
      (el as any)._rafId = null; // Clear lock

      // 1. Read Cached Values (Fast)
      const startX = Number(el.dataset.px);
      const startY = Number(el.dataset.py);
      const startLeft = Number(el.dataset.sx);
      const startTop = Number(el.dataset.sy);
      const cw = Number(el.dataset.cw || 1);
      const ch = Number(el.dataset.ch || 1);

      // 2. Calculate Math
      const dx = clientX - startX;
      const dy = clientY - startY;
      const nextX = startLeft + (dx / cw) * 100;
      const nextY = startTop + (dy / ch) * 100;

      // 3. Apply Style (Trigger Layout once per frame)
      el.style.left = `${nextX}%`;
      el.style.top = `${nextY}%`;
    });
  }}

  // 4. END
  onPointerUp={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;
    el.dataset.hdrag = "0";
    
    // Cancel any pending frame to avoid overwrite
    if ((el as any)._rafId) cancelAnimationFrame((el as any)._rafId);
    (el as any)._rafId = null;

    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const finalX = startLeft + (dx / cw) * 100;
    const finalY = startTop + (dy / ch) * 100;

    // Force final sync
    el.style.left = `${finalX}%`;
    el.style.top = `${finalY}%`;

    onHeadMove?.(finalX, finalY);

    try { el.releasePointerCapture(e.pointerId); } catch {}
  }}

  style={{
    left: `${headX}%`,
    top: `${headY}%`,
    overflow: 'visible',
    zIndex: isActive("headline") ? 999 : (headBehindPortrait ? 8 : 20),
    textAlign: headAlign,
    borderRadius: 8,
    opacity: headlineHidden ? 0 : 1,
    
    // No transform here, purely absolute positioning for 1:1 sync
    transform: `rotate(${headRotate}deg)`,
    transformOrigin: '50% 50%',
    
    transition: 'none',
    willChange: "left, top"
  }}
>
  <h1
    key={`headline-${headlineFamily}-${headlineFontTick}`}
    className="font-black"
    style={{
      fontFamily: headlineFamily,
      fontSize: headDisplayPx,
      lineHeight,
      whiteSpace: 'pre-wrap',
      display: 'block',
      minWidth: 'fit-content',
      maxWidth: '100%',
      letterSpacing: `${textFx.tracking}em`,
      textTransform: textFx.uppercase ? 'uppercase' : 'none',
      fontWeight: textFx.bold ? 900 : 700,
      fontStyle: textFx.italic ? 'italic' : 'normal',
      textDecorationLine: textFx.underline ? 'underline' : 'none',

      color: textFx.gradient ? 'transparent' : textFx.color,

      textShadow: dragging
        ? 'none'
        : headShadow
        ? buildPremiumTextShadow(headShadowStrength ?? 1, textFx.glow ?? 0)
        : 'none',

      ...(dragging
        ? {}
        : isActive('headline')
        ? { filter: 'drop-shadow(0 0 8px rgba(147,197,253,0.9))' }
        : {}),
    }}
  >
    {renderHeadlineRich(
      textFx.uppercase ? headline.toUpperCase() : headline,
      {
        baseTrackEm: textFx.tracking,
        leadDeltaEm: leadTrackDelta,
        lastDeltaEm: lastTrackDelta,
        opticalMargin,
        kerningFix,
        lineHeight: lineHeight,
        lineStyle: textFx.gradient
          ? {
              backgroundImage: `linear-gradient(180deg, ${textFx.gradFrom}, ${textFx.gradTo})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              display: 'block',
              width: '100%',
              WebkitTextStrokeWidth: textFx.strokeWidth
                ? `${textFx.strokeWidth}px`
                : undefined,
              WebkitTextStrokeColor: textFx.strokeColor,
            }
          : undefined,
      }
    )}
  </h1>
</div>
{/* HEADLINE (END) */}


{/* HEADLINE 2 (BEGIN) - FIXED SMOOTH DRAG */}
{head2Enabled && (
<div
  ref={(el) => {
    canvasRefs.headline2 = el;
  }}
  data-anim-field
  data-node="headline2"
  data-active={moveTarget === "headline2" ? "true" : "false"}
  className="absolute cursor-grab active:cursor-grabbing select-none"

  // 1. SELECT
  onClick={(e) => {
    e.stopPropagation();
    useFlyerState.getState().setMoveTarget("headline2");
    useFlyerState.getState().setSelectedPanel("head2"); 
  }}

  // 2. DRAG START
  onPointerDown={(e) => {
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    try { el.setPointerCapture(e.pointerId); } catch {}

    el.dataset.hdrag = "1";
    el.dataset.px = String(e.clientX);
    el.dataset.py = String(e.clientY);
    
    // Capture Start Percentages
    el.dataset.sx = String(head2X ?? 0);
    el.dataset.sy = String(head2Y ?? 0);

    const parent = el.offsetParent || document.body;
    const b = parent.getBoundingClientRect();
    el.dataset.cw = String(b.width);
    el.dataset.ch = String(b.height);

    useFlyerState.getState().setMoveTarget("headline2");
    useFlyerState.getState().setSelectedPanel("head2");

    el.style.transition = "none";
  }}

  // 3. MOVE (Direct Left/Top Update)
  onPointerMove={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;

    // 1. Get Deltas
    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // 2. Convert to %
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const nextX = startLeft + (dx / cw) * 100;
    const nextY = startTop + (dy / ch) * 100;

    // 3. Apply Directly
    el.style.left = `${nextX}%`;
    el.style.top = `${nextY}%`;
  }}

  // 4. END
  onPointerUp={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;
    el.dataset.hdrag = "0";

    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const finalX = startLeft + (dx / cw) * 100;
    const finalY = startTop + (dy / ch) * 100;

    // Sync State
    onHead2Move?.(finalX, finalY);

    try { el.releasePointerCapture(e.pointerId); } catch {}
  }}

  style={{
    left: `${head2X}%`,
    top: `${head2Y}%`,
    overflow: 'visible',
    zIndex: moveTarget === 'headline2' ? 999 : 30,
    fontFamily: head2Family,
    cursor: 'grab',
    textAlign: head2Align,
    borderRadius: 8,
    
    // 🔥 No Transform Drag (Rotation Only)
    transform: `rotate(${head2Rotate}deg)`,
    transformOrigin: '50% 50%',
    
    // 🔥 Disable transition for instant moves
    transition: 'none',
    willChange: "left, top"
  }}
>
  <div
    className="font-extrabold"
    style={{
      fontSize: head2SizePx,
      letterSpacing: `${head2Fx.tracking}em`,
      textTransform: head2Fx.uppercase ? 'uppercase' : 'none',
      fontWeight: head2Fx.bold ? 900 : 700,
      fontStyle: head2Fx.italic ? 'italic' : 'normal',
      textDecorationLine: head2Fx.underline ? 'underline' : 'none',
      color: head2Color,
      lineHeight: Number(head2LineHeight) || 1,
      whiteSpace: 'pre-wrap',
      display: 'block',
      minWidth: 'fit-content',
      maxWidth: '100%',

      // No internal transform here, handled by parent
      WebkitTextStrokeWidth: 0,
      WebkitTextStrokeColor: 'rgba(0,0,0,0.9)',

      textShadow: head2Shadow
        ? buildPremiumTextShadow(
            head2ShadowStrength ?? 1,
            head2Fx.glow ?? textFx.glow ?? 0
          )
        : 'none',

      filter:
        moveTarget === 'headline2'
          ? 'drop-shadow(0 0 8px rgba(147,197,253,0.9))'
          : 'none',
    }}
  >
    {renderWithDoubleBreaks(head2Text)}
  </div>
</div>
)}
{/* HEADLINE 2 (END) */}



{/* DETAILS (BEGIN) - FIXED SMOOTH DRAG */}
<div
  ref={(el) => {
    canvasRefs.details = el;
  }}
  data-anim-field
  data-node="details"
  data-active={moveTarget === "details" ? "true" : "false"}
  className="absolute cursor-grab active:cursor-grabbing select-none"

  // 1. SELECT
  onClick={(e) => {
    e.stopPropagation();
    useFlyerState.getState().setMoveTarget("details");
    useFlyerState.getState().setSelectedPanel("details"); 
  }}

  // 2. DRAG START
  onPointerDown={(e) => {
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    try { el.setPointerCapture(e.pointerId); } catch {}

    el.dataset.hdrag = "1";
    el.dataset.px = String(e.clientX);
    el.dataset.py = String(e.clientY);
    
    // Capture Start Percentages
    el.dataset.sx = String(detailsX ?? 0);
    el.dataset.sy = String(detailsY ?? 0);

    const parent = el.offsetParent || document.body;
    const b = parent.getBoundingClientRect();
    el.dataset.cw = String(b.width);
    el.dataset.ch = String(b.height);

    useFlyerState.getState().setMoveTarget("details");
    useFlyerState.getState().setSelectedPanel("details");

    el.style.transition = "none";
  }}

  // 3. MOVE (Direct Left/Top Update)
  onPointerMove={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;

    // 1. Get Deltas
    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // 2. Convert to %
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const nextX = startLeft + (dx / cw) * 100;
    const nextY = startTop + (dy / ch) * 100;

    // 3. Apply Directly
    el.style.left = `${nextX}%`;
    el.style.top = `${nextY}%`;
  }}

  // 4. END
  onPointerUp={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;
    el.dataset.hdrag = "0";

    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const finalX = startLeft + (dx / cw) * 100;
    const finalY = startTop + (dy / ch) * 100;

    // Sync State
    onDetailsMove?.(finalX, finalY);

    try { el.releasePointerCapture(e.pointerId); } catch {}
  }}

  style={{
    left: `${detailsX}%`,
    top: `${detailsY}%`,
    overflow: "visible",
    zIndex: moveTarget === "details" ? 999 : 30,
    fontFamily: detailsFamily,
    cursor: "grab",
    textAlign: detailsAlign,
    borderRadius: 8,
    
    // 🔥 No Transform Drag (Rotation Only)
    transform: `rotate(${detailsRotate}deg)`,
    transformOrigin: '50% 50%',
    
    // 🔥 Disable transition for instant moves
    transition: 'none',
    willChange: "left, top"
  }}
>
  <div
    style={{
      fontSize: bodySize,
      letterSpacing: `${bodyTracking}em`,
      textTransform: bodyUppercase ? 'uppercase' : 'none',
      fontWeight: bodyBold ? 800 : 600,
      fontStyle: bodyItalic ? 'italic' : 'normal',
      textDecorationLine: bodyUnderline ? 'underline' : 'none',
      color: bodyColor,
      lineHeight: detailsLineHeight,
      whiteSpace: 'pre-wrap',
      display: 'block',
      minWidth: 'fit-content',
      maxWidth: '100%',
      
      // Removed rotation from inner div to avoid double rotation
      // transform: `rotate(${detailsRotate}deg)`, 
      
      WebkitTextStrokeWidth: 0,
      WebkitTextStrokeColor: 'rgba(0,0,0,0.9)',
      textShadow: detailsShadow
        ? buildPremiumTextShadow(detailsShadowStrength ?? 1, 0)
        : 'none',
      filter:
        moveTarget === 'details'
          ? 'drop-shadow(0 0 8px rgba(147,197,253,0.9))'
          : 'none',
    }}
  >
    {renderWithDoubleBreaks(details)}
  </div>
</div>
{/* DETAILS (END) */}


{/* DETAILS 2 (BEGIN) - FIXED SMOOTH DRAG */}
{details2Enabled && details2 && (
<div
  ref={(el) => {
    canvasRefs.details2 = el;
  }}
  data-anim-field
  data-node="details2"
  data-active={moveTarget === "details2" ? "true" : "false"}
  className="absolute cursor-grab active:cursor-grabbing select-none"

 // 1. SELECT
  onClick={(e) => {
    e.stopPropagation();
    useFlyerState.getState().setMoveTarget("details2");
    useFlyerState.getState().setSelectedPanel("details2"); 
  }}

  // 2. DRAG START
  onPointerDown={(e) => {
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    try { el.setPointerCapture(e.pointerId); } catch {}

    el.dataset.hdrag = "1";
    el.dataset.px = String(e.clientX);
    el.dataset.py = String(e.clientY);
    
    // Capture Start Percentages
    el.dataset.sx = String(details2X ?? 0);
    el.dataset.sy = String(details2Y ?? 0);

    const parent = el.offsetParent || document.body;
    const b = parent.getBoundingClientRect();
    el.dataset.cw = String(b.width);
    el.dataset.ch = String(b.height);

    useFlyerState.getState().setMoveTarget("details2");
    useFlyerState.getState().setSelectedPanel("details2");

    el.style.transition = "none";
  }}

  // 3. MOVE (Direct Left/Top Update)
  onPointerMove={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;

    // 1. Get Deltas
    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // 2. Convert to %
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const nextX = startLeft + (dx / cw) * 100;
    const nextY = startTop + (dy / ch) * 100;

    // 3. Apply Directly
    el.style.left = `${nextX}%`;
    el.style.top = `${nextY}%`;
  }}

  // 4. END
  onPointerUp={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;
    el.dataset.hdrag = "0";

    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const finalX = startLeft + (dx / cw) * 100;
    const finalY = startTop + (dy / ch) * 100;

    // Sync State
    onDetails2Move?.(finalX, finalY);

    try { el.releasePointerCapture(e.pointerId); } catch {}
  }}

  style={{
    left: `${details2X ?? 0}%`,
    top: `${details2Y ?? 0}%`,
    overflow: 'visible',
    zIndex: moveTarget === 'details2' ? 999 : 30,
    cursor: 'grab',
    textAlign: details2Align ?? 'center',
    borderRadius: 8,
    
    // 🔥 No Transform Drag (Rotation Only)
    transform: `rotate(${p.details2Rotate ?? 0}deg)`,
    transformOrigin: '50% 50%',
    
    // 🔥 Disable transition for instant moves
    transition: 'none',
    willChange: "left, top"
  }}
>
    <div
      style={{
        fontFamily: p.details2Family,
        fontSize: p.details2Size ?? 22,
        letterSpacing: `${p.details2LetterSpacing ?? 0}em`,
        lineHeight: p.details2LineHeight ?? 1.2,
        textTransform: p.details2Uppercase ? 'uppercase' : 'none',
        fontWeight: p.details2Bold ? 800 : 600,
        fontStyle: p.details2Italic ? 'italic' : 'normal',
        textDecorationLine: p.details2Underline ? 'underline' : 'none',
        color: p.details2Color ?? '#fff',
        whiteSpace: 'pre-wrap',
        display: 'block',
        minWidth: 'fit-content',
        maxWidth: '100%',
        
        // Removed internal transform
        
      textShadow: details2Shadow
          ? buildPremiumTextShadow(details2ShadowStrength ?? 1, 0)
          : 'none',

        filter:
          moveTarget === 'details2'
            ? 'drop-shadow(0 0 8px rgba(147,197,253,0.9))'
            : 'none',
      }}
    >
      {renderWithDoubleBreaks(p.details2)}
    </div>
  </div>
)}
{/* DETAILS 2 (END) */}

{/* VENUE (BEGIN) - FIXED SMOOTH DRAG */}
<div
  ref={(el) => {
    canvasRefs.venue = el;
  }}
  data-anim-field
  data-node="venue"
  data-active={moveTarget === "venue" ? "true" : "false"}
  className="absolute cursor-grab active:cursor-grabbing select-none"

  // 1. SELECT
  onClick={(e) => {
    e.stopPropagation();
    useFlyerState.getState().setMoveTarget("venue");
    useFlyerState.getState().setSelectedPanel("venue"); 
  }}

  // 2. DRAG START
  onPointerDown={(e) => {
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    try { el.setPointerCapture(e.pointerId); } catch {}

    el.dataset.hdrag = "1";
    el.dataset.px = String(e.clientX);
    el.dataset.py = String(e.clientY);
    
    // Capture Start Percentages
    el.dataset.sx = String(venueX ?? 0);
    el.dataset.sy = String(venueY ?? 0);

    const parent = el.offsetParent || document.body;
    const b = parent.getBoundingClientRect();
    el.dataset.cw = String(b.width);
    el.dataset.ch = String(b.height);

    useFlyerState.getState().setMoveTarget("venue");
    useFlyerState.getState().setSelectedPanel("venue");

    el.style.transition = "none";
  }}

  // 3. MOVE (Direct Left/Top Update)
  onPointerMove={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;

    // 1. Get Deltas
    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // 2. Convert to %
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const nextX = startLeft + (dx / cw) * 100;
    const nextY = startTop + (dy / ch) * 100;

    // 3. Apply Directly
    el.style.left = `${nextX}%`;
    el.style.top = `${nextY}%`;
  }}

  // 4. END
  onPointerUp={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;
    el.dataset.hdrag = "0";

    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const finalX = startLeft + (dx / cw) * 100;
    const finalY = startTop + (dy / ch) * 100;

    // Sync State
    onVenueMove?.(finalX, finalY);

    try { el.releasePointerCapture(e.pointerId); } catch {}
  }}

  style={{
    left: `${venueX}%`,
    top: `${venueY}%`,
    overflow: 'visible',
    zIndex: moveTarget === 'venue' ? 999 : 30,
    fontFamily: venueFamily,
    cursor: 'grab',
    textAlign: venueAlign,
    borderRadius: 8,
    
    // 🔥 No Transform Drag (Rotation Only)
    transform: `rotate(${venueRotate}deg)`,
    transformOrigin: '50% 50%',
    
    // 🔥 Disable transition for instant moves
    transition: 'none',
    willChange: "left, top"
  }}
>
  <div
    className="font-extrabold"
    style={{
      color: venueColor,
      fontSize: venueSize,
      lineHeight: venueLineHeight,
      whiteSpace: 'pre-wrap',
      display: 'block',
      minWidth: 'fit-content',
      maxWidth: '100%',
      fontWeight: venueBold ? 800 : 600,
      textTransform: venueUppercase ? 'uppercase' : 'none',
      fontStyle: venueItalic ? 'italic' : 'normal',
      
      // Internal rotation removed to avoid doubling up
      
      WebkitTextStrokeWidth: 0,
      WebkitTextStrokeColor: 'rgba(0,0,0,0.9)',

      textShadow: venueShadow
        ? buildPremiumTextShadow(venueShadowStrength ?? 1, 0)
        : 'none',

      filter:
        moveTarget === 'venue'
          ? 'drop-shadow(0 0 8px rgba(147,197,253,0.9))'
          : 'none',
    }}
  >
    {renderWithDoubleBreaks(venue)}
  </div>
</div>
{/* VENUE (END) */}

{/* SUBTAG (BEGIN) - FIXED SMOOTH DRAG */}
{subtagEnabled[format] && (
<div
  ref={(el) => {
    canvasRefs.subtag = el;
  }}
  data-anim-field
  data-node="subtag"
  data-active={moveTarget === "subtag" ? "true" : "false"}
  className="absolute cursor-grab active:cursor-grabbing select-none"

 // 1. SELECT
 onClick={(e) => {
    e.stopPropagation();
    useFlyerState.getState().setMoveTarget("subtag");
    useFlyerState.getState().setSelectedPanel("subtag"); 
  }}

  // 2. DRAG START
  onPointerDown={(e) => {
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    try { el.setPointerCapture(e.pointerId); } catch {}

    el.dataset.hdrag = "1";
    el.dataset.px = String(e.clientX);
    el.dataset.py = String(e.clientY);
    
    // Capture Start Percentages
    el.dataset.sx = String(subtagX ?? 0);
    el.dataset.sy = String(subtagY ?? 0);

    const parent = el.offsetParent || document.body;
    const b = parent.getBoundingClientRect();
    el.dataset.cw = String(b.width);
    el.dataset.ch = String(b.height);

    useFlyerState.getState().setMoveTarget("subtag");
    useFlyerState.getState().setSelectedPanel("subtag");

    el.style.transition = "none";
  }}

  // 3. MOVE (Direct Left/Top Update)
  onPointerMove={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;

    // 1. Get Deltas
    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // 2. Convert to %
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const nextX = startLeft + (dx / cw) * 100;
    const nextY = startTop + (dy / ch) * 100;

    // 3. Apply Directly
    el.style.left = `${nextX}%`;
    el.style.top = `${nextY}%`;
  }}

  // 4. END
  onPointerUp={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.hdrag !== "1") return;
    el.dataset.hdrag = "0";

    const startX = Number(el.dataset.px);
    const startY = Number(el.dataset.py);
    const cw = Number(el.dataset.cw || 1);
    const ch = Number(el.dataset.ch || 1);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const startLeft = Number(el.dataset.sx);
    const startTop = Number(el.dataset.sy);

    const finalX = startLeft + (dx / cw) * 100;
    const finalY = startTop + (dy / ch) * 100;

    // Sync State
    onSubtagMove?.(finalX, finalY);

    try { el.releasePointerCapture(e.pointerId); } catch {}
  }}

  style={{
    left: `${subtagX}%`,
    top: `${subtagY}%`,
    overflow: 'visible',
    zIndex: moveTarget === 'subtag' ? 999 : 30,
    cursor: 'grab',
    textAlign: 'center',
    borderRadius: 8,
    
    // 🔥 Rotation moved to wrapper for consistency
    transform: `rotate(${subtagRotate ?? 0}deg)`,
    transformOrigin: '50% 50%',
    
    // 🔥 Disable transition for instant moves
    transition: 'none',
    willChange: "left, top"
  }}
>
    <div
      className="inline-block rounded-full px-3 py-1 select-none"
      style={{
        backgroundColor: `rgba(${parseInt(subtagBgColor.slice(1, 3), 16)}, ${parseInt(
          subtagBgColor.slice(3, 5), 16
        )}, ${parseInt(subtagBgColor.slice(5, 7), 16)}, ${subtagAlpha})`,
        transition: 'all 0.25s ease',
        borderRadius: 9999,
        // removed internal transform
      }}
    >
      <span
        style={{
          color: subtagTextColor,
          fontFamily: subtagFamily,
          fontSize: subtagSize,
          fontWeight: subtagBold ? 800 : 500,
          fontStyle: subtagItalic ? 'italic' : 'normal',
          textDecorationLine: subtagUnderline ? 'underline' : 'none',
          textTransform: subtagUppercase ? 'uppercase' : 'none',
          whiteSpace: 'pre-wrap',
          display: 'inline-block',

          textShadow: subtagShadow
            ? buildPremiumTextShadow(subtagShadowStrength ?? 1, 0)
            : 'none',

          filter:
            moveTarget === 'subtag'
              ? 'drop-shadow(0 0 8px rgba(147,197,253,0.9))'
              : 'none',
        }}
      >
        {subtag}
      </span>
    </div>
  </div>
)}
{/* SUBTAG (END) */}


            {/* Snap grid (shows only when Guides + Snap are on) */}
      {showGuides && snap && (
        <div className="absolute inset-0 pointer-events-none z-[5]">
          {/* verticals */}
          {[...Array(8)].map((_,i)=>(
            <div key={'v'+i} className="absolute top-0 bottom-0 border-r border-neutral-700/25"
                 style={{ left: `${(i+1)*(100/9)}%` }} />
          ))}
          {/* horizontals */}
          {[...Array(8)].map((_,i)=>(
            <div key={'h'+i} className="absolute left-0 right-0 border-b border-neutral-700/25"
                 style={{ top: `${(i+1)*(100/9)}%` }} />
          ))}
        </div>
      )}

      {/* Frame guide */}
      <div className="absolute inset-0 border-2 border-neutral-700/40 pointer-events-none rounded-2xl" />
{/* ✅ PASTE THIS BLOCK HERE: ATMOSPHERE & TEXTURE LAYER */}
      <div className="absolute inset-0 pointer-events-none z-[50]">

        {/* ✅ PASTE HERE: SOCIAL MEDIA SAFE ZONES */}
      {showGuides && (
        <div className="absolute inset-0 pointer-events-none z-[40] opacity-30">
           {/* Instagram Story Top Bar (approx 120px on 1080w) */}
           <div className="absolute top-0 left-0 right-0 h-[12%] bg-red-500/20 border-b border-red-500/50 flex items-end justify-center pb-1">
             <span className="text-[10px] font-mono text-red-200 uppercase tracking-widest">System UI</span>
           </div>
           {/* Instagram Story Bottom Bar (approx 200px on 1080w) */}
           <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-red-500/20 border-t border-red-500/50 flex items-start justify-center pt-1">
             <span className="text-[10px] font-mono text-red-200 uppercase tracking-widest">Swipe / Reply</span>
           </div>
        </div>
      )}
        
        {/* A. GLOBAL TEXTURE (Plastic / Grime / Grain) */}
        <div 
          className="absolute inset-0 w-full h-full mix-blend-overlay opacity-30"
          style={{
            backgroundImage: `url(https://grainy-gradients.vercel.app/noise.svg)`, 
            backgroundSize: 'cover',
            opacity: textureOpacity,
          }}
        />

        {/* B. OPTICAL FLARES / LIGHTING (Screen Mode) */}
        {portraits[format]?.filter((p: any) => p.isFlare).map((flare: any) => (
           <img 
             key={flare.id}
             src={flare.url}
             alt="flare"
             style={{
               position: 'absolute',
               left: `${flare.x}%`,
               top: `${flare.y}%`,
               transform: `translate(-50%, -50%) scale(${flare.scale}) rotate(${flare.rotation || 0}deg)`,
               mixBlendMode: 'screen', 
               opacity: flare.opacity ?? 1,
               width: 'auto',
               height: 'auto',
               pointerEvents: 'none'
             }}
           />
        ))}
      </div>
    </div>
    
      )
    });
Artboard.displayName = 'Artboard';
/* ===== BLOCK: ARTBOARD (END) ===== */



function setFromFile(input: HTMLInputElement, cb: (url: string) => void) {
  const f = input.files?.[0];
  if (!f) return;

  const r = new FileReader();
  r.onload = () => {
    cb(String(r.result));        // <-- Data URL (persists across reloads)
    input.value = '';            // allow re-pick same file later
  };
  r.readAsDataURL(f);
}



// ===== PORTRAIT BG REMOVER (helpers at module scope) =====
let __seg: any | null = null;

async function getSeg(model: 0 | 1) {
  if (__seg) return __seg;
  const mp = await import('@mediapipe/selfie_segmentation');
  // Some builds export SelfieSegmentation as a property of the module object
  const SelfieSegmentation = (mp as any).SelfieSegmentation || (mp as any).default?.SelfieSegmentation;
  if (!SelfieSegmentation) {
    throw new Error('SelfieSegmentation class not found. Ensure @mediapipe/selfie_segmentation is installed.');
  }
  const seg = new SelfieSegmentation({
    locateFile: (f: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
  });
  seg.setOptions({ modelSelection: model });
  __seg = seg;
  return seg;
}

/** Self-contained loader so we don’t depend on any other helper */
function loadImageForRMBG(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** MAIN: makes a transparent PNG data URL using MediaPipe */
// ===== /PORTRAIT BG REMOVER helpers =====

function PortraitResizeHandle({
  locked,
  onChangeScale,
}: {
  locked: boolean;
  onChangeScale: (scale: number) => void;
}) {
  const ref = React.useRef<{ x: number; y: number } | null>(null);
  const refStart = React.useRef<number>(1);

  function onDown(e: React.MouseEvent) {
    if (locked) return;
    e.preventDefault();
    ref.current = { x: e.clientX, y: e.clientY };
    // caller controls actual scale, we start from “1 + delta”
    refStart.current = 1;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  }

  function onMove(e: MouseEvent) {
    if (!ref.current) return;
    const dx = e.clientX - ref.current.x;
    const dy = e.clientY - ref.current.y;
    const delta = (dx + dy) / 300; // tune sensitivity
    const next = Math.max(0.5, Math.min(4, refStart.current + delta));
    onChangeScale(next);
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove);
    ref.current = null;
  }

  return (
    <div
      className={
        "absolute -bottom-2 -right-2 h-6 w-6 rounded-md bg-neutral-900/80 border border-neutral-700 text-white shadow " +
        (locked ? "cursor-not-allowed" : "cursor-nwse-resize")
      }
      style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={onDown}
      title={locked ? "Portrait is locked" : "Drag to resize"}
      role="button"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 21l-6-6M21 15v6h-6"/>
      </svg>
    </div>
  );
}

// ------------------------------------------------------------------
// 1. HELPER: Convert Blob URL to Data URL (Fixes "Missing Images" bug)
// ------------------------------------------------------------------
async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const r = await fetch(blobUrl);
  if (!r.ok) throw new Error(`Failed to fetch blob URL: ${r.status}`);

  const blob = await r.blob();

  return await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(new Error("FileReader failed converting blob to dataURL"));
    fr.readAsDataURL(blob);
  });
}


// ------------------------------------------------------------------
// 2. HELPER: Normalize Save Data (Inlines all images)
// ------------------------------------------------------------------
async function normalizeImagesForSave(design: any) {
  const d = structuredClone(design); // Deep copy

  // 1. Fix Background
  if (typeof d.bgUrl === "string" && d.bgUrl.startsWith("blob:")) {
    d.bgUrl = await blobUrlToDataUrl(d.bgUrl);
  }

  // 2. Fix Portrait Slots (Library)
  if (Array.isArray(d.portraitSlots)) {
    for (let i = 0; i < d.portraitSlots.length; i++) {
      if (d.portraitSlots[i]?.startsWith("blob:")) {
        d.portraitSlots[i] = await blobUrlToDataUrl(d.portraitSlots[i]);
      }
    }
  }

  // 3. Fix Portraits on Canvas (iterate all formats)
  const lists = [d.portraits?.square, d.portraits?.story].filter(Array.isArray);
  for (const list of lists) {
    for (const p of list) {
      if (typeof p.url === "string" && p.url.startsWith("blob:")) {
        p.url = await blobUrlToDataUrl(p.url);
      }
    }
  }

  return d;
}

// ------------------------------------------------------------------
// 3. HELPER: Normalize Load Data (Fixes schema mismatch)
// ------------------------------------------------------------------
function normalizeDesignJson(design: any, currentFormat: string) {
  const targetFmt = design.format || design.targetFormat || currentFormat;
  
  // Flatten text styles if nested differently in older versions
  const headline = design.headline ?? design.text?.headline;
  
  return {
    ...design,
    format: targetFmt,
    headline,
    portraits: design.portraits || design.portraitsByFormat || {},
    emojis: design.emojis || design.emojisByFormat || {},
  };
}

// =========================================================
// ✅ DYNAMIC STUDIO GENERATORS (Compatibility Mode)
// =========================================================

// 1. Tint Helper
function getTintedColor(intensity: number, warmth: number) {
  const a = Math.max(0, Math.min(1, intensity));
  let r = 255, g = 255, b = 255;

  if (warmth > 0) {
    b = 255 - (warmth * 200); 
    g = 255 - (warmth * 60); 
  } else {
    r = 255 - (Math.abs(warmth) * 200);
    g = 255 - (Math.abs(warmth) * 30);
  }
  return `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${a})`;
}

// 2. Generic Studio (Smart Overload: Handles old & new calls)
function buildStudioPlate(
  arg1: string | number, // preset (old) OR size (new)
  arg2: number,          // size (old) OR lighting (new)
  arg3: number = 1.0,    // contrast
  arg4: number = 0       // warmth
): HTMLCanvasElement {
  
  // 🧠 DETECT ARGUMENTS:
  let size: number, lighting = 1.0, contrast = 1.0, warmth = 0;

  if (typeof arg1 === 'string') {
    // Legacy Call: (preset, size) -> Use defaults
    size = arg2;
  } else {
    // New Call: (size, lighting, contrast, warmth)
    size = arg1;
    lighting = arg2;
    contrast = arg3;
    warmth = arg4;
  }

  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;

  // Background
  const bgVal = Math.max(0, 40 - (contrast * 30));
  ctx.fillStyle = `rgb(${bgVal},${bgVal},${bgVal})`;
  ctx.fillRect(0, 0, size, size);

  const boost = (base: number) => Math.min(1, base * lighting);

  // Ambient
  const bg = ctx.createRadialGradient(size*0.35, size*0.25, size*0.05, size*0.5, size*0.5, size*0.9);
  bg.addColorStop(0, getTintedColor(boost(0.15), warmth));
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Softbox 1
  ctx.save();
  ctx.translate(size*0.1, size*0.1);
  ctx.rotate(-10 * Math.PI / 180);
  ctx.fillStyle = getTintedColor(boost(0.75), warmth);
  ctx.fillRect(0, 0, size*0.85, size*0.14);
  ctx.restore();

  // Softbox 2
  ctx.save();
  ctx.translate(size*0.15, size*0.65);
  ctx.rotate(12 * Math.PI / 180);
  ctx.fillStyle = getTintedColor(boost(0.45), warmth);
  ctx.fillRect(0, 0, size*0.75, size*0.09);
  ctx.restore();

  return c;
}

// 3. Chrome Studio (Smart Overload)
function generateChromeStudioEnv(
  arg1: number, 
  arg2: number, 
  arg3: number = 1.0, 
  arg4: number = 0,
  isIce = false
): HTMLCanvasElement {
  
  // Note: Chrome studio didn't have a 'preset' arg before, so standard signature works.
  // We just add defaults to be safe.
  const size = arg1;
  const lighting = arg2;
  const contrast = arg3;
  const warmth = arg4;

  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  const effectiveWarmth = isIce ? (warmth === 0 ? -0.8 : warmth) : warmth;
  const blurAmount = Math.max(0, (2.5 - contrast) * 10);
  const boost = (base: number) => Math.min(1, base * lighting);

  ctx.filter = `blur(${blurAmount}px)`;
  ctx.globalCompositeOperation = "screen";

  const g = ctx.createLinearGradient(0, size*0.5, 0, size*0.6);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.5, getTintedColor(boost(0.9), effectiveWarmth));
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, size*0.4, size, size*0.4);

  ctx.fillStyle = getTintedColor(boost(1.0), effectiveWarmth);
  ctx.fillRect(size*0.1, size*0.1, size*0.4, size*0.15);

  ctx.fillStyle = getTintedColor(boost(0.8), effectiveWarmth);
  ctx.fillRect(size*0.7, size*0.15, size*0.2, size*0.5);

  return c;
}










// 7. MASTER BUILDER (Orchestrator) — LOCKED: gold / silver / chrome ONLY
async function buildTiledReflectionPlateDataUrl(
  uploadUrlOrNull: string | null,
  size: number = 2048,
  presetId: string = "gold",
  lighting: number = 60,
  reflections: number = 60,
  warmth: number = 0
): Promise<string> {
  // Normalize Inputs
  const L = clamp(Number(lighting) || 60, 0, 100) / 100 * 2; // 0..2
  const R = clamp(Number(reflections) || 60, 0, 100) / 100;  // 0..1
  const W = clamp(Number(warmth) || 0, -1, 1);               // -1..1

  // ✅ Lock preset to gold/silver/chrome (anything else becomes gold)
  const preset = (() => {
    const p = String(presetId || "gold").toLowerCase();
    if (p === "silver") return "silver";
    if (p === "chrome") return "chrome";
    return "gold";
  })();

  // Helper: build the studio canvas for allowed presets only
  const buildStudio = (): HTMLCanvasElement => {
    if (preset === "chrome") return generateChromeStudioEnv(size, L, R, W);
    if (preset === "silver") return generateChromeStudioEnv(size, L, R, W);
    return buildStudioPlate(size, L, R, W);
  };

  const tuning =
    preset === "chrome"
      ? { tileFrac: 0.52, brightBoost: 0.45, contrastBoost: 1.2, studioAlpha: 0.22 }
      : preset === "silver"
      ? { tileFrac: 0.44, brightBoost: 0.28, contrastBoost: 0.85, studioAlpha: 0.4 }
      : { tileFrac: 0.32, brightBoost: 0.15, contrastBoost: 0.5, studioAlpha: 0.65 };

  // =========================================================
  // A) NO UPLOAD: return pure studio plate
  // =========================================================
  if (!uploadUrlOrNull) {
    const studioCanvas = buildStudio();
    return studioCanvas.toDataURL("image/jpeg", 0.95);
  }

  // =========================================================
  // B) UPLOAD: make upload a "reflection content" + overlay studio
  // =========================================================
  let img: HTMLImageElement | null = null;
  try {
    img = await loadImage(uploadUrlOrNull);
  } catch {
    // If the background fails to load (CORS or decode), fall back to studio only.
    const studioCanvas = buildStudio();
    return studioCanvas.toDataURL("image/jpeg", 0.95);
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1) Always start with true black base
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  // 2) Tile upload as "bonus reflections" (neutralized)
  const brightness = 0.95 + L * 0.55 + tuning.brightBoost;
  const contrast = 1.05 + R * 0.95 + tuning.contrastBoost;
  const saturate = preset === "gold" ? 0.35 : 0.2;
  const hue = W * 10;                  // subtle warmth/cool

  ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) hue-rotate(${hue}deg)`;

  const iw = (img as any).naturalWidth || (img as any).width;
  const ih = (img as any).naturalHeight || (img as any).height;

  const s = Math.min(iw, ih);
  const sx = Math.floor((iw - s) / 2);
  const sy = Math.floor((ih - s) / 2);

  if (preset === "chrome") {
    const scale = Math.max(size / iw, size / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;
    ctx.drawImage(img as any, 0, 0, iw, ih, dx, dy, dw, dh);
  } else {
    const tileSize = Math.max(256, Math.round(size * tuning.tileFrac));

    for (let y = -tileSize; y < size + tileSize; y += tileSize) {
      for (let x = -tileSize; x < size + tileSize; x += tileSize) {
        ctx.save();

        const mx = ((x / tileSize) | 0) % 2 !== 0;
        const my = ((y / tileSize) | 0) % 2 !== 0;

        ctx.translate(x + (mx ? tileSize : 0), y + (my ? tileSize : 0));
        ctx.scale(mx ? -1 : 1, my ? -1 : 1);

        ctx.drawImage(img as any, sx, sy, s, s, 0, 0, tileSize, tileSize);
        ctx.restore();
      }
    }
  }

  // 3) Overlay the studio (always consistent)
  ctx.filter = "none";
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = tuning.studioAlpha;

  const studio = buildStudio();
  ctx.drawImage(studio, 0, 0);

  // restore state
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";

  return canvas.toDataURL("image/jpeg", 0.95);
}








function generateSilverStudioEnv(size: number = 2048): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  // 1) charcoal base (NOT pure black)
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, size, size);

  // 2) subtle concrete-like texture (noise)
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() * 22) | 0; // 0..21
    const v = 16 + n; // lift blacks slightly
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  // 3) wide softbox sweeps (broad, not sharp)
  const sweep = ctx.createLinearGradient(0, size * 0.25, size, size * 0.75);
  sweep.addColorStop(0.00, "rgba(255,255,255,0.00)");
  sweep.addColorStop(0.35, "rgba(255,255,255,0.10)");
  sweep.addColorStop(0.50, "rgba(255,255,255,0.18)");
  sweep.addColorStop(0.65, "rgba(255,255,255,0.10)");
  sweep.addColorStop(1.00, "rgba(255,255,255,0.00)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  // 4) a couple soft rectangles (muted)
  const boxes = [
    { x: 0.10, y: 0.12, w: 0.40, h: 0.16, a: 0.22, r: -10 },
    { x: 0.55, y: 0.14, w: 0.34, h: 0.14, a: 0.18, r: 8 },
    { x: 0.18, y: 0.72, w: 0.36, h: 0.14, a: 0.14, r: 12 },
  ];

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const b of boxes) {
    ctx.save();
    ctx.globalAlpha = b.a;
    ctx.translate(size * b.x, size * b.y);
    ctx.rotate((b.r * Math.PI) / 180);

    const g = ctx.createLinearGradient(0, 0, size * b.w, size * b.h);
    g.addColorStop(0.0, "rgba(255,255,255,0.00)");
    g.addColorStop(0.5, "rgba(255,255,255,0.85)");
    g.addColorStop(1.0, "rgba(255,255,255,0.00)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size * b.w, size * b.h);
    ctx.restore();
  }
  ctx.restore();

  // 5) vignette (keeps “premium” center read)
  const vign = ctx.createRadialGradient(
    size * 0.5, size * 0.5, size * 0.10,
    size * 0.5, size * 0.5, size * 0.80
  );
  vign.addColorStop(0.0, "rgba(0,0,0,0.00)");
  vign.addColorStop(1.0, "rgba(0,0,0,0.70)");
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, size, size);

  // 6) slight blur to feel like a backdrop plate
  const blurPx = Math.max(2, Math.round(size * 0.0016)); // ~3px at 2048
  const tmp = document.createElement("canvas");
  tmp.width = size; tmp.height = size;
  const tctx = tmp.getContext("2d");
  if (!tctx) throw new Error("No 2D context");
  tctx.filter = `blur(${blurPx}px)`;
  tctx.drawImage(canvas, 0, 0);

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(tmp, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.92);
}



function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!url.startsWith('data:')) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image`));
    img.src = url;
  });
}

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");
  return { canvas, ctx };
}

function buildCurveTable(
  points: Array<{ x: number; y: number }>,
  samples: number = 16
) {
  const pts = [...points].sort((a, b) => a.x - b.x);
  const values: string[] = [];

  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 255;
    let p0 = pts[0];
    let p1 = pts[pts.length - 1];
    for (let j = 0; j < pts.length - 1; j++) {
      const a = pts[j];
      const b = pts[j + 1];
      if (x >= a.x && x <= b.x) {
        p0 = a;
        p1 = b;
        break;
      }
    }
    const t = p1.x === p0.x ? 0 : (x - p0.x) / (p1.x - p0.x);
    const y = p0.y + (p1.y - p0.y) * t;
    values.push((y / 255).toFixed(4));
  }

  return values.join(" ");
}

const MASTER_GRADE_TABLES = {
  rgb: buildCurveTable([
    { x: 0, y: 15 },
    { x: 60, y: 50 },
    { x: 190, y: 205 },
    { x: 255, y: 245 },
  ]),
  r: buildCurveTable([
    { x: 0, y: 5 },
    { x: 120, y: 135 },
    { x: 255, y: 255 },
  ]),
  g: buildCurveTable([
    { x: 0, y: 10 },
    { x: 128, y: 128 },
    { x: 255, y: 250 },
  ]),
  b: buildCurveTable([
    { x: 0, y: 35 },
    { x: 128, y: 128 },
    { x: 255, y: 230 },
  ]),
};

async function compositeWrapFromMaps(
  baseUrl: string,
  edgeUrl: string,
  depthUrl: string,
  maskUrl: string,
  opts?: { depthAlpha?: number; edgeAlpha?: number }
) {
  const [baseImg, edgeImg, depthImg, maskImg] = await Promise.all([
    loadImage(baseUrl),
    loadImage(edgeUrl),
    loadImage(depthUrl),
    loadImage(maskUrl),
  ]);
  const size = Math.min(
    (baseImg as any).naturalWidth || (baseImg as any).width,
    (baseImg as any).naturalHeight || (baseImg as any).height
  );
  const { canvas, ctx } = makeCanvas(size);

  ctx.drawImage(baseImg, 0, 0, size, size);

  const { canvas: depthC, ctx: depthCtx } = makeCanvas(size);
  depthCtx.drawImage(depthImg, 0, 0, size, size);
  depthCtx.globalCompositeOperation = "destination-in";
  depthCtx.drawImage(maskImg, 0, 0, size, size);

  const { canvas: edgeC, ctx: edgeCtx } = makeCanvas(size);
  edgeCtx.drawImage(edgeImg, 0, 0, size, size);
  edgeCtx.globalCompositeOperation = "destination-in";
  edgeCtx.drawImage(maskImg, 0, 0, size, size);

  const depthAlpha = Math.max(0, Math.min(1, opts?.depthAlpha ?? 0.28));
  const edgeAlpha = Math.max(0, Math.min(1, opts?.edgeAlpha ?? 0.45));

  // Depth adds gentle shadowing
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = depthAlpha;
  ctx.drawImage(depthC, 0, 0, size, size);
  ctx.restore();

  // Edge adds subtle highlight definition
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = edgeAlpha;
  ctx.drawImage(edgeC, 0, 0, size, size);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

async function compositeSilverStudio(
  baseUrl: string,
  edgeUrl: string,
  depthUrl: string,
  maskUrl: string
) {
  try {
    const [baseImg, edgeImg, depthImg, maskImg] = await Promise.all([
      loadImage(baseUrl),
      loadImage(edgeUrl),
      loadImage(depthUrl),
      loadImage(maskUrl),
    ]);
  const size = Math.min(
    (baseImg as any).naturalWidth || (baseImg as any).width,
    (baseImg as any).naturalHeight || (baseImg as any).height
  );
  const { canvas, ctx } = makeCanvas(size);

  ctx.drawImage(baseImg, 0, 0, size, size);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskImg, 0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  const { canvas: edgeC, ctx: edgeCtx } = makeCanvas(size);
  edgeCtx.drawImage(edgeImg, 0, 0, size, size);
  edgeCtx.globalCompositeOperation = "destination-in";
  edgeCtx.drawImage(maskImg, 0, 0, size, size);

  const { canvas: depthC, ctx: depthCtx } = makeCanvas(size);
  depthCtx.drawImage(depthImg, 0, 0, size, size);
  depthCtx.globalCompositeOperation = "destination-in";
  depthCtx.drawImage(maskImg, 0, 0, size, size);

  // Stronger bevel depth
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.35;
  ctx.drawImage(depthC, 0, 0, size, size);
  ctx.restore();

  // Specular highlights
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.55;
  ctx.filter = "contrast(2.0) brightness(1.35)";
  ctx.drawImage(depthC, 0, 0, size, size);
  ctx.filter = "none";
  ctx.restore();

  // Crisp edges for definition
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.65;
  ctx.filter = "blur(1px)";
  ctx.drawImage(edgeC, 0, 0, size, size);
  ctx.filter = "none";
  ctx.restore();

    return canvas.toDataURL("image/png");
  } catch {
    return baseUrl;
  }
}

// chrome now uses the standard AI render path (no custom composite)

// 1. Text Layout
function layoutWrappedText(opts: {
  ctx: CanvasRenderingContext2D;
  text: string;
  fontName: string;
  size: number;
  fontSize: number;
  padding: number;
  lineHeightMultiplier: number;
}) {
  const { ctx, text, fontName, size, fontSize, padding, lineHeightMultiplier } = opts;
  const maxTextWidth = size - padding * 2;

  ctx.font = `900 ${fontSize}px "${fontName}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const paragraphs = text.toUpperCase().split("\n");
  const lines: string[] = [];

  for (const p of paragraphs) {
    const words = p.split(" ").filter(Boolean);
    if (words.length === 0) { lines.push(""); continue; }
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const w = words[i];
      const test = `${current} ${w}`;
      const width = ctx.measureText(test).width;
      if (width <= maxTextWidth) current = test;
      else { lines.push(current); current = w; }
    }
    lines.push(current);
  }

  const m = ctx.measureText("Mg");
  const ascent = (m as any).actualBoundingBoxAscent ?? fontSize * 0.8;
  const descent = (m as any).actualBoundingBoxDescent ?? fontSize * 0.2;
  const fontPx = ascent + descent;
  const lh = clamp(Number(lineHeightMultiplier) || 1.0, 0.75, 1.6);
  const lineHeight = fontPx * lh;

  let widest = 0;
  for (const line of lines) widest = Math.max(widest, ctx.measureText(line).width);

  const blockHeight = lines.length * lineHeight;
  const startY = size / 2 - blockHeight / 2 + ascent;

  return { lines, widest, blockHeight, startY, ascent, lineHeight, maxTextWidth };
}

// 2. Draw Authority Mask
function drawMaskText(opts: {
  ctx: CanvasRenderingContext2D;
  text: string;
  fontName: string;
  size: number;
  lineHeightMultiplier: number;
  strokeFrac?: number;
}) {
  const { ctx, text, fontName, size, lineHeightMultiplier } = opts;
  const padding = Math.round(size * 0.08);
  const maxTotalHeight = size * 0.8;

  let fontSize = Math.round(size * 0.22);
  while (fontSize > 40) {
    const layout = layoutWrappedText({ ctx, text, fontName, size, fontSize, padding, lineHeightMultiplier });
    if (layout.blockHeight <= maxTotalHeight && layout.widest <= layout.maxTextWidth) break;
    fontSize -= Math.max(6, Math.round(size * 0.004));
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, size, size);
  ctx.font = `900 ${fontSize}px "${fontName}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  const layout = layoutWrappedText({ ctx, text, fontName, size, fontSize, padding, lineHeightMultiplier });
  const strokeWidth = Math.max(6, Math.round(fontSize * (opts.strokeFrac ?? 0.06)));

  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = strokeWidth;

  for (let i = 0; i < layout.lines.length; i++) {
    const line = layout.lines[i];
    const y = layout.startY + i * layout.lineHeight;
    ctx.strokeText(line, size / 2, y);
    ctx.fillText(line, size / 2, y);
  }
}

// 3. Pixel Tools
function thresholdToBinary(imgData: ImageData, t = 10) {
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const on = d[i] > t ? 255 : 0;
    d[i] = on; d[i + 1] = on; d[i + 2] = on; d[i + 3] = 255;
  }
}

// 4. Master Orchestrator (BLACK SCREEN)
async function buildCinematicMaps(
  headline: string,
  fontName: string,
  textureUrl: string,
  wrapId: string,
  lineHeightMultiplier: number = 1.0,
  size: number = 2048,
  materialKey: string = "gold"
): Promise<{ base: string; edge: string; depth: string; mask: string }> {

  try { await (document as any).fonts?.load?.(`900 150px "${fontName}"`); } catch {}

  const textureImg = await loadImage(textureUrl);

  // A) Mask (White text on black)
  const { canvas: maskCanvas, ctx: maskCtx } = makeCanvas(size);
  drawMaskText({ ctx: maskCtx, text: headline, fontName, size, lineHeightMultiplier, strokeFrac: 0.04 });

  const maskData = maskCtx.getImageData(0, 0, size, size);
  thresholdToBinary(maskData, 10);
  maskCtx.putImageData(maskData, 0, 0);

  // B) Base - The "Poisoned" Black Void
  const { canvas: baseCanvas, ctx: baseCtx } = makeCanvas(size);
  
  // 1. Fill with Black
  baseCtx.fillStyle = "#000000";
  baseCtx.fillRect(0, 0, size, size);

  // 2. 🔥 POISON THE VOID: Invisible Dither
  // Alternates between Pure Black (#000000) and Almost Black (#010101)
  // This structure stops the AI from generating "fog" or "glow" in empty space.
  const baseImg = baseCtx.getImageData(0, 0, size, size);
  const d = baseImg.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const val = (x % 2 === y % 2) ? 0 : 1; // 0 or 1
      d[idx] = val;     // R
      d[idx + 1] = val; // G
      d[idx + 2] = val; // B
      d[idx + 3] = 255; // Alpha
    }
  }
  baseCtx.putImageData(baseImg, 0, 0);

  // 3. 🔥 MOAT: Dark Gray Guard Ring (#111111)
  // Separates the object from the void so edges don't melt
  baseCtx.save();
  baseCtx.globalCompositeOperation = "source-over";
  baseCtx.filter = `blur(${size * 0.008}px)`; 
  baseCtx.drawImage(maskCanvas, 0, 0); 
  
  baseCtx.globalCompositeOperation = "source-in";
  baseCtx.fillStyle = "#111111"; // Dark Gray Guard
  baseCtx.fillRect(0, 0, size, size);
  baseCtx.restore();

  // 4. Draw the Textured Object
  const { canvas: objCanvas, ctx: objCtx } = makeCanvas(size);
  if (wrapId && wrapId !== "none") {
    drawWrapTexture(objCtx, textureImg, size, wrapId);
  } else {
    objCtx.drawImage(textureImg, 0, 0, size, size);
  }
  const bevelStrength =
    wrapId && wrapId !== "none"
      ? 0.65
      : materialKey === "chrome"
      ? 1.2
      : materialKey === "silver"
      ? 1.1
      : 1;
  bakeBevelInternal(objCtx, maskCanvas, size, bevelStrength);
  objCtx.globalCompositeOperation = "destination-in";
  objCtx.drawImage(maskCanvas, 0, 0);

  // Composite object onto Black Void
  baseCtx.globalCompositeOperation = "source-over";
  baseCtx.drawImage(objCanvas, 0, 0);

  // C) Maps
  const depth = buildDepthFromMask(maskCanvas, size);
  const edge = buildEdgeFromMask(maskCanvas, size);

  const mask = maskCanvas.toDataURL("image/png");
  return { base: baseCanvas.toDataURL("image/png"), edge, depth, mask };

}

function drawWrapTexture(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  size: number,
  wrapId: string
) {
  const tuning: Record<string, { tileFrac: number; smoothing?: boolean }> = {
    zebra: { tileFrac: 0.18, smoothing: false },
    tiger: { tileFrac: 0.24 },
    carbon_fiber: { tileFrac: 0.18 },
    snakeskin: { tileFrac: 0.22 },
    geometric: { tileFrac: 0.22 },
  };

  const cfg = tuning[wrapId] || tuning.geometric;
  const tileSize = Math.max(160, Math.round(size * cfg.tileFrac));
  const tile = document.createElement("canvas");
  tile.width = tileSize;
  tile.height = tileSize;
  const tctx = tile.getContext("2d")!;

  const iw = (img as any).naturalWidth || (img as any).width;
  const ih = (img as any).naturalHeight || (img as any).height;
  const s = Math.min(iw, ih);
  const sx = Math.floor((iw - s) / 2);
  const sy = Math.floor((ih - s) / 2);

  const scale = tileSize / Math.max(1, s);
  const smoothing = typeof cfg.smoothing === "boolean" ? cfg.smoothing : scale < 1;
  tctx.imageSmoothingEnabled = smoothing;
  tctx.imageSmoothingQuality = smoothing ? "high" : "low";

  tctx.drawImage(img, sx, sy, s, s, 0, 0, tileSize, tileSize);

  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

// 5. Bevel Baker (Internal)
function bakeBevelInternal(
  targetCtx: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement,
  size: number,
  strength: number = 1
) {
  const { canvas: hiC, ctx: hiCtx } = makeCanvas(size);
  const { canvas: shC, ctx: shCtx } = makeCanvas(size);
  const s = clamp(strength, 0.4, 1.4);
  const blurPx = Math.max(4, Math.round(size * 0.004 * s));

  hiCtx.filter = `blur(${blurPx}px)`;
  hiCtx.drawImage(maskCanvas, -size*0.002, -size*0.002);
  
  shCtx.filter = `blur(${blurPx}px)`;
  shCtx.drawImage(maskCanvas, size*0.002, size*0.002);

  targetCtx.save();
  targetCtx.globalCompositeOperation = "screen";
  targetCtx.globalAlpha = 0.5 * s;
  targetCtx.drawImage(hiC, 0, 0); 
  targetCtx.globalCompositeOperation = "multiply";
  targetCtx.globalAlpha = 0.6 * s;
  targetCtx.drawImage(shC, 0, 0);
  targetCtx.restore();
}

// 6. Edge Map
function buildEdgeFromMask(maskCanvas: HTMLCanvasElement, size: number) {
  const { canvas: edgeCanvas, ctx: edgeCtx } = makeCanvas(size);
  const { canvas: b1, ctx: c1 } = makeCanvas(size);
  const { canvas: b2, ctx: c2 } = makeCanvas(size);

  c1.filter = `blur(${size * 0.004}px)`; c1.drawImage(maskCanvas, 0, 0);
  c2.filter = `blur(${size * 0.002}px)`; c2.drawImage(maskCanvas, 0, 0);

  edgeCtx.drawImage(b1, 0, 0);
  edgeCtx.globalCompositeOperation = "difference";
  edgeCtx.drawImage(b2, 0, 0);
  
  const d = edgeCtx.getImageData(0,0,size,size);
  thresholdToBinary(d, 15);
  edgeCtx.putImageData(d, 0, 0);

  return edgeCanvas.toDataURL("image/png");
}

function buildDepthFromMask(maskCanvas: HTMLCanvasElement, size: number) {
  const { canvas: dC, ctx: dCtx } = makeCanvas(size);
  dCtx.fillStyle = "black"; dCtx.fillRect(0,0,size,size);
  dCtx.filter = `blur(${size*0.01}px)`;
  dCtx.drawImage(maskCanvas, 0, 0);
  return dC.toDataURL("image/png");
}

async function downscaleDataUrlClient(
  dataUrl: string,
  targetSize: number = 1024,
  mime: "image/png" | "image/jpeg" = "image/png",
  jpegQuality: number = 0.95
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!dataUrl.startsWith("data:image")) return reject(new Error("Invalid Image Data"));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetSize; canvas.height = targetSize;
      const ctx = canvas.getContext("2d");
      if(!ctx) return reject("No Context");
      ctx.fillStyle = "#000000"; ctx.fillRect(0,0,targetSize,targetSize); // Safety Black
      ctx.drawImage(img, 0, 0, targetSize, targetSize);
      resolve(canvas.toDataURL(mime, jpegQuality));
    };
    img.src = dataUrl;
  });
}

// =========================================================
// ✅ VOID REMOVAL TOOL: Removes black void + moat AFTER render
// =========================================================

function isNearVoid(r: number, g: number, b: number) {
  // covers #000000, #010101 dither, and very dark noise
  return r <= 8 && g <= 8 && b <= 8;
}

function isNearMoat(r: number, g: number, b: number) {
  // covers #111111 moat and slight variations
  return r <= 28 && g <= 28 && b <= 28;
}

function floodFillBackgroundToTransparent(imgData: ImageData) {
  const { width: w, height: h, data } = imgData;
  const visited = new Uint8Array(w * h);

  const id = (x: number, y: number) => y * w + x;
  const p4 = (i: number) => i * 4;

  // ✅ Estimate background color from MANY border samples (robust vs not-fully-black)
  const samples: [number, number, number][] = [];

  const take = (x: number, y: number) => {
    const p = p4(id(x, y));
    samples.push([data[p], data[p + 1], data[p + 2]]);
  };

  // sample every N pixels along the border
  const step = Math.max(1, Math.floor(Math.min(w, h) / 64));

  for (let x = 0; x < w; x += step) {
    take(x, 0);
    take(x, h - 1);
  }
  for (let y = 0; y < h; y += step) {
    take(0, y);
    take(w - 1, y);
  }

  // Use median per channel (more robust than average)
  const median = (arr: number[]) => {
    const a = arr.slice().sort((a, b) => a - b);
    return a[Math.floor(a.length / 2)] ?? 0;
  };

  const rs = samples.map((s) => s[0]);
  const gs = samples.map((s) => s[1]);
  const bs = samples.map((s) => s[2]);

  const bgR = median(rs);
  const bgG = median(gs);
  const bgB = median(bs);

  const dist2 = (r: number, g: number, b: number) => {
    const dr = r - bgR,
      dg = g - bgG,
      db = b - bgB;
    return dr * dr + dg * dg + db * db;
  };

  const isLowChroma = (r: number, g: number, b: number) => {
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    return mx - mn <= 20; // gray-ish
  };

  const isBg = (x: number, y: number) => {
    const p = p4(id(x, y));
    const r = data[p],
      g = data[p + 1],
      b = data[p + 2];

    // treat void + moat as background
    if (isNearVoid(r, g, b) || isNearMoat(r, g, b)) return true;

    //Adjust this number
    // treat pixels close to border background color as background (handles ash-grey)
    return isLowChroma(r, g, b) && dist2(r, g, b) <= 6400;
  };

  const qx: number[] = [];
  const qy: number[] = [];

  const pushIf = (x: number, y: number) => {
    const i = id(x, y);
    if (visited[i]) return;
    if (!isBg(x, y)) return;
    visited[i] = 1;
    qx.push(x);
    qy.push(y);
  };

  // seed from all borders
  for (let x = 0; x < w; x++) {
    pushIf(x, 0);
    pushIf(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIf(0, y);
    pushIf(w - 1, y);
  }

  // flood fill (4-neighborhood)
  while (qx.length) {
    const x = qx.pop()!;
    const y = qy.pop()!;
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as const;

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = id(nx, ny);
      if (visited[ni]) continue;
      if (!isBg(nx, ny)) continue;
      visited[ni] = 1;
      qx.push(nx);
      qy.push(ny);
    }
  }

  // set flooded background to alpha=0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = id(x, y);
      if (!visited[i]) continue;
      data[p4(i) + 3] = 0;
    }
  }

  return imgData;
}


function removeEnclosedBackgroundIslands(imgData: ImageData) {
  const { width: w, height: h, data } = imgData;
  const visited = new Uint8Array(w * h);

  const id = (x: number, y: number) => y * w + x;
  const p4 = (i: number) => i * 4;

  // Background test must match what you already consider background:
  // - near void
  // - near moat
  // - low-chroma close to corner bg
  // We reuse the corner-bg estimation here so it matches your ash-grey handling.
  const sampleCorner = (x: number, y: number) => {
    const p = p4(id(x, y));
    return [data[p], data[p + 1], data[p + 2]] as const;
  };

  const corners = [
    sampleCorner(0, 0),
    sampleCorner(w - 1, 0),
    sampleCorner(0, h - 1),
    sampleCorner(w - 1, h - 1),
  ];

  const bgSum = corners.reduce(
    (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]] as const,
    [0, 0, 0] as const
  );

  const bgR = Math.round(bgSum[0] / corners.length);
  const bgG = Math.round(bgSum[1] / corners.length);
  const bgB = Math.round(bgSum[2] / corners.length);

  const dist2 = (r: number, g: number, b: number) => {
    const dr = r - bgR, dg = g - bgG, db = b - bgB;
    return dr * dr + dg * dg + db * db;
  };

  const isLowChroma = (r: number, g: number, b: number) => {
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    return (mx - mn) <= 20;
  };

  const isBgPixel = (x: number, y: number) => {
    const p = p4(id(x, y));
    const r = data[p], g = data[p + 1], b = data[p + 2], a = data[p + 3];

    // Already transparent is background
    if (a === 0) return true;

    // Your background logic
    if (isNearVoid(r, g, b) || isNearMoat(r, g, b)) return true;

    // Ash-grey lifted background
    return isLowChroma(r, g, b) && dist2(r, g, b) <= 2500;
  };

  // Scan for remaining background-colored regions that are NOT transparent yet.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = id(x, y);
      if (visited[start]) continue;

      // Only consider candidates that still look like background BUT are not already transparent
      const p = p4(start);
      if (data[p + 3] === 0) { visited[start] = 1; continue; }
      if (!isBgPixel(x, y)) { visited[start] = 1; continue; }

      // Flood-fill this region
      const qx: number[] = [x];
      const qy: number[] = [y];
      visited[start] = 1;

      let touchesBorder = false;
      const region: number[] = [];

      while (qx.length) {
        const cx = qx.pop()!;
        const cy = qy.pop()!;
        const ci = id(cx, cy);

        region.push(ci);

        if (cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1) {
          touchesBorder = true;
        }

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ] as const;

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = id(nx, ny);
          if (visited[ni]) continue;
          visited[ni] = 1;
          if (!isBgPixel(nx, ny)) continue;
          qx.push(nx); qy.push(ny);
        }
      }

      // ✅ If it does NOT touch the border, it’s an enclosed hole → make transparent
      if (!touchesBorder) {
        for (const i of region) {
          data[p4(i) + 3] = 0;
        }
      }
    }
  }

  return imgData;
}


function cropToAlpha(imgData: ImageData) {
  const { width: w, height: h, data } = imgData;
  let minX = w, minY = h, maxX = -1, maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a === 0) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  // if fully empty, return 1x1 transparent png
  if (maxX < minX || maxY < minY) {
    const c = document.createElement("canvas");
    c.width = 1; c.height = 1;
    return c.toDataURL("image/png");
  }

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const src = document.createElement("canvas");
  src.width = w; src.height = h;
  const sctx = src.getContext("2d")!;
  sctx.putImageData(imgData, 0, 0);

  const out = document.createElement("canvas");
  out.width = cw; out.height = ch;
  const octx = out.getContext("2d")!;
  octx.drawImage(src, minX, minY, cw, ch, 0, 0, cw, ch);

  return out.toDataURL("image/png");
}

function erodeAlpha(imgData: ImageData, iterations = 1, alphaThreshold = 10) {
  const { width: w, height: h, data } = imgData;

  for (let it = 0; it < iterations; it++) {
    const copy = new Uint8ClampedArray(data);

    const aAt = (x: number, y: number) =>
      copy[(y * w + x) * 4 + 3];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const a = aAt(x, y);
        if (a <= alphaThreshold) continue;

        if (
          aAt(x + 1, y) <= alphaThreshold ||
          aAt(x - 1, y) <= alphaThreshold ||
          aAt(x, y + 1) <= alphaThreshold ||
          aAt(x, y - 1) <= alphaThreshold
        ) {
          data[(y * w + x) * 4 + 3] = 0;
        }
      }
    }
  }

  return imgData;
}

function featherAlpha(imgData: ImageData, radius = 1) {
  const { width: w, height: h, data } = imgData;
  const copy = new Uint8ClampedArray(data); // snapshot

  const aAt = (x: number, y: number) => copy[(y * w + x) * 4 + 3];
  const setA = (x: number, y: number, a: number) => {
    data[(y * w + x) * 4 + 3] = a;
  };

  // simple 3x3 box blur on alpha, repeated `radius` times
  for (let it = 0; it < radius; it++) {
    const prev = new Uint8ClampedArray(data);
    const aPrev = (x: number, y: number) => prev[(y * w + x) * 4 + 3];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let sum = 0;
        sum += aPrev(x, y);
        sum += aPrev(x + 1, y);
        sum += aPrev(x - 1, y);
        sum += aPrev(x, y + 1);
        sum += aPrev(x, y - 1);
        sum += aPrev(x + 1, y + 1);
        sum += aPrev(x - 1, y - 1);
        sum += aPrev(x + 1, y - 1);
        sum += aPrev(x - 1, y + 1);

        const avg = Math.round(sum / 9);
        setA(x, y, avg);
      }
    }
  }

  return imgData;
}


async function removeVoidAndCropToPng(urlOrDataUrl: string): Promise<string> {
  const img = await loadImage(urlOrDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No canvas context for void removal");

  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// 1) Remove background (flood fill from borders)
let cleared = floodFillBackgroundToTransparent(imgData);

cleared = removeEnclosedBackgroundIslands(cleared);

// 2) 🔧 ERODE MATTE by 1px to kill halo artifacts
// Fix Edges For 3D Renders
// First Number Is Edge Pixels
// Second Number Is Alpha Threshold
//Kills Halo
cleared = erodeAlpha(cleared, 3, 10);


//restore smooth edge (anti-alias)
cleared = featherAlpha(cleared, 1);

ctx.putImageData(cleared, 0, 0);

// 3) Crop tightly to remaining opaque pixels
const finalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
return cropToAlpha(finalData);

}

// =========================================================
// MATERIAL GUIDE PRESETS (SOURCE OF TRUTH)
// =========================================================
const MATERIAL_GUIDES = {
  gold: {
    exposureTarget: 160,
    liftBlacks: 12,
    microStrength: 12,
    softboxMainAlpha: 0.72,
    softboxSecondaryAlpha: 0.48,
    kickerAlpha: 0.34,
  },

  chrome: {
    // 🔥 CRITICAL DIFFERENCE
    exposureTarget: 185,   // chrome must start bright
    liftBlacks: 10,

    microStrength: 4,      // chrome is smooth
    softboxMainAlpha: 0.90, // strong mirror cue
    softboxSecondaryAlpha: 0.65,
    kickerAlpha: 0.45,
  },
} as const;


// 2. Blends optional user upload INTO the studio plate (reflection-only)
async function buildReflectionPlateDataUrl(
  preset: string,
  reflectionUrlOrNull: string | null,
  size: number
): Promise<string> {
  const plate = buildStudioPlate(preset, size);
  const ctx = makeReadCtx(plate);

  if (reflectionUrlOrNull) {
    const img = await loadImage(reflectionUrlOrNull);

    // draw upload as reflection content (desat + contrast-ish)
    const tmp = document.createElement("canvas");
    tmp.width = size; tmp.height = size;
    const tctx = makeReadCtx(tmp);

    tctx.drawImage(img, 0, 0, size, size);

    // desaturate + boost contrast (simple + fast)
    const d = tctx.getImageData(0, 0, size, size);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const l = (0.2126 * r + 0.7152 * g + 0.0722 * b); // luma
      let v = (l - 128) * 1.35 + 128; // contrast
      v = Math.max(0, Math.min(255, v));
      px[i] = px[i + 1] = px[i + 2] = v;
      px[i + 3] = 255;
    }
    tctx.putImageData(d, 0, 0);

    // blend into plate gently
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = preset === "silver" ? 0.55 : 0.35; // chrome wants more reflection content
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  }

  return plate.toDataURL("image/jpeg", 0.92);
}

/* ===== BLOCK: PAGE (BEGIN) ===== */
export default function Page() {

  useFlyerState((s) => s.selectedPanel);

  // =========================================================
  // 1. STATE DEFINITIONS (Paste these at the very top of Page)
  // =========================================================
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("gold");
  const [lightingVal, setLightingVal] = useState<number>(60);     // 0-100
  const [reflectionVal, setReflectionVal] = useState<number>(60); // 0-100
  const [warmthVal, setWarmthVal] = useState<number>(0);          // -1 to 1
  const [shadowIntensity, setShadowIntensity] = useState<number>(60);
  const [wrapPreset, setWrapPreset] = useState<string>("none");
  const wrapsEnabled = false;

  // Existing state (Keep these if you have them, don't duplicate!)
  const [cinematicWrapperUrl, setCinematicWrapperUrl] = useState<string | null>(null);
  const [isGeneratingCinematic, setIsGeneratingCinematic] = useState(false);
  const [cinematicModalOpen, setCinematicModalOpen] = useState(false);
  const [cinematicDebug, setCinematicDebug] = useState<{
    base?: string;
    edge?: string;
    shape?: string;
    final?: string;
  } | null>(null);
  const CINEMATIC_REF_LIBRARY = [
    { id: "glass-blue", label: "Glass Blue", src: "/cinematic-refs/glass-blue.png" },
    { id: "chrome-purple", label: "Chrome Purple", src: "/cinematic-refs/chrome-purple.png" },
    { id: "gold-smoke", label: "Gold Smoke", src: "/cinematic-refs/gold-smoke.png" },
    { id: "spicy", label: "Spicy Hot", src: "/cinematic-refs/spicy.png" },
    { id: "frozen", label: "Frozen", src: "/cinematic-refs/frozen.png" },
    { id: "white-gold", label: "White Gold", src: "/cinematic-refs/white-gold.png" },
  ];
  const [cinematicRefUrl, setCinematicRefUrl] = useState<string | null>(
    CINEMATIC_REF_LIBRARY[0]?.src ?? null
  );
  const [cinematicTextInput, setCinematicTextInput] = useState<string>("LOVE");
  
  // ==========================================
  // 🍌 MAGIC BLEND STATE
  // ==========================================
  const [isBlending, setIsBlending] = useState(false);
  const [blendSubject, setBlendSubject] = useState<string | null>(null);
  const [blendBackground, setBlendBackground] = useState<string | null>(null);
  const [blendBackgroundPriority, setBlendBackgroundPriority] = useState<
    "upload" | "canvas"
  >("upload");
 
  const [blendSubjectCutout, setBlendSubjectCutout] = useState<string | null>(null);
  const [isCuttingOut, setIsCuttingOut] = useState(false);
  // ✅ REQUIRED STATE (add near your other state hooks)
  const [blendStyle, setBlendStyle] = useState<
    "club" | "tropical" | "jazz_bar" | "outdoor_summer"
  >("club");
  const suppressCloseRef = React.useRef(false);
  
  



  const presetId = selectedMaterialId || "gold";
      const isMagma = presetId === "magma";

  const WRAP_LIBRARY = [
    { id: "none", label: "None", src: "" },
    { id: "zebra", label: "Zebra Print", src: encodeURI("/wraps/Zebra Print.jpg") },
    { id: "tiger", label: "Tiger Stripes", src: encodeURI("/wraps/Tiger Stripes.jpg") },
    { id: "carbon_fiber", label: "Carbon Fiber", src: encodeURI("/wraps/Carbon Fiber.jpg") },
    { id: "snakeskin", label: "Snake Skin", src: encodeURI("/wraps/Snake Skin.jpg") },
    { id: "geometric", label: "Geometric Pattern", src: encodeURI("/wraps/Geometric Pattern.jpg") },
  ] as const;

      // UI warmth value is:
      // - for magma: 0..1 (Warm..Hot)
      // - for others: -1..1 (Cool..Warm)
      const warmthForApi = isMagma
        ? Math.max(0, Math.min(1, warmthVal))    // Force 0 to 1
        : Math.max(-1, Math.min(1, warmthVal));  // Force -1 to 1

  // =========================================================
  // 2. EFFECT: AUTO-HEAT MAGMA
  // =========================================================
  useEffect(() => {
    if (selectedMaterialId === "magma") {
      setWarmthVal((prev) => (prev < 0 ? 0.55 : prev));
    }
  }, [selectedMaterialId]);

  // =========================================================
  // 3. THE FIXED HANDLER (Must be inside Page)
  // =========================================================
 const handleCreateCinematic = async () => {
  let ref = cinematicRefUrl;
  if (ref && typeof window !== "undefined" && ref.startsWith("/")) {
    ref = `${window.location.origin}${ref}`;
  }
  if (ref && typeof window !== "undefined" && ref.startsWith("http")) {
    try {
      const r = await fetch(ref);
      const b = await r.blob();
      ref = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => reject(new Error("Failed to read reference image"));
        fr.readAsDataURL(b);
      });
    } catch (e) {
      throw new Error("Failed to load reference image");
    }
  }
  const txt = String(cinematicTextInput || "").trim();
  if (!ref) {
    alert("Select a reference image.");
    return;
  }
  if (!txt) {
    alert("Enter the text you want.");
    return;
  }

  setIsGeneratingCinematic(true);

  try {
    const res = await fetch("/api/gen-cinematic-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: ref, text: txt }),
    });

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(data?.error || "Generation failed");
    const renderedUrl = data?.url;
    if (!renderedUrl) throw new Error("API returned no image URL");

    setCinematicDebug({
      base: ref,
      final: renderedUrl,
    });

    const currentSlots = [
      ...(Array.isArray(logoSlots) ? logoSlots : ["", "", "", ""]),
    ];
    let targetIdx = currentSlots.findIndex((s) => !s || s === "");
    if (targetIdx === -1) targetIdx = 3;
    currentSlots[targetIdx] = renderedUrl;

    if (setLogoSlots) setLogoSlots([...currentSlots]);
    try {
      localStorage.setItem("nf:logoSlots", JSON.stringify(currentSlots));
    } catch {}

    setSelectedPanel?.("logo");
    setTimeout(() => {
      document.getElementById("logo-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);

    setIsGeneratingCinematic(false);
    setCinematicModalOpen(false);
    setCinematicWrapperUrl(null);
  } catch (err: any) {
    setIsGeneratingCinematic(false);
    alert(`Error: ${err?.message || "Unknown error"}`);
  }
};


  // ... (Rest of your component logic follows below) ...

    // ===========================================
  // ⭐ EMOJI STATE — MUST BE AT THE TOP ⭐
  // ===========================================
  const [activeTemplate, setActiveTemplate] = useState<TemplateSpec | null>(null);
  const [format, setFormat] = useState<Format>("square");
  const vibeUploadInputRef = React.useRef<HTMLInputElement | null>(null);
  
  const [headlineHidden, setHeadlineHidden] = useState(false);
  const [userLineHeight, setUserLineHeight] = useState(0.95);
  
// ✅ FORCE OPEN TEMPLATES ON LOAD (With delay to override defaults)
  useEffect(() => {
  const timer = setTimeout(() => {
    // ✅ only auto-open if user hasn't already chosen a panel
    if (useFlyerState.getState().selectedPanel == null) {
      useFlyerState.getState().setSelectedPanel("template");
    }
  }, 100);

  return () => clearTimeout(timer);
}, []);


  React.useEffect(() => {
  // When user selects magma, force warmth into 0..1 range and give it a hot default if needed
  if (presetId === "magma") {
    setWarmthVal((prev) => {
      const v = Number.isFinite(prev) ? prev : 0.55;
      if (v < 0) return 0.55;       // jump to “hot-ish”
      if (v > 1) return 1;
      return v;
    });
  }
}, [presetId, setWarmthVal]);


  // Warmth slider UI config
  const warmthMin = isMagma ? 0 : -1;
  const warmthMax = 1;
  const warmthStep = 0.01;

  // Labels
  const warmthLeftLabel = isMagma ? "Warm" : "Cool";
  const warmthRightLabel = isMagma ? "Hot" : "Warm";


// ===========================================
 // MAGIC BLEND
 // ===========================================
 // 1. Upload Handler for Magic Blend Slots
// 1. Upload Handler
 // 1. Upload Handler (Auto-Cuts Subject)
// 1. Upload Handler (Auto-Cuts Subject & Converts to Base64)
  const handleBlendUpload = async (type: 'subject' | 'bg', file: File) => {
    // Helper: Read file to Base64
    const toBase64 = (f: File) => new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(f);
    });

    // Helper: Convert Blob URL -> Base64 Data URL
    const blobToBase64 = async (blobUrl: string): Promise<string> => {
      if (!blobUrl.startsWith('blob:')) return blobUrl; // Already base64
      const res = await fetch(blobUrl);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.readAsDataURL(blob);
      });
    };

    const rawUrl = await toBase64(file);

    if (type === 'bg') {
      setBlendBackground(rawUrl);
      setBlendBackgroundPriority("upload");
    } else {
      // ✂️ SUBJECT: Trigger Loading -> Remove BG -> Convert to Base64
      setIsCuttingOut(true);
      try {

        
        // 1. Get the cutout (likely a Blob URL)
        const cutoutBlobUrl = await removeBackgroundLocal(rawUrl);
        
        // 2. Convert to Base64 immediately so API doesn't crash
        const cutoutBase64 = await blobToBase64(cutoutBlobUrl);
        
        setBlendSubject(cutoutBase64);
        
      } catch (err) {

        setBlendSubject(rawUrl); // Fallback to original if cutout fails
      } finally {
        setIsCuttingOut(false);
      }
    }
  };


// Helper: Glues Cutout onto Background with a "Grounding Shadow"
  const createCinematicComposite = async (bgUrl: string, subjectUrl: string) => {
    const canvas = document.createElement("canvas");
    // Default to a high-res portrait format for the blend
    const w = 1080; 
    const h = 1350; 
    canvas.width = w; 
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // 1. Load Images
    const loadImage = (src: string) => new Promise<HTMLImageElement>((res) => {
      const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => res(img); img.src = src;
    });
    const [bg, subj] = await Promise.all([loadImage(bgUrl), loadImage(subjectUrl)]);

    // 2. Draw Background (Cover Mode)
    const bgScale = Math.max(w / bg.width, h / bg.height);
    const bgW = bg.width * bgScale;
    const bgH = bg.height * bgScale;
    ctx.drawImage(bg, (w - bgW) / 2, (h - bgH) / 2, bgW, bgH);

    // 3. Draw Subject (Contain, Anchored Bottom)
    // We scale subject to ~90% width or ~80% height, whichever fits
    const sRatio = subj.width / subj.height;
    let sW = w * 0.90; 
    let sH = sW / sRatio;
    
    if (sH > h * 0.85) {
      sH = h * 0.85;
      sW = sH * sRatio;
    }

    const sX = (w - sW) / 2;
    const sY = h - sH; // Align to bottom edge

    // 4. Fake Shadow (Helps Flux understand depth)
    ctx.save();
    ctx.filter = "blur(20px)";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    // Draw an oval shadow at the feet
    ctx.beginPath();
    ctx.ellipse(w/2, sY + sH - 20, sW * 0.4, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Draw Cutout Subject
    ctx.drawImage(subj, sX, sY, sW, sH);

    return canvas.toDataURL("image/jpeg", 0.95);
  };

// 2. The Magic Blend Action
  const handleMagicBlend = async () => {
    // Basic validation
    if (!blendSubject) {
      alert("Please upload a Subject image.");
      return;
    }
    // We check background later because we might pull it from the canvas
   // if (!blendPrompt.trim()) {
   //   alert("Please describe the scene.");
   //   return;
   // }

    setIsBlending(true);

    try {


      // ✅ 1. Get Background: Respect priority, fallback if needed
      const fetchCanvasBg = async () => {
        if (!artRef.current) return null;
        try {
          // We cast to 'any' here to access the custom method we just added
          const bgFromCanvas = await artRef.current?.exportBackgroundDataUrl?.({
            size: 1024,
          });
          if (bgFromCanvas) {

            return bgFromCanvas;
          }
        } catch (e) {

        }
        return null;
      };

      let backgroundToSend: string | null = null;
      if (blendBackgroundPriority === "canvas") {
        backgroundToSend = (await fetchCanvasBg()) || blendBackground;
      } else {
        backgroundToSend = blendBackground || (await fetchCanvasBg());
      }

      // Hard stop if we still don't have a background
      if (!backgroundToSend) {
        throw new Error("No background found. Please upload a background to the slot or the canvas.");
      }



      // ✅ 2. Send to API
      const res = await fetch("/api/magic-blend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: blendSubject,
          background: backgroundToSend, // ✅ Uses the cropped/zoomed canvas BG if available
          //prompt: blendPrompt,
          style: blendStyle,
          format: format,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Blend failed");



      // 3. Apply Result to Canvas
      setBgUploadUrl(data.url);
      setBgUrl(null);
      
      // Reset transforms since the new image is already perfectly cropped
      setBgScale(1); 
      setBgPosX(50); 
      setBgPosY(50);

    } catch (err: any) {

      const msg = String(err?.message || "");
      if (/sensitive|flagged/i.test(msg)) {
        alert(
          "Magic Blend was blocked for sensitive content. Try a different subject/background or switch to a less revealing image."
        );
      } else {
        alert("Magic Blend failed: " + msg);
      }
    } finally {
      setIsBlending(false);
    }
  };

// =========================================================
  // 🍌 HELPER: Push Main Canvas Background -> Magic Blend Slot
  // =========================================================
  const pushCanvasBgToBlend = async () => {
    if (!artRef.current) return;
    
    try {
      // Access the snapshot method we added to Artboard earlier
      const url = await artRef.current.exportBackgroundDataUrl?.({ size: 1024 });
      
      if (url) {

        setBlendBackground(url); 
        setBlendBackgroundPriority("canvas");
      } else {
        alert("No background image found on the main canvas.");
      }
    } catch (e) {

    }
  };


useEffect(() => {
  // ✅ Guard: prevent multiple subscriptions (hot reload / multiple mounts)
  const w = globalThis as any;
  if (w.__flyerStateLogUnsub) return;

  let lastKey = "";
  let lastPanel: string | null | undefined = undefined;

  const unsub = useFlyerState.subscribe((state) => {
    const snap = {
      moveTarget: state.moveTarget,
      selectedPanel: state.selectedPanel as string | null,
      dragging: state.dragging,
    };

    // ✅ Only log when these values actually change
    const key = `${snap.moveTarget}|${snap.selectedPanel}|${snap.dragging}`;
    if (key === lastKey) return;

    // ✅ log normal state changes


    // 🧨 log stack ONLY when selectedPanel changes (this tells us WHO closed it)
    if (snap.selectedPanel !== lastPanel) {

      lastPanel = snap.selectedPanel;
    }

    lastKey = key;
  });

  // store unsubscribe globally so we never double-subscribe
  w.__flyerStateLogUnsub = unsub;

  return () => {
    try {
      w.__flyerStateLogUnsub?.();
    } finally {
      w.__flyerStateLogUnsub = null;
    }
  };
}, []);







// ==== FADE ENGINE =====================================================
const [fadeKey, setFadeKey] = useState(0);
const [fadeState, setFadeState] = useState<"idle" | "fadingOut" | "fadingIn">("idle");
const [pendingFormat, setPendingFormat] = useState<Format | null>(null);
const [fadeOut, setFadeOut] = useState(false);
const [showStartupTemplates, setShowStartupTemplates] = React.useState(true);



const handleFadeAnimationComplete = () => {
  // When fading out is done, switch the format while invisible
  if (fadeState === "fadingOut" && pendingFormat) {
    const fmt = pendingFormat;

    // Switch format
    setFormat(fmt);
    setPendingFormat(null);

    // Force re-mount of Artboard
    setFadeKey(k => k + 1);

    // Begin fade-in
    setFadeState("fadingIn");

    // Load template variant
    const tpl = TEMPLATE_GALLERY.find(t => t.id === templateId);
    if (tpl) applyTemplate(tpl, { targetFormat: fmt });

    return;
  }

  // When fade-in completes → done
  if (fadeState === "fadingIn") {
    setFadeState("idle");
  }
};

// ==== FADE ENGINE =====================================================



// === ZUSTAND STATE HOOKS =========================================
// ============================================================================
// FLYER STORE - GLOBAL STATE DESTRUCTURE (MATCHES FLYERSTATE.TS EXACTLY)
// ============================================================================

const {
  // ---------------------------------------------------------
  // SESSION SYSTEM (ONLY WHAT EXISTS IN STORE)
  // ---------------------------------------------------------
  session,
  sessionDirty,
  setSessionValue,

  // ---------------------------------------------------------
  // DRAG SYSTEM
  // ---------------------------------------------------------
  isLiveDragging,
  setIsLiveDragging,

  moveTarget,
  setMoveTarget,

  dragging,
  setDragging,

  // ---------------------------------------------------------
  // UI PANEL
  // ---------------------------------------------------------
  selectedPanel,
  setSelectedPanel,

  // ---------------------------------------------------------
  // HEADLINE2 LEGACY COLOR
  // ---------------------------------------------------------
  head2Color,
  setHead2Color,

  // ---------------------------------------------------------
  // SHADOW FLAGS
  // ---------------------------------------------------------
  headShadow,
  head2Shadow,
  detailsShadow,
  details2Shadow,
  venueShadow,
  subtagShadow,

  // ---------------------------------------------------------
  // SHADOW STRENGTH
  // ---------------------------------------------------------
  headShadowStrength,
  head2ShadowStrength,
  detailsShadowStrength,
  details2ShadowStrength,
  venueShadowStrength,
  subtagShadowStrength,

  setHeadShadow,
  setHead2Shadow,
  setDetailsShadow,
  setDetails2Shadow,
  setVenueShadow,
  setSubtagShadow,

  setHeadShadowStrength,
  setHead2ShadowStrength,
  setDetailsShadowStrength,
  setDetails2ShadowStrength,
  setVenueShadowStrength,
  setSubtagShadowStrength,

  // ---------------------------------------------------------
  // ENABLE TOGGLES
  // ---------------------------------------------------------
  detailsEnabled,
  setDetailsEnabled,

  details2Enabled,
  setDetails2Enabled,

  headline2Enabled,
  setHeadline2Enabled,

  subtagEnabled,
  setSubtagEnabled,

  venueEnabled,
  setVenueEnabled,

  // ---------------------------------------------------------
  // EMOJIS
  // ---------------------------------------------------------
  emojis,
  setEmojis,
  addEmoji,
  updateEmoji,
  removeEmoji,
  moveEmoji,

  emojisEnabled,
  setEmojisEnabled,

  // ---------------------------------------------------------
  // PORTRAITS (NEW)
  // ---------------------------------------------------------
  portraits,
  setPortraits,
  addPortrait,
  updatePortrait,
  removePortrait,
  selectedPortraitId,
  setSelectedPortraitId,

  // ---------------------------------------------------------
  // TEMPLATE SNAPSHOT
  // ---------------------------------------------------------
  currentTemplate,
  setCurrentTemplate,

  // ---------------------------------------------------------
  // TEXT STYLES
  // ---------------------------------------------------------
  textStyles,
  setTextStyle,

  setSession,
  setSessionDirty,

} = useFlyerState();


// --- Cutout cleanup UI state ---


type CleanupById = Record<string, CleanupParams>;

const DEFAULT_CLEANUP: CleanupParams = {
  shrinkPx: 2,
  featherPx: 2,
  alphaBoost: 1.35,
  alphaSmoothPx: 2,
  edgeGamma: 1.1,
  decontaminate: 0.55,
  spillSuppress: 0.35,
  alphaFill: 0.08,
  edgeClamp: 0,
};


const [cleanupById, setCleanupById] = useState<CleanupById>({});
const [cleanupParams, setCleanupParams] = useState<CleanupParams>(DEFAULT_CLEANUP);

// prevents reprocessing on every tiny slider tick
const cleanupTimerRef = useRef<number | null>(null);
const cleanupBusyRef = useRef(false);
const cleanupBaseUrlRef = useRef<Record<string, string>>({});
const cleanupJobRef = useRef(0); // cancels stale async runs

// current portrait selection
const selectedPortrait = React.useMemo(() => {
  const list = portraits?.[format] || [];
  return list.find((p) => p.id === selectedPortraitId) || null;
}, [portraits, format, selectedPortraitId]);

// ✅ SINGLE source-of-truth slider sync on portrait switch
useEffect(() => {
  if (!selectedPortraitId) return;

  // 1) prefer cleanupById (local UI cache)
  const cached = cleanupById[selectedPortraitId];
  if (cached) {
    setCleanupParams(cached);
    return;
  }

  // 2) fallback to what was stored on the portrait object (if you stored it)
  const list = portraits?.[format] || [];
  const p = list.find((x) => x.id === selectedPortraitId) as any;
  const saved = p?.cleanup as CleanupParams | undefined;

  if (saved) {
    setCleanupParams(saved);
    return;
  }

  // 3) fallback to default
  setCleanupParams(DEFAULT_CLEANUP);
}, [selectedPortraitId, cleanupById, portraits, format]);

// ✅ Call this from slider handlers: it updates UI cache AND triggers cleanup
function setCleanupAndRun(next: CleanupParams) {
  if (!selectedPortrait) return;

  const portraitId = selectedPortrait.id;

  // store per-image settings so toggling portraits restores sliders instantly
  setCleanupById((prev) => ({ ...prev, [portraitId]: next }));
  setCleanupParams(next);

  runCleanupDebounced(portraitId, next);
}

// ✅ FIX: Robust cleanup runner with better error logging
  async function runCleanupDebounced(portraitId: string, nextParams: CleanupParams) {
    const list = portraits?.[format] || [];
    const p = list.find((x) => x.id === portraitId) as any;
    
    // 1. Guard: Portrait must exist
    if (!p) {

        return;
    }

    // 2. Guard: URL must exist
    if (!p.url) {

        return;
    }

    // 3. Set Base URL (Original) ONLY if missing
    // We prefer using the CURRENT url if we haven't saved a base yet.
    if (!cleanupBaseUrlRef.current[portraitId]) {
      // If the current URL is already a blob, save it. 
      // If it's a data-url from a previous cleanup, we might be degrading quality, 
      // but it's better than crashing.
      cleanupBaseUrlRef.current[portraitId] = p.url;
    }

    const sourceUrl = cleanupBaseUrlRef.current[portraitId];

    // 4. Cancel previous timer
    if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current);

    // 5. Job ID for concurrency
    const myJob = ++cleanupJobRef.current;

    cleanupTimerRef.current = window.setTimeout(async () => {
      if (cleanupBusyRef.current) return;
      cleanupBusyRef.current = true;

      try {

        
        // CALL THE LIBRARY FUNCTION
        const cleanedDataUrl = await cleanupCutoutUrl(sourceUrl, nextParams);

        // Check staleness
        if (myJob !== cleanupJobRef.current) return;

        // Update Store
        useFlyerState.getState().updatePortrait(format, portraitId, {
          url: cleanedDataUrl,
          cleanup: nextParams,
        });
        


      } catch (err) {
        // Detailed logging



      } finally {
        cleanupBusyRef.current = false;
      }
    }, 120); // 120ms debounce
  }

const onChangeCleanup = (patch: Partial<CleanupParams>) => {
  if (!selectedPortraitId) return;

  const next: CleanupParams = { ...cleanupParams, ...patch };

  // 1) Update UI immediately
  setCleanupParams(next);

  // 2) Persist per-portrait settings onto the portrait object (Zustand)
  //    This makes it behave like x/y/scale/locked.
  useFlyerState.getState().updatePortrait(format, selectedPortraitId, {
    cleanup: next,
  });

  // 3) Re-run processing using the correct portrait id
  runCleanupDebounced(selectedPortraitId, next);
};


// Local render list
const emojiList = emojis[format] || [];
const [activeEmojiList, setActiveEmojiList] = React.useState<Emoji[]>(emojiList);

// Refresh local list when format or template changes
React.useEffect(() => {
  setActiveEmojiList(emojis[format] || []);
}, [format, emojis]);

// Add emoji helper
// ✅ Track which emoji is currently selected
const [selectedEmojiId, setSelectedEmojiId] = useState<string | null>(null);

const [headX, setHeadX] = useState<number>(0);
const [headY, setHeadY] = useState<number>(0);
const [head2X, setHead2X] = useState<number>(0);
const [head2Y, setHead2Y] = useState<number>(0);
const [detailsX, setDetailsX] = useState<number>(0);
const [detailsY, setDetailsY] = useState<number>(0);
const [detailsFamily, setDetailsFamily] = useState<string>('Inter');
const [detailsFont, setDetailsFont] = useState(detailsFamily);


const [venueX, setVenueX] = useState<number>(0);
const [venueY, setVenueY] = useState<number>(0);
const [subtagX, setSubtagX] = useState<number>(0);
const [subtagY, setSubtagY] = useState<number>(0);

const [details2X, setDetails2X] = useState<number>(0);
const [details2Y, setDetails2Y] = useState<number>(0);

const [portraitX, setPortraitX] = useState<number>(50);
const [portraitY, setPortraitY] = useState<number>(50);

const [portraitScale, setPortraitScale] = useState<number>(1);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoX, setLogoX] = useState<number>(6);
  const [logoY, setLogoY] = useState<number>(100 - 6 - 14);
  const [logoScale, setLogoScale] = useState<number>(1);
  const [unlockingIds, setUnlockingIds] = useState<string[]>([]);

// 🔵 Universal lookup table for all canvas elements
const ALIGN_MAP = {
  headline:  { ref: () => canvasRefs.headline,  setX: setHeadX,  setY: setHeadY },
  headline2: { ref: () => canvasRefs.headline2, setX: setHead2X, setY: setHead2Y },
  details:   { ref: () => canvasRefs.details,   setX: setDetailsX, setY: setDetailsY },
  details2:  { ref: () => canvasRefs.details2,  setX: setDetails2X, setY: setDetails2Y },
  venue:     { ref: () => canvasRefs.venue,     setX: setVenueX, setY: setVenueY },
  subtag:    { ref: () => canvasRefs.subtag,    setX: setSubtagX, setY: setSubtagY },

  // If you want these aligned too:
  portrait:  { ref: () => canvasRefs.portrait,  setX: setPortraitX, setY: setPortraitY },
  logo:      { ref: () => canvasRefs.logo,      setX: setLogoX, setY: setLogoY },
};
   

  const [isTemplateLocked, setIsTemplateLocked] = useState(false);

  // ... many states here ...

 
  const isDragging = moveTarget !== null;
 

useEffect(() => {
  const store = useFlyerState.getState();

  // ✅ if emoji is selected or emoji panel is open, NEVER auto-switch panels
  if ((store as any).selectedEmojiId || store.selectedPanel === "emoji") return;

  if (!moveTarget) return;

  const map: Record<string, string> = {
    headline: "headline",
    headline2: "head2",
    details: "details",
    details2: "details2",
    venue: "venue",
    subtag: "subtag",
    background: "background",

    // ✅ icon mode should open the Library panel (NOT portrait)
    icon: "icons",
    shape: "icons",
  };

  const next = map[String(moveTarget)];
  if (next) {
    // IMPORTANT: use STORE setter, not local setSelectedPanel
    useFlyerState.getState().setSelectedPanel(next);
  }
}, [moveTarget]);





  // ✅ Disable all heavy rendering during drag
  const disableDuringDrag = isDragging
    ? { textShadow: 'none', filter: 'none' }
    : {};
  // place this near your other useState hooks


  // === PORTRAIT FIT (dashed border hugs visible image) =======================
const [portraitFit, setPortraitFit] = React.useState<Record<string, {
  wPct: number;   // fitted width % inside its wrapper
  hPct: number;   // fitted height % inside its wrapper
  leftPct: number; // left offset % inside its wrapper
  topPct: number;  // top offset % inside its wrapper
}>>
({});


// === PORTRAIT STATE (single source of truth) ===
const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
const [portraitLocked, setPortraitLocked] = useState<boolean>(false);
const [portraitAR,  setPortraitAR]  = useState<number | null>(null);
const portraitBaseW = useRef<number | null>(null);
const [autoSaveOn, setAutoSaveOn] = useState(true);
const [removingBg, setRemovingBg] = useState(false);
const portraitPickerRef = useRef<HTMLInputElement>(null);
const [rmModel, setRmModel]       = useState<0 | 1>(1);
const [rmFeather, setRmFeather]   = useState<number>(2);
const [enablePortraitOverlay, setEnablePortraitOverlay] = useState<boolean>(true);

// ===== BG CLEANUP UI (Portrait Matte Refinement) =====
const [bgCleanup, setBgCleanup] = useState({
  shrinkPx: 1,          // 0..4  (erode)
  featherPx: 0.8,       // 0..3  (blur/feather)
  alphaBoost: 1.1,      // 1..1.6 (alpha levels)
  decontaminate: 0.6,   // 0..1  (edge color cleanup)
});

// optional: keep last raw cutout so you can reprocess without re-running AI
const [lastCutoutUrl, setLastCutoutUrl] = useState<string | null>(null);




const [pBaseW, setPBaseW] = React.useState<number | null>(null);
const [pBaseH, setPBaseH] = React.useState<number | null>(null);
const [loadedFormats, setLoadedFormats] = React.useState<{ square?: boolean; story?: boolean }>({});

React.useEffect(() => { setPBaseW(null); setPBaseH(null); }, [portraitUrl]);


// === PORTRAIT SLOTS (up to 4, persisted) ===
const MAX_PORTRAIT_SLOTS = 4;

const [portraitSlots, setPortraitSlots] = useState<string[]>(() => {
  try {
    const raw = localStorage.getItem('nf:portraitSlots');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_PORTRAIT_SLOTS) : Array(MAX_PORTRAIT_SLOTS).fill('');
  } catch {
    return Array(MAX_PORTRAIT_SLOTS).fill('');
  }
});

const [portraitSlotSources, setPortraitSlotSources] = useState<string[]>(() => {
  try {
    const raw = localStorage.getItem('nf:portraitSlotSources');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_PORTRAIT_SLOTS) : Array(MAX_PORTRAIT_SLOTS).fill('');
  } catch {
    return Array(MAX_PORTRAIT_SLOTS).fill('');
  }
});

React.useEffect(() => {
  const next = portraitSlotSources.map((src, idx) =>
    portraitSlots[idx] ? src : ""
  );
  if (next.some((v, i) => v !== portraitSlotSources[i])) {
    persistPortraitSlotSources(next);
  }
}, [portraitSlots, portraitSlotSources]);

function persistPortraitSlots(next: string[]) {
  const trimmed = next.slice(0, MAX_PORTRAIT_SLOTS);
  setPortraitSlots(trimmed);
  try { localStorage.setItem('nf:portraitSlots', JSON.stringify(trimmed)); } catch {}
}

function persistPortraitSlotSources(next: string[]) {
  const trimmed = next.slice(0, MAX_PORTRAIT_SLOTS);
  setPortraitSlotSources(trimmed);
  try { localStorage.setItem('nf:portraitSlotSources', JSON.stringify(trimmed)); } catch {}
}

const portraitSlotPickerRef = useRef<HTMLInputElement>(null);
const pendingPortraitSlot = useRef<number | null>(null);

const PS_portraitSlotPickerRef = portraitSlotPickerRef;

// If you already have these handlers, alias them too:
const PS_onPortraitSlotFile = onPortraitSlotFile;
const PS_triggerPortraitSlotUpload = triggerUploadForPortraitSlot;

// If you already have portraitSlots state & helpers, alias them:
const PS_portraitSlots = portraitSlots;
const PS_placePortraitFromSlot = placePortraitFromSlot;
const PS_clearPortraitSlot = clearPortraitSlot;


function triggerUploadForPortraitSlot(i: number) {
  pendingPortraitSlot.current = i;
  portraitSlotPickerRef.current?.click();
}


// ===== PORTRAIT LIBRARY STATE (REPLACE ANY PRIOR VERSIONS) =====
const MAX_PORTRAITS = 2;

const [portraitLibrary, setPortraitLibrary] = useState<string[]>([]);


function addToPortraitLibrary(src: string) {
  setPortraitLibrary(prev => {
    if (prev.includes(src)) return prev;
    if (prev.length >= MAX_PORTRAITS) {
      alert(`You can only keep ${MAX_PORTRAITS} portraits in the library.`);
      return prev;
    }
    return [...prev, src];
  });
}



// Add portrait to library (called after background removal)
const addPortraitToLibrary = (src: string) => {
  setPortraitLibrary(prev => {
    if (prev.includes(src)) return prev;          // avoid duplicates
    if (prev.length >= 2) return prev;            // max 2 allowed
    return [...prev, src];
  });
};

// Remove from library
const removePortraitFromLibrary = (src: string) => {
  setPortraitLibrary(prev => prev.filter(p => p !== src));
};




//
useEffect(() => {
  if (portraitUrl && portraitBaseW.current == null) {
    
    portraitBaseW.current = 40; // fallback: your default portrait box width in %
  }
}, [portraitUrl]);


  
  // === HYDRATION GATE (SSR/CSR match) ===
  const [hydrated, setHydrated] = React.useState(false);
  const [storageReady, setStorageReady] = React.useState(false);
  const storageReadyRef = React.useRef(false);
  const pendingStartupKeyRef = React.useRef<string | null>(null);
  // ===== LOGO UPLOAD (fix for “Cannot find name 'addLogosFromFiles'”) =====

const countLogos = (list: any[]) => list.filter(i => i.imgUrl && i.name === 'logo').length;

const fileToDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

async function addLogosFromFiles(files: FileList) {
  const arr = Array.from(files);
  if (arr.length === 0) return;

  // Read all as DataURL
  const reads = arr.map(f => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  }));

  try {
    const urls = await Promise.all(reads);
    // Set first as active logo
    setLogoUrl(urls[0] || null);
    // Add all to library
    urls.forEach(u => addToLogoLibrary(u));
  } catch {
    alert('Logo upload failed');
  }
}

// ===== /LOGO UPLOAD =====

  React.useEffect(() => setHydrated(true), []);
  React.useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      storageReadyRef.current = true;
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [hydrated]);

  // ------------------------------------------------------------


  // ===== AI BG "JUST WORKS" — CONSTANTS =====
   // ===== Credits (persisted safely after hydration) =====
const CREDITS_KEY = 'nf:bg.credits.v2';
const INITIAL_CREDITS = 100;

const [credits, setCredits] = React.useState<number>(INITIAL_CREDITS);

// read AFTER hydration
React.useEffect(() => {
  if (!hydrated) return;
  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    setCredits(raw ? Math.max(0, parseInt(raw, 10) || 0) : INITIAL_CREDITS);
  } catch {
    // ignore; keep default
  }
}, [hydrated]);

// write AFTER hydration
React.useEffect(() => {
  if (!hydrated) return;
  try { localStorage.setItem(CREDITS_KEY, String(credits)); } catch {}
}, [credits, hydrated]);



// ===== ONBOARDING STRIP (first-open only) =====
const ONBOARD_KEY = 'nf:onboarded:v1';
const [showOnboard, setShowOnboard] = useState<boolean>(false);

// read AFTER hydration
useEffect(() => {
  if (!hydrated) return;
  try {
    const seen = localStorage.getItem(ONBOARD_KEY);
    setShowOnboard(!seen);
  } catch {
    setShowOnboard(true);
  }
}, [hydrated]);

const markOnboarded = () => {
  try { localStorage.setItem(ONBOARD_KEY, '1'); } catch {}
  setShowOnboard(false);
};

// hidden file input to support "Upload background" from the strip
const uplRef = useRef<HTMLInputElement>(null);
const triggerUpload = () => bgRightRef.current?.click();
const onOnboardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { setBgUploadUrl(String(r.result)); setBgUrl(null); setFormat('square'); markOnboarded(); };
  r.readAsDataURL(f);
  e.currentTarget.value = '';
};

/* ===== RIGHT-PANEL BG UPLOAD HELPERS (BEGIN) ===== */
// Dedicated ref for the right panel picker (separate from onboarding)
const bgRightRef = useRef<HTMLInputElement>(null);

// Open the right-panel picker
const openBgPicker = () => bgRightRef.current?.click();

// Handle a file chosen from the right panel
const onRightBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    setBgUploadUrl(String(r.result));
    setBgUrl(null);         // prefer the upload
    setFormat('square');    // safe default canvas size
    setBgScale(1.3);        // slight “fill” zoom
    setBgPosX(50);          // center
    setBgPosY(50);          // center
  };
  r.readAsDataURL(f);
  e.currentTarget.value = ''; // allow re-selecting same file later
};


// Quick actions for right-panel controls
const clearBackground = () => { setBgUploadUrl(null); setBgUrl(null); };
const fitBackground   = () => { setBgScale(1.0); setBgPosX(50); setBgPosY(50); };
/* ===== RIGHT-PANEL BG UPLOAD HELPERS (END) ===== */

// ===== LOGO PICKER (BEGIN) =====
const logoPickerRef = useRef<HTMLInputElement>(null);
const logoSlotPickerRef = useRef<HTMLInputElement>(null);
const pendingLogoSlot = useRef<number | null>(null);
// Portrait picker (for BG remover)

function triggerUploadForSlot(i: number) {
  pendingLogoSlot.current = i;
  logoSlotPickerRef.current?.click();
}
function onLogoSlotFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];

  // allow re-selecting the same file later
  e.currentTarget.value = '';

  // no file or slot index? stop
  const idx = pendingLogoSlot.current;
  if (!file || idx == null) {
    pendingLogoSlot.current = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || '');

    // write into the chosen slot + persist
    setLogoSlots(prev => {
      const next = [...prev];
      next[idx] = dataUrl;
      try { localStorage.setItem('nf:logoSlots', JSON.stringify(next)); } catch {}
      return next;
    });

    // clear slot pointer
    pendingLogoSlot.current = null;
  };

  reader.readAsDataURL(file);
}
function placeLogoFromSlot(idx: number) {
  // read from the 4-slot library
  const src = logoSlots?.[idx];
  if (!src) return;

  // load into the active logo
  setLogoUrl(src);

  // (optional) bring the user straight into logo move mode
  try {
    setMoveMode(true);
    setDragging('logo' as any); // if your MoveTarget type includes 'logo', remove `as any`
  } catch {
    /* no-op if your move system differs */
  }

  // you can also reset scale/rotation here if you want a predictable placement:
  // setLogoScale(1);
  // setLogoRotate(0);
  // keep existing logoX/logoY so it appears where user last placed it
}


const openPortraitPicker = () => portraitPickerRef.current?.click();
const openLogoPicker = () => logoPickerRef.current?.click();

const onLogoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (files && files.length) addLogosFromFiles(files);
  e.currentTarget.value = ''; // allow re-selecting the same file later
};

// Optional keyboard: Cmd/Ctrl+Shift+L opens the logo picker
useEffect(() => {
  const onKey = (ev: KeyboardEvent) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.shiftKey && ev.key.toLowerCase() === 'l') {
      ev.preventDefault();
      openLogoPicker();
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []);

// ===== LOGO PICKER (END) =====

/* ===== PORTRAIT BG REMOVER (BEGIN) ===== */
// Helper: data URL -> Blob
function dataURLToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/png';
  const bin = atob(b64);
  const len = bin.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

// FINAL: API-backed BG removal (uses /api/remove-bg)
async function removePortraitBackgroundFromURL(url: string): Promise<string> {
  const blob = url.startsWith('data:')
    ? dataURLToBlob(url)
    : await (await fetch(url, { cache: 'no-store' })).blob();

  const fd = new FormData();
  fd.append('image', blob, 'image.png');

  const r = await fetch('/api/remove-bg', { method: 'POST', body: fd });
  if (!r.ok) throw new Error(await r.text());

  const out = await r.blob();
  return await new Promise<string>((res) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.readAsDataURL(out);
  });
}

/* ===== PORTRAIT BG REMOVER (BEGIN) ===== */
async function onRemovePortraitBg() {
  if (!portraitUrl) return;
  try {
    setRemovingBg(true);
    
    // ✅ CHANGED: Use the new high-quality local remover
    const cut = await removeBackgroundLocal(portraitUrl);
    
    setPortraitUrl(cut);
    setClarity(0.15); // Auto-enhance clarity slightly
  } catch (e: any) {

    alert(`Background removal failed: ${e.message || "Unknown error"}`);
  } finally {
    setRemovingBg(false);
  }
}
/* ===== PORTRAIT BG REMOVER (END) ===== */


// quick “demo text” fill
const applyDemoText = () => {
  setHeadline('FRIDAY NIGHT');
  setDetails('Doors 9PM\n21+ | Dress code enforced\nTABLES • BOTTLE SERVICE');
  setVenue('ORBIT CLUB — DOWNTOWN');
 setSubtagEnabled(format, true);
  setSubtag('special guest');
  setBodyColor('#E5E7EB');
  setVenueColor('#FFFFFF');
  setTextFx(v=>({...v, gradient:false, color:'#FFFFFF', strokeWidth:0 }));
};

// one-click “Template + Generate” for instant poster
const quickTemplateAndGen = async () => {
  await applyStarterTemplate('edm_tunnel');     // uses your starter & calls generate if no bg
  markOnboarded();
};

// one-click “Generate Background” using current AI settings
const quickGenerate = async () => {
  await generateBackground();
  markOnboarded();
};



// === TEMPLATE LOADER (gallery-style) =====================================
 // ⚠️ ensure this import exists near your top imports

//const [activeTemplate, setActiveTemplate] = useState<TemplateSpec | null>(null);
//const [format, setFormat] = useState<Format>('square');

// Computed layout for the active template and format
const currentLayout = activeTemplate ? loadTemplate(activeTemplate, format) : null;

// Apply button handler moved below applyTemplate definition (to avoid TDZ)

// Format toggle handler (called from Square/Story chips)
// === OPTIONAL: Artboard resize helper for format switching ===
function resizeArtboardForFormat(nextFormat: Format) {
  // 🧠 This ensures your text and layout scale nicely when switching formats
  // without reapplying the template.

  try {
    // Example base sizes
    const baseSquare = { width: 1080, height: 1080 };
    const baseStory = { width: 1080, height: 1920 };

    const newSize =
      nextFormat === "story"
        ? baseStory
        : baseSquare;

    // If you have refs for your artboard or canvas:
    if (artRef?.current) {
      artRef.current.style.width = `${newSize.width}px`;
      artRef.current.style.height = `${newSize.height}px`;
    }

    // If headline coordinates or scaling logic are stored in state:
    if (typeof setHeadX === "function" && typeof setHeadY === "function") {
      // Example: maintain relative positioning
      setHeadX((x) => Math.min(x, 100));
      setHeadY((y) => Math.min(y, 100));
    }


  } catch (err) {

  }
}

// REPLACE: allow exact prompt/style overrides per call (hoisted above first use)
type GenOpts = {
  prompt?: string;             // when provided, use exactly this (no remix)
  style?: GenStyle;            // optional override for STYLE_DB
  formatOverride?: Format;     // square/story override for composition
  allowPeopleOverride?: boolean;
  varietyOverride?: number;    // 0..6 (0 = tightest to prompt)
};

    // Track last successful run options for "Regenerate"
    const lastGenRef = useRef<{ opts: GenOpts; seed: number; fmt: Format } | null>(null);


  /* palette / format */
  const [palette, setPalette] = useState<Palette>({ bgFrom: '#0b0b0d', bgTo: '#121216' });



  //TEMPLATES
  const [templateId, setTemplateId] = useState<string | null>(null);



  // === AUTO-APPLY TEMPLATE PRESETS ==========================================
// ⭐ Apply base template defaults when format changes




useEffect(() => {
  // removed TEMPLATE-based autoload — applyTemplate handles all coordinates now
}, [format, templateId]);

  type PortraitInstance = {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  locked: boolean;
};

const [portraitByFormat, setPortraitByFormat] =
  useState<Record<Format, PortraitInstance[]>>({
    square: [],
    story: [],
  });



// 1️⃣ Lock drag updates temporarily after template apply
const dragLockedRef = React.useRef(false);

function lockDragTemporarily(ms = 300) {
  dragLockedRef.current = true;
  setTimeout(() => (dragLockedRef.current = false), ms);
}

// 2️⃣ Override all drag-based coordinate setters to round values
function safeSet(setter: (val: number) => void, val: number) {
  if (dragLockedRef.current) return; // ⛔ skip during lock window
  const rounded = Math.round(val * 1000) / 1000;
  setter(rounded);
}

// 3️⃣ Wrap each existing RAF move handler with safety and rounding
const onHeadMoveRafSafe = useRafThrottle((x: number, y: number) => {
  if (dragLockedRef.current) return;
  safeSet(setHeadX, x);
  safeSet(setHeadY, y);
});

const onHead2MoveRafSafe = useRafThrottle((x: number, y: number) => {
  if (dragLockedRef.current) return;
  safeSet(setHead2X, x);
  safeSet(setHead2Y, y);
});

const onDetailsMoveRafSafe = useRafThrottle((x: number, y: number) => {
  if (dragLockedRef.current) return;
  safeSet(setDetailsX, x);
  safeSet(setDetailsY, y);
});

const onDetails2MoveRafSafe = useRafThrottle((x: number, y: number) => {
  if (dragLockedRef.current) return;
  safeSet(setDetails2X, x);
  safeSet(setDetails2Y, y);
});



const onVenueMoveRafSafe = useRafThrottle((x: number, y: number) => {
  if (dragLockedRef.current) return;
  safeSet(setVenueX, x);
  safeSet(setVenueY, y);
});

const onSubtagMoveRafSafe = useRafThrottle((x: number, y: number) => {
  if (dragLockedRef.current) return;
  safeSet(setSubtagX, x);
  safeSet(setSubtagY, y);
});




  // === EMOJIS (state + setter) =================================================
const addEmojiToCanvas = (emoji: string) => {
  const id = "emoji_" + Math.random().toString(36).slice(2, 8);
  const store = useFlyerState.getState();

  // ✅ safe bucket read
  const emojisByFormat = (store.emojis ?? {}) as Partial<Record<Format, any[]>>;
  const bucket = Array.isArray(emojisByFormat[format]) ? emojisByFormat[format]! : [];

  // ✅ commit emoji to canvas
  store.setEmojis(format, [
    ...bucket,
    {
      id,
      char: emoji,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      locked: false,
    },
  ]);

  // 🔥 CRITICAL (this is what emojis were missing)
  // Mark emoji as actively selected in STORE
  store.setSelectedEmojiId(id);

  // ✅ match flare behavior:
  // icon mode + library open
  store.setMoveTarget("icon");
  store.setSelectedPanel("icons");

  // ✅ local selection (for UI controls if you have them)
  setSelectedEmojiId(id);
};




  // === PORTRAIT INSTANCES (per-format) ===
type PortraitInst = { id: string; url: string; x: number; y: number; scale: number; locked: boolean };
//type Format = 'square' | 'story';


React.useEffect(() => {
  try { localStorage.setItem('nf:portraitByFormat', JSON.stringify(portraitByFormat)); } catch {}
}, [portraitByFormat]);



  // font family for main details text




  const [detailsAlign, setDetailsAlign] = useState<Align>('left');
  const [venueAlign, setVenueAlign]     = useState<Align>('left');
  const [subtagAlign, setSubtagAlign] = useState<Align>('left');


  // Portrait position/scale
  
  


  // --- keep portrait per-format (square/story) ---
  const portraitByFormatRef = React.useRef<Record<Format, { x: number; y: number; scale: number }>>({
    square: { x: portraitX, y: portraitY, scale: portraitScale },
    story:  { x: portraitX, y: portraitY, scale: portraitScale },
  });
  // ⬇︎ STEP 2: persist portrait for the *current* format
  React.useEffect(() => {
    portraitByFormatRef.current[format] = { x: portraitX, y: portraitY, scale: portraitScale };
  }, [format, portraitX, portraitY, portraitScale]);



  // Keep portrait box size constant across format toggles
 const [portraitBoxW, setPortraitBoxW] = useState<number>(100);
  const [portraitBoxH, setPortraitBoxH] = useState<number>(100);

  



  // Logo position/scale (defaults: left 6%, bottom 6% -> top = 100 - 6 - 14)


  // === LOGO SLOTS (up to 4) ===
  const MAX_LOGO_SLOTS = 4;

  const [logoSlots, setLogoSlots] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('nf:logoSlots');
      if (raw) {
        const arr = JSON.parse(raw);
        // ensure exactly 4 slots
        return Array.from({ length: MAX_LOGO_SLOTS }, (_, i) => arr?.[i] ?? '');
      }
    } catch {}
    return Array(MAX_LOGO_SLOTS).fill('');
  });

// helper that updates state AND localStorage
function persistLogoSlots(next: string[]) {
  const trimmed = next.slice(0, MAX_LOGO_SLOTS);
  setLogoSlots(trimmed);
  try { localStorage.setItem('nf:logoSlots', JSON.stringify(trimmed)); } catch {}
}

function triggerLogoUpload(i: number) {
  pendingLogoSlot.current = i;
  logoSlotPickerRef.current?.click();
}

async function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.currentTarget.value = '';
  const idx = pendingLogoSlot.current;
  pendingLogoSlot.current = null;
  if (!file || idx == null) return;

  try {
    const dataUrl = await IS_fileToDataURL(file); // reuse your existing fileToDataURL
    persistLogoSlots(logoSlots.map((s, i) => (i === idx ? dataUrl : s)));
  } catch (err: any) {
    alert(`Logo upload failed: ${err?.message || err}`);
  }
}



function triggerPortraitSlotUpload(i: number) {
  pendingPortraitSlot.current = i;
  portraitSlotPickerRef.current?.click();
}

// ✅ FIX: Use local AI instead of server API
// ✅ FIX: Keep track of the active slot while processing
async function onPortraitSlotFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.currentTarget.value = ''; // allow re-selecting same file
  
  const idx = pendingPortraitSlot.current;
  // Don't clear pendingPortraitSlot.current yet! We need it for the UI spinner.
  
  if (!file || idx == null) return;

  try {
    setRemovingBg(true);

    // 1. Convert to base64 (reuse existing helper)
    const originalUrl = await blobToDataURL(file);

    // 2. Process locally
    // Note: ensure removeBackgroundLocal is imported/available
    const cutDataUrl = await removeBackgroundLocal(originalUrl);

    // 3. Save to slot
    setPortraitSlots(prev => {
      const next = [...prev];
      next[idx] = cutDataUrl;
      try { localStorage.setItem('nf:portraitSlots', JSON.stringify(next)); } catch {}
      return next;
    });
    persistPortraitSlotSources(
      portraitSlotSources.map((v, i) => (i === idx ? originalUrl : v))
    );
  } catch (err: any) {

    alert(`Remove BG failed: ${err.message}`);
  } finally {
    setRemovingBg(false);
    pendingPortraitSlot.current = null; // ✅ Clear ref only AFTER done
  }
}

function placePortraitFromSlot(i: number) {
  const src = portraitSlots[i];
  if (!src) return;
  setPortraitUrl(src);
  setPortraitLocked(false);
  setMoveMode(true);
  setDragging('portrait');
}

function clearPortraitSlot(i: number) {
  persistPortraitSlots(portraitSlots.map((v, idx) => (idx === i ? '' : v)));
  persistPortraitSlotSources(portraitSlotSources.map((v, idx) => (idx === i ? '' : v)));
}

useEffect(() => {
  try { localStorage.setItem('nf:logoSlots', JSON.stringify(logoSlots)); } catch {}
}, [logoSlots]);

const [logoSlotPickerIdx, setLogoSlotPickerIdx] = useState<number | null>(null);
const logoSlotInputRef = useRef<HTMLInputElement>(null);

function pickLogoForSlot(i: number) {
  setLogoSlotPickerIdx(i);
  logoSlotInputRef.current?.click();
}

function clearLogoSlot(i: number) {
  setLogoSlots(prev => {
    const next = [...prev];
    if (next[i] && next[i] === logoUrl) setLogoUrl(null);
    next[i] = '';
    return next;
  });
}


function addToLogoLibrary(url: string) {
  setLogoLibrary(prev => {
    const next = [url, ...prev.filter(u => u !== url)].slice(0, 60);
    try { localStorage.setItem('nf:logoLibrary', JSON.stringify(next)); } catch {}
    return next;
  });
}

function removeFromLogoLibrary(url: string) {
  setLogoLibrary(prev => {
    const next = prev.filter(u => u !== url);
    try { localStorage.setItem('nf:logoLibrary', JSON.stringify(next)); } catch {}
    return next;
  });
}


  /* text */
  const [details, setDetails] = useState('EVENT DETAILS');
  const [venue, setVenue] = useState('VENUE');
 


  /* headline 2 (secondary) */
  const [head2, setHead2] = useState<string>(''); // empty by default
  const [head2SizePx, setHead2SizePx] = useState<number>(48);
  const [head2Alpha, setHead2Alpha] = React.useState<number>(1);



  // rotations (degrees)
  const [headRotate, setHeadRotate]       = useState<number>(0);
  const [headlineRotate, setHeadlineRotate] = useState(0);
  const [head2Rotate, setHead2Rotate]     = useState<number>(0);
  const [detailsRotate, setDetailsRotate] = useState<number>(0);
  
  const [venueRotate, setVenueRotate]     = useState<number>(0);
  const [subtagRotate, setSubtagRotate]   = useState<number>(0);
  const [logoRotate, setLogoRotate]       = useState<number>(0);
  

// Logo library (persisted in localStorage)
const [logoLibrary, setLogoLibrary] = useState<string[]>(() => {
  try {
    const raw = localStorage.getItem('nf:logoLibrary');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
});


  /* headline 2 styles (independent) */
  const [head2Family, setHead2Family] = useState<string>('Bebas Neue');
  const [head2Align, setHead2Align] = useState<Align>('right');
  const [head2LineHeight, setHead2LineHeight] = useState<number>(0.95);
  const [head2ColWidth, setHead2ColWidth] = useState<number>(56);
  const [head2Fx, setHead2Fx] = useState<TextFx>({
    uppercase: false,
    bold: true,
    italic: false,
    underline: false,
    tracking: 0.01,
    gradient: false,
    gradFrom: '#ffffff',
    gradTo:   '#ffd166',
    color:    '#ffffff',
    strokeWidth: 0,
    strokeColor: '#000000',
    shadow: 0.5,
    glow: 0.15,
    shadowEnabled: true,
  });
  
  


  /* fonts */
const [headlineFamily, setHeadlineFamily] = useState<string>('Aliens Among Us');
const [bodyFamily, setBodyFamily] = useState<string>('Bebas Neue');
const [venueFamily, setVenueFamily] = useState<string>('Bebas Neue');
const [subtagFamily, setSubtagFamily] = useState<string>('Nexa-Heavy');

  const setHeadlineFont = (name: string) => {
  setHeadlineFamily(name);
  };
  // === Cinematic-only font list (must match font-family in globals.css) ===
  const CINEMATIC_FONTS = [
    "African",
    "DIMITRI_",
    "Aliens Among Us",
    "Game Of Squids",
    "Aqilah-JRYXK",
    "EdgeOfTheGalaxyRegular-OVEa6",
    "raidercrusader",
    "Oups",
    "Doctor Glitch",
    "Dear Script (Demo_Font)",
    "edosz",
    "Galaxia Personal Used",
    "Dune_Rise",
    "who asks satan",
    // only if you've declared them in globals.css:
    // "Cinematic Noir",
    // "Cinematic Serif Pro",
  ];



  // Auto-apply Brand Kit once on mount so every new flyer starts branded
 // Auto-apply Brand Kit only after hydration
  useEffect(() => {
  if (!hydrated) return;
  const kit = readBrandKit();
  if (kit) applyBrandKit(kit);
}, [hydrated]);



  /* body styles */
  const [bodySize, setBodySize] = useState<number>(16);
  const [bodyColor, setBodyColor] = useState('#FFFFFF');
  const [bodyUppercase, setBodyUppercase] = useState(true);
  const [bodyBold, setBodyBold] = useState(true);
  const [bodyItalic, setBodyItalic] = useState(false);
  const [bodyUnderline, setBodyUnderline] = useState(false);
  const [bodyTracking, setBodyTracking] = useState(0.04);

  /* venue styles */
  const [venueSize, setVenueSize] = useState<number>(40);
  const [venueColor, setVenueColor] = useState('#FFFFFF');
  const [venueLineHeight, setVenueLineHeight] = useState<number>(1.0);
  const [detailsLineHeight, setDetailsLineHeight] = useState(1.2);
  const [venueUppercase, setVenueUppercase] = useState(true);
  const [venueItalic, setVenueItalic] = useState(false);
  const [venueBold, setVenueBold] = useState(true);


  /* headline styles */
  const [align, setAlign] = useState<Align>('left');
  const [headAlign, setHeadAlign] = useState<Align>('center');

  const [lineHeight, setLineHeight] = useState(0.9);
  // ——— Poster-type refinements
  const [leadTrackDelta, setLeadTrackDelta] = useState(0);   // em delta for first line
  const [lastTrackDelta, setLastTrackDelta] = useState(0);   // em delta for last line
  const [opticalMargin, setOpticalMargin]   = useState(true);
  const [kerningFix, setKerningFix]         = useState(true);
  const [headBehindPortrait, setHeadBehindPortrait] = useState(false);

 
  /* NEW: headline size mode */
  const [headline, setHeadline] = useState('HEADLINE');
  const [headSizeAuto, setHeadSizeAuto] = useState(false);
  const [headManualPx, setHeadManualPx] = useState(format === 'square' ? 84 : 110);
  const [headMaxPx, setHeadMaxPx] = useState<number>(format === 'square' ? 84 : 110);

    /* details 2 */
  const [details2, setDetails2] = useState<string>("");
  const [details2Family, setDetails2Family] = useState<string>("sans-serif");
  const [details2Color, setDetails2Color] = useState<string>("#ffffff");
  const [details2Size, setDetails2Size] = useState<number>(22);
  const [details2LineHeight, setDetails2LineHeight] = useState<number>(1.2);
  const [details2LetterSpacing, setDetails2LetterSpacing] = useState<number>(0);
  const [details2Align, setDetails2Align] = useState<Align>("center");
  const [details2Rotate, setDetails2Rotate] = useState<number>(0);
  const [details2Uppercase, setDetails2Uppercase] = useState(false);
  const [details2Italic, setDetails2Italic] = useState(false);
  const [details2Bold, setDetails2Bold] = useState<boolean>(false);
  const [details2Underline, setDetails2Underline] = useState<boolean>(false);



  const [textColWidth, setTextColWidth] = useState(56);
  const [tallHeadline] = useState(true);
  const [textSide, setTextSide] = useState<TextSide>('left');
  const [textFx, setTextFx] = useState<TextFx>({
  uppercase: true,
  bold: true,
  italic: false,
  underline: false,

  tracking: 0.02,

  // defaults you wanted
  gradient: false,            // OFF on load
  gradFrom: '#ffffff',
  gradTo:   '#ffd166',
  color:    '#ffffff',        // fill used when gradient is OFF

  strokeWidth: 0,             // 0 on load
  strokeColor: '#000000',

  shadow: 0.6,
  glow: 0.2,
  shadowEnabled: true, // <— ADD THIS
});


  /* subtag */
  //const [subtagEnabled, setSubtagEnabled] = useState(true);
  const [subtag, setSubtag] = useState('headline sub text here');
  const [subtagBgColor, setSubtagBgColor] = useState('#E23B2E');
  const [subtagTextColor, setSubtagTextColor] = useState('#FFFFFF');
  const [subtagAlpha, setSubtagAlpha] = useState(0.85);
  const [subtagUppercase, setSubtagUppercase] = useState(true);
  /** NEW: subtag text styles */
  const [subtagBold, setSubtagBold] = useState(true);
  const [subtagItalic, setSubtagItalic] = useState(false);
  const [subtagUnderline, setSubtagUnderline] = useState(false);
  // NEW: subtag size (px)
  const [subtagSize, setSubtagSize] = useState<number>(20);

 // === AUTO-LOAD LOCAL FONTS WHEN SELECTED =============================
  useEffect(() => { ensureFontLoaded(bodyFamily); }, [bodyFamily]);
  useEffect(() => { ensureFontLoaded(venueFamily); }, [venueFamily]);
  useEffect(() => { ensureFontLoaded(subtagFamily); }, [subtagFamily]);
  useEffect(() => { ensureFontLoaded(head2Family); }, [head2Family]);
 


  
  /* media */
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgUploadUrl, setBgUploadUrl] = useState<string | null>(null);
  // === PORTRAIT NATURAL SIZE + BASE BOX (tight hug) ===
  const [pNatW, setPNatW] = useState<number | null>(null);
  const [pNatH, setPNatH] = useState<number | null>(null);

  // Base portrait box (percent of canvas) derived *every render*
  // Keeps the dotted frame hugging the image in both square/story.
 const { baseW, baseH } = React.useMemo(() => {
  if (!pNatW || !pNatH) {
    return {
      baseW: 100,
      baseH: 100,
    };
  }
  const r = pNatW / pNatH;
  const maxW = 100;
  const maxH = 100;
  const maxR = maxW / maxH;

  return r >= maxR
    ? { baseW: maxW,      baseH: maxW / r }
    : { baseW: maxH * r,  baseH: maxH     };
}, [format, pNatW, pNatH]);

  // === /PORTRAIT NATURAL SIZE + BASE BOX ===


  // Persistent copies (always data: URLs) — used for saving/restoring
  const [portraitDataUrl, setPortraitDataUrl] = useState<string | null>(null);
  const [bgDataUrl,        setBgDataUrl]      = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // —— PORTRAIT BOX (canvas-independent; pixels) ——
  //const [pBoxWpx, setPBoxWpx] = useState<number>(0);
  //const [pBoxHpx, setPBoxHpx] = useState<number>(0);
  const [portraitXpx, setPortraitXpx] = useState<number>(0);
  const [portraitYpx, setPortraitYpx] = useState<number>(0);

  const [overlayLeft, setOverlayLeft] = useState(0);
  const [overlayTop, setOverlayTop] = useState(0);


  // Guard: if Story is selected but there is no background, force Square.
  // Also allows Story automatically once a background exists.
  useEffect(() => {
  const has = !!(bgUploadUrl || bgUrl);
  if (!has && format === 'story') setFormat('square');
  }, [bgUploadUrl, bgUrl, format]); 

  /* bg fx */
  const [vignette, setVignette] = useState(false);
  const [vignetteStrength, setVignetteStrength] = useState(0.1);
  const [haze, setHaze] = useState(0.5);
  const [grade, setGrade] = useState(0.35);  // overall color grade (0–1)
  const [leak, setLeak]   = useState(0.25);  // light leaks intensity (0–1)
  const [hue, setHue] = useState(0);
  const [bgScale, setBgScale] = useState(1.0);
  const [bgX, setBgX] = useState(50);
  const [bgY, setBgY] = useState(50);
  const [bgPosX, setBgPosX] = useState(50);
  const [bgPosY, setBgPosY] = useState(50);
  const [bgBlur, setBgBlur] = useState(0);
  const [textureOpacity, setTextureOpacity] = useState(0);

  /* master grade (applies to whole poster) */
  const [exp,       setExp]       = useState<number>(1.00); // brightness/exposure (0.7–1.4)
  const [contrast,  setContrast]  = useState<number>(1.08); // 0.7–1.5
  const [saturation,setSaturation]= useState<number>(1.10); // 0.6–1.6
  const [warmth,    setWarmth]    = useState<number>(0.10); // 0..1 => sepia-ish warmth
  const [tint,      setTint]      = useState<number>(0.00); // -1..1 => green↔magenta via hue rotate
  const [gamma,     setGamma]     = useState<number>(1.00); // 0.7–1.5 (implemented with a CSS trick)
  const [grain,     setGrain]     = useState<number>(0.15); // 0..1 film grain overlay
  const [vibrance,  setVibrance]  = useState<number>(0.15); // 0..1 vibrance lift
  const [filmGrade, setFilmGrade] = useState<number>(0.6);  // 0..1 curves blend strength

    // compose a CSS filter string for master pass
    const masterFilter = React.useMemo(() => {
    // gamma hack: approximate with contrast+brightness combo
    const g = Math.max(0.5, Math.min(1.5, gamma));
    const gammaContrast = 0.9 + (g - 1) * 0.9; // small curve
    const gammaBrightness = 1.0 + (g - 1) * 0.6;

    // tint: map [-1..1] to hue-rotate [-12deg .. +12deg]
    const hueTint = (Number.isFinite(tint) ? Math.max(-1, Math.min(1, tint)) : 0) * 12;

    // warmth: sepia from 0..1
    const sep = Math.max(0, Math.min(1, warmth));

    return [
      `brightness(${(exp * gammaBrightness).toFixed(3)})`,
      `contrast(${(contrast * gammaContrast).toFixed(3)})`,
      `saturate(${(saturation + vibrance * 0.8).toFixed(3)})`,
      `sepia(${sep.toFixed(3)})`,
      `hue-rotate(${(hue + hueTint).toFixed(3)}deg)`,
    ].join(' ');
  }, [exp, contrast, saturation, warmth, hue, tint, gamma, vibrance]);

const [isMobileView, setIsMobileView] = React.useState(
  typeof window !== "undefined" && window.innerWidth < 1024
);

  const masterFilterCss = React.useMemo(() => {
    const base = masterFilter;
    return isMobileView ? base : `url(#master-grade) ${base}`;
  }, [isMobileView, masterFilter]);

  // film grain as an overlay (works with html-to-image)
  const grainStyle: React.CSSProperties = React.useMemo(() => ({
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity: Math.max(0, Math.min(1, grain)) * 0.35, // soften
    mixBlendMode: 'overlay',
    backgroundImage:
      'url("data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
           <filter id='n'>
             <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
             <feColorMatrix type='saturate' values='0'/>
           </filter>
           <rect width='100%' height='100%' filter='url(%23n)' opacity='0.50'/>
         </svg>`
      ) +
      '")',
    backgroundSize: '200px 200px',
  }), [grain]);



  /* guides / move */
  const [showGuides, setShowGuides] = useState(false);
  const [showFaceGuide, setShowFaceGuide] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [snap, setSnap] = useState(true);

  // === SELECT HELPERS (do not move) ===
 const selectPortrait = (target: MoveTarget = 'portrait') => {
  setMoveMode(true);
  setDragging(target);
};

const selectIcon = () => {
  setMoveMode(true);
  setDragging("icon");
};

const clearSelection = (e?: any) => {


  // ✅ If the click came from the sidebar/UI or from a canvas item, DO NOTHING.
  if (e && e.isTrusted) {
    const el = e.target as HTMLElement;

    const isUiClick =
      el?.closest(".panel") ||
      el?.closest("aside") ||
      el?.closest("button") ||
      el?.closest(".fixed") ||
      el?.closest('[data-portrait-area="true"]') ||
      el?.closest("#portrait-layer-root") ||
      el?.closest("#emoji-layer-root");



    // ✅ EARLY RETURN: do not clear selections on UI/canvas-layer clicks
    if (isUiClick) return;
  }

  // ✅ only runs for true “blank canvas” clicks


  setMoveMode(false);
  setDragging(null as any);

  useFlyerState.getState().setSelectedPanel(null);
  useFlyerState.getState().setSelectedEmojiId(null);
  useFlyerState.getState().setSelectedPortraitId(null);

  setSelectedEmojiId(null);
  setSelIconId(null);
  setSelShapeId(null);
};



  // === /SELECT HELPERS ===

  // Clear portrait selection on any outside click (works even if other layers stopPropagation)
// Clear portrait selection on any outside click (works even if other layers stopPropagation)
 useEffect(() => {
    const onDown = (e: MouseEvent) => {
      // ✅ FIX: If it's not a real user click (e.g. triggered by code/vibe change), STOP.
      if (!e.isTrusted) return;

      if (e.button !== 0) return;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      
      // If clicking inside the portrait/canvas area, don't clear
      if (el.closest('[data-portrait-area="true"]')) return;
      
      clearSelection(e); 
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, []);

    // ===== PERSIST LAYOUT PER FORMAT (square/story) =====
    useEffect(() => {
   if (!pNatW || !pNatH) return; // wait until we know natural image size
const r = pNatW / pNatH;

const maxW = 100;
const maxH = 100;
const maxR = maxW / maxH;


    if (r >= maxR) {
      setPBaseW(maxW);
      setPBaseH(maxW / r);
    } else {
      setPBaseH(maxH);
      setPBaseW(maxH * r);
    }
  }, [format, pNatW, pNatH]);

   type Layout = {
    headX: number; headY: number;
    head2X: number; head2Y: number;
    detailsX: number; detailsY: number;
    details2X: number; details2Y: number;
    venueX: number; venueY: number;
    subtagX: number; subtagY: number;

    // % based (legacy) — keep for anything still using %:
    portraitX: number; portraitY: number; portraitScale: number;

    // NEW: px-based portrait box (canvas-independent)
    portraitXpx: number; portraitYpx: number;
    pBoxWpx: number;     pBoxHpx: number;

    logoX: number; logoY: number; logoScale: number;
    bgPosX: number; bgPosY: number;
  };


    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const normDeg = (n: number) => ((n % 360) + 360) % 360;
    const VBLEED = 12;   // how far user can move/scale beyond each edge (in %)
    const HANDLE_PAD = 2;
    const BLEED = 12; // % bleed allowance, keep same as your VBLEED

   function getBaseDims(fmt: Format) {
 if (!pNatW || !pNatH) {
  return { bw: 100, bh: 100 };
}

const r = pNatW / pNatH;

const maxW = 100;
const maxH = 100;

  const maxR = maxW / maxH;
  return (r >= maxR)
    ? { bw: maxW,      bh: maxW / r }
    : { bw: maxH * r,  bh: maxH     };
}

function fitPortraitToCanvas(fmt: Format, x: number, y: number, scale: number) {
  const { bw, bh } = getBaseDims(fmt);

  const clampedScale = Math.max(0.5, Math.min(4.0, scale));
  const effW = bw * clampedScale;
  const effH = bh * clampedScale;

  const bleed = (typeof VBLEED === 'number' && isFinite(VBLEED)) ? VBLEED : 12;
  const minX = -bleed;
  const minY = -bleed;
  const maxX = 100 - effW + bleed;
  const maxY = 100 - effH + bleed;

  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
    scale: clampedScale,
  };
}





    /** Normalize a portrait box when moving between formats (soft cap scale) */
    function normalizePortraitFor(fmt: Format, px: number, py: number, ps: number) {
    const w = 100;
    const h = 100;


      const x = clamp(px, 0, 100 - w);
      const y = clamp(py, 0, 100 - h);
      const s = Math.min(ps, 1.5);

      return { x, y, s };
    }

    /** Central store: a layout per format */
 const [layoutByFormat, setLayoutByFormat] =
  React.useState<Record<Format, Layout>>({
    square: {
      headX, headY, head2X, head2Y,
      detailsX, detailsY, details2X, details2Y,
      venueX, venueY, subtagX, subtagY,

      portraitX, portraitY, portraitScale,
      portraitXpx, portraitYpx,

      // REQUIRED FIELDS
      pBoxWpx: 0,
      pBoxHpx: 0,

      logoX, logoY, logoScale,
      bgPosX, bgPosY,
    },

    story: {
      headX, headY, head2X, head2Y,
      detailsX, detailsY, details2X, details2Y,
      venueX, venueY, subtagX, subtagY,

      portraitX, portraitY, portraitScale,
      portraitXpx, portraitYpx,

      // REQUIRED FIELDS
      pBoxWpx: 0,
      pBoxHpx: 0,

      logoX, logoY, logoScale,
      bgPosX, bgPosY,
    },
  });


    /** Switch formats:
     *  1) pre-apply a safe portrait for the target format so the user doesn’t see a jump
     *  2) set the format — the effect below will apply the full saved layout
     */
   // replacement: restore saved portrait for target format, then switch formats
   function computePortraitBaseFor(fmt: Format) {
  if (pNatW == null || pNatH == null) return; // only if we know the natural size

  const r = pNatW / pNatH;

  const maxW = 100;
  const maxH = 100;
  const maxR = maxW / maxH;

  if (r >= maxR) {
    setPBaseW(maxW);
    setPBaseH(maxW / r);
  } else {
    setPBaseH(maxH);
    setPBaseW(maxH * r);
  }
}

      // Fit to canvas on load: effective size (base * scale) must stay within 100% x 100%
  // Use the local base sizes we just derived (not the async state).
  
  

// ==== FORMAT SWITCH (REPLACE) ================================================
// ✅ Unified switchFormat: preserves portrait + re-applies template variant
const switchFormat = React.useCallback((next: Format) => {
  if (next === format) return;

  // mark this as an intentional toggle so we don't "re-clamp" later
  isSwitchingFormatRef.current = true;

  // save current portrait into cache for the CURRENT format
  portraitCacheRef.current[format] = {
    url: portraitUrl,
    x: portraitX,
    y: portraitY,
    scale: portraitScale,
    locked: portraitLocked,
  };

  // === NEW LOGIC: if a template is active, apply its layout variant ===
  const tpl = templateId
    ? TEMPLATE_GALLERY.find(t => t.id === templateId)
    : null;

  // switch format first
  setFormat(next);

  // after format state updates, reapply template variant (layout positions)
  if (tpl) {
    
    // delay slightly to ensure React state commits before reapplying
    setTimeout(() => {
      applyTemplate(tpl, { targetFormat: next });
    }, 10);
  }

}, [
  format,
  portraitUrl,
  portraitX,
  portraitY,
  portraitScale,
  portraitLocked,
  templateId,
]);

// Re-apply template bgScale after bg image swaps (mobile load timing).
React.useEffect(() => {
  if (templateBgScaleRef.current !== null && templateBgScaleRef.current !== undefined) {
    setBgScale(templateBgScaleRef.current);
  } else {
    setBgScale(1.3);
  }
}, [bgUrl, bgUploadUrl, format]);


// ============================================================================



// === LIVE-DRAG GATE (smooth dragging; pause heavy effects/autosave while dragging) ===
React.useEffect(() => {
  const up = () => {
    useFlyerState.getState().setIsLiveDragging(false);
  };

  window.addEventListener('mouseup', up);
  window.addEventListener('touchend', up);

  return () => {
    window.removeEventListener('mouseup', up);
    window.removeEventListener('touchend', up);
  };
}, []);

// === /LIVE-DRAG GATE ===

  /* export */
  const [exportType, setExportType] = useState<'png'|'jpg'>('png');
  const [exportScale, setExportScale] = useState(2); // allow control
  const [designName, setDesignName] = useState('');
  const [hideUiForExport, setHideUiForExport] = useState<boolean>(false);
  const [viewport, setViewport] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const canvasSize = React.useMemo(
    () => (format === "square" ? { w: 540, h: 540 } : { w: 540, h: 960 }),
    [format]
  );
  const canvasScale = React.useMemo(() => {
    if (!viewport.w || !viewport.h) return 1;
    const maxW = Math.max(320, viewport.w - 16);
    const maxH = Math.max(320, viewport.h - 220);
    return Math.min(1, maxW / canvasSize.w, maxH / canvasSize.h);
  }, [viewport.w, viewport.h, canvasSize.w, canvasSize.h]);
  const scaledCanvasW = Math.round(canvasSize.w * canvasScale);
  const scaledCanvasH = Math.round(canvasSize.h * canvasScale);


  
  const saveDebounce = useRef<number | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<string>('');
  type ArtboardHandle = HTMLDivElement & {
    exportBackgroundDataUrl?: (opts: { size: number }) => Promise<string | null>;
  };
  const artRef = useRef<ArtboardHandle | null>(null);
  const artWrapRef = useRef<HTMLDivElement>(null);
  // Put this near your other refs:
  const logoPanelRef = React.useRef<HTMLDivElement | null>(null);

  // PORTRAIT: direct-drag ref (for smooth RAF dragging)
  const portraitFrameRef = React.useRef<HTMLDivElement | null>(null);

  function storeRendered3DToLogoSlotsAndOpen(url: string) {
  // 1) Put into the first empty logo slot (or overwrite slot 0 if all full)
  setLogoSlots((prev) => {
    const next = Array.isArray(prev) ? [...prev] : ["", "", "", ""];
    let idx = next.findIndex((s) => !s);
    if (idx === -1) idx = 0;
    next[idx] = url;

    try {
      localStorage.setItem("nf:logoSlots", JSON.stringify(next));
    } catch {}

    return next;
  });

  // 2) Open the Logo/3D panel (IMPORTANT: use the GLOBAL store)
  useFlyerState.getState().setSelectedPanel("media");

  // 3) Scroll the Logo panel into view (optional but nice)
  setTimeout(() => {
    logoPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}
function clearAllSelections() {
  const store = useFlyerState.getState();

  // ✅ Store-backed selection
  store.setSelectedPortraitId(null);
  store.setDragging(null);

  // ✅ Local React state selections (these are NOT in Zustand FlyerState)
  setSelectedEmojiId(null);
  
}



  // ===== EXPORT HELPERS: FONTS (INLINE GOOGLE FONTS INTO EXPORT NODE) =====
async function injectGoogleFontsForExport(hostEl: HTMLElement, families: string[]) {
  const uniq = Array.from(new Set(families.filter(Boolean)));
  if (uniq.length === 0) return () => {};

  const params = uniq
    .map((f) => 'family=' + encodeURIComponent(f) + ':wght@300;400;500;600;700;800;900')
    .join('&');
  const cssUrl = `https://fonts.googleapis.com/css2?${params}&display=swap`;

  let css = '';
  try {
    const res = await fetch(cssUrl, { mode: 'cors' });
    css = await res.text();
    // ensure absolute URLs for gstatic fonts
    css = css.replace(/url\(([^)]+)\)/g, (_m, u) => {
      const s = String(u).replace(/['"]/g, '').trim();
      if (s.startsWith('https://')) return `url(${s})`;
      if (s.startsWith('//')) return `url(https:${s})`;
      return `url(https://fonts.gstatic.com/${s.replace(/^\/+/, '')})`;
    });
  } catch {
    // ignore; we’ll try to rely on already-loaded fonts
  }

  const styleTag = document.createElement('style');
  styleTag.setAttribute('data-export-fonts', 'true');
  styleTag.textContent = css;
  // inject as FIRST child so it's available inside the cloned subtree
  hostEl.prepend(styleTag);

  // proactively load faces so snapshot uses them
  try {
    await Promise.all(uniq.map((f) => document.fonts.load(`700 48px "${f}"`)));
    await (document as any).fonts.ready;
  } catch {
    // best-effort
  }

  return () => {
    try { styleTag.remove(); } catch {}
  };
}


  const [shapes, setShapes] = useState<Shape[]>([]);
  const deleteShape = (id: string) => {
  setShapes(list => list.filter(s => s.id !== id));
  setSelShapeId(prev => (prev === id ? null : prev));
};

  const [selIconId, setSelIconId] = useState<string | null>(null);
  const [iconList, setIconList] = useState<Icon[]>([]);



  /* AI background state */
  const [genStyle, setGenStyle] = useState<GenStyle>('urban');
  const [genPrompt, setGenPrompt] = useState('close-up portrait on the side, cinematic light, room for bold text');
  const [genProvider, setGenProvider] = useState<'auto' | 'nano' | 'openai'>('auto');
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string>('');
  const [isPlaceholder, setIsPlaceholder] = useState<boolean>(false);
  const [variety, setVariety] = useState<number>(3);
  const [lockVar, setLockVar] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(0);
  const [clarity, setClarity] = useState(0.15);
  const [presetKey, setPresetKey] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('none');
  const [energyLevel, setEnergyLevel] = useState<number>(3);


 // --- B. DEFINE SUBJECTS (Updated with "Party People") ---
      const SUBJECTS = [
        // --- CROWDS (WIDE SHOTS) ---
        { 
          key: 'party_crowd', type: 'crowd', label: 'Party People', 
          demographics: ['neon', 'urban', 'tropical', 'vintage'], 
          prompt: 'Diverse group of friends dancing and laughing, holding red cups and drinks, candid snapshot, authentic happiness, chaotic fun energy, movement blur, flash photography vibe, casual party attire' 
        },
        { 
          key: 'crowd', type: 'crowd', label: 'Raging Crowd', 
          demographics: ['neon', 'urban', 'tropical', 'vintage'], 
          prompt: 'POV from the mosh pit, chaos and euphoria, hundreds of hands reaching up, confetti raining down, blurry faces screaming in joy, camera flash lighting, raw authentic rave energy, sweat and haze' 
        },
        { 
          key: 'dancers', type: 'crowd', label: 'Club Dancers', 
          demographics: ['neon', 'urban'], 
          prompt: 'Silhouettes of go-go dancers on podiums, hair whipping in motion blur, backlit by blinding strobe lights, high contrast, mysterious and energetic club atmosphere' 
        },

        // --- SINGLES (PORTRAITS) ---
        { key: 'dj', type: 'single', label: 'Festival DJ', demographics: ['neon'], prompt: 'Headliner DJ screaming in euphoria, hands raised high for the drop, sweat on brow, futuristic shield sunglasses, backlit by massive exploding cryo-jets' },
        { key: 'hiphop_dj', type: 'single', label: 'Hip-Hop DJ', demographics: ['urban'], prompt: 'Legendary turntablist scratching on Technics 1200s, intense focus, smoke swirling around cap, low angle hero shot, authentic underground club grit' },
        { key: 'rapper', type: 'single', label: 'Rapper', demographics: ['urban'], prompt: 'Rapper clutching microphone, veins showing, aggressive energetic delivery, heavy jewelry catching the strobe light, raw motion blur hand gesture, spitting bars' },
        { key: 'singer', type: 'single', label: 'Soul Singer', demographics: ['vintage'], prompt: 'Elegant jazz singer in a sequined evening gown, singing into a vintage chrome ribbon microphone, eyes closed in emotion, soft spotlight, velvet curtain background' },
        { key: 'fashion', type: 'single', label: 'High Fashion', demographics: ['vintage', 'urban'], prompt: 'Editorial fashion model leaning against a textured wall, aloof cool expression, wearing haute couture, flash photography style, cinematic shadow, vogue magazine aesthetic' },
        { key: 'latin_performer', type: 'single', label: 'Salsa Dancer', demographics: ['tropical'], prompt: 'Salsa dancer mid-spin, fabric of red dress flowing in motion blur, passionate expression, warm golden backlight, festive energy' },
        { key: 'afro_artist', type: 'single', label: 'Afrobeat Artist', demographics: ['tropical'], prompt: 'Afrobeat performer dancing with pure joy, bright patterned shirt, holding a drink, sunset rooftop party vibe, warm amber lighting' },
        { key: 'kpop_idol', type: 'single', label: 'Pop Idol', demographics: ['neon'], prompt: 'K-Pop idol mid-choreography, perfect styling, tech-wear fashion, glowing skin, confident cool expression, sharp focus, music video aesthetic' },

        // --- EMPTY ---
        { key: 'empty_stage', type: 'empty', label: 'Empty Space', demographics: ['neon'], prompt: 'empty architectural space, interesting texture and lighting, no people, negative space for text' },
        { key: 'none', type: 'empty', label: 'Just Vibe', demographics: ['neon'], prompt: '' },
      ];



const deleteIcon = (id: string) => {
  setIconList(list => list.filter(i => i.id !== id));
  setSelIconId(prev => (prev === id ? null : prev));
};


function removeFromPortraitLibrary(src: string) {
  setPortraitLibrary(prev => prev.filter(s => s !== src));
}
// === PATCH: PORTRAIT LIBRARY — HELPERS (END) ===

  
  useEffect(() => {
  if (moveTarget !== 'icon') setSelIconId(null);
}, [moveTarget]);

  const handleSelectIcon = (id: string) => {
    setSelIconId(id);
    // ✅ FIX: Auto-open icons panel when an icon is clicked
    useFlyerState.getState().setMoveTarget('icon');
    useFlyerState.getState().setSelectedPanel('icons');
  };

  // ✅ NEW: Handles ADDING items from the Library (Flares/Shapes)
 // ✅ FIX: Smart Handler (Flares -> Portraits, Shapes -> Icons)
 const handleAddLibraryItem = (item: any) => {
  let payload = item;
  let isFlare = false;

  // 1. Analyze the input
  if (typeof item === "string") {
    // If it looks like an image URL, treat as Flare
    if (item.match(/\.(png|jpg|jpeg|webp|gif)|data:image/i) || item.includes("flare")) {
      isFlare = true;
      payload = { url: item };
    } else {
      // Otherwise treat as SVG path
      payload = { path: item };
    }
  } else if (item?.url) {
    isFlare = true;
  }

  const store = useFlyerState.getState();

  // 2. ROUTING LOGIC
  if (isFlare) {
    // 🔥 CASE A: It's a Flare -> Add to PORTRAITS state (flagged)
    const newFlare = {
      id: crypto.randomUUID(),
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      isFlare: true,        // 👈 key flag
      blendMode: "screen",  // 👈 default blend
      locked: false,
      ...payload,
    };

    store.addPortrait(format, newFlare);

    // ✅ IMPORTANT: select + route to ICON controls (NOT portrait)
    store.setSelectedPortraitId(newFlare.id);
    store.setSelectedPanel("icons");
    store.setMoveTarget("icon");


  } else {
    // 🔷 CASE B: It's a Shape -> Add to ICONS state
    const newIcon = {
      id: crypto.randomUUID(),
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      color: "#ffffff",
      type: "shape",
      ...payload,
    };

    setIconList((prev) => [...prev, newIcon]);

    // ✅ keep user in ICONS mode after adding shapes too
    store.setSelectedPanel("icons");
    store.setMoveTarget("icon");


  }
};


// helper to patch a single icon by id
const updateIcon = (id: string, patch: Partial<Icon>) => {
  setIconList(list => list.map(i => (i.id === id ? { ...i, ...patch } : i)));
};

// single move handler used by <Artboard />
const handleIconMove = (id: string, x: number, y: number) => {
  if (id === 'portrait') {
    if (portraitLocked) return;
    const p = fitPortraitToCanvas(format, x, y, portraitScale);
    setPortraitX(p.x); setPortraitY(p.y);
    return;
  }
  if (isLocked('icon', id)) return;
  updateIcon(id, { x, y });
};


const onIconResize = (id: string, size: number) => {
  if (isLocked('icon', id)) return;
  setIconList(list =>
    list.map(i =>
      i.id === id ? { ...i, size: Math.max(2, Math.min(120, size)) } : i
    )
  );
};
// General add-by-key (centered)
const addIconByKey = React.useCallback((key: string) => {
  const libItem = ICON_LIBRARY.find(i => i.key === key);
  if (!libItem) return;

  const icon = createIconFromLibrary(libItem);
  // drop it and enter icon move mode
  setIconList(list => [...list, icon]);
  setMoveMode(true);
  setDragging('icon');
  setSelIconId(icon.id);
}, []);

// Keep your hotkey working:
const addHookahIcon = React.useCallback(() => addIconByKey('hookah'), [addIconByKey]);





  // ==== LOCK STATE (shapes & icons) ====
const [lockedIds, setLockedIds] = useState<{ shape: Set<string>; icon: Set<string>; portrait: Set<string> }>({
  shape: new Set(),
  icon: new Set(),
  portrait: new Set(),
});


const isLocked = (t: 'shape' | 'icon', id: string) =>
  id === 'portrait' ? portraitLocked : lockedIds[t].has(id);
const onToggleLock = (t: 'shape' | 'icon', id: string) => {
  setLockedIds(prev => {
  // preserve ALL keys and re-clone the two we might mutate
  const next = {
    ...prev,
    shape: new Set(prev.shape),
    icon: new Set(prev.icon),
  };
  const set = t === 'shape' ? next.shape : next.icon;
  if (set.has(id)) set.delete(id); else set.add(id);
  return next;
});

};

  // Keep track of which shape you're editing
  const [selShapeId, setSelShapeId] = useState<string | null>(null);
  const randomPreset = React.useCallback(() => {
  const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];

  
  setPresetKey(p.key);
  setGenStyle(p.style);
  setGenPrompt(p.prompt);

}, []);

const [allowPeople, setAllowPeople] = useState(false); // default OFF

// If people are off but the default prompt mentions “portrait”, use a safer default:
useEffect(() => {
  if (!allowPeople && /portrait|person|model|subject/i.test(genPrompt)) {
    setGenPrompt('stylish nightlife background with clean negative space for bold typography');
  }
}, [allowPeople]); 



  // GOD MODE controls
  const [genCount, setGenCount] = useState<1 | 2 | 4>(1);          // how many images to render
  const [genSize, setGenSize]   = useState<'1080' | '2160' | '3840'>('2160'); // render resolution hint
  const [genCandidates, setGenCandidates] = useState<string[]>([]); // b64/url of batch results


  useEffect(() => { setSeed(Math.floor(Math.random() * 1e9)); }, []);
  // Allow forcing a different format for the prompt (we'll use 'story' for portrait-first capture)
 const buildFinalPrompt = (seedForThisRun: number, fmtOverride?: Format) =>
  buildDiversifiedPrompt(genStyle, genPrompt, fmtOverride ?? format, textSide, variety, seedForThisRun, allowPeople);



  const onRandom = React.useCallback(() => {
  // shuffle style
  const styles: GenStyle[] = ['urban', 'neon', 'vintage', 'tropical'];
  setGenStyle(prev => {
    let next = styles[Math.floor(Math.random() * styles.length)];
    if (next === prev) next = styles[(styles.indexOf(prev) + 1) % styles.length];
    return next;
  });



  // nudge diversity 0–6
  setVariety(v => (v + 1) % 7);

  // fresh seed
  setSeed(Math.floor(Math.random() * 1e9));

  // small prompt remix (optional, safe)
  setGenPrompt(p => p.trim() ? p : 'close-up portrait on the side, cinematic light, room for bold text');
}, []);

    async function blobToDataURL(b: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(b);
    });
  }

  const handleFile = (file: File, setter: (url: string) => void) => {
    const r = new FileReader();
    r.onload = () => { setter(String(r.result)); };
    r.readAsDataURL(file);
  };
  // simple background file handler for the right panel
const onBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0];
  if (!f) return;
  handleFile(f, (url) => {
    setBgUploadUrl(url);
    setBgUrl(null);       // prefer the uploaded data URL
    setFormat('square');  // ensure square works even with no story bg yet
  });
  e.currentTarget.value = '';
};


// === FULL GENERATE BACKGROUND FUNCTION (Updated: Party People Subject) ===
const generateBackground = async (opts: GenOpts = {}) => {
  // 1. Credit Check
  const willConsume = true;
  if (willConsume && credits <= 0) {
    if (!(bgUploadUrl || bgUrl)) {
      setBgUploadUrl(FALLBACK_BG); setBgUrl(null);
      setIsPlaceholder(true);
      setGenError('No credits left — showing fallback.');
    } else {
      setGenError('No credits left.');
    }
    return;
  }

  try {
    setGenLoading(true);
    setGenError('');
    setGenCandidates([]);

    // 2. Config & Seed
    const requestedFormat = opts.formatOverride ?? format;
    const baseSeed = lockVar ? seed : Math.floor(Math.random() * 1e9);
    if (!lockVar) setSeed(baseSeed);

    const provider = (genProvider === 'auto' ? 'auto' : genProvider);
    const styleForThisRun = opts.style ?? genStyle;
    
    // 3. The Generator
    const makeOne = async (s: number): Promise<string> => {
      
      // --- A. MOOD & ATMOSPHERE ---
      const genreMood = {
        neon: 'electric rave energy, futuristic colors, lasers, smoke, confetti, metallic shine',
        urban: 'gritty street club, moody lighting, graffiti textures, hip-hop confidence',
        tropical: 'warm sunset tones, palm silhouettes, rooftop ambience, summer nightlife',
        vintage: 'film grain disco, retro outfits, nostalgic glam lighting',
      }[styleForThisRun] ?? '';

     

      // --- C. LOGIC BRANCHING ---
      let subjectPrompt = '';
      let cameraSpec = '';
      let compositionRule = '';
      let negativePrompt = '';
      let qualityBooster = '';

      if (allowPeople) {
         let subObj = SUBJECTS.find(subj => subj.key === selectedSubject);
         // Fallback logic if subject not found
         if (!subObj || subObj.key === 'none') {
            // Default to "Party People" if style is ambiguous, otherwise specific defaults
            if (styleForThisRun === 'tropical') subObj = SUBJECTS.find(s => s.key === 'party_crowd');
            else if (styleForThisRun === 'neon') subObj = SUBJECTS.find(s => s.key === 'dj');
            else if (styleForThisRun === 'urban') subObj = SUBJECTS.find(s => s.key === 'rapper');
            else subObj = SUBJECTS.find(s => s.key === 'fashion');
         }

         if (subObj?.type === 'crowd') {
            // [CROWD LOGIC]
            subjectPrompt = subObj.prompt;
            
            // Camera: Action Cam / Flash / 35mm
            cameraSpec = 'shot on 35mm film, direct flash photography, motion blur, fisheye lens distortion, candid snapshot, grainy texture';
            
            // Composition: Wide & Full
            compositionRule = requestedFormat === 'story'
               ? 'crowd filling the bottom half, massive ceiling height, negative space at top'
               : 'immersive wide angle view from inside the crowd';
            
            qualityBooster = 'high contrast, vibrant colors, authentic look, raw vibe, chaotic energy';
            negativePrompt = '|| static, posing, studio lighting, clean, smooth skin, 3d render, plastic, mannequin, boring, empty';

         } else {
            // [SINGLE SUBJECT LOGIC]
            subjectPrompt = subObj?.prompt || 'cinematic portrait';
            cameraSpec = 'portrait 85mm lens f/1.4, shallow depth of field, sharp focus on eyes, bokeh background';
            
            const side = textSide === 'left' ? 'right' : 'left';
            compositionRule = `subject anchored on the ${side} side, negative space on the ${textSide}`;
            qualityBooster = '8k resolution, highly detailed, photorealistic, perfect skin texture, cinematic lighting, unreal engine 5 style';
            negativePrompt = '|| low quality, blurry, text, watermark, signature, ugly, deformed, extra limbs, cartoon, painting, crowd, extra people';
         }

      } else {
         // [EMPTY LOGIC]
         subjectPrompt = 'no people, empty architectural space, background texture only';
         cameraSpec = 'wide angle architectural photography';
         compositionRule = `wide open negative space on the ${textSide} side`;
         qualityBooster = '8k resolution, highly detailed, photorealistic';
         negativePrompt = '|| people, person, face, silhouette, crowd, man, woman, body, text, watermark';
      }

      // --- D. RANDOMIZED DETAILS ---
      const S = STYLE_DB[styleForThisRun];
      const rng = mulberry32(s);
      const details = pickN([...S.locations, ...S.lighting, ...S.micro], 4, rng).join(', ');

      // --- E. FINAL ASSEMBLY ---
      const finalPromptList = [
        PRESETS.find(p => p.key === presetKey)?.prompt ?? '',
        (opts.prompt || genPrompt || '').trim(),
        subjectPrompt,
        genreMood,
        details,
        cameraSpec,
        compositionRule,
        qualityBooster,
        negativePrompt
      ];

      const finalPromptString = finalPromptList.filter(Boolean).join(', ');

      // --- F. EXECUTE ---
      const body = {
        prompt: finalPromptString,
        format: requestedFormat,
        provider,
        sampler: "DPM++ 2M Karras",
        // Lower scale for crowds allows for more natural "messiness"
        cfgScale: (allowPeople && (selectedSubject === 'crowd' || selectedSubject === 'party_crowd')) ? 5.5 : 6.5,
        steps: 30,
        refiner: true,
        hiresFix: true,
        denoiseStrength: 0.3,
      };

      const res = await fetch('/api/gen-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      if (j?.b64) return `data:image/png;base64,${j.b64}`;
      if (j?.url) return j.url;
      if (j?.placeholder) return j.placeholder;
      throw new Error('No image data returned');
    };

    // 4. Batch & State
    const seeds = (genCount === 1) ? [baseSeed] : Array.from({ length: genCount }, (_, i) => baseSeed + i * 101);
    const results = await Promise.allSettled(seeds.map(makeOne));
    const imgs = results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : [])).filter(Boolean);

    if (imgs.length === 0) {
      if (!(bgUploadUrl || bgUrl)) {
        setBgUploadUrl(FALLBACK_BG); setBgUrl(null);
        setIsPlaceholder(true);
      }
      throw new Error('All generations failed');
    }

    if (genCount > 1) setGenCandidates(imgs);

    const first = imgs[0];
    if (first.startsWith('data:image/')) { setBgUploadUrl(first); setBgUrl(null); }
    else                                 { setBgUrl(first);      setBgUploadUrl(null); }

    setFormat(requestedFormat);
    setBgScale(1.3);
    setBgPosX(50);
    setBgPosY(50);
    setIsPlaceholder(false);
    lastGenRef.current = { opts: opts, seed: baseSeed, fmt: requestedFormat };
    if (willConsume) setCredits(c => Math.max(0, c - 1));

  } catch (e: any) {
    const msg = String(e?.message || e || 'Generation failed');
    setGenError(msg);
    if (!(bgUploadUrl || bgUrl)) {
      setBgUploadUrl(FALLBACK_BG); setBgUrl(null);
      setIsPlaceholder(true);
    }
  } finally {
    setGenLoading(false);
  }
};

  /* dark inputs + slim scrollbars */
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
        /* PATCH A11Y-001: visible focus ring for non-native buttons */
      .focus-ring:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
      [role="button"] { cursor: pointer; }

      .panel { scrollbar-width: thin; scrollbar-color: #3b3b42 #17171b; }
      .panel::-webkit-scrollbar { height: 6px; width: 6px; }
      .panel::-webkit-scrollbar-thumb { background: #3b3b42; border-radius: 6px; }
      .panel::-webkit-scrollbar-track { background: #17171b; }
      .panel input[type="text"], .panel input[type="number"], .panel input[type="file"], .panel textarea, .panel select {
        background-color: #17171b !important; color: #fff !important; border: 1px solid #3b3b42 !important;
      }
      .panel input::placeholder, .panel textarea::placeholder { color: #9ca3af; }
      .panel input:focus, .panel textarea:focus, .panel select:focus {
        outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.25);
      }
      .panel ::file-selector-button {
        background: #212126; color: #e5e7eb; border: 1px solid #3b3b42; border-radius: 6px; padding: 4px 8px; margin-right: 8px; cursor: pointer;
      }
        /* Hide number input spinners (Chrome/Safari/Edge) */
      .panel input[type="number"]::-webkit-outer-spin-button,
      .panel input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Hide number input spinners (Firefox) — wheel still works */
      .panel input[type="number"] {
        -moz-appearance: textfield;
        appearance: textfield;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  // ===== DESIGN SNAPSHOT HELPERS (BEGIN) =====
    const LS_KEY = 'nightlife-flyers.designs.v1';

    // Build a serializable snapshot of the current design (no big images).
    const buildSnapshot = () => ({
      meta: { version: 1, savedAt: Date.now() },
      // format & guides
      format,
      textSide,
      showGuides,
      showFaceGuide,
      // positions
      headX, headY, detailsX, detailsY, venueX, venueY, subtagX, subtagY,
      bgPosX, bgPosY,
      // rotations
      headRotate, head2Rotate, detailsRotate, details2Rotate, venueRotate, subtagRotate, logoRotate,

      // headline
      headline,
      headlineFamily,
      align,
      lineHeight,
      textColWidth,
      tallHeadline,
      textFx,
      // headline 2 styles
      headline2Enabled, 
      head2, 
      head2X, 
      head2Y, 
      head2SizePx,
      head2Family, 
      head2Align, 
      head2LineHeight, 
      head2ColWidth, 
      head2Fx,
      head2Alpha,
    
      // details/body
      details,
      details2Family,
      bodyFamily,
      bodyColor,
      bodySize,
      bodyUppercase,
      bodyBold,
      bodyItalic,
      bodyUnderline,
      bodyTracking,
      // venue
      venue,
      venueFamily,
      venueColor,
      venueSize,
      // subtag
      subtagEnabled,
      subtag,
      subtagFamily,
      subtagBgColor,
      subtagTextColor,
      subtagAlpha,
      subtagUppercase,
      subtagBold,
      subtagItalic,
      subtagUnderline,
      subtagSize,
      // palette & bg fx
      palette,
      vignette,
      haze,
      hue,

      // lock flags
      portraitLocked,
    });

    // Apply a snapshot back into state (safe: checks for undefined)
    const applySnapshot = (s: any) => {
      if (!s || typeof s !== 'object') return;
      // format also resets anchors via your existing useEffect
      if (s.format) setFormat(s.format);
      if (typeof s.textSide === 'string') setTextSide(s.textSide);
      if (typeof s.showGuides === 'boolean') setShowGuides(s.showGuides);
      if (typeof s.showFaceGuide === 'boolean') setShowFaceGuide(s.showFaceGuide);

      // positions
      if (typeof s.headX === 'number') setHeadX(s.headX);
      if (typeof s.headY === 'number') setHeadY(s.headY);
      if (typeof s.detailsX === 'number') setDetailsX(s.detailsX);
      if (typeof s.detailsY === 'number') setDetailsY(s.detailsY);
      if (typeof s.venueX === 'number') setVenueX(s.venueX);
      if (typeof s.venueY === 'number') setVenueY(s.venueY);
      if (typeof s.subtagX === 'number') setSubtagX(s.subtagX);
      if (typeof s.subtagY === 'number') setSubtagY(s.subtagY);
      if (typeof s.bgPosX === 'number') setBgPosX(s.bgPosX);
      if (typeof s.bgPosY === 'number') setBgPosY(s.bgPosY);

      // portrait position/scale (if present)
      if (typeof s.portraitX === 'number') setPortraitX(s.portraitX);
      if (typeof s.portraitY === 'number') setPortraitY(s.portraitY);
      if (typeof s.portraitScale === 'number') setPortraitScale(s.portraitScale);
      if (Array.isArray(s.portraitSlots)) persistPortraitSlots(s.portraitSlots);

      // portrait lock
      if (typeof s.portraitLocked === 'boolean') setPortraitLocked(s.portraitLocked);


      // headline
      if (typeof s.headline === 'string') setHeadline(s.headline);
      if (typeof s.headlineFamily === 'string') setHeadlineFamily(s.headlineFamily);
      if (typeof s.align === 'string') setAlign(s.align);
      if (typeof s.lineHeight === 'number') setLineHeight(s.lineHeight);
      if (typeof s.textColWidth === 'number') setTextColWidth(s.textColWidth);
      if (typeof s.tallHeadline === 'boolean') /* read-only in your code */ null;
      if (s.textFx && typeof s.textFx === 'object') setTextFx((prev) => ({ ...prev, ...s.textFx }));

      // headline size mode (optional in templates)
      if (typeof s.headSizeAuto === 'boolean') setHeadSizeAuto(s.headSizeAuto);
      if (typeof s.headManualPx === 'number') setHeadManualPx(s.headManualPx);
      if (typeof s.headMaxPx === 'number') setHeadMaxPx(s.headMaxPx);


      // headline 2
      if (typeof s.head2Enabled === "boolean")setHeadline2Enabled(format, s.head2Enabled);
      if (typeof s.head2 === 'string') setHead2(s.head2);
      if (typeof s.head2X === 'number') setHead2X(s.head2X);
      if (typeof s.head2Y === 'number') setHead2Y(s.head2Y);
      if (typeof s.head2SizePx === 'number') setHead2SizePx(s.head2SizePx);
      if (typeof s.head2Family === 'string') setHead2Family(s.head2Family);
      if (typeof s.head2Align === 'string') setHead2Align(s.head2Align as Align);
      if (typeof s.head2LineHeight === 'number') setHead2LineHeight(s.head2LineHeight);
      if (typeof s.head2ColWidth === 'number') setHead2ColWidth(s.head2ColWidth);
      if (s.head2Fx && typeof s.head2Fx === 'object') {
        setHead2Fx((prev) => ({ ...prev, ...s.head2Fx, gradient: false }));
      }
      if (typeof s.head2Alpha === 'number') setHead2Alpha(s.head2Alpha);


      // details/body
      if (typeof s.details === 'string') setDetails(s.details);
      if (typeof s.bodyFamily === 'string') setBodyFamily(s.bodyFamily);
      if (typeof s.bodyColor === 'string') setBodyColor(s.bodyColor);
      if (typeof s.bodySize === 'number') setBodySize(s.bodySize);
      if (typeof s.bodyUppercase === 'boolean') setBodyUppercase(s.bodyUppercase);
      if (typeof s.bodyBold === 'boolean') setBodyBold(s.bodyBold);
      if (typeof s.bodyItalic === 'boolean') setBodyItalic(s.bodyItalic);
      if (typeof s.bodyUnderline === 'boolean') setBodyUnderline(s.bodyUnderline);
      if (typeof s.bodyTracking === 'number') setBodyTracking(s.bodyTracking);

      // venue
      if (typeof s.venue === 'string') setVenue(s.venue);
      if (typeof s.venueFamily === 'string') setVenueFamily(s.venueFamily);
      if (typeof s.venueColor === 'string') setVenueColor(s.venueColor);
      if (typeof s.venueSize === 'number') setVenueSize(s.venueSize);

      // subtag
      if (typeof s.subtagEnabled === 'boolean') setSubtagEnabled(format, s.subtagEnabled);
      if (typeof s.subtag === 'string') setSubtag(s.subtag);
      if (typeof s.subtagFamily === 'string') setSubtagFamily(s.subtagFamily);
      if (typeof s.subtagBgColor === 'string') setSubtagBgColor(s.subtagBgColor);
      if (typeof s.subtagTextColor === 'string') setSubtagTextColor(s.subtagTextColor);
      if (typeof s.subtagAlpha === 'number') setSubtagAlpha(s.subtagAlpha);
      if (typeof s.subtagUppercase === 'boolean') setSubtagUppercase(s.subtagUppercase);
      if (typeof s.subtagBold === 'boolean') setSubtagBold(s.subtagBold);
      if (typeof s.subtagItalic === 'boolean') setSubtagItalic(s.subtagItalic);
      if (typeof s.subtagUnderline === 'boolean') setSubtagUnderline(s.subtagUnderline);

      if (typeof s.headRotate === 'number') setHeadRotate(s.headRotate);
      if (typeof s.head2Rotate === 'number') setHead2Rotate(s.head2Rotate);
      if (typeof s.detailsRotate === 'number') setDetailsRotate(s.detailsRotate);
      if (typeof s.details2Rotate === 'number') setDetails2Rotate(s.details2Rotate);
      if (typeof s.venueRotate === 'number') setVenueRotate(s.venueRotate);
      if (typeof s.subtagRotate === 'number') setSubtagRotate(s.subtagRotate);
      if (typeof s.logoRotate === 'number') setLogoRotate(s.logoRotate);
      // logo slots (up to 4) — persists the library
      if (Array.isArray(s.logoSlots)) {
      // Use your helper so it updates state AND localStorage
        persistLogoSlots(s.logoSlots.slice(0, MAX_LOGO_SLOTS));
      }

      if (typeof s.subtagSize === 'number') setSubtagSize(s.subtagSize);


      // palette & bg fx
      if (s.palette && typeof s.palette === 'object') {
        // palette is immutable in your current code, so we ignore setting it here
        // (uncomment next line if you later make palette stateful)
        // setPalette(s.palette);
      }
      if (typeof s.vignette === 'number') setVignette(s.vignette);
      if (typeof s.haze === 'number') setHaze(s.haze);
      if (typeof s.hue === 'number') setHue(s.hue);
      if (typeof s.portraitLocked === 'boolean') setPortraitLocked(s.portraitLocked);

    };

    // localStorage helpers
    const readAllDesigns = (): Record<string, any> => {
      try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch { return {}; }
    };
    const writeAllDesigns = (obj: Record<string, any>) => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
    };

    // API you’ll call from UI (next patch)
  
   
   
   

    // === AUTOSAVE (My Designs) — minimal & safe ===
      const lastSnapRef  = React.useRef<string>('');

      function snapshotDesign(): string {
        // keep this list lean — these are examples you likely have
        return JSON.stringify({
          format, headline, details, venue, subtag, subtagEnabled,
          portraitUrl, portraitX, portraitY, portraitScale,
          portraitLocked,
          logoUrl, logoX, logoY, logoScale,
          bgUrl, bgUploadUrl, bgPosX, bgPosY, bgScale,
          textColWidth, align,
        });
      }

       /* === AUTOSAVE BEGIN (My Designs) — debounced & diffed === */
    React.useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!autoSaveOn) return;
  if (isLiveDragging) return;   // 🔥 gate during drag

  const snap = snapshotDesign();
  if (snap === lastSnapRef.current) return;

  if (saveDebounce.current) window.clearTimeout(saveDebounce.current);
  saveDebounce.current = window.setTimeout(() => {
    try {
      saveDesign('__autosave__');
      localStorage.setItem('NLF:auto:savedAt', String(Date.now()));
      lastSnapRef.current = snap;
    } catch {}
  }, 600);

  return () => {
    if (saveDebounce.current) window.clearTimeout(saveDebounce.current);
  };
}, [isLiveDragging, autoSaveOn, format]);

    /* === /AUTOSAVE END === */

    // === CINEMATIC HEADLINE PRESETS (drop-in apply functions) ===
    function applyCinematicBlockbuster() {
      setHeadlineFamily('Anton');
      setHeadSizeAuto(true); setHeadMaxPx(130);
      setLineHeight(0.88);
      setTextFx(v => ({
        ...v,
        uppercase: true,
        bold: true,
        italic: false,
        underline: false,
        tracking: 0.014,
        gradient: false,
        color: '#FFFFFF',
        gradFrom: v.gradFrom, gradTo: v.gradTo,
        strokeWidth: 2,
        strokeColor: '#000000',
        shadow: 0.6,
        glow: 0.18,
        shadowEnabled: true,
      }));
      setLeadTrackDelta(0.006);
      setLastTrackDelta(0.004);
      setOpticalMargin(true);
      setKerningFix(true);
      setTextColWidth(56);
    }

    function applyCinematicPrestige() {
      setHeadlineFamily('Playfair Display');
      setHeadSizeAuto(true); setHeadMaxPx(120);
      setLineHeight(0.92);
      setTextFx(v => ({
        ...v,
        uppercase: true,
        bold: true,
        italic: false,
        underline: false,
        tracking: 0.02,
        gradient: true,
        gradFrom: '#FFE29A',
        gradTo:   '#FFC35A',
        color: '#FFFFFF',
        strokeWidth: 1,
        strokeColor: '#5C3B09',
        shadow: 0.55,
        glow: 0.22,
        shadowEnabled: true,
      }));
      setLeadTrackDelta(0.01);
      setLastTrackDelta(0.008);
      setOpticalMargin(true);
      setKerningFix(true);
      setTextColWidth(54);
    }

    function applyCinematicNeoNoir() {
      setHeadlineFamily('Bebas Neue');
      setHeadSizeAuto(true); setHeadMaxPx(128);
      setLineHeight(0.86);
      setTextFx(v => ({
        ...v,
        uppercase: true,
        bold: true,
        italic: false,
        underline: false,
        tracking: 0.012,
        gradient: false,
        color: '#EAEAEA',
        strokeWidth: 1,
        strokeColor: '#000000',
        shadow: 0.7,
        glow: 0.15,
        shadowEnabled: true,
      }));
      setLeadTrackDelta(0.004);
      setLastTrackDelta(0.006);
      setOpticalMargin(true);
      setKerningFix(true);
      setTextColWidth(58);
    }

    function applyHeadlineDefault() {
      // font & sizing back to defaults
      setHeadlineFamily('Inter');
      setHeadSizeAuto(true);
      setHeadMaxPx(format === 'square' ? 84 : 110);
      setLineHeight(0.9);

      // headline FX back to your original defaults
      setTextFx(v => ({
        ...v,
        uppercase: true,
        bold: true,
        italic: false,
        underline: false,
        tracking: 0.02,

        gradient: false,
        gradFrom: '#ffffff',
        gradTo:   '#ffd166',
        color:    '#ffffff',

        strokeWidth: 0,
        strokeColor: '#000000',

        shadow: 0.6,
        glow: 0.2,
        shadowEnabled: true,
      }));

      // type tweaks back to defaults
      setLeadTrackDelta(0);
      setLastTrackDelta(0);
      setOpticalMargin(true);
      setKerningFix(true);

      // ensure no leftover rotation from a preset
      setHeadRotate(0);
    }


    // ===== BRAND KIT LITE (BEGIN) =====
    type BrandKit = {
      v: 1;
      fonts: {
        headlineFamily: string;
        detailsFamily: string;
        bodyFamily: string;
        venueFamily: string;
        subtagFamily: string;
      };
      colors: {
        headlineFill: string;   // textFx.color (solid fill when gradient OFF)
        gradFrom: string;       // headline gradient from
        gradTo: string;         // headline gradient to
        bodyColor: string;
        venueColor: string;
        subtagBgColor: string;
        subtagTextColor: string;
      };
      logoDataUrl?: string | null; // persisted logo (base64 data URL)
    };

    const BK_KEY = 'nightlife-flyers.brandkit.v1';

    function readBrandKit(): BrandKit | null {
      try {
        const raw = localStorage.getItem(BK_KEY);
        if (!raw) return null;
        const j = JSON.parse(raw);
        if (j && j.v === 1) return j as BrandKit;
        return null;
      } catch { return null; }
    }

    function writeBrandKit(kit: BrandKit) {
      try { localStorage.setItem(BK_KEY, JSON.stringify(kit)); } catch {}
    }

    function clearBrandKit() {
      try { localStorage.removeItem(BK_KEY); } catch {}
    }

    /** Save current fonts/colors/logo as the brand kit */
    function saveBrandKit() {
      const kit: BrandKit = {
        v: 1,
        fonts: {
          detailsFamily,
          headlineFamily,
          bodyFamily,
          venueFamily,
          subtagFamily,
        },
        colors: {
          headlineFill: textFx.color,
          gradFrom: textFx.gradFrom,
          gradTo: textFx.gradTo,
          bodyColor,
          venueColor,
          subtagBgColor,
          subtagTextColor,
        },
        logoDataUrl: logoUrl || null,
      };
      writeBrandKit(kit);
    }

    /** Apply fonts/colors/logo from a saved brand kit */
    function applyBrandKit(kit: BrandKit) {
      if (!kit) return;

      // Fonts
if (kit.fonts?.headlineFamily) setHeadlineFamily(kit.fonts.headlineFamily);
if (kit.fonts?.bodyFamily)     setBodyFamily(kit.fonts.bodyFamily);
if (kit.fonts?.detailsFamily)  setDetailsFamily(kit.fonts.detailsFamily); // ✅ added
if (kit.fonts?.venueFamily)    setVenueFamily(kit.fonts.venueFamily);
if (kit.fonts?.subtagFamily)   setSubtagFamily(kit.fonts.subtagFamily);
      

      // Colors (headline fill & gradient endpoints)
      if (kit.colors) {
        setTextFx(v => ({
          ...v,
          color:    kit.colors.headlineFill ?? v.color,
          gradFrom: kit.colors.gradFrom ?? v.gradFrom,
          gradTo:   kit.colors.gradTo ?? v.gradTo,
        }));
        if (kit.colors.bodyColor)      setBodyColor(kit.colors.bodyColor);
        if (kit.colors.venueColor)     setVenueColor(kit.colors.venueColor);
        if (kit.colors.subtagBgColor)  setSubtagBgColor(kit.colors.subtagBgColor);
        if (kit.colors.subtagTextColor)setSubtagTextColor(kit.colors.subtagTextColor);
      }

      // Logo
      if (typeof kit.logoDataUrl === 'string' && kit.logoDataUrl) {
        setLogoUrl(kit.logoDataUrl);
        setLogoScale(1);
        setLogoX(6);
        setLogoY(100 - 6 - 14);
      }
    }
    // ===== BRAND KIT LITE (END) =====


      const hasBg = !!(bgUploadUrl || bgUrl);
      const STICKY_TOP = 90; // header height (h-14)
      // ===== NAV-001 hookup (keyboard nudging) =====
useEffect(() => {
  const cleanup = installKeyboardNudge({
    moveMode: () => moveMode,
    moveTarget: () => moveTarget,
    getPos: (t) => {
      switch (t) {
        case 'headline':  return { x: headX,     y: headY };
        case 'headline2': return { x: head2X,    y: head2Y };
        case 'details':   return { x: detailsX,  y: detailsY };
        case 'details2':  return { x: details2X, y: details2Y };
        case 'venue':     return { x: venueX,    y: venueY };
        case 'subtag':    return { x: subtagX,   y: subtagY };
        case 'portrait':  return { x: portraitX, y: portraitY };
        case 'logo':      return { x: logoX,     y: logoY };
        case 'background':return { x: bgPosX,    y: bgPosY };
        default:          return null;
      }
    },
        getRotate: (t) => {
      switch (t) {
        case 'headline':  return headRotate;
        case 'headline2': return head2Rotate;
        case 'details':   return detailsRotate;
        case 'details2':  return details2Rotate;
        case 'venue':     return venueRotate;
        case 'subtag':    return subtagRotate;
        case 'logo':      return logoRotate;
        default:          return null;
      }
    },
    setRotate: (t, deg) => {
      switch (t) {
        case 'headline':  setHeadRotate(deg);  break;
        case 'headline2': setHead2Rotate(deg); break;
        case 'details':   setDetailsRotate(deg); break;
        case 'details2':  setDetails2Rotate(deg); break;
        case 'venue':     setVenueRotate(deg); break;
        case 'subtag':    setSubtagRotate(deg); break;
        case 'logo':      setLogoRotate(deg); break;
      }
    },

    setPos: (t, x, y) => {
      switch (t) {
        case 'headline':   setHeadX(x);     setHeadY(y);     break;
        case 'headline2':  setHead2X(x);    setHead2Y(y);    break;
        case 'details':    setDetailsX(x);  setDetailsY(y);  break;
        case 'details2':   setDetails2X(x); setDetails2Y(y); break;
        case 'venue':      setVenueX(x);    setVenueY(y);    break;
        case 'subtag':     setSubtagX(x);   setSubtagY(y);   break;
       case 'portrait':
            if (portraitLocked) return;        // ← HARD STOP when locked
            setPortraitX(x);
            setPortraitY(y);
            break;
        case 'logo':       setLogoX(x);     setLogoY(y);     break;
        case 'background': setBgPosX(x);    setBgPosY(y);    break;
      }
    }
  });
  return cleanup;
}, [
  moveMode, moveTarget,
  headX, headY, head2X, head2Y,
  detailsX, detailsY, details2X, details2Y,
  venueX, venueY, subtagX, subtagY,
  portraitX, portraitY, logoX, logoY,
  bgPosX, bgPosY
]);
    // ===== /NAV-001 hookup =====
    // >>> HOOKAH HOTKEY (Alt + H) — paste right below "// ===== /NAV-001 hookup ====="
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    // Alt + H drops a hookah icon at center
    if (e.altKey && (e.key === 'h' || e.key === 'H')) {
      e.preventDefault();
      addHookahIcon(); // <-- this was created in step #2
    }
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [addHookahIcon]);

// === ESC clears portrait selection (switch target away from 'portrait') ===
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      // If portrait is the active target, move focus back to headline (or any safe default)
      if (moveMode && moveTarget === 'portrait') {
        e.preventDefault();
        setDragging('headline'); // mirrors "clear selection" pattern you use for icons
      }
    }
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [moveMode, moveTarget]);



    /** ====== STARTER TEMPLATES (state snapshots + bg prompt hints) ====== */
      type StarterTpl = {
        label: string;
        state: any;                     // applies via applySnapshot(...)
        bg?: { preset?: string; style?: GenStyle; prompt?: string }; // optional
      };

      const STARTER_TEMPLATES: Record<string, StarterTpl> = {
        edm_tunnel: {
          label: 'EDM / Laser Tunnel',
          state: {
            format: 'square',
            headline: 'FRIDAY // EDM RAVE',
            headlineFamily: 'Anton',
            align: 'left',
            lineHeight: 0.88,
            textColWidth: 56,
            headSizeAuto: true,
            headMaxPx: 120,
            textFx: {
              uppercase: true, bold: true, italic: false, underline: false,
              tracking: 0.015, gradient: true, gradFrom: '#78E3FF', gradTo: '#E872FF',
              color: '#FFFFFF', strokeWidth: 0, strokeColor: '#000000',
              shadow: 0.6, glow: 0.25, shadowEnabled: true,
            },
            details:
              'Doors 10PM\n21+ • CO₂ blasts • Lasers\nTABLES + BOTTLE SERVICE',
            bodyFamily: 'Inter', bodyColor: '#DCE3EA', bodySize: 16,
            bodyUppercase: true, bodyBold: true, bodyItalic: false, bodyUnderline: false, bodyTracking: 0.03,
            detailsLineHeight: 1.2, detailsAlign: 'left',
            venue: 'ORBIT CLUB — DOWNTOWN', venueFamily: 'Oswald', venueColor: '#FFFFFF', venueSize: 40,
            subtagEnabled: true, subtag: 'special guest dj', subtagFamily: 'Inter',
            subtagBgColor: '#000000', subtagTextColor: '#FFFFFF', subtagAlpha: 0.65, subtagUppercase: true,
            headX: 6, headY: 10, detailsX: 6, detailsY: 74, venueX: 6, venueY: 80, subtagX: 6, subtagY: 24,
          },
          bg: {
                style: 'neon',
                prompt:
                  'LED tunnel corridor with repeating arches, intense cyan–magenta laser blades, reflective wet floor, volumetric haze beams, prism diffraction bokeh, high-energy club atmosphere, motion streaks in the distance, background only, no text',
                // optional guide flags for stronger fidelity:
                // (we’ll set these via useStarterTemplate)
              }
        },

        latin_tropical: {
          label: 'Latin / Tropical Street',
          state: {
            format: 'square',
            headline: 'NOCHE LATINA',
            headlineFamily: 'Bebas Neue',
            align: 'left', lineHeight: 0.9, textColWidth: 56,
            headSizeAuto: true, headMaxPx: 118,
            textFx: {
              uppercase: true, bold: true, italic: false, underline: false,
              tracking: 0.012, gradient: true, gradFrom: '#FFA14A', gradTo: '#15D0B9',
              color: '#FFFFFF', strokeWidth: 0, strokeColor: '#000000',
              shadow: 0.55, glow: 0.18, shadowEnabled: true,
            },
            details:
              'Reggaeton • Bachata • Salsa\n2 Floors • Patio Vibes\n21+ // 10PM',
            bodyFamily: 'Inter', bodyColor: '#F4F7FA', bodySize: 15,
            bodyUppercase: true, bodyBold: true, bodyItalic: false, bodyUnderline: false, bodyTracking: 0.03,
            detailsLineHeight: 1.2, detailsAlign: 'left',
            venue: 'LA TERRAZA CLUB', venueFamily: 'Oswald', venueColor: '#FFFFFF', venueSize: 38,
            subtagEnabled: true, subtag: 'shots • dance • vibes', subtagFamily: 'Inter',
            subtagBgColor: '#0A5B55', subtagTextColor: '#FFFFFF', subtagAlpha: 0.75, subtagUppercase: true,
            headX: 6, headY: 10, detailsX: 6, detailsY: 74, venueX: 6, venueY: 80, subtagX: 6, subtagY: 24,
          },
          bg: {
                style: 'tropical',
                prompt:
                  'palm-lined terrace street party at night, warm lanterns and sunset flares, aqua-coral neon cocktail reflections, dappled palm shadows, festive lively ambience, glossy highlights, background only, no text'
              }
                      },

        hiphop_graffiti: {
          label: 'Hip-Hop / Graffiti Alley',
          state: {
            format: 'square',
            headline: 'HIP-HOP NIGHT',
            headlineFamily: 'Anton',
            align: 'left', lineHeight: 0.86, textColWidth: 56,
            headSizeAuto: true, headMaxPx: 122,
            textFx: {
              uppercase: true, bold: true, italic: false, underline: false,
              tracking: 0.012, gradient: false, color: '#FFFFFF',
              gradFrom: '#FFFFFF', gradTo: '#FFFFFF',
              strokeWidth: 2, strokeColor: '#000000',
              shadow: 0.65, glow: 0.12, shadowEnabled: true,
            },
            details:
              'All Classics // All Night\n+ Open Format Room\n21+ • 9PM',
            bodyFamily: 'Inter', bodyColor: '#E6E6E6', bodySize: 16,
            bodyUppercase: true, bodyBold: true, bodyItalic: false, bodyUnderline: false, bodyTracking: 0.03,
            detailsLineHeight: 1.18, detailsAlign: 'left',
            venue: 'THE WAREHOUSE', venueFamily: 'Oswald', venueColor: '#FFFFFF', venueSize: 40,
            subtagEnabled: true, subtag: 'block party edition', subtagFamily: 'Inter',
            subtagBgColor: '#E23B2E', subtagTextColor: '#FFFFFF', subtagAlpha: 0.85, subtagUppercase: true,
            headX: 6, headY: 10, detailsX: 6, detailsY: 74, venueX: 6, venueY: 80, subtagX: 6, subtagY: 24,
          },
          bg: {
                style: 'urban',
                prompt:
                  'gritty graffiti alley with wet asphalt, cinematic rim light through haze, puddle reflections, layered posters and bricks, high contrast pools of light, underground block party vibe, background only, no text'
              }
        },

        ladies_pinkchrome: {
          label: 'Ladies Night / Pink Chrome',
          state: {
            format: 'square',
            headline: 'LADIES NIGHT',
            headlineFamily: 'Poppins',
            align: 'left', lineHeight: 0.92, textColWidth: 56,
            headSizeAuto: true, headMaxPx: 116,
            textFx: {
              uppercase: true, bold: true, italic: false, underline: false,
              tracking: 0.018, gradient: true, gradFrom: '#F8A9FF', gradTo: '#FF5AB3',
              color: '#FFFFFF', strokeWidth: 0, strokeColor: '#000000',
              shadow: 0.5, glow: 0.25, shadowEnabled: true,
            },
            details:
              'No Cover Before 11PM\nComplimentary Champagne\n21+ • Dress to Impress',
            bodyFamily: 'Inter', bodyColor: '#FFE9F6', bodySize: 15,
            bodyUppercase: true, bodyBold: true, bodyItalic: false, bodyUnderline: false, bodyTracking: 0.03,
            detailsLineHeight: 1.2, detailsAlign: 'left',
            venue: 'CHROME LOUNGE', venueFamily: 'Oswald', venueColor: '#FFFFFF', venueSize: 38,
            subtagEnabled: true, subtag: 'all pink everything', subtagFamily: 'Inter',
            subtagBgColor: '#2D0E20', subtagTextColor: '#FFFFFF', subtagAlpha: 0.6, subtagUppercase: true,
            headX: 6, headY: 10, detailsX: 6, detailsY: 74, venueX: 6, venueY: 80, subtagX: 6, subtagY: 24,
          },
          bg: {
                style: 'neon',
                prompt:
                  'glossy chrome nightclub hallway, hot pink and violet neon glow, mirror reflections, soft bloom, tasteful luxury vibe, light haze sparkle, background only, no text'
              }
                      },

        college_stadium: {
          label: 'College / Stadium Lights',
          state: {
            format: 'square',
            headline: 'COLLEGE NIGHT',
            headlineFamily: 'Oswald',
            align: 'left', lineHeight: 0.94, textColWidth: 56,
            headSizeAuto: true, headMaxPx: 114,
            textFx: {
              uppercase: true, bold: true, italic: false, underline: false,
              tracking: 0.01, gradient: false, color: '#FFFFFF',
              gradFrom: '#FFFFFF', gradTo: '#FFFFFF',
              strokeWidth: 1, strokeColor: '#1D4ED8',
              shadow: 0.5, glow: 0.1, shadowEnabled: true,
            },
            details:
              'Top 40 • Throwbacks • Hip-Hop\n$5 with Student ID\n18+ • 9PM',
            bodyFamily: 'Inter', bodyColor: '#E6EEF6', bodySize: 15,
            bodyUppercase: true, bodyBold: true, bodyItalic: false, bodyUnderline: false, bodyTracking: 0.03,
            detailsLineHeight: 1.18, detailsAlign: 'left',
            venue: 'STADIUM BAR', venueFamily: 'Oswald', venueColor: '#FFFFFF', venueSize: 38,
            subtagEnabled: true, subtag: 'spirit week edition', subtagFamily: 'Inter',
            subtagBgColor: '#1D4ED8', subtagTextColor: '#FFFFFF', subtagAlpha: 0.75, subtagUppercase: true,
            headX: 6, headY: 10, detailsX: 6, detailsY: 74, venueX: 6, venueY: 80, subtagX: 6, subtagY: 24,
          },
          bg: {
                style: 'urban',
                prompt:
                  'stadium lights blasting across a concrete concourse, beams and lens bloom, cheering college crowd silhouettes and celebratory confetti in the far background, energetic motion blur, cool blue shadows with warm accents, electric game-night atmosphere, background only, no text'
              }
               },

        nye_gold: {
          label: 'NYE / Gold Glam',
          state: {
            format: 'square',
            headline: 'NEW YEAR’S EVE',
            headlineFamily: 'Playfair Display',
            align: 'left', lineHeight: 0.96, textColWidth: 56,
            headSizeAuto: true, headMaxPx: 110,
            textFx: {
              uppercase: true, bold: true, italic: false, underline: false,
              tracking: 0.02, gradient: true, gradFrom: '#FFE29A', gradTo: '#FFC35A',
              color: '#FFFFFF', strokeWidth: 1, strokeColor: '#5C3B09',
              shadow: 0.55, glow: 0.2, shadowEnabled: true,
            },
            details:
              'Countdown • Confetti Cannon • Champagne Toast\nBlack-Tie Optional | 21+',
            bodyFamily: 'Inter', bodyColor: '#FFF6E0', bodySize: 15,
            bodyUppercase: true, bodyBold: true, bodyItalic: false, bodyUnderline: false, bodyTracking: 0.03,
            detailsLineHeight: 1.22, detailsAlign: 'left',
            venue: 'THE GRAND BALLROOM', venueFamily: 'Oswald', venueColor: '#FFFFFF', venueSize: 38,
            subtagEnabled: true, subtag: 'midnight celebration', subtagFamily: 'Inter',
            subtagBgColor: '#2B210E', subtagTextColor: '#FFE8B0', subtagAlpha: 0.7, subtagUppercase: true,
            headX: 6, headY: 10, detailsX: 6, detailsY: 74, venueX: 6, venueY: 80, subtagX: 6, subtagY: 24,
          },
          bg: {
            style: 'vintage',
            prompt:
              'opulent gold confetti sparkle bokeh over a dark elegant ballroom backdrop, champagne glow and soft halation, subtle vignette, luxurious festive mood, background only, no text'
          }
                  },
      };

      /** One-click apply */
    const applyStarterTemplate = async (key: keyof typeof STARTER_TEMPLATES) => {
  const tpl = STARTER_TEMPLATES[key];
  if (!tpl) return;

  // Apply layout/typography
  applySnapshot(tpl.state);

  // Prime UI controls (so the panels reflect the template’s intent)
  if (tpl.bg?.style) setGenStyle(tpl.bg.style);
  if (tpl.bg?.prompt) setGenPrompt(tpl.bg.prompt);

  // Make generation stick CLOSE to the template:
  setLockVar(true);            // keep seed stable while user explores
  setVariety(0);               // 0 => no wild remixing
  // For crowd energy (college) we allow silhouettes but avoid faces:
  const allow = key === 'college_stadium' ? true : false;
  setAllowPeople(allow);

  // If there’s no background yet, generate immediately with exact prompt
  if (!(bgUploadUrl || bgUrl)) {
    await generateBackground({
      prompt: tpl.bg?.prompt,               // use the literal prompt
      style: tpl.bg?.style,                 // template style
      formatOverride: tpl.state?.format,    // square/story from state
      allowPeopleOverride: allow,           // silhouettes for college
      varietyOverride: 0                    // stay faithful
    });
  }
};
// ---- SHAPES STATE & HELPERS ----
const newId = () => 'sh-' + Math.random().toString(36).slice(2, 9);
const addRect = () =>
  setShapes(s => [
    ...s,
    {
      id: newId(),
      kind: 'rect',
      x: 10, y: 10,
      width: 32, height: 8,
      rotation: 0,
      fill: 'rgba(255,255,255,0.12)',
      stroke: '#ffffff',
      strokeWidth: 1,
      opacity: 0.9,
    },
  ]);

const addCircle = () =>
  setShapes(s => [
    ...s,
    {
      id: newId(),
      kind: 'circle',
      x: 50, y: 24,
      r: 6,                         // % of short edge (your renderer already handles this)
      fill: 'rgba(255,255,255,0.10)',
      stroke: '#ffffff',
      strokeWidth: 1,
      opacity: 0.9,
    },
  ]);

const addLine = () =>
  setShapes(s => [
    ...s,
    {
      id: newId(),
      kind: 'line',
      x: 6, y: 88,                  // start point (%)
      width: 48, height: 0,         // Δx, Δy in %
      fill: 'transparent',          // not used for lines
      stroke: '#ffffff',
      strokeWidth: 2,
      opacity: 0.9,
    },
  ]);

        const updateShape = (id: string, patch: Partial<Shape>) =>
          setShapes(s => s.map(sh => (sh.id === id ? { ...sh, ...patch } : sh)));

        const removeShape = (id: string) =>
          setShapes(s => s.filter(sh => sh.id !== id));

        const clearShapes = () => setShapes([]);

// (REMOVE) const [icons, setIcons] = useState<Icon[]>([]);
const onSelectIcon = (id: string) => { setSelIconId(id); setDragging('icon'); };
const onSelectShape = (id: string) => { setSelShapeId(id); setDragging('shape'); };

// --- COMPAT SHIM: old code may call toggleLock(key) ---
function toggleLock(key: string | null | undefined) {
  if (!key) return;
  // Heuristic: if the id exists in iconList, treat as icon; otherwise assume shape.
  const isIcon = iconList.some(i => i.id === key);
  onToggleLock(isIcon ? 'icon' : 'shape', key);
}

const addEmojiIcon = (emoji = '⭐️') =>
  setIconList(a => [
    ...a,
    {
      id: newId(),
      x: 50,
      y: 50,
      size: 6,
      rotation: 0,
      opacity: 1,
      emoji,
      fill: '#ffffff',
      stroke: 'none',
      strokeWidth: 0,
    }
  ]);

const addPathIcon = (svgPath: string, box = 24) =>
  setIconList(a => [
    ...a,
    {
      id: newId(),
      x: 50,
      y: 50,
      size: 6,
      rotation: 0,
      opacity: 1,
      svgPath,
      box,
      fill: 'none',
      stroke: '#ffffff',
      strokeWidth: 2,
    }
  ]);

const addImageIcon = (imgUrl: string) =>
  setIconList(a => [
    ...a,
    {
      id: newId(),
      x: 50,
      y: 50,
      size: 10,
      rotation: 0,
      opacity: 1,
      imgUrl,
      fill: 'none',
      stroke: 'none',
      strokeWidth: 0,
    }
  ]);


  // Load a single-path SVG from /public and add it as a vector icon
async function addSvgFromPublic(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    alert(`Failed to load ${url}: ${res.status}`);
    return;
  }
  const svg = await res.text();

  // viewBox="minX minY width height"
  const vb = svg.match(/viewBox\s*=\s*"[^"]*?([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)"/i);
  const boxRaw = vb ? parseFloat(vb[3]) : NaN;
  const box = Number.isFinite(boxRaw) && boxRaw > 0 ? boxRaw : 24;

  // take first <path d="..."> (simple icons)
  const pm = svg.match(/<path[^>]*\sd\s*=\s*"([^"]+)"/i);
  if (!pm) {
    alert('No <path d="..."> found in SVG');
    return;
  }

  addPathIcon(pm[1], box);
}


const removeIcon = (id: string) =>
  setIconList(a => a.filter(ic => ic.id !== id));

const clearIcons = () => setIconList([]);

/** Convenience: accept either an emoji or an SVG path */
// Spawn from library, centered on canvas (x=50, y=50)
const addIconFromLibrary = (item: IconLibraryItem) => {
  const base = { id: newId(), x: 50, y: 50, size: item.defaultSize ?? 6, rotation: 0, opacity: 1, fill: '#ffffff', stroke: 'none', strokeWidth: 0 } as const;

  if (item.type === 'emoji') {
    setIconList(prev => [...prev, { ...base, emoji: item.emoji }]);
  } else {
    setIconList(prev => [...prev, { ...base, svgPath: item.path }]);
  }
};


// Back-compat: keep old callers working (center spawn)
const addIcon = (input: string = '⭐️') => {
  const looksLikeSvgPath =
    typeof input === 'string' &&
    /[MmLlHhVvCcSsQqTtAaZz]/.test(input) &&
    /^[MmLlHhVvCcSsQqTtAaZz0-9 ,.\-]+$/.test(input);

  if (looksLikeSvgPath) {
    addIconFromLibrary({ key: 'custom-path', label: 'Custom', type: 'svg', path: input, defaultSize: 6 });
  } else {
    addIconFromLibrary({ key: 'custom-emoji', label: 'Emoji', type: 'emoji', emoji: input, defaultSize: 6 });
  }
};



// === UNIVERSAL ALIGN SELECTED (CENTER) ===
async function alignActiveToCenter() {
  const root = canvasRefs.root ?? getRootRef();
  if (!root) {
    alert("❌ rootRef not attached");
    return;
  }

  // 🔍 find highlighted element (glow = active)
  const el = root.querySelector('[data-active="true"]') as HTMLElement | null;
  if (!el) {
    alert("Select element on canvas to align");
    return;
  }

  const canvas = el.closest('.absolute.inset-0.z-0.overflow-hidden') as HTMLElement | null;
  if (!canvas) {
    alert("❌ Canvas not found");
    return;
  }

  // 📏 Center vertically & horizontally within the canvas
  const elRect = el.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const offsetX = canvasRect.width / 2 - elRect.width / 2;
  const offsetY = canvasRect.height / 2 - elRect.height / 2;

  el.style.left = `${(offsetX / canvasRect.width) * 100}%`;
  el.style.top = `${(offsetY / canvasRect.height) * 100}%`;


}

// === /UNIVERSAL ALIGN SELECTED (CENTER) ===




// === onUploadPortraitAndRemoveBg (drop-in once, between addIcon() and the return) ===
// ✅ FIX: Use local AI instead of server API
const onUploadPortraitAndRemoveBg = async (files: FileList | null) => {
  const file = files?.[0];
  if (!file) return;

  try {
    setRemovingBg(true);

    // 1. Convert to base64
    const originalUrl = await blobToDataURL(file);
    
    // Show instant preview while processing
    setPortraitUrl(originalUrl);

    // 2. Process locally
    const cutDataUrl = await removeBackgroundLocal(originalUrl);

    // 3. Update state & Library
    setPortraitUrl(cutDataUrl);
    addToPortraitLibrary(cutDataUrl);

  } catch (err: any) {

    alert(`Remove BG failed: ${err.message}`);
  } finally {
    setRemovingBg(false);
  }
};

// === PORTRAIT OVERLAY HANDLERS (added) ===
const RESIZE_MIN = 0.5;
const RESIZE_MAX = 4.0;

function startPortraitResize(ev: MouseEvent | React.MouseEvent) {
  ev.preventDefault();
  if (portraitLocked) return;

  const startX =
    (ev as MouseEvent).clientX ?? (ev as React.MouseEvent).clientX;
  const startY =
    (ev as MouseEvent).clientY ?? (ev as React.MouseEvent).clientY;
  const startScale = portraitScale;

  function onMove(e: MouseEvent) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const delta = (dx + dy) / 180; // adjust sensitivity as desired
    const next = Math.max(RESIZE_MIN, Math.min(RESIZE_MAX, startScale + delta));
    setPortraitScale(next);
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

// === PER-FORMAT PORTRAIT CACHE (BEGIN) ======================================
type PortraitState = {
  url: string | null;
  x: number;
  y: number;
  scale: number;
  locked: boolean;
};

const portraitCacheRef = React.useRef<{
  square: PortraitState | null;
  story: PortraitState | null;
}>({
  square: null,
  story: null,
});

// one-shot guard to detect intentional format toggles
const isSwitchingFormatRef = React.useRef(false);


function readCurrentPortrait(): PortraitState {
  return {
    url: portraitUrl,
    x: portraitX,
    y: portraitY,
    scale: portraitScale,
    locked: portraitLocked,
  };
}

function loadPortrait(ps: PortraitState | null) {
  if (!ps) {
    setPortraitUrl(null);
    setPortraitX(0);
    setPortraitY(0);
    setPortraitScale(3);
    setPortraitLocked(false);
    return;
  }
  setPortraitUrl(ps.url);
  setPortraitX(ps.x);
  setPortraitY(ps.y);
  setPortraitScale(ps.scale);
  setPortraitLocked(ps.locked);
}
// === PER-FORMAT PORTRAIT CACHE (END) ========================================


// === PER-FORMAT SUBTAG CACHE (BEGIN) =========================================
type SubtagState = { x: number; y: number; rotate: number };

const subtagCacheRef = React.useRef<{
  square: SubtagState | null;
  story: SubtagState | null;
}>({
  square: null,
  story: null,
});

function readCurrentSubtag(): SubtagState {
  return {
    x: subtagX,
    y: subtagY,
    rotate: subtagRotate,
  };
}

function loadSubtag(ss: SubtagState | null) {
  if (!ss) return; // nothing to load
  setSubtagX(ss.x);
  setSubtagY(ss.y);
  setSubtagRotate(ss.rotate);
}
// === PER-FORMAT SUBTAG CACHE (END) ===========================================


// === /PORTRAIT OVERLAY HANDLERS ===
function stagePortraitLikeIcon(initialScale = 1.0) {
  const bw = (typeof pBaseW === 'number') ? pBaseW : 100;
const bh = (typeof pBaseH === 'number') ? pBaseH : 100;


  // maximum scale that keeps the effective box inside the canvas (<= 100% both axes)
  const maxAllowed = Math.min(100 / bw, 100 / bh);

  const targetScale = Math.max(0.5, Math.min(4.0, Math.min(initialScale, maxAllowed)));

  // center-ish placement using the portrait box
  const targetX = 50;
  const targetY = 50;


  const p = fitPortraitToCanvas(format, targetX, targetY, targetScale);
  setPortraitLocked(false);
  setPortraitScale(p.scale);
  setPortraitX(p.x);
  setPortraitY(p.y);

  setMoveMode(true);
  setDragging('portrait');
  setSelIconId(null);
  setSelShapeId(null);
}
// --- Portrait instance helpers (add once) ---
function addInstanceNonce(src: string) {
  const base = src.split('#inst=')[0];       // strip any previous nonce
  return `${base}#inst=${Date.now()}`;       // unique per placement
}
function stripInstanceNonce(src?: string | null) {
  return (src || '').split('#inst=')[0];     // compare/log without nonce
}


// === PLACE PORTRAIT IMMEDIATELY (always new instance) ===
const placePortraitNow = React.useCallback((src: string) => {
  // Use TEMPLATE % box, not pixels.
  //const t = TEMPLATE[format].portrait; // { w, h } in %
  const initialScale = 0.8;            // larger default so it reads instantly

  // Center in PERCENT space (x,y are top-left in %):
const x = 50;
const y = 50;


  setPortraitByFormat(prev => ({
    ...prev,
    [format]: [
      ...(prev[format] || []),
      {
        id: newId(),
        url: src,
        x,            // %
        y,            // %
        scale: initialScale,
        locked: false,
      },
    ],
  }));

  // Activate move mode for portrait
  setMoveMode(true);
  setDragging('portrait');
  setSelIconId(null);
  setSelShapeId(null);
}, [format]);







// Auto-stage whenever a fresh portrait arrives (once per URL)

// Keep this once at top-level with your other hooks (NOT inside any effect)
const lastPortraitRef = React.useRef<string | null>(null);
// === PORTRAIT PORTAL HOST (inside Artboard DOM) ===
const portraitHostRef = React.useRef<HTMLDivElement | null>(null);

React.useEffect(() => {
  const art = (artRef.current as HTMLElement | null);
  if (!art) return;

  if (!portraitHostRef.current) {
    const host = document.createElement('div');
    host.setAttribute('data-portrait-host', '1');
    host.style.position = 'absolute';
    host.style.inset = '0';
    host.style.pointerEvents = 'none';
    host.style.zIndex = '1'; // above Artboard content, below UI
    art.appendChild(host);
    portraitHostRef.current = host;
  }

  return () => {
    if (portraitHostRef.current && portraitHostRef.current.parentElement) {
      portraitHostRef.current.parentElement.removeChild(portraitHostRef.current);
    }
    portraitHostRef.current = null;
  };
}, [artRef]);


/**
 * Auto-stage a newly selected portrait (from “Use” / upload).
 * Only runs when portraitUrl changes. If the user is already moving the portrait,
 * we skip the auto-stage to avoid fighting the drag.
 */
React.useEffect(() => {
  if (!portraitUrl) {
    lastPortraitRef.current = null;
    return;
  }

  if (portraitUrl !== lastPortraitRef.current) {
    if (!(moveMode && moveTarget === 'portrait')) {
      stagePortraitLikeIcon(1.0);
    }
    lastPortraitRef.current = portraitUrl;
  }
}, [portraitUrl, moveMode, moveTarget]);

/**
 * When the format (square/story) changes, just re-clamp the current portrait
 * into the canvas bounds. Do NOT restage/center it.
 */
React.useEffect(() => {
  if (!portraitUrl) {
    isSwitchingFormatRef.current = false;
    return;
  }

  if (isSwitchingFormatRef.current) {
    // Intentional format toggle — restore full portrait state
    const cached = portraitCacheRef.current[format];
    if (cached && cached.url) {
      loadPortrait(cached);

      // 🔹 Reactivate controls after restoring
      setMoveMode(true);
      setDragging('portrait');
    }

    // Reset flag
    isSwitchingFormatRef.current = false;
    return;
  }

  // Normal re-clamp when layout or format changes
  const p = fitPortraitToCanvas(format, portraitX, portraitY, portraitScale);
  if (p.x !== portraitX || p.y !== portraitY || p.scale !== portraitScale) {
    setPortraitX(p.x);
    setPortraitY(p.y);
    setPortraitScale(p.scale);
  }
}, [format]);

/* SUBTAG: restore per-format position/rotation on format change
   NOTE: uses rAF so it runs AFTER any format-reset layout effect. */
React.useEffect(() => {
  const fmt = format as 'square' | 'story';
  const cached = subtagCacheRef.current[fmt];
  if (!cached) return;

  const raf = requestAnimationFrame(() => {
    setSubtagX(cached.x);
    setSubtagY(cached.y);
    setSubtagRotate(cached.rotate);
  });

  return () => cancelAnimationFrame(raf);
}, [format]);


/* === SUBTAG: restore per-format position on format toggle (square/story) ===
   PLACE: directly after the portrait-format effect that ends with "}, [format]);"
   Requires: subtagCacheRef from PATCH 1. (If it exists, this will just use it.)
*/
React.useEffect(() => {
  const fmt = format as 'square' | 'story';
  const cached = subtagCacheRef.current[fmt];
  if (!cached) return;

  // Apply cached subtag position/rotation for this format
  if (typeof cached.x === 'number') setSubtagX(cached.x);
  if (typeof cached.y === 'number') setSubtagY(cached.y);
  if (typeof cached.rotate === 'number') setSubtagRotate(cached.rotate);
}, [format]);

// Normalize any legacy pixel-based portrait entries to % + scale once.
React.useEffect(() => {
  const el = artRef.current as HTMLElement | null;
  if (!el) return;
  const canvasW = el.clientWidth || 1;
  const canvasH = el.clientHeight || 1;
  //const t = TEMPLATE[format].portrait; // {w,h} in %

  setPortraitByFormat(prev => {
    const list = prev[format] || [];
    let changed = false;

    const norm = list.map((p: any) => {
      // legacy entries had pixel-based x/y and explicit w/h
      if (typeof p.w === 'number' || typeof p.h === 'number') {
        const xPct = (Number(p.x || 0) / canvasW) * 100;
        const yPct = (Number(p.y || 0) / canvasH) * 100;
        const boxPxW = 0;
        const scale  = boxPxW > 0 ? Number(p.w || 0) / boxPxW : 1;

        changed = true;
        return {
          id: p.id,
          url: p.url,
          x: xPct,
          y: yPct,
          scale: (isFinite(scale) && scale > 0) ? scale : 1,
          locked: !!p.locked,
        };
      }
      return p;
    });

    return changed ? { ...prev, [format]: norm } : prev;
  });
}, [format]);


function onTogglePortraitLock() {
  setPortraitLocked(v => !v);
}

function onPortraitMove(x: number, y: number) {
  setPortraitX(x);
  setPortraitY(y);
}

function onPortraitScale(next: number) {
  // clamp if you like; safe to pass straight through too
  const clamped = Math.max(0.5, Math.min(4, next));
  setPortraitScale(clamped);
}

// ===== DESIGN STORAGE (START: drop once, above the "My Designs" panel) =====

// --- capture a JPG thumbnail from your Artboard/canvas ---
// If your Artboard ref is a <canvas>, this works out of the box.
// If not, it just returns null (still saves fine; no thumbnail).
function captureThumb(): string | null {
  try {
    const el = artRef.current as HTMLCanvasElement | null;
    if (!el) return null;
    return el.toDataURL('image/jpeg', 0.8);
  } catch { return null; }
}

// Storage keys:
//  - nf:design:index           -> string[] of design names
//  - nf:design:<name>          -> JSON { v, data (string), thumb (dataURL|null), updatedAt }

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem('nf:design:index');
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeIndex(names: string[]) {
  try { localStorage.setItem('nf:design:index', JSON.stringify(names)); } catch {}
}



/** Build a portable JSON snapshot of the current UI state (no external getSnapshot needed). */
function exportDesignJSON(): string {
  // Keep this list aligned with the props you pass into <Artboard/>.
  const designState: Record<string, unknown> = {
    // core
    format,

    // headline
    headline, headlineFamily, align, lineHeight, textColWidth,
    headSizeAuto, headManualPx, headMaxPx, textFx, tallHeadline,
    headX, headY, headRotate, headAlign,

    // details (main)
    details, bodyFamily, bodyColor, bodySize, bodyUppercase, bodyBold,
    bodyItalic, bodyUnderline, bodyTracking, detailsLineHeight,
    detailsAlign, detailsX, detailsY, detailsRotate, detailsFamily,

    // venue
    venue, venueFamily, venueColor, venueSize, venueAlign,
    venueLineHeight, venueX, venueY, venueRotate,

    // subtag
    subtagEnabled, subtag, subtagFamily, subtagBgColor, subtagTextColor,
    subtagAlpha, subtagUppercase, subtagBold, subtagItalic, subtagUnderline,
    subtagSize, subtagX, subtagY, subtagRotate, subtagAlign,

    // headline 2 (custom)
    headline2Enabled, head2, head2Family, head2Align, head2LineHeight,
    head2ColWidth, head2Fx, head2Alpha, head2SizePx, head2X, head2Y, head2Rotate,

    // details 2 (more)
    details2Enabled, details2,
    details2LineHeight, details2Align, details2X, details2Y, details2Rotate,
    details2Size,

    // background & FX
    bgUrl, bgUploadUrl, hue, haze, grade, leak, vignette, bgPosX, bgPosY, bgScale, clarity,

    // portrait
    portraitUrl, portraitX, portraitY, portraitScale, portraitLocked, portraitSlots,

    // logo
    logoUrl, logoX, logoY, logoScale, logoRotate,
    logoSlots,

    // icons & shapes
    iconList, shapes,

    // type tweaks
    opticalMargin, leadTrackDelta, lastTrackDelta, kerningFix, headBehindPortrait,

    // misc UI flags
    showGuides, moveMode, moveTarget, snap,

    // palette (if you use it elsewhere)
    palette,
  };

  return JSON.stringify({ v: 1, state: designState }, null, 2);
}
//const [selectedPortraitId, setSelectedPortraitId] = useState<string | null>(null);

/* ========= IS_RESCUE: ICON SLOTS (BEGIN) ========= */
// Simple id helper (avoid external deps)
function IS_uid() {
  return 'ic_' + Math.random().toString(36).slice(2, 10);
}

const IS_MAX_ICON_SLOTS = 4;

const [IS_iconSlots, IS_setIconSlots] = useState<string[]>(() => {
  try {
    const raw = localStorage.getItem('nf:iconSlots');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? Array.from({ length: IS_MAX_ICON_SLOTS }, (_, i) => arr[i] ?? '')
      : Array(IS_MAX_ICON_SLOTS).fill('');
  } catch {
    return Array(IS_MAX_ICON_SLOTS).fill('');
  }
});




function IS_persistIconSlots(next: string[]) {
  const trimmed = next.slice(0, IS_MAX_ICON_SLOTS);
  IS_setIconSlots(trimmed);
  try { localStorage.setItem('nf:iconSlots', JSON.stringify(trimmed)); } catch {}
}

const IS_iconSlotPickerRef = useRef<HTMLInputElement>(null);
const IS_pendingIconSlot = useRef<number | null>(null);

function IS_triggerIconSlotUpload(i: number) {
  IS_pendingIconSlot.current = i;
  IS_iconSlotPickerRef.current?.click();
}

function IS_fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function IS_onIconSlotFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.currentTarget.value = '';
  const idx = IS_pendingIconSlot.current;
  IS_pendingIconSlot.current = null;
  if (!file || idx == null) return;

  try {
    const dataUrl = await IS_fileToDataURL(file);
    IS_persistIconSlots(
      IS_iconSlots.map((s, i) => (i === idx ? dataUrl : s))
    );
  } catch (err: any) {
    alert(`Icon upload failed: ${err?.message || err}`);
  }
}

// Place icon onto canvas as an image-icon in your iconList
function IS_placeIconFromSlot(i: number) {
  const src = IS_iconSlots[i];
  if (!src) return;

  // iconList exists in your state already. This shape is compatible with your renderer:
  setIconList((prev: any[]) => [
    ...prev,
    {
      id: IS_uid(),
      type: 'image',
      imgUrl: src,
      // sensible defaults; your onIconMove/onIconResize will adjust afterward:
      x: 50, // percent
      y: 50, // percent
      w: 18, // percent width
      h: 18, // percent height
      locked: false,
      name: 'Logo/Icon',
    } as any,
  ]);

  // Make it active if you want
  try {
    setSelIconId?.(null);
    setMoveMode(true);
    setDragging('icon');
  } catch {}
}

function IS_clearIconSlot(i: number) {
  IS_persistIconSlots(IS_iconSlots.map((s, idx) => (idx === i ? '' : s)));
}
/* ========= IS_RESCUE: ICON SLOTS (END) ========= */

// Save current design under a name (localStorage)
function saveDesign(name: string) {
  if (!name || !name.trim()) { alert('Please name the design'); return; }
  const data = exportDesignJSON();
  const thumb = captureThumb();
  const payload = { v: 1, data, thumb: thumb ?? null, updatedAt: Date.now() };

  try {
    localStorage.setItem(`nf:design:${name}`, JSON.stringify(payload));

    const idx = readIndex();
    if (!idx.includes(name)) {
      idx.unshift(name);
      writeIndex(idx.slice(0, 200)); // keep last 200
    }
  } catch {
    alert('Save failed (localStorage full?)');
  }
}

// Load design by name (from localStorage)
function loadDesign(name: string) {
  try {
    const raw = localStorage.getItem(`nf:design:${name}`);
    if (!raw) { alert('Design not found'); return; }
    const j = JSON.parse(raw);
    if (!j || j.v !== 1 || !j.data) { alert('Corrupt design'); return; }
    importDesignJSON(j.data);
  } catch { alert('Load failed'); }
}

// List saved design names (newest first)
function listDesignNames(): string[] {
  return readIndex();
}

// Delete saved design
function deleteDesign(name: string) {
  try {
    localStorage.removeItem(`nf:design:${name}`);
    writeIndex(readIndex().filter(n => n !== name));
  } catch {}
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  requestAnimationFrame(() => {
    try { document.body.removeChild(a); } catch {}
    URL.revokeObjectURL(url);
  });
}




// ===== CLEAN EXPORT (PNG + JPG) — no UI, correct fonts =====

// ===== EXPORT: PNG (fonts + hide UI) =====
function twoRaf(): Promise<void> {
  return new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r()))
  );
}
// ===== EXPORT BEGIN (used by top-right Export button) =====
async function exportArtboardClean(art: HTMLElement, format: 'png' | 'jpg') {
  // Determine the root element that holds the CSS filters/grading
  const exportRoot =
    (art.closest?.('[data-export-root="true"]') as HTMLElement) ||
    (document.getElementById('export-root') as HTMLElement) ||
    art;

  try {
    if (!art) {
      alert('Artboard not ready');
      return;
    }

    // 1️⃣ Hide all UI / bounding boxes / grids / handles
   (window as any).__HIDE_UI_EXPORT__ = true;

// ✅ DO NOT toggle hideUiForExport here.
// In your app, hideUiForExport is hiding real layers (flares/graphics/3D/effects),
// not just UI. We'll rely on the filter() to remove UI instead.
  await new Promise(r => setTimeout(r, 150));
 

    // 2️⃣ Ensure local fonts load
    const families = [
      headlineFamily,
      head2Family,
      bodyFamily,
      subtagFamily,
      venueFamily,
    ].filter(Boolean);
    
    try {
      const uniq = Array.from(new Set(families));
      await Promise.all(
        uniq.flatMap(f => [
          (document as any).fonts?.load?.(`400 16px "${f}"`),
          (document as any).fonts?.load?.(`700 16px "${f}"`),
        ])
      );
      await (document as any).fonts?.ready;
    } catch (e) {

    }

    // 3️⃣ 🔥 CAPTURE COMPUTED STYLES (Type-Safe Version)
    // We cast to 'any' to allow 'WebkitBackdropFilter' which isn't in the standard TS Declaration type
    const exportStyle = getComputedStyle(exportRoot);
    const forcedStyle: any = {
      filter: exportStyle.filter,
      webkitFilter: exportStyle.filter,
      backdropFilter: (exportStyle as any).backdropFilter,
      WebkitBackdropFilter: (exportStyle as any).backdropFilter || (exportStyle as any).WebkitBackdropFilter,
      transform: exportStyle.transform,
    };

    // 4️⃣ Render artboard with forced styles
    const pngData = await htmlToImage.toPng(exportRoot, {
      cacheBust: true,
      backgroundColor: '#000',
      style: forcedStyle, // ✅ Injects grading into the renderer
      filter: (node: HTMLElement) => {
        const el = node as HTMLElement;
        if (!el) return true;

        const skip =
          el.dataset?.nonexport === 'true' ||
          el.classList?.contains('debug-grid') ||
          el.classList?.contains('bounding-box') ||
          el.classList?.contains('text-bounding') ||
          el.classList?.contains('text-outline') ||
          el.classList?.contains('highlight-box') ||
          el.classList?.contains('drag-handle') ||
          el.classList?.contains('resize-handle') ||
          el.classList?.contains('portrait-handle') ||
          el.classList?.contains('portrait-bounding') ||
          el.classList?.contains('portrait-outline') ||
          el.classList?.contains('portrait-border') ||
          el.classList?.contains('portrait-slot') ||
          el.classList?.contains('overlay-grid') ||
          el.tagName === 'BUTTON' ||
          el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA';

        return !skip;
      },
    });

    // 5️⃣ Convert to JPG if needed
    let dataUrl = pngData;
    if (format === 'jpg') {
      const img = new Image();
      img.src = pngData;
      await new Promise(res => (img.onload = res));
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      dataUrl = c.toDataURL('image/jpeg', 0.95);
    }

    // 6️⃣ Restore UI
    (window as any).__HIDE_UI_EXPORT__ = false;
    //setHideUiForExport(prevHide);

    // 7️⃣ Trigger download
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = dataUrl;
    a.download = `nightlife_export_${stamp}.${format}`;
    a.click();
    
  } catch (err) {
    (window as any).__HIDE_UI_EXPORT__ = false;

    // ✅ no-op: we never changed hideUiForExport
    alert('Export failed — check console.');
  }
}
// ===== EXPORT END (used by top-right Export button) =====


// ===== DESIGN STORAGE (END) =====

// ======================= BRAND KIT (FULL BLOCK) =======================
// Types (inline + simple)
type BrandKitV1 = {
  _kind: 'nightlife-brandkit';
  version: 1;
  createdAt: string;
  fonts: {
    detailsFamily: string;
    headlineFamily: string;
    bodyFamily: string;
    venueFamily: string;
    subtagFamily: string;
  };
  colors: {
    headlineFill: string;     // textFx.color
    headlineGradFrom: string; // textFx.gradFrom
    headlineGradTo: string;   // textFx.gradTo
    detailsColor: string;     // bodyColor
    venueColor: string;       // venueColor
    subtagBgColor: string;    // subtagBgColor
    subtagTextColor: string;  // subtagTextColor
  };
  // optional single logo embedded as DataURL
  logoDataUrl?: string;
};

// ---- Build snapshot from current UI state ----
function buildBrandKitSnapshot(): BrandKitV1 {
  return {
    _kind: 'nightlife-brandkit',
    version: 1,
    createdAt: new Date().toISOString(),
    fonts: {
      headlineFamily,
      bodyFamily,
      detailsFamily,
      venueFamily,
      subtagFamily,
    },
    colors: {
      headlineFill: textFx.color,
      headlineGradFrom: textFx.gradFrom,
      headlineGradTo: textFx.gradTo,
      detailsColor: bodyColor,
      venueColor,
      subtagBgColor,
      subtagTextColor,
    },
    // if your current logoUrl is a data URL, include it in the kit; otherwise omit
    logoDataUrl: (typeof logoUrl === 'string' && logoUrl.startsWith('data:image/')) ? logoUrl : undefined,
  };
}

// ---- Parse & validate a brand kit file ----
function parseBrandKit(raw: string): BrandKitV1 {
  const parsed = JSON.parse(raw);
  if (!parsed || parsed._kind !== 'nightlife-brandkit') {
    throw new Error('Not a Nightlife Flyers brand kit file');
  }
  if (parsed.version !== 1) {
    throw new Error(`Unsupported brand kit version: ${parsed.version}`);
  }
  // minimal shape checks
  if (!parsed.fonts || !parsed.colors) {
    throw new Error('Missing fonts/colors in kit');
  }
  return parsed as BrandKitV1;
}

// ---- Apply the kit to the current design (sets state) ----
function applyBrandKitFromFile(kit: BrandKitV1) {
  // Fonts
  if (kit.fonts) {
    setHeadlineFamily(kit.fonts.headlineFamily ?? headlineFamily);
    setBodyFamily(kit.fonts.bodyFamily ?? bodyFamily);
    setVenueFamily(kit.fonts.venueFamily ?? venueFamily);
    setSubtagFamily(kit.fonts.subtagFamily ?? subtagFamily);
  }

  // Colors
  if (kit.colors) {
    setTextFx((prev: any) => ({
      ...prev,
      color: kit.colors.headlineFill ?? prev.color,
      gradFrom: kit.colors.headlineGradFrom ?? prev.gradFrom,
      gradTo: kit.colors.headlineGradTo ?? prev.gradTo,
    }));
    setBodyColor(kit.colors.detailsColor ?? bodyColor);
    setVenueColor(kit.colors.venueColor ?? venueColor);
    setSubtagBgColor(kit.colors.subtagBgColor ?? subtagBgColor);
    setSubtagTextColor(kit.colors.subtagTextColor ?? subtagTextColor);
  }

  // Optional embedded logo
  // Optional embedded logo (TS-safe)
if (typeof kit.logoDataUrl === 'string' && kit.logoDataUrl.startsWith('data:image/')) {
  const logo: string = kit.logoDataUrl;

  setLogoLibrary((prev) => {
    const safePrev: string[] = Array.isArray(prev)
      ? prev.filter((x): x is string => typeof x === 'string')
      : [];

    if (safePrev.includes(logo)) return safePrev;

    const next: string[] = [...safePrev, logo];
    try { localStorage.setItem('nf:logoLibrary', JSON.stringify(next)); } catch {}
    return next;
  });

  try { setLogoUrl(logo); } catch {}
}

}

// ---- Download current Brand Kit ----
function downloadBrandKitFile() {
  const kit = buildBrandKitSnapshot();
  const blob = new Blob([JSON.stringify(kit, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = URL.createObjectURL(blob);
  a.download = `brandkit_${stamp}.nfbk.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

// ---- Upload/Load a Brand Kit from disk ----
function onUploadBrandKitFile(e: React.ChangeEvent<HTMLInputElement>) {
  const f = e.target.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const kit = parseBrandKit(String(r.result));
      applyBrandKitFromFile(kit);
      alert('Brand kit loaded ✓');
    } catch (err: any) {
      alert(`Invalid brand kit: ${err?.message || err}`);
    } finally {
      e.currentTarget.value = '';
    }
  };
  r.readAsText(f);
}
// ===================== /BRAND KIT (FULL BLOCK) =====================

function onBrandLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
  const f = e.target.files?.[0];
  if (!f) return;

  // Reject very large uploads
  if (f.size > 15 * 1024 * 1024) {
    alert('Please upload an image under 15MB.');
    e.currentTarget.value = '';
    return;
  }

  // Disallow SVG (security & consistency)
  if (f.type === 'image/svg+xml') {
    alert('SVG not supported. Please upload PNG or JPG.');
    e.currentTarget.value = '';
    return;
  }

  const r = new FileReader();
  r.onload = () => {
    const dataUrl = String(r.result || '');
    setLogoUrl(dataUrl);
  };
  r.readAsDataURL(f);
  e.currentTarget.value = '';
}



// ==== PERF: RAF throttle helpers (ADD ABOVE return) =========================
function useRafThrottle<T extends (...args: any[]) => void>(fn: T) {
  const frame = React.useRef<number | null>(null);
  const lastArgs = React.useRef<any[] | null>(null);

  React.useEffect(() => {
    return () => { if (frame.current != null) cancelAnimationFrame(frame.current); };
  }, []);

  return React.useCallback((...args: any[]) => {
    lastArgs.current = args;
    if (frame.current != null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (lastArgs.current) fn(...(lastArgs.current as any[]));
    });
  }, [fn]);
}


const onShapeMoveRaf     = useRafThrottle((id: string, x: number, y: number) => { 
  if (isLocked('shape', id)) return; 
  updateShape(id, { x, y }); });

const onIconMoveRaf = useRafThrottle((id: string, x: number, y: number) => {
  if (isLocked('icon', id)) return;
  updateIcon(id, { x, y });
});



const onEmojiMove = React.useCallback(
  (id: string, x: number, y: number) => {
    const updated = emojis[format].map(e =>
      e.id === id ? { ...e, x, y } : e
    );
    setEmojis(format, updated);
  },
  [emojis, format, setEmojis]
);


const onBgMoveRaf = useRafThrottle((x: number, y: number) => {
  setBgPosX(x);
  setBgPosY(y);
});
const onLogoMoveRaf      = useRafThrottle((x: number, y: number) => { setLogoX(x); setLogoY(y); });
const onPortraitMoveRaf  = useRafThrottle((x: number, y: number) => { setPortraitX(x); setPortraitY(y); });


// ===== STORAGE SAFETY HELPERS (ADD ABOVE "/* SUBTAG: persist per-format position/rotation whenever it changes */") =====
function isQuotaError(err: any) {
  return err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
}

/** Safely write to localStorage. If quota is exceeded, prune heavy keys, then retry once. */
function safeLocalSet(key: string, value: string, pruneKeys: string[] = []) {
  try {
    localStorage.setItem(key, value);
    return;
  } catch (err: any) {
    if (!isQuotaError(err)) return;
    for (const k of pruneKeys) {
      try { localStorage.removeItem(k); } catch {}
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      alert('Storage is full. Use "Project → Clear Storage" or avoid saving large images.');
    }
  }
}

// ===== /STORAGE SAFETY HELPERS =====


/* SUBTAG: persist per-format position/rotation whenever it changes */
React.useEffect(() => {
  subtagCacheRef.current[format as 'square' | 'story'] = {
    x: subtagX,
    y: subtagY,
    rotate: subtagRotate,
  };
}, [subtagX, subtagY, subtagRotate, format]);


// --- SUBTAG: keep per-format position cached
React.useEffect(() => {
  // initialize if missing
  const fmt = format as 'square' | 'story';
  if (!subtagCacheRef.current[fmt]) {
    subtagCacheRef.current[fmt] = { x: subtagX, y: subtagY, rotate: subtagRotate };
    return;
  }
  // update live cache when user edits
  subtagCacheRef.current[fmt] = { x: subtagX, y: subtagY, rotate: subtagRotate };
}, [format, subtagX, subtagY, subtagRotate]);

// === DUMMY PORTRAIT CANVAS REF + ALIGNMENT (ADD ABOVE RETURN) ===
const portraitCanvasRef = useRef<HTMLDivElement>(null);
// === /DUMMY PORTRAIT CANVAS REF + ALIGNMENT ===

// === SYNC DUMMY PORTRAIT CANVAS TRANSFORM TO ARTBOARD ===
useEffect(() => {
  function syncTransform() {
    const art = artRef.current;
    const pc = portraitCanvasRef.current;
    if (!art || !pc) return;

    // Copy the Artboard’s transform (scale, translate, etc.)
    const transform = getComputedStyle(art).transform;
    pc.style.transform = transform !== 'none' ? transform : '';
    pc.style.transformOrigin = getComputedStyle(art).transformOrigin;
  }

  syncTransform();
  // Keep it updated dynamically
  const observer = new MutationObserver(syncTransform);
  const art = artRef.current;
  if (art) observer.observe(art, { attributes: true, attributeFilter: ['style'] });

  window.addEventListener('resize', syncTransform);
  return () => {
    observer.disconnect();
    window.removeEventListener('resize', syncTransform);
  };
}, [format]);
// === /SYNC DUMMY PORTRAIT CANVAS TRANSFORM TO ARTBOARD ===


// === PORTRAIT LAYER BEGIN (Consolidated: Handles Portraits AND Flares) ===
const portraitCanvas = React.useMemo(() => {
  const list = portraits[format] || [];

  const classify = (item: any) => {
    const id = String(item?.id || "");
    const isLogo = id.startsWith("logo_") || !!item?.isLogo;
    const isFlare = !!item?.isFlare;
    const isSticker = !!item?.isSticker;
    return { isLogo, isFlare, isSticker };
  };

  const selectItem = (pid: string) => {
    const store = useFlyerState.getState();
    const liveList = (store as any).portraits?.[format] || [];
    const sel = liveList.find((x: any) => x.id === pid);

    const { isLogo, isFlare, isSticker } = classify(sel);

    const panel = isLogo ? "logo" : isFlare || isSticker ? "icons" : "portrait";
    const target = isLogo ? "logo" : isFlare || isSticker ? "icon" : "portrait";

    const isSame = (store as any).selectedPortraitId === pid;
    if (!isSame) {
      store.setSelectedPortraitId(pid);
    }

    if ((store as any).selectedPanel !== panel) {
      store.setSelectedPanel(panel);
    }
    if ((store as any).moveTarget !== target) {
      store.setMoveTarget(target);
    }

    // ✅ HARD FIX: something else is flipping panel back to "portrait" AFTER selection.
    // Re-assert icons mode on next frame (wins last-write).
    if (isFlare || isSticker) {
      requestAnimationFrame(() => {
        const s = useFlyerState.getState();
        if ((s as any).selectedPortraitId === pid) {
          s.setSelectedPanel("icons");
          s.setMoveTarget("icon");
        }
      });
    }
  };

  const canDrag = (item: any) => {
    const store = useFlyerState.getState();
    const mt = (store as any).moveTarget;

    const { isLogo, isFlare, isSticker } = classify(item);

    if (isLogo) return mt === "logo";
    if (isFlare || isSticker) return mt === "icon";
    return mt === "portrait";
  };

  const backLayer = list.filter((p: any) => !!p?.isFlare || !!p?.isSticker);
  const frontLayer = list.filter(
    (p: any) => !(p as any).isFlare && !(p as any).isSticker
  );

  const renderItem = (p: any, i: number, baseZ: number) => {
    const isSelected = selectedPortraitId === p.id;
    const locked = !!p.locked;
    const { isFlare, isSticker } = classify(p);
    const clickThrough = locked;
    const shadowBlur = Number((p as any).shadowBlur ?? 0);
    const shadowAlpha = Number((p as any).shadowAlpha ?? 0.5);
    const shadowOffset = Math.round(shadowBlur * 0.25);
    const shadowFilter =
      shadowBlur > 0
        ? `drop-shadow(0 ${shadowOffset}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha}))`
        : "none";
    const unlocking = unlockingIds.includes(p.id);

    const triggerUnlock = () => {
      if (!locked) return;
      setUnlockingIds((prev) => (prev.includes(p.id) ? prev : [...prev, p.id]));
      window.setTimeout(() => {
        const s = useFlyerState.getState();
        s.updatePortrait(format, p.id, { locked: false });
        setUnlockingIds((prev) => prev.filter((id) => id !== p.id));
      }, 180);
    };

    // ✅ 1. Determine if this specific item is moving
    // Checking both global store state and local isSelected
    const isDragging = dragging === "portrait" && isSelected;

    return (
      <React.Fragment key={p.id}>
        <div
          className="absolute"
          data-portrait-area="true"
          draggable={false}
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            if (clickThrough) return;
            e.preventDefault();
            e.stopPropagation();
            selectItem(p.id);
          }}
          onPointerDown={(e) => {
            if (clickThrough) return;
            e.preventDefault();
            e.stopPropagation();
            selectItem(p.id);

            if (locked) return;
            if (!canDrag(p)) return;

            const el = e.currentTarget as HTMLElement;
            try {
              el.setPointerCapture(e.pointerId);
            } catch {}

            el.dataset.pdrag = "1";
            el.dataset.px = String(e.clientX);
            el.dataset.py = String(e.clientY);
            el.dataset.sx = String(p.x);
            el.dataset.sy = String(p.y);

            const root = document.getElementById("portrait-layer-root");
            if (root) {
              const b = root.getBoundingClientRect();
              el.dataset.cw = String(b.width);
              el.dataset.ch = String(b.height);
            }

            el.style.setProperty("--pdx", "0px");
            el.style.setProperty("--pdy", "0px");
          }}
          onPointerMove={(e) => {
            e.preventDefault();

            const el = e.currentTarget as HTMLElement;
            if (el.dataset.pdrag !== "1") return;

            const startX = Number(el.dataset.px || "0");
            const startY = Number(el.dataset.py || "0");
            el.style.setProperty("--pdx", `${e.clientX - startX}px`);
            el.style.setProperty("--pdy", `${e.clientY - startY}px`);
          }}
          onPointerUp={(e) => {
            e.preventDefault();

            const el = e.currentTarget as HTMLElement;
            if (el.dataset.pdrag !== "1") return;
            el.dataset.pdrag = "0";

            const dx = e.clientX - Number(el.dataset.px || "0");
            const dy = e.clientY - Number(el.dataset.py || "0");
            const cw = Number(el.dataset.cw || "1");
            const ch = Number(el.dataset.ch || "1");

            const finalX = Number(el.dataset.sx || "0") + (dx / cw) * 100;
            const finalY = Number(el.dataset.sy || "0") + (dy / ch) * 100;

            useFlyerState.getState().updatePortrait(format, p.id, {
              x: finalX,
              y: finalY,
            });

            el.style.setProperty("--pdx", "0px");
            el.style.setProperty("--pdy", "0px");
            try {
              el.releasePointerCapture(e.pointerId);
            } catch {}
          }}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform:
              "translate3d(var(--pdx, 0px), var(--pdy, 0px), 0) translate(-50%, -50%)",
            pointerEvents: clickThrough ? "none" : "auto",
            cursor: clickThrough
              ? "default"
              : locked
              ? "default"
              : canDrag(p)
              ? "grab"
              : "default",
            zIndex: baseZ + i,

            // ✅ FIX: making the duplicate highlight invisible while moving
            filter:
              isSelected && !isDragging ? "drop-shadow(0 0 4px #3b82f6)" : "none",

            userSelect: "none",
            touchAction: "none",
          }}
        >
          {p.url && (
            <img
              src={p.url}
              alt=""
              draggable={false}
              onDragStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                transform: `scale(${p.scale ?? 1}) rotate(${(p as any).rotation ?? 0}deg)`,
                maxWidth: "140vh",
                maxHeight: "140vh",
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",
                willChange: "transform",
                mixBlendMode: ((p as any).blendMode ?? "normal") as any,
                opacity: (p as any).opacity ?? 1,
                filter: shadowFilter,
              }}
            />
          )}
          {(p as any).showLabel && (p as any).label && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "85%",
                transform: "translate(-50%, -6px)",
                padding: "2px 6px",
                borderRadius: 999,
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                opacity: 0.9,
              }}
            >
              {(p as any).label}
            </div>
          )}
        </div>
        {locked && (
          <button
            type="button"
            aria-label="Unlock"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerUnlock();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: baseZ + i + 2,
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.22)",
              background:
                "linear-gradient(180deg, rgba(20,20,26,0.95), rgba(6,6,10,0.9))",
              boxShadow:
                "0 8px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: unlocking ? 0 : 1,
              transformOrigin: "center",
              transition: "transform 160ms ease, opacity 160ms ease",
              ...(unlocking ? { transform: "translate(-50%, -50%) scale(0.7)" } : {}),
              pointerEvents: "auto",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 11V8a5 5 0 0 1 10 0"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <rect
                x="5.2"
                y="11"
                width="13.6"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
            </svg>
          </button>
        )}
      </React.Fragment>
    );
  };

  return (
    <div
      id="portrait-layer-root"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {backLayer.map((p: any, i: number) => renderItem(p, i, 10))}
      {frontLayer.map((p: any, i: number) => renderItem(p, i, 30))}
    </div>
  );
  // ✅ Added dragging to dependencies to ensure UI refreshes on move start/end
}, [portraits, format, selectedPortraitId, dragging, unlockingIds]);




// === PORTRAIT LAYER END (Consolidated: Handles Portraits AND Flares) ===


// === FLARE OVERLAY LAYER (Dynamic from state) ===
const portraitList = portraits[format] ?? [];

///////filter 
<svg width="0" height="0" className="absolute">
  <filter id="flareKeyBlack" colorInterpolationFilters="sRGB">
    {/* Build a mask alpha from luminance */}
    <feColorMatrix
      in="SourceGraphic"
      type="matrix"
      values="
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0.2126 0.7152 0.0722 0 0
      "
      result="lumAlpha"
    />
    {/* Crush darks harder -> transparent */}
    <feComponentTransfer in="lumAlpha" result="alphaBoost">
      <feFuncA type="linear" slope="3.4" intercept="-0.28" />
    </feComponentTransfer>
    {/* Apply that alpha to the original image */}
    <feComposite in="SourceGraphic" in2="alphaBoost" operator="in" />
  </filter>
</svg>


const flareCanvas = (
  <div
    id="flare-layer-root"
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      overflow: "hidden",
      zIndex: 30, // above portraits if you want
    }}
  >
    {(portraits?.[format] || [])
      .filter((p) => Boolean((p as any).isFlare))
      .map((p) => {
        const isSelected = selectedPortraitId === p.id;
        const locked = !!p.locked;

        return (
          <div
            key={p.id}
            className="absolute"
            onPointerDown={(e) => {
              if (locked) return;

              e.preventDefault();
              e.stopPropagation();

              const el = e.currentTarget as HTMLElement;

              // capture pointer
              try {
                el.setPointerCapture(e.pointerId);
              } catch {}

              // init drag
              el.dataset.pdrag = "1";
              el.dataset.isMoved = "0";
              el.dataset.px = String(e.clientX);
              el.dataset.py = String(e.clientY);
              el.dataset.sx = String(p.x);
              el.dataset.sy = String(p.y);

              const root = document.getElementById("flare-layer-root");
              if (root) {
                const b = root.getBoundingClientRect();
                el.dataset.cw = String(b.width);
                el.dataset.ch = String(b.height);
              } else {
                el.dataset.cw = "0";
                el.dataset.ch = "0";
              }

              // reset offsets
              el.style.setProperty("--pdx", "0px");
              el.style.setProperty("--pdy", "0px");
            }}
            onPointerMove={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (el.dataset.pdrag !== "1") return;

              const px = Number(el.dataset.px || "0");
              const py = Number(el.dataset.py || "0");
              const dx = e.clientX - px;
              const dy = e.clientY - py;

              // threshold to avoid click jitter
              if (el.dataset.isMoved === "0" && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                el.dataset.isMoved = "1";
              }

              if (el.dataset.isMoved === "1") {
                el.style.setProperty("--pdx", `${dx}px`);
                el.style.setProperty("--pdy", `${dy}px`);
              }
            }}
            onPointerUp={(e) => {
  const el = e.currentTarget as HTMLElement;
  if (el.dataset.pdrag !== "1") return;

  el.dataset.pdrag = "0";

  // click vs drag
  if (el.dataset.isMoved === "1") {
    const startLeft = Number(el.dataset.sx || "0");
    const startTop = Number(el.dataset.sy || "0");
    const cw = Number(el.dataset.cw || "0");
    const ch = Number(el.dataset.ch || "0");

    const px = Number(el.dataset.px || "0");
    const py = Number(el.dataset.py || "0");
    const dx = e.clientX - px;
    const dy = e.clientY - py;

    if (cw > 5 && ch > 5) {
      const finalPctX = startLeft + (dx / cw) * 100;
      const finalPctY = startTop + (dy / ch) * 100;

      // reset visual
      el.style.setProperty("--pdx", "0px");
      el.style.setProperty("--pdy", "0px");

      // commit
      useFlyerState.getState().updatePortrait(format, p.id, {
        x: finalPctX,
        y: finalPctY,
      });
    }
  }

  // ✅ ALWAYS select on pointer up (works for click and after drag)
  // ✅ BUT route panel + moveTarget based on type (NOT always portrait)
  const store = useFlyerState.getState();

  if (!isSelected) store.setSelectedPortraitId(p.id);

  const id = String(p?.id || "");
  const isLogo = id.startsWith("logo_") || !!(p as any)?.isLogo;
  const isFlare = !!(p as any)?.isFlare;
  const isSticker = !!(p as any)?.isSticker;

  store.setSelectedPanel(isLogo ? "logo" : isFlare || isSticker ? "icons" : "portrait");
  store.setMoveTarget(isLogo ? "logo" : isFlare || isSticker ? "icon" : "portrait");

  try {
    el.releasePointerCapture(e.pointerId);
  } catch {}
}}

            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: "auto",
              height: "auto",
              transform: "translate3d(var(--pdx, 0px), var(--pdy, 0px), 0px) translate(-50%, -50%)",
              willChange: "transform",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: !locked && isSelected ? "auto" : "none",
              cursor: !locked && isSelected ? "grab" : "default",
              touchAction: !locked && isSelected ? "none" : "auto",

              // optional selection glow (safe, no controls)
              filter: isSelected ? "drop-shadow(0 0 10px rgba(255,255,255,0.22))" : "none",
            }}
          >
            <img
              src={p.url}
              alt=""
              draggable={false}
              style={{
                transform: `scale(${p.scale ?? 1})`,
                maxWidth: "140vh",
                maxHeight: "140vh",
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",

                // ✅ blend + opacity
                mixBlendMode: ((p as any).blendMode ?? "screen") as any,
                opacity: (p as any).opacity ?? 1,
              }}
            />
          </div>
        );
      })}
  </div>
);



// ===== EXPORT HELPERS (DROP THIS BLOCK RIGHT ABOVE `return (`) =====
// 1) Helper: temporarily disable cross-origin stylesheets (e.g. Google Fonts)
const withExternalStylesDisabled = async <T,>(fn: () => Promise<T>): Promise<T> => {
  const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  const toDisable: HTMLLinkElement[] = [];

  const isCrossOrigin = (href: string | null) => {
    if (!href) return false;
    try {
      const u = new URL(href, location.href);
      return u.origin !== location.origin;
    } catch {
      return false;
    }
  };

  for (const link of links) {
    if (isCrossOrigin(link.href) || /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(link.href || '')) {
      if (!link.disabled) {
        link.disabled = true;
        toDisable.push(link);
      }
    }
  }

  try {
    const result = await fn();
    return result;
  } finally {
    // re-enable
    for (const link of toDisable) {
      link.disabled = false;
    }
  }
};

// 2) Common opts: skipFonts prevents font inlining (avoids cssRules reads)
//    fontEmbedCss: '' hard-disables font embedding path in older versions.
const buildExportOpts = (exportType: 'png' | 'jpg', exportScale = 2, bg?: string) => ({
  cacheBust: true,
  pixelRatio: exportScale,
  quality: exportType === 'jpg' ? 0.95 : 1,
  backgroundColor: bg || undefined,
  // CRITICAL: these two avoid the cssRules SecurityError
  skipFonts: true as const,
  fontEmbedCss: '' as const,
  // Hide any tools/overlays you mark with data-nonexport="true"
  filter: (node: HTMLElement) => !node.closest?.('[data-nonexport="true"]'),
});


// 3) Export handlers (PNG / JPG)
const doExport = async (exportType: 'png' | 'jpg') => {
  // Artboard root you already have
  const el = artRef?.current as HTMLElement | null;
  if (!el) return;

  // Read your UI state for scale/background if you have them; fallback safe defaults:
  const scale = typeof (window as any).exportScale === 'number' ? (window as any).exportScale : 2;
  const bg = (window as any).exportBgColor || undefined;

  const opts = buildExportOpts(exportType, scale, bg);

  // Run with external sheets disabled to prevent SecurityError
  const dataUrl = await withExternalStylesDisabled(async () => {
    if (exportType === 'jpg') {
      return await htmlToImage.toJpeg(el, opts as any);
    }
    return await htmlToImage.toPng(el, opts as any);
  });

  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = dataUrl;
  a.download = `nightlife_export_${stamp}.${exportType}`;
  a.click();
};

const exportPNG = async () => { await doExport('png'); };
const exportJPG = async () => { await doExport('jpg'); };
// ===== /EXPORT HELPERS =====

React.useEffect(() => {
  document.querySelectorAll<HTMLElement>('.pointer-events-auto, [title="Resize"], [title="Lock"], [title="Delete portrait"]').forEach(
    (el) => el.setAttribute('data-nonexport', 'true')
  );
}, []);


// === Smooth position animation helper (for format transitions) ===


function animateDomMove(el: HTMLElement | null, dx: number, dy: number, duration = 800) {
  if (!el) return;
  el.style.transition = `transform ${duration}ms cubic-bezier(.25,.8,.25,1)`;
  el.style.transform = `translate(${dx}px, ${dy}px)`;
  const cleanup = () => {
    el.style.transition = '';
    el.style.transform = '';
    el.removeEventListener('transitionend', cleanup);
  };
  el.addEventListener('transitionend', cleanup, { once: true });
}
// temporary guard if applyTemplate is declared higher than rootRef

// === PROJECT PORTABLE SAVE/LOAD (MASTER FIX) ===

  // ✅ 1. SAVE FUNCTION
  const handleSaveProject = async () => {
    try {
      // Capture ALL State
      const rawData = {
  version: "2.0",
  savedAt: new Date().toISOString(),

  // ✅ core
  format,

  // ✅ background
  bgUrl,
  bgUploadUrl,
  bgPosX, // keep the real name
  bgPosY,
  bgScale,
  bgBlur,

  // ✅ text content
  headline,
  head2,
  details,
  details2,
  venue,
  subtag,

  // ✅ font families (these are what you're missing on load)
  headlineFamily,
  head2Family,
  detailsFamily,
  details2Family,
  venueFamily,
  subtagFamily,

  // ✅ fx
  textFx: { ...textFx },
  head2Fx: { ...head2Fx },

  // ✅ positions / transforms
  headX, headY, headRotate,
  head2X, head2Y, head2Rotate,
  detailsX, detailsY, detailsRotate,
  details2X, details2Y, details2Rotate,
  venueX, venueY, venueRotate,
  subtagX, subtagY, subtagRotate,

  // ✅ legacy single portrait (if you still use it anywhere)
  portraitUrl,
  portraitX, portraitY, portraitScale, portraitLocked,

  // ✅ logo
  logoUrl,
  logoX, logoY, logoScale, logoRotate,

  // ✅ typography params
  lineHeight,
  textColWidth,
  headSizeAuto,
  headManualPx,
  headMaxPx,

  head2SizePx,
  head2LineHeight,
  head2Align,
  head2Alpha,

  detailsLineHeight,
  detailsAlign,
  bodyColor,
  bodySize,

  details2Size,
  details2LineHeight,
  details2Align,
  details2Color,

  venueSize,
  venueColor,
  venueAlign,
  venueLineHeight,

  subtagSize,
  subtagBgColor,
  subtagTextColor,
  subtagAlpha,

  // ✅ arrays
  shapes: shapes || [],
  icons: iconList || [],
  portraitSlots: portraitSlots || [],
  logoSlots: logoSlots || [],

  // ✅ IMPORTANT: save the FULL toggle objects, not only the current format
  subtagEnabled,        // Record<Format, boolean>
  headline2Enabled,     // Record<Format, boolean>
  details2Enabled,      // Record<Format, boolean>

  // ✅ grading
  hue, haze, grade, leak, vignette, clarity, variety, palette, genStyle, genPrompt,

  // ✅ Zustand objects
  portraits: useFlyerState.getState().portraits,
  emojis: useFlyerState.getState().emojis,
};

      
      // Normalize Images (Async Blob conversion)
      const cleanData = await normalizeImagesForSave(rawData);
      const jsonString = JSON.stringify({ state: cleanData }, null, 2);

      
      // Download
      //const jsonString = JSON.stringify(cleanData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
      link.href = url;
      link.download = `flyer-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      

    } catch (e) {

      alert("Could not save project. Check console.");
    }
  };

// ✅ HANDLER: Upload from "Choose a Vibe" section
  const handleUploadDesignFromVibe = async (file: File) => {
    try {
      const raw = await file.text();
      
      // Pass the raw text string directly to your main loader
      importDesignJSON(raw);

    } catch (err) {

      alert("That JSON couldn't be loaded.");
    }
  };

// ✅ HANDLER: Export Design to JSON
  const handleExportJSON = () => {
    try {
      const json = useFlyerState.getState().exportDesign();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `flyer-design-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {

      alert("Could not export design.");
    }
  };

 // ✅ LOAD FUNCTION (Updates UI + Global Store)
  const importDesignJSON = (json: string) => {
    // 1. Stop loading spinner
    setLoadingStartup(false);

    // ⚡️ HELPER: prevents crashing if a value is missing in the JSON
    // We define it here so it's available for the rest of the function
    const applyIfDefined = <T,>(val: T | undefined | null, setter: (v: T) => void) => {
      if (val !== undefined && val !== null) setter(val);
    };

    try {
      const raw = JSON.parse(json);
      const rawState = raw.state || raw;

      // 🔥 CRITICAL: Detach Template System so it doesn't override us
      setTemplateId(null);
      setActiveTemplate(null);
      setTemplateBase(null);
      setPendingFormat(null);
      setFadeOut(false);

      // 2. Normalize Data (fixes old save formats)
      const data = normalizeDesignJson(rawState, format);


      // ✅ 3. SYNC TO GLOBAL STORE (This requires your flyerState changes)
      if (useFlyerState.getState().importDesign) {
         useFlyerState.getState().importDesign(data);
      }

      // 4. Set Format FIRST
      if (data.format) {
        setFormat(data.format);
        if (artRef.current) (artRef.current as any)._lastFormat = data.format;
      }

      // =========================================================
      // ✅ 5. Restore UI Local State (FULL RESTORE)
      // =========================================================
      
      applyIfDefined(data.bgUrl, setBgUrl);
      applyIfDefined(data.bgUploadUrl, setBgUploadUrl);

      applyIfDefined(data.headline, setHeadline);
      applyIfDefined(data.head2, setHead2);
      applyIfDefined(data.details, setDetails);
      applyIfDefined(data.details2, setDetails2);
      applyIfDefined(data.venue, setVenue);
      applyIfDefined(data.subtag, setSubtag);

      // ✅ restore font families
      applyIfDefined(data.headlineFamily, setHeadlineFamily);
      applyIfDefined(data.head2Family, setHead2Family);
      applyIfDefined(data.detailsFamily, setDetailsFamily);
      applyIfDefined(data.details2Family, setDetails2Family);
      applyIfDefined(data.venueFamily, setVenueFamily);
      applyIfDefined(data.subtagFamily, setSubtagFamily);

      // ✅ restore fx
      applyIfDefined(data.textFx, (v: any) => setTextFx(v));
      applyIfDefined(data.head2Fx, (v: any) => setHead2Fx({ ...(v || {}), gradient: false }));

      // ✅ restore toggles
      // ✅ FIX: Pass 'format' as the first argument
      applyIfDefined(data.subtagEnabled, (v: any) => setSubtagEnabled(format, v));
      applyIfDefined(data.headline2Enabled, (v: any) => setHeadline2Enabled(format, v));
      applyIfDefined(data.details2Enabled, (v: any) => setDetails2Enabled(format, v));

      // ✅ restore background
      applyIfDefined(data.bgPosX ?? data.bgX, setBgPosX);
      applyIfDefined(data.bgPosY ?? data.bgY, setBgPosY);
      applyIfDefined(data.bgScale, setBgScale);
      applyIfDefined(data.bgBlur, setBgBlur);

      // ✅ restore positions/rotations
      applyIfDefined(data.headX, setHeadX);
      applyIfDefined(data.headY, setHeadY);
      applyIfDefined(data.headRotate, setHeadRotate);

      applyIfDefined(data.head2X, setHead2X);
      applyIfDefined(data.head2Y, setHead2Y);
      applyIfDefined(data.head2Rotate, setHead2Rotate);

      applyIfDefined(data.detailsX, setDetailsX);
      applyIfDefined(data.detailsY, setDetailsY);
      applyIfDefined(data.detailsRotate, setDetailsRotate);

      applyIfDefined(data.details2X, setDetails2X);
      applyIfDefined(data.details2Y, setDetails2Y);
      applyIfDefined(data.details2Rotate, setDetails2Rotate);

      applyIfDefined(data.venueX, setVenueX);
      applyIfDefined(data.venueY, setVenueY);
      applyIfDefined(data.venueRotate, setVenueRotate);

      applyIfDefined(data.subtagX, setSubtagX);
      applyIfDefined(data.subtagY, setSubtagY);
      applyIfDefined(data.subtagRotate, setSubtagRotate);

      // ✅ restore logo
      applyIfDefined(data.logoUrl, setLogoUrl);
      applyIfDefined(data.logoX, setLogoX);
      applyIfDefined(data.logoY, setLogoY);
      applyIfDefined(data.logoScale, setLogoScale);
      applyIfDefined(data.logoRotate, setLogoRotate);

      // ✅ restore typography
      applyIfDefined(data.lineHeight, setLineHeight);
      applyIfDefined(data.textColWidth, setTextColWidth);

      applyIfDefined(data.headSizeAuto, setHeadSizeAuto);
      applyIfDefined(data.headManualPx, setHeadManualPx);
      applyIfDefined(data.headMaxPx, setHeadMaxPx);

      applyIfDefined(data.head2SizePx, setHead2SizePx);
      applyIfDefined(data.head2LineHeight, setHead2LineHeight);
      applyIfDefined(data.head2Align, setHead2Align);
      applyIfDefined(data.head2Alpha, setHead2Alpha);

      applyIfDefined(data.detailsLineHeight, setDetailsLineHeight);
      applyIfDefined(data.detailsAlign, setDetailsAlign);
      applyIfDefined(data.bodyColor, setBodyColor);
      applyIfDefined(data.bodySize, setBodySize);

      applyIfDefined(data.details2Size, setDetails2Size);
      applyIfDefined(data.details2LineHeight, setDetails2LineHeight);
      applyIfDefined(data.details2Align, setDetails2Align);
      applyIfDefined(data.details2Color, setDetails2Color);

      applyIfDefined(data.venueSize, setVenueSize);
      applyIfDefined(data.venueColor, setVenueColor);
      applyIfDefined(data.venueAlign, setVenueAlign);
      applyIfDefined(data.venueLineHeight, setVenueLineHeight);

      applyIfDefined(data.subtagSize, setSubtagSize);
      applyIfDefined(data.subtagBgColor, setSubtagBgColor);
      applyIfDefined(data.subtagTextColor, setSubtagTextColor);
      applyIfDefined(data.subtagAlpha, setSubtagAlpha);

      // ✅ restore grading
      applyIfDefined(data.hue, setHue);
      applyIfDefined(data.haze, setHaze);
      applyIfDefined(data.grade, setGrade);
      applyIfDefined(data.leak, setLeak);
      applyIfDefined(data.vignette, setVignette);
      applyIfDefined(data.clarity, setClarity);
      applyIfDefined(data.variety, setVariety);
      applyIfDefined(data.palette, setPalette);
      applyIfDefined(data.genStyle, setGenStyle);
      applyIfDefined(data.genPrompt, setGenPrompt);

      // =========================================================
      // 6. Restore Complex Objects (Arrays & Stores)
      // =========================================================

      // Restore Zustand Objects (Portraits/Emojis)
      // Restore Zustand Objects ONLY if importDesign() did NOT already do it
      const store = useFlyerState.getState();

      if (!store.importDesign) {
        if (data.portraits) {
          store.setPortraits("square", data.portraits.square || []);
          store.setPortraits("story", data.portraits.story || []);
        }

        if (data.emojis) {
          store.setEmojis("square", data.emojis.square || []);
          store.setEmojis("story", data.emojis.story || []);
        }
      }


      // Restore Arrays
      if (Array.isArray(data.portraitSlots)) setPortraitSlots(data.portraitSlots);
      if (Array.isArray(data.logoSlots)) setLogoSlots(data.logoSlots);
      if (data.shapes) setShapes(data.shapes);
      if (data.icons) setIconList(data.icons);

      // Restore Legacy Portrait Positions (if not covered above)
      applyIfDefined(data.portraitX, setPortraitX);
      applyIfDefined(data.portraitY, setPortraitY);
      applyIfDefined(data.portraitScale, setPortraitScale);

      // 7. Finish
      // ✅ only auto-open Templates if NO panel is currently selected
  // (prevents "re-opening" after the user manually closes it)
  if (useFlyerState.getState().selectedPanel == null) {
    useFlyerState.getState().setSelectedPanel("template");
  }

    } catch (err) {

      alert("Invalid or corrupted design file.");
    }
  };


// 🧹 Clear large cached items (backgrounds, portraits, etc.)
const clearHeavyStorage = () => {
  try {
    const heavyKeys = Object.keys(localStorage).filter(
      (k) =>
        k.includes("portrait") ||
        k.includes("background") ||
        k.includes("candidate") ||
        k.includes("logo")
    );
    heavyKeys.forEach((k) => localStorage.removeItem(k));
    alert(`🧹 Cleared ${heavyKeys.length} heavy cache items`);
  } catch (err) {

    alert("Failed to clear storage");
  }
};


// ⬇️ FULL BLOCK REPLACEMENT
//
// ======================================================================
// APPLY TEMPLATE → SESSION MERGE
// ----------------------------------------------------------------------
// RULES:
// 1. User edits ALWAYS override template defaults.
// 2. Only missing values fall back to template.
// 3. Both formats (square/story) maintain their own session copy.
// 4. No UI state is wiped. No resets. No overrides.
// 5. Safe long-term stable structure.
// ======================================================================

/* ============================================================================
   APPLY TEMPLATE — AGGRESSIVE RESET VERSION
   Ensures values from the previous format do not 'leak' into the new one.
   ============================================================================
*/
/* ============================================================================
   APPLY TEMPLATE — AGGRESSIVE RESET VERSION
   Ensures values from the previous format do not 'leak' into the new one.
   ============================================================================
*/
const templateBgScaleRef = React.useRef<number | null>(null);
const applyTemplate = React.useCallback(
  (
    tpl: TemplateSpec,
    opts?: {
      targetFormat?: Format;
      initialLoad?: boolean; 
    }
  ) => {
    const fmt: Format = opts?.targetFormat ?? format;

    // 1) GET TEMPLATE & SESSION DATA
    const variant: Partial<TemplateBase> =
      tpl.formats?.[fmt] ?? tpl.formats?.square ?? tpl.base ?? {};
    const incomingScale =
      typeof variant.bgScale === "number" ? variant.bgScale : 1.0;
    if (tpl.id === "latin_street_tropical") {
      console.log(
        "[applyTemplate] id=",
        tpl.id,
        "format=",
        fmt,
        "bgScale=",
        incomingScale,
        "raw=",
        (tpl.formats?.[fmt] as any)?.bgScale ?? null,
        "square=",
        (tpl.formats?.square as any)?.bgScale ?? null,
        "preview=",
        tpl.preview
      );
    }

    // ensure bg scale is available synchronously for any effects
    templateBgScaleRef.current = incomingScale;
    setBgScale(incomingScale);

    const store = useFlyerState.getState();
    const freshSession = store.session;
    const existing: Partial<TemplateBase> = freshSession[fmt] ?? {};

    // 2) MERGE
    const merged: Partial<TemplateBase> = opts?.initialLoad
      ? { ...variant, ...existing }
      : { ...existing, ...variant };

    // 3) SESSION: initialLoad should be authoritative and non-dirty
    if (opts?.initialLoad) {
      store.setSession((prev) => ({ ...prev, [fmt]: { ...merged } }));
      store.setSessionDirty((prev) => ({ ...prev, [fmt]: false }));
    } else {
      store.setSession((prev) => ({ ...prev, [fmt]: merged }));
      store.setSessionDirty((prev) => ({ ...prev, [fmt]: true }));
    }

    // 4) APPLY TO UI (With Explicit Fallbacks!)
    
    // --- TEXT CONTENT ---
    setHeadline(merged.headline ?? 'HEADLINE');
    setDetails(merged.details ?? 'Event Details');
    setVenue(merged.venue ?? 'Venue Name');
    setSubtag(merged.subtag ?? 'Subtag');
    setHead2(merged.head2line ?? '');
    setDetails2(merged.details2 ?? '');

    // --- POSITIONS ---
    setHeadX(merged.headX ?? 50);
    setHeadY(merged.headY ?? 20);
    setHead2X(merged.head2X ?? 50);
    setHead2Y(merged.head2Y ?? 30);
    setDetailsX(merged.detailsX ?? 50);
    setDetailsY(merged.detailsY ?? 80);
    setDetails2X(merged.details2X ?? 50);
    setDetails2Y(merged.details2Y ?? 85);
    setVenueX(merged.venueX ?? 50);
    setVenueY(merged.venueY ?? 90);
    setSubtagX(merged.subtagX ?? 50);
    setSubtagY(merged.subtagY ?? 10);
    setBgPosX(merged.bgPosX ?? (merged as any).bgX ?? 50);
    setBgPosY(merged.bgPosY ?? (merged as any).bgY ?? 50);
    setPortraitX(merged.portraitX ?? 50);
    setPortraitY(merged.portraitY ?? 50);
    setLogoX(merged.logoX ?? 6);
    setLogoY(merged.logoY ?? 85);

    // --- SCALES & ROTATIONS ---
    setHeadRotate(merged.headRotate ?? 0);
    setHead2Rotate(merged.head2Rotate ?? 0);
    setDetailsRotate(merged.detailsRotate ?? 0);
    setDetails2Rotate(merged.details2Rotate ?? 0);
    setVenueRotate(merged.venueRotate ?? 0);
    setSubtagRotate(merged.subtagRotate ?? 0);
    setPortraitScale(merged.portraitScale ?? 1);
    templateBgScaleRef.current = incomingScale;
    setBgScale(incomingScale);
    setLogoScale(merged.logoScale ?? 1);
    setBgBlur(merged.bgBlur ?? 0); 

    // --- STYLES & FONTS ---
    setHeadlineFamily(merged.headlineFamily ?? 'Inter');
    setHeadAlign((merged.headAlign as any) ?? 'center');
    setAlign((merged.align as any) ?? 'center');
    setLineHeight(merged.headlineLineHeight ?? merged.lineHeight ?? 0.9);
    setTextColWidth(merged.textColWidth ?? 80);
    
    setHeadSizeAuto(merged.headSizeAuto ?? false);
    setHead2SizePx(merged.head2Size ?? 40);
    setHead2Family(merged.head2Family ?? 'Bebas Neue');
    
    setHeadManualPx(merged.headlineSize ?? 80);
    setHeadMaxPx(merged.headMaxPx ?? 120); 
    
    setDetails2Align((merged.details2Align as any) ?? 'center');    

    setDetailsFamily(merged.detailsFamily ?? 'Inter');
    setDetails2Size(merged.details2Size ?? 12);
    setDetails2Family(merged.details2Family ?? 'Inter');

    setDetailsAlign((merged.detailsAlign as any) ?? 'center');
    setBodySize(merged.detailsSize ?? 16);
    setBodyColor(merged.bodyColor ?? '#ffffff');
    
    setDetailsLineHeight(merged.detailsLineHeight ?? 1.2); 

    setVenueFamily(merged.venueFamily ?? 'Inter');
    setVenueAlign((merged.venueAlign as any) ?? 'center');
    setVenueColor(merged.venueColor ?? '#ffffff');
    setVenueSize(merged.venueSize ?? 30);

    setSubtagFamily(merged.subtagFamily ?? 'Inter');
    setSubtagSize(merged.subtagSize ?? 12);
    setSubtagBgColor(merged.subtagBgColor ?? '#000000');
    setSubtagTextColor(merged.subtagTextColor ?? '#ffffff');
    setSubtagAlpha(merged.subtagAlpha ?? 1);

    setHeadline2Enabled(fmt, merged.head2Enabled ?? false);
    setHead2LineHeight(merged.head2LineHeight ?? 0.95);

    // --- HEADLINE 2 EFFECTS ---
    const h2ShadowOn = merged.head2Fx?.shadowEnabled ?? merged.head2Shadow ?? true;
    setHead2Shadow(h2ShadowOn);

    const h2ShadowVal = merged.head2Fx?.shadow ?? merged.head2ShadowStrength ?? 1;
    setHead2ShadowStrength(h2ShadowVal);

    // ✅ ADDED: Apply head2TrackEm to head2Fx state
    if (merged.head2TrackEm !== undefined) {
      setHead2Fx((prev) => ({ ...prev, tracking: merged.head2TrackEm! }));
    }
    
    // --- FLAGS ---

    // VIGNETTE SETTINGS
    setVignetteStrength(merged.vignetteStrength ?? 0.5);
    setVignette(merged.vignette ?? true);

    // 1. DETAILS (Main Body)
    setDetailsShadow(merged.detailsShadow ?? true);
    setDetailsShadowStrength(merged.detailsShadowStrength ?? 1);

    // 2. DETAILS 2 (Secondary Body)
    setDetails2Shadow(merged.details2Shadow ?? true);
    setDetails2ShadowStrength(merged.details2ShadowStrength ?? 1);
    setDetails2Color(merged.details2Color ?? '#ffffff');

    // 3. VENUE
    setVenueShadow(merged.venueShadow ?? true);
    setVenueShadowStrength(merged.venueShadowStrength ?? 1);

    // 4. SUBTAG
    setSubtagShadow(merged.subtagShadow ?? true);
    setSubtagShadowStrength(merged.subtagShadowStrength ?? 1);
    setSubtagAlpha(merged.pillAlpha ?? merged.subtagAlpha ?? 1);

    // 1. Fix Shadow Enable
    const shadowOn = merged.textFx?.shadowEnabled ?? merged.headShadow ?? true;
    setHeadShadow(shadowOn);

    // 2. Fix Shadow Strength
    const shadowVal = merged.textFx?.shadow ?? merged.headShadowStrength ?? 1;
    setHeadShadowStrength(shadowVal);

    // Rest of the flags
    setPortraitLocked(merged.portraitLocked ?? false);
    setSubtagEnabled(fmt, merged.subtagEnabled ?? true);
    setHeadline2Enabled(fmt, merged.head2Enabled ?? false);
    setDetails2Enabled(fmt, merged.details2Enabled ?? false);

   // --- COLORS/FX ---
// 1. HEADLINE 1 (Main)
    // Combine the nested 'textFx' object with any flat legacy keys
    const incomingFx: any = merged.textFx || {}; // 👈 Added ': any' to fix the error
    
    setTextFx((prev) => ({
      ...prev,
      ...incomingFx, // Apply nested FX first
      
      // 👉 MANUALLY MAP THE FLAT KEYS:
      // Priority: 1. textFx.italic -> 2. headlineItalic -> 3. Keep current
      italic: incomingFx.italic ?? merged.headlineItalic ?? prev.italic,
      
      // Map other styles for safety
      bold: incomingFx.bold ?? merged.headlineBold ?? prev.bold,
      uppercase: incomingFx.uppercase ?? merged.headlineUppercase ?? prev.uppercase,
      
      // Fallback for color: textFx.color -> headColor -> white
      color: incomingFx.color ?? merged.headColor ?? '#ffffff',
      
      // If no textFx was provided at all, safely turn off gradient so flat colors work
      gradient: incomingFx.gradient ?? (merged.textFx ? prev.gradient : false),
    }));

    // 2. HEADLINE 2 (Sub)
    setHead2Color(merged.head2Color ?? '#ffffff');

    if (opts?.initialLoad) {
      store.setSessionValue(fmt, "bgScale", incomingScale);
    }
    if (tpl.preview && !opts?.initialLoad) {
      setBgUploadUrl(null);
      setBgUrl(tpl.preview);
    }
  },
  [format]
);

// =========================================================
// ✅ CINEMATIC PRESETS (Visual Styles)
// =========================================================
const CINEMATIC_PRESETS = [
  { id: "gold",   label: "Gold" },
  { id: "silver", label: "Silver (Brushed Studio)" },
  { id: "chrome", label: "Chrome (Mirror)" },
  { id: "magma", label: "Magma (Volcanic)" },
  { id: "ice", label: "Ice (Glacial)" },
  { id: "holo", label: "Holographic (Iridescent)" },
  { id: "wood", label: "Wood (Carved)" },
  { id: "leather", label: "Leather (Luxury)" },
  { id: "concrete", label: "Concrete (Industrial)" },
  { id: "default", label: "Matte (Clean)" },
] as const;

// Apply button handler (shared with Choose-a-Vibe)
const applyTemplateFromGallery = React.useCallback(
  (tpl: TemplateSpec, opts?: { targetFormat?: Format }) => {
    // 🔒 prevent panel auto-close during apply
    suppressCloseRef.current = true;

    const fmt = opts?.targetFormat ?? format;
    const store = useFlyerState.getState();
    store.setSession((prev) => ({ ...prev, [fmt]: {} }));
    store.setSessionDirty((prev) => ({ ...prev, [fmt]: false }));

    setTemplateId(tpl.id);
    setActiveTemplate(tpl);
    applyTemplate(tpl, { targetFormat: fmt, initialLoad: true });
    const variant =
      tpl.formats?.[fmt] ?? tpl.formats?.square ?? tpl.base ?? {};
    if (typeof variant.bgScale === "number") {
      templateBgScaleRef.current = variant.bgScale;
      setBgScale(variant.bgScale);
    }
    if (tpl.preview) {
      setBgUploadUrl(null);
      setBgUrl(tpl.preview);
    }

    // 🔓 release on next tick after state settles
    setTimeout(() => {
      suppressCloseRef.current = false;
    }, 0);
  },
  [applyTemplate, format]
);

/* ============================================================
   STARTUP TEMPLATE MAP + HANDLER
   ============================================================ */

const findTemplateById = (id: string) =>
  TEMPLATE_GALLERY.find((t) => t.id === id);

const STARTUP_TEMPLATE_MAP: Record<string, TemplateSpec | undefined> = {
  club: TEMPLATE_GALLERY[0],
  tropical: findTemplateById("hiphop_graffiti"),
  luxury: findTemplateById("rnb_velvet"),
  urban: findTemplateById("hiphop_lowrider"),
  loaded: TEMPLATE_GALLERY[4] ?? TEMPLATE_GALLERY[0], // fallback
};

const QUICK_START_TEMPLATES = [
  { id: "edm_tunnel", label: "EDM Tunnel" },
  { id: "techno_warehouse", label: "Warehouse" },
  { id: "afrobeat_rooftop", label: "Rooftop" },
  { id: "latin_street_tropical", label: "Tropical" },
  { id: "dnb_bunker", label: "DNB Bunker" },
] as const;

const handleStartupSelect = (key: string) => {
  const tpl = STARTUP_TEMPLATE_MAP[key];

  if (!tpl) {

    return;
  }

  applyTemplate(tpl, { targetFormat: "square" });

  setShowStartupTemplates(false);
};

// === SYNC HELPER: Saves all current local state to the global session ===
const syncCurrentStateToSession = () => {

  const currentScale = templateBgScaleRef.current ?? bgScale;
  const currentData = {
    // ------------------------------------------------
    // 1. HEADLINE 1 (The Main Title)
    // ------------------------------------------------
    headline,
    headlineFamily,
    //headColor: color,              // ✅ Added (was likely missing)
    align,                   // Main alignment
    lineHeight,
    textColWidth,            // Max width
    headlineLineHeight: lineHeight,
    headSize: headManualPx,  // legacy key
    headlineSize: headManualPx,
    headSizeAuto,
    headMaxPx,
    headlineItalic: textFx.italic,
    headlineBold: textFx.bold,
    headlineUppercase: textFx.uppercase,
    // Position & Rotation
    headX,
    headY,
    headRotate,
    // FX
    textFx: { ...textFx },   // Deep copy to prevent ref issues

    // ------------------------------------------------
    // 2. HEADLINE 2 (The Sub-Headline)
    // ------------------------------------------------
    head2Enabled: headline2Enabled[format],
    head2,
    head2line: head2,
    head2Family,
    head2Color,
    head2Size: head2SizePx,  // ✅ Map internal 'Px' state to template 'Size'
    head2Align,
    head2LineHeight,
    head2TrackEm: head2Fx.tracking,
    head2ColWidth,
    head2Alpha,
    // Missing Style Flags
    //head2Uppercase,          // ✅ Added
    //head2Tracking,           // ✅ Added
    // Shadows
    head2Shadow,             // ✅ Added
    head2ShadowStrength,     // ✅ Added
    // Position & Rotation
    head2X,
    head2Y,
    head2Rotate,
    // FX
    head2Fx: { ...head2Fx },

    // ------------------------------------------------
    // 3. DETAILS 1 (Main Body Text)
    // ------------------------------------------------
    details,
    // Map 'body' state vars to 'details' template keys if needed
    detailsFamily, 
    detailsColor: bodyColor,
    bodyColor,
    detailsSize: bodySize,
    detailsLineHeight,
    detailsAlign,
    // Styles
    detailsUppercase: bodyUppercase,
    detailsBold: bodyBold,
    detailsItalic: bodyItalic,
    detailsUnderline: bodyUnderline,
    detailsTracking: bodyTracking,
    // Shadows
    detailsShadow,           // ✅ Added
    detailsShadowStrength,   // ✅ Added
    // Position & Rotation
    detailsX,
    detailsY,
    detailsRotate,

    // ------------------------------------------------
    // 4. DETAILS 2 (Extra Info)
    // ------------------------------------------------
    details2Enabled: details2Enabled[format],
    details2,
    details2Family,
    details2Color,
    details2Size,
    details2LineHeight,
    details2Align,
    // Styles
    details2Uppercase,       // ✅ Added
    details2Italic,          // ✅ Added
    // Shadows
    details2Shadow,
    details2ShadowStrength,
    // Position & Rotation
    details2X,
    details2Y,
    details2Rotate,

    // ------------------------------------------------
    // 5. VENUE (Location)
    // ------------------------------------------------
    venue,
    venueFamily,
    venueColor,
    venueSize,
    venueLineHeight,
    venueAlign,
    // Shadows
    venueShadow,             // ✅ Added
    venueShadowStrength,     // ✅ Added
    // Position & Rotation
    venueX,
    venueY,
    venueRotate,

    // ------------------------------------------------
    // 6. SUBTAG (Date/Tagline)
    // ------------------------------------------------
    subtagEnabled: subtagEnabled[format],
    subtag,
    subtagFamily,
    subtagSize,
    subtagTextColor,
    subtagBgColor,
    subtagAlpha,
    // Styles
    subtagUppercase,         // ✅ Added
    // Shadows
    subtagShadow,            // ✅ Added
    subtagShadowStrength,    // ✅ Added
    // Position & Rotation
    subtagX,
    subtagY,
    subtagRotate,
    pillAlpha: subtagAlpha,

    // ------------------------------------------------
    // 7. GLOBAL & BACKGROUND
    // ------------------------------------------------
    // Background Image
    bgPosX,
    bgPosY,
    bgScale: currentScale,
    bgBlur,
    // Portrait Image
    portraitX,
    portraitY,
    portraitScale,
    portraitLocked,
    logoX, logoY, logoRotate, logoScale, // Logo settings
    
    // Global Effects
    hue,
    haze,
    vignette,         // Boolean
    vignetteStrength, // Number
    //texture,          // ✅ Added
    //textureOpacity,   // ✅ Added
  };

  // 1️⃣ WRITE SESSION DATA
  useFlyerState.getState().setSession((prev) => ({
    ...prev,
    [format]: {
      ...prev[format],
      ...currentData,
    },
  }));

  // 2️⃣ 🔥 MARK THIS FORMAT AS DIRTY (THIS WAS MISSING)
  useFlyerState.getState().setSessionDirty((prev) => ({
    ...prev,
    [format]: true,
  }));
};

const applySessionForFormat = (fmt: Format) => {
  const session = useFlyerState.getState().session?.[fmt] ?? {};
  if (!session || Object.keys(session).length === 0) return false;

  const sessionTemplate: TemplateSpec = {
    id: "__session__",
    label: "Session",
    tags: [],
    preview: "",
    formats: fmt === "square" ? { square: session } : { story: session },
  };

  applyTemplate(sessionTemplate, { targetFormat: fmt, initialLoad: true });
  return true;
};



// === STARTUP SCREEN (CHOOSE A VIBE) ===
const [showStartup, setShowStartup] = React.useState(true);
const [loadingStartup, setLoadingStartup] = React.useState(false);


// keep this new state near the other useStates at the top of your component
const [templateBase, setTemplateBase] = React.useState<any>(null);

const handleTemplateSelect = React.useCallback(
  (key: string) => {
    setLoadingStartup(true);
    if (!storageReadyRef.current) {
      pendingStartupKeyRef.current = key;
      return;
    }

    try {
      // ✅ Map each vibe to a real template index
      const vibeToTemplateId: Record<string, string> = {
        club: TEMPLATE_GALLERY[0]?.id ?? "edm_neon",
        tropical: "hiphop_graffiti",
        luxury: "rnb_velvet",
        urban: "hiphop_lowrider",
      };

      const tplId = vibeToTemplateId[key] ?? TEMPLATE_GALLERY[0]?.id;
      const tpl = TEMPLATE_GALLERY.find((t) => t.id === tplId);
      if (!tpl) throw new Error("Template not found for vibe: " + key);



      // 🧠 Save a snapshot of the base template (for optional reset)
      setTemplateBase(JSON.parse(JSON.stringify(tpl)));

      // ✅ Startup load should be authoritative (same as gallery apply)
      const startupFormat: Format = "square";
      setFormat(startupFormat);
      applyTemplateFromGallery(tpl, { targetFormat: startupFormat });
    } catch (err) {

      alert("Could not load template.");
    }

    // ✅ Close startup modal once template applied
  setTimeout(() => {
  setLoadingStartup(false);
  setShowStartup(false);

  // ✅ Only auto-open Templates if nothing else is open
  if (useFlyerState.getState().selectedPanel == null) {
    useFlyerState.getState().setSelectedPanel("template");
  }
}, 1200);

  },
  []
);
// === /STARTUP SCREEN ===

React.useEffect(() => {
  if (!storageReady) return;
  const pending = pendingStartupKeyRef.current;
  if (!pending) return;
  pendingStartupKeyRef.current = null;
  handleTemplateSelect(pending);
}, [storageReady, handleTemplateSelect]);


/* ===== AUTOSAVE: SMART SAVE/LOAD (BEGIN) ===== */
const [hasSavedDesign, setHasSavedDesign] = React.useState(false);
const [mobileControlsOpen, setMobileControlsOpen] = React.useState(true);
const [mobileControlsTab, setMobileControlsTab] = React.useState<"design" | "assets">(
  "design"
);
const [uiMode, setUiMode] = React.useState<"design" | "finish">("design");
const [floatingEditorVisible, setFloatingEditorVisible] = React.useState(false);
const [floatingAssetVisible, setFloatingAssetVisible] = React.useState(false);
//const [isMobileView, setIsMobileView] = React.useState(false);
const activeTextTarget = React.useMemo(() => {
  const byPanel = selectedPanel && ["headline", "head2", "details", "details2", "venue", "subtag"].includes(selectedPanel)
    ? selectedPanel
    : null;
  const byMove = moveTarget && ["headline", "headline2", "details", "details2", "venue", "subtag"].includes(moveTarget)
    ? moveTarget
    : null;
  return (byPanel ?? byMove ?? null) as
    | "headline"
    | "head2"
    | "details"
    | "details2"
    | "venue"
    | "subtag"
    | "headline2"
    | null;
}, [selectedPanel, moveTarget]);
const activeTextControls = React.useMemo(() => {
  switch (activeTextTarget) {
    case "headline":
      return {
        label: "Headline",
        font: headlineFamily,
        fonts: HEADLINE_FONTS_LOCAL,
        size: headSizeAuto ? headMaxPx : headManualPx,
        sizeMin: 36,
        sizeMax: 300,
        sizeStep: 2,
        lineHeight,
        lineMin: 0.3,
        lineMax: 1.3,
        lineStep: 0.02,
        onFont: (v: string) => {
          setHeadlineFamily(v);
          setTextStyle("headline", format, { family: v });
        },
        onSize: (v: number) => {
          setHeadSizeAuto(false);
          setHeadManualPx(v);
          setTextStyle("headline", format, { sizePx: v });
        },
        onLine: (v: number) => setLineHeight(v),
      };
    case "headline2":
    case "head2":
      return {
        label: "Sub Headline",
        font: head2Family,
        fonts: HEADLINE2_FONTS_LOCAL,
        size: head2SizePx,
        sizeMin: 12,
        sizeMax: 120,
        sizeStep: 1,
        lineHeight: head2LineHeight,
        lineMin: 0.6,
        lineMax: 1.6,
        lineStep: 0.05,
        onFont: (v: string) => setHead2Family(v),
        onSize: (v: number) => setHead2SizePx(v),
        onLine: (v: number) => setHead2LineHeight(v),
      };
    case "details":
      return {
        label: "Details",
        font: detailsFamily,
        fonts: BODY_FONTS_LOCAL,
        size: bodySize,
        sizeMin: 8,
        sizeMax: 60,
        sizeStep: 1,
        lineHeight: detailsLineHeight,
        lineMin: 0.8,
        lineMax: 2.2,
        lineStep: 0.05,
        onFont: (v: string) => setDetailsFamily(v),
        onSize: (v: number) => setBodySize(v),
        onLine: (v: number) => setDetailsLineHeight(v),
      };
    case "details2":
      return {
        label: "Details 2",
        font: details2Family ?? bodyFamily,
        fonts: BODY_FONTS2_LOCAL,
        size: details2Size,
        sizeMin: 8,
        sizeMax: 60,
        sizeStep: 1,
        lineHeight: details2LineHeight,
        lineMin: 0.8,
        lineMax: 2.2,
        lineStep: 0.05,
        onFont: (v: string) => setDetails2Family(v),
        onSize: (v: number) => setDetails2Size(v),
        onLine: (v: number) => setDetails2LineHeight(v),
      };
    case "venue":
      return {
        label: "Venue",
        font: venueFamily,
        fonts: VENUE_FONTS_LOCAL,
        size: venueSize,
        sizeMin: 10,
        sizeMax: 96,
        sizeStep: 1,
        lineHeight: venueLineHeight,
        lineMin: 0.6,
        lineMax: 1.8,
        lineStep: 0.05,
        onFont: (v: string) => setVenueFamily(v),
        onSize: (v: number) => setVenueSize(v),
        onLine: (v: number) => setVenueLineHeight(v),
      };
    case "subtag":
      return {
        label: "Subtag",
        font: subtagFamily,
        fonts: SUBTAG_FONTS_LOCAL,
        size: subtagSize,
        sizeMin: 8,
        sizeMax: 48,
        sizeStep: 1,
        lineHeight: 1,
        lineMin: 0.8,
        lineMax: 1.8,
        lineStep: 0.05,
        onFont: (v: string) => setSubtagFamily(v),
        onSize: (v: number) => setSubtagSize(v),
        onLine: () => {},
      };
    default:
      return null;
  }
}, [
  activeTextTarget,
  headlineFamily,
  lineHeight,
  headSizeAuto,
  headManualPx,
  headMaxPx,
  head2Family,
  head2SizePx,
  head2LineHeight,
  detailsFamily,
  bodySize,
  detailsLineHeight,
  bodyFamily,
  details2Family,
  details2Size,
  details2LineHeight,
  venueFamily,
  venueSize,
  venueLineHeight,
  subtagFamily,
  subtagSize,
  format,
  textFx.tracking,
]);

const activeAssetControls = React.useMemo(() => {
  const store = useFlyerState.getState();
  if (selectedEmojiId) {
    const list = Array.isArray(emojis) ? emojis : emojis?.[format] || [];
    const sel = list.find((e: any) => e.id === selectedEmojiId);
    if (!sel) return null;
    return {
      label: "Emoji",
      scale: sel.scale ?? 1,
      opacity: sel.opacity ?? 1,
      locked: !!sel.locked,
      onScale: (v: number) =>
        useFlyerState.getState().updateEmoji(format, sel.id, { scale: v }),
      onOpacity: (v: number) =>
        useFlyerState.getState().updateEmoji(format, sel.id, { opacity: v }),
      onToggleLock: () =>
        useFlyerState.getState().updateEmoji(format, sel.id, {
          locked: !sel.locked,
        }),
      onDelete: () => {
        useFlyerState.getState().removeEmoji(format, sel.id);
        setSelectedEmojiId(null);
      },
    };
  }

  if (selectedPortraitId) {
    const list = portraits?.[format] || [];
    const sel = list.find((p: any) => p.id === selectedPortraitId);
    if (!sel) return null;
    const isLogo = String(sel.id || "").startsWith("logo_") || !!(sel as any).isLogo;
    if (!sel.isFlare && !sel.isSticker && !isLogo) return null;
    return {
      label: sel.isFlare ? "Flare" : sel.isSticker ? "Graphic" : "3D Text",
      scale: sel.scale ?? 1,
      opacity: sel.opacity ?? 1,
      locked: !!sel.locked,
      onScale: (v: number) =>
        useFlyerState.getState().updatePortrait(format, sel.id, { scale: v }),
      onOpacity: (v: number) =>
        useFlyerState.getState().updatePortrait(format, sel.id, { opacity: v }),
      onToggleLock: () =>
        useFlyerState.getState().updatePortrait(format, sel.id, {
          locked: !sel.locked,
        }),
      onDelete: () => {
        removePortrait(format, sel.id);
        useFlyerState.getState().setSelectedPortraitId(null);
      },
    };
  }

  return null;
}, [selectedEmojiId, selectedPortraitId, emojis, portraits, format]);

const mobileControlsTabs = (
  <div className="lg:hidden flex items-center gap-2 px-4 py-2 bg-neutral-950/90 border-b border-neutral-800">
    <button
      type="button"
      onClick={() => setMobileControlsTab("design")}
      className={`px-3 py-1 rounded text-[11px] font-semibold border ${
        mobileControlsTab === "design"
          ? "border-blue-400 text-blue-300 bg-blue-500/10"
          : "border-neutral-700 text-neutral-300 bg-neutral-900/60"
      }`}
    >
      Design
    </button>
    <button
      type="button"
      onClick={() => setMobileControlsTab("assets")}
      className={`px-3 py-1 rounded text-[11px] font-semibold border ${
        mobileControlsTab === "assets"
          ? "border-blue-400 text-blue-300 bg-blue-500/10"
          : "border-neutral-700 text-neutral-300 bg-neutral-900/60"
      }`}
    >
      Assets
    </button>
  </div>
);

React.useEffect(() => {
  if (activeTextControls) {
    setFloatingEditorVisible(true);
  } else {
    setFloatingEditorVisible(false);
  }
}, [activeTextControls]);

React.useEffect(() => {
  if (!mobileControlsOpen) return;
  const onScroll = () => setFloatingEditorVisible(false);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, [mobileControlsOpen]);

React.useEffect(() => {
  if (typeof window === "undefined") return;
  const update = () => setIsMobileView(window.innerWidth < 1024);
  update();
  window.addEventListener("resize", update);
  return () => window.removeEventListener("resize", update);
}, []);

React.useEffect(() => {
  if (typeof window === "undefined") return;
  const update = () => setIsMobileView(window.innerWidth < 1024);
  update();
  window.addEventListener("resize", update);
  return () => window.removeEventListener("resize", update);
}, []);

React.useEffect(() => {
  if (activeAssetControls) {
    setFloatingAssetVisible(true);
  } else {
    setFloatingAssetVisible(false);
  }
}, [activeAssetControls]);

React.useEffect(() => {
  if (!mobileControlsOpen) return;
  const onScroll = () => setFloatingAssetVisible(false);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, [mobileControlsOpen]);

React.useEffect(() => {
  const saved = localStorage.getItem("nf:lastDesign");
  if (saved) setHasSavedDesign(true);
}, []);

React.useEffect(() => {
  try {
    const design = {
      format,
      headline,
      details,
      venue,
      subtag,
    };
    localStorage.setItem("nf:lastDesign", JSON.stringify(design));
  } catch (err) {

  }
}, [format, headline, details, venue, subtag]);
/* ===== AUTOSAVE: SMART SAVE/LOAD (END) ===== */

// =========================================================
// ✅ IMPLEMENTATION: "Photoshop contrast-copy → select darks → apply to original"
// Works on rendered URL after generation: builds a proxy classifier mask,
// flood-fills background on the proxy, applies that alpha to the original,
// then cleans edges (halo + smooth), then crops.
// =========================================================

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

// --- 1) Build a proxy "classifier" image (contrast crush) ---
function buildClassifierAlpha(
  src: ImageData,
  opts?: {
    // how aggressively to separate background from subject
    gamma?: number;          // >1 darkens mids; try 1.6–2.4
    contrast?: number;       // 0..1; try 0.65
    blackPoint?: number;     // 0..255; try 18–40
    whitePoint?: number;     // 0..255; try 210–245
    lumaCut?: number;        // 0..255 threshold for "dark selection"; try 85–120
    chromaMax?: number;      // max chroma to be considered background; try 35
  }
) {
  const {
    gamma = 2.0,
    contrast = 0.65,
    blackPoint = 28,
    whitePoint = 235,
    lumaCut = 110,
    chromaMax = 35,
  } = opts ?? {};

  const { width: w, height: h, data } = src;
  const out = new ImageData(w, h);
  const o = out.data;

  // Map luma with black/white points + gamma + contrast
  const bp = blackPoint;
  const wp = Math.max(bp + 1, whitePoint);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

    // preserve transparency if any (usually 255)
    if (a === 0) { o[i] = o[i+1] = o[i+2] = 0; o[i+3] = 0; continue; }

    // luma (linear-ish)
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // chroma (how "colored" the pixel is)
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const chroma = mx - mn;

    // Normalize luma between bp..wp
    let t = (l - bp) / (wp - bp);
    t = clamp01(t);

    // Gamma crush
    t = Math.pow(t, gamma);

    // Contrast around 0.5
    t = clamp01((t - 0.5) * (1 + contrast * 2) + 0.5);

    const L = Math.round(t * 255);

    // Produce a proxy grayscale image (we’ll threshold this later)
    o[i] = L;
    o[i + 1] = L;
    o[i + 2] = L;
    o[i + 3] = 255;

    // Store chroma into alpha channel? (not needed; we’ll recompute in bg test)
    // We'll rely on L + chroma in bg predicate below.
  }

  return { proxy: out, lumaCut, chromaMax };
}

// --- 2) Flood-fill background on the PROXY, using hard-coded luma range ---
function floodFillBgOnProxyToMask(
  proxy: ImageData,
  src: ImageData,
  params: { lumaCut: number; chromaMax: number }
): Uint8Array {

  const { width: w, height: h, data: p } = proxy;
  const s = src.data;

  const visited = new Uint8Array(w * h);
  const bgMask: Uint8Array = new Uint8Array(w * h) // 1 = background

  const id = (x: number, y: number) => y * w + x;
  const p4 = (i: number) => i * 4;

  const isBgCandidate = (x: number, y: number) => {
    const i = id(x, y);
    const pp = p4(i);

    // proxy luma (already crushed)
    const L = p[pp]; // 0..255

    // original chroma safety (so we don't remove colorful highlights)
    const sp = pp;
    const r = s[sp], g = s[sp + 1], b = s[sp + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);

    return (L <= params.lumaCut) && (chroma <= params.chromaMax);
  };

  const qx: number[] = [];
  const qy: number[] = [];

  const pushIf = (x: number, y: number) => {
    const i = id(x, y);
    if (visited[i]) return;
    if (!isBgCandidate(x, y)) return;
    visited[i] = 1;
    bgMask[i] = 1;
    qx.push(x); qy.push(y);
  };

  // seed borders
  for (let x = 0; x < w; x++) { pushIf(x, 0); pushIf(x, h - 1); }
  for (let y = 0; y < h; y++) { pushIf(0, y); pushIf(w - 1, y); }

  while (qx.length) {
    const x = qx.pop()!;
    const y = qy.pop()!;
    const n = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as const;

    for (const [nx, ny] of n) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = id(nx, ny);
      if (visited[ni]) continue;
      if (!isBgCandidate(nx, ny)) continue;
      visited[ni] = 1;
      bgMask[ni] = 1;
      qx.push(nx); qy.push(ny);
    }
  }

  return bgMask;
}

// --- 3) Also remove enclosed background holes (inside rings/cavities) ---
function removeEnclosedBgIslands(
  bgMask: Uint8Array,
  proxy: ImageData,
  src: ImageData,
  params: { lumaCut: number; chromaMax: number }
): Uint8Array {

  const { width: w, height: h, data: p } = proxy;
  const s = src.data;

  const visited = new Uint8Array(w * h);
  const id = (x: number, y: number) => y * w + x;
  const p4 = (i: number) => i * 4;

  const isBgCandidate = (x: number, y: number) => {
    const i = id(x, y);
    const pp = p4(i);
    const L = p[pp];
    const r = s[pp], g = s[pp + 1], b = s[pp + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    return (L <= params.lumaCut) && (chroma <= params.chromaMax);
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = id(x, y);
      if (visited[start]) continue;
      if (bgMask[start] === 1) { visited[start] = 1; continue; }
      if (!isBgCandidate(x, y)) { visited[start] = 1; continue; }

      // BFS this candidate region
      const qx: number[] = [x];
      const qy: number[] = [y];
      visited[start] = 1;

      let touchesBorder = false;
      const region: number[] = [];

      while (qx.length) {
        const cx = qx.pop()!;
        const cy = qy.pop()!;
        const ci = id(cx, cy);
        region.push(ci);

        if (cx === 0 || cy === 0 || cx === w - 1 || cy === h - 1) touchesBorder = true;

        const n = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ] as const;

        for (const [nx, ny] of n) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = id(nx, ny);
          if (visited[ni]) continue;
          visited[ni] = 1;
          if (!isBgCandidate(nx, ny)) continue;
          qx.push(nx); qy.push(ny);
        }
      }

      // If not border-connected, it's an enclosed hole -> mark as background
      if (!touchesBorder) {
        for (const i of region) bgMask[i] = 1;
      }
    }
  }

  return bgMask;
}

// --- 4) Apply bg mask to ORIGINAL image (this is “apply selection to original”) ---
function applyBgMaskToAlpha(src: ImageData, bgMask: Uint8Array) {
  const { width: w, height: h, data } = src;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (bgMask[i] !== 1) continue;
      data[i * 4 + 3] = 0;
    }
  }
  return src;
}

// --- 5) Halo cleanup + smooth edge (erode then feather) ---
function erodeAlpha(imgData: ImageData, iterations = 1, alphaThreshold = 10) {
  const { width: w, height: h, data } = imgData;

  for (let it = 0; it < iterations; it++) {
    const copy = new Uint8ClampedArray(data);
    const aAt = (x: number, y: number) => copy[(y * w + x) * 4 + 3];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const a = aAt(x, y);
        if (a <= alphaThreshold) continue;

        const n =
          aAt(x + 1, y) <= alphaThreshold ||
          aAt(x - 1, y) <= alphaThreshold ||
          aAt(x, y + 1) <= alphaThreshold ||
          aAt(x, y - 1) <= alphaThreshold;

        if (n) data[(y * w + x) * 4 + 3] = 0;
      }
    }
  }
  return imgData;
}

function featherAlpha(imgData: ImageData, radius = 1) {
  const { width: w, height: h, data } = imgData;

  for (let it = 0; it < radius; it++) {
    const prev = new Uint8ClampedArray(data);
    const aPrev = (x: number, y: number) => prev[(y * w + x) * 4 + 3];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let sum = 0;
        sum += aPrev(x, y);
        sum += aPrev(x + 1, y);
        sum += aPrev(x - 1, y);
        sum += aPrev(x, y + 1);
        sum += aPrev(x, y - 1);
        sum += aPrev(x + 1, y + 1);
        sum += aPrev(x - 1, y - 1);
        sum += aPrev(x + 1, y - 1);
        sum += aPrev(x - 1, y + 1);
        data[(y * w + x) * 4 + 3] = Math.round(sum / 9);
      }
    }
  }
  return imgData;
}

// --- 6) Crop to alpha ---
function cropToAlpha(imgData: ImageData) {
  const { width: w, height: h, data } = imgData;
  let minX = w, minY = h, maxX = -1, maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a === 0) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    const c = document.createElement("canvas");
    c.width = 1; c.height = 1;
    return c.toDataURL("image/png");
  }

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = w;
  srcCanvas.height = h;
  const sctx = srcCanvas.getContext("2d")!;
  sctx.putImageData(imgData, 0, 0);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = cw;
  outCanvas.height = ch;
  const octx = outCanvas.getContext("2d")!;
  octx.drawImage(srcCanvas, minX, minY, cw, ch, 0, 0, cw, ch);

  return outCanvas.toDataURL("image/png");
}

// --- 7) Main tool: remove gradient background via proxy selection ---
async function removeGradientBgLikePhotoshop(urlOrDataUrl: string): Promise<string> {
  const img = await loadImage(urlOrDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No canvas context");

  ctx.drawImage(img, 0, 0);

  // Beauty image (original)
  const beauty = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Classification image (contrast-crushed proxy)
  const { proxy, lumaCut, chromaMax } = buildClassifierAlpha(beauty, {
    gamma: 2.0,
    contrast: 0.65,
    blackPoint: 28,
    whitePoint: 235,
    lumaCut: 110,
    chromaMax: 35,
  });

  // Build mask from proxy using border connectivity
  let bgMask: Uint8Array = floodFillBgOnProxyToMask(proxy, beauty, { lumaCut, chromaMax });


  // Also remove enclosed holes
  bgMask = removeEnclosedBgIslands(bgMask, proxy, beauty, { lumaCut, chromaMax });

  // Apply selection to original (beauty)
  const cut = applyBgMaskToAlpha(beauty, bgMask);

  // Edge hygiene (tune if needed)
  let cleaned = erodeAlpha(cut, 1, 10);
  cleaned = featherAlpha(cleaned, 1);

  return cropToAlpha(cleaned);
}

function alphaFromMaskPixel(r: number, g: number, b: number) {
  // mask is black/white → use luma
  return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
}

// Binary threshold mask alpha (0 or 255)
function thresholdAlpha(img: ImageData, t = 10) {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    const on = a > t ? 255 : 0;
    d[i + 3] = on;
  }
  return img;
}

// Dilate alpha by N pixels (expands silhouette so bevel/speculars don’t get clipped)
function dilateAlpha(img: ImageData, px = 4) {
  const { width: w, height: h, data } = img;
  for (let it = 0; it < px; it++) {
    const prev = new Uint8ClampedArray(data);
    const aPrev = (x: number, y: number) => prev[(y * w + x) * 4 + 3];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4 + 3;
        if (aPrev(x, y) === 255) continue;
        if (
          aPrev(x + 1, y) === 255 ||
          aPrev(x - 1, y) === 255 ||
          aPrev(x, y + 1) === 255 ||
          aPrev(x, y - 1) === 255
        ) {
          data[idx] = 255;
        }
      }
    }
  }
  return img;
}

// Feather alpha (smooth edge)
function featherAlphaOnly(img: ImageData, radius = 2) {
  const { width: w, height: h, data } = img;
  for (let it = 0; it < radius; it++) {
    const prev = new Uint8ClampedArray(data);
    const aPrev = (x: number, y: number) => prev[(y * w + x) * 4 + 3];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let sum = 0;
        sum += aPrev(x, y);
        sum += aPrev(x + 1, y);
        sum += aPrev(x - 1, y);
        sum += aPrev(x, y + 1);
        sum += aPrev(x, y - 1);
        sum += aPrev(x + 1, y + 1);
        sum += aPrev(x - 1, y - 1);
        sum += aPrev(x + 1, y - 1);
        sum += aPrev(x - 1, y + 1);
        data[(y * w + x) * 4 + 3] = Math.round(sum / 9);
      }
    }
  }
  return img;
}

// Apply authoritative mask to the rendered image, then crop to alpha.
// This ignores background pixels completely (gradients don’t matter).
// Apply authoritative mask to the rendered image, edge-weight specular boost, then crop.
// Background pixels are ignored completely.
async function applyAuthoritativeMaskAndCrop(
  renderedUrlOrDataUrl: string,
  maskDataUrl: string,
  opts?: {
    dilatePx?: number;
    featherPx?: number;
    maskThreshold?: number;

    // ✅ EDGE WEIGHT CONTROLS (gold defaults)
    edgeWeightStrength?: number;  // 0..1, how much extra reflectivity near edges
    edgeInnerBlurPx?: number;     // small blur radius
    edgeOuterBlurPx?: number;     // larger blur radius (controls band width)
    edgeContrastBoost?: number;   // 0..1, extra contrast near edges
  }
): Promise<string> {
  const {
    dilatePx = 6,
    featherPx = 2,
    maskThreshold = 10,

    // ✅ Defaults tuned for "gold"
    edgeWeightStrength = 0.24,
    edgeInnerBlurPx = 2,
    edgeOuterBlurPx = 10,
    edgeContrastBoost = 0.14,
  } = opts ?? {};

  const renderedImg = await loadImage(renderedUrlOrDataUrl);
  const maskImg = await loadImage(maskDataUrl);

  const w = renderedImg.naturalWidth || renderedImg.width;
  const h = renderedImg.naturalHeight || renderedImg.height;

  // canvas for rendered
  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });
  if (!outCtx) throw new Error("No canvas ctx (render)");

  outCtx.drawImage(renderedImg, 0, 0, w, h);
  const rendered = outCtx.getImageData(0, 0, w, h);

  // canvas for mask scaled to rendered size
  const mCanvas = document.createElement("canvas");
  mCanvas.width = w;
  mCanvas.height = h;
  const mCtx = mCanvas.getContext("2d");
  if (!mCtx) throw new Error("No canvas ctx (mask)");

  mCtx.drawImage(maskImg, 0, 0, w, h);
  const mask = mCtx.getImageData(0, 0, w, h);

  // ---------- helpers ----------
  const clamp255 = (n: number) => (n < 0 ? 0 : n > 255 ? 255 : n);

  function alphaFromMaskPixel(r: number, g: number, b: number) {
    // mask is black/white → use luma
    return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }

  function thresholdAlpha(img: ImageData, t = 10) {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3];
      d[i + 3] = a > t ? 255 : 0;
    }
    return img;
  }

  function dilateAlpha(img: ImageData, px = 4) {
    const { width: W, height: H, data } = img;
    for (let it = 0; it < px; it++) {
      const prev = new Uint8ClampedArray(data);
      const aPrev = (x: number, y: number) => prev[(y * W + x) * 4 + 3];
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = (y * W + x) * 4 + 3;
          if (aPrev(x, y) === 255) continue;
          if (
            aPrev(x + 1, y) === 255 ||
            aPrev(x - 1, y) === 255 ||
            aPrev(x, y + 1) === 255 ||
            aPrev(x, y - 1) === 255
          ) {
            data[idx] = 255;
          }
        }
      }
    }
    return img;
  }

  function featherAlphaOnly(img: ImageData, radius = 2) {
    const { width: W, height: H, data } = img;
    for (let it = 0; it < radius; it++) {
      const prev = new Uint8ClampedArray(data);
      const aPrev = (x: number, y: number) => prev[(y * W + x) * 4 + 3];
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          let sum = 0;
          sum += aPrev(x, y);
          sum += aPrev(x + 1, y);
          sum += aPrev(x - 1, y);
          sum += aPrev(x, y + 1);
          sum += aPrev(x, y - 1);
          sum += aPrev(x + 1, y + 1);
          sum += aPrev(x - 1, y - 1);
          sum += aPrev(x + 1, y - 1);
          sum += aPrev(x - 1, y + 1);
          data[(y * W + x) * 4 + 3] = Math.round(sum / 9);
        }
      }
    }
    return img;
  }

  // simple separable box blur on alpha channel only
  function blurAlpha(img: ImageData, radius: number) {
    if (radius <= 0) return img;
    const { width: W, height: H } = img;
    const src = img.data;
    const tmp = new Uint8ClampedArray(src.length);
    const dst = new Uint8ClampedArray(src.length);

    // copy RGB (unused), blur only alpha
    for (let i = 0; i < src.length; i += 4) {
      tmp[i] = 0; tmp[i + 1] = 0; tmp[i + 2] = 0; tmp[i + 3] = src[i + 3];
    }

    // horizontal
    for (let y = 0; y < H; y++) {
      let acc = 0;
      let count = 0;
      for (let x = -radius; x <= radius; x++) {
        const xx = Math.min(W - 1, Math.max(0, x));
        acc += tmp[(y * W + xx) * 4 + 3];
        count++;
      }
      for (let x = 0; x < W; x++) {
        dst[(y * W + x) * 4 + 3] = Math.round(acc / count);
        const xOut = x - radius;
        const xIn = x + radius + 1;
        if (xOut >= 0) acc -= tmp[(y * W + xOut) * 4 + 3];
        if (xIn < W) acc += tmp[(y * W + xIn) * 4 + 3];
      }
    }

    // vertical
    for (let x = 0; x < W; x++) {
      let acc = 0;
      let count = 0;
      for (let y = -radius; y <= radius; y++) {
        const yy = Math.min(H - 1, Math.max(0, y));
        acc += dst[(yy * W + x) * 4 + 3];
        count++;
      }
      for (let y = 0; y < H; y++) {
        tmp[(y * W + x) * 4 + 3] = Math.round(acc / count);
        const yOut = y - radius;
        const yIn = y + radius + 1;
        if (yOut >= 0) acc -= dst[(yOut * W + x) * 4 + 3];
        if (yIn < H) acc += dst[(yIn * W + x) * 4 + 3];
      }
    }

    // write back alpha only
    for (let i = 0; i < src.length; i += 4) {
      src[i + 3] = tmp[i + 3];
    }
    return img;
  }

  // ---------- build authoritative alpha from mask ----------
  for (let i = 0; i < mask.data.length; i += 4) {
    const a = alphaFromMaskPixel(mask.data[i], mask.data[i + 1], mask.data[i + 2]);
    mask.data[i + 3] = a;
    mask.data[i] = 0; mask.data[i + 1] = 0; mask.data[i + 2] = 0;
  }

  thresholdAlpha(mask, maskThreshold);
  dilateAlpha(mask, dilatePx);

  // ---------- EDGE WEIGHT (run here, BEFORE feather & alpha apply) ----------
  // Create an edge band from (outerBlur - innerBlur). This yields a strong ring near boundaries.
  const maskInner = new ImageData(new Uint8ClampedArray(mask.data), w, h);
  const maskOuter = new ImageData(new Uint8ClampedArray(mask.data), w, h);

  blurAlpha(maskInner, edgeInnerBlurPx);
  blurAlpha(maskOuter, edgeOuterBlurPx);

  const rd = rendered.data;
  const ia = maskInner.data;
  const oa = maskOuter.data;

  for (let i = 0; i < rd.length; i += 4) {
    // 0..1 edge band intensity
    const innerA = ia[i + 3];
    const outerA = oa[i + 3];
    const band = Math.max(0, Math.min(1, (outerA - innerA) / 255));

    if (band <= 0) continue;

    // spec boost towards white (screen-like)
    const wSpec = band * edgeWeightStrength;
    const r0 = rd[i], g0 = rd[i + 1], b0 = rd[i + 2];

    let r = r0 + (255 - r0) * wSpec;
    let g = g0 + (255 - g0) * wSpec;
    let b = b0 + (255 - b0) * wSpec;

    // slight contrast pop near edges (keeps it "machined")
    const c = 1 + band * edgeContrastBoost;
    r = ((r - 128) * c) + 128;
    g = ((g - 128) * c) + 128;
    b = ((b - 128) * c) + 128;

    rd[i] = clamp255(r);
    rd[i + 1] = clamp255(g);
    rd[i + 2] = clamp255(b);
  }

  // now feather AFTER edge boost (so the band effect blends clean)
  featherAlphaOnly(mask, featherPx);

  // ---------- Apply authoritative alpha ----------
  const ma = mask.data;
  for (let i = 0; i < rd.length; i += 4) {
    const a = ma[i + 3]; // 0..255
    rd[i + 3] = Math.round((rd[i + 3] * a) / 255);
  }

  outCtx.putImageData(rendered, 0, 0);

  // ---------- Crop to alpha ----------
  const finalData = outCtx.getImageData(0, 0, w, h);

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = finalData.data[(y * w + x) * 4 + 3];
      if (a === 0) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return outCanvas.toDataURL("image/png");

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cw;
  cropCanvas.height = ch;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("No canvas ctx (crop)");

  cropCtx.drawImage(outCanvas, minX, minY, cw, ch, 0, 0, cw, ch);
  return cropCanvas.toDataURL("image/png");
}
 
const isBgDragging = useFlyerState((st) => st.isLiveDragging && st.moveTarget === "background");



// === EMOJI LAYER (Interactive: Drag + Select ONLY — no on-canvas controls) ===
const emojiCanvas = React.useMemo(() => {
  let list: any[] = [];
  if (Array.isArray(emojis)) {
    list = emojis;
  } else if (emojis && typeof emojis === "object") {
    list = emojis[format] || [];
  }

  return (
    <div
      id="emoji-layer-root"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 25,
      }}
    >
      {list.map((em) => {
        const isSelected = selectedEmojiId === em.id;
        const locked = !!em.locked;
        // 🔥 Calculate inverse scale so button stays constant size
        const btnScale = 1 / (em.scale || 1);

        return (
          <div
  key={em.id}
  className="absolute select-none cursor-grab active:cursor-grabbing"
  // ✅ NO ADD ON CLICK (this is what was duplicating)
  // Click should ONLY select + keep panel open
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    const store = useFlyerState.getState();

    // ✅ select existing emoji (no newId, no addEmoji)
    store.setSelectedEmojiId(em.id);
    setSelectedEmojiId(em.id);

    // ✅ SAME AS FLARES: keep correct controls open
    store.setFocus("icon", "emoji");
    store.setSelectedPanel("emoji");
    store.setMoveTarget("icon");
  }}
  // DRAG START
  onPointerDown={(e) => {
    if (locked) return;
    e.stopPropagation();
    e.preventDefault();

    const store = useFlyerState.getState();

    // ✅ SAME AS FLARES: select + route FIRST
    store.setSelectedEmojiId(em.id);
    setSelectedEmojiId(em.id);
    store.setFocus("icon", "emoji");
    store.setSelectedPanel("emoji");
    store.setMoveTarget("icon");

    const el = e.currentTarget as unknown as HTMLElement;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}

    el.dataset.edrag = "1";
    el.dataset.eid = em.id;

    el.dataset.px = String(e.clientX);
    el.dataset.py = String(e.clientY);
    el.dataset.sx = String(em.x);
    el.dataset.sy = String(em.y);

    const root = document.getElementById("emoji-layer-root");
    if (root) {
      const b = root.getBoundingClientRect();
      el.dataset.cw = String(b.width);
      el.dataset.ch = String(b.height);
    }

    el.style.setProperty("--edx", "0px");
    el.style.setProperty("--edy", "0px");
  }}
  // SMOOTH CSS DRAG
  onPointerMove={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.edrag !== "1") return;

    const startX = Number(el.dataset.px || "0");
    const startY = Number(el.dataset.py || "0");
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    el.style.setProperty("--edx", `${dx}px`);
    el.style.setProperty("--edy", `${dy}px`);
  }}
  // DRAG END
  onPointerUp={(e) => {
    const el = e.currentTarget as HTMLElement;
    if (el.dataset.edrag !== "1") return;
    el.dataset.edrag = "0";

    const store = useFlyerState.getState();

    const eid = el.dataset.eid || em.id;
    const startLeft = Number(el.dataset.sx || "0");
    const startTop = Number(el.dataset.sy || "0");
    const cw = Number(el.dataset.cw || "1");
    const ch = Number(el.dataset.ch || "1");

    const startX = Number(el.dataset.px || "0");
    const startY = Number(el.dataset.py || "0");
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const finalPctX = startLeft + (dx / cw) * 100;
    const finalPctY = startTop + (dy / ch) * 100;

    // ✅ MOVE ONLY (no add). Use your existing move hook.
    onEmojiMove?.(eid, finalPctX, finalPctY);

    // ✅ SAME AS FLARES: re-assert routing after drag end
    store.setSelectedEmojiId(em.id);
    setSelectedEmojiId(em.id);
    store.setSelectedPanel("emoji");
    store.setMoveTarget("icon");

    el.style.setProperty("--edx", "0px");
    el.style.setProperty("--edy", "0px");
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}
  }}
  style={{
    left: `${em.x}%`,
    top: `${em.y}%`,
    transform: `translate3d(var(--edx, 0px), var(--edy, 0px), 0) translate(-50%, -50%) scale(${em.scale}) rotate(${em.rotation ?? 0}deg)`,
    willChange: "transform",

    // 🔥 Keep your behavior: ignore container clicks if locked
    pointerEvents: locked ? "none" : "auto",

    borderRadius: 8,
  }}
>
  {/* THE EMOJI */}
  <div
    style={{
      fontSize: "64px",
      lineHeight: 1,
      opacity: em.opacity ?? 1,
    }}
  >
    {em.char}
  </div>

  {/* 🔥 EMOJI UNLOCK BUTTON (Counter-Scaled) */}
  {locked && (
    <button
      type="button"
      title="Unlock"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const store = useFlyerState.getState();

        // Unlock logic
        store.updateEmoji(format, em.id, { locked: false });

        // ✅ select + keep emoji panel open (flare-style)
        store.setSelectedEmojiId(em.id);
        setSelectedEmojiId(em.id);
        store.setFocus("icon", "emoji");
        store.setSelectedPanel("emoji");
        store.setMoveTarget("icon");
      }}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) scale(${btnScale})`,
        width: 24,
        height: 24,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.35)",
        background: "rgba(0,0,0,0.65)",
        color: "white",
        display: "grid",
        placeItems: "center",
        fontSize: 12,
        cursor: "pointer",
        pointerEvents: "auto",
        zIndex: 9999,
      }}
    >
      🔓
    </button>
  )}
</div>

        );
      })}
    </div>
  );
}, [emojis, format, onEmojiMove, selectedEmojiId]);

const setPanelFromUserEvent = (
  panel: string | null,
  e?: MouseEvent | PointerEvent | React.MouseEvent | React.PointerEvent
) => {
  const native = (e as any)?.nativeEvent ?? e;
  const isTrusted = native?.isTrusted === true;

  if (!isTrusted) return; // ✅ ignore programmatic changes
  useFlyerState.getState().setSelectedPanel(panel);
};




return (
  <>
  {/* CONTINUE SESSION MODAL */}
    <AnimatePresence>
      {hasSavedDesign && !showStartup && (
        <motion.div
          key="continue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-center"
        >
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 w-[420px] text-center shadow-2xl">
            <h2 className="text-white text-xl font-semibold mb-2">Continue your last design?</h2>
            <p className="text-neutral-400 text-sm mb-6">You have an autosaved project from your last session.</p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  try {
                    const saved = localStorage.getItem("nf:lastDesign");
                    if (saved) importDesignJSON(saved);
                    setHasSavedDesign(false);
                  } catch (err) {
                    alert("Failed to load saved design.");
                    setHasSavedDesign(false);
                  }
                }}
                className="px-4 py-2 rounded bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
              >
                Resume
              </button>

              <button
                onClick={() => {
                  setHasSavedDesign(false);
                  setShowStartup(true);
                }}
                className="px-4 py-2 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white"
              >
                Start New
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

 <AnimatePresence>
      {showStartup && (
     <motion.div
          key="startup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[999]"
        >
        <StartupTemplates 
            onSelect={handleTemplateSelect} 
            // ✅ FIX: Pass the function directly. It handles the closing logic.
            importDesignJSON={importDesignJSON}
          />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Loading overlay (appears briefly after click) */}
    <AnimatePresence>
      {loadingStartup && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-center"
        >
          <div className="text-white text-xl font-semibold mb-2 animate-pulse">
            Loading your flyer…
          </div>
          <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
    </AnimatePresence>


    <main className="min-h-[100dvh] bg-neutral-950 text-white">

        {/* EXPORT FILTER WRAPPER */}
      <div data-nonexport="true">
        {/* --- all UI elements under here (side panels, buttons, overlays) will be excluded on export --- */}
      </div>

      <DecorBg />
      {/* === Brand Bar (fixed, non-scrolling) === */}
      {/* Top safe-area / breathing space */}
      <div
        className="sticky top-0 z-[60] bg-neutral-950"
        style={{ height: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      />

{/* ===== UI: PAGE HEADER (BEGIN) ===== */}
<header className="sticky top-0 z-50 bg-neutral-950/80 supports-[backdrop-filter]:backdrop-blur backdrop-blur border-b border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-2 lg:h-14 grid grid-cols-1 lg:grid-cols-[clamp(260px,22vw,360px)_minmax(560px,1fr)_clamp(260px,22vw,360px)] gap-2 lg:gap-4 items-center">
          {/* LEFT: Brand */}
             <div className="hidden lg:flex items-center gap-3">
              <img
                src="/branding/nf-logo.png"
                alt="Nightlife Flyers"
                className="h-9 w-9 rounded-full shadow-[0_8px_28px_rgba(0,0,0,.45)]"
                draggable={false}
              />
              <div className="text-sm opacity-90">Nightlife Flyers — Studio</div>

              {/* ALWAYS-SHOW PRICING LINK */}
              <Link
                href="/pricing"  // ← change to "/pricing-plans" if your route is app/pricing-plans/page.tsx
                className="ml-2 text-[12px] px-2 py-[2px] rounded-md border border-white/20 bg-white/10 hover:bg-white/20 hidden lg:inline-flex
                           text-[#78E3FF] drop-shadow-[0_0_10px_rgba(120,227,255,0.95)]"
                aria-label="View Pricing"
              >
                Pricing
              </Link>
            </div>

{/* === FORMAT TOGGLE & VIEW SETTINGS === */}
          <div className="justify-self-center">
            <div className="inline-flex items-center gap-2 text-[12px]">
              <span className="opacity-80 hidden sm:inline">Canvas</span>

              <Chip
                small
                active={format === "square"}
                disabled={!(bgUploadUrl || bgUrl)}
                onClick={() => {
                  if (format === "square") return;
                  syncCurrentStateToSession();
                  setPendingFormat("square");
                  setFadeOut(true);
                }}
              >
                Square
              </Chip>

              <Chip
                small
                active={format === "story"}
                disabled={!(bgUploadUrl || bgUrl)}
                onClick={() => {
                  if (format === "story") return;
                  syncCurrentStateToSession();
                  setPendingFormat("story");
                  setFadeOut(true);
                }}
              >
                Story
              </Chip>

              <img
                src="/branding/nf-logo.png"
                alt="Nightlife Flyers"
                className="lg:hidden h-7 w-7 mx-2"
                draggable={false}
              />

              {/* ✅ GUIDES TOGGLE */}
              <Chip 
                small 
                active={showGuides} 
                onClick={() => setShowGuides(!showGuides)}
                title="Toggle safe zones and alignment grid"
              >
                Guides
              </Chip>
              {uiMode === "finish" ? (
                <Chip small onClick={() => setUiMode("design")}>Back to Design</Chip>
              ) : (
                <Chip
                  small
                  onClick={() => {
                    setUiMode("finish");
                    setSelectedPanel("cinema");
                  }}
                >
                  Next: Finish
                </Chip>
              )}
            </div>
          </div>



     {/* RIGHT: EXPORT BUTTON (aligned to right panel column) */}
        <div className="flex items-center gap-4 justify-self-stretch w-full pr-1">
          {uiMode === "finish" && (
            <>
              <div className="flex items-center gap-2 text-[11px]">
                <span>Export</span>
                <Chip small active={exportType==='png'} onClick={()=>setExportType('png')}>PNG</Chip>
                <Chip small active={exportType==='jpg'} onClick={()=>setExportType('jpg')}>JPG</Chip>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span>Scale</span>
                <Chip small active={exportScale===2} onClick={()=>setExportScale(2)}>2x</Chip>
                <Chip small active={exportScale===4} onClick={()=>setExportScale(4)}>4x</Chip>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <Chip small onClick={handleExportJSON} title="Save Project as JSON">
                  <span>Save</span>
                </Chip>
              </div>
              <div className="ml-auto">
                <Chip
                  small
                  onClick={() => exportArtboardClean(artRef.current!, exportType as 'png' | 'jpg')}
                >
                  <span className="whitespace-nowrap">download {exportType}</span>
                </Chip>
              </div>
            </>
          )}
        </div>

        </div>
</header>
{/* ===== UI: PAGE HEADER (END) ===== */}

{/* --- ONBOARDING STRIP (only after hydration, only first open) --- */}
{hydrated && showOnboard && (
          <div
            className="sticky top-14 z-[49] text-white hidden lg:block"
            style={{
              background:
                'linear-gradient(90deg, rgba(99,102,241,.9), rgba(236,72,153,.9))',
              boxShadow: 'inset 0 -1px 0 rgba(255,255,255,.15)'
            }}
          >
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 text-sm relative">
              {/* subtle gloss */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.15]"
                  style={{ background: 'linear-gradient(0deg, rgba(255,255,255,0.25), transparent 40%)' }} />
              {/* sparkles icon */}
              <span aria-hidden className="shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3l1.6 3.6L17 8.2l-3.4 1.6L12 13l-1.6-3.2L7 8.2l3.4-1.6L12 3zM5 14l.9 2l2 1l-2 1l-.9 2l-.9-2l-2-1l2-1l.9-2zM19 14l.9 2l2 1l-2 1l-.9 2l-.9-2l-2-1l2-1l.9-2z"
                        fill="currentColor"/>
                </svg>
              </span>

              <strong className="font-semibold relative z-10">Welcome!</strong>
              <span className="opacity-95 relative z-10">
                Add a background (right panel) or hit <b>AI Background → Generate</b>. You’ll have a poster in &lt; 60s.
              </span>

              <div className="ml-auto flex items-center gap-2 relative z-10">
                <button
                  type="button"
                  onClick={quickGenerate}
                  className="text-[11px] px-3 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/25"
                >
                  Generate now →
                </button>
                <button
                  type="button"
                  className="text-[11px] px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20"
                  onClick={() => { try { localStorage.setItem('nf:onboarded:v1','1'); } catch {} setShowOnboard(false); }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
)}     

{/* ===== UI: MAIN 3-COL LAYOUT (BEGIN) ===== */}
<section
className={clsx(
  "mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[clamp(260px,22vw,360px)_minmax(560px,1fr)_clamp(260px,22vw,360px)] gap-4 px-4 py-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]",
  showOnboard ? "mt-2" : ""
)}
style={{ minHeight: 'calc(100vh - 96px)' }}
>
{/* ---------- Left Panel ---------- */}
<aside
id="mobile-controls-panel"
className={clsx(
  "order-2 lg:sticky self-start max-h-none lg:max-h-[calc(100vh-120px)] overflow-visible lg:overflow-y-auto space-y-3 px-3 lg:px-0 lg:pr-1",
  mobileControlsOpen && mobileControlsTab === "design" ? "block" : "hidden",
  "lg:block"
)}
style={{ top: STICKY_TOP }}
>               
  {uiMode === "design" && mobileControlsOpen && mobileControlsTabs}

  
  <div className={uiMode === "design" ? "space-y-3" : "hidden"}>
{/* UI: GETTING STARTED (BEGIN) */}
<Collapsible
            title="Getting started"
            storageKey="p:start"
            defaultOpen={false}
            titleClassName="text-[#78E3FF] drop-shadow-[0_0_10px_rgba(120,227,255,0.95)]"
          >
           {/* === GETTING STARTED — REPLACEMENT CONTENT === */}
            <div className="space-y-3 text-[13px] text-neutral-100">
              <div className="text-[12px] text-neutral-300">
                Build a full flyer in minutes: choose a template, generate or upload a background,
                then style text and add media layers.
              </div>

              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <b>Start with a template</b> — Open <b>Starter Templates</b> to load a full layout.
                </li>
                <li>
                  <b>Background</b> — Use <b>AI Background</b> or <b>Upload</b> your own image.
                </li>
                <li>
                  <b>Subject + blend</b> — Add a portrait or use <b>Magic Blend</b> to fuse subject + scene.
                </li>
                <li>
                  <b>Details + accents</b> — Edit text, then add flares/graphics/emojis in <b>Library</b>.
                </li>
                <li>
                  <b>Export or Save</b> — Top bar: PNG/JPG at 2x/4x, or save the project JSON.
                </li>
              </ol>

              <div className="grid grid-cols-2 gap-2">
                <Chip small onClick={() => setSelectedPanel("template")} title="Open starter templates">
                  Open templates
                </Chip>
                <Chip small onClick={quickGenerate} title="Generate a background now">
                  Generate background
                </Chip>
                <Chip small onClick={triggerUpload} title="Upload your own background">
                  Upload background
                </Chip>
                <Chip small onClick={() => setSelectedPanel("magic_blend")} title="Open Magic Blend">
                  Open Magic Blend
                </Chip>
              </div>

              <div className="grid gap-1 text-[12px] text-neutral-400">
                <div>• Use <b>Move</b> to pick a target, then drag on canvas.</div>
                <div>• Turn <b>Snap</b> and <b>Guides</b> on for clean alignment.</div>
                <div>• Lock items once placed to avoid accidental moves.</div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Chip
                  small
                  onClick={() => {
                    try { localStorage.setItem("nf:onboarded:v1", "1"); } catch {}
                    setShowOnboard(false);
                  }}
                >
                  Dismiss
                </Chip>
              </div>
            </div>
</Collapsible>
{/* UI: GETTING STARTED (END) */}

{/* UI: STARTER TEMPLATES (BEGIN) */}

<div className="mb-3">
  <div
    className={
      selectedPanel === "template"
        ? "relative rounded-xl border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all"
        : "relative rounded-xl border border-neutral-700 transition-all"
    }
  >
    <TemplateGalleryPanel
      items={TEMPLATE_GALLERY}
      format={format}
      isOpen={selectedPanel === "template"}
      onToggle={() => {


        // ✅ Toggle using the subscribed value
        setSelectedPanel(selectedPanel === "template" ? null : "template");

        setTimeout(() => {

        }, 0);
      }}
      onApply={(t) => {
        applyTemplateFromGallery(t);
      }}
    />
  </div>
</div>

{/* UI: STARTER TEMPLATES (END) */}



{/* === PATCH: Align Headline 2 Center (scoped to rootRef) === */}
{/* ALIGNMENT CONTROLS */}
<div className="mt-2 w-full flex flex-col items-center">

  {/* ALIGNMENT BUTTON ROW */}
<div className="flex justify-center gap-2 w-full mt-4">

 {/* ALIGN LEFT */}
<button
  type="button"
  onClick={() => {
    const s = useFlyerState.getState(); // snapshot of state

    // 🔥 DEBUG LOGS













    // Resolve active element
    const active = s.moveTarget ?? s.selectedPanel ?? null;


    if (!active) {
      alert("❌ Nothing selected");
      return;
    }

    // Root must exist
    const root = canvasRefs.root;
    if (!root) {
      alert("❌ Canvas root not found");
      return;
    }

    // Element must exist
    const el = canvasRefs[active as keyof typeof canvasRefs] as HTMLElement | null;
    if (!el) {
      alert(`❌ Could not find element for: ${active}`);
      return;
    }

    // Geometry
    const cRect = root.getBoundingClientRect();
    const hRect = el.getBoundingClientRect();

    const newX = (10 / cRect.width) * 100; // left = 10px padding
    const newY = ((hRect.top - cRect.top) / cRect.height) * 100;

    // Apply alignment
    switch (active) {
      case "headline":  setHeadX(newX);  setHeadY(newY);  break;
      case "headline2": setHead2X(newX); setHead2Y(newY); break;
      case "details":   setDetailsX(newX); setDetailsY(newY); break;
      case "details2":  setDetails2X(newX); setDetails2Y(newY); break;
      case "venue":     setVenueX(newX); setVenueY(newY); break;
      case "subtag":    setSubtagX(newX); setSubtagY(newY); break;
      default:
        alert(`⚠️ Alignment not supported for: ${active}`);
    }
  }}
  className="px-3 py-1 rounded bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-xs text-white"
>
  Align Left
</button>


  {/* ALIGN CENTER */}
<button
  type="button"
  onClick={() => {
    const s = useFlyerState.getState();
    const active = s.moveTarget ?? s.selectedPanel ?? null;

    if (!active) {
      alert("❌ Nothing selected");
      return;
    }

    // Ensure element exists in canvasRefs
    const el = canvasRefs[active as keyof typeof canvasRefs] as HTMLElement | null;
    if (!el) {
      alert(`❌ Could not find element for: ${active}`);
      return;
    }

    // Root must exist
    const root = canvasRefs.root;
    if (!root) {
      alert("❌ Canvas root not found");
      return;
    }

    // Measurements
    const cRect = root.getBoundingClientRect();
    const hRect = el.getBoundingClientRect();

    // Center horizontally
    const newX = ((cRect.width / 2 - hRect.width / 2) / cRect.width) * 100;

    // Apply
    switch (active) {
      case "headline":  setHeadX(newX); break;
      case "headline2": setHead2X(newX); break;
      case "details":   setDetailsX(newX); break;
      case "details2":  setDetails2X(newX); break;
      case "venue":     setVenueX(newX); break;
      case "subtag":    setSubtagX(newX); break;

      default:
        alert(`⚠️ Alignment not supported for: ${active}`);
    }
  }}
  className="px-3 py-1 rounded bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-xs text-white"
>
  Align Center
</button>



 {/* ALIGN RIGHT */}
<button
  type="button"
  onClick={() => {
    const s = useFlyerState.getState();
    const active = s.moveTarget ?? s.selectedPanel ?? null;

    if (!active) {
      alert("❌ Nothing selected");
      return;
    }

    // Ensure element exists in canvasRefs
    const el = canvasRefs[active as keyof typeof canvasRefs] as HTMLElement | null;
    if (!el) {
      alert(`❌ Could not find element for: ${active}`);
      return;
    }

    // Ensure root exists
    const root = canvasRefs.root;
    if (!root) {
      alert("❌ Canvas root not found");
      return;
    }

    // Measurements
    const cRect = root.getBoundingClientRect();
    const hRect = el.getBoundingClientRect();

    // Align Right = (canvasWidth - elementWidth - 10% margin)
    const marginPct = 10; // same as your original logic
    const newX =
      ((cRect.width - hRect.width - (cRect.width * marginPct) / 100) /
        cRect.width) *
      100;

    // Y stays where it is
    const newY = ((hRect.top - cRect.top) / cRect.height) * 100;

    // Apply to correct field
    switch (active) {
      case "headline":
        setHeadX(newX);
        setHeadY(newY);
        break;
      case "headline2":
        setHead2X(newX);
        setHead2Y(newY);
        break;
      case "details":
        setDetailsX(newX);
        setDetailsY(newY);
        break;
      case "details2":
        setDetails2X(newX);
        setDetails2Y(newY);
        break;
      case "venue":
        setVenueX(newX);
        setVenueY(newY);
        break;
      case "subtag":
        setSubtagX(newX);
        setSubtagY(newY);
        break;

      default:
        alert(`⚠️ Alignment not supported for: ${active}`);
    }
  }}
  className="px-3 py-1 rounded bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-xs text-white"
>
  Align Right
</button>

</div>


{/* LIVE POSITION READOUT */}
<div className="mt-2 text-xs text-neutral-400 text-center w-full">
  {(() => {
    if (!moveTarget) return <span>No object selected</span>;

    let x = 0, y = 0;
    // ⚡️ FIX: Add ": string" so we can assign "Background" (Capital B) without error
    let label: string = moveTarget;

    switch (moveTarget) {
      case "headline":  x = headX; y = headY; break;
      case "headline2": x = head2X; y = head2Y; break;
      case "details":   x = detailsX; y = detailsY; break;
      case "details2":  x = details2X; y = details2Y; break;
      case "venue":     x = venueX; y = venueY; break;
      case "subtag":    x = subtagX; y = subtagY; break;
      case "portrait":  x = portraitX; y = portraitY; break;
      case "logo":      x = logoX; y = logoY; break;
      
      case "background": 
        x = bgPosX; 
        y = bgPosY; 
        label = "Background"; 
        break;

      default: return <span>{moveTarget} selected</span>;
    }

    // Capitalize first letter for display
    const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

    return (
      <div>
        <strong>{displayLabel}</strong>
        <span className="mx-2 text-neutral-600">|</span>
        X: {x.toFixed(1)}% &nbsp; Y: {y.toFixed(1)}%
      </div>
    );
  })()}
</div>

</div>

{/* === /PATCH === */}

{/* UI: HEADLINE (BEGIN) */}
<div
  className={
    selectedPanel === "headline"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Headline"
    storageKey="p:headline"
    isOpen={selectedPanel === "headline"}
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "headline" ? null : "headline")
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">
        {/* HIDE TOGGLE */}
        <Chip
          small
          active={headlineHidden}
          onClick={() => setHeadlineHidden(!headlineHidden)}
          title="Hide standard text"
        >
          {headlineHidden ? "Hidden" : "Visible"}
        </Chip>
        <span className="opacity-50">|</span>
        <Chip
          small
          active={textStyles.headline[format].align === "left"}
          onClick={() => setTextStyle("headline", format, { align: "left" })}
        >
          L
        </Chip>
        <Chip
          small
          active={textStyles.headline[format].align === "center"}
          onClick={() => setTextStyle("headline", format, { align: "center" })}
        >
          C
        </Chip>
        <Chip
          small
          active={textStyles.headline[format].align === "right"}
          onClick={() => setTextStyle("headline", format, { align: "right" })}
        >
          R
        </Chip>
      </div>
    }
  >
    <div className="p-0">
      {/* TEXT INPUT */}
      <textarea
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
        rows={3}
        className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700 focus:border-blue-500 outline-none"
        placeholder="ENTER HEADLINE..."
      />

      {/* SIZE & FONT */}
      <div className="flex items-center gap-2 mt-2 text-[11px]">
        <span>Size</span>
        <Chip small active={headSizeAuto} onClick={() => setHeadSizeAuto((v) => !v)}>
          {headSizeAuto ? "Auto" : "Manual"}
        </Chip>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <Stepper label="Line Height" value={lineHeight} setValue={setLineHeight} min={0.3} max={1.3} step={0.02} digits={2} />
        <Stepper label="Col Width %" value={textColWidth} setValue={setTextColWidth} min={30} max={100} step={1} />
        <Stepper label="Track (em)" value={textFx.tracking} setValue={(n) => setTextFx((v) => ({ ...v, tracking: n }))} min={-0.1} max={0.3} step={0.01} digits={2} />

        {headSizeAuto ? (
          <Stepper label="Max Size px" value={headMaxPx} setValue={setHeadMaxPx} min={36} max={300} step={2} />
        ) : (
          <Stepper
            label="Head Size px"
            value={headManualPx}
            setValue={(v) => {
              setHeadManualPx(v);
              setTextStyle("headline", format, { sizePx: v });
            }}
            min={36}
            max={300}
            step={2}
          />
        )}
      </div>

      <div className="text-[11px] mt-2">
        Font
        <select
          value={headlineFamily}
          onChange={(e) => {
            setHeadlineFamily(e.target.value);
            setTextStyle("headline", format, { family: e.target.value });
          }}
          className="mt-1 w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
        >
          {HEADLINE_FONTS_LOCAL.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* TOGGLES ROW (No Gradient/Stroke) */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Chip small active={textFx.uppercase} onClick={() => setTextFx((v) => ({ ...v, uppercase: !v.uppercase }))}>Upper</Chip>
        <Chip small active={textFx.bold} onClick={() => setTextFx((v) => ({ ...v, bold: !v.bold }))}>Bold</Chip>
        <Chip small active={textFx.italic} onClick={() => setTextFx((v) => ({ ...v, italic: !v.italic }))}>Italic</Chip>
        <Chip small active={headShadow} onClick={() => setHeadShadow(!headShadow)}>Shadow</Chip>
        <Chip small active={headBehindPortrait} onClick={() => setHeadBehindPortrait((v) => !v)}>Behind Portrait</Chip>
      </div>

      {/* 🔥 CINEMATIC CTA */}
      <button
        onClick={() => setCinematicModalOpen(true)}
        className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <span>✨</span> Create Cinematic 3D
      </button>

      {/* ROTATION & SHADOW */}
      <div className="mt-2 grid grid-cols-3 gap-3 w-full items-end">
        <Stepper label="Rotation (°)" value={headRotate} setValue={setHeadRotate} min={-360} max={360} step={0.5} />
        <Stepper label="Shadow" value={headShadowStrength} setValue={setHeadShadowStrength} min={0} max={5} step={0.1} />
        <div className="text-[11px] flex flex-col gap-1 items-end">
          <span className="opacity-80">Color</span>
          <ColorDot value={textFx.color} onChange={(c) => setTextFx((prev) => ({ ...prev, color: c }))} />
        </div>
      </div>
    </div>
  </Collapsible>
</div>
{/* UI: HEADLINE (END) */}



{/* UI: HEADLINE 2 (BEGIN) */}
<div
  className={
    selectedPanel === "head2"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Sub Headline"
    storageKey="p:head2"
    isOpen={selectedPanel === "head2"}
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "head2" ? null : "head2")
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">
        {/* ENABLE */}
        <Chip
          small
          active={headline2Enabled[format]}
          onClick={() => setHeadline2Enabled(format, !headline2Enabled[format])}
        >
          {headline2Enabled[format] ? "On" : "Off"}
        </Chip>

        <span className="opacity-80">Align</span>

        <Chip
          small
          active={textStyles.headline2[format].align === "left"}
          onClick={() => setTextStyle("headline2", format, { align: "left" })}
        >
          L
        </Chip>

        <Chip
          small
          active={textStyles.headline2[format].align === "center"}
          onClick={() => setTextStyle("headline2", format, { align: "center" })}
        >
          C
        </Chip>

        <Chip
          small
          active={textStyles.headline2[format].align === "right"}
          onClick={() => setTextStyle("headline2", format, { align: "right" })}
        >
          R
        </Chip>
      </div>
    }
  >
    {/* ⭐ NEON ACTIVE WRAPPER (FUCHSIA) */}
    <div className="p-0">
      {/* TEXT FIELD */}
      <textarea
        value={head2}
        onChange={(e) => setHead2(e.target.value)}
        rows={2}
        disabled={!headline2Enabled[format]}
        className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700 disabled:opacity-50"
        placeholder="Optional sub-headline"
      />

      {/* FONT FAMILY */}
      <div className="text-[11px] mt-2">
        Font
        <select
          value={head2Family}
          onChange={(e) => {
            const val = e.target.value;
            setHead2Family(val);
            setTextStyle("headline2", format, { family: val });
          }}
          disabled={!headline2Enabled[format]}
          className="mt-1 w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
        >
          {HEADLINE2_FONTS_LOCAL.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* GRID 1 */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        <Stepper
          label="Headline 2 Alpha"
          value={head2Alpha}
          setValue={setHead2Alpha}
          min={0}
          max={1}
          step={0.05}
          digits={2}
        />

        <Stepper
          label="Track (em)"
          value={head2Fx.tracking}
          setValue={(n) => setHead2Fx((v) => ({ ...v, tracking: n }))}
          min={0}
          max={0.15}
          step={0.01}
          digits={2}
        />

        <Stepper
          label="Rotation (°)"
          value={head2Rotate}
          setValue={(n) => setHead2Rotate(normDeg(n))}
          min={-360}
          max={360}
          step={1}
        />
      </div>

      {/* GRID 2 */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        <Stepper
          label="Size px"
          value={head2SizePx}
          setValue={(v) => {
            setHead2SizePx(v);
            setTextStyle("headline2", format, { sizePx: v });
            setSessionValue(format, "head2Size", v);
          }}
          min={24}
          max={180}
          step={2}
        />

        <Stepper
          label="Line Height"
          value={head2LineHeight}
          setValue={setHead2LineHeight}
          min={0.3}
          max={1.3}
          step={0.02}
          digits={2}
        />

        <Stepper
          label="Col Width %"
          value={head2ColWidth}
          setValue={setHead2ColWidth}
          min={30}
          max={80}
          step={1}
        />
      </div>

      {/* TOGGLES */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Chip small active={head2Fx.uppercase} onClick={() => setHead2Fx((v) => ({ ...v, uppercase: !v.uppercase }))}>Upper</Chip>
        <Chip small active={head2Fx.bold} onClick={() => setHead2Fx((v) => ({ ...v, bold: !v.bold }))}>Bold</Chip>
        <Chip small active={head2Fx.italic} onClick={() => setHead2Fx((v) => ({ ...v, italic: !v.italic }))}>Italic</Chip>
        <Chip small active={head2Fx.underline} onClick={() => setHead2Fx((v) => ({ ...v, underline: !v.underline }))}>Underline</Chip>
        <Chip small active={head2Shadow} onClick={() => setHead2Shadow(!head2Shadow)}>Shadow</Chip>
      </div>

      {/* SHADOW STRENGTH */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs opacity-70">Shadow Strength</span>
        <Stepper value={head2ShadowStrength} setValue={setHead2ShadowStrength} min={0} max={5} step={0.1} />
      </div>

      {/* COLOR */}
      <div className="flex items-end mt-2 flex-wrap w-full">
        <div className="ml-auto flex flex-wrap items-center gap-2 justify-end text-[11px]">
          <span className="opacity-80">Fill</span>
          <ColorDot title="Fill color" value={head2Color} onChange={setHead2Color} />
        </div>
      </div>
    </div>
  </Collapsible>
</div>
{/* UI: HEADLINE 2 (END) */}



{/* UI: SUBTAG (BEGIN) */}
<div
  className={
    selectedPanel === "subtag"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Subtag"
    storageKey="p:subtag"
    isOpen={selectedPanel === "subtag"}
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "subtag" ? null : "subtag")
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">
        <Chip
          small
          active={subtagEnabled[format]}
          onClick={() => setSubtagEnabled(format, !subtagEnabled[format])}
        >
          {subtagEnabled[format] ? "On" : "Off"}
        </Chip>

        <span className="opacity-80">Align</span>

        <Chip small active={subtagAlign === "left"} onClick={() => setSubtagAlign("left")}>L</Chip>
        <Chip small active={subtagAlign === "center"} onClick={() => setSubtagAlign("center")}>C</Chip>
        <Chip small active={subtagAlign === "right"} onClick={() => setSubtagAlign("right")}>R</Chip>
      </div>
    }
  >
    {/* ⭐ Inner highlight wrapper only when active */}
    <div className="p-0">
      {/* Disable rest of panel when subtag is OFF */}
      <div className={subtagEnabled[format] ? "" : "opacity-50 pointer-events-none"}>
        {/* ---------- TEXT INPUT ---------- */}
        <div className="mt-3 text-[11px]">
          <label className="block opacity-80 mb-1">Text</label>
          <input
            value={subtag}
            onChange={(e) => setSubtag(e.target.value)}
            className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
          />
        </div>

        {/* ---------- FONT PICKER ---------- */}
        <div className="text-[11px] mt-3">
          <label className="block opacity-80 mb-1">Font</label>
          <select
            value={subtagFamily}
            onChange={(e) => setSubtagFamily(e.target.value)}
            className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
          >
            {SUBTAG_FONTS_LOCAL.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* ---------- STEPPERS (Size + Alpha + Colors) ---------- */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Stepper label="Size" value={subtagSize} setValue={setSubtagSize} min={10} max={48} step={1} />
          <Stepper label="Alpha" value={subtagAlpha} setValue={setSubtagAlpha} min={0} max={1} step={0.05} digits={2} />

          <div className="flex items-end justify-end text-[11px] gap-1">
            <span className="opacity-80">Pill</span>
            <ColorDot value={subtagBgColor} onChange={setSubtagBgColor} title="Pill color" />
            <span className="opacity-80 ml-2">Text</span>
            <ColorDot value={subtagTextColor} onChange={setSubtagTextColor} title="Text color" />
          </div>
        </div>

        {/* ---------- SHADOW + STRENGTH ---------- */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-800">
          <Chip small active={subtagUppercase} onClick={() => setSubtagUppercase((v) => !v)}>Upper</Chip>
          <Chip small active={subtagBold} onClick={() => setSubtagBold((v) => !v)}>Bold</Chip>
          <Chip small active={subtagItalic} onClick={() => setSubtagItalic((v) => !v)}>Italic</Chip>
          <Chip small active={subtagShadow} onClick={() => setSubtagShadow(!subtagShadow)}>Shadow</Chip>

          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <span className="opacity-80">Strength</span>
            <div className="w-[110px]">
              <Stepper label="" value={subtagShadowStrength} setValue={setSubtagShadowStrength} min={0} max={5} step={0.1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Collapsible>
</div>
{/* UI: SUBTAG (END) */}



{/* UI: DETAILS (BEGIN) */}
<div
  className={
    selectedPanel === "details"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Details"
    storageKey="p:details"
    isOpen={selectedPanel === "details"}
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "details" ? null : "details")
    }
    right={
      <div className="flex items-center gap-2 text-[11px]">
        <span className="opacity-70">Font</span>
        <select
          value={detailsFamily}
          onChange={(e) => setDetailsFamily(e.target.value)}
          className="rounded px-2 py-1 w-24 bg-[#17171b] text-white border border-neutral-700"
        >
          {BODY_FONTS_LOCAL.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
    }
  >
    {/* ⭐ INNER NEON ACTIVE WRAPPER */}
    <div className="p-0">
      {/* ---------- ALIGN (RIGHT-ALIGNED BELOW FONT) ---------- */}
      <div className="flex justify-end mt-3">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="opacity-80">Align</span>
          <Chip small active={detailsAlign === "left"} onClick={() => setDetailsAlign("left")}>L</Chip>
          <Chip small active={detailsAlign === "center"} onClick={() => setDetailsAlign("center")}>C</Chip>
          <Chip small active={detailsAlign === "right"} onClick={() => setDetailsAlign("right")}>R</Chip>
        </div>
      </div>

      {/* ---------- TEXT FIELD ---------- */}
      <div className="mt-4">
        <label className="block text-[11px] opacity-80 mb-1">Text</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
        />
      </div>

      {/* ---------- COLOR (RIGHT-ALIGNED) ---------- */}
      <div className="flex justify-end mt-3">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="opacity-80">Color</span>
          <ColorDot value={bodyColor} onChange={setBodyColor} />
        </div>
      </div>

      {/* ---------- STEPPERS ---------- */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stepper label="Size" value={bodySize} setValue={setBodySize} min={10} max={32} step={1} />
        <Stepper label="Tracking" value={bodyTracking} setValue={setBodyTracking} min={0} max={0.12} step={0.01} digits={2} />
        <Stepper label="Line Height" value={detailsLineHeight} setValue={setDetailsLineHeight} min={0.4} max={2.0} step={0.02} digits={2} />
      </div>

      {/* ---------- FORMATTING + SHADOW ---------- */}
      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-neutral-800">
        <Chip small active={bodyUppercase} onClick={() => setBodyUppercase((v) => !v)}>Upper</Chip>
        <Chip small active={bodyBold} onClick={() => setBodyBold((v) => !v)}>Bold</Chip>
        <Chip small active={bodyItalic} onClick={() => setBodyItalic((v) => !v)}>Italic</Chip>
        <Chip small active={detailsShadow} onClick={() => setDetailsShadow(!detailsShadow)}>Shadow</Chip>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] opacity-80">Strength</span>
          <div className="w-[110px]">
            <Stepper value={detailsShadowStrength} setValue={setDetailsShadowStrength} min={0} max={5} step={0.1} />
          </div>
        </div>
      </div>
    </div>
  </Collapsible>
</div>
{/* UI: DETAILS (END) */}



{/* UI: DETAILS 2 (BEGIN) */}
<div
  className={
    selectedPanel === "details2"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="More Details"
    storageKey="p:details2"
    isOpen={selectedPanel === "details2"}
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "details2" ? null : "details2")
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">
        <Chip
          small
          active={details2Enabled[format]}
          onClick={() => setDetails2Enabled(format, !details2Enabled[format])}
        >
          {details2Enabled[format] ? "On" : "Off"}
        </Chip>

        <span className="opacity-80">Font</span>
        <select
          value={details2Family}
          onChange={(e) => setDetails2Family(e.target.value)}
          className="rounded px-2 py-1 w-24 bg-[#17171b] text-white border border-neutral-700"
          disabled={!details2Enabled[format]}
        >
          {BODY_FONTS2_LOCAL.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
    }
  >
    {/* ⭐ INNER NEON ACTIVE WRAPPER */}
    <div className="p-0">
      {/* Disable all controls when off */}
      <div className={details2Enabled[format] ? "" : "opacity-50 pointer-events-none"}>
        {/* ---------- ALIGN + COLOR ---------- */}
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="opacity-80">Color</span>
            <ColorDot value={details2Color} onChange={setDetails2Color} />
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="opacity-80">Align</span>
            <Chip small active={details2Align === "left"} onClick={() => setDetails2Align("left")}>L</Chip>
            <Chip small active={details2Align === "center"} onClick={() => setDetails2Align("center")}>C</Chip>
            <Chip small active={details2Align === "right"} onClick={() => setDetails2Align("right")}>R</Chip>
          </div>
        </div>

        {/* ---------- TEXT FIELD ---------- */}
        <div className="mt-3">
          <textarea
            value={details2}
            onChange={(e) => setDetails2(e.target.value)}
            rows={3}
            placeholder="Additional details..."
            className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
          />
        </div>

        {/* ---------- SIZE / TRACK / LINE HEIGHT ---------- */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stepper label="Size" value={details2Size} setValue={setDetails2Size} min={10} max={80} step={1} />
          <Stepper label="Track" value={details2LetterSpacing} setValue={setDetails2LetterSpacing} min={0} max={0.15} step={0.01} digits={2} />
          <Stepper label="Line Height" value={details2LineHeight} setValue={setDetails2LineHeight} min={0.5} max={2.5} step={0.05} digits={2} />
        </div>

        {/* ---------- FORMATTING + SHADOW ---------- */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-neutral-800">
          <Chip small active={details2Uppercase} onClick={() => setDetails2Uppercase((v) => !v)}>Upper</Chip>
          <Chip small active={details2Bold} onClick={() => setDetails2Bold((v) => !v)}>Bold</Chip>
          <Chip small active={details2Italic} onClick={() => setDetails2Italic((v) => !v)}>Italic</Chip>

          <Chip small active={details2Shadow} onClick={() => setDetails2Shadow(!details2Shadow)}>Shadow</Chip>

          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <span className="opacity-80">Strength</span>
            <div className="w-[110px]">
              <Stepper value={details2ShadowStrength} setValue={setDetails2ShadowStrength} min={0} max={5} step={0.1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Collapsible>
</div>
{/* UI: DETAILS 2 (END) */}



{/* UI: VENUE (BEGIN) */}
<div
  className={
    selectedPanel === "venue"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Venue"
    storageKey="p:venue"
    isOpen={selectedPanel === "venue"}
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "venue" ? null : "venue")
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">
        <span className="opacity-80">Font</span>
        <select
          value={venueFamily}
          onChange={(e) => setVenueFamily(e.target.value)}
          className="rounded px-2 py-1 w-24 bg-[#17171b] text-white border border-neutral-700"
        >
          {VENUE_FONTS_LOCAL.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
    }
  >
    {/* ⭐ INNER NEON ACTIVE WRAPPER */}
    <div className="p-0">
      {/* ---------- ALIGN ---------- */}
      <div className="flex justify-end mt-3">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="opacity-80">Align</span>
          <Chip small active={venueAlign === "left"} onClick={() => setVenueAlign("left")}>L</Chip>
          <Chip small active={venueAlign === "center"} onClick={() => setVenueAlign("center")}>C</Chip>
          <Chip small active={venueAlign === "right"} onClick={() => setVenueAlign("right")}>R</Chip>
        </div>
      </div>

      {/* ---------- TEXT FIELD ---------- */}
      <div className="mt-4">
        <label className="block text-[11px] opacity-80 mb-1">Text</label>
        <textarea
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          rows={2}
          className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
        />
      </div>

      {/* ---------- COLOR ---------- */}
      <div className="flex justify-end mt-3">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="opacity-80">Color</span>
          <ColorDot value={venueColor} onChange={setVenueColor} />
        </div>
      </div>

      {/* ---------- STEPPERS ---------- */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stepper label="Size" value={venueSize} setValue={setVenueSize} min={10} max={96} step={1} />
        <Stepper label="Line Height" value={venueLineHeight} setValue={setVenueLineHeight} min={0.7} max={1.4} step={0.02} digits={2} />
        <Stepper label="Rotate" value={venueRotate} setValue={setVenueRotate} min={-180} max={180} step={1} />
      </div>

      {/* ---------- FORMATTING + SHADOW ---------- */}
      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-neutral-800">
        <Chip small active={venueUppercase} onClick={() => setVenueUppercase((v) => !v)}>Upper</Chip>
        <Chip small active={venueBold} onClick={() => setVenueBold((v) => !v)}>Bold</Chip>
        <Chip small active={venueItalic} onClick={() => setVenueItalic((v) => !v)}>Italic</Chip>
        <Chip small active={venueShadow} onClick={() => setVenueShadow(!venueShadow)}>Shadow</Chip>

        <div className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="opacity-80">Strength</span>
          <div className="w-[110px]">
            <Stepper value={venueShadowStrength} setValue={setVenueShadowStrength} min={0} max={5} step={0.1} />
          </div>
        </div>
      </div>
    </div>
  </Collapsible>
</div>
{/* UI: VENUE (END) */}



 
</div>

<div className={uiMode === "finish" ? "space-y-3" : "hidden"}>
{/* UI: CINEMATIC OVERLAYS (BEGIN) */}
<div
  className={
    selectedPanel === "cinema"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Cinematic Overlays"
    storageKey="p:cinema"
    isOpen={selectedPanel === "cinema"}
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "cinema" ? null : "cinema")
    }
    titleClassName={
      selectedPanel === "cinema"
        ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]"
        : ""
    }
  >
    {/* Row 1: Texture & Grade */}
    <div className="grid grid-cols-2 gap-3 mt-2">
      <Stepper
        label="Texture Intensity"
        value={textureOpacity}
        setValue={setTextureOpacity}
        min={0}
        max={1}
        step={0.05}
        digits={2}
      />
      <Stepper
        label="Color Grade"
        value={grade}
        setValue={setGrade}
        min={0}
        max={2}
        step={0.05}
        digits={2}
      />
    </div>

    {/* Row 2: Leaks & Vignette */}
    <div className="grid grid-cols-2 gap-3 mt-2">
      <Stepper
        label="Light Leaks"
        value={leak}
        setValue={setLeak}
        min={0}
        max={1}
        step={0.05}
        digits={2}
      />
      <Stepper
        label="Vignette"
        value={vignetteStrength}
        setValue={setVignetteStrength}
        min={0}
        max={1}
        step={0.05}
        digits={2}
      />
    </div>

    <div className="text-[11px] text-neutral-400 mt-2">
      <b>Pro Tip:</b> Keep Texture around 0.30–0.40 for that &quot;printed flyer&quot; look.
    </div>
  </Collapsible>
</div>
{/* UI: CINEMATIC OVERLAYS (END) */}




{/* UI: MASTER COLOR GRADE (BEGIN) */}
<div
  className={
    selectedPanel === "mastergrade"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Master Color Grade"
    storageKey="p:mastergrade"
    isOpen={selectedPanel === "mastergrade"}
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "mastergrade" ? null : "mastergrade")
    }
    titleClassName={
      selectedPanel === "mastergrade"
        ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]"
        : ""
    }
    right={
  <Chip
    small
    onClick={() => {
      setExp(1);
      setContrast(1.08);
      setSaturation(1.10);
      setWarmth(0.10);
      setTint(0);
      setGamma(1);
      setGrain(0.15);
      setFilmGrade(0.6);
      setVibrance(0.15);
    }}
  >
    Reset
  </Chip>
}

  >
    {/* 🔥 NEW: ONE-CLICK VIBE PRESETS */}
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[
        {
          label: "Cyber",
          set: { exp: 1.05, con: 1.15, sat: 1.25, warm: 0.0, tint: -0.5, grain: 0.15, gamma: 1.0, film: 0.55, vib: 0.25 },
        },
        {
          label: "Gold",
          set: { exp: 1.02, con: 1.10, sat: 1.05, warm: 0.35, tint: 0.1, grain: 0.10, gamma: 0.95, film: 0.5, vib: 0.1 },
        },
        {
          label: "Noir",
          set: { exp: 1.1, con: 1.25, sat: 0.0, warm: 0.1, tint: 0.0, grain: 0.35, gamma: 1.1, film: 0.65, vib: 0.0 },
        },
        {
          label: "Film",
          set: { exp: 0.95, con: 0.95, sat: 0.9, warm: 0.15, tint: 0.2, grain: 0.25, gamma: 0.9, film: 0.7, vib: 0.1 },
        },
        {
          label: "M31",
          set: { exp: 1.02, con: 1.22, sat: 1.2, warm: 0.12, tint: -0.25, grain: 0.18, gamma: 0.95, film: 0.75, vib: 0.3 },
        },
        {
          label: "Berlin",
          set: { exp: 1.0, con: 1.1, sat: 1.12, warm: 0.08, tint: -0.1, grain: 0.12, gamma: 1.0, film: 0.5, vib: 0.25 },
        },
        {
          label: "We’ll See",
          set: { exp: 1.02, con: 1.05, sat: 1.05, warm: 0.18, tint: -0.05, grain: 0.12, gamma: 1.0, film: 0.55, vib: 0.2 },
        },
        {
          label: "Matte Anchor",
          set: { exp: 0.98, con: 0.92, sat: 0.85, warm: 0.12, tint: 0.05, grain: 0.3, gamma: 0.9, film: 0.8, vib: 0.05 },
        },
        {
          label: "Urban Dark",
          set: { exp: 0.95, con: 1.2, sat: 0.95, warm: 0.1, tint: -0.25, grain: 0.25, gamma: 0.95, film: 0.7, vib: 0.12 },
        },
      ].map((mode) => (
        <button
          key={mode.label}
          type="button"
          className="text-[10px] font-bold py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            setExp(mode.set.exp);
            setContrast(mode.set.con);
            setSaturation(mode.set.sat);
            setWarmth(mode.set.warm);
            setTint(mode.set.tint);
            setGrain(mode.set.grain);
            setGamma(mode.set.gamma);
            setFilmGrade(mode.set.film);
            setVibrance(mode.set.vib);
          }}
        >
          {mode.label}
        </button>
      ))}
    </div>

    <div className="grid grid-cols-3 gap-3">
      <Stepper label="Exposure"   value={exp}        setValue={setExp}        min={0.7} max={1.4} step={0.02} digits={2} />
      <Stepper label="Contrast"   value={contrast}   setValue={setContrast}   min={0.7} max={1.5} step={0.02} digits={2} />
      <Stepper label="Saturation" value={saturation} setValue={setSaturation} min={0.0} max={1.6} step={0.02} digits={2} />
    </div>

    <div className="grid grid-cols-3 gap-3 mt-2">
      <Stepper label="Warmth" value={warmth} setValue={setWarmth} min={0}   max={1}   step={0.02} digits={2} />
      <Stepper label="Tint"   value={tint}   setValue={setTint}   min={-1}  max={1}   step={0.02} digits={2} />
      <Stepper label="Gamma"  value={gamma}  setValue={setGamma}  min={0.7} max={1.5} step={0.02} digits={2} />
    </div>
    <div className="grid grid-cols-3 gap-3 mt-2">
      <Stepper label="Vibrance" value={vibrance} setValue={setVibrance} min={0} max={1} step={0.02} digits={2} />
      <Stepper label="Grain" value={grain} setValue={setGrain} min={0} max={1} step={0.05} digits={2} />
      <Stepper label="Film Curve" value={filmGrade} setValue={setFilmGrade} min={0} max={1} step={0.05} digits={2} />
    </div>


    <div className="text-[11px] text-neutral-400 mt-2">
      <b>Tip:</b> Click a preset above, then tweak the sliders to refine.
    </div>
  </Collapsible>
</div>
{/* UI: MASTER COLOR GRADE (END) */}

</div>

</aside>

  {/* ---------- Center: Artboard & Guides ---------- */}
  <section
  className="order-1 lg:order-2 lg:sticky self-start flex flex-col items-center gap-3 w-full"
  style={{ top: STICKY_TOP }}
  >
  {/* Format (centered just above canvas) */}


{/* ===== CENTER: ARTBOARD + OVERLAY (ANIMATED FORMAT SWITCH) ===== */}
<div
  className="relative flex justify-center items-start w-full"
  style={{
    width: scaledCanvasW,
    height: scaledCanvasH,
    maxWidth: "100%",
  }}
>
  <div
      id="export-root" 
      data-export-root="true"
      ref={artWrapRef}
      className="relative isolate z-0 flex justify-center items-center..."
      style={{
        width: canvasSize.w,
        height: canvasSize.h,
        position: "absolute",
        left: "50%",
        top: 0,
        transform: `translateX(-50%) scale(${canvasScale})`,
        transformOrigin: "top center",
        filter: isMobileView ? masterFilter : undefined,
        WebkitFilter: isMobileView ? masterFilter : undefined,
      }}
      onMouseDownCapture={(e) => {
        if (suppressCloseRef.current) return;
        setFloatingEditorVisible(true);

        const el = e.target as HTMLElement;

        // ✅ THE FIX: If the user clicked a BUTTON or a STARTUP modal, 
        // do NOT let the background canvas "clear" the selection.
        if (el.closest('button') || el.closest('[key="startup"]') || el.closest('.fixed')) {
          return;
        }

        if (!el.closest('[data-portrait-area="true"]') && !el.closest(".panel")) {
          clearSelection(e.nativeEvent);
        }
      }}
    >
  <svg width="0" height="0" className="absolute">
    <filter id="master-grade" colorInterpolationFilters="sRGB">
      <feComponentTransfer in="SourceGraphic" result="rgbCurve">
        <feFuncR type="table" tableValues={MASTER_GRADE_TABLES.rgb} />
        <feFuncG type="table" tableValues={MASTER_GRADE_TABLES.rgb} />
        <feFuncB type="table" tableValues={MASTER_GRADE_TABLES.rgb} />
      </feComponentTransfer>
      <feComponentTransfer in="rgbCurve" result="colorCurve">
        <feFuncR type="table" tableValues={MASTER_GRADE_TABLES.r} />
        <feFuncG type="table" tableValues={MASTER_GRADE_TABLES.g} />
        <feFuncB type="table" tableValues={MASTER_GRADE_TABLES.b} />
      </feComponentTransfer>
      <feComposite
        in="colorCurve"
        in2="SourceGraphic"
        operator="arithmetic"
        k1="0"
        k2={String(Math.max(0, Math.min(1, filmGrade)))}
        k3={String(Math.max(0, Math.min(1, 1 - filmGrade)))}
        k4="0"
      />
    </filter>
  </svg>
  {/* ✅ FILTERED CONTENT ONLY (everything BELOW the flare) */}
    <div
      className="relative w-full flex justify-center items-center"
      style={{
        filter: `url(#master-grade) ${masterFilter}`,
      }}
    >

    {/* --- LAYER 1: AMBIENT GLOWS --- */}
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen opacity-60 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen opacity-60" />
    </div>

    {/* --- LAYER 2: CONTENT --- */}
    <div className="relative z-10 w-full h-full flex justify-center items-center">
      {!isBgDragging && (
        <div
          style={grainStyle}
          data-nonexport="true"
          className="z-50 pointer-events-none absolute inset-0"
        />
      )}
      {genLoading && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 text-white">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <div className="text-xs font-semibold tracking-wider uppercase">
              Generating background...
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key="fade-wrapper"
          initial={{ opacity: 1 }}
          animate={
            fadeOut
              ? { opacity: 0, filter: "blur(24px)" }
              : { opacity: 1, filter: "blur(0px)" }
          }
          transition={{
            opacity: { duration: fadeOut ? 0.35 : 1, ease: "easeInOut" },
            filter: { duration: fadeOut ? 0.35 : 1, ease: "easeInOut" },
          }}
          // Ensure the wrapper is relative so absolute children position correctly
          className="relative" 
          onAnimationComplete={() => {
            if (!fadeOut || !pendingFormat) return;

            const next = pendingFormat;

            // 1) Switch format
            setFormat(next);

            // 2) Re-hydrate the UI from SESSION for that format (session wins)
            const tpl = TEMPLATE_GALLERY.find((t) => t.id === templateId);

            if (tpl) {
              // initialLoad=true => { ...variant, ...existingSession }
              applyTemplate(tpl, { targetFormat: next, initialLoad: true });
            } else {
              applySessionForFormat(next);
            }

            // 3) Cleanup
            setPendingFormat(null);
            setFadeOut(false);
          }}
        >
          <Artboard
            /* PASSING ALL PROPS AS BEFORE */
            textureOpacity={textureOpacity}
            headlineHidden={headlineHidden}
            headShadow={headShadow}
            head2Shadow={head2Shadow}
            detailsShadow={detailsShadow}
            details2Shadow={details2Shadow}
            venueShadow={venueShadow}
            subtagShadow={subtagShadow}
            headShadowStrength={headShadowStrength}
            head2ShadowStrength={head2ShadowStrength}
            detailsShadowStrength={detailsShadowStrength}
            details2ShadowStrength={details2ShadowStrength}
            venueShadowStrength={venueShadowStrength}
            subtagShadowStrength={subtagShadowStrength}
            head2Color={head2Color}
            details2={details2}
            details2Family={details2Family}
            details2Color={details2Color}
            details2Size={details2Size}
            details2LineHeight={details2LineHeight}
            details2LetterSpacing={details2LetterSpacing}
            details2Rotate={details2Rotate}
            details2X={details2X}
            details2Y={details2Y}
            detailsFamily={detailsFamily}
            shapes={shapes}
            allowPeople={allowPeople}
            ref={artRef}
            onPortraitScale={setPortraitScale}
            onTogglePortraitLock={() => setPortraitLocked((v) => !v)}
            onDeletePortrait={() => setPortraitUrl(null)}
            onSetPortraitUrl={(u) => setPortraitUrl(u)}
            portraitBoxW={0}
            portraitBoxH={0}
            selIconId={selIconId}
            onSelectIcon={handleSelectIcon}
            onIconMove={onIconMoveRaf}
            onEmojiMove={onEmojiMove}
            onIconResize={onIconResize}
            onDeleteIcon={deleteIcon}
            isLocked={isLocked}
            onToggleLock={onToggleLock}
            palette={palette}
            format={format}
            portraitUrl={portraitUrl}
            bgUrl={bgUrl}
            bgUploadUrl={bgUploadUrl}
            logoUrl={logoUrl}
            hue={hue}
            haze={haze}
            grade={grade}
            leak={leak}
            vignette={vignette ? vignetteStrength : 0}
            bgPosX={bgPosX}
            bgPosY={bgPosY}
            headline={headline}
            headAlign={headAlign}
            headlineFamily={headlineFamily}
            headSizeAuto={headSizeAuto}
            headManualPx={headManualPx}
            textFx={textFx}
            align={align}
            lineHeight={lineHeight}
            textColWidth={textColWidth}
            tallHeadline={tallHeadline}
            headX={headX}
            headY={headY}
            details={details}
            bodyFamily={bodyFamily}
            bodyColor={bodyColor}
            bodySize={bodySize}
            bodyUppercase={bodyUppercase}
            bodyBold={bodyBold}
            bodyItalic={bodyItalic}
            bodyUnderline={bodyUnderline}
            bodyTracking={bodyTracking}
            detailsX={detailsX}
            detailsY={detailsY}
            venue={venue}
            venueFamily={venueFamily}
            venueColor={venueColor}
            venueSize={venueSize}
            venueX={venueX}
            venueY={venueY}
            venueUppercase={venueUppercase}
            venueItalic={venueItalic}
            venueBold={venueBold}
            subtagEnabled={subtagEnabled}
            subtag={subtag}
            subtagFamily={subtagFamily}
            subtagBgColor={subtagBgColor}
            subtagTextColor={subtagTextColor}
            subtagAlpha={subtagAlpha}
            subtagX={subtagX}
            subtagY={subtagY}
            subtagUppercase={subtagUppercase}
            subtagBold={subtagBold}
            subtagItalic={subtagItalic}
            subtagUnderline={subtagUnderline}
            subtagSize={subtagSize}
            icons={iconList}
            emojis={emojis[format]}
            head2Enabled={headline2Enabled[format]}
            head2={head2}
            head2X={head2X}
            head2Y={head2Y}
            head2SizePx={head2SizePx}
            head2Family={head2Family}
            head2Align={head2Align}
            head2LineHeight={head2LineHeight}
            head2ColWidth={head2ColWidth}
            head2Fx={head2Fx}
            head2Alpha={head2Alpha}
            details2Enabled={details2Enabled[format]}
            setDetails2X={setDetails2X}
            setDetails2Y={setDetails2Y}
            details2Align={details2Align}
            headMaxPx={headMaxPx}
            headRotate={headRotate}
            head2Rotate={head2Rotate}
            detailsRotate={detailsRotate}
            venueRotate={venueRotate}
            subtagRotate={subtagRotate}
            subtagAlign={subtagAlign}
            subtagColor={subtagBgColor}
            logoRotate={logoRotate}
            showGuides={hideUiForExport ? false : showGuides}
            showFaceGuide={false}
            faceRight={0}
            faceTop={0}
            faceW={0}
            faceH={0}
            moveMode={moveMode}
            moveTarget={moveTarget}
            snap={snap}
            detailsAlign={detailsAlign}
            venueAlign={venueAlign}
            venueLineHeight={venueLineHeight}
            clarity={clarity}
            detailsLineHeight={detailsLineHeight}
            bgScale={bgScale}
            bgBlur={bgBlur}
            bgX={bgPosX}  // Pass the state variable
            bgY={bgPosY}
            setBgX={setBgPosX} // Pass the setter
            setBgY={setBgPosY}
            hideUiForExport={hideUiForExport}
            portraitX={portraitX}
            portraitY={portraitY}
            portraitScale={portraitScale}
            portraitLocked={portraitLocked}
            onShapeMove={onShapeMoveRaf}
            onPortraitMove={onPortraitMoveRaf}
            onLogoMove={onLogoMoveRaf}
            onHeadMove={onHeadMoveRafSafe}
            onHead2Move={onHead2MoveRafSafe}
            onDetailsMove={onDetailsMoveRafSafe}
            onDetails2Move={onDetails2MoveRafSafe}
            onVenueMove={onVenueMoveRafSafe}
            onSubtagMove={onSubtagMoveRafSafe}
            onBgMove={onBgMoveRaf}
            logoX={logoX}
            logoY={logoY}
            logoScale={logoScale}
            opticalMargin={opticalMargin}
            leadTrackDelta={leadTrackDelta}
            lastTrackDelta={lastTrackDelta}
            kerningFix={kerningFix}
            headBehindPortrait={headBehindPortrait}
            selShapeId={selShapeId}
            onSelectShape={onSelectShape}
            onDeleteShape={deleteShape}
            onClearIconSelection={() => setSelIconId(null)}
            onBgScale={setBgScale}
          />
          
          {/* 🔥 FIXED: Elements moved INSIDE motion.div so they fade out */}
          {portraitCanvas}
          {emojiCanvas}
          {flareCanvas}
          
        </motion.div>      
      </AnimatePresence> 
    </div>
  </div>  
</div>
  </div>

  {activeTextControls && floatingEditorVisible && (
    <div className="lg:hidden w-full flex justify-center px-3 pt-3">
      <div
        className="rounded-2xl border border-white/10 bg-neutral-950/95 backdrop-blur px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
        style={{ width: scaledCanvasW, maxWidth: "100%" }}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">Editing</span>
          <span className="text-neutral-300">•</span>
          <span>{activeTextControls.label}</span>
        </div>
        <div className="mt-2 grid grid-cols-[minmax(120px,1fr)_80px] gap-2 items-center">
          <select
            value={activeTextControls.font}
            onChange={(e) => activeTextControls.onFont?.(e.target.value)}
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 text-[11px] px-2 py-1 text-white"
          >
            {(activeTextControls.fonts ?? []).map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
          <input
            type="range"
            min={activeTextControls.sizeMin}
            max={activeTextControls.sizeMax}
            step={activeTextControls.sizeStep}
            value={Number(activeTextControls.size || 0)}
            onChange={(e) => activeTextControls.onSize?.(Number(e.target.value))}
            className="accent-fuchsia-500"
          />
          <div className="text-[10px] text-neutral-400">Line</div>
          <input
            type="range"
            min={activeTextControls.lineMin}
            max={activeTextControls.lineMax}
            step={activeTextControls.lineStep}
            value={Number(activeTextControls.lineHeight || 0)}
            onChange={(e) => activeTextControls.onLine?.(Number(e.target.value))}
            className="accent-indigo-400"
          />
        </div>
      </div>
    </div>
  )}

  {activeAssetControls && floatingAssetVisible && (
    <div className="lg:hidden w-full flex justify-center px-3 pt-3">
      <div
        className="rounded-2xl border border-white/10 bg-neutral-950/95 backdrop-blur px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
        style={{ width: scaledCanvasW, maxWidth: "100%" }}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">Editing</span>
          <span className="text-neutral-300">•</span>
          <span>{activeAssetControls.label}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 items-center">
          <div>
            <div className="text-[10px] text-neutral-400 mb-1">Scale</div>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.05}
              value={Number(activeAssetControls.scale || 0)}
              onChange={(e) => activeAssetControls.onScale(Number(e.target.value))}
              className="w-full accent-fuchsia-500"
              disabled={activeAssetControls.locked}
            />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 mb-1">Opacity</div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={Number(activeAssetControls.opacity || 0)}
              onChange={(e) => activeAssetControls.onOpacity(Number(e.target.value))}
              className="w-full accent-indigo-400"
              disabled={activeAssetControls.locked}
            />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => activeAssetControls.onToggleLock?.()}
            className="text-[11px] rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-2 py-1.5"
          >
            {activeAssetControls.locked ? "Unlock" : "Lock"}
          </button>
          <button
            type="button"
            onClick={() => activeAssetControls.onDelete?.()}
            className="text-[11px] rounded-md border border-red-700 bg-red-900/30 text-red-200 hover:bg-red-900/40 px-2 py-1.5"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )}

</section>
{/* ---------- Right Panel ---------- */}
<aside
className={clsx(
  "order-3 lg:sticky self-start max-h-none lg:max-h-[calc(100vh-120px)] overflow-visible lg:overflow-y-auto space-y-3 lg:pr-1",
  mobileControlsOpen && mobileControlsTab === "assets" ? "block" : "hidden",
  "lg:block"
)}
style={{ top: STICKY_TOP }}
>               
  {uiMode === "design" && mobileControlsOpen && mobileControlsTabs}

{/* UI: PROJECT PORTABLE SAVE (BEGIN) */}
<Collapsible
          title="Project"
          storageKey="p:designs"
          defaultOpen={false}
        >
          <div className="space-y-2">
            {/* Save to a portable .json file */}
            <button
              type="button"
              onClick={handleSaveProject}
              className="w-full text-[12px] px-3 py-2 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
              title="Save your current session as a portable file"
            >
              Save Design
            </button>

            {/* Load from a .json file */}
            <label className="block w-full text-[12px] px-3 py-2 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 cursor-pointer text-center">
              Load Design
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const r = new FileReader();
                  r.onload = () => {
                    try {
                      importDesignJSON(String(r.result));
                      alert('Loaded ✓');
                    } catch {
                      alert('Invalid or unsupported design file');
                    }
                  };
                  r.readAsText(f);
                  e.currentTarget.value = '';
                }}
              />
            </label>

            <div className="text-[11px] text-neutral-400">
              Saves as a single <code>.json</code> you can reopen later on any device.
            </div>
            <button
              type="button"
              onClick={clearHeavyStorage}
              className="mt-2 w-full text-[12px] px-3 py-2 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
              title="Remove large cached items (portraits/logos/background candidates) from localStorage"
            >
              Clear Storage
            </button>
          </div>
</Collapsible>
{/* UI: PROJECT PORTABLE SAVE (END) */}

{/* UI: BRAND KIT LITE (BEGIN) */}
{/* =============================================================================
   BRAND KIT UI (COMMENTED OUT TEMPORARILY)
   =============================================================================

<Collapsible 
            title="Brand Kit" 
            storageKey="p:brandkit" 
            defaultOpen={false}>
            <div className="text-[12px] text-neutral-300 mb-2">
              Save your fonts, core colors, and logo once. Download as a portable file you can share or re-use later.
            </div>

            // -- Logo picker (optional; included as DataURL in the kit) --
            <div className="mt-2">
              <div className="text-[11px]">
                Brand Logo
                <div className="mt-1 flex items-center gap-2">
                  <label className="text-[11px] px-2 py-1 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                     onChange={onBrandLogoFile}
                    />
                  </label>
                  {logoLibrary.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 text-[11px] uppercase text-neutral-400">
                        Logo Library
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {logoLibrary.map((url) => (
                          <div key={url} className="relative">
                            <button
                              type="button"
                              onClick={() => setLogoUrl(url)}
                              className="relative aspect-square w-full rounded border border-neutral-700 hover:border-fuchsia-400 transition"
                              title="Use this logo"
                            >
                              <img
                                src={url}
                                alt=""
                                className="absolute inset-0 h-full w-full object-contain p-1 bg-neutral-900"
                                draggable={false}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromLogoLibrary(url)}
                              className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-black/70 text-white text-[11px] border border-neutral-700"
                              title="Remove from library"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            // -- Snapshot preview --
            <div className="text-[11px] text-neutral-400 mt-3">
              Current fonts captured: Headline (<b>{headlineFamily}</b>), Details (<b>{bodyFamily}</b>), Venue (<b>{venueFamily}</b>), Subtag (<b>{subtagFamily}</b>)
            </div>

            // -- Color chips (read-only) --
            <div className="grid grid-cols-2 gap-3 mt-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span>Headline Fill</span>
                <span className="h-4 w-4 rounded-full border border-neutral-700" style={{ background: textFx.color }} />
              </div>
              <div className="flex items-center gap-2">
                <span>Headline Grad</span>
                <span className="h-4 w-10 rounded-full border border-neutral-700" style={{ background: `linear-gradient(90deg, ${textFx.gradFrom}, ${textFx.gradTo})` }} />
              </div>
              <div className="flex items-center gap-2">
                <span>Details Color</span>
                <span className="h-4 w-4 rounded-full border border-neutral-700" style={{ background: bodyColor }} />
              </div>
              <div className="flex items-center gap-2">
                <span>Venue Color</span>
                <span className="h-4 w-4 rounded-full border border-neutral-700" style={{ background: venueColor }} />
              </div>
              <div className="flex items-center gap-2">
                <span>Subtag Pill</span>
                <span className="h-4 w-4 rounded-full border border-neutral-700" style={{ background: subtagBgColor }} />
              </div>
              <div className="flex items-center gap-2">
                <span>Subtag Text</span>
                <span className="h-4 w-4 rounded-full border border-neutral-700" style={{ background: subtagTextColor }} />
              </div>
            </div>

            // -- Actions: Download / Upload --
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={downloadBrandKitFile}
                className="text-[11px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700"
                title="Download a portable brand kit file"
              >
                Download Brand Kit
              </button>

              <label className="text-[11px] px-2 py-1 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 cursor-pointer">
                Upload Brand Kit
                <input
                  type="file"
                  accept=".json,.nfbk.json,application/json"
                  className="hidden"
                  onChange={onUploadBrandKitFile}
                />
              </label>
            </div>

            <div className="mt-2 text-[11px] text-neutral-400">
              Tip: Brand kit is a portable JSON file (<code>.nfbk.json</code>). Share it with collaborators and load it on any device.
            </div>
</Collapsible>
*/}
{/* UI: BRAND KIT LITE (END) */}
          

{/* UI: AI BACKGROUND (BEGIN) */}
<Collapsible
  title="AI Background"
  storageKey="p_ai_bg"
  defaultOpen={true}
>
  <div className="space-y-3">
    {/* Style chips */}
    <div className="flex gap-2 text-xs flex-wrap">
      {(['urban','neon','vintage','tropical'] as GenStyle[]).map(s => (
        <Chip key={s} active={s===genStyle} onClick={()=> setGenStyle(s)}>
          {s.toUpperCase()}
        </Chip>
      ))}
    </div>

    {/* separator */}
    <div className="pt-1" />

    {/* Presets row */}
    <div className="text-[13px]">
      <div className="flex items-center gap-2">
        <select
          value={presetKey}
          onChange={(e) => setPresetKey(e.target.value)}
          aria-label="Preset"
          className="w-44 px-3 py-[6px] text-[13px] rounded bg-[#17171b] text-white border border-neutral-700"
        >
          <option value="">preset</option>
          {PRESETS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            const p = PRESETS.find((x) => x.key === presetKey);
            if (!p) { alert('Pick a preset'); return; }
            setGenStyle(p.style);
            setGenPrompt(p.prompt);
          }}
          className="px-3 py-[6px] text-[13px] rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
          title="Load preset into the prompt box"
        >
          Use
        </button>

        <button
          type="button"
          onClick={randomPreset}
          className="px-3 py-[6px] text-[13px] rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
          title="Pick a random preset"
        >
          Random
        </button>
      </div>
    </div>

    {/* separator */}
    <div className="pt-1" />

    {/* Prompt (adds to style) */}
    <div className="text-xs">
      <div className="mb-1">Prompt (adds to style)</div>
      <textarea
        value={genPrompt}
        onChange={(e) => setGenPrompt(e.target.value)}
        rows={3}
        placeholder="subject, lighting, background, mood…"
        className="mt-1 w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
      />
    </div>

    {/* Provider */}
    <div className="flex items-center gap-2 text-[11px]">
      <span>Provider</span>
      <Chip small active={genProvider==='auto'}  onClick={()=> setGenProvider('auto')}>Auto</Chip>
      <Chip small active={genProvider==='nano'}  onClick={()=> setGenProvider('nano')}>Nano</Chip>
      <Chip small active={genProvider==='openai'} onClick={()=> setGenProvider('openai')}>OpenAI</Chip>
    </div>

    {/* Batch + Size */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-[11px]">
        <span>Batch</span>
        <Chip small active={genCount===1} onClick={()=> setGenCount(1)}>1</Chip>
        <Chip small active={genCount===2} onClick={()=> setGenCount(2)}>2</Chip>
        <Chip small active={genCount===4} onClick={()=> setGenCount(4)}>4</Chip>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span>Size</span>
        <Chip small active={genSize==='1080'} onClick={()=> setGenSize('1080')}>1080</Chip>
        <Chip small active={genSize==='2160'} onClick={()=> setGenSize('2160')}>2160</Chip>
        <Chip small active={genSize==='3840'} onClick={()=> setGenSize('3840')}>3840</Chip>
      </div>
    </div>

    {/* ONE ROW: People | Diversity | Clarity */}
    <div className="grid grid-cols-[100px_110px_107px] justify-end items-end gap-4">
      {/* People label + single toggle */}
      <div className="flex items-end justify-end gap-2">
        <span className="text-[10px] text-neutral-300 mb-[6px]">People</span>
        <Chip
          small
          active={allowPeople}
          onClick={()=> setAllowPeople(v => !v)}
          title="Toggle people in generations"
        >
          {allowPeople ? 'On' : 'Off'}
        </Chip>
      </div>

      {/* Diversity stepper */}
      <div className="w-[110px]">
        <Stepper
          label="Diversity"
          value={variety}
          setValue={setVariety}
          min={0}
          max={6}
          step={1}
        />
      </div>

      {/* Clarity stepper */}
      <div className="w-[118px]">
        <Stepper
          label="Clarity"
          value={clarity}
          setValue={setClarity}
          min={0}
          max={1}
          step={0.05}
          digits={2}
        />
      </div>
    </div>

    {/* Subject selection */}
    <div className="flex items-center flex-wrap gap-2 text-[11px] pt-1">
      <span className="text-neutral-300">Subject</span>
      {SUBJECTS.map((s) => (
        <Chip
          key={s.key}
          small
          active={selectedSubject === s.key}
          onClick={() => setSelectedSubject(s.key)}
        >
          {s.label}
        </Chip>
      ))}
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => generateBackground()}
        disabled={genLoading}
        className="flex-1 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
      >
        {genLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-fuchsia-400 to-indigo-400 animate-pulse" />
              Creating Magic…
            </span>
          ) : (
            'Generate'
          )}
      </button>
    </div>

    {/* Placeholder notice */}
    {isPlaceholder && (
      <div className="text-[11px] p-2 rounded border border-amber-500/40 bg-amber-900/20">
        <div className="font-semibold text-amber-300">Using placeholder background</div>
        <div className="text-amber-200/90 mt-1">
          Provider error{genError ? `: ${genError}` : ''}. You can keep designing and retry generation anytime.
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => generateBackground()}
            className="px-2 py-1 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => { setGenProvider('nano'); }}
            className="px-2 py-1 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
          >
            Switch to Nano
          </button>
        </div>
      </div>
    )}

    {/* Candidates tray */}
    {genCandidates.length > 0 && (
      <div className="space-y-2">
        <div className="text-[11px] text-neutral-400">Select a background</div>
        <div className="grid grid-cols-2 gap-2">
          {genCandidates.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                if (src.startsWith('data:image/')) { setBgUploadUrl(src); setBgUrl(null); }
                else { setBgUrl(src); setBgUploadUrl(null); }
              }}
              className="relative group border border-neutral-700 rounded overflow-hidden hover:border-indigo-500"
              title="Use this background"
            >
              <img src={src} alt={`candidate ${i+1}`} className="w-full h-28 object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20" />
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Error */}
    {genError && <div className="text-xs text-red-400 break-words">{genError}</div>}
  </div>
</Collapsible>
{/* UI: AI BACKGROUND (END) */}



{/* UI: MAGIC BLEND PANEL (BEGIN) */}
<div className="mt-3">
  <div
    className={
      selectedPanel === "magic_blend"
        ? "relative rounded-xl border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all"
        : "relative rounded-xl border border-neutral-700 transition-all"
    }
  >
    <Collapsible
      title="Magic Blend"
      storageKey="p:magic_blend"
      isOpen={selectedPanel === "magic_blend"}
      onToggle={() =>
        useFlyerState
          .getState()
          .setSelectedPanel(selectedPanel === "magic_blend" ? null : "magic_blend")
      }
      titleClassName={selectedPanel === "magic_blend" ? "text-amber-400" : ""}
    >
      <div className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
        Select a cinematic <b>Style</b>, upload your assets, and let AI fuse them into a unified photo.
      </div>
      <div className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-2 text-[10px] text-amber-200/90">
        If Magic Blend is blocked for sensitive content, try a different subject/background,
        crop tighter, or use less revealing imagery.
      </div>

      {/* --- STYLE SELECT --- */}
      <div className="mb-4">
        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-2 block">
          Cinematic Style
        </label>

        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "club", label: "Club" },
            { key: "tropical", label: "Tropical" },
            { key: "jazz_bar", label: "Jazz Bar" },
            { key: "outdoor_summer", label: "Daytime" },
          ].map((s) => {
            const active = blendStyle === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setBlendStyle(s.key as any)}
                className={[
                  "rounded-md px-3 py-2 text-[10px] font-bold border transition-all uppercase tracking-wide",
                  active
                    ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                    : "border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200",
                ].join(" ")}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- BACKGROUND PRIORITY TOGGLE --- */}
      <div className="mb-4">
        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-2 block">
          Background Priority
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "upload", label: "Uploaded BG" },
            { key: "canvas", label: "Canvas BG" },
          ].map((s) => {
            const active = blendBackgroundPriority === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setBlendBackgroundPriority(s.key as any)}
                className={[
                  "rounded-md px-3 py-2 text-[10px] font-bold border transition-all uppercase tracking-wide",
                  active
                    ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                    : "border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200",
                ].join(" ")}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- UPLOAD SLOTS (Aligned) --- */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Slot 1: Subject */}
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 ml-1">
            Subject
          </label>
          <label className="block aspect-[3/4] rounded-lg border border-dashed border-neutral-700 bg-neutral-900/30 hover:bg-neutral-800 hover:border-neutral-500 transition-all cursor-pointer overflow-hidden relative group">
            {/* 🌀 LOADING STATE */}
            {isCuttingOut ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-neutral-300">
                <div className="w-5 h-5 border-2 border-white/10 border-t-amber-500 rounded-full animate-spin mb-2" />
                <span className="text-[8px] uppercase font-bold tracking-widest text-amber-500 animate-pulse">
                  Cutting...
                </span>
              </div>
            ) : blendSubject ? (
              <>
                <img
                  src={blendSubject}
                  className="w-full h-full object-contain p-1"
                  alt="Subject"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                    Change
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-600 group-hover:text-neutral-400 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-2 opacity-60"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-[9px] font-medium uppercase tracking-wider">
                  Portrait
                </span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleBlendUpload("subject", e.target.files[0])
              }
            />
          </label>
        </div>

        {/* Slot 2: Environment */}
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 ml-1">
            Environment
          </label>
          <label className="block aspect-[3/4] rounded-lg border border-dashed border-neutral-700 bg-neutral-900/30 hover:bg-neutral-800 hover:border-neutral-500 transition-all cursor-pointer overflow-hidden relative group">
            {blendBackground ? (
              <>
                <img
                  src={blendBackground}
                  className="w-full h-full object-cover"
                  alt="Background"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                    Change
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-600 group-hover:text-neutral-400 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-2 opacity-60"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <span className="text-[9px] font-medium uppercase tracking-wider">
                  Upload
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleBlendUpload("bg", e.target.files[0])
              }
            />
          </label>
        </div>
      </div>

      {/* --- CANVAS ACTION (Full Width, Above Generate) --- */}
      <div className="mb-3">
        <button
          type="button"
          onClick={pushCanvasBgToBlend}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-800/30 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 text-neutral-400 transition-all text-[10px] font-bold uppercase tracking-wider group"
          title="Capture the current background from your canvas"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          <span>Capture Canvas Background</span>
        </button>
      </div>

      {/* --- GENERATE BUTTON --- */}
      <div className="pt-2 border-t border-white/5">
        <button
          onClick={handleMagicBlend}
          disabled={isBlending || isCuttingOut || !blendSubject}
          className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${
            isBlending
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
              : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-900/20 hover:shadow-amber-900/40"
          }`}
        >
          {isBlending ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
              Generate Blend
            </>
          )}
        </button>
      </div>
    </Collapsible>
  </div>
</div>
{/* UI: MAGIC BLEND PANEL (END) */}



{/* UI: UPLOAD BACKGROUND (BEGIN) */}
<div
  className={
    selectedPanel === "background"
      ? "relative rounded-xl border border-blue-400"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Background"
    storageKey="p:bg"
    isOpen={selectedPanel === "background"}
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "background" ? null : "background")
    }
    titleClassName={
      selectedPanel === "background"
        ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]"
        : ""
    }
    right={
      <div className="flex items-center gap-2 text-[11px]">
        <Chip small onClick={triggerUpload}>Upload</Chip>
        {(bgUploadUrl || bgUrl) && (
          <>
            <Chip small onClick={fitBackground} title="Center & 100%">
              Fit
            </Chip>
            <Chip
              small
              onClick={() => {
                setBgScale(1.3);
                setBgPosX(50);
                setBgPosY(50);
              }}
              title="Slight zoom"
            >
              Fill
            </Chip>
            <Chip small onClick={clearBackground}>Clear</Chip>
          </>
        )}
      </div>
    }
  >
    {/*HIDDEN INPUTS*/}
    <input
      ref={bgRightRef}
      type="file"
      accept="image/*"
      onChange={onRightBgFile}
      className="hidden"
    />

    <input
      ref={logoPickerRef}
      type="file"
      accept="image/*"
      multiple
      onChange={onLogoFiles}
      className="hidden"
    />

    <input
      ref={logoSlotPickerRef}
      type="file"
      accept="image/*"
      onChange={onLogoSlotFile}
      // Must NOT be display:none; keep it off-screen & invisible instead
      style={{
        position: "fixed",
        left: "-9999px",
        width: 0,
        height: 0,
        opacity: 0,
      }}
    />

    <input
      ref={portraitSlotPickerRef}
      type="file"
      accept="image/*"
      onChange={onPortraitSlotFile}
      className="hidden"
    />

    <input
      ref={vibeUploadInputRef}
      type="file"
      accept="application/json,.json"
      style={{ display: "none" }}
      onChange={async (e) => {
        const file = e.target.files?.[0];
        // reset so picking the same file twice still triggers change
        e.target.value = "";
        if (!file) return;

        await handleUploadDesignFromVibe(file);
      }}
    />

    {(bgUploadUrl || bgUrl) ? (
      <div className="space-y-2">
        <div className="aspect-square w-full overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60">
          <img
            src={bgUploadUrl || bgUrl!}
            alt="Background preview"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        <div className="flex gap-2 text-[11px]">
          <Chip small onClick={fitBackground}>Center / 100%</Chip>
          <Chip small onClick={() => { setBgScale((s) => Math.min(3, s * 1.1)); }}>
            Zoom +
          </Chip>
          <Chip small onClick={() => { setBgScale((s) => Math.max(1, s / 1.1)); }}>
            Zoom −
          </Chip>
          <Chip small onClick={() => { setBgPosX(50); setBgPosY(50); }}>
            Re-center
          </Chip>
        </div>

        <div className="text-[11px] text-neutral-400">
          Tip: In <b>Move</b> → <b>background</b> mode, drag to pan and
          <span className="inline-block px-1 mx-1 rounded bg-neutral-800/70 border border-neutral-700">
            Ctrl
          </span>
          + scroll to zoom.
        </div>
      </div>
    ) : (
      <div className="text-[12px] text-neutral-300">
        No background yet. Click <b>Upload</b> to add an image, or use{" "}
        <b>AI Background</b> below to generate one.
        <div className="mt-2">
          <Chip small onClick={triggerUpload}>Upload background</Chip>
        </div>
      </div>
    )}
  </Collapsible>
</div>
{/* UI: UPLOAD BACKGROUND (END)*/}


{/* UI: BACKGROUND EFFECTS (BEGIN) */}
<div
  className={
    selectedPanel === "background" || selectedPanel === "bgfx"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Background Effects"
    storageKey="p:bgfx"
    defaultOpen={false}

    // ✅ OPEN when either Background or BGFX is active
    isOpen={selectedPanel === "background" || selectedPanel === "bgfx"}

    // ✅ BLUE TITLE when BGFX is active (this is what you were missing)
    titleClassName={
      selectedPanel === "bgfx"
        ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]"
        : ""
    }

    // ✅ Toggle specifically controls BGFX panel state
    onToggle={() =>
      useFlyerState
        .getState()
        .setSelectedPanel(selectedPanel === "bgfx" ? null : "bgfx")
    }

    right={
      <Chip
        small
        onClick={() => {
          setHue(0);
          setHaze(0.5);
          setVignette(true);
          setVignetteStrength(0.55);

          setBgPosX(50);
          setBgPosY(50);
          setBgScale(1);
          setBgBlur(0);
        }}
      >
        Reset
      </Chip>
    }
  >
    {/* Row 1: Haze | Hue | Vignette */}
    <div className="grid grid-cols-3 gap-3">
      <Stepper label="Haze" value={haze} setValue={setHaze} min={0} max={1} step={0.02} digits={2} />
      <Stepper label="Hue" value={hue} setValue={setHue} min={-180} max={180} step={1} />
      <Stepper label="Vignette" value={vignetteStrength} setValue={setVignetteStrength} min={0} max={0.9} step={0.02} digits={2} />
    </div>

    {/* Row 2: Scale | BG X | BG Y */}
    <div className="grid grid-cols-3 gap-3 mt-2">
      <Stepper label="Scale" value={bgScale} setValue={setBgScale} min={1} max={5} step={0.1} digits={2} />
      <Stepper label="BG X %" value={bgPosX} setValue={setBgPosX} min={0} max={100} step={1} />
      <Stepper label="BG Y %" value={bgPosY} setValue={setBgPosY} min={0} max={100} step={1} />
    </div>

    {/* Row 3: Blur */}
    <div className="mt-2 pt-2 border-t border-white/5">
      <Stepper label="Gaussian Blur (px)" value={bgBlur} setValue={setBgBlur} min={0} max={20} step={0.5} digits={1} />
    </div>
  </Collapsible>
</div>
{/* UI: BACKGROUND EFFECTS (END) */}




{/* UI: LIBRARY (BEGIN) */}
<div className="mt-3">
  <div
    className={
      selectedPanel === "icons"
        ? "relative rounded-xl border border-blue-400"
        : "relative rounded-xl border border-neutral-700 transition"
    }
  >
    <Collapsible
     title="Library"
storageKey="p:icons"
isOpen={useFlyerState((s) => s.selectedPanel) === "icons"}
onToggle={() => {
        const store = useFlyerState.getState();



        const next = store.selectedPanel === "icons" ? null : "icons";



        store.setSelectedPanel(next);
        store.setMoveTarget(next ? "icon" : null);
      }}
titleClassName={
  useFlyerState((s) => s.selectedPanel) === "icons"
    ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]"
    : ""
}

    >
      {/* hidden input shared by all 4 slots */}
      <input
        ref={IS_iconSlotPickerRef}
        type="file"
        accept="image/*"
        onChange={IS_onIconSlotFile}
        className="hidden"
      />

      {/* === SECTION 1: USER UPLOADS (ICON SLOTS) === */}
      <div className="text-[12px] text-neutral-300 mb-2">
        Upload up to 4 icons/logos. Then click <b>Place</b> to add to canvas.
      </div>
      <div className="grid grid-cols-2 gap-2">
        {IS_iconSlots.map((src, i) => (
          <div
            key={i}
            className="rounded-lg border border-neutral-700 bg-neutral-900/50 overflow-hidden"
          >
            <div className="aspect-square w-full bg-[linear-gradient(45deg,#222_25%,#000_25%,#000_50%,#222_50%,#222_75%,#000_75%,#000)] bg-[length:16px_16px] grid place-items-center">
              {src ? (
                <img
                  src={src}
                  alt={`icon slot ${i + 1}`}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <div className="text-[11px] text-neutral-400">Empty</div>
              )}
            </div>
            <div className="p-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => IS_triggerIconSlotUpload(i)}
                className="truncate rounded px-2 py-1 text-[11px] bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
                title="Upload into this slot"
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => IS_placeIconFromSlot(i)}
                className="truncate rounded px-2 py-1 text-[11px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                disabled={!src}
                title="Place on canvas"
              >
                Place
              </button>
              <button
                type="button"
                onClick={() => IS_clearIconSlot(i)}
                className="truncate rounded px-2 py-1 text-[11px] bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
                disabled={!src}
                title="Clear slot"
              >
                Clear
              </button>
            </div>
          </div>
        ))}
      </div>

    

      {/* === SELECTED EMOJI CONTROLS (like Graphics) === */}
      {(() => {
        let list: any[] = [];
        if (Array.isArray(emojis)) {
          list = emojis;
        } else if (emojis && typeof emojis === "object") {
          list = emojis[format] || [];
        }

        const sel = list.find((e: any) => e.id === selectedEmojiId);
        if (!sel) return null;

        const locked = !!sel.locked;

        return (
          <div
            className="panel mt-4 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3"
            data-portrait-area="true"
            onMouseDownCapture={(e) => e.stopPropagation()}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <div className="text-[12px] text-neutral-200 font-bold mb-2 flex justify-between items-center">
              <span>Emoji Controls</span>
              <span className="text-neutral-500 font-normal text-[10px]">
                {sel.id.split("_")[1] || "emoji"}
              </span>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <div className="text-[34px] select-none">{sel.char}</div>
              <button
                type="button"
                className="text-[11px] rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-3 py-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  useFlyerState.getState().updateEmoji(format, sel.id, {
                    locked: !locked,
                  });
                }}
              >
                {locked ? "Unlock" : "Lock"}
              </button>
            </div>

            <div className="mb-3">
              <div className="text-[11px] text-neutral-400 mb-1 flex justify-between">
                <span>Scale</span>
                <span>{Math.round((sel.scale || 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={5}
                step={0.05}
                value={sel.scale ?? 1}
                onChange={(e) => {
                  useFlyerState.getState().updateEmoji(format, sel.id, {
                    scale: Number(e.target.value),
                  });
                }}
                className="w-full accent-blue-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                disabled={locked}
              />
            </div>

            <div className="mb-3">
              <div className="text-[11px] text-neutral-400 mb-1 flex justify-between">
                <span>Opacity</span>
                <span>{Math.round((sel.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sel.opacity ?? 1}
                onChange={(e) => {
                  useFlyerState.getState().updateEmoji(format, sel.id, {
                    opacity: Number(e.target.value),
                  });
                }}
                className="w-full accent-blue-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                disabled={locked}
              />
            </div>

            <div className="mb-3">
              <div className="text-[11px] text-neutral-400 mb-1 flex justify-between">
                <span>Rotation</span>
                <span>{Math.round(sel.rotation ?? 0)}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={sel.rotation ?? 0}
                onChange={(e) => {
                  useFlyerState.getState().updateEmoji(format, sel.id, {
                    rotation: Number(e.target.value),
                  });
                }}
                className="w-full accent-blue-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                disabled={locked}
              />
            </div>

            <button
              className="w-full mt-1 text-[12px] bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 hover:border-red-500 text-red-200 rounded-md py-2 transition-all flex items-center justify-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                useFlyerState.getState().removeEmoji(format, sel.id);
                setSelectedEmojiId(null);
              }}
            >
              <span className="font-bold">✕</span> Delete Emoji
            </button>
          </div>
        );
      })()}

      {/* === SECTION 3: NIGHTLIFE GRAPHICS (PREMIUM) === */}
      <div className="mt-4 border-t border-neutral-800 pt-3">
        <div className="text-[12px] text-neutral-300 mb-2 font-bold">Nightlife Graphics</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              id: "hookah",
              label: "Hookah",
              paths: [
                "M58 14L70 14L70 26L58 26Z",
                "M54 26L74 26L80 40L74 52L54 52L48 40Z",
                "M64 52L64 78",
                "M52 86L76 86L76 98L52 98Z",
                "M80 36H92Q104 36 104 48V66",
                "M100 66L110 66",
              ],
            },
            {
              id: "bottle",
              label: "Bottle Service",
              paths: [
                "M54 14H74V24H54Z",
                "M58 24H70V36",
                "M58 36Q58 32 62 32H66Q70 32 70 36V88Q70 98 64 100Q58 98 58 88Z",
                "M58 88H70",
                "M58 96H70",
                "M80 54H96V80H80Z",
                "M88 80V98",
                "M82 98H94",
              ],
            },
            {
              id: "bucket",
              label: "Bucket Deals",
              paths: [
                "M32 44H96L90 108Q64 116 38 108L32 44Z",
                "M38 50H90",
                "M34 60Q22 76 26 100Q30 116 50 112",
                "M94 60Q106 76 102 100Q98 116 78 112",
                "M44 44L52 36L62 44L54 52Z",
                "M56 44L64 36L74 44L66 52Z",
                "M68 44L76 36L86 44L78 52Z",
                "M74 18L86 30L80 36L68 24Z",
                "M70 24L80 34L76 72L66 66Z",
              ],
            },
            {
              id: "drink",
              label: "Drink Specials",
              paths: [
                "M28 8A14 14 0 1 1 27.99 8Z",
                "M40 18L100 18L74 52L66 52Z",
                "M48 32L92 32",
                "M70 52L70 86",
                "M52 98L88 98",
                "M34 58A20 20 0 1 1 33.99 58Z",
                "M34 78L34 64",
                "M34 78L24 84",
                "M34 56L34 60",
                "M34 96L34 92",
                "M12 78L16 78",
                "M56 78L52 78",
              ],
            },
            {
              id: "venue",
              label: "Venue",
              paths: [
                "M64 20C46 20 32 34 32 52C32 76 64 108 64 108C64 108 96 76 96 52C96 34 82 20 64 20Z",
                "M64 52A10 10 0 1 0 64 32A10 10 0 0 0 64 52Z",
              ],
            },
            {
              id: "music",
              label: "Music",
              paths: [
                "M56 32L96 24V80",
                "M56 32V88",
                "M56 88A8 8 0 1 0 48 80A8 8 0 0 0 56 88Z",
                "M96 80A8 8 0 1 0 88 72A8 8 0 0 0 96 80Z",
              ],
            },
            {
              id: "time",
              label: "Time",
              paths: [
                "M64 28V60L82 70",
                "M64 112A48 48 0 1 0 64 16A48 48 0 0 0 64 112Z",
              ],
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="h-10 rounded-md bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all flex items-center gap-2 px-2 group relative overflow-hidden"
              title={`Add ${item.label}`}
              onClick={() => {
                const svgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${item.paths
                  .map((d) => `<path d="${d}"/>`)
                  .join("")}</svg>`;
                const svg = svgTemplate.replace("{{COLOR}}", "#ffffff");
                const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
                const url = `data:image/svg+xml;base64,${svgBase64}`;
                const id = `sticker_${item.id}_${Date.now()}_${Math.random()
                  .toString(36)
                  .slice(2, 7)}`;
                const store = useFlyerState.getState();
                store.addPortrait(format, {
                  id,
                  url,
                  x: 50,
                  y: 50,
                  scale: 0.6,
                  locked: false,
                  svgTemplate,
                  iconColor: "#ffffff",
                  label: item.label,
                  showLabel: true,
                  isSticker: true,
                });
                store.setSelectedPortraitId(id);
                store.setSelectedPanel("icons");
                store.setMoveTarget("icon");
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 128 128"
                fill="none"
                stroke="currentColor"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-neutral-200 group-hover:text-white transition-colors"
              >
                {item.paths.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
              <span className="text-[10px] font-semibold text-neutral-300 group-hover:text-white">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* === SECTION 3: GRAPHICS / STICKERS === */}
      <div className="mt-4 border-t border-neutral-800 pt-3">
        <div className="text-[12px] text-neutral-300 mb-2 font-bold">Graphics</div>
        <div
          className="grid grid-cols-4 gap-2"
          style={{
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {[
            { id: "mezcal_bottle", src: "https://cdn-icons-png.flaticon.com/512/8091/8091033.png", name: "Mezcal" },
            { id: "drink", src: "https://cdn-icons-png.flaticon.com/512/920/920587.png", name: "Drink" },
            { id: "tequila_bottle", src: "https://cdn-icons-png.flaticon.com/512/7215/7215911.png", name: "Tequila" },
            { id: "maracas", src: "https://cdn-icons-png.flaticon.com/512/6654/6654969.png", name: "Maracas" },
            { id: "mardi_gras", src: "https://cdn-icons-png.flaticon.com/512/4924/4924300.png", name: "Mardi Gras" },
            { id: "pin", src: "https://cdn-icons-png.flaticon.com/512/149/149059.png", name: "Pin" },
            { id: "vinyl2", src: "https://cdn-icons-png.flaticon.com/512/1834/1834342.png", name: "Vinyl Record" },
            { id: "margarita", src: "https://cdn-icons-png.flaticon.com/512/362/362504.png", name: "Margarita" },
          
          ].map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              className="aspect-square rounded-md bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all flex items-center justify-center p-2 group relative overflow-hidden"
              title={`Add ${sticker.name}`}
              onClick={() => {
                const id = `sticker_${sticker.id}_${Date.now()}`;
                useFlyerState.getState().addPortrait(format, {
                  id,
                  url: sticker.src,
                  x: 50,
                  y: 50,
                  scale: 0.5,
                  locked: false,
                  isSticker: true,
                });
                useFlyerState.getState().setSelectedPortraitId(id);
                useFlyerState.getState().setSelectedPanel("icons");
                useFlyerState.getState().setMoveTarget("icon");
              }}
            >
              <img
                src={sticker.src}
                alt={sticker.name}
                className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
                draggable={false}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <div className="text-white font-bold text-lg">+</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* === SELECTED STICKER CONTROLS === */}
      {/* === SELECTED STICKER CONTROLS (WITH CANVAS SELECTOR) === */}
{(() => {
  const list = portraits[format] || [];
  const stickers = list.filter((p) => !!(p as any)?.isSticker);

  if (!stickers.length) return null;

  const currentSel = list.find((p) => p.id === selectedPortraitId);
  const selectedIsSticker = !!(currentSel as any)?.isSticker;

  const activeStickerId = selectedIsSticker ? selectedPortraitId : stickers[0].id;
  const sel = stickers.find((p) => p.id === activeStickerId) || stickers[0];

  const locked = !!sel.locked;

  return (
    <div
      className="panel mt-4 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3"
      data-portrait-area="true"
      onMouseDownCapture={(e) => e.stopPropagation()}
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      <div className="text-[12px] text-neutral-200 font-bold mb-2 flex justify-between items-center">
        <span>Graphics on Canvas</span>
        <span className="text-[10px] opacity-50 font-mono">
          {stickers.length} total
        </span>
      </div>

      {typeof (sel as any).svgTemplate === "string" && (
        <div className="mb-3 flex items-center gap-2 text-[11px] text-neutral-300">
          <span className="opacity-80">Icon Color</span>
          <ColorDot
            value={(sel as any).iconColor || "#ffffff"}
            onChange={(value) => {
              const template = String((sel as any).svgTemplate || "");
              const nextSvg = template.replace("{{COLOR}}", value);
              const svgBase64 = btoa(unescape(encodeURIComponent(nextSvg)));
              const nextUrl = `data:image/svg+xml;base64,${svgBase64}`;
              useFlyerState.getState().updatePortrait(format, sel.id, {
                url: nextUrl,
                iconColor: value,
              });
            }}
          />
        </div>
      )}

      {/* SELECT GRAPHIC ON CANVAS */}
      <select
        className="w-full mb-3 text-[11px] bg-neutral-900 border border-neutral-700 rounded-md py-2 px-2 text-white outline-none"
        value={sel.id}
        onChange={(e) => {
          const id = e.target.value;
          const store = useFlyerState.getState();
          store.setSelectedPortraitId(id);
          store.setSelectedPanel("icons");
          store.setMoveTarget("icon");
        }}
      >
        {stickers.map((p, idx) => (
          <option key={p.id} value={p.id}>
            {(p.id.split("_")[1] || "graphic")} #{idx + 1}
            {p.locked ? " (locked)" : ""}
          </option>
        ))}
      </select>

      <div className="mb-4">
        <div className="text-[11px] text-neutral-400 mb-1 flex justify-between">
          <span>Scale</span>
          <span>{Math.round((sel.scale || 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.1}
          value={sel.scale ?? 1}
          disabled={locked}
          onChange={(e) =>
            useFlyerState.getState().updatePortrait(format, sel.id, {
              scale: Number(e.target.value),
            })
          }
          className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-neutral-700 accent-blue-500"
        />
      </div>

      <div className="mb-4">
        <div className="text-[11px] text-neutral-400 mb-1 flex justify-between">
          <span>Opacity</span>
          <span>{Math.round(((sel as any).opacity ?? 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={(sel as any).opacity ?? 1}
          disabled={locked}
          onChange={(e) =>
            useFlyerState.getState().updatePortrait(format, sel.id, {
              opacity: Number(e.target.value),
            })
          }
          className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-neutral-700 accent-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="text-[11px] bg-neutral-800 border border-neutral-600 rounded-md py-2"
          onClick={() =>
            useFlyerState.getState().updatePortrait(format, sel.id, {
              locked: !locked,
            })
          }
        >
          {locked ? "Unlock" : "Lock"}
        </button>

        <button
          className="text-[11px] bg-red-900/30 border border-red-700 rounded-md py-2"
          onClick={() => {
            removePortrait(format, sel.id);
            useFlyerState.getState().setSelectedPortraitId(null);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
})()}


      {/* === SECTION 4: FLARES (Local Files + Screen Mode) === */}
      <div className="mt-4 border-t border-neutral-800 pt-3">
        <div className="text-[12px] text-neutral-300 mb-2 font-bold">
          Flares & Light Leaks
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "flare01", src: "/flares/flare01.png", name: "Warm Flare" },
            { id: "flare02", src: "/flares/flare02.png", name: "Bright Flare" },
            { id: "flareBlue01", src: "/flares/flareBlue01.png", name: "Blue Streak" },
            { id: "flareBlue03", src: "/flares/flareBlue03.png", name: "Blue Glow" },
            { id: "sun01", src: "/flares/sun01.png", name: "Warm Sun" },
            { id: "sun02", src: "/flares/sun02.png", name: "Cool Sun" },
            { id: "sun03", src: "/flares/sun03.png", name: "Red Sun" },
            { id: "sun04", src: "/flares/sun04.png", name: "Green Sun" },
          ].map((flare) => (
            <button
              key={flare.id}
              type="button"
              className="aspect-square rounded-md bg-black border border-neutral-800 hover:border-neutral-600 transition-all flex items-center justify-center p-1 group relative overflow-hidden"
              title={`Add ${flare.name}`}
              onClick={() => {
                const id = `flare_${flare.id}_${Date.now()}_${Math.random()
                  .toString(36)
                  .slice(2, 7)}`;

                useFlyerState.getState().addPortrait(format, {
                  id,
                  url: flare.src,
                  x: 50,
                  y: 50,
                  scale: 0.8,
                  locked: false,
                  blendMode: "screen",
                  opacity: 0.9,
                  rotation: 0,
                  isFlare: true,
                });

                useFlyerState.getState().setSelectedPortraitId(id);

                // 🔥 KEEP LIBRARY OPEN FOR FLARE CONTROLS
                useFlyerState.getState().setSelectedPanel("icons");

                // still movable on canvas
                useFlyerState.getState().setMoveTarget("icon");

              }}
            >
              <img
                src={flare.src}
                alt={flare.name}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform opacity-90"
                draggable={false}
              />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* === SELECTED FLARE CONTROLS (Fixed UI with Sliders) === */}
      {/* === SELECTED FLARE CONTROLS (WITH CANVAS SELECTOR, NO BLEND MODE) === */}
{(() => {
  const list = portraits[format] || [];
  const flares = list.filter((p) => !!(p as any)?.isFlare);

  if (!flares.length) return null;

  const currentSel = list.find((p) => p.id === selectedPortraitId);
  const selectedIsFlare = !!(currentSel as any)?.isFlare;

  const activeFlareId = selectedIsFlare ? selectedPortraitId : flares[0].id;
  const sel = flares.find((p) => p.id === activeFlareId) || flares[0];

  const locked = !!sel.locked;

  const update = (patch: any) =>
    useFlyerState.getState().updatePortrait(format, sel.id, patch);

  return (
    <div
      className="panel mt-4 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3"
      data-portrait-area="true"
      onMouseDownCapture={(e) => e.stopPropagation()}
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      <div className="text-[12px] text-neutral-200 font-bold mb-2">
        Flares on Canvas
      </div>

      {/* SELECT FLARE ON CANVAS */}
      <select
        className="w-full mb-3 text-[11px] bg-neutral-900 border border-neutral-700 rounded-md py-2 px-2 text-white outline-none"
        value={sel.id}
        onChange={(e) => {
          const id = e.target.value;
          const store = useFlyerState.getState();
          store.setSelectedPortraitId(id);
          store.setSelectedPanel("icons");
          store.setMoveTarget("icon");
        }}
      >
        {flares.map((p, idx) => (
          <option key={p.id} value={p.id}>
            {(p.id.split("_")[1] || "flare")} #{idx + 1}
            {p.locked ? " (locked)" : ""}
          </option>
        ))}
      </select>

      <button
        className="w-full mb-3 text-[11px] bg-neutral-800 border border-neutral-600 rounded-md py-2"
        onClick={() => update({ locked: !locked })}
      >
        {locked ? "Unlock" : "Lock"}
      </button>

      <SliderRow
        label="Opacity"
        value={(sel as any).opacity ?? 1}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => update({ opacity: v })}
      />

      <SliderRow
        label="Scale"
        value={sel.scale ?? 1}
        min={0.1}
        max={3}
        step={0.1}
        onChange={(v) => update({ scale: v })}
      />

      <SliderRow
        label="Rotation"
        value={(sel as any).rotation ?? 0}
        min={-180}
        max={180}
        step={5}
        onChange={(v) => update({ rotation: v })}
      />

      <button
        className="mt-4 w-full text-[11px] bg-red-900/30 border border-red-700 rounded-md py-2"
        onClick={() => {
          removePortrait(format, sel.id);
          useFlyerState.getState().setSelectedPortraitId(null);
        }}
      >
        Delete Flare
      </button>
    </div>
  );
})()}

    </Collapsible>
  </div>
</div>
{/* UI: LIBRARY (END) */}


{/* UI: PORTRAITS — COMBINED SLOTS (BEGIN) */}
<div
  className={
    selectedPanel === "portrait"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Portraits"
    storageKey="p:portrait"
    isOpen={selectedPanel === "portrait"}
    onToggle={() =>
      (() => {
        const store = useFlyerState.getState();
        const next = selectedPanel === "portrait" ? null : "portrait";
        if (next === "portrait") {
          const list = store.portraits?.[format] || [];
          const sel = list.find((p: any) => p.id === store.selectedPortraitId);
          if (sel?.isFlare || sel?.isSticker) {
            store.setSelectedPortraitId(null);
          }
          store.setMoveTarget("portrait");
        }
        store.setSelectedPanel(next);
      })()
    }
    titleClassName={
      selectedPanel === "portrait"
        ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]"
        : ""
    }
  >
    {/* Header Controls */}
    <div className="mb-2 flex items-center justify-end gap-2 text-[11px]">
      <span>Legacy overlay</span>
      <Chip
        small
        active={enablePortraitOverlay}
        onClick={() => setEnablePortraitOverlay((v: boolean) => !v)}
        title="Show/Hide the old portrait overlay frame"
      >
        {enablePortraitOverlay ? "On" : "Off"}
      </Chip>
    </div>

    {/* Slots Grid */}
    <div className="grid grid-cols-2 gap-2">
      {[0, 1, 2, 3].map((i) => {
        const src = portraitSlots[i] || "";

        // Check if this specific slot is currently loading
        const isProcessing = removingBg && pendingPortraitSlot.current === i;

        // Check if on canvas
        const canvasInstances = portraits[format] || [];
        const onCanvas =
          canvasInstances.find((p) => p.id === selectedPortraitId && p.url === src) ||
          canvasInstances.find((p) => p.url === src);

        return (
          <div
            key={i}
            className={`border rounded-lg p-2 transition-colors ${
              onCanvas && selectedPortraitId === onCanvas.id
                ? "border-indigo-500 bg-indigo-900/10"
                : "border-neutral-700 bg-neutral-900/50"
            }`}
          >
            {/* Thumbnail Area */}
            <div className="h-24 rounded overflow-hidden border border-neutral-700 bg-neutral-900 grid place-items-center relative">
              {/* 🔥 LOADING OVERLAY */}
              {isProcessing ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-[9px] text-indigo-300 font-semibold uppercase tracking-wide">
                    Removing BG...
                  </span>
                </div>
              ) : src ? (
                <img
                  src={src}
                  alt={`portrait slot ${i + 1}`}
                  className="w-full h-full object-contain bg-white/5"
                  draggable={false}
                />
              ) : (
                <div className="text-[11px] text-neutral-500">Empty slot {i + 1}</div>
              )}

              {/* Active Indicator Badge (Hide if processing) */}
              {onCanvas && !isProcessing && (
                <div
                  className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"
                  title="Active on canvas"
                />
              )}
            </div>

            {/* Row 1: Main Actions */}
            <div className="mt-2 grid grid-cols-3 gap-1">
              {/* ✅ FIXED UPLOAD BUTTON */}
              <button
                type="button"
                className="text-[10px] px-1 py-1.5 rounded-md bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 text-neutral-300 truncate"
                title={src ? "Replace image" : "Upload new image"}
                disabled={isProcessing}
                onClick={() => {
                  pendingPortraitSlot.current = i;
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      pendingPortraitSlot.current = null;
                      return;
                    }
                    try {
                      setRemovingBg(true);
                      const originalUrl = await blobToDataURL(file);
                      const cutDataUrl = await removeBackgroundLocal(originalUrl);
                      setPortraitSlots((prev) => {
                        const next = [...prev];
                        next[i] = cutDataUrl;
                        try {
                          localStorage.setItem("nf:portraitSlots", JSON.stringify(next));
                        } catch {}
                        return next;
                      });
                      persistPortraitSlotSources(
                        portraitSlotSources.map((v, idx) => (idx === i ? originalUrl : v))
                      );
                    } catch (err: any) {

                      alert(`Failed: ${err.message}`);
                    } finally {
                      setRemovingBg(false);
                      pendingPortraitSlot.current = null;
                    }
                  };
                  input.click();
                }}
              >
                {src ? "Rep" : "Up"}
              </button>

              {/* Place */}
              <button
                type="button"
                className="text-[10px] px-1 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 truncate"
                disabled={!src || isProcessing}
                title="Add to canvas"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!src) return;

                  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                  const defaults = {
                    shrinkPx: 2,
                    featherPx: 2,
                    alphaBoost: 1.35,
                    decontaminate: 0.55,
                    alphaSmoothPx: 2,
                    edgeGamma: 1.1,
                    spillSuppress: 0.35,
                    alphaFill: 0.08,
                    edgeClamp: 0,
                  };

                  const newPortrait = {
                    id,
                    url: src,
                    x: 50,
                    y: 50,
                    scale: 0.85,
                    locked: false,
                    isSticker: false,
                    isFlare: false,
                    cleanup: defaults,
                    cleanupBaseUrl: src,
                  };

                  if (useFlyerState.getState().addPortrait) {
                    useFlyerState.getState().addPortrait(format, newPortrait);
                  }

                  useFlyerState.getState().setSelectedPortraitId(id);
                  useFlyerState.getState().setSelectedPanel("portrait");
                  useFlyerState.getState().setMoveTarget("portrait");
                }}
              >
                Place
              </button>

              {/* Clear */}
              <button
                type="button"
                className="text-[10px] px-1 py-1.5 rounded-md bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 text-neutral-300 disabled:opacity-50 truncate"
                disabled={!src || isProcessing}
                title="Clear slot & remove from canvas"
                onClick={() => {
                  const urlToRemove = portraitSlots[i];
                  if (urlToRemove) {
                    const currentList = portraits[format] || [];
                    const targets = currentList.filter((p) => p.url === urlToRemove);
                    targets.forEach((p) => useFlyerState.getState().removePortrait(format, p.id));
                    if (targets.some((p) => p.id === selectedPortraitId)) {
                      useFlyerState.getState().setSelectedPortraitId(null);
                      useFlyerState.getState().setDragging(null);
                    }
                  }
                  setPortraitSlots((prev) => {
                    const next = [...prev];
                    next[i] = "";
                    try {
                      localStorage.setItem("nf:portraitSlots", JSON.stringify(next));
                    } catch {}
                    return next;
                  });
                  persistPortraitSlotSources(
                    portraitSlotSources.map((v, idx) => (idx === i ? "" : v))
                  );
                }}
              >
                Clear
              </button>
            </div>

            {/* Row 2: Canvas Controls */}
            {onCanvas && !isProcessing && (
              <div className="mt-1 grid grid-cols-2 gap-1 pt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    useFlyerState
                      .getState()
                      .updatePortrait(format, onCanvas.id, { locked: !onCanvas.locked });
                    useFlyerState.getState().setSelectedPortraitId(onCanvas.id);
                  }}
                  className={`text-[10px] py-1 rounded-md border flex items-center justify-center gap-1 ${
                    onCanvas.locked
                      ? "bg-indigo-900/40 border-indigo-500/50 text-indigo-300"
                      : "bg-neutral-800 border-neutral-600 text-neutral-400 hover:text-white"
                  }`}
                  title={onCanvas.locked ? "Unlock Position" : "Lock Position"}
                >
                  {onCanvas.locked ? "🔒 Locked" : "🔓 Lock"}
                </button>

                <button
                  type="button"
                  onClick={() => useFlyerState.getState().removePortrait(format, onCanvas.id)}
                  className="text-[10px] py-1 rounded-md bg-red-900/20 border border-red-900/30 text-red-400 hover:bg-red-900/40 hover:text-red-300"
                  title="Remove from canvas"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Push to Merge Portrait (Magic Blend) */}
            {src && !isProcessing && (
              <button
                type="button"
                className="mt-2 w-full text-[10px] py-2 rounded-md bg-neutral-800/80 border border-neutral-600/80 text-neutral-200 font-medium tracking-[0.12em] uppercase whitespace-nowrap hover:bg-neutral-700/80 hover:border-neutral-400/80 transition-colors"
                onClick={async () => {
                  const source = portraitSlotSources[i] || src;
                  const subjectSrc = source.startsWith("blob:")
                    ? await blobUrlToDataUrl(source)
                    : source;
                  setBlendSubject(subjectSrc);
                  setSelectedPanel("magic_blend");
                  useFlyerState.getState().setSelectedPanel("magic_blend");
                }}
              >
                Merge Portrait
              </button>
            )}
          </div>
        );
      })}
    </div>

    {/* === TRANSFORM CONTROLS (Scale / Lock / Delete) === */}
    {selectedPortraitId &&
      (() => {
        const list = portraits[format] || [];
        const sel = list.find((p) => p.id === selectedPortraitId);
        if (!sel) return null;

        const locked = !!sel.locked;

        return (
          <div
            className="mt-3 p-3 rounded-lg border border-neutral-700 bg-neutral-900/40"
            data-portrait-area="true"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-neutral-300">Transform</span>
              <span className="text-[10px] text-neutral-500 font-mono">{sel.id.slice(-4)}</span>
            </div>

            {/* SCALE SLIDER */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Scale</span>
                <span>{Math.round((sel.scale || 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={4}
                step={0.05}
                value={sel.scale ?? 1}
                onChange={(e) =>
                  useFlyerState.getState().updatePortrait(format, sel.id, {
                    scale: Number(e.target.value),
                  })
                }
                disabled={locked}
                className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${
                  locked ? "bg-neutral-800 accent-neutral-600" : "bg-neutral-700 accent-indigo-500"
                }`}
              />
            </div>

            {/* BUTTONS: LOCK & DELETE */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  useFlyerState.getState().updatePortrait(format, sel.id, {
                    locked: !locked,
                  })
                }
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-[11px] border transition-colors ${
                  locked
                    ? "bg-indigo-900/30 border-indigo-500/50 text-indigo-300"
                    : "bg-neutral-800 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                <span>{locked ? "🔒 Locked" : "🔓 Lock"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  useFlyerState.getState().removePortrait(format, sel.id);
                  useFlyerState.getState().setSelectedPortraitId(null);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded text-[11px] bg-red-900/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
              >
                <span>🗑️ Delete</span>
              </button>
            </div>
          </div>
        );
      })()}

    {/* 🔥 RESTORED: CUTOUT CLEANUP PANEL 🔥 */}
    <div
      style={{
        marginTop: 14,
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 800, letterSpacing: 0.6, opacity: 0.9 }}>
          Cutout Cleanup
        </div>
        <div style={{ fontSize: 10, opacity: 0.5, fontFamily: "monospace" }}>
          {selectedPortraitId ? `ID: ${selectedPortraitId.slice(-4)}` : "No Selection"}
        </div>
      </div>

      {!selectedPortraitId ? (
        <div style={{ fontSize: 13, opacity: 0.6, fontStyle: "italic" }}>
          Select a placed portrait to adjust edges.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <SliderRow
            label="Shrink edge (px)"
            value={cleanupParams.shrinkPx}
            min={0}
            max={20}
            step={1}
            onChange={(v) => {
              const next = { ...cleanupParams, shrinkPx: v };
              setCleanupAndRun(next);
            }}
          />

          <SliderRow
            label="Feather (px)"
            value={cleanupParams.featherPx}
            min={0}
            max={20}
            step={1}
            onChange={(v) => {
              const next = { ...cleanupParams, featherPx: v };
              setCleanupAndRun(next);
            }}
          />

          <SliderRow
            label="Alpha boost"
            value={cleanupParams.alphaBoost}
            min={0.8}
            max={3}
            step={0.02}
            precision={2}
            onChange={(v) => {
              const next = { ...cleanupParams, alphaBoost: v };
              setCleanupAndRun(next);
            }}
          />

          <SliderRow
            label="Decontaminate"
            value={cleanupParams.decontaminate}
            min={0}
            max={1}
            step={0.01}
            precision={2}
            onChange={(v) => {
              const next = { ...cleanupParams, decontaminate: v };
              setCleanupAndRun(next);
            }}
          />

          {/* Advanced / Extra Params */}
          <div className="pt-2 border-t border-white/10" />

          <SliderRow
            label="Alpha smooth"
            value={cleanupParams.alphaSmoothPx}
            min={0}
            max={8}
            step={1}
            onChange={(v) => {
              const next = { ...cleanupParams, alphaSmoothPx: v };
              setCleanupAndRun(next);
            }}
          />

          <SliderRow
            label="Edge gamma"
            value={cleanupParams.edgeGamma}
            min={0.6}
            max={1.8}
            step={0.01}
            precision={2}
            onChange={(v) => {
              const next = { ...cleanupParams, edgeGamma: v };
              setCleanupAndRun(next);
            }}
          />
        </div>
      )}
    </div>
  </Collapsible>
</div>
{/* UI: PORTRAITS — COMBINED SLOTS (END) */}


{/* UI: LOGO — MIRROR OF PORTRAIT LOGIC (BEGIN) */}
<div
  id="logo-panel"
  className={
    selectedPanel === "logo"
      ? "relative rounded-xl border border-blue-400 transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Logo / 3D"
    storageKey="p:media"
    defaultOpen={false}
    isOpen={selectedPanel === "logo"}
    onToggle={() => {
      // ✅ toggle uses subscribed value, not getState()
      setSelectedPanel(selectedPanel === "logo" ? null : "logo");

      // ✅ if opening, scroll to the logo slots area next tick
      if (selectedPanel !== "logo") {
        setTimeout(() => {
          const el = document.getElementById("logo-panel");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      }
    }}
    titleClassName={
      selectedPanel === "logo"
        ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]"
        : ""
    }
  >
    <div className="text-[12px] text-neutral-300 mb-2">
      Manage logos and 3D text. Upload or generate, then place.
    </div>

    {/* --- SLOTS GRID --- */}
    <div className="grid grid-cols-2 gap-2 mb-4">
      {[0, 1, 2, 3].map((i) => {
        const src = logoSlots[i] || "";
        const list = portraits[format] || [];
        const onCanvas = list.find((p) => p.url === src);
        const isActive = !!(onCanvas && selectedPortraitId === onCanvas.id);

        return (
          <div
            key={i}
            className={`border rounded-lg p-2 transition-colors ${
              isActive
                ? "border-indigo-500 bg-indigo-900/10"
                : "border-neutral-700 bg-neutral-900/50"
            }`}
          >
            {/* Thumbnail */}
            <div className="h-20 rounded overflow-hidden border border-neutral-700 bg-neutral-900 grid place-items-center relative">
              {src ? (
                <img
                  src={src}
                  className="w-full h-full object-contain bg-[length:10px_10px] bg-[url('https://t3.ftcdn.net/jpg/02/03/90/58/360_F_203905816_kpsw9G2a6e02a0a256a5061695669046.jpg')]"
                  draggable={false}
                  alt=""
                />
              ) : (
                <div className="text-[11px] text-neutral-500">Empty {i + 1}</div>
              )}
              {isActive && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-2 grid grid-cols-3 gap-1">
              {/* Upload */}
              <button
                type="button"
                className="text-[10px] px-1 py-1.5 rounded-md bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 text-neutral-300 truncate"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = () => {
                      const next = [...logoSlots];
                      next[i] = String(r.result);

                      setLogoSlots(next);
                      try {
                        localStorage.setItem("nf:logoSlots", JSON.stringify(next));
                      } catch {}

                      // ✅ after upload, open the logo panel + scroll to it
                      setSelectedPanel("logo");
                      setTimeout(() => {
                        document
                          .getElementById("logo-panel")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 0);
                    };
                    r.readAsDataURL(file);
                  };
                  input.click();
                }}
              >
                {src ? "Rep" : "Up"}
              </button>

              {/* Place */}
              <button
                type="button"
                disabled={!src}
                className="text-[10px] px-1 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 truncate"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!src) return;

                  const id = `logo_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 7)}`;

                  // ✅ add as "logo_" item (so controls show)
                  addPortrait(format, {
                    id,
                    url: src,
                    x: 50,
                    y: 50,
                    scale: 1.0,
                    locked: false,
                    shadowBlur: 0,
                    shadowAlpha: 0.5,
                    cleanup: DEFAULT_CLEANUP,
                  });

                  // ✅ selection + move target should be portrait (same system as everything else)
                  setSelectedPortraitId(id);
                  setMoveTarget("portrait");

                  // ✅ keep panel open
                  setSelectedPanel("logo");
                }}
              >
                Place
              </button>

              {/* Clear */}
              <button
                type="button"
                disabled={!src}
                className="text-[10px] px-1 py-1.5 rounded-md bg-neutral-800 border border-neutral-600 hover:bg-neutral-700 text-neutral-300 disabled:opacity-50 truncate"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const next = [...logoSlots];
                  next[i] = "";
                  setLogoSlots(next);
                  try {
                    localStorage.setItem("nf:logoSlots", JSON.stringify(next));
                  } catch {}

                  // (optional) if the cleared slot was on-canvas, remove that instance too
                  if (onCanvas?.id) {
                    removePortrait(format, onCanvas.id);
                    if (selectedPortraitId === onCanvas.id) {
                      setSelectedPortraitId(null);
                    }
                  }
                }}
              >
                Clear
              </button>
            </div>
          </div>
        );
      })}
    </div>

   {/* --- ⚡️ ACTIVE ITEM CONTROLS (Only shows if a logo is selected) --- */}
{(() => {
  const store = useFlyerState.getState();
  const list = store.portraits?.[format] || [];
  const sel = list.find((p: any) => p.id === selectedPortraitId);

  // Only show controls if selection exists AND it's a logo/3D text
  if (!sel || !String(sel.id || "").startsWith("logo_")) return null;

  const shadowBlur = Number((sel as any).shadowBlur ?? 0);
  const shadowAlpha = Number((sel as any).shadowAlpha ?? 0.5);
  const locked = !!sel.locked;

  // ✅ Authoritative updater (always hits Zustand store)
  const update = (patch: any) => {
    const s = useFlyerState.getState();
    s.updatePortrait(format, sel.id, patch);
    // keep selection stable + ensure logo panel stays active
    s.setSelectedPortraitId(sel.id);
    s.setSelectedPanel("logo");
    s.setMoveTarget("logo");
  };

  return (
    <div
      className="mt-4 pt-4 border-t border-white/10"
      data-portrait-area="true"
      onMouseDownCapture={(e) => e.stopPropagation()}
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      <div className="text-[12px] font-bold text-indigo-300 mb-3 flex items-center gap-2">
        <span>✨ 3D / Logo Controls</span>
      </div>

      {/* 1. SCALE & SHADOW */}
      <div className="space-y-4 mb-6">
        <SliderRow
          label="Scale"
          value={Number(sel.scale ?? 1)}
          min={0.2}
          max={3}
          step={0.05}
          onChange={(v) => update({ scale: v })}
        />

        <SliderRow
          label="Opacity"
          value={Number((sel as any).opacity ?? 1)}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => update({ opacity: v })}
        />

        <SliderRow
          label="Drop Shadow"
          value={shadowBlur}
          min={0}
          max={100}
          step={1}
          onChange={(v) => update({ shadowBlur: v })}
        />

        {shadowBlur > 0 && (
          <SliderRow
            label="Shadow Opacity"
            value={shadowAlpha}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => update({ shadowAlpha: v })}
          />
        )}
      </div>

      {/* 2. CLEANUP TOOLS */}
      <div className="bg-black/20 p-3 rounded-lg border border-white/5">
        <div className="text-[11px] font-semibold text-neutral-400 mb-3 uppercase tracking-wider">
          Cutout Refinement
        </div>

        <div className="space-y-3">
          <SliderRow
            label="Shrink Edge"
            value={cleanupParams.shrinkPx}
            min={0}
            max={10}
            step={0.5}
            onChange={(v) => setCleanupAndRun({ ...cleanupParams, shrinkPx: v })}
          />
          <SliderRow
            label="Feather"
            value={cleanupParams.featherPx}
            min={0}
            max={10}
            step={0.5}
            onChange={(v) => setCleanupAndRun({ ...cleanupParams, featherPx: v })}
          />
          <SliderRow
            label="Decontaminate"
            value={cleanupParams.decontaminate}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setCleanupAndRun({ ...cleanupParams, decontaminate: v })}
          />
        </div>
      </div>

      {/* 3. ACTIONS */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => update({ locked: !locked })}
          className="flex-1 py-2 rounded bg-neutral-800 border border-neutral-600 text-xs text-neutral-300 hover:bg-neutral-700"
        >
          {locked ? "Unlock Position" : "Lock Position"}
        </button>

        <button
          type="button"
          onClick={() => {
            const s = useFlyerState.getState();

            // ✅ actually remove the logo render from the canvas list
            s.removePortrait(format, sel.id);

            // ✅ clear selection/drag so UI doesn't ghost-select
            s.setSelectedPortraitId(null);
            s.setDragging?.(null);

            // ✅ keep the sidebar in Logo / 3D
            s.setSelectedPanel("logo");
            s.setMoveTarget("logo");
          }}
          className="flex-1 py-2 rounded bg-red-900/20 border border-red-900/40 text-xs text-red-400 hover:bg-red-900/30"
        >
          Delete
        </button>
      </div>
    </div>
  );
})()}

  </Collapsible>
</div>
{/* UI: LOGO — MIRROR OF PORTRAIT LOGIC (END) */}
</aside>

{/* --- MOBILE ACTION BAR --- */}
      </section>
      {/* ===== UI: MAIN 3-COL LAYOUT (END) ===== */}


{/* ===== CINEMATIC CREATION MODAL (FINAL PRESET UI) ===== */}
<AnimatePresence>
  {cinematicModalOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#121214] border border-neutral-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>✨</span> 3D Render Studio
          </h3>

          <button
            type="button"
            onClick={() => {
              if (isGeneratingCinematic) return;
              setCinematicModalOpen(false);
            }}
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {isGeneratingCinematic ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 border-4 border-white/10 border-t-fuchsia-500 rounded-full animate-spin"></div>
              <div>
                <div className="text-lg font-bold text-white">Rendering Scene...</div>
                <div className="text-xs text-neutral-400 mt-1">
                  Applying physics & lighting reflections
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                Choose Reference Style
              </div>

              <div className="grid grid-cols-2 gap-2">
                {CINEMATIC_REF_LIBRARY.map((ref) => {
                  const active = cinematicRefUrl === ref.src;
                  return (
                    <button
                      key={ref.id}
                      type="button"
                      onClick={() => setCinematicRefUrl(ref.src)}
                      className={[
                        "rounded-lg border overflow-hidden text-left transition",
                        active
                          ? "border-fuchsia-500/60 bg-fuchsia-500/10"
                          : "border-neutral-700 bg-white/5 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="aspect-square bg-black/40">
                        <img
                          src={ref.src}
                          alt={ref.label}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      </div>
                      <div className="px-2 py-2 text-[10px] font-semibold text-neutral-200">
                        {ref.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                  Or Upload Reference
                </label>
                <label className="mt-2 flex flex-col items-center justify-center w-full h-14 rounded border border-dashed border-neutral-700 bg-black/20 hover:bg-black/30 cursor-pointer text-[11px] text-neutral-400">
                  <span>Click to upload a reference image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => setCinematicRefUrl(String(r.result));
                      r.readAsDataURL(f);
                    }}
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                  Text to Replace
                </label>
                <input
                  value={cinematicTextInput}
                  onChange={(e) => setCinematicTextInput(e.target.value)}
                  className="mt-2 w-full rounded-lg p-3 bg-black/50 text-white text-center text-xl font-bold border border-white/10 focus:border-fuchsia-500 outline-none"
                  placeholder="LOVE"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCreateCinematic}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold text-sm hover:from-indigo-500 hover:to-fuchsia-500 transition-all shadow-lg active:scale-[0.98] ring-1 ring-white/20"
                >
                  Render Text
                </button>
              </div>

              {cinematicDebug?.final && (
                <div className="pt-2 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                    Preview
                  </div>
                  <img
                    src={cinematicDebug.final}
                    alt="Cinematic text preview"
                    className="w-full rounded border border-white/10"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


   </main>
  </>
  );
}
/* ===== BLOCK: PAGE (END) ===== */
