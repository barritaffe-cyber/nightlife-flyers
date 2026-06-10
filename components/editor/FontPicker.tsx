'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { groupFontsByUseCase } from '../../lib/fonts';

const controlLabelClass = 'text-[11px] uppercase tracking-[0.12em] text-neutral-400';
const controlFieldClass = 'border border-neutral-700 bg-[#17171b] text-white';

export function FontPicker({
  value,
  options,
  onChange,
  label,
  disabled,
  className,
  buttonClassName,
  menuClassName,
  sample = 'Aa Bb 123',
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
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
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  const groupedOptions = React.useMemo(
    () => groupFontsByUseCase(options),
    [options]
  );
  const selectedGroup = React.useMemo(
    () => groupedOptions.find((group) => group.id === selectedGroupId) ?? null,
    [groupedOptions, selectedGroupId]
  );

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
      setSelectedGroupId(null);
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

  React.useEffect(() => {
    if (!selectedGroupId) return;
    if (!groupedOptions.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(null);
    }
  }, [groupedOptions, selectedGroupId]);

  return (
    <div
      className={`relative ${className ?? ''}`}
      ref={wrapRef}
      data-mobile-float-lock="true"
      data-floating-controls="fontpicker"
    >
      {label && <div className={`${controlLabelClass} mb-1`}>{label}</div>}
      <button
        type="button"
        ref={btnRef}
        disabled={disabled}
        onClick={() => {
          setSelectedGroupId(null);
          setOpen((v) => !v);
        }}
        className={`w-full px-2 py-2 text-left flex items-center justify-between gap-2 disabled:opacity-60 ${controlFieldClass} ${buttonClassName ?? ''}`}
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
            data-mobile-float-lock="true"
            data-floating-controls="fontpicker"
            className={`fixed z-[9999] overflow-auto border border-neutral-700 bg-[#0f0f12] shadow-xl pb-2 ${menuClassName ?? ''}`}
            style={{
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: menuPos.maxHeight,
              scrollPaddingBottom: 8,
            }}
          >
            {selectedGroup ? (
              <div>
                <div className="sticky top-0 z-10 border-b border-neutral-800 bg-[#121217] px-2 py-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGroupId(null)}
                    className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200 hover:text-cyan-100"
                  >
                    Back to categories
                  </button>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
                    {selectedGroup.label}
                  </div>
                  <div className="text-[10px] leading-4 text-neutral-500">
                    {selectedGroup.hint}
                  </div>
                </div>
                {selectedGroup.fonts.map((f) => {
                  const active = f === value;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        onChange(f);
                        setOpen(false);
                      }}
                      className={`w-full border-b border-neutral-800 px-2 py-2 text-left last:border-b-0 hover:bg-neutral-800/80 ${
                        active ? 'bg-cyan-400/10 ring-1 ring-inset ring-cyan-300/25' : ''
                      }`}
                    >
                      <div className="text-[12px] text-white" style={{ fontFamily: f }}>
                        {f}
                      </div>
                      <div className="text-[11px] text-neutral-400" style={{ fontFamily: f }}>
                        {sample}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="sticky top-0 z-10 border-b border-neutral-800 bg-[#121217] px-2 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
                    Choose Font Category
                  </div>
                  <div className="text-[10px] leading-4 text-neutral-500">
                    Pick the flyer job first, then choose a matching font.
                  </div>
                </div>
                {groupedOptions.map((group) => {
                  const containsCurrent = group.fonts.includes(value);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`w-full border-b border-neutral-800 px-2 py-2 text-left last:border-b-0 hover:bg-neutral-800/80 ${
                        containsCurrent ? 'bg-cyan-400/10 ring-1 ring-inset ring-cyan-300/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[12px] font-semibold text-white">
                            {group.label}
                          </div>
                          <div className="text-[11px] leading-4 text-neutral-400">
                            {group.hint}
                          </div>
                        </div>
                        <div className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                          {group.fonts.length}
                        </div>
                      </div>
                      {containsCurrent && (
                        <div className="mt-1 text-[10px] text-cyan-200">
                          Current: <span style={{ fontFamily: value }}>{value}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
