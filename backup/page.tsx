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
import { useTextStyles, useSetTextStyle } from "../app/state/textStyles";
import { canvasRefs } from "../lib/canvasRefs";
import type { TemplateBase } from "../lib/templates";
import type { MoveTarget } from "../app/state/flyerState";
import { loadTemplate } from '../lib/template-utils';

import {
  HEADLINE_FONTS_LOCAL,
  HEADLINE2_FONTS_LOCAL,
  BODY_FONTS_LOCAL,
  BODY_FONTS2_LOCAL,
  VENUE_FONTS_LOCAL,
  SUBTAG_FONTS_LOCAL,
} from '../lib/fonts';
import { FONT_FILE_MAP } from "lib/localFontMap";
console.log("🔵 HEADLINE_FONTS_LOCAL:", HEADLINE_FONTS_LOCAL);

// === MEMOIZED HEADLINE COMPONENT ===
interface MemoHeadlineProps {
  children: React.ReactNode;
  style: React.CSSProperties;
}




const textStyles = useTextStyles();
const setTextStyle = useSetTextStyle();

function normalizeFormat(fmt: string): "square" | "story" {
  return fmt === "square" || fmt === "story" ? fmt : "square";
}




// ——— Template variant resolver (square/story with fallbacks) ———
function getVariant(tpl: TemplateSpec, fmt: Format) {
  // prefer explicit format, then square fallback, then base
  return (tpl as any).formats?.[fmt]
      ?? (tpl as any).formats?.square
      ?? tpl.base
      ?? null;
}



// === DRAG PERFORMANCE REFS ===
let dragRaf = 0;

