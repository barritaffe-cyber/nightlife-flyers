"use client";
/* eslint-disable @next/next/no-img-element */

import CocoOrb from "./CocoOrb";
import { useState, type CSSProperties, type ReactNode } from "react";

export type CocoDirectionPreviewRect = {
  /** Height as a percentage of the preview canvas. */
  height?: number;
  /** Width as a percentage of the preview canvas. */
  width: number;
  /** Left edge as a percentage of the preview canvas. */
  x: number;
  /** Top edge as a percentage of the preview canvas. */
  y: number;
};

export type CocoDirectionPreviewBackground = {
  blurPx?: number;
  brightness?: number;
  contrast?: number;
  opacity?: number;
  positionX?: number;
  positionY?: number;
  rotation?: number;
  saturation?: number;
  scale?: number;
  src?: string;
};

export type CocoDirectionPreviewImageLayer = {
  fit?: "contain" | "cover";
  opacity?: number;
  positionX?: number;
  positionY?: number;
  rect: CocoDirectionPreviewRect;
  rotation?: number;
  scale?: number;
  src: string;
  zIndex?: number;
};

export type CocoDirectionPreviewTextLayer = {
  align?: "left" | "center" | "right";
  backgroundColor?: string;
  borderColor?: string;
  borderRadiusPct?: number;
  borderWidth?: number;
  color: string;
  fontFamily?: string;
  /** Font size as a percentage of canvas width. */
  fontSize: number;
  fontStyle?: "normal" | "italic";
  fontWeight?: number | "normal" | "bold";
  letterSpacingEm?: number;
  lineHeight?: number;
  maxLines?: number;
  opacity?: number;
  paddingPct?: number;
  rect: CocoDirectionPreviewRect;
  rotation?: number;
  shadow?: string;
  strokeColor?: string;
  strokeWidth?: number;
  text: string;
  textTransform?: "none" | "uppercase";
  verticalAlign?: "top" | "center" | "bottom";
  zIndex?: number;
};

export type CocoDirectionPreviewCanvas = {
  background?: CocoDirectionPreviewBackground;
  backgroundColor?: string;
  backgroundGradient?: string;
  decorations?: CocoDirectionPreviewImageLayer[];
  overlayColor?: string;
  subject?: CocoDirectionPreviewImageLayer;
  text: CocoDirectionPreviewTextLayer[];
};

export type CocoDirectionGeneratedPreview = {
  square: CocoDirectionPreviewCanvas;
  story: CocoDirectionPreviewCanvas;
};

export type CocoDirectionRecipePreview = {
  square?: string;
  story?: string;
};

export type CocoDirectionChoice = {
  colors: string[];
  description: string;
  missingDetails?: string[];
  eventName: string;
  generatedPreview?: CocoDirectionGeneratedPreview;
  personalizedPreview?: { square: ReactNode; story: ReactNode };
  headlineFont?: string;
  id: string;
  name: string;
  preview?: string;
  recipePreview?: CocoDirectionRecipePreview;
  offerImproveCutout?: boolean;
  previewUsesRecipeSubject?: boolean;
  requiresRecipeSubjectConsent?: boolean;
  requiresSubjectRetry?: boolean;
  subjectQuality?: "none" | "strong" | "weak" | "unusable";
};

export type CocoDirectionSelectionOptions = {
  approveRecipeSubject?: boolean;
};

type Props = {
  choices: readonly CocoDirectionChoice[];
  hasMore?: boolean;
  loadingMore?: boolean;
  moreError?: string | null;
  onMore?: () => void;
  onBack: () => void;
  onSelect: (id: string, options?: CocoDirectionSelectionOptions) => void;
};

const clamp = (value: number | undefined, fallback: number, minimum: number, maximum: number) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(maximum, Math.max(minimum, numeric)) : fallback;
};

function rectStyle(rect: CocoDirectionPreviewRect): CSSProperties {
  return {
    height: rect.height == null ? undefined : `${clamp(rect.height, 1, 0, 140)}%`,
    left: `${clamp(rect.x, 0, -40, 140)}%`,
    top: `${clamp(rect.y, 0, -40, 140)}%`,
    width: `${clamp(rect.width, 1, 0, 140)}%`,
  };
}

