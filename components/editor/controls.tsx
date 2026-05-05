 'use client';
 
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlyerState } from '../../app/state/flyerState';
 
function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}

const controlLabelClass = 'text-[11px] uppercase tracking-[0.12em] text-neutral-400';
const controlFieldClass = 'border border-neutral-700 bg-[#17171b] text-white';
const controlInputClass = `${controlFieldClass} px-1.5 py-1 text-[11px] text-center`;
const controlButtonClass = 'border border-neutral-700 bg-neutral-900/70 text-neutral-200 transition-colors';
const controlRangeClass = 'nf-range min-w-0 flex-1 h-2 appearance-none bg-transparent accent-indigo-500';

const panelClass =
  'panel min-w-0 p-4 rounded-xl border border-white/5 bg-neutral-900/80 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)] space-y-3';
export const editorPanelActiveClass =
  'ring-1 ring-inset ring-cyan-300/55 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]';
export const editorPanelTitleActiveClass =
  'text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.24)]';
export const editorHelperTextClass = 'text-[11px] leading-5 text-neutral-400';
export const editorSectionCardClass =
  'rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4';
export const editorSectionEyebrowClass =
  'text-[10px] uppercase tracking-[0.16em] text-neutral-500';
export const editorSectionTitleClass = 'mt-1 text-sm font-medium text-white';
export const editorSectionMetaClass = 'text-[10px] text-neutral-500';
export const editorPrimaryButtonClass =
  'rounded-lg border border-white/15 bg-white px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50';
export const editorSecondaryButtonClass =
  'rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-medium text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50';
export const editorAdvancedToggleClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-[11px] font-medium text-white transition hover:bg-white/[0.06]';
export const editorEmptyStateClass =
  'rounded-xl bg-white/[0.02] px-4 py-4 text-center';
export const editorEmptyStateTitleClass = 'text-[12px] font-medium text-white';
export const editorEmptyStateBodyClass = 'mt-1 text-[11px] leading-5 text-neutral-400';
export const editorItemCardClass =
  'rounded-xl border border-neutral-700 bg-neutral-900/50 p-2 transition-colors';
export const editorItemCardActiveClass =
  'rounded-xl border border-cyan-300/55 bg-cyan-400/10 p-2 shadow-[0_0_0_1px_rgba(34,211,238,0.12)] transition-colors';
export const editorThumbClass =
  'rounded-lg border border-white/10 bg-neutral-900/70 overflow-hidden';
export const editorUploadHolderClass =
  'border border-neutral-700 bg-neutral-950/60 p-3 space-y-3';
export const editorUploadPreviewClass =
  'h-32 w-full grid place-items-center border border-neutral-700 bg-neutral-950 overflow-hidden';
export const editorUploadActionClass =
  'min-h-[40px] flex items-center justify-center border border-neutral-700 bg-neutral-900/60 px-3 py-2 text-[11px] font-medium text-neutral-200 text-center transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50';
export const editorUploadPlaceClass =
  'min-h-[40px] flex items-center justify-center border border-cyan-400/70 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold text-cyan-100 text-center transition hover:bg-cyan-500/16 disabled:cursor-not-allowed disabled:opacity-50';
export const editorUploadClearClass =
  'min-h-[40px] flex items-center justify-center border border-neutral-700 bg-transparent px-3 py-2 text-[11px] font-medium text-neutral-300 text-center transition hover:bg-neutral-900/60 disabled:cursor-not-allowed disabled:opacity-50';

let activeSliderDragCount = 0;
let activeSliderDragEndTimer: number | null = null;
const SLIDER_LIVE_UPDATE_MS = 32;

function sliderValuesEqual(a: number | null, b: number) {
  return a !== null && Math.abs(a - b) < 0.000001;
}

