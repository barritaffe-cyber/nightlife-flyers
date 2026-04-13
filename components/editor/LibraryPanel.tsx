'use client';
/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import { useFlyerState, type Format } from '../../app/state/flyerState';
import {
  Collapsible,
  ColorDot,
  InlineSliderInput,
  SliderRow,
  editorEmptyStateClass,
  editorUploadActionClass,
  editorUploadClearClass,
  editorUploadHolderClass,
  editorUploadPlaceClass,
  editorUploadPreviewClass,
} from './controls';
import {
  type TextSeparatorGraphic,
  buildSeparatorSvgDataUrl,
  buildSeparatorSvgMarkup,
} from '../../lib/textSeparators';
import {
  SHAPE_GRAPHICS,
  buildShapeSvgDataUrl,
  buildShapeSvgMarkup,
} from '../../lib/shapeGraphics';

const railCardClass = 'panel mt-4 border border-neutral-800 bg-neutral-950/40 p-3 space-y-3';
const railHeaderClass = 'flex items-center justify-between gap-2';
const railTitleClass = 'text-[11px] uppercase tracking-[0.12em] text-neutral-200';
const railMetaClass = 'text-[10px] uppercase tracking-[0.12em] text-neutral-500';
const railFieldClass = 'w-full border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-[11px] text-white outline-none';
const railActionClass = 'border border-neutral-700 bg-neutral-900/60 px-2 py-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-200 transition hover:bg-neutral-900 disabled:opacity-60';
const railActionTallClass = 'border border-neutral-700 bg-neutral-800 px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-neutral-200 transition hover:bg-neutral-700';
const railDangerClass = 'border border-red-800 bg-red-950/30 px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-red-200 transition hover:bg-red-950/45';
const librarySectionClass = 'border-t border-neutral-800 pt-5';

type LibrarySectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const LibrarySection: React.FC<LibrarySectionProps> = ({ title, open, onToggle, children }) => (
  <div className={librarySectionClass}>
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 py-2 text-left"
      aria-expanded={open}
    >
      <span className="text-[12px] font-semibold text-neutral-300">{title}</span>
      <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">{open ? 'Hide' : 'Show'}</span>
    </button>
    {open ? <div className="mt-4">{children}</div> : null}
  </div>
);

type NightlifeGraphic = {
  id: string;
  label: string;
  paths: ReadonlyArray<string>;
  strokeWidth?: number;
  renderMode?: "stroke" | "fill";
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
  tintMode?: "hue" | "colorize";
};

type LibraryPanelProps = {
  format: Format;
  selectedEmojiId: string | null;
  setSelectedEmojiId: (id: string | null) => void;
  liveEmojiPos?: { id: string; x: number; y: number } | null;
  IS_iconSlotPickerRef: React.RefObject<HTMLInputElement | null>;
  IS_onIconSlotFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  IS_iconSlots: ReadonlyArray<string | null>;
  IS_triggerIconSlotUpload: (index: number) => void;
  IS_placeIconFromSlot: (index: number) => void;
  IS_clearIconSlot: (index: number) => void;
  socialMediaStickers: ReadonlyArray<GraphicSticker>;
  nightlifeGraphics: ReadonlyArray<NightlifeGraphic>;
  textSeparators: ReadonlyArray<TextSeparatorGraphic>;
  graphicStickers: ReadonlyArray<GraphicSticker>;
  flareLibrary: ReadonlyArray<FlareItem>;
  textureLibrary: ReadonlyArray<FlareItem>;
  showEmojiLibrary?: boolean;
  onPlaceToCanvas?: () => void;
};