function previewImageStyle(layer: CocoDirectionPreviewImageLayer): CSSProperties {
  return {
    ...rectStyle(layer.rect),
    objectFit: layer.fit ?? "contain",
    objectPosition: `${clamp(layer.positionX, 50, 0, 100)}% ${clamp(layer.positionY, 50, 0, 100)}%`,
    opacity: clamp(layer.opacity, 1, 0, 1),
    transform: `rotate(${clamp(layer.rotation, 0, -360, 360)}deg) scale(${clamp(
      layer.scale,
      1,
      0.01,
      8
    )})`,
    transformOrigin: "center",
    zIndex: Math.round(clamp(layer.zIndex, 2, -20, 100)),
  };
}

function GeneratedPreviewCanvas({
  canvas,
  fallbackBackground,
  fallbackColors,
  format,
}: {
  canvas: CocoDirectionPreviewCanvas;
  fallbackBackground?: string;
  fallbackColors: string[];
  format: "square" | "story";
}) {
  const background = canvas.background;
  const backgroundSrc = background?.src || fallbackBackground;
  const fallbackBase = fallbackColors[0] || "#08080c";
  const fallbackAccent = fallbackColors[1] || "#191226";
  const backgroundFilter = background
    ? [
        `brightness(${clamp(background.brightness, 1, 0, 3)})`,
        `contrast(${clamp(background.contrast, 1, 0, 3)})`,
        `saturate(${clamp(background.saturation, 1, 0, 4)})`,
        `blur(${clamp(background.blurPx, 0, 0, 24)}px)`,
      ].join(" ")
    : undefined;

  return (
    <div
      aria-label={`${format === "square" ? "Square" : "Story"} generated flyer preview`}
      role="img"
      className={`relative isolate overflow-hidden border border-white/15 bg-black shadow-[0_16px_35px_rgba(0,0,0,0.48)] ${
        format === "square" ? "aspect-square" : "aspect-[9/16]"
      }`}
      style={{
        background: canvas.backgroundGradient
          ? canvas.backgroundGradient
          : `linear-gradient(145deg, ${canvas.backgroundColor || fallbackBase}, ${fallbackAccent})`,
        containerType: "inline-size",
      }}
    >
      {backgroundSrc ? (
        <img
          src={backgroundSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          style={{
            filter: backgroundFilter,
            objectPosition: `${clamp(background?.positionX, 50, 0, 100)}% ${clamp(
              background?.positionY,
              50,
              0,
              100
            )}%`,
            opacity: clamp(background?.opacity, 1, 0, 1),
            transform: `rotate(${clamp(background?.rotation, 0, -45, 45)}deg) scale(${clamp(
              background?.scale,
              1,
              0.25,
              4
            )})`,
          }}
        />
      ) : null}

      {canvas.overlayColor ? (
        <div className="absolute inset-0 z-[1]" style={{ background: canvas.overlayColor }} />
      ) : null}

      {(canvas.decorations ?? []).map((layer, index) => (
        <img
          key={`${layer.src}-${index}`}
          src={layer.src}
          alt=""
          className="absolute"
          draggable={false}
          style={previewImageStyle(layer)}
        />
      ))}

      {canvas.subject?.src ? (
        <img
          src={canvas.subject.src}
          alt=""
          className="absolute"
          draggable={false}
          style={previewImageStyle(canvas.subject)}
        />
      ) : null}

      {canvas.text.map((layer, index) => {
        if (!String(layer.text || "").trim()) return null;
        const verticalAlignment =
          layer.verticalAlign === "bottom"
            ? "flex-end"
            : layer.verticalAlign === "center"
              ? "center"
              : "flex-start";
        return (
          <div
            key={`${layer.text}-${index}`}
            className="absolute flex overflow-hidden whitespace-pre-line break-words"
            style={{
              ...rectStyle(layer.rect),
              alignItems: verticalAlignment,
              backgroundColor: layer.backgroundColor,
              borderColor: layer.borderColor,
              borderRadius:
                layer.borderRadiusPct == null
                  ? undefined
                  : `${clamp(layer.borderRadiusPct, 0, 0, 100)}%`,
              borderStyle: layer.borderWidth ? "solid" : undefined,
              borderWidth: layer.borderWidth,
              color: layer.color,
              display: layer.maxLines ? "-webkit-box" : "flex",
              fontFamily: layer.fontFamily,
              fontSize: `${clamp(layer.fontSize, 1, 0.5, 40)}cqw`,
              fontStyle: layer.fontStyle,
              fontWeight: layer.fontWeight ?? 700,
              letterSpacing: `${clamp(layer.letterSpacingEm, 0, -0.2, 1)}em`,
              lineHeight: clamp(layer.lineHeight, 0.9, 0.45, 2.5),
              opacity: clamp(layer.opacity, 1, 0, 1),
              padding: layer.paddingPct == null ? undefined : `${clamp(layer.paddingPct, 0, 0, 10)}%`,
              textAlign: layer.align ?? "left",
              textShadow: layer.shadow,
              textTransform: layer.textTransform ?? "none",
              transform: `rotate(${clamp(layer.rotation, 0, -180, 180)}deg)`,
              WebkitBoxOrient: layer.maxLines ? "vertical" : undefined,
              WebkitLineClamp: layer.maxLines,
              WebkitTextStrokeColor: layer.strokeColor,
              WebkitTextStrokeWidth: layer.strokeWidth,
              zIndex: Math.round(clamp(layer.zIndex, 4, -20, 100)),
            }}
          >
            {layer.text}
          </div>
        );
      })}

      <span className="absolute left-1.5 top-1.5 z-[90] bg-black/55 px-1.5 py-1 text-[5px] font-black uppercase tracking-[0.16em] text-white/65 backdrop-blur-sm">
        {format}
      </span>
    </div>
  );
}

function GeneratedDirectionPreview({ choice }: { choice: CocoDirectionChoice }) {
  if (!choice.generatedPreview) return null;

  return (
    <div className="flex items-center justify-center gap-[4%] bg-[#090a0d] p-[4%]">
      <div className="w-[61%]">
        <GeneratedPreviewCanvas
          canvas={choice.generatedPreview.square}
          fallbackBackground={choice.preview}
          fallbackColors={choice.colors}
          format="square"
        />
      </div>
      <div className="w-[34.3%]">
        <GeneratedPreviewCanvas
          canvas={choice.generatedPreview.story}
          fallbackBackground={choice.preview}
          fallbackColors={choice.colors}
          format="story"
        />
      </div>
    </div>
  );
}

function RecipePreviewCanvas({
  choice,
  format,
}: {
  choice: CocoDirectionChoice;
  format: "square" | "story";
}) {
  const exportedSrc = choice.recipePreview?.[format];
  const generatedCanvas = choice.generatedPreview?.[format];

  if (choice.personalizedPreview?.[format]) return <>{choice.personalizedPreview[format]}</>;

  if (!exportedSrc && generatedCanvas) {
    return (
      <GeneratedPreviewCanvas
        canvas={generatedCanvas}
        fallbackBackground={choice.preview}
        fallbackColors={choice.colors}
        format={format}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden border border-white/15 bg-black shadow-[0_16px_35px_rgba(0,0,0,0.48)] ${
        format === "square" ? "aspect-square" : "aspect-[9/16]"
      }`}
    >
      {exportedSrc ? (
        <img
          src={exportedSrc}
          alt={`${choice.name} ${format} recipe preview`}
          className="h-full w-full object-cover"
          draggable={false}
          data-coco-recipe-preview={format}
        />
      ) : null}
      <span className="absolute left-1.5 top-1.5 z-[2] bg-black/55 px-1.5 py-1 text-[5px] font-black uppercase tracking-[0.16em] text-white/75 backdrop-blur-sm">
        {format}
      </span>
    </div>
  );
}

function RecipeExportDirectionPreview({ choice }: { choice: CocoDirectionChoice }) {
  return (
    <div className="flex items-center justify-center gap-[4%] bg-[#090a0d] p-[4%]">
      <div className="w-[61%]">
        <RecipePreviewCanvas choice={choice} format="square" />
      </div>
      <div className="w-[34.3%]">
        <RecipePreviewCanvas choice={choice} format="story" />
      </div>
    </div>
  );
}

function ReferenceDirectionPreview({ choice }: { choice: CocoDirectionChoice }) {
  return (
    <>
      {choice.preview ? (
        <img
          src={choice.preview}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.015]"
          draggable={false}
        />
      ) : (
        <div
          className="h-full w-full"
          style={{
            background: `radial-gradient(circle at 70% 20%, ${choice.colors[2] || "#22d3ee"}55, transparent 34%), linear-gradient(145deg, ${choice.colors[0] || "#08080c"}, ${choice.colors[1] || "#191226"})`,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
      <div className="absolute inset-x-4 bottom-4">
        <div
          className="max-w-[92%] text-3xl font-black uppercase leading-[0.88] tracking-[-0.05em] text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.9)] sm:text-4xl"
          style={choice.headlineFont ? { fontFamily: choice.headlineFont } : undefined}
        >
          {choice.eventName}
        </div>
      </div>
    </>
  );
}

export default function CocoDirectionChooser({ choices, hasMore = false, loadingMore = false, moreError, onMore, onBack, onSelect }: Props) {
  const [previewFormat, setPreviewFormat] = useState<"both" | "square" | "story">("both");
  return (
    <div
      className="coco-conversation fixed inset-0 z-[1100] overflow-y-auto px-4 py-6 text-white sm:px-6 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coco-direction-title"
      data-testid="coco-direction-chooser"
    >
      <div className="mx-auto w-full max-w-6xl">
        <button type="button" onClick={onBack} className="mb-2 text-sm text-white/45">← Back</button>
        <div className="mb-8 text-center coco-question-enter"><CocoOrb compact/>
          <h2 id="coco-direction-title" className="text-xl font-normal tracking-tight sm:text-[22px]">Here are my picks for your event.</h2>
          <p className="mt-3 text-sm text-white/45">Choose the one that feels like you. We’ll make it yours together.</p>
        </div>
        <div className="mb-5 flex justify-center gap-2" role="group" aria-label="Compare flyer formats">
          {([['both', 'Square + Story'], ['square', 'Square'], ['story', 'Story']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={previewFormat === value} onClick={() => setPreviewFormat(value)} className="coco-response !min-h-9 !py-2 !text-xs">{label}</button>)}
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {choices.map((choice) => (
            <article
              key={choice.id}
              aria-label={choice.name}
              className="coco-question-enter group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
              data-coco-direction-id={choice.id}
              data-coco-subject-quality={choice.subjectQuality}
            >
              <div className={`relative overflow-hidden bg-[#0b0c10] ${
                previewFormat === 'both' && (choice.personalizedPreview || choice.recipePreview || choice.generatedPreview)
                  ? ''
                  : previewFormat === 'story' ? 'aspect-[9/16]' : 'aspect-square'
              }`}>
                {previewFormat !== 'both' ? <RecipePreviewCanvas choice={choice} format={previewFormat}/> : choice.personalizedPreview || choice.recipePreview ? (
                  <RecipeExportDirectionPreview choice={choice} />
                ) : choice.generatedPreview ? (
                  <GeneratedDirectionPreview choice={choice} />
                ) : (
                  <ReferenceDirectionPreview choice={choice} />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/42">
                  <span>Square + Story</span>
                  <span>Editable</span>
                </div>
                {Boolean(choice.missingDetails?.length) && <p className="mt-2 text-xs leading-5 text-amber-200" data-testid="coco-direction-missing-details">Needs another text area: {choice.missingDetails!.join(', ')}.</p>}
                {choice.requiresSubjectRetry ? (
                  <div
                    className="mt-3 border border-amber-300/30 bg-amber-300/[0.08] p-3"
                    data-testid={
                      choice.requiresRecipeSubjectConsent
                        ? "coco-recipe-subject-consent"
                        : "coco-subject-retry-required"
                    }
                  >
                    <p className="text-xs font-semibold leading-5 text-amber-100">
                      {choice.previewUsesRecipeSubject
                        ? "Your photo could not make a clean cutout. This preview uses the recipe subject."
                        : "This direction needs a cleaner subject cutout from your photo."}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={onBack}
                        className="min-h-11 border border-amber-200/30 bg-black/20 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-amber-50 transition hover:bg-amber-100/10"
                        data-testid="coco-retry-subject"
                        data-coco-testid-alias="coco-subject-retry"
                      >
                        Try another photo
                      </button>
                      {choice.requiresRecipeSubjectConsent ? (
                        <button
                          type="button"
                          onClick={() => onSelect(choice.id, { approveRecipeSubject: true })}
                          className="min-h-11 bg-amber-200 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-black transition hover:bg-white"
                          data-testid="coco-use-recipe-subject"
                        >
                          Use recipe subject
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <>
                    {choice.offerImproveCutout ? (
                      <div className="mt-3 border border-amber-300/25 bg-amber-300/[0.07] px-3 py-2 text-[11px] leading-5 text-amber-100/85">
                        Your photo is being used. Edge cleanup is available after choosing.
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onSelect(choice.id)}
                      className="coco-response coco-response-primary mt-3 w-full"
                    >
                      Choose this design
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
        {moreError && <p role="status" className="mt-5 text-sm text-amber-200">{moreError}</p>}
        {hasMore && <button type="button" data-testid="coco-more-directions" disabled={loadingMore} onClick={onMore} className="mt-6 min-h-12 w-full border border-cyan-200/40 bg-white/5 px-5 py-3 text-sm font-semibold text-cyan-100 hover:bg-white/10 disabled:opacity-50">{loadingMore ? 'Preparing more designs…' : 'Show more designs'}</button>}
      </div>
    </div>
  );
}