function beginSliderDragGate() {
  if (typeof window !== 'undefined' && activeSliderDragEndTimer !== null) {
    window.clearTimeout(activeSliderDragEndTimer);
    activeSliderDragEndTimer = null;
  }
  activeSliderDragCount += 1;
  useFlyerState.getState().setIsLiveDragging(true);
}

function endSliderDragGateSoon() {
  activeSliderDragCount = Math.max(0, activeSliderDragCount - 1);
  if (activeSliderDragCount > 0) return;

  if (typeof window === 'undefined') {
    useFlyerState.getState().setIsLiveDragging(false);
    return;
  }

  if (activeSliderDragEndTimer !== null) {
    window.clearTimeout(activeSliderDragEndTimer);
  }
  activeSliderDragEndTimer = window.setTimeout(() => {
    activeSliderDragEndTimer = null;
    if (activeSliderDragCount === 0) {
      useFlyerState.getState().setIsLiveDragging(false);
    }
  }, 48);
}
 
 export type StepperProps = {
   label?: string;
   value: number;
   setValue: (n: number) => void;
   min: number;
   max: number;
   step?: number;
   digits?: number;
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
   className = '',
}: StepperProps) {
   const clamp = React.useCallback((n: number) => Math.min(max, Math.max(min, n)), [max, min]);
  const formattedValue = formatNumericValue(
    Number.isFinite(value) ? value : 0,
    Math.max(0, digits)
  );
  const [draftValue, setDraftValue] = React.useState(formattedValue);
  const [isEditing, setIsEditing] = React.useState(false);
  const rangeRef = React.useRef<HTMLInputElement | null>(null);
  const rangeFrameRef = React.useRef<number | null>(null);
  const rangeTimerRef = React.useRef<number | null>(null);
  const pendingRangeRef = React.useRef<number | null>(null);
  const latestRangeValueRef = React.useRef(Number.isFinite(value as number) ? Number(value) : Number(min ?? 0));
  const rangeDraggingRef = React.useRef(false);
  const rangeDragTokenRef = React.useRef(0);
  const lastLiveRangeAtRef = React.useRef(0);
  const lastAppliedRangeValueRef = React.useRef<number | null>(latestRangeValueRef.current);
  const setValueRef = React.useRef(setValue);

  React.useEffect(() => {
    if (!isEditing && !rangeDraggingRef.current) {
      setDraftValue(formattedValue);
    }
  }, [formattedValue, isEditing]);

  React.useEffect(() => {
    setValueRef.current = setValue;
  }, [setValue]);

  React.useEffect(() => {
    const next = Number.isFinite(value as number) ? Number(value) : Number(min ?? 0);
    latestRangeValueRef.current = next;
    if (!rangeDraggingRef.current) {
      lastAppliedRangeValueRef.current = next;
      if (rangeRef.current) {
        rangeRef.current.value = String(next);
      }
    }
  }, [min, value]);

  React.useEffect(() => {
    return () => {
      if (rangeFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rangeFrameRef.current);
        rangeFrameRef.current = null;
      }
      if (rangeTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(rangeTimerRef.current);
        rangeTimerRef.current = null;
      }
      if (rangeDraggingRef.current) {
        const next = pendingRangeRef.current;
        pendingRangeRef.current = null;
        if (next != null) {
          lastAppliedRangeValueRef.current = next;
          setValueRef.current(next);
        }
        rangeDraggingRef.current = false;
        rangeDragTokenRef.current += 1;
        endSliderDragGateSoon();
      }
    };
  }, []);

  const scheduleLiveRangeChange = React.useCallback(() => {
    if (rangeFrameRef.current !== null || rangeTimerRef.current !== null) return;
    if (typeof window === 'undefined') {
      const next = pendingRangeRef.current;
      if (next != null && !sliderValuesEqual(lastAppliedRangeValueRef.current, next)) {
        lastAppliedRangeValueRef.current = next;
        setValueRef.current(next);
      }
      return;
    }
    const dragToken = rangeDragTokenRef.current;
    const run = () => {
      rangeTimerRef.current = null;
      rangeFrameRef.current = window.requestAnimationFrame(() => {
        rangeFrameRef.current = null;
        const next = pendingRangeRef.current;
        if (next == null) return;
        if (!rangeDraggingRef.current || dragToken !== rangeDragTokenRef.current) return;
        if (sliderValuesEqual(lastAppliedRangeValueRef.current, next)) return;
        lastLiveRangeAtRef.current = performance.now();
        lastAppliedRangeValueRef.current = next;
        setValueRef.current(next);
      });
    };
    const now = performance.now();
    const wait = Math.max(0, SLIDER_LIVE_UPDATE_MS - (now - lastLiveRangeAtRef.current));
    if (wait > 0) {
      rangeTimerRef.current = window.setTimeout(run, wait);
      return;
    }
    run();
  }, []);
 
   const onRange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const n = clamp(parseFloat(e.target.value));
     latestRangeValueRef.current = n;
     pendingRangeRef.current = n;
     if (rangeDraggingRef.current) {
       scheduleLiveRangeChange();
     } else {
       pendingRangeRef.current = null;
       if (!isEditing) {
         setDraftValue(formatNumericValue(n, Math.max(0, digits)));
       }
       lastAppliedRangeValueRef.current = n;
       setValueRef.current(n);
     }
   };

  const flushPendingRangeSoon = React.useCallback(() => {
    if (rangeFrameRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(rangeFrameRef.current);
      rangeFrameRef.current = null;
    }
    if (rangeTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(rangeTimerRef.current);
      rangeTimerRef.current = null;
    }
    const next = pendingRangeRef.current;
    pendingRangeRef.current = null;
    if (next == null) return;
    if (!sliderValuesEqual(lastAppliedRangeValueRef.current, next)) {
      lastAppliedRangeValueRef.current = next;
      setValueRef.current(next);
    }
    if (!isEditing) {
      setDraftValue(formatNumericValue(next, Math.max(0, digits)));
    }
  }, [digits, isEditing]);

  const onRangePointerDown = React.useCallback((e: React.PointerEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (rangeDraggingRef.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    rangeDragTokenRef.current += 1;
    rangeDraggingRef.current = true;
    beginSliderDragGate();
  }, []);

  const onRangePointerEnd = React.useCallback((e: React.PointerEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!rangeDraggingRef.current) return;
    const raw = e.currentTarget.value;
    const next = clamp(parseFloat(raw));
    latestRangeValueRef.current = next;
    pendingRangeRef.current = next;
    rangeDraggingRef.current = false;
    rangeDragTokenRef.current += 1;
    flushPendingRangeSoon();
    endSliderDragGateSoon();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }, [clamp, flushPendingRangeSoon]);
 
   const onNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
     setDraftValue(e.target.value);
   };

   const commitNumber = React.useCallback(
     (raw: string) => {
       const trimmed = raw.trim();
       if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
         setDraftValue(formattedValue);
         return;
       }
       const n = clamp(parseFloat(trimmed));
       if (!Number.isNaN(n)) {
         setValue(n);
         setDraftValue(formatNumericValue(n, Math.max(0, digits)));
         return;
       }
       setDraftValue(formattedValue);
     },
     [clamp, digits, formattedValue, setValue]
   );
 
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
 
   const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (disabled) return;
     let delta = 0;
     if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = step;
     if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -step;
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
         <label className={controlLabelClass}>{label}</label>
       )}
 
       <div className="flex items-center gap-2 w-full">
         <input
           type="number"
           min={min}
           max={max}
           step={step}
           value={draftValue}
           onChange={onNumber}
           onFocus={() => setIsEditing(true)}
           onBlur={(e) => {
             setIsEditing(false);
             commitNumber(e.target.value);
           }}
           onKeyDown={(e) => {
             if (e.key === 'Enter') {
               e.currentTarget.blur();
               return;
             }
             if (e.key === 'Escape') {
               setIsEditing(false);
               setDraftValue(formattedValue);
               e.currentTarget.blur();
               return;
             }
           }}
           disabled={disabled}
           className={`w-[52px] ${controlInputClass}`}
         />
 
        <input
          ref={rangeRef}
          type="range"
          min={min}
          max={max}
          step={step}
          defaultValue={latestRangeValueRef.current}
          onChange={onRange}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          onPointerUp={onRangePointerEnd}
          onPointerCancel={onRangePointerEnd}
          onPointerDownCapture={onRangePointerDown}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={disabled}
          aria-label={label}
          style={{ touchAction: 'none' }}
          className={controlRangeClass}
        />
       </div>
     </div>
  );
}