const LibraryPanel: React.FC<LibraryPanelProps> = React.memo(
  ({
    format,
    selectedEmojiId,
    setSelectedEmojiId,
    liveEmojiPos,
    IS_iconSlotPickerRef,
    IS_onIconSlotFile,
    IS_iconSlots,
    IS_triggerIconSlotUpload,
    IS_placeIconFromSlot,
    IS_clearIconSlot,
    socialMediaStickers,
    nightlifeGraphics,
    textSeparators,
    graphicStickers,
    flareLibrary,
    textureLibrary,
    showEmojiLibrary = true,
    onPlaceToCanvas,
  }) => {
    // rAF throttle to smooth slider-driven updates
    const updatePortraitRaf = React.useRef<(id: string, patch: any) => void | undefined>(undefined);
    const updatePortraitGeometryRaf = React.useRef<(id: string, patch: any) => void | undefined>(undefined);
    const updateSeparatorRaf = React.useRef<((id: string, kind: string, color: string, width: number, offset: number) => void) | undefined>(undefined);
    const updateEmojiRaf = React.useRef<(id: string, patch: any) => void | undefined>(undefined);
    const [librarySectionsOpen, setLibrarySectionsOpen] = React.useState(() => ({
      emoji: false,
      uploads: false,
      nightlife: false,
      separators: false,
      shapes: false,
      social: false,
      graphics: false,
      textures: false,
      flares: false,
    }));

    // set up throttles after store actions are declared
    const makeThrottle = React.useCallback(<T extends (...args: any[]) => void>(fn: T) => {
      let frame: number | null = null;
      let lastArgs: any[] | null = null;
      return (...args: any[]) => {
        lastArgs = args;
        if (frame !== null) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          if (lastArgs) fn(...(lastArgs as any[]));
        });
      };
    }, []);
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
    const addEmoji = useFlyerState((s) => s.addEmoji);
    const updateEmoji = useFlyerState((s) => s.updateEmoji);
    const removeEmoji = useFlyerState((s) => s.removeEmoji);
    const setIsLiveDragging = useFlyerState((s) => s.setIsLiveDragging);
    const ASSET_LAYER_STEP = 8;
    const ASSET_LAYER_MIN = -120;
    const ASSET_LAYER_MAX = 160;
    const nudgeAssetLayerOffset = React.useCallback(
      (current: number | undefined, direction: "up" | "down") => {
        const delta = direction === "up" ? ASSET_LAYER_STEP : -ASSET_LAYER_STEP;
        return Math.max(ASSET_LAYER_MIN, Math.min(ASSET_LAYER_MAX, (current ?? 0) + delta));
      },
      [ASSET_LAYER_STEP, ASSET_LAYER_MIN, ASSET_LAYER_MAX]
    );
    const nudgeEmojiLayer = React.useCallback(
      (id: string, direction: "up" | "down") => {
        const store = useFlyerState.getState();
        const bucket = Array.isArray(store.emojis?.[format]) ? store.emojis[format] : [];
        const cur = bucket.find((e: any) => e?.id === id);
        if (!cur) return;
        store.updateEmoji(format, id, {
          layerOffset: nudgeAssetLayerOffset((cur as any).layerOffset, direction),
        } as any);
        setSelectedEmojiId(id);
        store.setSelectedEmojiId(id);
        store.setSelectedPanel('icons');
        store.setMoveTarget('icon');
      },
      [format, setSelectedEmojiId, nudgeAssetLayerOffset]
    );
    const nudgePortraitLayer = React.useCallback(
      (id: string, direction: "up" | "down") => {
        const store = useFlyerState.getState();
        const bucket = Array.isArray(store.portraits?.[format]) ? store.portraits[format] : [];
        const cur = bucket.find((p: any) => p?.id === id);
        if (!cur) return;
        store.updatePortrait(format, id, {
          layerOffset: nudgeAssetLayerOffset((cur as any).layerOffset, direction),
        } as any);
        store.setSelectedPortraitId(id);
        store.setSelectedPanel('icons');
        store.setMoveTarget('icon');
      },
      [format, nudgeAssetLayerOffset]
    );
    const beginSliderDrag = React.useCallback(() => {
      setIsLiveDragging(true);
    }, [setIsLiveDragging]);
    const endSliderDrag = React.useCallback(() => {
      setIsLiveDragging(false);
    }, [setIsLiveDragging]);
    const sliderDragProps = React.useMemo(
      () => ({
        onPointerDown: beginSliderDrag,
        onPointerUp: endSliderDrag,
        onPointerCancel: endSliderDrag,
      }),
      [beginSliderDrag, endSliderDrag]
    );
    const deferLibraryPlacement = React.useCallback((work: () => void) => {
      if (typeof window === "undefined") {
        work();
        return;
      }

      window.requestAnimationFrame(() => {
        window.setTimeout(work, 0);
      });
    }, []);

    const getAssetName = (asset: any) => {
      if (!asset) return null;
      const label = typeof asset.label === "string" ? asset.label.trim() : "";
      if (label) return label;
      const baseId = String(asset.id || "").split("_")[1] || "";
      if ((asset as any).isTexture) {
        return textureLibrary.find((t) => t.id === baseId)?.name || "Texture";
      }
      if (asset.isFlare) {
        return flareLibrary.find((f) => f.id === baseId)?.name || "Flare";
      }
      if ((asset as any).isSeparator) {
        return textSeparators.find((s) => s.id === baseId)?.label || "Separator";
      }
      if ((asset as any).isShapeGraphic) {
        return SHAPE_GRAPHICS.find((shape) => shape.id === baseId)?.label || "Shape";
      }
      if (asset.isSticker) {
        return (
          socialMediaStickers.find((s) => s.id === baseId)?.name ||
          graphicStickers.find((s) => s.id === baseId)?.name ||
          nightlifeGraphics.find((g) => g.id === baseId)?.label ||
          "Graphic"
        );
      }
      return null;
    };

    const isSocialStickerAsset = React.useCallback(
      (asset: any) => {
        const baseId = String(asset?.id || "").split("_")[1] || "";
        return socialMediaStickers.some((sticker) => sticker.id === baseId);
      },
      [socialMediaStickers]
    );

    // build throttles once store actions are available
    React.useEffect(() => {
      const lerp = (a: number, b: number, t = 0.35) => a + (b - a) * t;

      const smoothPortrait = (id: string, patch: any) => {
        const store = useFlyerState.getState();
        const list = store.portraits?.[format] || [];
        const cur = list.find((p: any) => p.id === id);
        if (!cur) return updatePortrait(format, id, patch);

        const out: any = { ...patch };
        (["scale", "opacity", "rotation", "tint"] as const).forEach((key) => {
          if (typeof patch[key] === "number") {
            const curVal =
              key === "scale"
                ? cur.scale ?? 1
                : key === "opacity"
                ? cur.opacity ?? 1
                : key === "rotation"
                ? cur.rotation ?? 0
                : (cur as any).tint ?? 0;
            out[key] = lerp(curVal, Number(patch[key]));
          }
        });
        updatePortrait(format, id, out);
      };

      const smoothEmoji = (id: string, patch: any) => {
        const store = useFlyerState.getState();
        const list = store.emojis?.[format] || [];
        const cur = list.find((e: any) => e.id === id);
        if (!cur) return updateEmoji(format, id, patch);

        const out: any = { ...patch };
        (["scale", "opacity", "rotation", "tint"] as const).forEach((key) => {
          if (typeof patch[key] === "number") {
            const curVal =
              key === "scale"
                ? cur.scale ?? 1
                : key === "opacity"
                ? cur.opacity ?? 1
                : key === "rotation"
                ? cur.rotation ?? 0
                : (cur as any).tint ?? 0;
            out[key] = lerp(curVal, Number(patch[key]));
          }
        });
        updateEmoji(format, id, out);
      };

      updatePortraitRaf.current = makeThrottle(smoothPortrait);
      updatePortraitGeometryRaf.current = makeThrottle((id: string, patch: any) => {
        updatePortrait(format, id, patch);
      });
      updateSeparatorRaf.current = makeThrottle(
        (id: string, kind: string, color: string, width: number, offset: number) => {
          updatePortrait(format, id, {
            separatorWidth: width,
            separatorOffset: offset,
            url: buildSeparatorSvgDataUrl(kind, color, width, offset),
          });
        }
      );
      updateEmojiRaf.current = makeThrottle(smoothEmoji);
    }, [format, updatePortrait, updateEmoji, makeThrottle]);

    const downscaleDataUrlIfNeeded = React.useCallback(
      (dataUrl: string, maxDim = 1400) =>
        new Promise<string>((resolve) => {
          if (typeof window === 'undefined') return resolve(dataUrl);
          if (window.innerWidth >= 1024) return resolve(dataUrl);
          if (!dataUrl.startsWith('data:image/')) return resolve(dataUrl);
          const img = new Image();
          img.onload = () => {
            const max = Math.max(img.width, img.height);
            if (max <= maxDim) return resolve(dataUrl);
            const scale = maxDim / max;
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(dataUrl);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/png', 0.9));
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        }),
      []
    );

    const emojiList = Array.isArray(emojis)
      ? emojis
      : emojis && typeof emojis === 'object'
      ? emojis[format] || []
      : [];
    const selectedEmoji = emojiList.find((e: any) => e.id === selectedEmojiId) || null;

    const portraitList = Array.isArray((portraits as any)?.[format]) ? portraits[format] : [];
    const stickerAssets = portraitList.filter((p: any) => !!p?.isSticker);
    const separatorAssets = stickerAssets.filter((p: any) => !!(p as any)?.isSeparator);
    const shapeAssets = stickerAssets.filter((p: any) => !!(p as any)?.isShapeGraphic);
    const graphicAssets = stickerAssets.filter(
      (p: any) => !(p as any)?.isSeparator && !(p as any)?.isShapeGraphic
    );
    const nightlifeGraphicAssets = graphicAssets.filter(
      (p: any) => typeof (p as any)?.svgTemplate === 'string'
    );
    const socialStickerAssets = graphicAssets.filter(
      (p: any) => typeof (p as any)?.svgTemplate !== 'string' && isSocialStickerAsset(p)
    );
    const graphicStickerAssets = graphicAssets.filter(
      (p: any) => typeof (p as any)?.svgTemplate !== 'string' && !isSocialStickerAsset(p)
    );
    const flareAssets = portraitList.filter(
      (p: any) => !!p?.isFlare && !p?.isSticker && !(p as any)?.isTexture
    );
    const textureAssets = portraitList.filter(
      (p: any) => !!p?.isFlare && !p?.isSticker && !!(p as any)?.isTexture
    );
    const selectedPortrait = portraitList.find((p: any) => p.id === selectedPortraitId) || null;
    const selectedSeparator =
      selectedPortrait && !!(selectedPortrait as any)?.isSeparator ? selectedPortrait : null;
    const selectedShape =
      selectedPortrait && !!(selectedPortrait as any)?.isShapeGraphic ? selectedPortrait : null;
    const selectedGraphic =
      selectedPortrait &&
      !!(selectedPortrait as any)?.isSticker &&
      !(selectedPortrait as any)?.isSeparator &&
      !(selectedPortrait as any)?.isShapeGraphic
        ? selectedPortrait
        : null;
    const selectedNightlifeGraphic =
      selectedGraphic && typeof (selectedGraphic as any)?.svgTemplate === 'string'
        ? selectedGraphic
        : null;
    const selectedGraphicSticker =
      selectedGraphic && typeof (selectedGraphic as any)?.svgTemplate !== 'string'
        ? selectedGraphic
        : null;
    const selectedSocialSticker =
      selectedGraphicSticker && isSocialStickerAsset(selectedGraphicSticker)
        ? selectedGraphicSticker
        : null;
    const selectedGraphicStickerAsset =
      selectedGraphicSticker && !isSocialStickerAsset(selectedGraphicSticker)
        ? selectedGraphicSticker
        : null;
    const selectedTexture =
      selectedPortrait &&
      !!(selectedPortrait as any)?.isFlare &&
      !(selectedPortrait as any)?.isSticker &&
      !!(selectedPortrait as any)?.isTexture
        ? selectedPortrait
        : null;
    const selectedFlare =
      selectedPortrait &&
      !!(selectedPortrait as any)?.isFlare &&
      !(selectedPortrait as any)?.isSticker &&
      !(selectedPortrait as any)?.isTexture
        ? selectedPortrait
        : null;
    const toggleLibrarySection = React.useCallback(
      (key: keyof typeof librarySectionsOpen) => {
        setLibrarySectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
      },
      []
    );

    const renderStickerControls = (sel: any, items: any[], title: string, deleteLabel: string) => {
      if (!sel) return null;

      const locked = !!sel.locked;
      const isSeparator = !!(sel as any).isSeparator;
      const isShapeGraphic = !!(sel as any).isShapeGraphic;

      return (
        <div
          className={railCardClass}
          data-portrait-area="true"
          onMouseDownCapture={(e) => e.stopPropagation()}
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <div className={railHeaderClass}>
            <span className={railTitleClass}>{title}</span>
            <span className={railMetaClass}>{items.length} total</span>
          </div>

          {(typeof (sel as any).svgTemplate === 'string' || isSeparator) && (
            <div className="flex items-center gap-2 text-[11px] text-neutral-300">
              <span className="opacity-80">
                {isShapeGraphic ? "Shape Color" : isSeparator ? "Separator Color" : "Icon Color"}
              </span>
              <ColorDot
                value={(sel as any).iconColor || '#ffffff'}
                onChange={(value) => {
                  const nextUrl = isSeparator
                    ? buildSeparatorSvgDataUrl(
                        String((sel as any).separatorKind || ''),
                        value,
                        Number((sel as any).separatorWidth ?? 180),
                        Number((sel as any).separatorOffset ?? 0)
                      )
                    : isShapeGraphic
                    ? buildShapeSvgDataUrl(
                        String((sel as any).shapeKind || ''),
                        value
                      )
                    : (() => {
                        const template = String((sel as any).svgTemplate || '');
                        const nextSvg = template.replace('{{COLOR}}', value);
                        const svgBase64 = btoa(unescape(encodeURIComponent(nextSvg)));
                        return `data:image/svg+xml;base64,${svgBase64}`;
                      })();
                  updatePortrait(format, sel.id, {
                    url: nextUrl,
                    iconColor: value,
                  });
                }}
              />
            </div>
          )}
          {(() => {
            const showLabel = !!(sel as any).showLabel;
            const labelBg = (sel as any).labelBg ?? true;
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-[11px] text-neutral-300">Label</label>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() =>
                      updatePortrait(format, sel.id, { showLabel: !showLabel })
                    }
                    className={railActionClass}
                  >
                    {showLabel ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-neutral-400">Label BG</span>
                  <button
                    type="button"
                    disabled={locked || !showLabel}
                    onClick={() =>
                      updatePortrait(format, sel.id, {
                        labelBg: !labelBg,
                      })
                    }
                    className={railActionClass}
                  >
                    {labelBg ? "Hide" : "Show"}
                  </button>
                </div>
                {showLabel && (
                  <>
                    <input
                      value={String((sel as any).label ?? '')}
                      onChange={(e) =>
                        updatePortrait(format, sel.id, {
                          label: e.target.value,
                        })
                      }
                      className={railFieldClass}
                      placeholder="Label"
                    />
                    <div>
                      <InlineSliderInput
                        {...sliderDragProps}
                        label="Label Size"
                        value={Number((sel as any).labelSize ?? 9)}
                        min={7}
                        max={isShapeGraphic ? 32 : 14}
                        step={1}
                        precision={0}
                        suffix="px"
                        disabled={locked}
                        onChange={(next) =>
                          updatePortraitRaf.current?.(sel.id, {
                            labelSize: next,
                          })
                        }
                        rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-blue-500"
                      />
                    </div>
                    <div>
                      <InlineSliderInput
                        {...sliderDragProps}
                        label="Label Y Offset"
                        value={Number((sel as any).labelOffsetY ?? 0)}
                        min={isShapeGraphic ? -60 : -30}
                        max={40}
                        step={1}
                        precision={0}
                        suffix="px"
                        disabled={locked}
                        onChange={(next) =>
                          updatePortraitRaf.current?.(sel.id, {
                            labelOffsetY: next,
                          })
                        }
                        rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-cyan-500"
                      />
                    </div>
                    {isShapeGraphic && (
                      <>
                        <div>
                          <InlineSliderInput
                            {...sliderDragProps}
                            label="Label Rotate"
                            value={Number((sel as any).labelRotate ?? 0)}
                            min={-180}
                            max={180}
                            step={1}
                            precision={0}
                            suffix="°"
                            disabled={locked}
                            onChange={(next) =>
                              updatePortraitRaf.current?.(sel.id, {
                                labelRotate: next,
                              })
                            }
                            rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-indigo-500"
                          />
                        </div>
                        <div>
                          <InlineSliderInput
                            {...sliderDragProps}
                            label="Label Skew"
                            value={Number((sel as any).labelSkew ?? 0)}
                            min={-60}
                            max={60}
                            step={1}
                            precision={0}
                            suffix="°"
                            disabled={locked}
                            onChange={(next) =>
                              updatePortraitRaf.current?.(sel.id, {
                                labelSkew: next,
                              })
                            }
                            rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-amber-500"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          <select
            className={railFieldClass}
            value={sel.id}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedPortraitId(id);
              setSelectedPanel('icons');
              setMoveTarget('icon');
            }}
          >
            {items.map((p: any, idx: number) => (
              <option key={p.id} value={p.id}>
                {getAssetName(p) || (isSeparator ? 'separator' : 'graphic')} #{idx + 1}
                {p.locked ? ' (locked)' : ''}
              </option>
            ))}
          </select>

          {!isShapeGraphic && (
            <div>
              <InlineSliderInput
                {...sliderDragProps}
                label="Scale"
                value={sel.scale ?? 1}
                min={0.01}
                max={3}
                step={0.01}
                displayScale={100}
                precision={0}
                suffix="%"
                disabled={locked}
                onChange={(next) =>
                  updatePortraitRaf.current?.(sel.id, { scale: next })
                }
                rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-blue-500"
              />
            </div>
          )}

          {isShapeGraphic && (
            <div>
              <InlineSliderInput
                {...sliderDragProps}
                label="Scale"
                value={Number(sel.scale ?? 1)}
                min={0.01}
                max={6}
                step={0.01}
                displayScale={100}
                precision={0}
                suffix="%"
                disabled={locked}
                onChange={(next) =>
                  updatePortraitRaf.current?.(sel.id, { scale: next })
                }
                rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-blue-500"
              />
            </div>
          )}

          <div>
            <InlineSliderInput
              {...sliderDragProps}
              label="Opacity"
              value={(sel as any).opacity ?? 1}
              min={0}
              max={1}
              step={0.05}
              displayScale={100}
              precision={0}
              suffix="%"
              disabled={locked}
              onChange={(next) =>
                updatePortraitRaf.current?.(sel.id, { opacity: next })
              }
              rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-blue-500"
            />
          </div>

          {isShapeGraphic && (
            <div>
              <InlineSliderInput
                {...sliderDragProps}
                label="Length"
                value={Number((sel as any).shapeLength ?? 160)}
                min={48}
                max={12000}
                step={24}
                precision={0}
                disabled={locked}
                onChange={(nextLength) => {
                  updatePortraitGeometryRaf.current?.(sel.id, {
                    shapeLength: nextLength,
                  });
                }}
                rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-rose-500"
              />
            </div>
          )}

          {isShapeGraphic && (
            <div>
              <InlineSliderInput
                {...sliderDragProps}
                label="Skew"
                value={Number((sel as any).shapeSkew ?? 0)}
                min={-60}
                max={60}
                step={1}
                precision={0}
                suffix="°"
                disabled={locked}
                onChange={(nextSkew) => {
                  updatePortraitGeometryRaf.current?.(sel.id, {
                    shapeSkew: nextSkew,
                  });
                }}
                rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-amber-500"
              />
            </div>
          )}

          {isSeparator && (
            <div>
              <InlineSliderInput
                {...sliderDragProps}
                label="Length"
                value={Number((sel as any).separatorWidth ?? 180)}
                min={128}
                max={720}
                step={4}
                precision={0}
                disabled={locked}
                onChange={(nextWidth) => {
                  updateSeparatorRaf.current?.(
                    sel.id,
                    String((sel as any).separatorKind || ''),
                    String((sel as any).iconColor || '#ffffff'),
                    nextWidth,
                    Number((sel as any).separatorOffset ?? 0)
                  );
                }}
                rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-rose-500"
              />
            </div>
          )}

          {isSeparator && (
            <div>
              <InlineSliderInput
                {...sliderDragProps}
                label="Offset"
                value={Number((sel as any).separatorOffset ?? 0)}
                min={-360}
                max={360}
                step={2}
                precision={0}
                disabled={locked}
                onChange={(nextOffset) => {
                  updateSeparatorRaf.current?.(
                    sel.id,
                    String((sel as any).separatorKind || ''),
                    String((sel as any).iconColor || '#ffffff'),
                    Number((sel as any).separatorWidth ?? 180),
                    nextOffset
                  );
                }}
                rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-cyan-500"
              />
            </div>
          )}

          <div>
            <InlineSliderInput
              {...sliderDragProps}
              label="Rotation"
              value={Number((sel as any).rotation ?? 0)}
              min={-180}
              max={180}
              step={1}
              precision={0}
              suffix="°"
              disabled={locked}
              onChange={(nextRotation) =>
                updatePortraitRaf.current?.(sel.id, { rotation: nextRotation })
              }
              rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-indigo-500"
            />
          </div>

          {!isShapeGraphic && (
            <div>
              <InlineSliderInput
                {...sliderDragProps}
                label="Tint"
                value={(sel as any).tint ?? 0}
                min={-180}
                max={180}
                step={5}
                precision={0}
                suffix="°"
                disabled={locked}
                onChange={(next) =>
                  updatePortraitRaf.current?.(sel.id, { tint: next })
                }
                rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              className={railActionTallClass}
              onClick={() => nudgePortraitLayer(sel.id, "up")}
            >
              Layer Up
            </button>
            <button
              className={railActionTallClass}
              onClick={() => nudgePortraitLayer(sel.id, "down")}
            >
              Layer Down
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              className={railActionTallClass}
              onClick={() =>
                updatePortrait(format, sel.id, {
                  locked: !locked,
                })
              }
            >
              {locked ? 'Unlock' : 'Lock'}
            </button>

            <button
              className={railDangerClass}
              onClick={() => {
                removePortrait(format, sel.id);
                setSelectedPortraitId(null);
              }}
            >
              {`Delete ${getAssetName(sel) || deleteLabel}`}
            </button>
          </div>
        </div>
      );
    };

    const addVectorSticker = React.useCallback(
      (item: NightlifeGraphic) => {
        const svgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" ${
          item.renderMode === "fill"
            ? `fill="{{COLOR}}" stroke="none"`
            : `fill="none" stroke="{{COLOR}}" stroke-width="${item.strokeWidth ?? 6}" stroke-linecap="round" stroke-linejoin="round"`
        }>${item.paths
          .map((d) => `<path d="${d}"/>`)
          .join('')}</svg>`;
        const svg = svgTemplate.replace('{{COLOR}}', '#ffffff');
        const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
        const url = `data:image/svg+xml;base64,${svgBase64}`;
        const id = `sticker_${item.id}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 7)}`;
        deferLibraryPlacement(() => {
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
        });
      },
      [addPortrait, deferLibraryPlacement, format, onPlaceToCanvas, setMoveTarget, setSelectedPanel, setSelectedPortraitId]
    );

    const addShapeSticker = React.useCallback(
      (shape: { id: string; label: string }) => {
        const iconColor = '#ffffff';
        const shapeLength = 160;
        const id = `shape_${shape.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        deferLibraryPlacement(() => {
          addPortrait(format, {
            id,
            url: buildShapeSvgDataUrl(shape.id, iconColor),
            x: 50,
            y: 50,
            scale: 0.65,
            locked: false,
            svgTemplate: buildShapeSvgMarkup(shape.id, '{{COLOR}}'),
            iconColor,
            label: shape.label,
            showLabel: false,
            labelSize: 14,
            labelRotate: 0,
            labelSkew: 0,
            isShapeGraphic: true,
            shapeKind: shape.id,
            shapeLength,
            shapeSkew: 0,
            isSticker: true,
          } as any);
          setSelectedPortraitId(id);
          setSelectedPanel('icons');
          setMoveTarget('icon');
          onPlaceToCanvas?.();
        });
      },
      [addPortrait, deferLibraryPlacement, format, onPlaceToCanvas, setMoveTarget, setSelectedPanel, setSelectedPortraitId]
    );

    const renderLightControls = (sel: any, items: any[], title: string, deleteLabel: string) => {
      if (!sel) return null;

      const locked = !!sel.locked;
      const update = (patch: any) => updatePortrait(format, sel.id, patch);

      return (
        <div
          className={railCardClass}
          data-portrait-area="true"
          onMouseDownCapture={(e) => e.stopPropagation()}
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <div className={railHeaderClass}>
            <span className={railTitleClass}>{title}</span>
            <span className={railMetaClass}>{items.length} total</span>
          </div>

          <select
            className={railFieldClass}
            value={sel.id}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedPortraitId(id);
              setSelectedPanel('icons');
              setMoveTarget('icon');
            }}
          >
            {items.map((p: any, idx: number) => (
              <option key={p.id} value={p.id}>
                {getAssetName(p) || deleteLabel} #{idx + 1}
                {p.locked ? ' (locked)' : ''}
              </option>
            ))}
          </select>

          <button className={`w-full ${railActionTallClass}`} onClick={() => update({ locked: !locked })}>
            {locked ? 'Unlock' : 'Lock'}
          </button>

          {(() => {
            const showLabel = !!(sel as any).showLabel;
            const labelBg = (sel as any).labelBg ?? true;
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-[11px] text-neutral-300">Label</label>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => update({ showLabel: !showLabel })}
                    className={railActionClass}
                  >
                    {showLabel ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-neutral-400">Label BG</span>
                  <button
                    type="button"
                    disabled={locked || !showLabel}
                    onClick={() => update({ labelBg: !labelBg })}
                    className={railActionClass}
                  >
                    {labelBg ? "Hide" : "Show"}
                  </button>
                </div>
                {showLabel && (
                  <>
                    <input
                      value={String((sel as any).label ?? '')}
                      onChange={(e) => update({ label: e.target.value })}
                      className={railFieldClass}
                      placeholder="Label"
                      disabled={locked}
                    />
                    <div>
                      <InlineSliderInput
                        {...sliderDragProps}
                        label="Label Size"
                        value={Number((sel as any).labelSize ?? 9)}
                        min={7}
                        max={14}
                        step={1}
                        precision={0}
                        suffix="px"
                        disabled={locked}
                        onChange={(next) => update({ labelSize: next })}
                        rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-blue-500"
                      />
                    </div>
                    <div>
                      <InlineSliderInput
                        {...sliderDragProps}
                        label="Label Y Offset"
                        value={Number((sel as any).labelOffsetY ?? 0)}
                        min={-30}
                        max={40}
                        step={1}
                        precision={0}
                        suffix="px"
                        disabled={locked}
                        onChange={(next) => update({ labelOffsetY: next })}
                        rangeClassName="flex-1 h-1 appearance-none cursor-pointer bg-neutral-700 accent-cyan-500"
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })()}

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

          <SliderRow
            label="Tint"
            value={(sel as any).tint ?? 0}
            min={-180}
            max={180}
            step={5}
            onChange={(v) => update({ tint: v })}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              className={railActionTallClass}
              onClick={() => nudgePortraitLayer(sel.id, "up")}
            >
              Layer Up
            </button>
            <button
              className={railActionTallClass}
              onClick={() => nudgePortraitLayer(sel.id, "down")}
            >
              Layer Down
            </button>
          </div>

          <button
            className={`w-full ${railDangerClass}`}
            onClick={() => {
              removePortrait(format, sel.id);
              setSelectedPortraitId(null);
            }}
          >
            {`Delete ${getAssetName(sel) || deleteLabel}`}
          </button>
        </div>
      );
    };

    return (
      <div
        className="mt-3"
        id="library-panel"
        data-tour="library"
      >
        <div
          className="relative rounded-xl transition"
        >
          <Collapsible
            title="Graphics & FX"
            storageKey="p:icons"
            isOpen={selectedPanel === 'icons'}
            onToggle={() => {
              const next = selectedPanel === 'icons' ? null : 'icons';
              setSelectedPanel(next);
              setMoveTarget(next ? 'icon' : null);
            }}
            panelClassName={
              selectedPanel === 'icons'
                ? 'ring-1 ring-inset ring-[#00FFF0]/70'
                : undefined
            }
            titleClassName={
              selectedPanel === 'icons'
                ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]'
                : ''
            }
          >
            <div className="mb-3 text-[12px] leading-5 text-neutral-400">
              Add graphics, separators, textures, light leaks, or uploaded logos.
            </div>
            {showEmojiLibrary && (
              <LibrarySection
                title="Emoji"
                open={librarySectionsOpen.emoji || !!selectedEmoji}
                onToggle={() => toggleLibrarySection('emoji')}
              >
                <div className="grid grid-cols-6 gap-2">
                  {['🎉','🎊','✨','🎭','🎈','🥳','💜','💛','💚','💙','🔥','🌟'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      className="aspect-square rounded-md bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 text-xl flex items-center justify-center transition-all"
                      onClick={() => {
                        const id = `emoji_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
                        addEmoji(format, {
                          id,
                          kind: 'emoji',
                          char: em,
                          x: 50,
                          y: 50,
                          scale: 1,
                          rotation: 0,
                          locked: false,
                          opacity: 1,
                        });
                        setSelectedEmojiId(id);
                        setSelectedPanel('icons');
                        setMoveTarget('icon');
                        onPlaceToCanvas?.();
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </LibrarySection>
            )}
            <input
              ref={IS_iconSlotPickerRef}
              type="file"
              accept="image/*"
              onChange={IS_onIconSlotFile}
              className="hidden"
            />

            <LibrarySection
              title="Uploaded Graphics"
              open={librarySectionsOpen.uploads}
              onToggle={() => toggleLibrarySection('uploads')}
            >
              <div className="text-[12px] text-neutral-300 mb-2">
                Upload up to 4 icons or logos, then place the ones you want on canvas.
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {IS_iconSlots.map((src, i) => (
                  (() => {
                    const onCanvas =
                      src
                        ? portraitList.find((p: any) => p.url === src && (!!p?.isSticker || !!p?.isFlare))
                        : null;
                    const isSelected = !!(onCanvas && selectedPortraitId === onCanvas.id);

                    return (
                      <div
                        key={i}
                        className={[
                          editorUploadHolderClass,
                          isSelected ? "border-cyan-300/55 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]" : "",
                        ].join(" ").trim()}
                      >
                        <div className="text-[12px] font-medium text-white">
                          Graphic {i + 1}
                        </div>

                        <button
                          type="button"
                          className={`aspect-square w-full grid place-items-center relative ${editorUploadPreviewClass} ${
                            onCanvas ? "cursor-pointer hover:border-cyan-300/45" : "cursor-default"
                          }`}
                          disabled={!onCanvas}
                          onClick={() => {
                            if (!onCanvas) return;
                            setSelectedPortraitId(onCanvas.id);
                            setSelectedPanel('icons');
                            setMoveTarget('icon');
                            window.setTimeout(() => {
                              document
                                .getElementById('icons-panel')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 80);
                          }}
                          title={onCanvas ? 'Select graphic and jump to controls' : undefined}
                        >
                          {src ? (
                            <img
                              src={src}
                              alt={`icon slot ${i + 1}`}
                              className="w-full h-full object-contain bg-white/5"
                              draggable={false}
                            />
                          ) : (
                            <div className={editorEmptyStateClass}>
                              <div className="text-[11px] leading-6 text-neutral-400">Upload an icon or logo.</div>
                            </div>
                          )}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => IS_triggerIconSlotUpload(i)}
                            className={`${editorUploadActionClass} whitespace-normal text-center`}
                            title="Upload into this slot"
                          >
                            {src ? 'Replace' : 'Upload'}
                          </button>
                          <button
                            type="button"
                            onClick={() => IS_placeIconFromSlot(i)}
                            className={`${editorUploadPlaceClass} whitespace-normal text-center`}
                            disabled={!src}
                            title="Place on canvas"
                          >
                            Place
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => IS_clearIconSlot(i)}
                          className={`${editorUploadClearClass} w-full whitespace-normal text-center`}
                          disabled={!src}
                          title="Clear slot"
                        >
                          Clear
                        </button>
                      </div>
                    );
                  })()
                ))}
              </div>
            </LibrarySection>

            {selectedEmoji && (() => {
              const sel = selectedEmoji;
              const locked = !!sel.locked;
              const isFlare = !!(sel as any)?.isFlare || (!!(sel as any)?.url && !sel.char);
              const isStickerImg = !!(sel as any)?.isSticker && !!(sel as any)?.url;

              return (
                <div
                  className="panel mt-4 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3"
                  data-portrait-area="true"
                  onMouseDownCapture={(e) => e.stopPropagation()}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  <div className="text-[12px] text-neutral-200 font-bold mb-2 flex justify-between items-center">
                    <span>{isFlare ? 'Flare Controls' : 'Emoji Controls'}</span>
                    <span className="text-neutral-500 font-normal text-[10px]">
                      {sel.id.split('_')[1] || (isFlare ? 'flare' : 'emoji')}
                    </span>
                  </div>

                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-[34px] select-none">
                      {isFlare || isStickerImg ? (
                        <img
                          src={(sel as any).url}
                          alt="preview"
                          className="h-12 w-12 object-contain pointer-events-none select-none"
                          draggable={false}
                        />
                      ) : (
                        sel.char
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-[10px] text-neutral-400">
                        Pos: {(liveEmojiPos && liveEmojiPos.id === sel.id
                          ? liveEmojiPos.x
                          : Number(sel.x ?? 0)
                        ).toFixed(1)} / {(liveEmojiPos && liveEmojiPos.id === sel.id
                          ? liveEmojiPos.y
                          : Number(sel.y ?? 0)
                        ).toFixed(1)}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Scale: {Math.round((sel.scale || 1) * 100)}%
                      </div>
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
                  </div>

                  <div className="mb-3">
                    <InlineSliderInput
                      {...sliderDragProps}
                      label="Scale"
                      value={sel.scale ?? 1}
                      min={0.01}
                      max={5}
                      step={0.01}
                      displayScale={100}
                      precision={0}
                      suffix="%"
                      onChange={(next) => {
                        updateEmojiRaf.current?.(sel.id, { scale: next });
                      }}
                      rangeClassName="flex-1 accent-blue-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      disabled={locked}
                    />
                  </div>

                  <div className="mb-3">
                    <InlineSliderInput
                      {...sliderDragProps}
                      label="Opacity"
                      value={sel.opacity ?? 1}
                      min={0}
                      max={1}
                      step={0.05}
                      displayScale={100}
                      precision={0}
                      suffix="%"
                      onChange={(next) => {
                        updateEmojiRaf.current?.(sel.id, { opacity: next });
                      }}
                      rangeClassName="flex-1 accent-blue-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      disabled={locked}
                    />
                  </div>

                  <div className="mb-3">
                    <InlineSliderInput
                      {...sliderDragProps}
                      label="Rotation"
                      value={sel.rotation ?? 0}
                      min={-180}
                      max={180}
                      step={1}
                      precision={0}
                      suffix="°"
                      onChange={(next) => {
                        updateEmojiRaf.current?.(sel.id, { rotation: next });
                      }}
                      rangeClassName="flex-1 accent-blue-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      disabled={locked}
                    />
                  </div>

                  <div className="mb-3">
                    <InlineSliderInput
                      {...sliderDragProps}
                      label="Tint"
                      value={(sel as any).tint ?? 0}
                      min={-180}
                      max={180}
                      step={5}
                      precision={0}
                      suffix="°"
                      onChange={(next) => {
                        updateEmojiRaf.current?.(sel.id, { tint: next });
                      }}
                      rangeClassName="flex-1 accent-blue-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      disabled={locked}
                    />
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="text-[11px] bg-neutral-800 border border-neutral-600 rounded-md py-2"
                      onClick={() => nudgeEmojiLayer(sel.id, "up")}
                    >
                      Layer Up
                    </button>
                    <button
                      type="button"
                      className="text-[11px] bg-neutral-800 border border-neutral-600 rounded-md py-2"
                      onClick={() => nudgeEmojiLayer(sel.id, "down")}
                    >
                      Layer Down
                    </button>
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

            {nightlifeGraphics.length > 0 && (
              <LibrarySection
                title="Nightlife Graphics"
                open={librarySectionsOpen.nightlife || !!selectedNightlifeGraphic}
                onToggle={() => toggleLibrarySection('nightlife')}
              >
                  <div className="grid grid-cols-2 gap-2">
                    {nightlifeGraphics.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="h-10 rounded-md bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all flex items-center gap-2 px-2 group relative overflow-hidden"
                        title={`Add ${item.label}`}
                        onClick={() => addVectorSticker(item)}
                      >
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 128 128"
                          fill={item.renderMode === "fill" ? "currentColor" : "none"}
                          stroke={item.renderMode === "fill" ? "none" : "currentColor"}
                          strokeWidth={item.renderMode === "fill" ? undefined : item.strokeWidth ?? 6}
                          strokeLinecap={item.renderMode === "fill" ? undefined : "round"}
                          strokeLinejoin={item.renderMode === "fill" ? undefined : "round"}
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

                  {renderStickerControls(
                    selectedNightlifeGraphic,
                    nightlifeGraphicAssets,
                    'Selected Graphic',
                    'Graphic'
                  )}
              </LibrarySection>
            )}

            <LibrarySection
              title="Text Separators"
              open={librarySectionsOpen.separators || !!selectedSeparator}
              onToggle={() => toggleLibrarySection('separators')}
            >
              <div className="grid grid-cols-2 gap-2">
                {textSeparators.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="h-10 rounded-md bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all flex items-center gap-2 px-2 group relative overflow-hidden"
                    title={`Add ${item.label}`}
                    onClick={() => {
                      const separatorWidth = 180;
                      const separatorOffset = 0;
                      const url = buildSeparatorSvgDataUrl(item.id, '#ffffff', separatorWidth, separatorOffset);
                      const id = `separator_${item.id}_${Date.now()}_${Math.random()
                        .toString(36)
                        .slice(2, 7)}`;
                      addPortrait(format, {
                        id,
                        url,
                        x: 50,
                        y: 50,
                        scale: 0.75,
                        locked: false,
                        svgTemplate: buildSeparatorSvgMarkup(item.id, '{{COLOR}}', separatorWidth, separatorOffset),
                        iconColor: '#ffffff',
                        label: item.label,
                        showLabel: false,
                        isSeparator: true,
                        separatorKind: item.id,
                        separatorWidth,
                        separatorOffset,
                        isSticker: true,
                      } as any);
                      setSelectedPortraitId(id);
                      setSelectedPanel('icons');
                      setMoveTarget('icon');
                      onPlaceToCanvas?.();
                    }}
                  >
                    <img
                      src={buildSeparatorSvgDataUrl(item.id, '#ffffff', 180, 0)}
                      alt={item.label}
                      className="h-[18px] w-[44px] object-contain opacity-90 group-hover:scale-105 transition-transform"
                      draggable={false}
                    />
                    <span className="text-[10px] font-semibold text-neutral-300 group-hover:text-white">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
              {renderStickerControls(selectedSeparator, separatorAssets, 'Selected Separator', 'Separator')}
            </LibrarySection>

            <LibrarySection
              title="Shapes"
              open={librarySectionsOpen.shapes || !!selectedShape}
              onToggle={() => toggleLibrarySection('shapes')}
            >
              <div className="grid grid-cols-3 gap-2">
                {SHAPE_GRAPHICS.map((shape) => (
                  <button
                    key={shape.id}
                    type="button"
                    className="h-10 rounded-md bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 transition-all flex items-center gap-2 px-2 group relative overflow-hidden"
                    title={`Add ${shape.label}`}
                    onClick={() => addShapeSticker(shape)}
                  >
                    <img
                      src={buildShapeSvgDataUrl(shape.id, '#ffffff')}
                      alt={shape.label}
                      className="h-[18px] w-[28px] object-contain opacity-90 group-hover:scale-105 transition-transform"
                      draggable={false}
                    />
                    <span className="text-[10px] font-semibold text-neutral-300 group-hover:text-white">
                      {shape.label}
                    </span>
                  </button>
                ))}
              </div>
              {renderStickerControls(selectedShape, shapeAssets, 'Selected Shape', 'Shape')}
            </LibrarySection>

            <LibrarySection
              title="Social Media"
              open={librarySectionsOpen.social || !!selectedSocialSticker}
              onToggle={() => toggleLibrarySection('social')}
            >
              <div className="grid grid-cols-4 gap-2">
                {socialMediaStickers.map((sticker) => (
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
                        tintMode: 'colorize',
                        label: sticker.name,
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
              {renderStickerControls(
                selectedSocialSticker,
                socialStickerAssets,
                'Selected Social Icon',
                'Social Icon'
              )}
            </LibrarySection>

            {graphicStickers.length > 0 && (
              <LibrarySection
                title="Sticker Graphics"
                open={librarySectionsOpen.graphics || !!selectedGraphicStickerAsset}
                onToggle={() => toggleLibrarySection('graphics')}
              >
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
                            tintMode: 'colorize',
                            label: sticker.name,
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

                  {renderStickerControls(
                    selectedGraphicStickerAsset,
                    graphicStickerAssets,
                    'Selected Graphic',
                    'Graphic'
                  )}
              </LibrarySection>
            )}

            {textureLibrary.length > 0 && (
              <LibrarySection
                title="Textures"
                open={librarySectionsOpen.textures || !!selectedTexture}
                onToggle={() => toggleLibrarySection('textures')}
              >
                  <div className="grid grid-cols-4 gap-2">
                    {textureLibrary.map((texture) => (
                      <button
                        key={texture.id}
                        type="button"
                        className="aspect-square rounded-md bg-black border border-neutral-800 hover:border-neutral-600 transition-all flex items-center justify-center p-1 group relative overflow-hidden"
                        title={`Add ${texture.name}`}
                        onClick={async () => {
                          const id = `flare_${texture.id}_${Date.now()}_${Math.random()
                            .toString(36)
                            .slice(2, 7)}`;
                          const textureSrc = await downscaleDataUrlIfNeeded(texture.src, 1400);

                          addPortrait(format, {
                            id,
                            url: textureSrc,
                            x: 50,
                            y: 50,
                            scale: 0.95,
                            locked: false,
                            blendMode: 'overlay',
                            opacity: 0.85,
                            rotation: 0,
                            isFlare: true,
                            isTexture: true,
                            tintMode: texture.tintMode ?? 'colorize',
                            label: texture.name,
                          } as any);

                          setSelectedPortraitId(id);
                          setSelectedPanel('icons');
                          setMoveTarget('icon');
                          onPlaceToCanvas?.();
                        }}
                      >
                        <img
                          src={texture.src}
                          alt={texture.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform opacity-90"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>

                  {renderLightControls(selectedTexture, textureAssets, 'Selected Texture', 'Texture')}
              </LibrarySection>
            )}

            <LibrarySection
              title="Flares & Light Leaks"
              open={librarySectionsOpen.flares || !!selectedFlare}
              onToggle={() => toggleLibrarySection('flares')}
            >
              <div className="grid grid-cols-4 gap-2">
                {flareLibrary.map((flare) => (
                  <button
                    key={flare.id}
                    type="button"
                    className="aspect-square rounded-md bg-black border border-neutral-800 hover:border-neutral-600 transition-all flex items-center justify-center p-1 group relative overflow-hidden"
                    title={`Add ${flare.name}`}
                    onClick={async () => {
                      const id = `flare_${flare.id}_${Date.now()}_${Math.random()
                        .toString(36)
                        .slice(2, 7)}`;
                      const flareSrc = await downscaleDataUrlIfNeeded(flare.src, 1400);

                      addPortrait(format, {
                        id,
                        url: flareSrc,
                        x: 50,
                        y: 50,
                        scale: 0.8,
                        locked: false,
                        blendMode: 'screen',
                        opacity: 0.9,
                        rotation: 0,
                        isFlare: true,
                        label: flare.name,
                        tintMode: flare.tintMode,
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
              {renderLightControls(selectedFlare, flareAssets, 'Selected Flare', 'Flare')}
            </LibrarySection>
          </Collapsible>
        </div>

      </div>
    );
  }
);

LibraryPanel.displayName = 'LibraryPanel';

export default LibraryPanel;
