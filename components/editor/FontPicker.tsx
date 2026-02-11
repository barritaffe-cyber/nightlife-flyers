 'use client';

 import * as React from 'react';
 import { createPortal } from 'react-dom';

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
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = React.useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  React.useEffect(() => {
    const handle = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current) return;
      const t = e.target as Node;
      if (!wrapRef.current.contains(t) && !menuRef.current?.contains(t)) {
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

  React.useEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const preferAbove = spaceBelow < 240 && spaceAbove > spaceBelow;
      const available = preferAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(160, Math.min(420, available));
      const top = preferAbove
        ? Math.max(8, rect.top - maxHeight - gap)
        : Math.max(8, rect.bottom + gap);
      setMenuPos({
        top,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  return (
    <div className={`relative ${className ?? ''}`} ref={wrapRef}>
      {label && <div className="text-[11px] text-neutral-400 mb-1">{label}</div>}
      <button
        type="button"
        ref={btnRef}
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
      {open && menuPos && typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] overflow-auto rounded border border-neutral-700 bg-[#0f0f12] shadow-xl pb-2"
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: menuPos.maxHeight,
              scrollPaddingBottom: 8,
            }}
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
          </div>,
          document.body
        )}
    </div>
  );
}
