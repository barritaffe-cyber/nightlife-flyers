 'use client';
 
 import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
 
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

  React.useEffect(() => {
    if (!isEditing) {
      setDraftValue(formattedValue);
    }
  }, [formattedValue, isEditing]);
 
   const onRange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const n = clamp(parseFloat(e.target.value));
     setValue(n);
   };
 
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
          type="range"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value as number) ? Number(value) : Number(min ?? 0)}
          onChange={onRange}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerDownCapture={(e) => e.stopPropagation()}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={disabled}
          aria-label={label}
          style={{ touchAction: 'pan-x' }}
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

  React.useEffect(() => {
    if (!isEditing) {
      setDraftValue(formattedValue);
    }
  }, [formattedValue, isEditing]);

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
      onChange(next);
      setDraftValue(formatNumericValue(next * displayScale, inputDigits));
    },
    [clamp, displayScale, formattedValue, inputDigits, onChange]
  );

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftValue(e.target.value);
  };

  return (
    <div className="min-w-0 w-full">
      <div className={`mb-1 flex min-w-0 items-center justify-between ${controlLabelClass} ${labelClassName || ""}`}>
        <span className="block min-w-0 truncate">{label}</span>
      </div>
      <div className="flex min-w-0 w-full items-center gap-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className={clsx("min-w-0 flex-1", rangeClassName || controlRangeClass)}
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          disabled={disabled}
        />
        <div className="ml-1 flex shrink-0 items-center justify-end gap-0.5 max-w-[64px]">
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
              `w-[40px] min-w-0 ${controlInputClass} text-right font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`
            }
          />
          {suffix ? <span className="shrink-0 text-[8px] text-white font-semibold">{suffix}</span> : null}
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
}: SliderRowProps) {
  const safeValue = Number.isFinite(value) ? (value as number) : min;

  return (
    <div
      className="select-none py-2"
      onMouseDownCapture={(e) => e.stopPropagation()}
      onPointerDownCapture={(e) => e.stopPropagation()}
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
};

export const ColorDot: React.FC<ColorDotProps> = ({ value, onChange, title, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
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
          background: value || '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-block',
        }}
        className="align-middle"
      />
      <input
        type="color"
        value={value}
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