export function FontPicker({
  value,
  options,
  onChange,
  label,
  disabled,
  className,
  sample = 'Aa Bb 123',
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  sample?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handle = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, []);

  return (
    <div className={`relative ${className ?? ''}`} ref={wrapRef}>
      {label && <div className={`${controlLabelClass} mb-1`}>{label}</div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-2 py-2 text-left flex items-center justify-between gap-2 disabled:opacity-60 ${controlFieldClass}`}
      >
        <span className="truncate" style={{ fontFamily: value }}>
          {value}
        </span>
        <span className="text-[11px] text-neutral-400" style={{ fontFamily: value }}>
          {sample}
        </span>
      </button>
      {open && (
        <div
          className="absolute z-[60] mt-1 w-full max-h-[60vh] overflow-auto border border-neutral-700 bg-[#0f0f12] shadow-xl pb-2"
          style={{ scrollPaddingBottom: 8 }}
        >
          {options.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                onChange(f);
                setOpen(false);
              }}
              className="w-full px-2 py-2 text-left hover:bg-neutral-800/80 border-b border-neutral-800 last:border-b-0"
            >
              <div className="text-[12px] text-white" style={{ fontFamily: f }}>
                {f}
              </div>
              <div className="text-[11px] text-neutral-400" style={{ fontFamily: f }}>
                {sample}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const Chip = React.memo(function Chip({
  active,
  onClick,
  children,
  small,
  disabled,
  title,
  className,
  deferHeavy = false,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  small?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
  deferHeavy?: boolean;
}) {
  const handlePress = React.useCallback(() => {
    if (disabled || !onClick) return;
    if (!deferHeavy) {
      onClick();
      return;
    }
    requestAnimationFrame(() => {
      React.startTransition(() => {
        onClick();
      });
    });
  }, [deferHeavy, disabled, onClick]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handlePress}
      title={title}
      aria-pressed={!!active}
      className={clsx(
        'inline-flex items-center justify-center border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 select-none',
        small ? 'px-2 py-[3px] text-[11px]' : 'px-3 py-1 text-xs',
        disabled
          ? 'opacity-40 cursor-not-allowed bg-neutral-900/40 border-neutral-700 text-neutral-400'
          : active
          ? 'cursor-pointer bg-indigo-600 border-indigo-300 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset]'
          : controlButtonClass + ' hover:bg-neutral-800',
        className
      )}
    >
      {children}
    </button>
  );
});
Chip.displayName = 'Chip';

export type SliderRowProps = {
  label: string;
  value?: number;
  min: number;
  max: number;
  step?: number;
  precision?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
};

function countDecimals(n: number) {
  if (!Number.isFinite(n)) return 0;
  const text = String(n);
  const idx = text.indexOf(".");
  return idx === -1 ? 0 : text.length - idx - 1;
}

function formatNumericValue(value: number, digits: number) {
  if (!Number.isFinite(value)) return "0";
  if (digits <= 0) return String(Math.round(value));
  return value.toFixed(digits);
}

export type InlineSliderInputProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  precision?: number;
  displayScale?: number;
  suffix?: string;
  rangeClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerCancel?: () => void;
  onCommit?: (v: number) => void;
};

export function InlineSliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
  precision,
  displayScale = 1,
  suffix,
  rangeClassName,
  inputClassName,
  labelClassName,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onCommit,
}: InlineSliderInputProps) {
  const safeValue = Number.isFinite(value) ? value : min;
  const clamp = React.useCallback(
    (n: number) => Math.min(max, Math.max(min, n)),
    [max, min]
  );
  const inputDigits = precision ?? countDecimals(step * displayScale);
  const formattedValue = formatNumericValue(safeValue * displayScale, inputDigits);
  const [draftValue, setDraftValue] = React.useState(formattedValue);
  const [isEditing, setIsEditing] = React.useState(false);
  const rangeRef = React.useRef<HTMLInputElement | null>(null);
  const rangeFrameRef = React.useRef<number | null>(null);
  const rangeTimerRef = React.useRef<number | null>(null);
  const pendingRangeRef = React.useRef<number | null>(null);
  const latestRangeValueRef = React.useRef(safeValue);
  const rangeDraggingRef = React.useRef(false);
  const rangeDragTokenRef = React.useRef(0);
  const lastLiveRangeAtRef = React.useRef(0);
  const lastAppliedRangeValueRef = React.useRef<number | null>(safeValue);
  const onChangeRef = React.useRef(onChange);
  const onCommitRef = React.useRef(onCommit);

  React.useEffect(() => {
    if (!isEditing && !rangeDraggingRef.current) {
      setDraftValue(formattedValue);
    }
  }, [formattedValue, isEditing]);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  React.useEffect(() => {
    latestRangeValueRef.current = safeValue;
    if (!rangeDraggingRef.current) {
      lastAppliedRangeValueRef.current = safeValue;
      if (rangeRef.current) {
        rangeRef.current.value = String(safeValue);
      }
    }
  }, [safeValue]);

  React.useEffect(() => {
    return () => {
      if (rangeFrameRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(rangeFrameRef.current);
        rangeFrameRef.current = null;
      }
      if (rangeTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(rangeTimerRef.current);
        rangeTimerRef.current = null;
      }
      if (rangeDraggingRef.current) {
        const next = pendingRangeRef.current;
        pendingRangeRef.current = null;
        if (next != null) {
          lastAppliedRangeValueRef.current = next;
          onChangeRef.current(next);
        }
        rangeDraggingRef.current = false;
        rangeDragTokenRef.current += 1;
        endSliderDragGateSoon();
      }
    };
  }, []);

  const scheduleLiveRangeChange = React.useCallback(() => {
    if (rangeFrameRef.current !== null || rangeTimerRef.current !== null) return;
    if (typeof window === "undefined") {
      const next = pendingRangeRef.current;
      if (next != null && !sliderValuesEqual(lastAppliedRangeValueRef.current, next)) {
        lastAppliedRangeValueRef.current = next;
        onChangeRef.current(next);
      }
      return;
    }
    const dragToken = rangeDragTokenRef.current;
    const run = () => {
      rangeTimerRef.current = null;
      rangeFrameRef.current = window.requestAnimationFrame(() => {
        rangeFrameRef.current = null;
        const next = pendingRangeRef.current;
        if (next == null) return;
        if (!rangeDraggingRef.current || dragToken !== rangeDragTokenRef.current) return;
        if (sliderValuesEqual(lastAppliedRangeValueRef.current, next)) return;
        lastLiveRangeAtRef.current = performance.now();
        lastAppliedRangeValueRef.current = next;
        onChangeRef.current(next);
      });
    };
    const now = performance.now();
    const wait = Math.max(0, SLIDER_LIVE_UPDATE_MS - (now - lastLiveRangeAtRef.current));
    if (wait > 0) {
      rangeTimerRef.current = window.setTimeout(run, wait);
      return;
    }
    run();
  }, []);

  const commitDraft = React.useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
        setDraftValue(formattedValue);
        return;
      }
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) {
        setDraftValue(formattedValue);
        return;
      }
      const next = clamp(parsed / displayScale);
      onChangeRef.current(next);
      onCommitRef.current?.(next);
      setDraftValue(formatNumericValue(next * displayScale, inputDigits));
    },
    [clamp, displayScale, formattedValue, inputDigits]
  );

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftValue(e.target.value);
  };

  const handleRangeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = clamp(Number(e.target.value));
      latestRangeValueRef.current = next;
      pendingRangeRef.current = next;
      if (rangeDraggingRef.current) {
        scheduleLiveRangeChange();
      } else {
        pendingRangeRef.current = null;
        if (!isEditing) {
          setDraftValue(formatNumericValue(next * displayScale, inputDigits));
        }
        lastAppliedRangeValueRef.current = next;
        onChangeRef.current(next);
      }
    },
    [clamp, displayScale, inputDigits, isEditing, scheduleLiveRangeChange]
  );

  const flushPendingRangeSoon = React.useCallback(() => {
    if (rangeFrameRef.current !== null && typeof window !== "undefined") {
      window.cancelAnimationFrame(rangeFrameRef.current);
      rangeFrameRef.current = null;
    }
    if (rangeTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(rangeTimerRef.current);
      rangeTimerRef.current = null;
    }
    const next = pendingRangeRef.current;
    pendingRangeRef.current = null;
    if (next == null) return null;
    if (!sliderValuesEqual(lastAppliedRangeValueRef.current, next)) {
      lastAppliedRangeValueRef.current = next;
      onChangeRef.current(next);
    }
    if (!isEditing) {
      setDraftValue(formatNumericValue(next * displayScale, inputDigits));
    }
    return next;
  }, [displayScale, inputDigits, isEditing]);

  const handleRangePointerDown = React.useCallback((e?: React.PointerEvent<HTMLInputElement>) => {
    e?.stopPropagation();
    if (!rangeDraggingRef.current) {
      if (e?.currentTarget && typeof e.pointerId === "number") {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
      }
      rangeDragTokenRef.current += 1;
      beginSliderDragGate();
    }
    rangeDraggingRef.current = true;
    onPointerDown?.();
  }, [onPointerDown]);

  const handleRangePointerUp = React.useCallback((e?: React.PointerEvent<HTMLInputElement>) => {
    e?.stopPropagation();
    if (!rangeDraggingRef.current) return;
    if (e?.currentTarget) {
      const next = clamp(Number(e.currentTarget.value));
      latestRangeValueRef.current = next;
      pendingRangeRef.current = next;
    }
    rangeDraggingRef.current = false;
    rangeDragTokenRef.current += 1;
    const committed = flushPendingRangeSoon();
    if (committed != null) onCommitRef.current?.(committed);
    onPointerUp?.();
    endSliderDragGateSoon();
    if (e?.currentTarget && typeof e.pointerId === "number") {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  }, [clamp, flushPendingRangeSoon, onPointerUp]);

  const handleRangePointerCancel = React.useCallback((e?: React.PointerEvent<HTMLInputElement>) => {
    e?.stopPropagation();
    if (!rangeDraggingRef.current) return;
    if (e?.currentTarget) {
      const next = clamp(Number(e.currentTarget.value));
      latestRangeValueRef.current = next;
      pendingRangeRef.current = next;
    }
    rangeDraggingRef.current = false;
    rangeDragTokenRef.current += 1;
    const committed = flushPendingRangeSoon();
    if (committed != null) onCommitRef.current?.(committed);
    onPointerCancel?.();
    endSliderDragGateSoon();
    if (e?.currentTarget && typeof e.pointerId === "number") {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  }, [clamp, flushPendingRangeSoon, onPointerCancel]);

  return (
    <div className="min-w-0 w-full">
      <div className={`mb-1 flex min-w-0 items-center justify-between ${controlLabelClass} ${labelClassName || ""}`}>
        <span className="block min-w-0 truncate">{label}</span>
      </div>
      <div className="flex min-w-0 w-full items-center gap-1">
        <input
          ref={rangeRef}
          type="range"
          min={min}
          max={max}
          step={step}
          defaultValue={latestRangeValueRef.current}
          onChange={handleRangeChange}
          className={clsx("min-w-0 flex-1", rangeClassName || controlRangeClass)}
          style={{ touchAction: "none" }}
          onPointerUp={handleRangePointerUp}
          onPointerCancel={handleRangePointerCancel}
          onPointerDownCapture={handleRangePointerDown}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          disabled={disabled}
        />
        <div className="ml-0.5 flex shrink-0 items-center justify-end gap-0.5 max-w-[50px] sm:ml-1 sm:max-w-[64px]">
          <input
            type="number"
            min={min * displayScale}
            max={max * displayScale}
            step={step * displayScale}
            value={draftValue}
            onChange={handleNumberChange}
            onFocus={() => setIsEditing(true)}
            onBlur={(e) => {
              setIsEditing(false);
              commitDraft(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
              if (e.key === "Escape") {
                setIsEditing(false);
                setDraftValue(formattedValue);
                e.currentTarget.blur();
              }
            }}
            disabled={disabled}
            className={
              inputClassName ||
              `h-[26px] w-[44px] min-w-0 rounded-md px-0.5 ${controlInputClass} origin-right scale-[0.74] text-right font-medium tracking-[-0.02em] text-[16px] sm:h-auto sm:w-[48px] sm:scale-100 sm:px-1.5 sm:text-[11px] sm:font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`
            }
            inputMode="decimal"
          />
          {suffix ? <span className="shrink-0 text-[7px] text-white font-semibold sm:text-[8px]">{suffix}</span> : null}
        </div>
      </div>
    </div>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 0.05,
  precision,
  disabled = false,
  onChange,
  onCommit,
}: SliderRowProps) {
  const safeValue = Number.isFinite(value) ? (value as number) : min;

  return (
    <div
      className="select-none py-2"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <InlineSliderInput
        label={label}
        value={safeValue}
        min={min}
        max={max}
        step={step}
        precision={precision}
        disabled={disabled}
        onChange={onChange}
        onCommit={onCommit}
        rangeClassName={`flex-1 h-1 rounded-lg appearance-none cursor-pointer transition-colors ${
          disabled
            ? "bg-neutral-800 accent-neutral-600"
            : "bg-neutral-700 accent-indigo-500 hover:accent-indigo-400"
        }`}
      />
    </div>
  );
}

type ColorDotProps = {
  value: string;
  onChange: (hex: string) => void;
  title?: string;
  disabled?: boolean;
  allowNone?: boolean;
  noneTitle?: string;
};

function normalizeColorInputValue(value: string) {
  const safe = String(value || "").trim().toLowerCase();
  if (!safe || safe === "transparent" || safe === "none") return "#ffffff";
  return safe;
}

export const ColorDot: React.FC<ColorDotProps> = ({
  value,
  onChange,
  title,
  disabled,
  allowNone = false,
  noneTitle,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  const isNone = String(value || "").trim().toLowerCase() === "transparent";

  return (
    <span className="inline-flex items-center gap-1">
      {allowNone ? (
        <button
          type="button"
          title={noneTitle || "No fill"}
          aria-label={noneTitle || "No fill"}
          disabled={disabled}
          onClick={() => onChange("transparent")}
          className={clsx(
            "relative inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
            disabled
              ? "cursor-not-allowed opacity-50 border-white/20"
              : isNone
              ? "border-cyan-300/70 bg-cyan-400/10"
              : "border-white/30 bg-transparent hover:border-white/50"
          )}
        >
          <span className="absolute h-[1px] w-3 rotate-[-45deg] bg-white/80" />
        </button>
      ) : null}
      <span
        className="inline-flex items-center"
        style={{ position: 'relative', width: 16, height: 16 }}
      >
      <span
        title={title || 'Pick color'}
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.3)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3) inset',
          background: isNone ? 'transparent' : value || '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-block',
        }}
        className="align-middle"
      />
      <input
        type="color"
        value={normalizeColorInputValue(value)}
        onChange={handleChange}
        disabled={disabled}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        aria-label={title || 'Pick color'}
      />
      </span>
    </span>
  );
};

export const Collapsible: React.FC<{
   title: string;
   storageKey: string;
   defaultOpen?: boolean;
   isOpen?: boolean;
   onToggle?: () => void;
   deferToggle?: boolean;
   right?: React.ReactNode;
   children: React.ReactNode;
   titleClassName?: string;
   panelClassName?: string;
 }> = ({
   title,
   storageKey,
   defaultOpen = false,
   isOpen,
   onToggle,
   deferToggle = true,
   right,
   children,
   titleClassName,
   panelClassName,
 }) => {
   const STORAGE_VERSION = 'v1';
   const key = `${storageKey}:${STORAGE_VERSION}`;
 
 const [internalOpen, setInternalOpen] = React.useState<boolean>(!!defaultOpen);
 const mountedRef = React.useRef(false);
 
   const isControlled = typeof isOpen === 'boolean';
   const open = isControlled ? isOpen : internalOpen;
 
 React.useEffect(() => {
   mountedRef.current = true;
   if (isControlled) return;
 
     try {
       const v = localStorage.getItem(key);
       if (v === '1') setInternalOpen(true);
       if (v === '0') setInternalOpen(false);
     } catch {}
   return () => {
     mountedRef.current = false;
   };
 }, [key, isControlled]);

 
   React.useEffect(() => {
     if (!mountedRef.current) return;
     try {
       localStorage.setItem(key, open ? '1' : '0');
     } catch {}
   }, [open, key]);
 
   const commitToggle = React.useCallback(() => {
     if (onToggle) onToggle();
     else setInternalOpen((o) => !o);
   }, [onToggle]);

   const handleToggle = React.useCallback(() => {
     if (!deferToggle) {
       commitToggle();
       return;
     }
     requestAnimationFrame(() => {
       React.startTransition(() => {
         commitToggle();
       });
     });
   }, [commitToggle, deferToggle]);
 
   return (
    <section className={clsx(panelClass, panelClassName)}>
      <div className="w-full flex items-center gap-2 min-h-8">
        <div className="flex-1">
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={open}
            className="w-full h-8 flex items-center gap-2 px-2 py-1 hover:bg-neutral-800/40 group focus:outline-none"
          >
             <span
               className={clsx(
                 'inline-block transition-transform text-neutral-300 group-hover:text-white',
                 open ? 'rotate-90' : 'rotate-0'
               )}
             >
               ▸
             </span>
             <span
               className={clsx(
                 'text-xs uppercase tracking-wider group-hover:text-white',
                 titleClassName ?? 'text-neutral-300'
               )}
             >
               {title}
             </span>
           </button>
         </div>
        {right && (
          <div
            className="ml-auto flex items-center gap-2 min-h-8"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {right}
          </div>
        )}
      </div>
 
       <AnimatePresence initial={false}>
         {open && (
           <motion.div
             key="content"
             initial={{ opacity: 0, height: 0, y: -4 }}
             animate={{ opacity: 1, height: 'auto', y: 0 }}
             exit={{ opacity: 0, height: 0, y: -4 }}
             transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.6 }}
             style={{ overflow: 'hidden', willChange: 'height, opacity, transform' }}
             className="mt-3 px-2 pb-2"
           >
             {children}
           </motion.div>
         )}
       </AnimatePresence>
     </section>
   );
 };
