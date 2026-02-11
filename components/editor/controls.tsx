 'use client';
 
 import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
 
 function clsx(...a: (string | false | null | undefined)[]) {
   return a.filter(Boolean).join(' ');
 }
 
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
   const clamp = (n: number) => Math.min(max, Math.max(min, n));
 
   const onRange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const n = clamp(parseFloat(e.target.value));
     setValue(n);
   };
 
   const onNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
     const raw = e.target.value.trim();
     if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return;
     const n = clamp(parseFloat(raw));
     if (!Number.isNaN(n)) setValue(n);
   };
 
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
         <label className="text-[11px] text-neutral-300">{label}</label>
       )}
 
       <div className="flex items-center gap-2 w-full">
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
          className="nf-range flex-1 h-2 appearance-none bg-transparent"
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
      {label && <div className="text-[11px] text-neutral-400 mb-1">{label}</div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded px-2 py-2 bg-[#17171b] text-white border border-neutral-700 text-left flex items-center justify-between gap-2 disabled:opacity-60"
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
          className="absolute z-[60] mt-1 w-full max-h-[60vh] overflow-auto rounded border border-neutral-700 bg-[#0f0f12] shadow-xl pb-2"
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

export function Chip({
   active,
   onClick,
   children,
   small,
   disabled,
   title,
   className,
 }: {
   active?: boolean;
   onClick?: () => void;
   children: React.ReactNode;
   small?: boolean;
   disabled?: boolean;
   title?: string;
   className?: string;
 }) {
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
         'inline-flex items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 select-none',
         small ? 'px-2 py-[3px] text-[11px]' : 'px-3 py-1 text-xs',
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
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
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
 
   const handleToggle = () => {
     if (onToggle) onToggle();
     else setInternalOpen((o) => !o);
   };
 
   return (
    <section className={clsx(panelClass, panelClassName)}>
      <div className="w-full flex items-center gap-2 min-h-8">
        <div className="flex-1">
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={open}
            className="w-full h-8 flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-800/40 group focus:outline-none"
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
