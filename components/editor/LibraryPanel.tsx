'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import { useFlyerState, type Format } from '../../app/state/flyerState';
import { Collapsible, ColorDot, SliderRow } from './controls';

type NightlifeGraphic = {
  id: string;
  label: string;
  paths: ReadonlyArray<string>;
};

type GraphicSticker = {
  id: string;
  name: string;
  src: string;
};

type FlareItem = {
  id: string;
  name: string;
  src: string;
};

type LibraryPanelProps = {
  format: Format;
  selectedEmojiId: string | null;
  setSelectedEmojiId: (id: string | null) => void;
  IS_iconSlotPickerRef: React.RefObject<HTMLInputElement | null>;
  IS_onIconSlotFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  IS_iconSlots: ReadonlyArray<string | null>;
  IS_triggerIconSlotUpload: (index: number) => void;
  IS_placeIconFromSlot: (index: number) => void;
  IS_clearIconSlot: (index: number) => void;
  nightlifeGraphics: ReadonlyArray<NightlifeGraphic>;
  graphicStickers: ReadonlyArray<GraphicSticker>;
  flareLibrary: ReadonlyArray<FlareItem>;
  onPlaceToCanvas?: () => void;
};

const LibraryPanel: React.FC<LibraryPanelProps> = React.memo(
  ({
    format,
    selectedEmojiId,
    setSelectedEmojiId,
    IS_iconSlotPickerRef,
    IS_onIconSlotFile,
    IS_iconSlots,
    IS_triggerIconSlotUpload,
    IS_placeIconFromSlot,
    IS_clearIconSlot,
    nightlifeGraphics,
    graphicStickers,
    flareLibrary,
    onPlaceToCanvas,
  }) => {
    const selectedPanel = useFlyerState((s) => s.selectedPanel);
    const setSelectedPanel = useFlyerState((s) => s.setSelectedPanel);
    const setMoveTarget = useFlyerState((s) => s.setMoveTarget);
    const portraits = useFlyerState((s) => s.portraits);
    const emojis = useFlyerState((s) => s.emojis);
    const selectedPortraitId = useFlyerState((s) => s.selectedPortraitId);
    const updatePortrait = useFlyerState((s) => s.updatePortrait);
    const removePortrait = useFlyerState((s) => s.removePortrait);
    const addPortrait = useFlyerState((s) => s.addPortrait);
    const setSelectedPortraitId = useFlyerState((s) => s.setSelectedPortraitId);
    const updateEmoji = useFlyerState((s) => s.updateEmoji);
    const removeEmoji = useFlyerState((s) => s.removeEmoji);

    return (
      <div className="mt-3" id="library-panel" data-tour="library">
        <div
          className={
            selectedPanel === 'icons'
              ? 'relative rounded-xl border border-blue-400'
              : 'relative rounded-xl border border-neutral-700 transition'
          }
        >
          <Collapsible
            title="Library"
            storageKey="p:icons"
            isOpen={selectedPanel === 'icons'}
            onToggle={() => {
              const next = selectedPanel === 'icons' ? null : 'icons';
              setSelectedPanel(next);
              setMoveTarget(next ? 'icon' : null);
            }}
            titleClassName={
              selectedPanel === 'icons'
                ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]'
                : ''
            }
          >
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

            {(() => {
              let list: any[] = [];
              if (Array.isArray(emojis)) {
                list = emojis;
              } else if (emojis && typeof emojis === 'object') {
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
                      {sel.id.split('_')[1] || 'emoji'}
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
                        updateEmoji(format, sel.id, {
                          locked: !locked,
                        });
                      }}
                    >
                      {locked ? 'Unlock' : 'Lock'}
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
                        updateEmoji(format, sel.id, {
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
                        updateEmoji(format, sel.id, {
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
                        updateEmoji(format, sel.id, {
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
                      removeEmoji(format, sel.id);
                      setSelectedEmojiId(null);
                    }}
                  >
                    <span className="font-bold">✕</span> Delete Emoji
                  </button>
                </div>
              );
            })()}

            <div className="mt-4 border-t border-neutral-800 pt-3">
              <div className="text-[12px] text-neutral-300 mb-2 font-bold">
                Nightlife Graphics
              </div>
              <div className="grid grid-cols-2 gap-2">
                {nightlifeGraphics.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="h-10 rounded-md bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all flex items-center gap-2 px-2 group relative overflow-hidden"
                    title={`Add ${item.label}`}
                    onClick={() => {
                      const svgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${item.paths
                        .map((d) => `<path d="${d}"/>`)
                        .join('')}</svg>`;
                      const svg = svgTemplate.replace('{{COLOR}}', '#ffffff');
                      const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
                      const url = `data:image/svg+xml;base64,${svgBase64}`;
                      const id = `sticker_${item.id}_${Date.now()}_${Math.random()
                        .toString(36)
                        .slice(2, 7)}`;
                      addPortrait(format, {
                        id,
                        url,
                        x: 50,
                        y: 50,
                        scale: 0.6,
                        locked: false,
                        svgTemplate,
                        iconColor: '#ffffff',
                        label: item.label,
                        showLabel: true,
                        isSticker: true,
                      } as any);
                      setSelectedPortraitId(id);
                      setSelectedPanel('icons');
                      setMoveTarget('icon');
                      onPlaceToCanvas?.();
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

            <div className="mt-4 border-t border-neutral-800 pt-3">
              <div className="text-[12px] text-neutral-300 mb-2 font-bold">Graphics</div>
              <div
                className="grid grid-cols-4 gap-2"
                style={{
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {graphicStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    className="aspect-square rounded-md bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all flex items-center justify-center p-2 group relative overflow-hidden"
                    title={`Add ${sticker.name}`}
                    onClick={() => {
                      const id = `sticker_${sticker.id}_${Date.now()}`;
                      addPortrait(format, {
                        id,
                        url: sticker.src,
                        x: 50,
                        y: 50,
                        scale: 0.5,
                        locked: false,
                        isSticker: true,
                      } as any);
                      setSelectedPortraitId(id);
                      setSelectedPanel('icons');
                      setMoveTarget('icon');
                      onPlaceToCanvas?.();
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

            {(() => {
              const list = portraits[format] || [];
              const stickers = list.filter((p: any) => !!p?.isSticker);

              if (!stickers.length) return null;

              const currentSel = list.find((p: any) => p.id === selectedPortraitId);
              const selectedIsSticker = !!(currentSel as any)?.isSticker;

              const activeStickerId = selectedIsSticker ? selectedPortraitId : stickers[0].id;
              const sel = stickers.find((p: any) => p.id === activeStickerId) || stickers[0];

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
                    <span className="text-[10px] opacity-50 font-mono">{stickers.length} total</span>
                  </div>

                  {typeof (sel as any).svgTemplate === 'string' && (
                    <div className="mb-3 flex items-center gap-2 text-[11px] text-neutral-300">
                      <span className="opacity-80">Icon Color</span>
                      <ColorDot
                        value={(sel as any).iconColor || '#ffffff'}
                        onChange={(value) => {
                          const template = String((sel as any).svgTemplate || '');
                          const nextSvg = template.replace('{{COLOR}}', value);
                          const svgBase64 = btoa(unescape(encodeURIComponent(nextSvg)));
                          const nextUrl = `data:image/svg+xml;base64,${svgBase64}`;
                          updatePortrait(format, sel.id, {
                            url: nextUrl,
                            iconColor: value,
                          });
                        }}
                      />
                    </div>
                  )}
                  {(sel as any).showLabel && (
                    <div className="mb-3">
                      <label className="block text-[11px] text-neutral-300 mb-1">Label</label>
                      <input
                        value={String((sel as any).label ?? '')}
                        onChange={(e) =>
                          updatePortrait(format, sel.id, {
                            label: e.target.value,
                          })
                        }
                        className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-2 py-1.5 text-[11px] text-white"
                        placeholder="Label"
                      />
                    </div>
                  )}

                  <select
                    className="w-full mb-3 text-[11px] bg-neutral-900 border border-neutral-700 rounded-md py-2 px-2 text-white outline-none"
                    value={sel.id}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedPortraitId(id);
                      setSelectedPanel('icons');
                      setMoveTarget('icon');
                    }}
                  >
                    {stickers.map((p: any, idx: number) => (
                      <option key={p.id} value={p.id}>
                        {(p.id.split('_')[1] || 'graphic')} #{idx + 1}
                        {p.locked ? ' (locked)' : ''}
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
                        updatePortrait(format, sel.id, {
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
                        updatePortrait(format, sel.id, {
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
                        updatePortrait(format, sel.id, {
                          locked: !locked,
                        })
                      }
                    >
                      {locked ? 'Unlock' : 'Lock'}
                    </button>

                    <button
                      className="text-[11px] bg-red-900/30 border border-red-700 rounded-md py-2"
                      onClick={() => {
                        removePortrait(format, sel.id);
                        setSelectedPortraitId(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="mt-4 border-t border-neutral-800 pt-3">
              <div className="text-[12px] text-neutral-300 mb-2 font-bold">
                Flares &amp; Light Leaks
              </div>
              <div className="grid grid-cols-4 gap-2">
                {flareLibrary.map((flare) => (
                  <button
                    key={flare.id}
                    type="button"
                    className="aspect-square rounded-md bg-black border border-neutral-800 hover:border-neutral-600 transition-all flex items-center justify-center p-1 group relative overflow-hidden"
                    title={`Add ${flare.name}`}
                    onClick={() => {
                      const id = `flare_${flare.id}_${Date.now()}_${Math.random()
                        .toString(36)
                        .slice(2, 7)}`;

                      addPortrait(format, {
                        id,
                        url: flare.src,
                        x: 50,
                        y: 50,
                        scale: 0.8,
                        locked: false,
                        blendMode: 'screen',
                        opacity: 0.9,
                        rotation: 0,
                        isFlare: true,
                      } as any);

                      setSelectedPortraitId(id);
                      setSelectedPanel('icons');
                      setMoveTarget('icon');
                      onPlaceToCanvas?.();
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

            {(() => {
              const list = portraits[format] || [];
              const flares = list.filter((p: any) => !!p?.isFlare);

              if (!flares.length) return null;

              const currentSel = list.find((p: any) => p.id === selectedPortraitId);
              const selectedIsFlare = !!(currentSel as any)?.isFlare;

              const activeFlareId = selectedIsFlare ? selectedPortraitId : flares[0].id;
              const sel = flares.find((p: any) => p.id === activeFlareId) || flares[0];

              const locked = !!sel.locked;

              const update = (patch: any) => updatePortrait(format, sel.id, patch);

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

                  <select
                    className="w-full mb-3 text-[11px] bg-neutral-900 border border-neutral-700 rounded-md py-2 px-2 text-white outline-none"
                    value={sel.id}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedPortraitId(id);
                      setSelectedPanel('icons');
                      setMoveTarget('icon');
                    }}
                  >
                    {flares.map((p: any, idx: number) => (
                      <option key={p.id} value={p.id}>
                        {(p.id.split('_')[1] || 'flare')} #{idx + 1}
                        {p.locked ? ' (locked)' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    className="w-full mb-3 text-[11px] bg-neutral-800 border border-neutral-600 rounded-md py-2"
                    onClick={() => update({ locked: !locked })}
                  >
                    {locked ? 'Unlock' : 'Lock'}
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
                      setSelectedPortraitId(null);
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
    );
  }
);

LibraryPanel.displayName = 'LibraryPanel';

export default LibraryPanel;