// true during drag – this does NOT trigger react renders
const draggingRef = { current: false };

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
export async function removePortraitBackgroundFromURL(url: string): Promise<string> {
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

export function Stepper({
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


function Chip({ active, onClick, children, small, disabled, title }: {
  active?: boolean; onClick?: () => void; children: React.ReactNode; small?: boolean; disabled?: boolean; title?: string
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
          : 'cursor-pointer bg-neutral-900/70 border-neutral-700 hover:bg-neutral-800 text-neutral-200'
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
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Open the native color picker immediately on click
  const openPicker = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <span className="inline-flex items-center">
  <button
    type="button"
    title={title || 'Pick color'}
    onClick={openPicker}
    disabled={!!disabled}
    style={{
      width: 16,
      height: 16,
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.35)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
      background: value || '#ffffff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      outline: 'none',
    }}
    className="align-middle"
  />

  {/* 🔥 INLINE DEBUGGER INSERTED HERE */}
  {(() => {
    console.log("🎨 INLINE ColorDot incoming value =", value);

    if (
      value &&
      typeof value === "string" &&
      value.startsWith("#") &&
      value.length !== 7
    ) {
      console.error("❌ INVALID HEX IN INLINE ColorDot:", title, "→", value);
      debugger;
    }

    return null;
  })()}

   {/* Hidden native color input (invoked programmatically) */}
  <input
    ref={inputRef}
    type="color"
    value={(function () {
      console.log("🎨 ColorDot incoming value =", value);

      // 🔒 Normalize any bad / short values BEFORE giving to <input type="color">
      if (!value || typeof value !== "string") {
        return "#ffffff";
      }

      // If short hex like "#fff", expand to "#ffffff"
      if (value.startsWith("#") && value.length === 4) {
        const r = value[1];
        const g = value[2];
        const b = value[3];
        return `#${r}${r}${g}${g}${b}${b}`;
      }

      // If proper #rrggbb, keep it
      if (value.startsWith("#") && value.length === 7) {
        return value;
      }

      // Anything else → hard fallback
      return "#ffffff";
    })()}
    onChange={handleChange}
    style={{
      position: "absolute",
      opacity: 0,
      pointerEvents: "none",
      width: 0,
      height: 0,
      padding: 0,
      margin: 0,
      border: 0,
    }}
    tabIndex={-1}
    aria-hidden="true"
  />

</span>

  );
};
// ===== /ColorDot =====

/* ===== BLOCK: MINI-UTILS (END) ===== */

// ===== PATCH NAV-001: keyboard nudge helpers =====
const VIRTUAL_PAD = 120; // % travel beyond each edge allowed for text/logo/shape

function clamp01(n: number) { return Math.max(0, Math.min(100, n)); }

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
      const useClamp = (t === 'background') ? clamp01 : clampVirtual;

      getters.setPos(t, useClamp(cur.x + dx * step), useClamp(cur.y + dy * step));
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


/* ===== BLOCK: COLLAPSIBLE (BEGIN – PATCHED) ===== */
const Collapsible: React.FC<{
  title: string;
  storageKey: string;
  defaultOpen?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
  titleClassName?: string;
  activeKey?: string;              // 👈 NEW: which panel should glow
  currentActive?: string;          // 👈 NEW: current active panel
}> = ({
  title,
  storageKey,
  defaultOpen = false,
  right,
  children,
  titleClassName,
  activeKey,
  currentActive
}) => {
  const STORAGE_VERSION = 'v1';
  const key = `${storageKey}:${STORAGE_VERSION}`;

  const [open, setOpen] = React.useState<boolean>(false);
  const mountedRef = React.useRef(false);

  // ---------------------------------------------
  // Load from localStorage OR defaultOpen
  // ---------------------------------------------
  React.useEffect(() => {
    mountedRef.current = true;
    try {
      const v = localStorage.getItem(key);
      if (v === '1') setOpen(true);
      if (v === '0') setOpen(false);
      if (v === null) setOpen(!!defaultOpen);
    } catch {}
    return () => { mountedRef.current = false };
  }, [key, defaultOpen]);

  // ---------------------------------------------
  // Persist state
  // ---------------------------------------------
  React.useEffect(() => {
    if (!mountedRef.current) return;
    try { localStorage.setItem(key, open ? '1' : '0'); } catch {}
  }, [open, key]);

  // ---------------------------------------------
  // 🟦 AUTO-OPEN IF THIS PANEL BECOMES ACTIVE
  // ---------------------------------------------
  React.useEffect(() => {
    if (activeKey && currentActive === activeKey) {
      setOpen(true);
    }
  }, [currentActive, activeKey]);

  // ---------------------------------------------
  // 🟦 HIGHLIGHT IF ACTIVE
  // ---------------------------------------------
  const isActive = activeKey && currentActive === activeKey;

  return (
    <section className={panelClass}>
     <div className="w-full flex items-center gap-2">
        <div className="flex-1">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            title={open ? 'Collapse' : 'Expand'}
            // 🔥 PATCH: Remove static highlight and let Framer Motion handle the border/shadow on the parent section tag.
            className={clsx(
              "w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-800/40 focus:outline-none group",
              isActive && "bg-neutral-800/40" // Keep background dark, but remove the jarring ring/border
            )}
          >
            <span
              className={clsx(
                "inline-block transition-transform text-neutral-300 group-hover:text-white",
                open ? "rotate-90" : "rotate-0"
              )}
            >
              ▸
            </span>

            <span
              className={clsx(
                "text-xs uppercase tracking-wider group-hover:text-white",
                titleClassName ?? "text-neutral-300",
                isActive && "text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.9)]" // 👈 neon text glow
              )}
            >
              {title}
            </span>
          </button>
        </div>

        {right && (
          <div
            className="ml-auto flex items-center gap-2"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
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
            className="mt-3 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};
/* ===== BLOCK: COLLAPSIBLE (END – PATCHED) ===== */


/* ===== TEMPLATE GALLERY (LOCAL, SELF-CONTAINED) ===== */
const TemplateGalleryPanel = ({
  items,
  onApply,
  format,
}: {
  items: TemplateSpec[];
  onApply: (tpl: TemplateSpec, opts?: { targetFormat?: Format }) => void;
  format: Format;
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
      defaultOpen
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

              {/* ✅ APPLY BUTTON FIX */}
            <button
              type="button"
              className="text-[12px] px-2 py-1 rounded-md border border-indigo-400/40 bg-indigo-600/20 hover:bg-indigo-600/30 focus-ring"
              onClick={() => {
                // 🧠 Find full template by ID — ensures we get formats, base, etc.
                const fullTpl = TEMPLATE_GALLERY.find(tt => tt.id === t.id);

                if (!fullTpl) {
                  console.warn(`⚠️ Template ${t.id} not found in TEMPLATE_GALLERY`);
                  return;
                }

                const tplFormat = typeof format !== 'undefined' ? format : 'square';
                console.log(`🟢 Applying FULL template ${fullTpl.id} for format: ${tplFormat}`);

                onApply(fullTpl, { targetFormat: tplFormat });
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

/* ===== /TEMPLATE GALLERY ===== */


/* ===== BLOCK: TYPES & TEMPLATES (BEGIN) ===== */
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
    locations: ['alleyway with wet asphalt','rooftop skyline','industrial warehouse bay','brick wall with posters','underground parking garage','metro entrance steam'],
    lighting: ['sodium-vapor streetlights','cinematic rim light and fog','misty backlight, shafts of light','puddle reflections','smoke machine haze','hard contrast pools of light'],
    camera: ['85mm shallow depth of field','low angle hero shot','anamorphic bokeh','handheld motion blur','long exposure light streaks'],
    micro: ['subtle lens dirt','fine raindrops','spray paint dust','neon sign flicker','tiny dust motes in light','metallic glints'],
    colorways: ['amber and charcoal','teal and amber','burnt orange highlights','cool blue shadows with warm accents'],
  },
  neon: {
    locations: ['chromed club hallway','LED tunnel corridor','glass panels and reflections','street market signs','cyber club dance floor','mirror wall'],
    lighting: ['cyan-magenta neon glow','laser light blades','volumetric haze','rim lighting with bloom','reflective wet floor','holographic shimmer'],
    camera: ['35mm wide dynamic','tilted Dutch angle','prism diffraction','split diopter feel','macro bokeh orbs'],
    micro: ['specular glossy highlights','light leaks','haze sparkle','chrome edges','vapor trails','pixel grid shimmer'],
    colorways: ['cyan & magenta','purple & electric blue','hot pink accents','neon green pops','violet with teal'],
  },
  vintage: {
    locations: ['velvet lounge interior','smoky jazz corner','old theater curtain','mid-century bar wood paneling','retro wallpaper vignette'],
    lighting: ['golden hour warmth','soft tungsten practicals','gentle halation','filmic glow','subtle backlight haze'],
    camera: ['50mm classic portrait','soft diffusion filter','film grain texture','bokeh from vintage lenses','slight vignette edging'],
    micro: ['dust and scratches','paper texture hint','faded color edges','lens flare streak','sepia undertone'],
    colorways: ['muted golds and browns','faded teal & cream','portra-inspired palette','warm amber highlights with deep blacks'],
  },
  tropical: {
    locations: ['beach club boardwalk','palm-lined terrace','poolside cabana','tiki bar backdrop','sunset shoreline','lush jungle edge'],
    lighting: ['golden sunset flares','tropical cyan water glow','dappled palm shadows','backlit haze','warm ambient lanterns'],
    camera: ['wide 28mm with shallow DOF','low angle toward sky','lens flare streaks','soft diffusion','bokeh from string lights'],
    micro: ['salt spray mist','palm leaf texture','wet skin highlights','sand sparkle','neon cocktail reflections'],
    colorways: ['sunset orange & teal','aqua & coral','lime accents with deep cyan','warm amber & tropical greens'],
  }
};



/** ===== SUPER FIRE PRESETS (drop-in base prompts) ===== */
type PromptPreset = { key: string; label: string; style: GenStyle; prompt: string };

type TemplateTag =
  | 'EDM' | 'Hip-Hop' | 'R&B Lounge' | 'Latin' | 'College' | 'Seasonal'
  | 'Neon' | 'Urban' | 'Vintage' | 'Tropical' | 'Ladies Night' | 'Techno';



// put this before TEMPLATE_GALLERY
const PRESETS: PromptPreset[] = [
  // ——— NEON ———
  {
    key: 'edm_tunnel',
    label: 'EDM Rave — Laser Tunnel',
    style: 'neon',
    prompt:
      'LED tunnel corridor with repeating arches, cyan–magenta neon glow, reflective wet floor, volumetric haze beams, prism diffraction bokeh, energy and motion, sleek futuristic surfaces, background only, no text',
  },
  {
    key: 'edm_stage_co2',
    label: 'EDM Rave — Stage + CO₂',
    style: 'neon',
    prompt:
      'club stage with laser blades and CO₂ plumes, crowd silhouettes, neon rim light, fog depth, glossy panels and reflections, cinematic bloom, background only, no text',
  },
  {
    key: 'ladies_pinkchrome',
    label: 'Ladies Night — Pink Chrome',
    style: 'neon',
    prompt:
      'glossy chrome hallway, hot pink and violet lights, specular highlights, soft haze, mirror reflections, luxurious party vibe, background only, no text',
  },
  {
    key: 'kpop_pastel_led',
    label: 'K-Pop Night — Pastel LED',
    style: 'neon',
    prompt:
      'pastel LED wall with grid light pattern, soft bloom, glass reflections, clean glossy floor, modern pop aesthetic, background only, no text',
  },

  // ——— URBAN ———
  {
    key: 'hiphop_graffiti',
    label: 'Hip-Hop — Graffiti Alley',
    style: 'urban',
    prompt:
      'alleyway with wet asphalt and layered graffiti, cinematic rim light through haze, puddle reflections, realistic textures, gritty yet stylish, background only, no text',
  },
  {
    key: 'hiphop_lowrider',
    label: 'Hip-Hop — Lowrider Chrome',
    style: 'urban',
    prompt:
      'low angle urban street with chrome reflections, sodium-vapor streetlights, light mist, bokeh highlights, premium editorial vibe, background only, no text',
  },
  {
    key: 'dnb_bunker',
    label: 'Drum & Bass — Concrete Bunker',
    style: 'urban',
    prompt:
      'industrial warehouse bay with concrete pillars, fog machine haze, high contrast pools of light, long exposure light streak hints, underground rave feel, background only, no text',
  },
  {
    key: 'college_stadium',
    label: 'College Night — Stadium Lights',
    style: 'urban',
    prompt:
      'stadium tunnel glow spilling onto concrete, cool blue shadows with warm accents, motion blur hints, energetic youthful vibe, background only, no text',
  },

  // ——— VINTAGE ———
  {
    key: 'rnb_velvet',
    label: 'R&B Lounge — Velvet & Smoke',
    style: 'vintage',
    prompt:
      'velvet lounge interior with warm tungsten practicals, gentle halation, soft diffusion, smoky atmosphere, subtle film grain, intimate upscale mood, background only, no text',
  },
  {
    key: 'disco_mirrorball',
    label: 'Disco — Mirrorball Bloom',
    style: 'vintage',
    prompt:
      'mirrorball light speckles across retro wallpaper, lens diffusion, warm amber highlights, subtle vignette, nostalgic glamour, background only, no text',
  },
  {
    key: 'nye_gold',
    label: 'NYE — Gold Confetti Glam',
    style: 'vintage',
    prompt:
      'gold confetti sparkle bokeh, champagne glow, soft halation, black tie elegance, editorial lighting, background only, no text',
  },
  {
    key: 'karaoke_retro_mic',
    label: 'Karaoke — Retro Mic Glow',
    style: 'vintage',
    prompt:
      'vintage microphone on small stage, tungsten spot, velvet curtain, gentle haze, filmic glow, cozy nightlife vibe, background only, no text',
  },

  // ——— TROPICAL ———
  {
    key: 'latin_street_tropical',
    label: 'Latin / Reggaeton — Tropical Street',
    style: 'tropical',
    prompt:
      'palm-lined terrace with string lights, warm sunset flares, aqua accents, lively street energy, glossy highlights, background only, no text',
  },
  {
    key: 'latin_neon_bar',
    label: 'Latin — Neon Salsa Bar',
    style: 'tropical',
    prompt:
      'neon cocktail reflections on polished bar, tropical cyan and coral palette, dappled palm shadows, festive atmosphere, background only, no text',
  },
  {
    key: 'afrobeat_rooftop',
    label: 'Afrobeat — Golden Rooftop',
    style: 'tropical',
    prompt:
      'rooftop at golden hour, warm ambient lanterns, soft backlit haze, vibrant colors, stylish nightlife mood, background only, no text',
  },

  // ——— SEASONAL / SPECIAL ———
  {
    key: 'halloween_cinema',
    label: 'Halloween — Haze & Orange Rim',
    style: 'urban',
    prompt:
      'moody alley with fog, orange rim light and deep blue shadows, cinematic contrast, subtle spooky ambience, background only, no text',
  },
  {
    key: 'pride_rainbow_beams',
    label: 'Pride — Rainbow Beams',
    style: 'neon',
    prompt:
      'glass corridor with rainbow light beams through haze, reflective floor, vibrant inclusive party energy, background only, no text',
  },
  {
    key: 'techno_warehouse',
    label: 'Techno — Industrial Fog',
    style: 'urban',
    prompt:
      'massive warehouse with repeating trusses, strobes through heavy fog, cold steel textures, minimalist brutal elegance, background only, no text',
  },
  {
    key: 'techhouse_strip',
    label: 'Tech House — Strobe Strip',
    style: 'neon',
    prompt:
      'strobing LED strip wall, geometric patterns, clean modern lines, crisp haze, glossy surfaces, background only, no text',
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
 */
/* >>> BEGIN — renderHeadlineRich with lineStyle <<< */
function renderHeadlineRich(
  text: string,
  opts: {
    baseTrackEm: number;
    leadDeltaEm: number;
    lastDeltaEm: number;
    opticalMargin: boolean;
    kerningFix: boolean;
    /** NEW: extra style applied on EACH rendered line span */
    lineStyle?: React.CSSProperties;
  }
) {
  const lines = String(text || '').split('\n');
  return lines.flatMap((ln, idx) => {
    const isFirst = idx === 0;
    const isLast  = idx === lines.length - 1;

    const hang = (opts.opticalMargin && ln.length)
      ? (HANG_MAP[ln[0]] || 0)
      : 0;

    const track =
      (opts.baseTrackEm || 0) +
      (isFirst ? (opts.leadDeltaEm || 0) : 0) +
      (isLast  ? (opts.lastDeltaEm || 0) : 0);

    const lineNode = (
      <span
        key={`hl-${idx}`}
        style={{
          display: 'block',
          letterSpacing: `${track}em`,
          // “hang” pulls the first glyph into the margin, then pads it back
          marginLeft: hang ? `-${hang}em` : undefined,
          paddingLeft: hang ? `${hang}em` : undefined,
          lineHeight: 'inherit',
          ...(opts.lineStyle || {})   // << apply gradient/stroke here when needed
        }}
      >
        {applyKerning(ln, opts.kerningFix)}
      </span>
    );

    return isLast ? [lineNode] : [lineNode, <br key={`br-a-${idx}`} />, <br key={`br-b-${idx}`} />];
  });
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
  headline: string; headlineFamily: string; textFx: TextFx; align: Align; lineHeight: number; textColWidth: number; tallHeadline: boolean; headX: number; headY: number;
  details: string; bodyFamily: string; bodyColor: string; bodySize: number; bodyUppercase: boolean; bodyBold: boolean; bodyItalic: boolean; bodyUnderline: boolean; bodyTracking: number; detailsX: number; detailsY: number;
  /** DETAILS 2 (new) */
  details2: string; details2X: number; 
  details2Y: number; details2Align: Align; details2LineHeight: number; details2Family?: string; details2Color?: string; details2Size: number; details2LetterSpacing: number; 
  

  venue: string; venueFamily: string; venueColor: string; venueSize: number; venueX: number; venueY: number; clarity: number;
  subtag: string; subtagFamily: string; subtagBgColor: string; subtagTextColor: string; subtagAlpha: number; subtagX: number; subtagY: number;
  showGuides: boolean; showFaceGuide: boolean; faceRight: number; faceTop: number; faceW: number; faceH: number; venueLineHeight: number;
  portraitX: number; portraitY: number; portraitScale: number; detailsLineHeight: number; subtagUppercase: boolean; bgScale: number; details2Enabled: boolean; 
  headSizeAuto: boolean; headManualPx: number; headMaxPx: number;  
  subtagAlign: Align;
  subtagColor: string;

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
    headline, headlineFamily, textFx, align, lineHeight, textColWidth, tallHeadline, headX, headY, 
    details, bodyFamily, bodyColor, bodySize, bodyUppercase, bodyBold, bodyItalic, bodyUnderline, bodyTracking, detailsX, detailsY,
    venue, venueFamily, venueColor, venueSize, venueX, venueY, venueLineHeight, detailsFamily, 
    subtagEnabled, subtag, subtagFamily, subtagBgColor, subtagTextColor, subtagAlpha, subtagX, subtagY,
    showGuides, showFaceGuide, faceRight, faceTop, faceW, faceH, allowPeople,
    moveMode, snap, detailsAlign, venueAlign, clarity, portraitX, portraitY,
  
    logoX, logoY, logoScale,
    detailsLineHeight, bgScale, headSizeAuto, headManualPx, headMaxPx,
    // details2
    details2, details2Family, details2Color,
    details2X, details2Y, details2Align, details2LineHeight, details2Enabled, details2Size,
    // Headline 2
    head2Enabled, head2, head2X, head2Y, head2SizePx, head2Family, head2Align, head2LineHeight, head2ColWidth, head2Fx, head2Alpha, head2Color,
    // Subtag styles
    subtagBold, subtagItalic, subtagUnderline, subtagSize, subtagAlign, 

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

  const textFormat: "square" | "story" = "square"


  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);
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


 /* >>> HEADLINE SIZE AUTO-FIT (BEGIN) <<< */
// One source of truth for internal auto size
const [headlinePx, setHeadlinePx] = useState<number>(format === 'square' ? 84 : 110);
const session = useFlyerState((s) => s.session);




// The size value we render (auto = computed; manual = user value)
const headDisplayPx = headSizeAuto ? headlinePx : headManualPx;
// ==== FULL-COLUMN HIGHLIGHT FOR HEADLINE (measure height) ====
const [headSelH, setHeadSelH] = React.useState(0);
const [headlineReady, setHeadlineReady] = React.useState(false);
// ⭐ NEW: Track the currently loading font to control flicker
const [currentRenderFont, setCurrentRenderFont] = React.useState<string | null>(null);
// ⭐ NEW: Font flicker control for Details/Venue
const [detailsRenderFont, setDetailsRenderFont] = React.useState<string | null>(null);
const [details2RenderFont, setDetails2RenderFont] = React.useState<string | null>(null);
const [venueRenderFont, setVenueRenderFont] = React.useState<string | null>(null);

// LOAD SELECTED HEADLINE FONT (NEW SYSTEM)
// [REPLACEMENT for Block 2, around line 810]
// LOAD SELECTED HEADLINE FONT (WITH FLICKER CONTROL)
useEffect(() => {
  const fmt = normalizeFormat(format);
  const family = session[fmt]?.headlineFamily;
  if (!family) return;

  const fontUrl = FONT_FILE_MAP[family];
  if (!fontUrl) {
    // If we switch to a known-loaded system font (e.g., Inter, Oswald)
    setCurrentRenderFont(family);
    return;
  }

  // 1. Temporarily show the OLD font or loading state
  // Don't set setHeadlineReady(false) as it messes with the autolayout feature.
  
  // 2. Load the new font
  const fontFace = new FontFace(family, `url("${fontUrl}")`);
  fontFace.load()
    .then(loaded => {
      document.fonts.add(loaded);
      // console.log("✅ Headline font loaded:", family);
      
      // 3. ONLY once loaded, allow the new font to render
      setCurrentRenderFont(family);
      setHeadlineReady(true);
    })
    .catch(err => {
      console.warn("⚠️ Font failed:", family, err);
      // Fallback: use the font immediately if loading fails (browser default)
      setCurrentRenderFont(family);
    });
}, [session, format]);

// LOAD SELECTED HEADLINE 2 FONT
useEffect(() => {
  const fmt = normalizeFormat(format);
  const family = session[fmt]?.head2Family;
  if (!family) return;

  const url = FONT_FILE_MAP[family];
  if (!url) {
    console.warn("❌ HEAD2 FONT NOT IN MAP:", family);
    return;
  }

  console.log("🔵 Loading Headline2 font:", family, "→", url);

  const fontFace = new FontFace(family, `url(${url})`);
  fontFace.load()
    .then((loaded) => {
      document.fonts.add(loaded);
      console.log("✅ Headline2 font loaded:", family);
    })
    .catch((err) => {
      console.warn("⚠️ Headline2 font failed:", family, err);
    });
}, [session, format]);


// LOAD SELECTED DETAILS FONT (WITH FLICKER CONTROL)
useEffect(() => {
  const family = detailsFamily;
  if (!family) return;

  const fontUrl = FONT_FILE_MAP[family];
  if (!fontUrl) {
    setDetailsRenderFont(family);
    return;
  }

  const fontFace = new FontFace(family, `url("${fontUrl}")`);
  fontFace.load()
    .then(loaded => {
      document.fonts.add(loaded);
      setDetailsRenderFont(family); // 💡 Only update render state when loaded
    })
    .catch(err => {
      console.warn("⚠️ Details Font failed:", family, err);
      setDetailsRenderFont(family);
    });
}, [detailsFamily]);


// LOAD SELECTED DETAILS 2 FONT (WITH FLICKER CONTROL)
useEffect(() => {
  const family = details2Family;
  if (!family) return;

  const fontUrl = FONT_FILE_MAP[family];
  if (!fontUrl) {
    setDetails2RenderFont(family);
    return;
  }

  const fontFace = new FontFace(family, `url("${fontUrl}")`);
  fontFace.load()
    .then(loaded => {
      document.fonts.add(loaded);
      setDetails2RenderFont(family); // 💡 Only update render state when loaded
    })
    .catch(err => {
      console.warn("⚠️ Details 2 Font failed:", family, err);
      setDetails2RenderFont(family);
    });
}, [details2Family]);




/* >>> HEADLINE SIZE AUTO-FIT (END) <<< */

// === AUTO LAYOUT GUARD (hoisted; focus-safe) ===
const ranRef = React.useRef<{ [k in Format]?: boolean }>({});

// Reset “ran” when format changes so we do a single stack pass per format
React.useLayoutEffect(() => {
  ranRef.current[format] = false;
}, [format]);

React.useLayoutEffect(() => {
  // ⛔ Don’t auto-adjust positions while the user is moving things
  if (moveMode) return;

  // Only run once per format until something major changes
  if (ranRef.current[format]) return;

  const root = rootRef.current;
  const hEl = canvasRefs.headline;
  const h2El = canvasRefs.headline2;
  const dEl = canvasRefs.details;
  const vEl = canvasRefs.venue;
  const sEl = canvasRefs.subtag;
  const d2El = canvasRefs.details2;

  if (!root || !hEl || !dEl || !vEl) return;

  const R = root.getBoundingClientRect();
  const pctRect = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return {
      x: ((r.left - R.left) / R.width) * 100,
      y: ((r.top  - R.top)  / R.height) * 100,
      w: (r.width  / R.width)  * 100,
      h: (r.height / R.height) * 100,
    };
  };

  type Item = { key: 'H' | 'H2' | 'S' | 'D' | 'D2' | 'V'; y: number; h: number; setY: (ny: number) => void; };


  const items: Item[] = [];
  { const r = pctRect(hEl);  items.push({ key: 'H',  y: r.y, h: r.h, setY: (ny) => p.onHeadMove?.(p.headX, ny) }); }
  if (p.head2Enabled && h2El) { const r = pctRect(h2El); items.push({ key: 'H2', y: r.y, h: r.h, setY: (ny) => p.onHead2Move?.(p.head2X, ny) }); }
  if (subtagEnabled && sEl)   { const r = pctRect(sEl);  items.push({ key: 'S',  y: r.y, h: r.h, setY: (ny) => p.onSubtagMove?.(subtagX, ny) }); }
  if (p.details2Enabled && d2El) {const r = pctRect(d2El); items.push({ key: 'D2', y: r.y, h: r.h, setY: (ny) => p.onDetails2Move?.(details2X, ny) });}

  { const r = pctRect(dEl);   items.push({ key: 'D',  y: r.y, h: r.h, setY: (ny) => p.onDetailsMove?.(detailsX, ny) }); }
  { const r = pctRect(vEl);   items.push({ key: 'V',  y: r.y, h: r.h, setY: (ny) => p.onVenueMove?.(venueX, ny) }); }

  items.sort((a, b) => a.y - b.y);

  const margin = 2; // % gap between stacked blocks
  let bottom = -Infinity;
  let changed = false;

  for (const it of items) {
    const targetTop = Math.max(it.y, isFinite(bottom) ? bottom + margin : it.y);
    const maxTop = Math.max(0, 100 - it.h - margin);
    const clamped = Math.min(targetTop, maxTop);
    if (clamped > it.y + 0.01) {
      it.setY(clamped);
      bottom = clamped + it.h;
      changed = true;
    } else {
      bottom = it.y + it.h;
    }
  }

  ranRef.current[format] = true;
  // (Optional) If you want to allow another pass after we move things once:
  // if (changed) requestAnimationFrame(() => { ranRef.current[format] = false; });
// ⬇️ ONLY run on format/content changes — not on headX/headY/etc.
}, [format, subtagEnabled, subtag, details, venue]);


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

  // ⭐ NEW — required for background drag (fixes snapping)
  startPointerX?: number;
  startPointerY?: number;
} | null>(null);


// Track what's currently being dragged so we can show the box while dragging
const isActive = React.useCallback(
  (t: MoveTarget) => (dragging === t) || (moveMode && moveTarget === t),
  [moveMode, moveTarget, dragging]
);
const posSnap = (v: number) => (snap ? Math.round(v) : v);


// ============================================================
// === rAF DRAG THROTTLE ENGINE ===============================
// ============================================================
let __dragRAF: number | null = null;
let __dragEvt: PointerEvent | null = null;

function scheduleDragFrame(cb: (e: PointerEvent) => void, e: PointerEvent) {
  __dragEvt = e;
  if (__dragRAF !== null) return;

  __dragRAF = requestAnimationFrame(() => {
    cb(__dragEvt!);
    __dragEvt = null;
    __dragRAF = null;
  });
}


function beginDrag(
  
  e: React.PointerEvent,
  target: MoveTarget,
  node?: Element | null,
  shapeId?: string
) {

  // 🔥 DEBUG: BEGIN DRAG FIRED?
  console.log("🔥 beginDrag() FIRED");
  console.log("🔥 target =", target);
  console.log("🔥 node (ref) =", node);
  console.log("🔥 rootRef.current =", rootRef?.current);

  console.log("🔥 BEFORE setMoveTarget:", useFlyerState.getState().moveTarget);
  console.log("🔥 BEFORE setSelectedPanel:", useFlyerState.getState().selectedPanel);

  e.preventDefault();
  e.stopPropagation();


  // 🔹 mark this as the currently selected element (for glow + align)
  setMoveTarget(target);
  setDragging(target);

  const root = rootRef.current;
  if (!root) return;

  // respect locks if you use them for shapes/icons
  if ((target === 'shape' || target === 'icon') && shapeId && p.isLocked?.(target, shapeId)) {
    return;
  }

  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);

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
  let offX = 0;
let offY = 0;
let wPct = 0;
let hPct = 0;

if (target === "background") {
  // 🔥 Background is transform-positioned; boundingRect offsets are invalid
  offX = 0;
  offY = 0;
  wPct = 0;
  hPct = 0;
} else {
  // 🔥 Portraits, icons, shapes, text blocks all use correct layout offsets
  ({ offX, offY, wPct, hPct } = getOff(elForOffset));
}


// =========================================
// 🔥 Determine correct base X/Y per target
// =========================================
const state = useFlyerState.getState();
let baseX = 0;
let baseY = 0;

switch (target) {
  case "headline":
    baseX = state.session[format]?.headX ?? 0;
    baseY = state.session[format]?.headY ?? 0;
    break;

  case "headline2":
    baseX = state.session[format]?.head2X ?? 0;
    baseY = state.session[format]?.head2Y ?? 0;
    break;

  case "details":
    baseX = state.session[format]?.detailsX ?? 0;
    baseY = state.session[format]?.detailsY ?? 0;
    break;

  case "details2":
    baseX = state.session[format]?.details2X ?? 0;
    baseY = state.session[format]?.details2Y ?? 0;
    break;

  case "venue":
    baseX = state.session[format]?.venueX ?? 0;
    baseY = state.session[format]?.venueY ?? 0;
    break;

  case "subtag":
    baseX = state.session[format]?.subtagX ?? 0;
    baseY = state.session[format]?.subtagY ?? 0;
    break;

  case "portrait": {
    const p = state.portraits[format]?.find(p => p.id === shapeId);
    if (p) {
      baseX = p.x;     // correct
      baseY = p.y;     // correct
    }
    break;
  }

  case "icon": {
    const ic = iconsProp?.find(i => i.id === shapeId);
    if (ic) {
      baseX = ic.x ?? 50;
      baseY = ic.y ?? 50;
    }
    break;
  }

  case "background":
    baseX = bgPosX;
    baseY = bgPosY;
    break;
}

drag.current = {
  target,
  shapeId,
  offX,
  offY,
  wPct,
  hPct,
  baseX,
  baseY,
  pointerId: e.pointerId,
  startPointerX: pointerX,
  startPointerY: pointerY,
};



  const move = (ev: PointerEvent) => {
    scheduleDragFrame(onMove, ev);
  };

  const end = () => {
    endDrag();
    setDragging(null); // 🔹 drag finished – glow stays, but drag-state off

    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
  };

  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', end, { passive: true });
  window.addEventListener('pointercancel', end, { passive: true });
}




function beginIconResize(e: React.PointerEvent, ic: Icon) {
  e.preventDefault();
  e.stopPropagation();
  console.log("🔥 ROOT DEBUG — rootRef.current =", rootRef.current);
debugger;   // ← execution pauses here EVERY time
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
  };

  window.addEventListener('pointermove', onMove, { passive: false });
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
  };

  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', endDrag, { passive: true });
  window.addEventListener('pointercancel', endDrag, { passive: true });
}




// ===== PATCH PERF-002: throttle pointermove with rAF =====
let __dragRafId: number | null = null;
let __queuedEvt: PointerEvent | null = null;
function scheduleDrag(cb: (e: PointerEvent)=>void, e: PointerEvent) {
  __queuedEvt = e;
  if (__dragRafId != null) return;
  __dragRafId = requestAnimationFrame(() => {
    const run = __queuedEvt!;
    __queuedEvt = null;
    __dragRafId = null;
    cb(run);
  });
}
// ===== /PERF-002 =====


// ===============================================
// 🔥 HIGH-PERFORMANCE DRAG MOVE HANDLER (PATCH)
// ===============================================
// === HIGH-PERF DRAG MOVE HANDLER (RAF-safe, no layout thrash) ===
const onMove = (() => {
  let lastX = 0;
  let lastY = 0;

  return function onMove(ev: PointerEvent) {
  const d = drag.current;
  if (!d) return;

  const root = rootRef.current;
  if (!root) return;

  const rect = root.getBoundingClientRect();
  const clientX = ev.clientX - rect.left;
  const clientY = ev.clientY - rect.top;

  if (Math.abs(clientX - lastX) < 0.7 && Math.abs(clientY - lastY) < 0.7) return;
  lastX = clientX;
  lastY = clientY;

  switch (d.target) {

    // ==========================================================
    // 🔥 BACKGROUND DRAG — FINAL PATCHED VERSION (CENTERED + CLAMPED)
    // ==========================================================
    case "background": {
      const canvasW = size.w;
      const canvasH = size.h;

      // scaled dimensions
      const imgW = canvasW * bgScale;
      const imgH = canvasH * bgScale;

      // pointer deltas
      const deltaX = clientX - (d.startPointerX ?? 0);
      const deltaY = clientY - (d.startPointerY ?? 0);

      // new proposed center percentages
      let newX = (d.baseX ?? 50) + (deltaX / canvasW) * 100;
      let newY = (d.baseY ?? 50) + (deltaY / canvasH) * 100;


      // convert to pixel offsets relative to center
      const pxX = ((newX - 50) / 100) * canvasW;
      const pxY = ((newY - 50) / 100) * canvasH;

      // clamp bounds so background always covers canvas
      const minX = -(imgW - canvasW) / 2;
      const maxX =  (imgW - canvasW) / 2;
      const minY = -(imgH - canvasH) / 2;
      const maxY =  (imgH - canvasH) / 2;

      const clampedPxX = Math.max(minX, Math.min(maxX, pxX));
      const clampedPxY = Math.max(minY, Math.min(maxY, pxY));

      // convert clamped px back into percentage
      const finalX = (clampedPxX / canvasW) * 100 + 50;
      const finalY = (clampedPxY / canvasH) * 100 + 50;

      d.curX = finalX;
      d.curY = finalY;

      onBgMove?.(finalX, finalY);
      return;
    }

    // ==========================================================
    // 🔥 EVERYTHING ELSE — UNCHANGED
    // ==========================================================
    default: {
      const wPx = ((d.wPct ?? 0) / 100) * rect.width;
      const hPx = ((d.hPct ?? 0) / 100) * rect.height;

      const rawPx = clientX - d.offX;
      const rawPy = clientY - d.offY;

      const padX = Math.max(rect.width * 0.15, wPx);
      const padY = Math.max(rect.height * 0.15, hPx);

      const px = Math.max(-padX, Math.min(rect.width - wPx + padX, rawPx));
      const py = Math.max(-padY, Math.min(rect.height - hPx + padY, rawPy));

      const nx = posSnap((px / rect.width) * 100);
      const ny = posSnap((py / rect.height) * 100);

      if (
        d.target &&
        d.target !== "shape" &&
        d.target !== "icon" &&
        canvasRefs[d.target]
      ) {
        const el = canvasRefs[d.target] as HTMLElement;
        el.style.left = `${nx}%`;
        el.style.top = `${ny}%`;
      }

      d.curX = nx;
      d.curY = ny;
      return;
    }
  }
};

})();

function endDrag() {
  const d = drag.current;
  if (!d) return;

  // ============================================================
// 🔥 PREMIUM DRAG END LOGIC — save final XY into session
// Save final XY ONLY once (performance)
// ============================================================
if (typeof d.curX === "number" && typeof d.curY === "number") {
  const fmt = format; // ← use existing variable from component scope

  switch (d.target) {

    case "headline":
      onHeadMove?.(d.curX, d.curY);
      useFlyerState.getState().setSessionValue(fmt, "headX", d.curX);
      useFlyerState.getState().setSessionValue(fmt, "headY", d.curY);
      break;

    case "headline2":
      onHead2Move?.(d.curX, d.curY);
      useFlyerState.getState().setSessionValue(fmt, "head2X", d.curX);
      useFlyerState.getState().setSessionValue(fmt, "head2Y", d.curY);
      break;

    case "details":
      onDetailsMove?.(d.curX, d.curY);
      useFlyerState.getState().setSessionValue(fmt, "detailsX", d.curX);
      useFlyerState.getState().setSessionValue(fmt, "detailsY", d.curY);
      break;

    case "details2":
      onDetails2Move?.(d.curX, d.curY);
      useFlyerState.getState().setSessionValue(fmt, "details2X", d.curX);
      useFlyerState.getState().setSessionValue(fmt, "details2Y", d.curY);
      break;

    case "venue":
      onVenueMove?.(d.curX, d.curY);
      useFlyerState.getState().setSessionValue(fmt, "venueX", d.curX);
      useFlyerState.getState().setSessionValue(fmt, "venueY", d.curY);
      break;

    case "subtag":
      onSubtagMove?.(d.curX, d.curY);
      useFlyerState.getState().setSessionValue(fmt, "subtagX", d.curX);
      useFlyerState.getState().setSessionValue(fmt, "subtagY", d.curY);
      break;

    case "background":
      const clampedX = Math.max(0, Math.min(100, d.curX));
      const clampedY = Math.max(0, Math.min(100, d.curY));
      onBgMove?.(clampedX, clampedY);

      useFlyerState.getState().setSessionValue(fmt, "bgPosX", clampedX);
      useFlyerState.getState().setSessionValue(fmt, "bgPosY", clampedY);
      break;

    case "logo":
      onLogoMove?.(d.curX, d.curY);
      useFlyerState.getState().setSessionValue(fmt, "logoX", d.curX);
      useFlyerState.getState().setSessionValue(fmt, "logoY", d.curY);
      break;

      case "portrait": {
      if (!d.shapeId) break; // no ID = cannot update

      const st = useFlyerState.getState();
      const list = st.portraits[fmt] || [];

      const idx = list.findIndex(p => p.id === d.shapeId);
      if (idx === -1) break;

      const updated = [...list];
      updated[idx] = {
        ...updated[idx],
        x: d.curX,
        y: d.curY,
      };

      st.setPortraits(fmt, updated);
      onPortraitMove?.(d.curX, d.curY);
      break;
    }

      }
}


  // ⭐⭐⭐ PATCH 4 — CLEAR GLOBAL DRAG FLAG ⭐⭐⭐
  useFlyerState.getState().setIsLiveDragging(false);

  // ============================================================
  // END DRAG — restore shadows/glow after short delay
  // ============================================================
  draggingRef.current = false;

  if (dragReturnTimer.current) {
    clearTimeout(dragReturnTimer.current);
    dragReturnTimer.current = null;
  }

  dragReturnTimer.current = setTimeout(() => {
    setDragEffectsDisabled(false);
    dragReturnTimer.current = null;
  }, 300);

  drag.current = null;

  // ⭐ DO NOT clear moveTarget on drag end — preserve selection
  const last = d.target;
  setTimeout(() => {
    const state = useFlyerState.getState();
    if (state.moveTarget === null) {
      console.log("🔧 Restoring moveTarget after endDrag:", last);
      useFlyerState.getState().setMoveTarget(last);
    }
  }, 0);
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
      // attach on first mount OR when format changes
      if (!last || last !== format) {
        rootRef.current = el;
        setRootRef(el);
        (rootRef as any)._lastFormat = format;
        console.log("🔗 rootRef attached (format):", format);
      }

      // NEW — unified canvas ref
      canvasRefs.root = el;
    }}
    className="relative rounded-2xl overflow-hidden shadow-2xl select-none"
    onWheel={(e) => {
      if (!(moveMode && moveTarget === "background")) return;
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();

      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;

      const zoomFactor = e.deltaY < 0 ? 1.06 : 0.94;
      const newScale = Math.max(1.0, Math.min(3.0, bgScale * zoomFactor));

      const k = (newScale / bgScale) - 1;
      onBgScale?.(newScale);

      const nx = clamp01(bgPosX + (mx - 50) * k);
      const ny = clamp01(bgPosY + (my - 50) * k);
      onBgMove?.(nx * (1 / bgScale), ny * (1 / bgScale));

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
{(bgUploadUrl || bgUrl) && (
  <div className="absolute inset-0 z-0 overflow-hidden">

    {/* ACTUAL TRANSFORM LAYER */}
  <div
 onPointerDown={(e) => {
  e.preventDefault();
  e.stopPropagation();

  beginDrag(e, "background", canvasRefs.background);

  useFlyerState.getState().setMoveTarget("background");

  // highlight the Background panel
  useFlyerState.getState().setSelectedPanel("background");

  // highlight the Background Effects panel
  useFlyerState.getState().setSelectedPanel("backgroundEffects");

  p.onClearIconSelection?.();
}}


  onDoubleClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    onBgMove?.(50, 50);
    onBgScale?.(1.5);

    useFlyerState.getState().setSessionValue(format, "bgPosX", 50);
    useFlyerState.getState().setSessionValue(format, "bgPosY", 50);
    useFlyerState.getState().setSessionValue(format, "bgScale", 1.5);
  }}

  onContextMenu={(e) => {
    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX;
    const y = e.clientY;

    const menu = document.createElement("div");
    menu.style.position = "fixed";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.zIndex = "999999";
    menu.style.background = "#1e293b";
    menu.style.border = "1px solid #334155";
    menu.style.borderRadius = "6px";
    menu.style.padding = "6px 0";
    menu.style.fontSize = "13px";
    menu.style.color = "white";
    menu.style.boxShadow = "0 4px 12px rgba(0,0,0,0.45)";
    menu.style.userSelect = "none";

    const addItem = (label: string, fn: () => void) => {
      const item = document.createElement("div");
      item.textContent = label;
      item.style.padding = "6px 14px";
      item.style.cursor = "pointer";
      item.onmouseenter = () => (item.style.background = "#334155");
      item.onmouseleave = () => (item.style.background = "transparent");
      item.onclick = () => {
        fn();
        document.body.removeChild(menu);
      };
      menu.appendChild(item);
    };

    addItem("Reset (Center + 1.5)", () => {
      onBgMove?.(50, 50);
      onBgScale?.(1.5);
    });

    addItem("Fit Canvas", () => {
      onBgMove?.(50, 50);
      onBgScale?.(1.0);
    });

    addItem("Fill Canvas", () => {
      onBgMove?.(50, 50);
      onBgScale?.(2.2);
    });

    document.body.appendChild(menu);

    const cleanup = () => {
      if (menu && menu.parentNode) document.body.removeChild(menu);
      window.removeEventListener("pointerdown", cleanup);
    };
    window.addEventListener("pointerdown", cleanup);
  }}

  className="absolute inset-0 will-change-transform"
  style={{
    backgroundImage: `url(${bgUploadUrl || bgUrl})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%',
    transform: `translate(${bgPosX - 50}%, ${bgPosY - 50}%) scale(${bgScale})`,
    transformOrigin: "50% 50%",
    userSelect: "none",
    pointerEvents: "auto",
    cursor: moveMode && moveTarget === "background" ? "grab" : "default",
  }}
/>


    {/* BACKGROUND DRAG PLANE (only when background is the active move target) */}
    {moveMode && moveTarget === "background" && (
      <div
        className="absolute inset-0 z-[40] cursor-grab"
        onPointerDown={(e) => {
          p.onClearIconSelection?.();
          beginDrag(e, "background", canvasRefs.background);
        }}
        aria-label="background-drag-plane"
        style={{ pointerEvents: "auto" }}
      />
    )}
    
  </div>
)}



{/* BACKGROUND DRAG PLANE (only when moving background) */}
{moveMode && moveTarget === 'background' && (
  <div
    className="absolute inset-0 z-[40] cursor-grab"
    onPointerDown={(e) => {
      p.onClearIconSelection?.();
      beginDrag(e, 'background', e.currentTarget);
    }}
    aria-label="background-drag-plane"
    style={{ pointerEvents: 'auto' }}   // plane receives events only in this mode
  />
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
{Array.isArray(portraits[format]) && portraits[format].length > 0 && (
  <div
    className="absolute inset-0"
    style={{ zIndex: 20, pointerEvents: "none" }}
  >
    {portraits[format].map((pt) => {
      const locked = !!pt.locked;

      return (
        <div
          key={pt.id}
          ref={(el) => {
            if (el) canvasRefs.portrait = el;
          }}
          style={{
            position: "absolute",
            left: `${pt.x}%`,
            top: `${pt.y}%`,

            // ✅ drag uses scale only, no translate
            transform: `scale(${pt.scale ?? 1})`,
            transformOrigin: "top left",

            // fixed drag box – keeps movement stable
            width: "200px",
            height: "200px",

            zIndex: 200,
            pointerEvents: "auto",
            cursor: locked ? "default" : "grab",

            // ❌ removed pink debug border & background
            // border: "4px solid #FF00FF",
            // background: "rgba(255,0,255,0.3)",
          }}
          onPointerDown={(e) => {
            if (locked) return;

            e.preventDefault();
            e.stopPropagation();

            canvasRefs.portraitImgs = {};
            beginDrag(e, "portrait", e.currentTarget, pt.id);

            useFlyerState.getState().setMoveTarget("portrait");
            useFlyerState.getState().setSelectedPanel("portrait");
            useFlyerState.getState().setSelectedPortraitId?.(pt.id);
          }}
        >
          {/* ⭐ AUTO-SIZE WRAPPER – hugs the image */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              display: "inline-block",
              pointerEvents: "auto",   // 👈 needed so controls can work
              zIndex: 250,
              // ❌ removed yellow debug border
              // border: "3px dashed yellow",
            }}
          >
            {/* === IMAGE (with halo when selected) === */}
            <img
              ref={(el) => {
                if (el) canvasRefs.portraitImgs[pt.id] = el;
              }}
              src={pt.url}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                pointerEvents: "none",

                // ⭐ Halo only when this portrait is selected
                filter:
                  useFlyerState.getState().moveTarget === "portrait" &&
                  useFlyerState.getState().selectedPanel === "portrait" &&
                  useFlyerState.getState().selectedPortraitId === pt.id
                    ? "drop-shadow(0 0 12px rgba(147,197,253,0.95)) drop-shadow(0 0 24px rgba(147,197,253,0.6))"
                    : "none",
              }}
            />

            {/* === CONTROLS (LOCK / DELETE) – anchored to wrapper top-right === */}
            <div
              className="absolute"
              style={{
                top: -10,
                right: -10,
                display: "flex",
                gap: 6,
                pointerEvents: "auto",
                zIndex: 9999,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title={locked ? "Unlock portrait" : "Lock portrait"}
                onClick={() =>
                  updatePortrait(format, pt.id, { locked: !locked })
                }
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: locked ? "#70FFEA" : "#ffffff",
                  cursor: "pointer",
                }}
              >
                {locked ? "🔒" : "🔓"}
              </button>

              <button
                type="button"
                title="Delete portrait"
                onClick={() => removePortrait(format, pt.id)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                🗑️
              </button>
            </div>

            {/* === RESIZE HANDLE – bottom-right of the same wrapper === */}
            {!locked && (
              <div
                data-nonexport="true"
                title="Resize portrait"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startScale = pt.scale ?? 1;

                  const onMove = (mm: PointerEvent) => {
                    const dx = mm.clientX - startX;
                    const dy = mm.clientY - startY;

                    const delta = (dx + dy) / 200;
                    const newScale = Math.max(
                      0.3,
                      Math.min(5, startScale + delta)
                    );

                    updatePortrait(format, pt.id, { scale: newScale });
                  };

                  const onUp = () => {
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };

                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                }}
                className="absolute"
                style={{
                  right: 0,
                  bottom: 0,
                  transform: `scale(${1 / (pt.scale || 1)})`,
                  transformOrigin: "bottom right",
                  width: 20,
                  height: 20,
                  cursor: "nwse-resize",
                  zIndex: 10000,
                  pointerEvents: "auto",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: 4,
                    bottom: 4,
                    width: 0,
                    height: 0,
                    borderStyle: "solid",
                    borderWidth: "0 0 12px 12px",
                    borderColor:
                      "transparent transparent rgba(255,255,255,0.95) transparent",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
)}
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
    style={{ zIndex: 36, pointerEvents: "none" }}
  >
    {iconsProp.map((ic) => (
      <div
        key={ic.id}
        style={{
          position: "absolute",
          left: `${ic.x}%`,
          top: `${ic.y}%`,
          transform: "translate(-50%, -50%)",
          pointerEvents: "auto",
          zIndex:
            isActive("icon") && selIconId === ic.id ? 999 : 36,
        }}
        onPointerDown={(e) => {
          if (p.isLocked?.("icon", ic.id)) return;

          e.preventDefault();
          e.stopPropagation();

          onSelectIcon?.(ic.id);

          beginDrag(
            e as any,
            "icon",
            e.currentTarget as any,
            ic.id
          );
        }}
        onClick={() => onSelectIcon?.(ic.id)}
      >
        {/* INNER TRANSFORM WRAPPER */}
        <div
          style={{
            width: `${ic.size * 5.4}px`,
            height: `${ic.size * 5.4}px`,
            transform: `rotate(${ic.rotation ?? 0}deg)`,
            opacity: ic.opacity ?? 1,
            cursor: "grab",
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
            borderRadius: 8,
            outline:
              isActive("icon") && selIconId === ic.id
                ? "2px dashed #A78BFA"
                : undefined,
            outlineOffset: 4,
          }}
        >
          {/* ICON CONTENT */}
          {ic.svgPath ? (
            <svg width="100%" height="100%" viewBox="0 0 24 24">
              <path
                d={ic.svgPath}
                fill={ic.fill ?? "white"}
                stroke={ic.stroke ?? "none"}
                strokeWidth={ic.strokeWidth ?? 0}
              />
            </svg>
          ) : ic.imgUrl ? (
            <img
              src={ic.imgUrl}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                pointerEvents: "none",
              }}
            />
          ) : (
            <span
              style={{
                fontSize: ic.size * 5.4,
                lineHeight: 1,
                color: ic.fill ?? "white",
                display: "inline-block",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {ic.emoji ?? "⭐️"}
            </span>
          )}
        </div>

        {/* ICON TOOLBAR */}
        {isActive("icon") && selIconId === ic.id && (
          <div
            className="absolute"
            style={{
              top: -6,
              right: -6,
              zIndex: 1100,
              display: "flex",
              gap: 6,
              pointerEvents: "auto",
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => p.onToggleLock?.("icon", ic.id)}
              style={{ width: 22, height: 22 }}
            >
              🔒
            </button>

            <button
              onClick={() => onDeleteIcon?.(ic.id)}
              style={{ width: 22, height: 22 }}
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
)}

{/* ============================= ICONS LAYER (END) ======================= */}


{/* LOGO (draggable + scalable) */}
{logoUrl && (
  <div
    ref={(el) => {
  canvasRefs.logo = el;
}}
    data-active={isActive('logo') ? 'true' : 'false'} 
    className="absolute"
    onPointerDown={(e)=> beginDrag(e, 'logo', canvasRefs.logo)}
   style={{
  left: `${logoX}%`,
  top:  `${logoY}%`,
  width: `${14 * logoScale}%`,
  zIndex: 35,
  filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))',
  transform: `rotate(${logoRotate}deg)`,
  transformOrigin: '50% 50%',
  //boxShadow: (moveMode && moveTarget === 'logo') ? GLOW : undefined,

  ...(moveTarget === 'logo'
  ? { filter: 'drop-shadow(0 0 12px rgba(0,150,255,1))' }
  : {}),

}}

  >
  <img
  src={logoUrl}
  alt="logo"
  className="w-full h-auto object-contain rounded"
/>
{moveTarget === 'logo' && <LockButton t="logo" x={0} y={0} />}

  </div>
)}


{/* HEADLINE (BEGIN) */}
<div
  ref={(el) => {
    canvasRefs.headline = el;
  }}
  data-anim-field
  data-node="headline"
  data-active={isActive("headline") ? "true" : "false"}
  className="absolute"
  onPointerDown={(e) => {
    console.log("🔥 HEADLINE CLICKED");
    beginDrag(e, "headline", canvasRefs.headline);

    console.log("🔥 After beginDrag — moveTarget:", useFlyerState.getState().moveTarget);
    console.log("🔥 selectedPanel:", useFlyerState.getState().selectedPanel);

    useFlyerState.getState().setSelectedPanel("headline");
    useFlyerState.getState().setMoveTarget("headline");
  }}
  style={{
    left: `${headX}%`,
    top: `${headY}%`,
    overflow: 'visible',
    zIndex: isActive("headline") ? 999 : (headBehindPortrait ? 8 : 20),
    cursor: "grab",
    textAlign: headAlign,
    borderRadius: 8,
  }}
>

 {headlineReady && (
  <h1
    className="font-black"
    style={{
      fontFamily: currentRenderFont || session[normalizeFormat(format)]?.headlineFamily,
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
        ? [
            `0 10px ${24 * (headShadowStrength ?? 1)}px rgba(0,0,0,${
              1.2 * (headShadowStrength ?? 1)
            })`,
            `0 0 ${8 * (headShadowStrength ?? 1)}px rgba(255,255,255,${
              0.15 * (textFx.glow ?? 0)
            })`,
            `0 0 ${16 * (headShadowStrength ?? 1)}px rgba(255,255,255,${
              0.12 * (textFx.glow ?? 0)
            })`,
            `0 0 ${32 * (headShadowStrength ?? 1)}px rgba(255,255,255,${
              0.1 * (textFx.glow ?? 0)
            })`,
          ].join(',')
        : 'none',
      transform: `rotate(${headRotate}deg)`,
      transformOrigin: '50% 50%',
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
)}


</div>
{/* HEADLINE (END) */}


{/* HEADLINE 2 (BEGIN) */}
<div
  ref={(el) => {
    canvasRefs.headline2 = el;
  }}
  data-anim-field
  data-node="headline2"
  data-active={moveTarget === "headline2" ? "true" : "false"}
  className="absolute"
  onPointerDown={(e) => {
    const node = canvasRefs.headline2;
    console.log("🔥 HEADLINE2 CLICKED -> node:", node);

    beginDrag(e, "headline2", node);

    useFlyerState.getState().setMoveTarget("headline2");
    useFlyerState.getState().setSelectedPanel("head2");
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
  }}
>
 <div
  className="font-extrabold"
  style={{
    fontFamily: textStyles.headline2[format].family,
    fontSize: textStyles.headline2[format].sizePx,
    letterSpacing: `${head2Fx.tracking}em`,
    textTransform: head2Fx.uppercase ? 'uppercase' : 'none',
    fontWeight: head2Fx.bold ? 900 : 700,
    fontStyle: head2Fx.italic ? 'italic' : 'normal',
    textDecorationLine: head2Fx.underline ? 'underline' : 'none',
    color: textStyles.headline2[format].color,
    lineHeight: textStyles.headline2[format].lineHeight,
    whiteSpace: 'pre-wrap',
    display: 'block',
    minWidth: 'fit-content',
    maxWidth: '100%',

    transform: `rotate(${head2Rotate}deg)`,
    transformOrigin: '50% 50%',

    WebkitTextStrokeWidth: 0,
    WebkitTextStrokeColor: 'rgba(0,0,0,0.9)',

    textShadow: head2Shadow
      ? [
          `0 10px ${20 * (head2ShadowStrength ?? 1)}px rgba(0,0,0,${
            1.2 * (head2ShadowStrength ?? 1)
          })`,
          `0 0 ${10 * (head2ShadowStrength ?? 1)}px rgba(255,255,255,${
            0.15 * (textFx.glow ?? 0)
          })`,
          `0 0 ${20 * (head2ShadowStrength ?? 1)}px rgba(255,255,255,${
            0.12 * (textFx.glow ?? 0)
          })`,
        ].join(',')
      : 'none',

    filter:
      moveTarget === 'headline2'
        ? 'drop-shadow(0 0 8px rgba(147,197,253,0.9))'
        : 'none',
  }}
>
  {(() => {
    console.log("🎯 HEADLINE2 RENDER — fontFamily =", head2Family);
    return renderWithDoubleBreaks(head2Text);
  })()}
</div>

</div>
{/* HEADLINE 2 (END) */}



{/* DETAILS (BEGIN) */}
<div
  ref={(el) => {
    canvasRefs.details = el;
  }}
  data-anim-field
  data-node="details"
  data-active={moveTarget === "details" ? "true" : "false"}
  className="absolute"
  onPointerDown={(e) => {
    beginDrag(e, "details", canvasRefs.details);
    useFlyerState.getState().setMoveTarget("details");
    useFlyerState.getState().setSelectedPanel("details");
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
      transform: `rotate(${detailsRotate}deg)`,
      transformOrigin: '50% 50%',
      WebkitTextStrokeWidth: 0,
      WebkitTextStrokeColor: 'rgba(0,0,0,0.9)',
      textShadow: detailsShadow
        ? [
            `0 5px ${10 * (detailsShadowStrength ?? 1)}px rgba(0,0,0,${
              1.6 * (detailsShadowStrength ?? 1)
            })`,
            `0 0 ${15 * (detailsShadowStrength ?? 1)}px rgba(255,255,255,${
              0.25 * (textFx.glow ?? 0)
            })`,
            `0 0 ${30 * (detailsShadowStrength ?? 1)}px rgba(255,255,255,${
              0.22 * (textFx.glow ?? 0)
            })`,
            `0 0 ${60 * (detailsShadowStrength ?? 1)}px rgba(255,255,255,${
              0.18 * (textFx.glow ?? 0)
            })`,
          ].join(',')
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


{/* DETAILS 2 (BEGIN) */}
{details2Enabled && details2 && (
<div
  ref={(el) => {
    canvasRefs.details2 = el;
  }}
  data-anim-field
  data-node="details2"
  data-active={moveTarget === "details2" ? "true" : "false"}
  className="absolute"
  onPointerDown={(e) => {
    beginDrag(e, "details2", canvasRefs.details2);
    useFlyerState.getState().setMoveTarget("details2");
    useFlyerState.getState().setSelectedPanel("details2");
  }}
    style={{
      position: 'absolute',
      left: `${details2X ?? 0}%`,
      top: `${details2Y ?? 0}%`,
      overflow: 'visible',
      zIndex: moveTarget === 'details2' ? 999 : 30,
      cursor: 'grab',
      textAlign: details2Align ?? 'center',
      borderRadius: 8,
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
        transform: `rotate(${p.details2Rotate ?? 0}deg)`,
        transformOrigin: '50% 50%',

        textShadow: details2Shadow
          ? [
              `0 5px ${10 * (details2ShadowStrength ?? 1)}px rgba(0,0,0,${
                1.6 * (details2ShadowStrength ?? 1)
              })`,
              `0 0 ${15 * (details2ShadowStrength ?? 1)}px rgba(255,255,255,${
                0.25 * (textFx.glow ?? 0)
              })`,
              `0 0 ${30 * (details2ShadowStrength ?? 1)}px rgba(255,255,255,${
                0.22 * (textFx.glow ?? 0)
              })`,
              `0 0 ${60 * (details2ShadowStrength ?? 1)}px rgba(255,255,255,${
                0.18 * (textFx.glow ?? 0)
              })`,
            ].join(',')
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

{/* VENUE (BEGIN) */}
<div
  ref={(el) => {
    canvasRefs.venue = el;
  }}
  data-anim-field
  data-node="venue"
  data-active={moveTarget === "venue" ? "true" : "false"}
  className="absolute"
  onPointerDown={(e) => {
    beginDrag(e, "venue", canvasRefs.venue);
    useFlyerState.getState().setMoveTarget("venue");
    useFlyerState.getState().setSelectedPanel("venue");
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

      transform: `rotate(${venueRotate}deg)`,
      transformOrigin: '50% 50%',

      WebkitTextStrokeWidth: 0,
      WebkitTextStrokeColor: 'rgba(0,0,0,0.9)',

      textShadow: venueShadow
        ? [
            `0 5px ${10 * (venueShadowStrength ?? 1)}px rgba(0,0,0,${
              1.6 * (venueShadowStrength ?? 1)
            })`,
            `0 0 ${15 * (venueShadowStrength ?? 1)}px rgba(255,255,255,${
              0.25 * (textFx.glow ?? 0)
            })`,
            `0 0 ${30 * (venueShadowStrength ?? 1)}px rgba(255,255,255,${
              0.22 * (textFx.glow ?? 0)
            })`,
            `0 0 ${60 * (venueShadowStrength ?? 1)}px rgba(255,255,255,${
              0.18 * (textFx.glow ?? 0)
            })`,
          ].join(',')
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

{/* SUBTAG (BEGIN) */}
{subtagEnabled[format] && (
<div
  ref={(el) => {
    canvasRefs.subtag = el;
  }}
  data-anim-field
  data-node="subtag"
  data-active={moveTarget === "subtag" ? "true" : "false"}
  className="absolute"
  onPointerDown={(e) => {
    beginDrag(e, "subtag", canvasRefs.subtag);
    useFlyerState.getState().setMoveTarget("subtag");
    useFlyerState.getState().setSelectedPanel("subtag");
  }}
    style={{
      left: `${subtagX}%`,
      top: `${subtagY}%`,
      overflow: 'visible',
      zIndex: moveTarget === 'subtag' ? 999 : 30,
      cursor: 'grab',
      textAlign: 'center',
      borderRadius: 8,
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
        transform: `rotate(${subtagRotate ?? 0}deg)`,
        transformOrigin: '50% 50%',
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
            ? [
                `0 20px ${10 * (subtagShadowStrength ?? 1)}px rgba(0,0,0,${
                  1.6 * (subtagShadowStrength ?? 1)
                })`,
                `0 0 ${15 * (subtagShadowStrength ?? 1)}px rgba(255,255,255,${
                  0.25 * (textFx.glow ?? 0)
                })`,
                `0 0 ${30 * (subtagShadowStrength ?? 1)}px rgba(255,255,255,${
                  0.22 * (textFx.glow ?? 0)
                })`,
                `0 0 ${60 * (subtagShadowStrength ?? 1)}px rgba(255,255,255,${
                  0.18 * (textFx.glow ?? 0)
                })`,
              ].join(',')
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


/* ===== BLOCK: PAGE (BEGIN) ===== */
export default function Page() {

  useEffect(() => {
    // 💡 Iterate over FONT_FILE_MAP for correct URLs
    Object.entries(FONT_FILE_MAP).forEach(([family, url]) => {
      // FONT_FILE_MAP provides the path, e.g., "/fonts/African.ttf"
      const font = new FontFace(family, `url("${url}")`);

      font.load()
        .then((loaded) => {
          // console.log("📌 Preloaded font:", family, url);
          document.fonts.add(loaded);
        })
        .catch((err) => {
          console.warn("⚠️ Failed to load font", family, url, err);
        });
    });
  }, []);


  // ===========================================
  // ⭐ EMOJI STATE — MUST BE AT THE TOP ⭐
  // ===========================================
  const [activeTemplate, setActiveTemplate] = useState<TemplateSpec | null>(null);
  const [format, setFormat] = useState<Format>("square");


  // Sync local format with global store
const globalFormat = useFlyerState((s) => s.format);
const setGlobalFormat = useFlyerState((s) => s.setFormat);

// Whenever global store changes → update local format
useEffect(() => {
  if (format !== globalFormat) setFormat(globalFormat);
}, [globalFormat]);

// Whenever local format changes → update store
useEffect(() => {
  if (globalFormat !== format) setGlobalFormat(format);
}, [format]);



  useEffect(() => {
    const unsub = useFlyerState.subscribe((state) => {
      console.log("🟦 GLOBAL STATE CHANGE:", {
        moveTarget: state.moveTarget,
        selectedPanel: state.selectedPanel,
        dragging: state.dragging,
      });
    });
    return () => unsub();
  }, []);





// ==== FADE ENGINE =====================================================
const [fadeKey, setFadeKey] = useState(0);
const [fadeState, setFadeState] = useState<"idle" | "fadingOut" | "fadingIn">("idle");
const [pendingFormat, setPendingFormat] = useState<Format | null>(null);
const [fadeOut, setFadeOut] = useState(false);
const [showStartupTemplates, setShowStartupTemplates] = React.useState(true);

const {
   // ---------------------------------------------------------
  // FONTS SYSTEM
  // ---------------------------------------------------------
  fontOptions,

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


const applyTemplate = React.useCallback(
  (
    tpl: TemplateSpec,
    opts?: {
      targetFormat?: Format;
      initialLoad?: boolean; // FIRST TIME TEMPLATE LOAD
    }
  ) => {
    const fmt: Format = opts?.targetFormat ?? format;

    // 1) FULL TEMPLATE VARIANT
    const variant: Partial<TemplateBase> =
      tpl.formats?.[fmt] ??
      tpl.formats?.square ??
      tpl.base ??
      {};

    // 2) USER SESSION FOR THIS FORMAT
    const existing: Partial<TemplateBase> = session[fmt] ?? {};

    // 3) MERGED OBJECT
  // 3) MERGED OBJECT
    // Prioritize existing state keys over new template keys.
    const baseMerge: Partial<TemplateBase> =
      opts?.initialLoad
        ? { ...variant, ...existing } // Default (template first, session second)
        : { ...variant, ...existing }; // Keep general keys in the template-first order for stability

    // 4) ⭐ PATCH: Re-apply headlineFamily from existing state IF available on switch.
    // This prevents the template from overwriting the user's choice.
    if (existing.headlineFamily && !opts?.initialLoad) {
      baseMerge.headlineFamily = existing.headlineFamily;
    }

    const merged: Partial<TemplateBase> = baseMerge;

    // 4) ⭐ PATCH: Enforce final merged headline font is explicitly pushed to textStyles
    // This solves the rendering issue (flicker/reset) when switching formats/templates.
    const finalHeadlineFamily = merged.headlineFamily;
    if (finalHeadlineFamily && typeof finalHeadlineFamily === 'string') {
      setTextStyle('headline', fmt, { family: finalHeadlineFamily });
    }

    //
    // 🔥🔥 DEBUGGER PATCH — NO LOGIC CHANGES
    //
    console.log("──────────── APPLY TEMPLATE ────────────");
    console.log("📌 FORMAT:", fmt);
    console.log("📌 initialLoad:", opts?.initialLoad);
    console.log("📌 TEMPLATE.headlineFamily (Variant) =", variant.headlineFamily);
    console.log("📌 SESSION.headlineFamily (Existing) =", existing.headlineFamily);
    console.log("📌 MERGED.headlineFamily (Pre-Final) =", merged.headlineFamily);
    console.log("────────────────────────────────────────");
    //
    // END DEBUGGER PATCH
    //

    // 5) WRITE MERGED INTO SESSION
    // Note: No delete merged.headlineFamily needed here anymore due to the merge order swap in step 3.
    setSession((prev) => ({
      ...prev,
      [fmt]: merged,
    }));

    setSessionDirty((prev) => ({
      ...prev,
      [fmt]: true,
    }));

    // Background preview
    if (tpl.preview) {
      setBgUploadUrl(null);
      setBgUrl(tpl.preview);
    }

    // 6) APPLY EACH MERGED FIELD TO EDITOR
    Object.entries(merged).forEach(([key, val]) => {
      if (val === undefined) return;

      switch (key) {
        // General layout
        case "textColWidth": setTextColWidth(val as number); break;
        case "align":
        case "textAlign": setAlign(val as any); break;
        case "bodyColor": setBodyColor(val as string); break;
        case "lineHeight": setLineHeight(val as number); break;
        case "letterSpacing": setBodyTracking(val as number); break;

        // Background
        case "bgPosX": setBgPosX(val as number); break;
        case "bgPosY": setBgPosY(val as number); break;
        case "bgScale": setBgScale(val as number); break;
        case "vignette": setVignette(val as number); break;
        case "backgroundUrl":
          setBgUploadUrl(null);
          setBgUrl(val as string);
          break;

        // HEADLINE
        case "headline": setHeadline(val as string); break;

        case "headlineFamily": {
          console.log("⚠️ APPLY-TEMPLATE KEY HIT: headlineFamily =", val);

          // We rely on the initial merge (step 3) and the direct update (step 4)
          // This block is left to handle initial load, but its logic is now redundant
          // due to the priority logic above. Keeping for safety/debug.
          if (opts?.initialLoad) {
            console.log("🟢 FIRST TEMPLATE LOAD → applying template headline font:", val);
            setTextStyle("headline", fmt, { family: val as string });
            setSessionValue(fmt, "headlineFamily", val);
          } else {
            console.log("⛔ NOT initialLoad → ignoring template headlineFamily in this loop");
          }
          break;
        }

        case "headlineSize": setHeadManualPx(val as number); break;
        case "headColor": setTextStyle("headline", fmt, { color: val as string }); break;
        case "headX": setHeadX(val as number); break;
        case "headY": setHeadY(val as number); break;
        case "headShadow": setHeadShadow(val as boolean); break;
        case "headShadowStrength": setHeadShadowStrength(val as number); break;
        case "headlineLineHeight":
          setTextStyle("headline", fmt, { lineHeight: val as number });
          break;

        case "headItalic": setTextFx(v => ({ ...v, italic: val as boolean })); break;
        case "headBold": setTextFx(v => ({ ...v, bold: val as boolean })); break;
        case "headUnderline": setTextFx(v => ({ ...v, underline: val as boolean })); break;
        case "headTracking": setTextFx(v => ({ ...v, tracking: val as number })); break;
        case "headLeadTrackDelta": setLeadTrackDelta(val as number); break;
        case "headLastTrackDelta": setLastTrackDelta(val as number); break;
        case "headUppercase": setTextFx(v => ({ ...v, uppercase: val as boolean })); break;
        case "headGradient": setTextFx(v => ({ ...v, gradient: val as boolean })); break;
        case "headGlow": setTextFx(v => ({ ...v, glow: val as number })); break;

        case "headStrokeWidth": setTextFx(v => ({ ...v, strokeWidth: val as number })); break;
        case "headStrokeColor": setTextFx(v => ({ ...v, strokeColor: val as string })); break;
        case "headGradFrom": setTextFx(v => ({ ...v, gradFrom: val as string })); break;
        case "headGradTo": setTextFx(v => ({ ...v, gradTo: val as string })); break;

        case "headRotate": setHeadRotate(val as number); break;
        case "headRandomRotate": setHeadlineRotate(val as number); break;

        case "headBehindPortrait": setHeadBehindPortrait(val as boolean); break;
        case "headOpticalMargin": setOpticalMargin(val as boolean); break;
        case "headKerningFix": setKerningFix(val as boolean); break;

        case "headAlpha": setTextFx(v => ({ ...v, alpha: val as number })); break;

        case "headAlign": setHeadAlign(val as any); break;

        // HEADLINE 2
        case "head2Enabled": setHeadline2Enabled(fmt, val as boolean); break;
        case "head2line": setHead2(val as string); break;
        case "head2Family": setHead2Family(val as string); break;
        case "head2Color": setHead2Color(val as string); break;
        case "head2Align": setTextStyle("headline2", fmt, { align: val as any }); break;
        case "head2SizePx": setTextStyle("headline2", fmt, { sizePx: val as number }); break;
        case "head2lineHeight": setTextStyle("headline2", fmt, { lineHeight: val as number }); break;

        case "head2X": setHead2X(val as number); break;
        case "head2Y": setHead2Y(val as number); break;

        case "head2Bold": setHead2Fx(v => ({ ...v, bold: val as boolean })); break;
        case "head2Italic": setHead2Fx(v => ({ ...v, italic: val as boolean })); break;
        case "head2Underline": setHead2Fx(v => ({ ...v, underline: val as boolean })); break;

        case "head2Shadow": setHead2Shadow(val as boolean); break;
        case "head2ShadowStrength": setHead2ShadowStrength(val as number); break;

        case "head2Tracking": setHead2Fx(v => ({ ...v, tracking: val as number })); break;
        case "head2Uppercase": setHead2Fx(v => ({ ...v, uppercase: val as boolean })); break;
        case "head2Gradient": setHead2Fx(v => ({ ...v, gradient: val as boolean })); break;
        case "head2Glow": setHead2Fx(v => ({ ...v, glow: val as number })); break;

        case "head2Rotate": setHead2Rotate(val as number); break;
        case "head2Alpha": setHead2Alpha(val as number); break;

        // DETAILS 1
        case "details": setDetails(val as string); break;
        case "detailsFamily": {
          setDetailsFamily(val as string);
          setSessionValue(fmt, "detailsFamily", val); // 🔥 PATCHED: Correctly save to session
          break;
        }

        case "detailsAlign": setDetailsAlign(val as any); break;

        case "detailsX": setDetailsX(val as number); break;
        case "detailsY": setDetailsY(val as number); break;
        case "detailsSize": setBodySize(val as number); break;
        case "detailslineHeight": setDetailsLineHeight(val as number); break;

        case "detailsColor": setBodyColor(val as string); break;

        case "detailsBold": setBodyBold(val as boolean); break;
        case "detailsItalic": setBodyItalic(val as boolean); break;

        case "detailsShadow": setDetailsShadow(val as boolean); break;
        case "detailsShadowStrength": setDetailsShadowStrength(val as number); break;

        case "detailsTracking": setBodyTracking(val as number); break;
        case "detailsUppercase": setBodyUppercase(val as boolean); break;

        // DETAILS 2
        case "details2Enabled": setDetails2Enabled(fmt, val as boolean); break;
        case "details2": {
          setDetails2(val as string);
          setSessionValue(fmt, "details2", val); // 🔥 PATCHED: Correctly save to session
          break;
        }
        case "details2Family": setDetails2Family(val as string); break;

        case "details2X": setDetails2X(val as number); break;
        case "details2Y": setDetails2Y(val as number); break;

        case "details2Size": setDetails2Size(val as number); break;
        case "details2LineHeight": setDetails2LineHeight(val as number); break;
        case "details2LetterSpacing": setDetails2LetterSpacing(val as number); break;

        case "details2Color": setDetails2Color(val as string); break;

        case "details2Shadow": setDetails2Shadow(val as boolean); break;
        case "details2ShadowStrength": setDetails2ShadowStrength(val as number); break;

        case "details2Align": setDetails2Align(val as any); break;
        case "details2Uppercase": setDetails2Uppercase(val as boolean); break;
        case "details2Bold": setDetails2Bold(val as boolean); break;
        case "details2Italic": setDetails2Italic(val as boolean); break;
        case "details2Underline": setDetails2Underline(val as boolean); break;

        // VENUE
        case "venue": setVenue(val as string); break;
        case "venueFamily": {
          setVenueFamily(val as string);
          setSessionValue(fmt, "venueFamily", val); // 🔥 PATCHED: Correctly save to session
          break;
        }
        case "venueColor": setVenueColor(val as string); break;
        case "venueX": setVenueX(val as number); break;
        case "venueY": setVenueY(val as number); break;
        case "venueSize": setVenueSize(val as number); break;
        case "venueAlign": setVenueAlign(val as any); break;
        case "venueLineHeight": setVenueLineHeight(val as number); break;

        case "venueShadow": setVenueShadow(val as boolean); break;
        case "venueShadowStrength": setVenueShadowStrength(val as number); break;

        case "venueRotate": setVenueRotate(val as number); break;
        case "venueEnabled": setVenueEnabled(fmt, val as boolean); break;

        // SUBTAG
        case "subtagEnabled": setSubtagEnabled(fmt, val as boolean); break;
        case "subtag": setSubtag(val as string); break;
        case "subtagX": setSubtagX(val as number); break;
        case "subtagY": setSubtagY(val as number); break;
        case "subtagSize": setSubtagSize(val as number); break;
        case "subtagTextColor": setSubtagTextColor(val as string); break;
        case "subtagFamily": {
          setSubtagFamily(val as string);
          setSessionValue(fmt, "subtagFamily", val); // 🔥 PATCHED: Correctly save to session
          break;
        }
        case "subtagBgColor": setSubtagBgColor(val as string); break;
        case "subtagShadow": setSubtagShadow(val as boolean); break;
        case "subtagShadowStrength": setSubtagShadowStrength(val as number); break;
        case "subtagAlpha": setSubtagAlpha(val as number); break;

        case "subtagItalic": setSubtagItalic(val as boolean); break;
        case "subtagUppercase": setSubtagUppercase(val as boolean); break;

        case "pillColor": setSubtagBgColor(val as string); break;
        case "pillAlpha": setSubtagAlpha(val as number); break;

        // PORTRAIT
        case "portraitUrl": setPortraitUrl(val as string); break;
        case "portraitX": setPortraitX(val as number); break;
        case "portraitY": setPortraitY(val as number); break;
        case "portraitScale": setPortraitScale(val as number); break;

        // LOGO
        case "logoX": setLogoX(val as number); break;
        case "logoY": setLogoY(val as number); break;
        case "logoScale": setLogoScale(val as number); break;
        case "logoRotate": setLogoRotate(val as number); break;

        // EMOJIS
        case "emojisEnabled": setEmojisEnabled(fmt, val as boolean); break;
      }
    });
  },
  [format, session]
);





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




//
// ⭐ RESTORE ALL LINE HEIGHTS WHEN SWITCHING FORMAT
//
useEffect(() => {
  const s = session[format] ?? {};

  if (s.headlineLineHeight !== undefined)
    setLineHeight(s.headlineLineHeight);

  if (s.head2lineHeight !== undefined)
    setHead2LineHeight(s.head2lineHeight);

  if (s.detailslineHeight !== undefined)
    setDetailsLineHeight(s.detailslineHeight);

  if (s.details2LineHeight !== undefined)
    setDetails2LineHeight(s.details2LineHeight);

  if (s.venueLineHeight !== undefined)
    setVenueLineHeight(s.venueLineHeight);

}, [format, session]);



// Local render list
const emojiList = emojis[format] || [];
const [activeEmojiList, setActiveEmojiList] = React.useState<Emoji[]>(emojiList);

// Refresh local list when format or template changes
React.useEffect(() => {
  setActiveEmojiList(emojis[format] || []);
}, [format, emojis]);




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
 

  // 🔵 AUTO-SELECT UI PANEL WHEN CANVAS ITEM IS CLICKED
useEffect(() => {
  if (!moveTarget) return;

  const map: Record<string, string> = {
    headline: "headline",
    headline2: "head2",
    details: "details",
    details2: "details2",
    venue: "venue",
    subtag: "subtag",
  };

  const next = map[moveTarget];
  if (next) setSelectedPanel(next);
}, [moveTarget, setSelectedPanel]);



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




function persistPortraitSlots(next: string[]) {
  const trimmed = next.slice(0, MAX_PORTRAIT_SLOTS);
  setPortraitSlots(trimmed);
  try { localStorage.setItem('nf:portraitSlots', JSON.stringify(trimmed)); } catch {}
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

// Remove BG for the current portraitUrl
async function onRemovePortraitBg() {
  if (!portraitUrl) return;
  try {
    setRemovingBg(true);
    const cut = await removePortraitBackgroundFromURL(portraitUrl);
    setPortraitUrl(cut);
    setClarity(0.15);
  } catch (e) {
    console.error(e);
    alert('Background removal failed. Try another photo.');
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
  const tpl = TEMPLATE_GALLERY.find(t => t.id === 'edm_tunnel');
  if (tpl) {
    applyTemplate(tpl, { initialLoad: true, targetFormat: format });
    setActiveTemplate(tpl);   // ✅ pass the object, not the string
  }
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

// Apply button handler (called from TemplateGalleryPanel)
const handleApply = React.useCallback((tpl: TemplateSpec) => {
  setActiveTemplate(tpl);
  setFormat('square');
  console.log(`✅ Template loaded: ${tpl.label} (square)`);
}, []);

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

    console.log(`📐 Resized artboard for ${nextFormat}`);
  } catch (err) {
    console.warn("resizeArtboardForFormat failed:", err);
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
const isSwitchingFormatRef = React.useRef(false);
const portraitCacheRef = React.useRef<{
  square: PortraitState | null;
  story: PortraitState | null;
}>({
  square: null,
  story: null,
});



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


// add emoji and attributes
const addEmojiToCanvas = (emoji: string) => {
  const id = "emoji_" + Math.random().toString(36).slice(2, 8);

 setEmojis(format, [
  ...(emojis[format] || []),
  {
    id,
    char: emoji,
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    opacity: 1,
    locked: false
  }
]);

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
    const dataUrl = await fileToDataURL(file);  // reuse your existing fileToDataURL
    persistLogoSlots(logoSlots.map((s, i) => (i === idx ? dataUrl : s)));
  } catch (err: any) {
    alert(`Logo upload failed: ${err?.message || err}`);
  }
}



function triggerPortraitSlotUpload(i: number) {
  pendingPortraitSlot.current = i;
  portraitSlotPickerRef.current?.click();
}

async function onPortraitSlotFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  e.currentTarget.value = '';
  const idx = pendingPortraitSlot.current;
  pendingPortraitSlot.current = null;
  if (!file || idx == null) return;

  setRemovingBg(true);
  try {
    const fd = new FormData();
    fd.append('image', file, file.name); // endpoint expects 'image'

    const res = await fetch('/api/remove-bg', { method: 'POST', body: fd });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || `HTTP ${res.status}`);
    }

    let cutDataUrl: string;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await res.json();
      if (j?.b64) cutDataUrl = `data:image/png;base64,${j.b64}`;
      else if (j?.dataUrl) cutDataUrl = j.dataUrl;
      else throw new Error('Unexpected JSON from /api/remove-bg');
    } else {
      const outBlob = await res.blob();
      cutDataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = reject;
        r.readAsDataURL(outBlob);
      });
    }

    persistPortraitSlots(
      portraitSlots.map((v, i) => (i === idx ? cutDataUrl : v))
    );
  } catch (err: any) {
    alert(`Remove BG failed: ${err?.message || err}`);
  } finally {
    setRemovingBg(false);
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
//const [headlineFamily, setHeadlineFamily] = useState<string>('Aliens Among Us');
const [bodyFamily, setBodyFamily] = useState<string>('Bebas Neue');
const [venueFamily, setVenueFamily] = useState<string>('Bebas Neue');
const [subtagFamily, setSubtagFamily] = useState<string>('Nexa-Heavy');

  const setHeadlineFont = (name: string) => {
 const setHeadlineFont = (name: string) => {
  setTextStyle("headline", format, { family: name });
  setSessionValue(format, "headlineFamily", name);
};

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


  /* headline styles */
  const [align, setAlign] = useState<Align>('left');
  const [headAlign, setHeadAlign] = useState<Align>('center');
  const [lineHeight, setLineHeight] = useState(0.9);

  // 🔥 SYNC LINEHEIGHT PER FORMAT
  useEffect(() => {
  const lh =
    session[format]?.lineHeight ??
    textStyles.headline[format].lineHeight ??
    1;

    setLineHeight(lh);
  }, [format, session]);



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
  // HEADLINE LINE HEIGHT (LOCAL FIX)
 


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
  useEffect(() => {ensureFontLoaded(textStyles.headline[format].family);
                }, [textStyles.headline[format].family, format]);

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
  const [vignette, setVignette] = useState(0.16);
  const [haze, setHaze] = useState(0.5);
  const [grade, setGrade] = useState(0.35);  // overall color grade (0–1)
  const [leak, setLeak]   = useState(0.25);  // light leaks intensity (0–1)
  const [hue, setHue] = useState(0);
  const [bgScale, setBgScale] = useState(1.5);
  const [bgPosX, setBgPosX] = useState(50);
  const [bgPosY, setBgPosY] = useState(50);

  // === SIMPLE BACKGROUND DRAG (local to background only) ===
const bgDragRef = React.useRef<{
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  pointerId: number;
} | null>(null);

const handleBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();

  bgDragRef.current = {
    startX: e.clientX,
    startY: e.clientY,
    baseX: bgPosX,
    baseY: bgPosY,
    pointerId: e.pointerId,
  };

  e.currentTarget.setPointerCapture(e.pointerId);
};

const handleBgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  const d = bgDragRef.current;
  if (!d) return;

  const rect = e.currentTarget.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const dx = e.clientX - d.startX;
  const dy = e.clientY - d.startY;

  // convert movement in px → % of canvas
  const nx = d.baseX + (dx / rect.width) * 100;
  const ny = d.baseY + (dy / rect.height) * 100;

  setBgPosX(nx);
  setBgPosY(ny);
};

const handleBgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
  const d = bgDragRef.current;
  if (!d) return;

  try {
    e.currentTarget.releasePointerCapture(d.pointerId);
  } catch {
    // ignore
  }
  bgDragRef.current = null;
};


  /* master grade (applies to whole poster) */
  const [exp,       setExp]       = useState<number>(1.00); // brightness/exposure (0.7–1.4)
  const [contrast,  setContrast]  = useState<number>(1.08); // 0.7–1.5
  const [saturation,setSaturation]= useState<number>(1.10); // 0.6–1.6
  const [warmth,    setWarmth]    = useState<number>(0.10); // 0..1 => sepia-ish warmth
  const [tint,      setTint]      = useState<number>(0.00); // -1..1 => green↔magenta via hue rotate
  const [gamma,     setGamma]     = useState<number>(1.00); // 0.7–1.5 (implemented with a CSS trick)
  const [grain,     setGrain]     = useState<number>(0.15); // 0..1 film grain overlay

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
      `saturate(${saturation.toFixed(3)})`,
      `sepia(${sep.toFixed(3)})`,
      `hue-rotate(${(hue + hueTint).toFixed(3)}deg)`,
    ].join(' ');
  }, [exp, contrast, saturation, warmth, hue, tint, gamma]);

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
  const [showGuides, setShowGuides] = useState(true);
  const [showFaceGuide, setShowFaceGuide] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [snap, setSnap] = useState(true);

  // === SELECT HELPERS (do not move) ===
  const selectPortrait = () => {
    setMoveMode(true);
    setDragging('portrait');
  };
  const clearSelection = () => {
    setMoveMode(false);
    // If MoveTarget is a union type, cast null safely. Adjust if your type differs.
    setDragging(null as any);
  };
  // === /SELECT HELPERS ===

  // Clear portrait selection on any outside click (works even if other layers stopPropagation)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // left click only
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest('[data-portrait-area="true"]')) return;
      clearSelection();
    };
    document.addEventListener('mousedown', onDown, true); // capture
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
    console.log(`🔁 Switching format to ${next} for template ${tpl.id}`);
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


  /** Save current layout into the active format whenever relevant fields change (debounced by equality check) */
/** Save current layout into the active format whenever relevant fields change (debounced by equality check) */
React.useEffect(() => {
  // HARD GATE: do not compute/commit while the user is actively dragging
  if (isLiveDragging) return;

  // Keep the % fields clamped, but do NOT touch the px-box here
  const pFit = fitPortraitToCanvas(format, portraitX, portraitY, portraitScale);

  const next: Layout = {
  headX, headY, head2X, head2Y,
  detailsX, detailsY, details2X, details2Y,
  venueX, venueY, subtagX, subtagY,

  portraitX: pFit.x,
  portraitY: pFit.y,
  portraitScale: pFit.scale,

  // px portrait box
  portraitXpx,
  portraitYpx,

  // REQUIRED Layout fields
  pBoxWpx: 0,
  pBoxHpx: 0,

  logoX, logoY, logoScale,
  bgPosX, bgPosY,
};


  setLayoutByFormat(prev => {
    const cur = prev[format];
    if (cur && JSON.stringify(cur) === JSON.stringify(next)) return prev;
    return { ...prev, [format]: next };
  });
}, [
  isLiveDragging, // ⬅️ include the guard
  format,
  headX, headY, head2X, head2Y,
  detailsX, detailsY, details2X, details2Y,
  venueX, venueY, subtagX, subtagY,
  portraitX, portraitY, portraitScale,
  portraitXpx, portraitYpx,
  logoX, logoY, logoScale,
  bgPosX, bgPosY
]);


    /** When the format changes, apply the stored layout for that format (with safe portrait clamping) */
   React.useEffect(() => {
  // ❌ Do NOT overwrite template placements
  if (templateId) return;

  const s = layoutByFormat[format];
  if (!s) return;

  // TEXT POSITIONS
  setHeadX(s.headX); setHeadY(s.headY);
  setHead2X(s.head2X); setHead2Y(s.head2Y);
  setDetailsX(s.detailsX); setDetailsY(s.detailsY);
  setDetails2X(s.details2X); setDetails2Y(s.details2Y);
  setVenueX(s.venueX); setVenueY(s.venueY);
  setSubtagX(s.subtagX); setSubtagY(s.subtagY);

  // LOGO + BG
  setLogoX(s.logoX); setLogoY(s.logoY); setLogoScale(s.logoScale);
  setBgPosX(s.bgPosX); setBgPosY(s.bgPosY);

  // PORTRAIT
  const p = fitPortraitToCanvas(format, s.portraitX, s.portraitY, s.portraitScale);
  setPortraitX(p.x); setPortraitY(p.y); setPortraitScale(p.scale);

  setPortraitXpx(s.portraitXpx);
  setPortraitYpx(s.portraitYpx);

}, [format, templateId]);


    // ===== /PERSIST LAYOUT PER FORMAT =====




  /* export */
  const [exportType, setExportType] = useState<'png'|'jpg'>('png');
  const [exportScale, setExportScale] = useState(2); // allow control
  const [designName, setDesignName] = useState('');
  const [hideUiForExport, setHideUiForExport] = useState<boolean>(false);


  
  const saveDebounce = useRef<number | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<string>('');
  const artRef = useRef<HTMLDivElement>(null);
  const artWrapRef = useRef<HTMLDivElement>(null);
  // PORTRAIT: direct-drag ref (for smooth RAF dragging)
  const portraitFrameRef = React.useRef<HTMLDivElement | null>(null);

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
  const [genProvider, setGenProvider] = useState<'auto' | 'nano' | 'openai' | 'mock'>('auto');
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


  // === SUBJECT PRESETS (FOR AI BACKGROUND GENERATOR) ==========================
const SUBJECTS = [
  { key: 'none', label: 'None', prompt: '' },
  {
  key: 'dj',
  label: 'DJ on Turntables',
  demographics: ['neon','tropical','urban'],
  prompt: `
Turntablist DJ mixing on turntables, one hand on mixer, one hand pointing in the air, confident posture,
wearing stylish streetwear with reflective modern shades and headphones, expressive face enjoying the music, with
jubilation, crowd silhouettes dancing under laser lights, neon reflections, strobe haze,
club atmosphere, cinematic lighting, energy and rhythm
`
},
  { key: 'artist', label: 'Artist Singing', prompt: 'charismatic artist with microphone performing for crowd under stage lights' },
  { key: 'dancer', label: 'Dancers', prompt: 'silhouetted dancers in motion, backlit by neon haze' },
  { key: 'crowd', label: 'Crowd', prompt: 'crowd with hands raised, laser beams, confetti, motion blur' },
  { key: 'empty_stage', label: 'Empty Stage', prompt: 'center stage lit by neon beams, empty for typography' },
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
  // simple select:
  setSelIconId(id);

  // OR toggle select (click again to deselect):
  // setSelIconId(prev => (prev === id ? null : id));
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


const generateBackground = async (opts: GenOpts = {}) => {
  // Hard block if no credits and provider is not "mock"
  const willConsume = (genProvider === 'mock') ? false : true;
  if (willConsume && credits <= 0) {
    // show fallback if nothing on canvas
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

    const requestedFormat = opts.formatOverride ?? format;

    // seed logic
    const baseSeed = lockVar ? seed : Math.floor(Math.random() * 1e9);
    if (!lockVar) setSeed(baseSeed);

    const provider = (genProvider === 'auto' ? 'auto' : genProvider);
    const styleForThisRun = opts.style ?? genStyle;
    const allowPeopleForThisRun =
      typeof opts.allowPeopleOverride === 'boolean' ? opts.allowPeopleOverride : allowPeople;
    const exact = opts.prompt?.trim();
    const varietyForThisRun =
      typeof opts.varietyOverride === 'number' ? opts.varietyOverride : variety;

    const makeOne = async (s: number): Promise<string> => {
// Build final generation prompt using preset, subject, and cinematic base

// === GOD-TIER CINEMATIC BASE ==================================================
const GOD_TIER_PHOTO = `
ultra-realistic portrait photography, shot on 85 mm f/1.4 lens,
accurate human skin texture, natural pores, detailed eyes and lashes,
clean facial geometry, realistic cloth folds, true depth of field,
cinematic club lighting with back-rim light and color separation,
film-grade dynamic range, sharp focus on subject, no distortions,
no artifacts, no double limbs, no extra faces, no surreal blending,
RAW photo look, calibrated tone mapping
`;

// === STYLE-BASED MOODS ========================================================
const genreMood = {
  neon: 'electric rave energy, futuristic colors, lasers, smoke, confetti, metallic shine',
  urban: 'gritty street club, moody lighting, graffiti textures, hip-hop confidence',
  tropical: 'warm sunset tones, palm silhouettes, rooftop ambience, summer nightlife',
  vintage: 'film grain disco, retro outfits, nostalgic glam lighting',
}[genStyle] ?? '';

// === DEMOGRAPHIC-BASED SUBJECTS ==============================================
const SUBJECTS = [
  // EDM / Neon
  { key: 'dj', label: 'EDM DJ', demographics: ['neon','tropical'], prompt: 'charismatic DJ performing on massive stage, expressive face, glowing turntables, LED screens, crowd energy' },
  // Hip-Hop / Urban
  { key: 'rapper', label: 'Rapper', demographics: ['urban'], prompt: 'hip-hop artist mid-performance, stylish streetwear, confident expression, gritty lighting, crowd behind' },
  // R&B / Vintage
  { key: 'singer', label: 'R&B Singer', demographics: ['vintage'], prompt: 'vocalist in smooth R&B mood, elegant outfit, microphone in hand, moody lighting and haze' },
  // Afrobeat / Tropical
  { key: 'afro_artist', label: 'Afrobeat Artist', demographics: ['tropical'], prompt: 'Afrobeat artist dancing and performing, vibrant clothing, sunset backlight, joyful crowd' },
  // Latin / Tropical
  { key: 'latin_performer', label: 'Latin Performer', demographics: ['tropical'], prompt: 'Latin singer or dancer performing under warm lights, expressive face, fiesta atmosphere' },
  // K-Pop / Neon
  { key: 'kpop_idol', label: 'K-Pop Idol', demographics: ['neon'], prompt: 'stylish K-Pop idol performing with confidence, pastel lights, LED stage design' },
  // Dancers / Universal
  { key: 'dancers', label: 'Dancers', demographics: ['neon','urban','tropical'], prompt: 'silhouetted club dancers in motion, dynamic posture, stylish outfits, colorful light haze' },
  // Crowd / Universal
  { key: 'crowd', label: 'Crowd Energy', demographics: ['neon','urban','tropical','vintage'], prompt: 'diverse crowd hands up, euphoric energy, confetti and lights, motion blur' },
  // Fashion / Any
  { key: 'fashion', label: 'Fashion Pose', demographics: ['urban','vintage'], prompt: 'model in high-end nightlife fashion, confident pose, rim light on face, cinematic glow' },
  { key: 'none', label: 'No Subject', demographics: ['neon','urban','tropical','vintage'], prompt: '' },
];

// === ENERGY INTENSITY SCALE ===================================================
const energyDescriptors = [
  'chill lounge ambience',
  'moderate club atmosphere',
  'high-energy crowd movement',
  'wild party euphoria',
  'massive festival explosion',
];

// === SUBJECT SELECTION BASED ON STYLE =========================================
const subjectPrompt =
  SUBJECTS.find(
    s => s.key === selectedSubject && s.demographics.includes(genStyle)
  )?.prompt ??
  SUBJECTS.find(s => s.demographics.includes(genStyle))?.prompt ??
  '';

// === FINAL PROMPT BUILDER =====================================================
const finalPrompt = [
  PRESETS.find(p => p.key === presetKey)?.prompt ?? '',
  genreMood,
  subjectPrompt,
  energyDescriptors[energyLevel - 1] ?? 'high-energy nightlife',

  // === Cinematic Lighting Blueprint =========================================
  'three-point lighting setup, key light from stage front, backlight rim from LED panels, warm-cool color contrast, soft fill from bounce, volumetric haze between lights and crowd',

  GOD_TIER_PHOTO,

  requestedFormat === 'story'
    ? 'vertical 9:16 composition, midsection free for typography'
    : 'square 1:1 composition, clean space for text overlay'
].join(', ');


// === BUILD REQUEST BODY =======================================================
const body = {
  prompt: finalPrompt,
  format: requestedFormat,
  provider,
  
  // === GENERATION PARAMETERS (REALISM BOOST) ================================
  sampler: "DPM++ 2M Karras",    // smoother diffusion path, rich detail
  cfgScale: 6.5,                 // prompt adherence vs. creativity balance
  steps: 28,                     // enough iterations for texture refinement
  refiner: true,                 // use SDXL refiner for photoreal finish
  hiresFix: true,                // enables high-resolution upscaling refinement
  denoiseStrength: 0.3,          // preserves face/body structure — no smudge
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

    // single or batch
    const seeds = (genCount === 1)
      ? [baseSeed]
      : Array.from({ length: genCount }, (_, i) => baseSeed + i * 101);

    const results = await Promise.allSettled(seeds.map(makeOne));
    const imgs = results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : [])).filter(Boolean);

    if (imgs.length === 0) {
      // nothing came back — graceful fallback
      if (!(bgUploadUrl || bgUrl)) {
        setBgUploadUrl(FALLBACK_BG); setBgUrl(null);
        setIsPlaceholder(true);
      }
      throw new Error('All generations failed');
    }

    // Present candidates (if batch)
    if (genCount > 1) setGenCandidates(imgs);

    // Apply first result
    const first = imgs[0];
    if (first.startsWith('data:image/')) { setBgUploadUrl(first); setBgUrl(null); }
    else                                 { setBgUrl(first);      setBgUploadUrl(null); }

    setFormat(requestedFormat);
    setBgScale(1.3);
    setBgPosX(50);
    setBgPosY(50);
    setIsPlaceholder(false);

    // remember last successful run for "Regenerate"
    lastGenRef.current = { opts: opts, seed: baseSeed, fmt: requestedFormat };

    // consume a credit only on success (unless mock)
    if (willConsume) setCredits(c => Math.max(0, c - 1));

  } catch (e: any) {
    const msg = String(e?.message || e || 'Generation failed');
    setGenError(msg);

    // Graceful fallback if nothing set
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
      //headlineFamily,
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
      if (typeof s.headlineFamily === "string") {setTextStyle("headline", format, { family: s.headlineFamily });}

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
      if (s.head2Fx && typeof s.head2Fx === 'object') setHead2Fx((prev)=> ({...prev, ...s.head2Fx}));
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
   // Inline save (Option C — replace missing saveDesign)
// Save design snapshot JSON directly into localStorage
try {
  localStorage.setItem('NLF:design:__autosave__', snap);
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
      setTextStyle("headline", format, { family: "Anton" });
      setSessionValue(format, "headlineFamily", "Anton");

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
      setTextStyle("headline", format, { family: "Playfair Display" });
      setSessionValue(format, "headlineFamily", "Playfair Display");

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
      setTextStyle("headline", format, { family: "Bebas Neue" });
      setSessionValue(format, "headlineFamily", "Bebas Neue");

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
  // ❌ DO NOT hardcode Inter
  // Reset to whatever template or session already has
  const fmt = format;
  const fallback = session[fmt]?.headlineFamily || "";

  setTextStyle("headline", fmt, { family: fallback });
  setSessionValue(fmt, "headlineFamily", fallback);

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
  _kind: 'nightlife-brandkit';
  version: 1;
  createdAt: string;

  fonts: {
    headlineFamily: string;
    head2Family: string;
    bodyFamily: string;
    detailsFamily: string;
    details2Family: string;
    venueFamily: string;
    subtagFamily: string;
  };
  colors: {
    headlineFill: string;
    bodyColor: string;
    headlineGradFrom: string;
    headlineGradTo: string;
    detailsColor: string;
    venueColor: string;
    subtagBgColor: string;
    subtagTextColor: string;
  };

  logoDataUrl?: string | null;
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
    _kind: "nightlife-brandkit",
    version: 1,
    createdAt: new Date().toISOString(),

    fonts: {
      headlineFamily: textStyles.headline[normalizeFormat(format)].family,
      head2Family: textStyles.headline2[format].family,

      bodyFamily: textStyles.details[format].family,
      detailsFamily: textStyles.details[format].family,
      details2Family: textStyles.details2[format].family,

      venueFamily: textStyles.venue[format].family,
      subtagFamily: textStyles.subtag[format].family,
    },

    colors: {
      headlineFill: textStyles.headline[normalizeFormat(format)].color,
      bodyColor: textStyles.details[format].color,
      headlineGradFrom: textFx.gradFrom,
      headlineGradTo: textFx.gradTo,
      detailsColor: textStyles.details[format].color,
      venueColor: textStyles.venue[format].color,
      subtagBgColor: subtagBgColor,
      subtagTextColor: subtagTextColor,
    },

    logoDataUrl: logoUrl || null,
  };

  // ✔ Now the object is closed — we can call the function safely
  writeBrandKit(kit);
}


    /** Apply fonts/colors/logo from a saved brand kit */
    function applyBrandKit(kit: BrandKit) {
      if (!kit) return;

  // Fonts
if (kit.fonts?.headlineFamily) {
  setTextStyle("headline", format, { family: kit.fonts.headlineFamily });
  setSessionValue(format, "headlineFamily", kit.fonts.headlineFamily);
}

if (kit.fonts?.bodyFamily)     setBodyFamily(kit.fonts.bodyFamily);
if (kit.fonts?.detailsFamily)  setDetailsFamily(kit.fonts.detailsFamily); // ✅ added
if (kit.fonts?.venueFamily)    setVenueFamily(kit.fonts.venueFamily);
if (kit.fonts?.subtagFamily)   setSubtagFamily(kit.fonts.subtagFamily);
      

      // Colors (headline fill & gradient endpoints)
   if (kit.colors) {
  setTextFx(v => ({
    ...v,
    color: kit.colors.headlineFill ?? v.color,
    gradFrom: kit.colors.headlineGradFrom ?? v.gradFrom,
    gradTo: kit.colors.headlineGradTo ?? v.gradTo,
  }));

  if (kit.colors.bodyColor)       setBodyColor(kit.colors.bodyColor);
  if (kit.colors.venueColor)      setVenueColor(kit.colors.venueColor);
  if (kit.colors.subtagBgColor)   setSubtagBgColor(kit.colors.subtagBgColor);
  if (kit.colors.subtagTextColor) setSubtagTextColor(kit.colors.subtagTextColor);
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
    const useStarterTemplate = async (key: keyof typeof STARTER_TEMPLATES) => {
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
    alert("❌ No active element selected for alignment");
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

  console.log("🧭 Centered:", el.dataset.node || el.tagName);
}

// === /UNIVERSAL ALIGN SELECTED (CENTER) ===




// === onUploadPortraitAndRemoveBg (drop-in once, between addIcon() and the return) ===
const onUploadPortraitAndRemoveBg = async (files: FileList | null) => {
  const file = files?.[0];
  if (!file) return;

  try {
    setRemovingBg(true);

    // Show instant local preview while server processes
    const previewDataUrl = await blobToDataURL(file);
    setPortraitUrl(previewDataUrl);

    const fd = new FormData();
    // Field name MUST be 'image'
    fd.append('image', file, file.name);
    // Optional tuning you already expose:
    fd.append('model', String(rmModel));     // 0=General, 1=Selfie
    fd.append('feather', String(rmFeather)); // pixels

    const res = await fetch('/api/remove-bg', { method: 'POST', body: fd });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || `HTTP ${res.status}`);
    }

    const ct = res.headers.get('content-type') || '';

if (ct.includes('application/json')) {
  const j = await res.json(); // single read
  if (j?.b64) {
    const src = `data:image/png;base64,${j.b64}`;
    addToPortraitLibrary(src);
    setPortraitUrl(src);
  } else if (j?.dataUrl) {
    addToPortraitLibrary(j.dataUrl);
    setPortraitUrl(j.dataUrl);
  } else {
    throw new Error('Unexpected JSON from /api/remove-bg');
  }
} else {
  const outBlob = await res.blob(); // single read
  const src = await blobToDataURL(outBlob);
  addToPortraitLibrary(src);
  setPortraitUrl(src);
}



  } catch (err: any) {
    alert(`Remove BG failed: ${err?.message || err}`);
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



// one-shot guard to detect intentional format toggles
//const isSwitchingFormatRef = React.useRef(false);


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
  const initialScale = 1.6;            // larger default so it reads instantly

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
      headline,
      headlineFamily: textStyles.headline[normalizeFormat(format)].family,
      headlineAlign: textStyles.headline[format].align,
      headlineLineHeight: textStyles.headline[format].lineHeight,

      // LAYOUT
      textColWidth,
      headX,
      headY,
      headRotate,

      // SIZE SYSTEM
      headSizeAuto,
      headManualPx,
      headMaxPx,
      tallHeadline,

      // FX
      textFx,


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
  try {
    if (!art) {
      alert('Artboard not ready');
      return;
    }

    // 1️⃣ Hide all UI / bounding boxes / grids / handles
    (window as any).__HIDE_UI_EXPORT__ = true;  // ✅ global flag
    const prevHide = hideUiForExport;
    setHideUiForExport(true);
    await new Promise(r => setTimeout(r, 150)); // let DOM update

    // 2️⃣ Ensure local fonts load (no wrong font fallback)
    
// ALWAYS SAFE: ensures format is valid for textStyles
const textFormat: "square" | "story" = "square"
  const families = [
  textStyles.headline[normalizeFormat(format)].family,
  textStyles.headline2[textFormat].family,
  textStyles.details[textFormat].family,
  textStyles.details2[textFormat].family,
  textStyles.venue[textFormat].family,
  textStyles.subtag[textFormat].family,
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
} catch {}


    // 🔇 Suppress cross-origin CSS warnings temporarily
    const originalError = console.error;
    console.error = (msg?: any, ...rest: any[]) => {
      if (typeof msg === 'string' && msg.includes('cssRules')) return;
      originalError(msg, ...rest);
    };

    // 3️⃣ Render artboard only, skip UI noise
    const pngData = await htmlToImage.toPng(art, {
      cacheBust: true,
      backgroundColor: '#000',
      style: {},
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
    el.classList?.contains('portrait-bounding') ||   // ✅ NEW
    el.classList?.contains('portrait-outline') ||    // ✅ NEW
    el.classList?.contains('portrait-border') ||     // ✅ NEW
    el.classList?.contains('portrait-slot') ||       // ✅ NEW
    el.classList?.contains('ui-overlay') ||
    el.classList?.contains('overlay-grid') ||        // ✅ NEW
    el.tagName === 'BUTTON' ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA';

  return !skip;
},

    });

    // 4️⃣ Convert to JPG if needed
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

    // 5️⃣ Restore UI after capture
    (window as any).__HIDE_UI_EXPORT__ = false;  // ✅ restore global flag
    setHideUiForExport(prevHide);

    // 6️⃣ Trigger download
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = dataUrl;
    a.download = `nightlife_export_${stamp}.${format}`;
    a.click();
  } catch (err) {
    (window as any).__HIDE_UI_EXPORT__ = false;  // ✅ ensure reset on error
    console.error('Export failed', err);
    setHideUiForExport(false);
    alert('Export failed — check console.');
  }
}

// ===== EXPORT END (used by top-right Export button) =====


// ===== DESIGN STORAGE (END) =====

// ======================= BRAND KIT (FULL BLOCK) =======================
// Types (inline + simple)



// ---- Build snapshot from current UI state ----
function buildBrandKitSnapshot(): BrandKit {
  return {
    _kind: 'nightlife-brandkit',
    version: 1,
    createdAt: new Date().toISOString(),

    fonts: {
      headlineFamily: textStyles.headline[normalizeFormat(format)].family,
      head2Family: textStyles.headline2[format].family,
      detailsFamily: textStyles.details[format].family,
      details2Family: textStyles.details2[format].family,
      bodyFamily: textStyles.details[format].family,
      venueFamily: textStyles.venue[format].family,
      subtagFamily: textStyles.subtag[format].family,
     
    },

    colors: {
      headlineFill: textFx.color,
      headlineGradFrom: textFx.gradFrom,
      headlineGradTo: textFx.gradTo,
      detailsColor: bodyColor,
      venueColor,
      subtagBgColor,
      subtagTextColor,
      bodyColor,
    },

    logoDataUrl:
      typeof logoUrl === "string" && logoUrl.startsWith("data:image/")
        ? logoUrl
        : undefined,
  };
}



// ---- Parse & validate a brand kit file ----
function parseBrandKit(raw: string): BrandKit {
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
  return parsed as BrandKit;
}

// ---- Apply the kit to the current design (sets state) ----
function applyBrandKitFromFile(kit: BrandKit) {
  // Fonts
  if (kit.fonts) {
    const incoming = kit.fonts.headlineFamily;
if (incoming) {
  setTextStyle("headline", format, { family: incoming });
  setSessionValue(format, "headlineFamily", incoming);
}

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


const onBgMoveRaf        = useRafThrottle((x: number, y: number) => { setBgPosX(x); setBgPosY(y); });
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

// === PORTRAIT LAYER (portal into Artboard) ===
const portraitCanvas = React.useMemo(() => {
  const host = portraitHostRef.current || artRef.current; 
  if (!host) return null;

  const list = portraitByFormat[format] || [];

 const tW = 0;
  const tH = 0;

  const MIN_SCALE = 0.25;
  const MAX_SCALE = 5;

  return createPortal(
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
     {/* === PORTRAITS =================================================== */}
{list.map((p) => {
  const isSelected = selectedPortraitId === p.id;

  return (
    <div
      key={p.id}
      className="absolute"
      style={{
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: `calc(${tW}% * ${(p.scale ?? 1)})`,
        height: `calc(${tH}% * ${(p.scale ?? 1)})`,
        pointerEvents: "auto",
      }}
    >
      {p.url && (
        <div
          onMouseDown={(e) => {
            if (!p.locked) setSelectedPortraitId(p.id); // ⭐ SELECT THIS PORTRAIT
            if (p.locked) return;

            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startY = e.clientY;
            const startLeft = p.x;
            const startTop = p.y;

            const parent = e.currentTarget.offsetParent as HTMLElement;
            const pw = parent?.clientWidth || 1;
            const ph = parent?.clientHeight || 1;

            const onMove = (mm: MouseEvent) => {
              const dx = mm.clientX - startX;
              const dy = mm.clientY - startY;
              setPortraitByFormat((prev) => ({
                ...prev,
                [format]: (prev?.[format] || []).map((it) =>
                  it.id === p.id
                    ? {
                        ...it,
                        x: startLeft + (dx / pw) * 100,
                        y: startTop + (dy / ph) * 100,
                      }
                    : it
                ),
              }));
            };

            const onUp = () => {
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };

            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            cursor: p.locked ? "default" : "grab",
            pointerEvents: p.locked ? "none" : "auto",

            /* ⭐ HALO WHEN SELECTED */
            filter: isSelected
              ? "drop-shadow(0 0 14px rgba(80,180,255,1)) drop-shadow(0 0 22px rgba(80,180,255,0.7))"
              : "none",

            transition: "filter 0.18s ease",
          }}
        >
          {/* IMAGE */}
          <img
            src={p.url}
            alt=""
            draggable={false}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: 8,
              pointerEvents: "none",
            }}
          />

          {/* BORDER */}
          <div
            data-nonexport="true"
            style={{
              position: "absolute",
              inset: 0,
              border:
                p.locked ||
                (typeof window !== "undefined" &&
                  (window as any).__HIDE_UI_EXPORT__)
                  ? "none"
                  : "1px dashed rgba(251,191,36,0.95)",
              borderRadius: 8,
              pointerEvents: "none",
            }}
          />

          {/* Lock Button */}
          <button
            data-nonexport="true"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPortraitByFormat((prev) => ({
                ...prev,
                [format]: (prev?.[format] || []).map((it) =>
                  it.id === p.id ? { ...it, locked: !it.locked } : it
                ),
              }));
            }}
            style={{
              position: "absolute",
              left: 6,
              top: 6,
              width: 24,
              height: 24,
              borderRadius: 6,
              border: "1px dashed rgba(251,191,36,0.95)",
              background: "rgba(0,0,0,0.55)",
              color: "#ffffff",
              fontSize: 12,
              cursor: "pointer",
              zIndex: 10000,
              pointerEvents: "auto",
            }}
          >
            {p.locked ? "🔓" : "🔒"}
          </button>

          {/* Delete + Resize only if unlocked */}
          {!p.locked && (
            <>
              {/* Delete */}
              <button
                data-nonexport="true"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPortraitByFormat((prev) => ({
                    ...prev,
                    [format]: (prev?.[format] || []).filter(
                      (it) => it.id !== p.id
                    ),
                  }));
                }}
                style={{
                  position: "absolute",
                  left: 36,
                  top: 6,
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(0,0,0,0.55)",
                  color: "#ffffff",
                  fontSize: 12,
                  cursor: "pointer",
                  zIndex: 10000,
                }}
              >
                ✕
              </button>

              {/* Resize */}
              <div
                data-nonexport="true"
                title="Resize"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startScale = p.scale ?? 1;

                  const onMove = (mm: MouseEvent) => {
                    const dx = mm.clientX - startX;
                    const dy = mm.clientY - startY;
                    const delta = (dx + dy) / 200;

                    let newScale = Math.max(
                      MIN_SCALE,
                      Math.min(MAX_SCALE, startScale + delta)
                    );

                    setPortraitByFormat((prev) => ({
                      ...prev,
                      [format]: (prev?.[format] || []).map((it) =>
                        it.id === p.id ? { ...it, scale: newScale } : it
                      ),
                    }));
                  };

                  const onUp = () => {
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                  };

                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                }}
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: 20,
                  height: 20,
                  cursor: "nwse-resize",
                  zIndex: 10000,
                  pointerEvents: "auto",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: 4,
                    bottom: 4,
                    width: 0,
                    height: 0,
                    borderStyle: "solid",
                    borderWidth: "0 0 12px 12px",
                    borderColor:
                      "transparent transparent rgba(255,255,255,0.95) transparent",
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
})}



{/* === EMOJIS ON CANVAS =================================================== */}
{emojiList.map((em: Emoji) => (
  <div
    key={em.id}
    className="absolute select-none"
    style={{
      left: `${em.x}%`,
      top: `${em.y}%`,
      transform: `scale(${em.scale})`,
      transformOrigin: "top left",
      fontSize: "64px",
      cursor: em.locked ? "default" : "grab",
      zIndex: em.locked ? 15 : 999,
      userSelect: "none",
      pointerEvents: "auto",
    }}
    onMouseDown={
      em.locked
        ? undefined
        : (e) => {
            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startY = e.clientY;
            const startLeft = em.x;
            const startTop = em.y;

            const parent = e.currentTarget.offsetParent as HTMLElement;
            const pw = parent?.clientWidth || 1;
            const ph = parent?.clientHeight || 1;

            const onMove = (mm: MouseEvent) => {
              const dx = mm.clientX - startX;
              const dy = mm.clientY - startY;

              const newX = startLeft + (dx / pw) * 100;
              const newY = startTop + (dy / ph) * 100;

              const updated = emojiList.map((it) =>
                it.id === em.id ? { ...it, x: newX, y: newY } : it
              );

              setEmojis(format, updated);
            };

            const onUp = () => {
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };

            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }
    }
  >
    {/* Emoji visual */}
    <div style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{em.char}</div>

    {/* Controls */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: `scale(${1 / em.scale})`,
        transformOrigin: "top left",
        zIndex: 10000,
      }}
    >
      {/* Lock */}
      <button
        data-nonexport="true"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const updated = emojiList.map((it) =>
            it.id === em.id ? { ...it, locked: !it.locked } : it
          );

          setEmojis(format, updated);
        }}
        style={{
          position: "absolute",
          left: 6,
          top: 6,
          width: 24,
          height: 24,
          borderRadius: 6,
          border: "1px dashed rgba(251,191,36,0.95)",
          background: "rgba(0,0,0,0.55)",
          color: "#ffffff",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {em.locked ? "🔓" : "🔒"}
      </button>

      {/* Delete */}
      {!em.locked && (
        <button
          data-nonexport="true"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const updated = emojiList.filter((it) => it.id !== em.id);
            setEmojis(format, updated);
          }}
          style={{
            position: "absolute",
            left: 36,
            top: 6,
            width: 24,
            height: 24,
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.55)",
            color: "#ffffff",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      )}
    </div>

    {/* Resize handle */}
    {!em.locked && (
      <div
        data-nonexport="true"
        title="Resize"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const startX = e.clientX;
          const startY = e.clientY;
          const startScale = em.scale ?? 1;

          const onMove = (mm: MouseEvent) => {
            const dx = mm.clientX - startX;
            const dy = mm.clientY - startY;

            const delta = (dx + dy) / 200;
            const newScale = Math.max(0.3, Math.min(5, startScale + delta));

            const updated = emojiList.map((it) =>
              it.id === em.id ? { ...it, scale: newScale } : it
            );

            setEmojis(format, updated);
          };

          const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };

          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          transform: `scale(${1 / em.scale})`,
          transformOrigin: "bottom right",
          width: 20,
          height: 20,
          cursor: "nwse-resize",
          zIndex: 10000,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 7,
            bottom: 4,
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "0 0 12px 12px",
            borderColor:
              "transparent transparent rgba(255,255,255,0.95) transparent",
          }}
        />
      </div>
    )}
  </div>
))}


    </div>,
    host
  );
}, [emojis, format]);







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


// === PROJECT PORTABLE SAVE/LOAD (FULL IMPLEMENTATION) ===

// === PROJECT PORTABLE SAVE/LOAD (ENHANCED FULL VERSION) ===

// 🧠 Save current design to a portable JSON file (deep state)
const downloadCurrentDesign = () => {
  try {
    const data = {
      // ---- TEXT / TYPOGRAPHY ----
      headline,
      headlineFamily: textStyles.headline[normalizeFormat(format)].family,
      lineHeight,
      align,
      headRotate,
      headSizeAuto,
      headManualPx,
      headMaxPx,
      leadTrackDelta,
      lastTrackDelta,
      opticalMargin,
      kerningFix,
      headBehindPortrait,
      headX,
      headY,
      detailsX,
      detailsY,
      venueX,
      venueY,
      subtagX,
      subtagY,

      // ---- HEADLINE 2 ----
      head2X,
      head2Y,
      head2Family,


      // ---- FX / STYLE ----
      textFx: {
        ...textFx,
      },

      // ---- COLORS / PALETTE ----
      palette: palette ?? null,
      clarity,
      variety,

      // ---- BACKGROUND ----
      bgUrl,
      bgUploadUrl,
      bgScale,
      bgPosX,
      bgPosY,
      genStyle,
      genPrompt,
      genProvider,
      allowPeople,
      selectedSubject,

      // ---- LAYOUT / DETAILS ----
      details,
      details2,
      details2Family,
      details2Enabled,
      venue,
      venueFamily,
      venueAlign,
      subtag,
      subtagFamily,

      // ---- ICONS / SHAPES ----
      shapes: shapes || [],
      icons: iconList || [],

      // ---- PORTRAIT / LOGO ----
      portraitUrl,
      portraitX,
      portraitY,
      portraitScale,
      logoUrl,
      logoX,
      logoY,
      logoScale,

      // ---- TIMESTAMP / VERSION ----
      version: "v2.0",
      savedAt: new Date().toISOString(),
    };

    // Save as pretty-printed JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flyer-${new Date().toISOString().replace(/[:.]/g, "-")}.flyer.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log("✅ Saved design:", data);
  } catch (err) {
    console.error("Save failed:", err);
    alert("❌ Failed to save design");
  }
};

// 🧩 Load a saved design file (deep restore)
const importDesignJSON = (json: string) => {
  try {
    const data = JSON.parse(json);
    console.log("Loading design JSON:", data);

    // 🔥 Preserve selection before JSON load wipes state
    const prevMove = useFlyerState.getState().moveTarget;
    const prevPanel = useFlyerState.getState().selectedPanel;

    // ---------- APPLY JSON VALUES ----------
    // HEADLINE
    if (data.headline !== undefined) setHeadline(data.headline);

    const fmt = format;
    const sessionFont = useFlyerState.getState().session?.[fmt]?.headlineFamily;

    // 🔥🔥 SIMPLE LOG PATCH — NOTHING ELSE
    console.log("📡 LOG → JSON.headlineFamily =", data.headlineFamily);
    console.log("📡 LOG → SESSION.before =", sessionFont);

    const tpl = TEMPLATE_GALLERY.find((t) => t.id === templateId);
    const tplFont =
      tpl?.formats?.[fmt]?.headlineFamily ??
      tpl?.formats?.square?.headlineFamily ??
      tpl?.base?.headlineFamily;

    console.log("📡 LOG → TEMPLATE.font =", tplFont);
    // 🔥 END LOG PATCH

    // 🚫 If session already has ANY headlineFamily → user picked font → do NOT override
    if (sessionFont) {
      console.log("⛔ FONT OVERRIDE BLOCKED — session already has:", sessionFont);
    }
    else if (data.headlineFamily) {
      console.log("🟢 JSON → Applying headline font:", data.headlineFamily);

      setTextStyle("headline", fmt, { family: data.headlineFamily });

      useFlyerState.getState().setSessionValue(
        fmt,
        "headlineFamily",
        data.headlineFamily
      );
    }
    else {
      // JSON had no font — use template IF and ONLY IF session is empty
      if (tplFont) {
        console.log("📌 Applying template headlineFamily:", tplFont);

        setTextStyle("headline", fmt, { family: tplFont });
        useFlyerState.getState().setSessionValue(fmt, "headlineFamily", tplFont);
      }
    }

    if (data.textFx) setTextFx(data.textFx);
    if (data.headRotate !== undefined) setHeadRotate(data.headRotate);

    if (data.lineHeight) setLineHeight(data.lineHeight);
    if (data.align) setAlign(data.align);
    if (data.leadTrackDelta) setLeadTrackDelta(data.leadTrackDelta);
    if (data.lastTrackDelta) setLastTrackDelta(data.lastTrackDelta);
    if (data.opticalMargin !== undefined) setOpticalMargin(data.opticalMargin);
    if (data.kerningFix !== undefined) setKerningFix(data.kerningFix);
    if (data.headBehindPortrait !== undefined) setHeadBehindPortrait(data.headBehindPortrait);
    if (data.headSizeAuto !== undefined) setHeadSizeAuto(data.headSizeAuto);
    if (data.headManualPx) setHeadManualPx(data.headManualPx);
    if (data.headMaxPx) setHeadMaxPx(data.headMaxPx);
    if (data.palette) setPalette(data.palette);
    if (data.bgUrl) setBgUrl(data.bgUrl);
    if (data.bgUploadUrl) setBgUploadUrl(data.bgUploadUrl);
    if (data.bgScale) setBgScale(data.bgScale);
    if (data.bgPosX) setBgPosX(data.bgPosX);
    if (data.bgPosY) setBgPosY(data.bgPosY);
    if (data.genStyle) setGenStyle(data.genStyle);
    if (data.genPrompt) setGenPrompt(data.genPrompt);
    if (data.genProvider) setGenProvider(data.genProvider);
    if (data.allowPeople !== undefined) setAllowPeople(data.allowPeople);
    if (data.selectedSubject) setSelectedSubject(data.selectedSubject);
    if (data.clarity !== undefined) setClarity(data.clarity);
    if (data.variety !== undefined) setVariety(data.variety);
    if (data.details) setDetails(data.details);
    if (data.details2) setDetails2(data.details2);
    if (data.detailsFamily) setDetailsFamily(data.detailsFamily);
    if (data.details2Enabled !== undefined) setDetails2Enabled(format, data.details2Enabled);
    if (data.venue) setVenue(data.venue);
    if (data.venueFamily) setVenueFamily(data.venueFamily);
    if (data.venueAlign) setVenueAlign(data.venueAlign);
    if (data.subtag) setSubtag(data.subtag);
    if (data.subtagFamily) setSubtagFamily(data.subtagFamily);
    if (data.shapes) setShapes(data.shapes);
    if (data.icons) setIconList(data.icons);
    if (data.portraitUrl) setPortraitUrl(data.portraitUrl);
    if (data.portraitX) setPortraitX(data.portraitX);
    if (data.portraitY) setPortraitY(data.portraitY);
    if (data.portraitScale) setPortraitScale(data.portraitScale);
    if (data.logoUrl) setLogoUrl(data.logoUrl);
    if (data.logoX) setLogoX(data.logoX);
    if (data.logoY) setLogoY(data.logoY);
    if (data.logoScale) setLogoScale(data.logoScale);
    if (data.headX !== undefined) setHeadX(data.headX);
    if (data.headY !== undefined) setHeadY(data.headY);
    if (data.head2X !== undefined) setHead2X(data.head2X);
    if (data.head2Y !== undefined) setHead2Y(data.head2Y);
    if (data.head2Family) setHead2Family(data.head2Family);
    if (data.detailsX !== undefined) setDetailsX(data.detailsX);
    if (data.detailsY !== undefined) setDetailsY(data.detailsY);
    if (data.venueX !== undefined) setVenueX(data.venueX);
    if (data.venueY !== undefined) setVenueY(data.venueY);
    if (data.subtagX !== undefined) setSubtagX(data.subtagX);
    if (data.subtagY !== undefined) setSubtagY(data.subtagY);

    // 🔥 RESTORE SELECTION AFTER JSON LOAD
    if (prevMove) useFlyerState.getState().setMoveTarget(prevMove);
    if (prevPanel) useFlyerState.getState().setSelectedPanel(prevPanel);

    alert("✅ Design loaded successfully!");
  } catch (err) {
    console.error("Import failed:", err);
    alert("❌ Invalid or corrupted design file");
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
    console.error("Clear storage failed:", err);
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
//
/* ============================================================
   APPLY TEMPLATE — FORMAT-SAFE, SESSION-SAFE
   ============================================================ */

/* ============================================================================
   APPLY TEMPLATE — FULL DROP-IN VERSION
   Loads template, applies variant, preserves edits,
   and writes merged result to session AFTER fade-in.
   ============================================================================
*/



/* ============================================================
   STARTUP TEMPLATE MAP + HANDLER
   ============================================================ */

const STARTUP_TEMPLATE_MAP: Record<string, TemplateSpec> = {
  club: TEMPLATE_GALLERY[0],
  tropical: TEMPLATE_GALLERY[1],
  luxury: TEMPLATE_GALLERY[2],
  urban: TEMPLATE_GALLERY[3],
  loaded: TEMPLATE_GALLERY[4] ?? TEMPLATE_GALLERY[0], // fallback
};

const handleStartupSelect = (key: string) => {
  const tpl = STARTUP_TEMPLATE_MAP[key];

  if (!tpl) {
    console.warn("Template for key not found:", key);
    return;
  }

  applyTemplate(tpl, { targetFormat: "square" });

  setShowStartupTemplates(false);
};





// === STARTUP SCREEN (CHOOSE A VIBE) ===
const [showStartup, setShowStartup] = React.useState(true);
const [loadingStartup, setLoadingStartup] = React.useState(false);


// keep this new state near the other useStates at the top of your component
const [templateBase, setTemplateBase] = React.useState<any>(null);

const handleTemplateSelect = React.useCallback(
  (key: string) => {
    setLoadingStartup(true);

    try {
      // ✅ Map each vibe to a real template index
      const vibeToTemplateIndex: Record<string, number> = {
        club: 0,      // EDM Neon
        tropical: 1,  // Beach Paradise
        luxury: 2,    // Gold Luxe
        urban: 3,     // Street Style
      };

      const idx = vibeToTemplateIndex[key] ?? 0;
      const tpl = TEMPLATE_GALLERY[idx];
      if (!tpl) throw new Error("Template not found for vibe: " + key);

      console.log(`🎨 Applying ${tpl.label || tpl.id} from Startup`);

      // 🧠 Save a snapshot of the base template (for optional reset)
      setTemplateBase(JSON.parse(JSON.stringify(tpl)));

      // 🪄 Apply template once on selection
      setTemplateId(tpl.id);
      applyTemplate(tpl, { targetFormat: format });
    } catch (err) {
      console.error("Template load error:", err);
      alert("Could not load template.");
    }

    // ✅ Close startup modal once template applied
    setTimeout(() => {
      setLoadingStartup(false);
      setShowStartup(false);
    }, 1200);
  },
  [format]
);

// === /STARTUP SCREEN ===


/* ===== AUTOSAVE: SMART SAVE/LOAD (BEGIN) ===== */
const [hasSavedDesign, setHasSavedDesign] = React.useState(false);

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
    console.warn("Autosave failed:", err);
  }
}, [format, headline, details, venue, subtag]);
/* ===== AUTOSAVE: SMART SAVE/LOAD (END) ===== */




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
          <StartupTemplates onSelect={handleTemplateSelect} importDesignJSON={importDesignJSON} />

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


    <main className="min-h-screen bg-neutral-950 text-white">

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
        <div className="mx-auto max-w-7xl px-4 h-14 grid grid-cols-[clamp(260px,22vw,360px)_minmax(560px,1fr)_clamp(260px,22vw,360px)] gap-4 items-center">
          {/* LEFT: Brand */}
             <div className="flex items-center gap-3">
              <svg width="28" height="28" viewBox="0 0 64 64" className="rounded-[10px] shadow-[0_8px_28px_rgba(0,0,0,.45)]">
                <defs>
                  <linearGradient id="lg" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0" stopColor="#6366F1"/><stop offset="1" stopColor="#EC4899"/>
                  </linearGradient>
                  <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#22D3EE"/><stop offset="1" stopColor="#A78BFA"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="64" height="64" rx="14" fill="url(#lg)"/>
                <path d="M16 40 L28 20 L36 32 L48 20" fill="none" stroke="url(#lg2)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-sm opacity-90">Nightlife Flyers — Studio</div>

              {/* ALWAYS-SHOW PRICING LINK */}
              <Link
                href="/pricing"  // ← change to "/pricing-plans" if your route is app/pricing-plans/page.tsx
                className="ml-2 text-[12px] px-2 py-[2px] rounded-md border border-white/20 bg-white/10 hover:bg-white/20
                           text-[#78E3FF] drop-shadow-[0_0_10px_rgba(120,227,255,0.95)]"
                aria-label="View Pricing"
              >
                Pricing
              </Link>
            </div>

  

          {/* CENTER: ONLY Format (Square / Story) */}
         {/* === FORMAT TOGGLE (loads current template variant) === */}
<div className="justify-self-center">
  <div className="inline-flex items-center gap-3 text-[12px]">
    <span className="opacity-80">Format</span>

    {/* Square button */}
 {/* === FORMAT TOGGLE === */}
{/* === Format Toggle Chips === */}
<Chip
  small
  active={format === "square"}
  disabled={!(bgUploadUrl || bgUrl)}
  onClick={() => {
    if (format === "square") return;      // already square
    setPendingFormat("square");           // queue the switch
    setFadeOut(true);                     // start fade-out
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
    setPendingFormat("story");
    setFadeOut(true);   // 🔥 start fade-out
  }}
>
  Story
</Chip>



  </div>
</div>

     {/* RIGHT: Export (aligned to right panel column) */}
        <div className="flex items-center gap-4 justify-self-stretch w-full pr-1">
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
         <div className="ml-auto">
          <Chip
            small
            onClick={() => exportArtboardClean(artRef.current!, exportType as 'png' | 'jpg')}
          >
            <span className="whitespace-nowrap">download {exportType}</span>
          </Chip>
        </div>

       
          {/* Credits badge — keep inside the same column */}
          {hydrated && (
          <div className="ml-2 shrink-0 text-[11px] px-2 py-[6px] rounded-full border border-neutral-700 bg-neutral-900/70">
            Credits: <b>{credits}</b>
          </div>
          )}
        </div>

        </div>
</header>
{/* ===== UI: PAGE HEADER (END) ===== */}

{/* --- ONBOARDING STRIP (only after hydration, only first open) --- */}
{hydrated && showOnboard && (
          <div
            className="sticky top-14 z-[49] text-white"
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
"mx-auto max-w-7xl grid grid-cols-[clamp(260px,22vw,360px)_minmax(560px,1fr)_clamp(260px,22vw,360px)] gap-4 px-4 py-6",
showOnboard ? "mt-2" : ""
 )}
style={{ minHeight: 'calc(100vh - 96px)' }}
>

{/* ---------- Left Panel ---------- */}
 <aside
className="sticky self-start max-h-[calc(100vh-120px)] overflow-y-auto space-y-3 pr-1"
style={{ top: STICKY_TOP }}
>


{/* UI: GETTING STARTED (BEGIN) */}
<Collapsible
            title="Getting started"
            storageKey="p:start"
            defaultOpen={true}
            titleClassName="text-[#78E3FF] drop-shadow-[0_0_10px_rgba(120,227,255,0.95)]"
            right={
              <Chip small onClick={() => { 
                try { localStorage.setItem('nf:onboarded:v1','1'); } catch {}
                setShowOnboard(false);
              }}>
                Dismiss
              </Chip>
            }
          >
           {/* === GETTING STARTED — REPLACEMENT CONTENT === */}
            <div className="space-y-3 text-[13px] text-neutral-100">

              {/* 5-fast-steps (each line fits in one glance) */}
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <b>Pick a background</b> — Right panel → <b>AI Background ▸ Generate</b> 
                  <span className="opacity-70"> (or</span> <b>Background Image ▸ Upload</b><span className="opacity-70">)</span>.
                </li>
                <li>
                  <b>Headline</b> — Type your big title. Size = <b>Auto</b> by default; drag it on the canvas.
                </li>
                <li>
                  <b>Details</b> — Add time, price, extras. Keep it 3 lines max.
                </li>
                <li>
                  <b>Venue</b> — Set the name/location. Use the color dot in header to match the bg.
                </li>
                <li>
                  <b>Export</b> — Top-right bar → <b>PNG/JPG</b>, pick <b>2×</b> or <b>4×</b>, click <b>download</b>.
                </li>
              </ol>

              {/* Quick actions row (one-tap) */}
              <div className="grid grid-cols-2 gap-2">
                <Chip small onClick={quickGenerate} title="Generate a background now">
                  🎨 AI background
                </Chip>

                <Chip small onClick={triggerUpload} title="Upload your own photo">
                  ⬆️ Upload background
                </Chip>

                <Chip
                  small
                  onClick={() => {
                    // same demo you already use
                    setHeadline('FRIDAY NIGHT');
                    setDetails('Doors 9PM\n21+ | Dress code enforced\nTABLES • BOTTLE SERVICE');
                    setVenue('ORBIT CLUB — DOWNTOWN');
                    setSubtagEnabled(format, true);
                    setSubtag('special guest');
                    setBodyColor('#E5E7EB');
                    setVenueColor('#FFFFFF');
                    setTextFx(v=>({...v, gradient:false, color:'#FFFFFF', strokeWidth:0 }));
                  }}
                  title="Fill sample text"
                >
                  ✍️ Fill demo text
                </Chip>

                <Chip small onClick={()=>switchFormat('square')} title="Work in square first">
                  ⬛ Use Square
                </Chip>
              </div>

              {/* One-line pro tips (fast to scan) */}
              <div className="grid gap-1 text-[12px] text-neutral-400">
                <div>• <b>Move</b> toggle → pick target (Headline / Details / Venue / Portrait / Background).</div>
                <div>• Hold <b>Shift</b> to nudge faster. Turn <b>Snap</b> on for clean alignment.</div>
                <div>• <b>Background Effects</b>: use <b>Grade 0.25–0.45</b> + <b>Vignette ~0.55</b> for a cinematic finish.</div>
                <div>• <b>Portrait</b>: “Remove Background” panel → <b>Upload & Remove BG</b>. Lock it when placed.</div>
              </div>

              {/* Optional: tiny helper buttons */}
             {/* Optional: tiny helper buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Chip small onClick={()=>{
                    try { localStorage.setItem('nf:onboarded:v1','1'); } catch {}
                    setShowOnboard(false);
                  }}>
                    Dismiss
                  </Chip>
                </div>

            </div>
</Collapsible>
{/* UI: GETTING STARTED (END) */}

{/* UI: STARTER TEMPLATES (BEGIN) */}
<TemplateGalleryPanel
  items={TEMPLATE_GALLERY}
  format={format}
  onApply={(t) => {
    setTemplateId(t.id);
    applyTemplate(t, { targetFormat: format });
  }}
/>
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
    console.log("=== ALIGN LEFT DEBUG ===");
    console.log("moveTarget:", s.moveTarget);
    console.log("selectedPanel:", s.selectedPanel);
    console.log("dragging:", s.dragging);

    console.log("rootRef:", canvasRefs.root);
    console.log("headlineRef:", canvasRefs.headline);
    console.log("headline2Ref:", canvasRefs.headline2);
    console.log("detailsRef:", canvasRefs.details);
    console.log("details2Ref:", canvasRefs.details2);
    console.log("venueRef:", canvasRefs.venue);
    console.log("subtagRef:", canvasRefs.subtag);

    // Resolve active element
    const active = s.moveTarget ?? s.selectedPanel ?? null;
    console.log("Resolved active:", active);

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
      const root = canvasRefs.root ?? getRootRef();
      if (!root) return null;

      const el = root.querySelector('[data-active="true"]') as HTMLElement | null;
      if (!el) return <span>No object selected</span>;

      const node = el.getAttribute("data-node") || "";
      let x = 0, y = 0;

      switch (node) {
        case "headline":  x = headX;  y = headY;  break;
        case "headline2": x = head2X; y = head2Y; break;
        case "details":   x = detailsX ?? 0; y = detailsY ?? 0; break;
        case "details2":   x = details2X ?? 0; y = details2Y ?? 0; break;
        case "venue":     x = venueX ?? 0;   y = venueY ?? 0;   break;
        case "subtag":    x = subtagX ?? 0;  y = subtagY ?? 0;  break;
        default:
          return <span>⚠️ Unknown node</span>;
      }

      if (node === "details2") console.log("📍Readout uses details2Y:", y);

      return (
        <span>
           <div key={node}>
      <strong>{node}</strong> → X: {x.toFixed(1)}% &nbsp; | &nbsp; Y: {y.toFixed(1)}%
    </div>

        </span>
      );
    })()}
  </div>

</div>

{/* === /PATCH === */}

{/* UI: HEADLINE (BEGIN)*/}
<div
  className={
    selectedPanel === "headline"
      ? "relative rounded-xl border border-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)] transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Headline"
    storageKey="p:headline"
    defaultOpen={selectedPanel === "headline"}
    titleClassName={
      selectedPanel === "headline"
        ? "text-blue-400"
        : ""
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">
  <span>Align</span>

  <Chip
    small
    active={textStyles.headline[normalizeFormat(format)].align === "left"}
    onClick={() =>
      setTextStyle("headline", normalizeFormat(format), { align: "left" })
    }
  >
    L
  </Chip>

  <Chip
    small
    active={textStyles.headline[normalizeFormat(format)].align === "center"}
    onClick={() =>
      setTextStyle("headline", normalizeFormat(format), { align: "center" })
    }
  >
    C
  </Chip>

  <Chip
    small
    active={textStyles.headline[normalizeFormat(format)].align === "right"}
    onClick={() =>
      setTextStyle("headline", normalizeFormat(format), { align: "right" })
    }
  >
    R
  </Chip>
</div>

    }
  >

    {/* ⭐ Inner neon panel only when active */}
    <div
      className={
        selectedPanel === "headline"
          ? "p-2 rounded-md ring-2 ring-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)]"
          : "p-0"
      }
    >

    {/* HEADLINE TEXT (with session storage) */}
      <textarea
        value={headline}
          onChange={(e) => {
          const v = e.target.value;
          setHeadline(v);
          setSessionValue(format, "headline", v);
        }}
        rows={3}
        className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
      />

      {/* SIZE MODE TOGGLE */}
      <div className="flex items-center gap-2 mt-2 text-[11px]">
        <span>Size</span>
        <Chip
          small
          active={headSizeAuto}
          onClick={() => setHeadSizeAuto((v) => !v)}
          title="Toggle Auto/Manual"
        >
          {headSizeAuto ? "Auto" : "Manual"}
        </Chip>
      </div>

      {/* GRID UI */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        <Stepper
          label="Line Height"
          value={lineHeight}
            setValue={(v) => {
              setLineHeight(v);
              setTextStyle("headline", format, { lineHeight: v });
              setSessionValue(format, "headlineLineHeight", v);
            }}
          min={0.4}
          max={2.0}
          step={0.02}
          digits={2}
        />
        <Stepper
          label="Col Width %"
          value={textColWidth}
          setValue={setTextColWidth}
          min={30}
          max={80}
          step={1}
        />

        <Stepper
          label="Track (em)"
          value={textFx.tracking}
          setValue={(n) =>
            setTextFx((v) => ({ ...v, tracking: n }))
          }
          min={0}
          max={0.15}
          step={0.01}
          digits={2}
        />

        <Stepper
          label="Lead Track Δ (em)"
          value={leadTrackDelta}
          setValue={setLeadTrackDelta}
          min={-0.08}
          max={0.08}
          step={0.005}
          digits={3}
        />

        {headSizeAuto ? (
          <Stepper
            label="Max Size px"
            value={headMaxPx}
            setValue={setHeadMaxPx}
            min={36}
            max={220}
            step={2}
          />
        ) : (
    <Stepper
      label="Head Size px"
      value={headManualPx}
        setValue={(v) => {
          setHeadManualPx(v);                  // ← YOU MUST drive this
          setTextStyle("headline", format, { sizePx: v });
          setSessionValue(format, "headlineSize", v);
        }}
      min={36}
      max={220}
      step={2}
    />

        )}

        <Stepper
          label="Last Track Δ (em)"
          value={lastTrackDelta}
          setValue={setLastTrackDelta}
          min={-0.08}
          max={0.08}
          step={0.005}
          digits={3}
        />
      </div>

      {/* FONT FAMILY */}
<select
  value={session[normalizeFormat(format)]?.headlineFamily}
  onChange={(e) => {
    const family = e.target.value;
    const fmt = normalizeFormat(format);

    // 1. Update the Rendering Source of Truth (Zustand textStyles)
    setTextStyle("headline", fmt, { family });

    // 2. Update the Persistence Source of Truth (Zustand session)
    setSessionValue(fmt, "headlineFamily", family);

    // Optional: Clear flicker state if you added it, otherwise this line is safe
    // setCurrentRenderFont(family); 
  }}
  className="mt-1 w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
>
  {fontOptions.headline.map((f) => (
    <option key={f} value={f} style={{ fontFamily: f }}>
      {f}
    </option>
  ))}
</select>



      {/* EFFECTS */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Chip small active={textFx.gradient}  onClick={() => setTextFx(v=>({...v,gradient:!v.gradient}))}>Gradient</Chip>
        <Chip small active={textFx.uppercase} onClick={() => setTextFx(v=>({...v,uppercase:!v.uppercase}))}>Upper</Chip>
        <Chip small active={textFx.bold}      onClick={() => setTextFx(v=>({...v,bold:!v.bold}))}>Bold</Chip>
        <Chip small active={textFx.italic}    onClick={() => setTextFx(v=>({...v,italic:!v.italic}))}>Italic</Chip>
        <Chip small active={textFx.underline} onClick={() => setTextFx(v=>({...v,underline:!v.underline}))}>Underline</Chip>
        <Chip small active={headShadow}       onClick={() => setHeadShadow(!headShadow)}>Shadow</Chip>
        <Chip small active={opticalMargin}    onClick={() => setOpticalMargin(v=>!v)}>Optical Margin</Chip>
        <Chip small active={kerningFix}       onClick={() => setKerningFix(v=>!v)}>Kerning Fix</Chip>
        <Chip small active={headBehindPortrait} onClick={() => setHeadBehindPortrait(v=>!v)}>Behind Portrait</Chip>
        <Chip onClick={applyHeadlineDefault} small>Reset Text Preset</Chip>
      </div>

      {/* EFFECT VALUES */}
      <div className="flex items-end mt-2 flex-wrap w-full">
        <div className="mt-2 grid grid-cols-3 gap-3">
          <Stepper label="Rotation (°)" value={headRotate} setValue={setHeadRotate} min={-360} max={360} step={0.5} />
          <Stepper label="Random Rotate" value={headlineRotate} setValue={setHeadlineRotate} min={-90} max={90} step={1} />
        </div>

        <div className="mt-2 grid grid-cols-3 gap-3">
          <Stepper label="Stroke px" value={textFx.strokeWidth} setValue={n=>setTextFx(v=>({...v,strokeWidth:n}))} min={0} max={6} step={1} />
          <Stepper label="Shadow" value={headShadowStrength} setValue={setHeadShadowStrength} min={0} max={3} step={0.1} />
          <Stepper label="Glow" value={textFx.glow} setValue={n=>setTextFx(v=>({...v,glow:n}))} min={0} max={1} step={0.05} digits={2} />
        </div>

        <div className="mt-2 grid grid-cols-4 gap-3 text-[11px]">
          <span className="opacity-80">Stroke</span>
          <ColorDot title="Stroke color" value={textFx.strokeColor} onChange={c=>setTextFx(v=>({...v,strokeColor:c}))} />

          <span className="opacity-80">Fill</span>
          <ColorDot title="Headline fill color" value={textStyles.headline[normalizeFormat(format)].color} onChange={c=>setTextStyle("headline",format,{color:c})} />

          <span className="opacity-80">From</span>
          <ColorDot title="Gradient from" value={textFx.gradFrom} onChange={c=>setTextFx(v=>({...v,gradFrom:c}))} />

          <span className="opacity-80">To</span>
          <ColorDot title="Gradient to" value={textFx.gradTo} onChange={c=>setTextFx(v=>({...v,gradTo:c}))} />
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
      ? "relative rounded-xl border border-fuchsia-400 shadow-[0_0_18px_4px_rgba(255,0,220,0.55)] transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Sub Headline"
    storageKey="p:head2"
    defaultOpen={selectedPanel === "head2"}
    titleClassName={
      selectedPanel === "head2"
        ? "text-fuchsia-400"
        : ""
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">

        {/* ENABLE */}
        <Chip
          small
          active={headline2Enabled[format]}
          onClick={() =>
            setHeadline2Enabled(format, !headline2Enabled[format])
          }
        >
          {headline2Enabled[format] ? "On" : "Off"}
        </Chip>

        <span className="opacity-80">Align</span>

        <Chip
          small
          active={textStyles.headline2[format].align === "left"}
          onClick={() =>
            setTextStyle("headline2", format, { align: "left" })
          }
        >
          L
        </Chip>

        <Chip
          small
          active={textStyles.headline2[format].align === "center"}
          onClick={() =>
            setTextStyle("headline2", format, { align: "center" })
          }
        >
          C
        </Chip>

        <Chip
          small
          active={textStyles.headline2[format].align === "right"}
          onClick={() =>
            setTextStyle("headline2", format, { align: "right" })
          }
        >
          R
        </Chip>
      </div>
    }
  >

    {/* ⭐ NEON ACTIVE WRAPPER (FUCHSIA) */}
    <div
      className={
        selectedPanel === "head2"
          ? "p-2 rounded-md ring-2 ring-fuchsia-400 shadow-[0_0_18px_4px_rgba(255,0,220,0.55)]"
          : "p-0"
      }
    >
      {/* TEXT FIELD */}
      <textarea
        value={head2}
        onChange={(e) => {
          const v = e.target.value;
          setHead2(v);
          setSessionValue(format, "head2line", v);
        }}
        rows={2}
        disabled={!headline2Enabled[format]}
        className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700 disabled:opacity-50"
        placeholder="Optional sub-headline"
      />

      {/* FONT FAMILY */}
<div className="flex flex-col gap-1">
  <label className="text-xs text-neutral-400">Font</label>
  <select
    value={textStyles.headline2[format].family} // Read from reliable rendering state
    disabled={!headline2Enabled[format]}
    onChange={(e) => {
      const family = e.target.value;
      
      // 1. Update the Rendering Source of Truth (Zustand textStyles)
      setTextStyle("headline2", format, { family });
      
      // 2. Update the Persistence Source of Truth (Zustand session)
      setSessionValue(format, "head2Family", family);

      // 3. 🔥 CRITICAL FIX: Trigger the dedicated font loading useEffect 
      //    We must update a dependency that is still local state. 
      //    We rely on setHead2Family being gone, but head2Family is still needed for the useEffect hook.
      //    We rely on the existing 'head2Family' local state being driven by the session load
      setHead2Family(family); // If the local state is still required in other areas, we must re-introduce it.
    }}
    className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700 disabled:opacity-40"
  >
    {HEADLINE2_FONTS_LOCAL.map((f) => (
      <option key={f} value={f}>{f}</option>
    ))}
  </select>
</div>
      {/* GRID 1 */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        <Stepper
        label="Headline 2 Alpha"
        value={head2Alpha}
        setValue={(v) => {
          setHead2Alpha(v);
          setSessionValue(format, "head2Alpha", v);       // ⭐ store per format
        }}
        min={0}
        max={1}
        step={0.05}
        digits={2}
      />

        <Stepper
          label="Track (em)"
          value={head2Fx.tracking}
          setValue={(n) =>
            setHead2Fx((v) => ({ ...v, tracking: n }))
          }
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
          value={textStyles.headline2[format].sizePx}
          setValue={(v) => {
            setTextStyle("headline2", format, { sizePx: v });
            setSessionValue(format, "head2SizePx", v);   // ⭐ store per format
          }}
          min={24}
          max={180}
          step={2}
        />

        <Stepper
        label="Line Height"
        value={textStyles.headline2[format].lineHeight}
        setValue={(v) => {
          setTextStyle("headline2", format, { lineHeight: v });
          setSessionValue(format, "head2lineHeight", v); // ⭐ store per format
        }}
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
        <Chip small active={head2Fx.gradient}  onClick={() => setHead2Fx(v => ({ ...v, gradient: !v.gradient }))}>Gradient</Chip>
        <Chip small active={head2Fx.uppercase} onClick={() => setHead2Fx(v => ({ ...v, uppercase: !v.uppercase }))}>Upper</Chip>
        <Chip small active={head2Fx.bold}      onClick={() => setHead2Fx(v => ({ ...v, bold: !v.bold }))}>Bold</Chip>
        <Chip small active={head2Fx.italic}    onClick={() => setHead2Fx(v => ({ ...v, italic: !v.italic }))}>Italic</Chip>
        <Chip small active={head2Fx.underline} onClick={() => setHead2Fx(v => ({ ...v, underline: !v.underline }))}>Underline</Chip>

        <Chip small active={head2Shadow} onClick={() => setHead2Shadow(!head2Shadow)}>Shadow</Chip>
      </div>

      {/* SHADOW STRENGTH */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs opacity-70">Shadow Strength</span>
        <Stepper
          value={head2ShadowStrength}
          setValue={setHead2ShadowStrength}
          min={0}
          max={5}
          step={0.1}
        />
      </div>

      {/* COLOR */}
      <div className="flex items-end mt-2 flex-wrap w-full">
        <div className="ml-auto flex flex-wrap items-center gap-2 justify-end text-[11px]">
          <span className="opacity-80">Fill</span>
        <ColorDot
            title="Fill color"
            value={textStyles.headline2[format].color}
            onChange={(c) => {
              setTextStyle("headline2", format, { color: c }); // ⬅️ Updates rendering state
              setSessionValue(format, "head2Color", c); // ⬅️ Updates session persistence
            }}
          />
        </div>
      </div>

    </div> {/* END neon wrapper */}

  </Collapsible>
</div>
{/* UI: HEADLINE 2 (END) */}



{/* UI: SUBTAG (BEGIN) */}
<div
  className={
    selectedPanel === "subtag"
      ? "relative rounded-xl border border-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)] transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Subtag"
    storageKey="p:subtag"
    defaultOpen={selectedPanel === "subtag"}
    titleClassName={
      selectedPanel === "subtag"
        ? "text-blue-400"
        : ""
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">
        <Chip
          small
          active={subtagEnabled[format]}
          onClick={() =>
            setSubtagEnabled(format, !subtagEnabled[format])
          }
        >
          {subtagEnabled ? "On" : "Off"}
        </Chip>

        <span className="opacity-80">Align</span>

        <Chip
          small
          active={subtagAlign === "left"}
          onClick={() => setSubtagAlign("left")}
        >
          L
        </Chip>

        <Chip
          small
          active={subtagAlign === "center"}
          onClick={() => setSubtagAlign("center")}
        >
          C
        </Chip>

        <Chip
          small
          active={subtagAlign === "right"}
          onClick={() => setSubtagAlign("right")}
        >
          R
        </Chip>
      </div>
    }
  >

    {/* ⭐ Inner highlight wrapper only when active */}
    <div
      className={
        selectedPanel === "subtag"
          ? "p-2 rounded-md ring-2 ring-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)]"
          : "p-0"
      }
    >

      {/* Disable rest of panel when subtag is OFF */}
      <div className={subtagEnabled ? "" : "opacity-50 pointer-events-none"}>

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
             onChange={(e) => {
              const v = e.target.value;
              setSubtagFamily(v);
              setSessionValue(format, "subtagFamily", v);
              }}
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
          <Stepper
            label="Size"
            value={subtagSize}
            setValue={setSubtagSize}
            min={10}
            max={48}
            step={1}
          />

          <Stepper
            label="Alpha"
            value={subtagAlpha}
             setValue={(v) => {
              setSubtagAlpha(v);
              setSessionValue(format, "subtagAlpha", v);
            }}
            min={0}
            max={1}
            step={0.05}
            digits={2}
          />

          <div className="flex items-end justify-end text-[11px] gap-1">
            <span className="opacity-80">Pill</span>
            <ColorDot
              value={subtagBgColor}
              onChange={(v) => {
                setSubtagBgColor(v);
                setSessionValue(format, "subtagBgColor", v);
              }}
              title="Pill color"
            />
            <span className="opacity-80 ml-2">Text</span>
            <ColorDot
              value={subtagTextColor}
              onChange={setSubtagTextColor}
              title="Text color"
            />
          </div>
        </div>

        {/* ---------- SHADOW + STRENGTH ---------- */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-800">
          <Chip
            small
            active={subtagUppercase}
            onClick={() => setSubtagUppercase((v) => !v)}
          >
            Upper
          </Chip>

          <Chip
            small
            active={subtagItalic}
            onClick={() => setSubtagItalic((v) => !v)}
          >
            Italic
          </Chip>

          <Chip
            small
            active={subtagShadow}
            onClick={() => setSubtagShadow(!subtagShadow)}
          >
            Shadow
          </Chip>

          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <span className="opacity-80">Strength</span>
            <div className="w-[110px]">
              <Stepper
                label=""
                value={subtagShadowStrength}
                setValue={setSubtagShadowStrength}
                min={0}
                max={5}
                step={0.1}
              />
            </div>
          </div>
        </div>

      </div> {/* END disable wrapper */}

    </div> {/* END neon inner wrapper */}

  </Collapsible>
</div>
{/* UI: SUBTAG (END) */}


{/* UI: DETAILS (BEGIN) */}
<div
  className={
    selectedPanel === "details"
      ? "relative rounded-xl border border-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)] transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Details"
    storageKey="p:details"
    defaultOpen={selectedPanel === "details"}
    titleClassName={
      selectedPanel === "details"
        ? "text-blue-400"
        : ""
    }
    right={
      <div className="flex items-center gap-2 text-[11px]">
        <span className="opacity-70">Font</span>
        <select
          value={detailsFamily}
            onChange={(e) => {
               const v = e.target.value; 
               setDetailsFamily(v); // ⬅️ Correctly set font state
               setSessionValue(format, "detailsFamily", v); // ⬅️ Correctly save font to session
             }}
          className="rounded px-2 py-1 bg-[#17171b] text-white border border-neutral-700"
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
    <div
      className={
        selectedPanel === "details"
          ? "p-2 rounded-md ring-2 ring-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)]"
          : "p-0"
      }
    >

      {/* ---------- ALIGN (RIGHT-ALIGNED BELOW FONT) ---------- */}
      <div className="flex justify-end mt-3">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="opacity-80">Align</span>
          <Chip
            small
            active={detailsAlign === "left"}
            onClick={() => setDetailsAlign("left")}
          >
            L
          </Chip>
          <Chip
            small
            active={detailsAlign === "center"}
            onClick={() => setDetailsAlign("center")}
          >
            C
          </Chip>
          <Chip
            small
            active={detailsAlign === "right"}
            onClick={() => setDetailsAlign("right")}
          >
            R
          </Chip>
        </div>
      </div>

      {/* ---------- TEXT FIELD ---------- */}
      <div className="mt-4">
        <label className="block text-[11px] opacity-80 mb-1">Text</label>
        <textarea
          value={details}
          onChange={(e) => {
            const v = e.target.value;
            setDetailsFamily(v);
            setSessionValue(format, "detailsFamily", v);
            }}
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
        <Stepper
          label="Size"
          value={bodySize}
           setValue={(v) => {
            setBodySize(v);
            setSessionValue(format, "detailsSize", v);
          }}
          min={10}
          max={32}
          step={1}
        />
        <Stepper
          label="Tracking"
          value={bodyTracking}
          setValue={setBodyTracking}
          min={0}
          max={0.12}
          step={0.01}
          digits={2}
        />
        <Stepper
          label="Line Height"
          value={detailsLineHeight}
          setValue={setDetailsLineHeight}
          min={0.4}
          max={2.0}
          step={0.02}
          digits={2}
        />
      </div>

      {/* ---------- FORMATTING + SHADOW ---------- */}
      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-neutral-800">

        {/* Formatting */}
        <Chip small active={bodyUppercase} onClick={() => setBodyUppercase(v=>!v)}>Upper</Chip>
        <Chip small active={bodyItalic} onClick={() => setBodyItalic(v=>!v)}>Italic</Chip>
        <Chip small active={detailsShadow} onClick={() => setDetailsShadow(!detailsShadow)}>Shadow</Chip>

        {/* Shadow Strength */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] opacity-80">Strength</span>
          <div className="w-[110px]">
            <Stepper
              value={detailsShadowStrength}
              setValue={setDetailsShadowStrength}
              min={0}
              max={5}
              step={0.1}
            />
          </div>
        </div>

      </div>

    </div> {/* END inner neon wrapper */}

  </Collapsible>
</div>
{/* UI: DETAILS (END) */}


{/* UI: DETAILS 2 (BEGIN) */}
<div
  className={
    selectedPanel === "details2"
      ? "relative rounded-xl border border-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)] transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="More Details"
    storageKey="p:details2"
    defaultOpen={selectedPanel === "details2"}
    titleClassName={
      selectedPanel === "details2"
        ? "text-blue-400"
        : ""
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">
        <Chip
          small
          active={details2Enabled[format]}
          onClick={() =>
            setDetails2Enabled(format, !details2Enabled[format])
          }
        >
          {details2Enabled[format] ? "On" : "Off"}
        </Chip>

        <span className="opacity-80">Font</span>
        <select
          value={details2Family}
            onChange={(e) => { 
               const v = e.target.value;
               setDetails2Family(v); // ⬅️ Correctly set font state
               setSessionValue(format, "details2Family", v); // ⬅️ Correctly save font to session
             }}
          className="rounded px-2 py-1 bg-[#17171b] text-white border border-neutral-700"
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
    <div
      className={
        selectedPanel === "details2"
          ? "p-2 rounded-md ring-2 ring-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)]"
          : "p-0"
      }
    >

      {/* Disable all controls when off */}
      <div
        className={
          details2Enabled[format]
            ? ""
            : "opacity-50 pointer-events-none"
        }
      >

        {/* ---------- ALIGN ---------- */}
        <div className="flex justify-end mt-3">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="opacity-80">Align</span>
            <Chip
              small
              active={details2Align === "left"}
              onClick={() => setDetails2Align("left")}
            >
              L
            </Chip>
            <Chip
              small
              active={details2Align === "center"}
              onClick={() => setDetails2Align("center")}
            >
              C
            </Chip>
            <Chip
              small
              active={details2Align === "right"}
              onClick={() => setDetails2Align("right")}
            >
              R
            </Chip>
          </div>
        </div>

        {/* ---------- TEXT FIELD ---------- */}
        <div className="mt-4">
          <label className="block text-[11px] opacity-80 mb-1">
            Text
          </label>
          <textarea
            value={details2}
            onChange={(e) => setDetails2(e.target.value)}
            rows={3}
            className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
          />
        </div>

        {/* ---------- SIZE / TRACK / LINE HEIGHT ---------- */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stepper
            label="Size"
            value={details2Size}
            setValue={setDetails2Size}
            min={10}
            max={60}
            step={1}
          />

          <Stepper
            label="Track"
            value={details2LetterSpacing}
            setValue={setDetails2LetterSpacing}
            min={0}
            max={0.12}
            step={0.01}
            digits={2}
          />

          <Stepper
            label="Line Height"
            value={details2LineHeight}
            setValue={setDetails2LineHeight}
            min={0.5}
            max={2.5}
            step={0.05}
            digits={2}
          />
        </div>

        {/* ---------- FORMATTING + SHADOW ---------- */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-neutral-800">

          <Chip
            small
            active={details2Uppercase}
            onClick={() => setDetails2Uppercase((v) => !v)}
          >
            Upper
          </Chip>

          <Chip
            small
            active={details2Bold}
            onClick={() => setDetails2Bold((v) => !v)}
          >
            Bold
          </Chip>

          <Chip
            small
            active={details2Italic}
            onClick={() => setDetails2Italic((v) => !v)}
          >
            Italic
          </Chip>

          <Chip
            small
            active={details2Underline}
            onClick={() => setDetails2Underline((v) => !v)}
          >
            Underline
          </Chip>

          {/* Shadow toggle */}
          <Chip
            small
            active={details2Shadow}
            onClick={() => setDetails2Shadow(!details2Shadow)}
          >
            Shadow
          </Chip>

          {/* Shadow strength */}
          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <span className="opacity-80">Strength</span>
            <div className="w-[110px]">
              <Stepper
                value={details2ShadowStrength}
                setValue={setDetails2ShadowStrength}
                min={0}
                max={5}
                step={0.1}
              />
            </div>
          </div>

        </div>

      </div> {/* END: disable wrapper */}

    </div> {/* END: neon inner wrapper */}

  </Collapsible>
</div>
{/* UI: DETAILS 2 (END) */}


{/* UI: VENUE (BEGIN) */}
<div
  className={
    selectedPanel === "venue"
      ? "relative rounded-xl border border-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)] transition"
      : "relative rounded-xl border border-neutral-700 transition"
  }
>
  <Collapsible
    title="Venue"
    storageKey="p:venue"
    defaultOpen={selectedPanel === "venue"}
    titleClassName={
      selectedPanel === "venue"
        ? "text-blue-400"
        : ""
    }
    right={
      <div className="flex items-center gap-3 text-[11px]">
        {/* Font Picker */}
        <span className="opacity-80">Font</span>
        <select
          value={venueFamily}
           onChange={(e) => {
               const v = e.target.value;
               setVenueFamily(v); // ⬅️ Correctly set font state
               setSessionValue(format, "venueFamily", v); // ⬅️ Correctly save font to session
             }}
          className="rounded px-2 py-1 bg-[#17171b] text-white border border-neutral-700"
        >
          {VENUE_FONTS_LOCAL.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
    }
  >

    {/* ⭐ INNER NEON ACTIVE WRAPPER */}
    <div
      className={
        selectedPanel === "venue"
          ? "p-2 rounded-md ring-2 ring-blue-400 shadow-[0_0_18px_4px_rgba(0,170,255,0.55)]"
          : "p-0"
      }
    >

      {/* ---------- ALIGN (RIGHT-ALIGNED BELOW FONT) ---------- */}
      <div className="flex justify-end mt-3">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="opacity-80">Align</span>
          <Chip small active={venueAlign === "left"}   onClick={() => setVenueAlign("left")}>L</Chip>
          <Chip small active={venueAlign === "center"} onClick={() => setVenueAlign("center")}>C</Chip>
          <Chip small active={venueAlign === "right"}  onClick={() => setVenueAlign("right")}>R</Chip>
        </div>
      </div>

      {/* ---------- TEXT FIELD ---------- */}
      <div className="mt-4">
        <label className="block text-[11px] opacity-80 mb-1">Text</label>
        <textarea
          value={venue}
          onChange={(e)=> setVenue(e.target.value)}
          rows={2}
          className="w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
        />
      </div>

      {/* ---------- COLOR (RIGHT-ALIGNED LIKE OTHER PANELS) ---------- */}
      <div className="flex justify-end mt-3">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="opacity-80">Color</span>
          <ColorDot value={venueColor} onChange={setVenueColor} />
        </div>
      </div>

      {/* ---------- STEPPERS ---------- */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stepper
          label="Size"
          value={venueSize}
          setValue={setVenueSize}
          min={10}
          max={96}
          step={1}
        />

        <Stepper
          label="Line Height"
          value={venueLineHeight}
          setValue={setVenueLineHeight}
          min={0.7}
          max={1.4}
          step={0.02}
          digits={2}
        />

        <Stepper
          label="Rotate"
          value={venueRotate}
          setValue={setVenueRotate}
          min={-180}
          max={180}
          step={1}
        />
      </div>

      {/* ---------- FORMATTING + SHADOW ---------- */}
      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-neutral-800">

        {/* Shadow Toggle */}
        <Chip small active={venueShadow} onClick={() => setVenueShadow(!venueShadow)}>
          Shadow
        </Chip>

        {/* Shadow Strength Slider */}
        <div className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="opacity-80">Strength</span>
          <div className="w-[110px]">
            <Stepper
              value={venueShadowStrength}
              setValue={setVenueShadowStrength}
              min={0}
              max={5}
              step={0.1}
            />
          </div>
        </div>
      </div>

    </div> {/* END inner neon wrapper */}

  </Collapsible>
</div>
{/* UI: VENUE (END) */}


 </aside>

  {/* ---------- Center: Artboard & Guides ---------- */}
  <section
  className="sticky self-start flex flex-col items-center gap-3"
  style={{ top: STICKY_TOP }}
  >
  {/* Format (centered just above canvas) */}
{/* ===== CENTER: ARTBOARD + OVERLAY (ANIMATED FORMAT SWITCH) ===== */}
{/* ===== CENTER: ARTBOARD + OVERLAY (FADE TRANSITION ON FORMAT CHANGE) ===== */}
<div
  ref={artWrapRef}
  className="relative z-0 flex justify-center items-start rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm bg-neutral-950/40"
  style={{ filter: masterFilter }}
  onMouseDownCapture={(e) => {
    const el = e.target as HTMLElement;
    if (!el.closest('[data-portrait-area="true"]')) clearSelection();
  }}
>
  <div style={grainStyle} data-nonexport="true" />
  {/* ===== CANVAS FADE WRAPPER ===== */}
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
    filter: { duration: fadeOut ? 0.35 : 1, ease: "easeInOut" }
  }}

  

   onAnimationComplete={() => {
  // FADE OUT FINISHED
  if (fadeOut && pendingFormat) {
    const next = pendingFormat;

    // 1️⃣ Switch format NOW
    setFormat(next);

    // 2️⃣ Apply correct template variant
    const tpl = TEMPLATE_GALLERY.find(t => t.id === templateId);
    if (tpl) {
      applyTemplate(tpl, { targetFormat: next });

      // 🔗 SYNC TEMPLATE → TEXT STYLES (HEADLINE ONLY)
      const fmtData = tpl.formats?.[next];
      const headlineFamily =
        fmtData?.headlineFamily ?? tpl.base?.headlineFamily;

      if (headlineFamily) {
        const st = useFlyerState.getState();
        st.setTextStyle("headline", next, { family: headlineFamily });
        st.setSessionValue(next, "headlineFamily", headlineFamily);
      }
    }

    // Reset pending status
    setPendingFormat(null);

    // 3️⃣ Fade back in
    setFadeOut(false);
  }
}}

  >
    <Artboard
      /* KEEP EVERYTHING BELOW EXACTLY AS-IS */
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
      onTogglePortraitLock={() => setPortraitLocked(v => !v)}
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
      vignette={vignette}

      bgPosX={bgPosX}
      bgPosY={bgPosY}

      headline={headline}
      headAlign={headAlign}
      headlineFamily={textStyles.headline[normalizeFormat(format)].family}

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
  </motion.div>
</AnimatePresence>


  {portraitCanvas}
</div>



</section>
{/* ---------- Right Panel ---------- */}
<aside
className="sticky self-start max-h-[calc(100vh-120px)] overflow-y-auto space-y-3 pr-1"
style={{ top: STICKY_TOP }}
>               

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
              onClick={downloadCurrentDesign}
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
 <Collapsible title="Brand Kit" storageKey="p:brandkit" defaultOpen={false}>
            <div className="text-[12px] text-neutral-300 mb-2">
              Save your fonts, core colors, and logo once. Download as a portable file you can share or re-use later.
            </div>

            {/* Logo picker (optional; included as DataURL in the kit) */}
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

            {/* Snapshot preview */}
           <div className="text-[11px] text-neutral-400 mt-3">
            Current fonts captured:
            Headline (<b>{textStyles.headline[format].family}</b>),
            Details (<b>{textStyles.details[format].family}</b>),
            Venue (<b>{textStyles.venue[format].family}</b>),
            Subtag (<b>{textStyles.subtag[format].family}</b>)
          </div>


            {/* Color chips (read-only) */}
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

            {/* Actions: Download / Upload */}
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
                <Chip small active={genProvider==='mock'}  onClick={()=> setGenProvider('mock')}>Mock</Chip>
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

              {/* ONE ROW: People | Diversity | Clarity  (perfectly horizontal bottoms) */}
              <div className="grid grid-cols-[100px_110px_107px] justify-end items-end gap-4">
                {/* People label + single toggle (right-aligned inside its cell) */}
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

                {/* Diversity stepper (fixed width so its baseline matches) */}
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
                <button
                  type="button"
                  onClick={() => {
                    if (lastGenRef?.current?.opts) {
                      generateBackground(lastGenRef.current.opts);
                    } else {
                      generateBackground();
                    }
                  }}
                  disabled={genLoading}
                  className="px-3 py-2 rounded border border-neutral-700 bg-neutral-900/70 hover:bg-neutral-800"
                  title="Repeat the last successful generation settings"
                >
                  Regenerate
                </button>
              </div>
              {/* 🌅 Magic Background */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={genLoading}
                  onClick={() => {
                    // 1️⃣ Random preset
                    const presets: GenStyle[] = ['urban', 'neon', 'vintage', 'tropical'];
                    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
                    setGenStyle(randomPreset);

                    // 2️⃣ Random subject
                    const subjects = [
                      'dj',
                      'artist',
                      'crowd',
                      'dancers',
                      'empty_stage'
                    ];
                    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
                    setSelectedSubject(randomSubject);

                    // 3️⃣ Generate + apply
                    generateBackground();
                  }}
                  className="w-full mt-2 px-3 py-2 rounded text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-600 to-indigo-500 hover:from-fuchsia-700 hover:to-indigo-600 transition-all"
                >
                  ✨ Magic Background
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

{/* UI: UPLOAD BACKGROUND (BEGIN) */}
<Collapsible
  title="Background Image"
  storageKey="p:bg"
  defaultOpen={true}
  right={
    <div className="flex items-center gap-2 text-[11px]">
      <Chip small onClick={triggerUpload}>Upload</Chip>
      {(bgUploadUrl || bgUrl) && (
        <>
          <Chip small onClick={fitBackground} title="Center & 100%">Fit</Chip>
          <Chip small onClick={() => { setBgScale(1.3); setBgPosX(50); setBgPosY(50); }} title="Slight zoom">
            Fill
          </Chip>
          <Chip small onClick={clearBackground}>Clear</Chip>
        </>
      )}
    </div>
  }
>
  {/* hidden file input (reuses uplRef) */}
  {/* hidden pickers (keep them mounted once) */}
{/* hidden file inputs */}
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
  style={{ position: 'fixed', left: '-9999px', width: 0, height: 0, opacity: 0 }}
/>

<input
  ref={portraitSlotPickerRef}
  type="file"
  accept="image/*"
  onChange={onPortraitSlotFile}
  className="hidden"
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
        <Chip small onClick={() => { setBgScale(s => Math.min(3, s * 1.1)); }}>Zoom +</Chip>
        <Chip small onClick={() => { setBgScale(s => Math.max(1, s / 1.1)); }}>Zoom −</Chip>
        <Chip small onClick={() => { setBgPosX(50); setBgPosY(50); }}>Re-center</Chip>
      </div>

      <div className="text-[11px] text-neutral-400">
        Tip: In <b>Move</b> → <b>background</b> mode, drag to pan and
        <span className="inline-block px-1 mx-1 rounded bg-neutral-800/70 border border-neutral-700">Ctrl</span>
        + scroll to zoom.
      </div>
    </div>
  ) : (
    <div className="text-[12px] text-neutral-300">
      No background yet. Click <b>Upload</b> to add an image, or use <b>AI Background</b> below to generate one.
      <div className="mt-2">
        <Chip small onClick={triggerUpload}>Upload background</Chip>
      </div>
    </div>
  )}
</Collapsible>
{/* UI: UPLOAD BACKGROUND (END)*/}

{/* UI: BACKGROUND EFFECTS (BEGIN) */}
<Collapsible
  title="Background Effects"
  storageKey="p:bgfx"
  defaultOpen={false}
  activeKey="background"                    // 👈 tells the panel what key corresponds to the background
  currentActive={moveTarget ?? undefined}
  right={
    <Chip
      small
      onClick={() => { setHue(0); setHaze(0.5); setVignette(0.55); setBgPosX(50); setBgPosY(50); setBgScale(1); }}
    >
      Reset
    </Chip>
  }
>
  {/* Row 1: Haze | Hue | Vignette */}
  <div className="grid grid-cols-3 gap-3">
    <Stepper label="Haze"     value={haze}     setValue={setHaze}     min={0}   max={1}   step={0.02} digits={2} />
    <Stepper label="Hue"      value={hue}      setValue={setHue}      min={-180} max={180} step={1} />
    <Stepper label="Vignette" value={vignette} setValue={setVignette} min={0}   max={0.9} step={0.02} digits={2} />
  </div>

  {/* Row 2: Scale | BG X % | BG Y % */}
  <div className="grid grid-cols-3 gap-3 mt-2">
    <Stepper label="Scale" value={bgScale} setValue={setBgScale} min={1} max={5} step={0.1} digits={2} />
    <Stepper label="BG X %" value={bgPosX} setValue={setBgPosX} min={0} max={100} step={1} />
    <Stepper label="BG Y %" value={bgPosY} setValue={setBgPosY} min={0} max={100} step={1} />
  </div>
</Collapsible>
{/* UI: BACKGROUND EFFECTS (END) */}


{/* UI: ICONS 2 (BEGIN) */}
 <div className="mt-3">
<Collapsible title="Icons Library" storageKey="p:icons" defaultOpen>
    {/* hidden input shared by all 4 slots */}
    <input
      ref={IS_iconSlotPickerRef}
      type="file"
      accept="image/*"
      onChange={IS_onIconSlotFile}
      className="hidden"
    />

    <div className="text-[12px] text-neutral-300 mb-2">
      Upload up to 4 icons/logos. Then click <b>Place</b> to add to canvas.
    </div>
    <div className="grid grid-cols-2 gap-2">
      {IS_iconSlots.map((src, i) => (
        <div key={i} className="rounded-lg border border-neutral-700 bg-neutral-900/50 overflow-hidden">
          <div className="aspect-square w-full bg-[linear-gradient(45deg,#222_25%,#000_25%,#000_50%,#222_50%,#222_75%,#000_75%,#000)] bg-[length:16px_16px] grid place-items-center">
            {src ? (
              <img src={src} alt={`icon slot ${i+1}`} className="w-full h-full object-contain" draggable={false} />
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


    
    {/* --- Emoji Section Below Icon Uploads --- */}
<div className="mt-4 border-t border-neutral-800 pt-3">
  <div className="text-[12px] text-neutral-300 mb-2">
    Emoji Library — pick an emoji and click to place it on the canvas.
  </div>

  <div className="grid grid-cols-6 gap-2 text-lg">
    {['🔥','🎧','🍸','💃🏾','🎵','💎','😎','🎉','🚀','✨','💋','🕺','🎶','🌴','🥂','🎭','🖤','⚡️','🦋','🌈'].map((emoji, i) => (
      <button
        key={i}
        type="button"
        onClick={() => addEmojiToCanvas(emoji)}
        className="aspect-square grid place-items-center rounded bg-neutral-900/60 hover:bg-neutral-800 text-2xl"
        title={`Add ${emoji}`}
      >
        {emoji}
      </button>
    ))}
  </div>
</div>
 </Collapsible>
  </div>
{/* UI: ICONS 2 (END) */}

{/* UI: PORTRAITS — COMBINED SLOTS (BEGIN) */}
<Collapsible 
title="Portraits" 
storageKey="p:portrait" 
defaultOpen
>
  <div className="mb-2 flex items-center justify-end gap-2 text-[11px]">
  <span>Legacy overlay</span>
  <Chip
    small
    active={enablePortraitOverlay}
    onClick={() => setEnablePortraitOverlay((v: boolean) => !v)}
    title="Show/Hide the old portrait overlay frame"
  >
    {enablePortraitOverlay ? 'On' : 'Off'}
  </Chip>
</div>

  <div className="grid grid-cols-2 gap-2">
  {[0, 1, 2, 3].map((i) => {
    const src = portraitSlots[i] || '';
    return (
      <div
        key={i}
        className="border border-neutral-700 rounded-lg p-2 bg-neutral-900/50"
      >
        <div className="h-24 rounded overflow-hidden border border-neutral-700 bg-neutral-900 grid place-items-center">
          {src ? (
            <img
              src={src}
              alt={`portrait slot ${i + 1}`}
              className="w-full h-full object-contain bg-white"
              draggable={false}
            />
          ) : (
            <div className="text-[11px] text-neutral-500">
              Empty portrait {i + 1}
            </div>
          )}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1">
          {/* Upload + remove background */}
          <button
            type="button"
            onClick={async () => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';

              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                // Reject huge uploads early
                if (file.size > 15 * 1024 * 1024) {
                  alert('Please upload an image under 15MB.');
                  return;
                }
                // Optional: disallow SVG here too
                if (file.type === 'image/svg+xml') {
                  alert('SVG not supported. Please upload PNG or JPG.');
                  return;
                }


                const fd = new FormData();
                fd.append('image', file, file.name);

                try {
                  const res = await fetch('/api/remove-bg', {
                    method: 'POST',
                    body: fd,
                  });

                  if (!res.ok) throw new Error(`HTTP ${res.status}`);

                  const ct = res.headers.get('content-type') || '';
                  let dataUrl: string | undefined;

                  if (ct.includes('application/json')) {
                    const j = await res.json();
                    if (j?.b64)
                      dataUrl = `data:image/png;base64,${j.b64}`;
                    else if (j?.dataUrl) dataUrl = j.dataUrl;
                    else throw new Error('Unexpected JSON from /api/remove-bg');
                  } else {
                    const outBlob = await res.blob();
                    const reader = new FileReader();
                    dataUrl = await new Promise<string>((resolve) => {
                      reader.onload = () => resolve(String(reader.result || ''));
                      reader.readAsDataURL(outBlob);
                    });
                  }

                  if (!dataUrl) throw new Error('No dataUrl received');
                  // Guard: avoid huge base64 in localStorage (~6MB threshold)
                  if (dataUrl.length > 6_000_000) {
                    alert('Result too large to store locally. Please try a smaller image.');
                    return;
                  }


                  setPortraitSlots((prev) => {
                    const next = [...prev];
                    next[i] = dataUrl!;
                    try {
                   safeLocalSet('nf:portraitSlots', JSON.stringify(next), ['nf:logoSlots','nf:bgCandidates']);
                    } catch {}
                    return next;
                  });
                } catch (err: any) {
                  alert(`Remove BG failed: ${err?.message || err}`);
                }
              };

              document.body.appendChild(input);
              input.click();
              setTimeout(() => {
                try {
                  document.body.removeChild(input);
                } catch {}
              }, 0);
            }}
            className="text-[11px] px-3 py-1.5 w-full text-center rounded-md bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 truncate"
            title="Upload and remove background"
          >
            {src ? 'Replace' : 'Upload + Rm BG'}
          </button>

          {/* Place (adds a NEW portrait instance to the canvas) */}
       <button
  type="button"
  onClick={() => {
  const s = portraitSlots[i];
  if (!s) return;

  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const initialScale = 1.6;
  const x = 50;
  const y = 50;

  // -------------------------------------------------------
  // 🔥 THE ONLY VALID WAY — GLOBAL ZUSTAND INSERT
  // -------------------------------------------------------
  addPortrait(format, {
    id,
    url: s,
    x,
    y,
    scale: initialScale,
    locked: false,
  });

  // -------------------------------------------------------
  // ZUSTAND SESSION (optional, your existing behavior)
  // -------------------------------------------------------
  setSessionValue(format, "portraitEnabled", true);
  setSessionValue(format, "portraitUrl", s);
  setSessionValue(format, "portraitX", x);
  setSessionValue(format, "portraitY", y);
  setSessionValue(format, "portraitScale", initialScale);

  // -------------------------------------------------------
  // Trigger dummy portrait canvas sync (existing code)
  // -------------------------------------------------------
  requestAnimationFrame(() => {
    const art = artRef.current;
    const pc = portraitCanvasRef.current;
    if (art && pc) {
      const rect = art.getBoundingClientRect();
      pc.style.left = rect.left + "px";
      pc.style.top = rect.top + "px";
      pc.style.width = rect.width + "px";
      pc.style.height = rect.height + "px";
    }
  });
}}


  className="text-[11px] px-3 py-1.5 w-full text-center rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 truncate"
  disabled={!src}
  title="Place this portrait on the canvas"
>
  Place
      </button>
          {/* Clear slot */}
          <button
            type="button"
            onClick={() => {
              setPortraitSlots((prev) => {
                const next = [...prev];
                next[i] = '';
                try {
                  localStorage.setItem(
                    'nf:portraitSlots',
                    JSON.stringify(next)
                  );
                } catch {}
                return next;
              });
            }}
            className="text-[11px] px-3 py-1.5 w-full text-center rounded-md bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50 truncate"
            disabled={!src}
            title="Clear this portrait slot"
          >
            Clear
          </button>
        </div>
      </div>
    );
  })}
</div>

  
</Collapsible>
{/* UI: PORTRAITS — COMBINED SLOTS (END) */}

{/* UI: MEDIA (BEGIN) */}
<Collapsible title="Logo" storageKey="p:media" defaultOpen={false}>
   {/* Hidden input already wired to onLogoFile via logoPickerRef */}
  <div className="text-[12px] text-neutral-300 mb-2">
    Store up to 4 logos. Click <b>Upload/Replace</b> on any slot, then <b>Place</b> to drop it on the canvas.
  </div>

  {/* 4-slot grid */}
  <div className="grid grid-cols-2 gap-2">
    {[0,1,2,3].map((i) => {
      const src = logoSlots[i] || '';
      return (
        <div key={i} className="border border-neutral-700 rounded-lg p-2 bg-neutral-900/50">
          <div className="h-20 rounded overflow-hidden border border-neutral-700 bg-neutral-900 grid place-items-center">
            {src ? (
              <img
                src={src}
                alt={`logo slot ${i+1}`}
                className="w-full h-full object-contain bg-white"
                draggable={false}
              />
            ) : (
              <div className="text-[11px] text-neutral-500">Empty slot {i+1}</div>
            )}
          </div>


          <div className="mt-2 grid grid-cols-3 gap-1">
         <button
          type="button"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';

            input.onchange = () => {
              const file = input.files?.[0];
              if (!file) return;

              const r = new FileReader();
              r.onload = () => {
                const dataUrl = String(r.result || '');
                setLogoSlots(prev => {
                  const next = [...prev];
                  next[i] = dataUrl;
                  try { localStorage.setItem('nf:logoSlots', JSON.stringify(next)); } catch {}
                  return next;
                });
              };
              r.readAsDataURL(file);
            };

            document.body.appendChild(input);
            input.click();
            setTimeout(() => { try { document.body.removeChild(input); } catch {} }, 0);
          }}
          className="text-[11px] px-3 py-1.5 w-full text-center rounded-md bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 truncate"
          title={src ? 'Replace logo' : 'Upload logo'}
        >
          {src ? 'Replace' : 'Upload'}
                </button>


          <button
            type="button"
            onClick={() => {
              const src = logoSlots[i];
              if (!src) return;

              const newId = 'logo_' + Math.random().toString(36).slice(2, 9);

              const newIcon = {
                id: newId,
                type: 'image',
                imgUrl: src,
                x: 50,
                y: 50,
                size: 10, // <-- larger for visibility (adjust 2.5–4.0 as needed)
                rotation: 0,
                opacity: 1,
                fill: '#ffffff',
                strokeColor: '#000000',
                strokeWidth: 0,
                locked: false,
                name: 'Logo',
              } as any;

              setIconList(prev => [...prev, newIcon]);
              try { setSelIconId?.(newId); } catch {}
              try { setMoveMode?.(true); setDragging?.('icon'); } catch {}
            }}
            className="text-[11px] px-3 py-1.5 w-full text-center rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 truncate"
            disabled={!src}
            title="Place this logo on the canvas"
          >
            Place
          </button>

          <button
            type="button"
            onClick={() => clearLogoSlot(i)}
            className="text-[11px] px-3 py-1.5 w-full text-center rounded-md bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50 truncate"
            disabled={!src}
            title="Clear this slot"
          >
            Clear
          </button>
        </div>
        </div>
      );
    })}
  </div>


  {/* Existing on-canvas logo controls (keep) */}
  <div className="mt-3 text-[12px] text-neutral-300">On-canvas logo controls</div>
  <div className="mt-2 flex items-center justify-between">
    <div className="min-w-[220px] w-full max-w-[360px]">
      <div className="grid grid-cols-2 gap-3">
        <Stepper
          label="Rotation (°)"
          value={logoRotate}
          setValue={setLogoRotate}
          min={-90}
          max={90}
          step={1}
        />
        <Stepper
          label="Logo Scale"
          value={logoScale}
          setValue={setLogoScale}
          min={0.3}
          max={5}
          step={0.1}
          digits={2}
        />
      </div>
    </div>
    <div className="flex items-center gap-2 text-[11px]">
      <Chip small onClick={()=> setLogoScale(1)}>Reset</Chip>
    </div>
  </div>

</Collapsible>
{/* UI: MEDIA (END) */}

{/* UI: CINEMATIC OVERLAYS (BEGIN) */}
<Collapsible title="Cinematic Overlays" storageKey="p:cinema" defaultOpen={false}>
  <div className="flex items-end justify-start gap-0 mt-2">
    <Stepper label="Grade" value={grade} setValue={setGrade} min={0} max={1} step={0.05} digits={2} />
    <Stepper label="Leaks" value={leak}  setValue={setLeak}  min={0} max={1} step={0.05} digits={2} />
  </div>
  <div className="text-[11px] text-neutral-400 mt-2">Tip: 0.25–0.45 feels cinematic.</div>
</Collapsible>
{/* UI: CINEMATIC OVERLAYS (END) */}



{/* UI: MASTER COLOR GRADE (BEGIN) */}
<Collapsible title="Master Color Grade" storageKey="p:mastergrade" defaultOpen={true}
  right={
    <Chip small onClick={()=>{
      setExp(1); setContrast(1.08); setSaturation(1.10);
      setWarmth(0.10); setTint(0); setGamma(1); setGrain(0.15);
    }}>Reset</Chip>
  }
>
  <div className="grid grid-cols-3 gap-3">
    <Stepper label="Exposure"  value={exp}        setValue={setExp}        min={0.7} max={1.4} step={0.02} digits={2}/>
    <Stepper label="Contrast"  value={contrast}   setValue={setContrast}   min={0.7} max={1.5} step={0.02} digits={2}/>
    <Stepper label="Saturation"value={saturation} setValue={setSaturation} min={0.6} max={1.6} step={0.02} digits={2}/>
  </div>
  <div className="grid grid-cols-3 gap-3 mt-2">
    <Stepper label="Warmth"    value={warmth}     setValue={setWarmth}     min={0}   max={1}   step={0.02} digits={2}/>
    <Stepper label="Tint"      value={tint}       setValue={setTint}       min={-1}  max={1}   step={0.02} digits={2}/>
    <Stepper label="Gamma"     value={gamma}      setValue={setGamma}      min={0.7} max={1.5} step={0.02} digits={2}/>
  </div>
  <div className="grid grid-cols-3 gap-3 mt-2">
    <Stepper label="Grain"     value={grain}      setValue={setGrain}      min={0}   max={1}   step={0.05} digits={2}/>
  </div>
  <div className="text-[11px] text-neutral-400 mt-2">
    Tip: try Exposure 1.00, Contrast 1.10–1.15, Saturation 1.05–1.15, Warmth 0.08–0.15, Grain 0.10–0.25.
  </div>
</Collapsible>
{/* UI: MASTER COLOR GRADE (END) */}
        </aside>
      </section>
      {/* ===== UI: MAIN 3-COL LAYOUT (END) ===== */}
   </main>
  </>
  );
}
/* ===== BLOCK: PAGE (END) ===== */