import React from "react";
import { renderGlyphShadowText } from "../../text/GlyphShadowText";
import type { CocoTypographyStackItem, CocoTypographyStackModel } from "./types";
import type {
  CocoResolvedTypographyZoneSnapshot,
  CocoTypographyZoneModel,
} from "./buildTypographyStackModel";

type TypographyStackProps = {
  className?: string;
  debug?: boolean;
  model: CocoTypographyStackModel;
  onSelectSource?: (source: CocoTypographyStackItem["source"], sources: CocoTypographyStackItem["sources"]) => void;
  style?: React.CSSProperties;
};

export function TypographyStack({ className, debug, model, onSelectSource, style }: TypographyStackProps) {
  const rect = model.rect;

  return (
    <div
      className={className}
      data-coco-stack-pattern={model.composition.patternId}
      data-coco-signature-move={model.signatureMove?.id ?? "none"}
      data-node="cocoTypographyStack"
      data-owned-sources={model.ownedSources.join(",")}
      data-stack-bounds-policy={model.boundsPolicy}
      style={{
        color: "inherit",
        height: `${rect.height}%`,
        left: `${rect.x}%`,
        outline: debug ? "1px dashed rgba(56, 189, 248, 0.9)" : undefined,
        // This box is the stack placeholder - the space the composition
        // director already allocated and clamped against the face zone.
        // Always hidden, not conditional on boundsPolicy: whatever happens
        // to any individual item inside (its own sizing, its own fit), none
        // of it can ever visually escape the placeholder it was given. This
        // is the hard, structural guarantee that content stays inside its
        // own box - the same property a real text frame has in any other
        // design tool.
        overflow: "hidden",
        pointerEvents: "none",
        position: "absolute",
        textAlign: model.alignment,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
        ...style,
      }}
    >
      {(() => {
        // Font sizes and spacing use the editor's 540px-wide design space,
        // matching buildTypographyStackModel's percentage conversion.
        const pxPerPct = model.format === "story" ? 9.6 : 5.4;
        return model.items.map((item) => (
          <TypographyStackItem key={item.id} item={item} pxPerPct={pxPerPct} debug={debug} onSelectSource={onSelectSource} />
        ));
      })()}
    </div>
  );
}

export function TypographyZoneText({
  className,
  debug,
  onResolved,
  onSelectSource,
  zone,
  style,
}: {
  className?: string;
  debug?: boolean;
  onResolved?: (snapshot: CocoResolvedTypographyZoneSnapshot) => void;
  onSelectSource?: (source: CocoTypographyStackItem["source"], sources: CocoTypographyStackItem["sources"]) => void;
  zone: CocoTypographyZoneModel;
  style?: React.CSSProperties;
}) {
  const rect = zone.rect;
  const pxPerPct = zone.format === "story" ? 9.6 : 5.4;
  return (
    <div
      className={className}
      data-node="cocoTypographyZoneText"
      data-coco-zone={zone.zoneId}
      data-owned-sources={zone.ownedSources.join(",")}
      style={{
        color: "inherit",
        height: `${rect.height}%`,
        left: `${rect.x}%`,
        outline: debug ? "1px dashed rgba(56, 189, 248, 0.9)" : undefined,
        overflow: "hidden",
        pointerEvents: "none",
        position: "absolute",
        textAlign: zone.alignment,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
        ...style,
      }}
    >
      <TypographyStackItem
        item={zone.item}
        pxPerPct={pxPerPct}
        debug={debug}
        onSelectSource={onSelectSource}
        onResolved={onResolved
          ? ({ fontSize, glyphRect }) =>
              onResolved({
                fontSize,
                glyphRect,
                lineHeight: Number(zone.item.style.lineHeight ?? 1) || 1,
                text: zone.item.text,
                zoneId: zone.zoneId,
                zoneRect: zone.rect,
              })
          : undefined}
        zoneRect={zone.rect}
      />
    </div>
  );
}

function TypographyStackItem({
  item,
  pxPerPct,
  debug,
  onResolved,
  onSelectSource,
  zoneRect,
}: {
  item: CocoTypographyStackItem;
  pxPerPct: number;
  debug?: boolean;
  onResolved?: (value: { fontSize: number; glyphRect: CocoTypographyZoneModel["rect"] }) => void;
  onSelectSource?: (source: CocoTypographyStackItem["source"], sources: CocoTypographyStackItem["sources"]) => void;
  zoneRect?: CocoTypographyZoneModel["rect"];
}) {
  const style = item.style;
  const itemRef = React.useRef<HTMLDivElement | null>(null);
  const baseFontSize = Math.max(1, Number(style.fontSize) || 1);
  const [renderedFontSize, setRenderedFontSize] = React.useState(baseFontSize);
  const textShadow = stackTextShadow(style.shadow, item.effects);
  const textTransform =
    style.textTransform === "uppercase"
      ? "uppercase"
      : style.textTransform === "titlecase"
      ? "capitalize"
      : "none";

  React.useLayoutEffect(() => {
    setRenderedFontSize(baseFontSize);
  }, [
    baseFontSize,
    item.text,
    item.maxWidthRatio,
    item.rotationDeg,
    style.fontFamily,
    style.fontWeight,
    style.letterSpacingEm,
    style.lineHeight,
  ]);

  React.useLayoutEffect(() => {
    if (!onResolved || !zoneRect) return;
    const node = itemRef.current;
    const parent = node?.parentElement;
    if (!node || !parent) return;
    const frame = window.requestAnimationFrame(() => {
      const parentRect = parent.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(node);
      const ink = range.getBoundingClientRect();
      range.detach();
      if (parentRect.width <= 0 || parentRect.height <= 0 || ink.width <= 0 || ink.height <= 0) return;
      onResolved({
        fontSize: renderedFontSize,
        glyphRect: {
          x: zoneRect.x + (ink.left - parentRect.left) / parentRect.width * zoneRect.width,
          y: zoneRect.y + (ink.top - parentRect.top) / parentRect.height * zoneRect.height,
          width: ink.width / parentRect.width * zoneRect.width,
          height: ink.height / parentRect.height * zoneRect.height,
          align: zoneRect.align,
        },
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [item.text, onResolved, renderedFontSize, style.fontFamily, style.lineHeight, zoneRect]);

  React.useLayoutEffect(() => {
    const node = itemRef.current;
    const parent = node?.parentElement;
    if (!node || !parent) return;
    const isIndependentZone = parent.dataset.node === "cocoTypographyZoneText";
    if (item.kind !== "headline" && !isIndependentZone) return;

    const fitRenderedHeadline = () => {
      const itemRect = node.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(node);
      const inkRect = range.getBoundingClientRect();
      range.detach();
      const availableHeight = Math.max(1, parentRect.bottom - itemRect.top);
      // CSS line boxes are not the same as painted font ink. Display faces
      // with tight line-height can report a box that fits while their real
      // ascenders/descenders still cross the zone boundary. Fit against the
      // Range ink bounds as well as scroll/client dimensions.
      const inkOverflowsHeight =
        inkRect.top < parentRect.top - 0.5 || inkRect.bottom > parentRect.bottom + 0.5;
      const inkOverflowsWidth =
        inkRect.left < parentRect.left - 0.5 || inkRect.right > parentRect.right + 0.5;
      const heightRatio = Math.min(
        itemRect.height > availableHeight ? availableHeight / itemRect.height : 1,
        inkOverflowsHeight ? parentRect.height / Math.max(1, inkRect.height) : 1
      );
      const widthRatio = Math.min(
        node.scrollWidth > node.clientWidth + 0.5
          ? node.clientWidth / Math.max(1, node.scrollWidth)
          : 1,
        inkOverflowsWidth ? parentRect.width / Math.max(1, inkRect.width) : 1
      );
      const ratio = Math.min(heightRatio, widthRatio);
      if (ratio < 0.995) {
        setRenderedFontSize((current) => {
          const next = Math.max(10, Math.floor(current * ratio * 0.98));
          return next < current ? next : current;
        });
        return;
      }
      // Capacity measurement may use fallback font metrics before the real
      // display face loads. A result can therefore be far too small while
      // still technically fitting. Independent headline zones must fit in
      // both directions: grow real glyph ink toward the allocated frame,
      // then stop at its width or height boundary.
      if (item.kind === "headline" && isIndependentZone && inkRect.width > 0 && inkRect.height > 0) {
        const widthGrowth = parentRect.width * 0.86 / inkRect.width;
        const heightGrowth = parentRect.height * 0.9 / inkRect.height;
        const growth = Math.min(widthGrowth, heightGrowth);
        if (growth > 1.045) {
          setRenderedFontSize((current) => {
            const ceiling = Math.max(baseFontSize, baseFontSize * 2.5);
            return Math.min(ceiling, Math.ceil(current * Math.min(1.3, growth * 0.98)));
          });
        }
      }
    };

    fitRenderedHeadline();
    const frame = window.requestAnimationFrame(fitRenderedHeadline);
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(fitRenderedHeadline)
      : null;
    observer?.observe(node);
    observer?.observe(parent);
    void document.fonts?.ready.then(fitRenderedHeadline);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [
    baseFontSize,
    item.kind,
    item.text,
    item.maxWidthRatio,
    item.rotationDeg,
    renderedFontSize,
    style.fontFamily,
    style.fontWeight,
    style.letterSpacingEm,
    style.lineHeight,
  ]);

  const itemWidth = `${Math.round(item.maxWidthRatio * 100)}%`;
  const safeFontFamilies = String(style.fontFamily || "")
    .split(",")
    .map((family) => family.trim())
    .filter(
      (family) => family.replace(/^['"]|['"]$/g, "").toLowerCase() !== "inter"
    );
  const safeFontFamily = safeFontFamilies.length
    ? safeFontFamilies.join(", ")
    : "LEMONMILK-Regular, sans-serif";
  // measuredRect.height is the builder's ink-aware flow height in canvas
  // percentage space. Reserve it in normal DOM flow so visible headline ink
  // can extend outside its CSS line box without painting through the next
  // metadata row. A live headline may shrink after fonts load; min-height is
  // intentionally conservative in that case and keeps preview/export stable.
  const modeledFlowHeightPx = item.measuredRect
    ? Math.max(0, Number(item.measuredRect.height) * pxPerPct)
    : 0;
  const commonStyle: React.CSSProperties = {
    backgroundBlendMode: style.backgroundBlendMode,
    backgroundImage: style.backgroundImage,
    backgroundPosition: style.backgroundPosition ?? (style.backgroundImage ? "center" : undefined),
    backgroundRepeat: style.backgroundImage ? "no-repeat" : undefined,
    backgroundSize: style.backgroundSize ?? (style.backgroundImage ? "cover" : undefined),
    boxSizing: "border-box",
    color: style.transparentFill ? "transparent" : style.color,
    display: "block",
    fontFamily: safeFontFamily,
    fontSize: item.kind === "headline" ? renderedFontSize : style.fontSize,
    fontStyle: style.fontStyle ?? "normal",
    fontWeight: style.fontWeight ?? 700,
    letterSpacing: `${style.letterSpacingEm ?? 0}em`,
    lineHeight: style.lineHeight ?? 1,
    marginLeft: item.align === "right" || item.align === "center" ? "auto" : 0,
    marginRight: item.align === "center" ? "auto" : 0,
    marginTop: item.spacingBeforePct ? `${item.spacingBeforePct * pxPerPct}px` : 0,
    maxWidth: itemWidth,
    minHeight: modeledFlowHeightPx > 0 ? `${modeledFlowHeightPx}px` : undefined,
    opacity: style.opacity ?? 1,
    // Outlines the item's declared CSS box (the "text box").
    outline: debug ? "1px dashed rgba(250, 204, 21, 0.95)" : undefined,
    outlineOffset: debug ? "-1px" : undefined,
    // Real text container, like every other editing program's text box:
    // this box now actually holds its contents instead of only estimating
    // a font size and hoping nothing overflows. Font-size fitting upstream
    // still picks a size meant to fit, but this is the hard guarantee - if
    // that estimate is ever wrong, the box clips its own overflow instead
    // of the glyphs bleeding onto whatever is behind it (a face, another
    // text block, etc).
    // A font's painted ascenders/descenders can extend beyond its CSS line
    // box. The outer stack is already the fitted clipping boundary; hiding
    // overflow again on the headline item clips legitimate glyph ink before
    // it reaches that boundary.
    overflow: "visible",
    paintOrder: style.strokeWidth ? "stroke fill" : undefined,
    textAlign: item.align,
    textShadow: item.kind === "headline" ? "none" : textShadow,
    textTransform,
    transform: stackItemTransform(item, pxPerPct),
    transformOrigin:
      item.align === "right" ? "100% 50%" : item.align === "center" ? "50% 50%" : "0% 50%",
    // Preserve authored newlines; a narrow text box must not introduce lines.
    whiteSpace: "pre",
    // Headline fills the full given space (fitHeadlineToContent scales its
    // font size to match this width, rather than sizing the box to the
    // text) - a real flyer headline should be big and fill its column, not
    // a small box hugging short text with empty space beside it.
    width: itemWidth,
    wordBreak: "normal",
    overflowWrap: "normal",
    WebkitBackgroundClip: style.backgroundImage ? "text" : undefined,
    backgroundClip: style.backgroundImage ? "text" : undefined,
    WebkitTextFillColor: style.transparentFill ? "transparent" : style.color,
    WebkitTextStrokeColor: style.strokeColor,
    WebkitTextStrokeWidth: style.strokeWidth ? `${style.strokeWidth}px` : undefined,
  };

  return (
    <div
      ref={itemRef}
      data-node={
        item.kind === "headline"
          ? "headline"
          : item.kind === "accent"
          ? "headline2"
          : undefined
      }
      data-coco-stack-item={item.kind}
      data-coco-stack-source={item.source}
      data-coco-stack-sources={item.sources.join(",")}
      data-visual-power={item.visualPower}
      onClick={onSelectSource ? (event) => {
        event.stopPropagation();
        onSelectSource(item.source, item.sources);
      } : undefined}
      onPointerDown={onSelectSource ? (event) => {
        event.stopPropagation();
        onSelectSource(item.source, item.sources);
      } : undefined}
      style={{
        ...commonStyle,
        cursor: onSelectSource ? "pointer" : commonStyle.cursor,
        pointerEvents: onSelectSource ? "auto" : commonStyle.pointerEvents,
      }}
    >
      {(style.fontFamily?.includes('Whimsical SVG') || item.kind === "headline" && textShadow !== "none")
        ? renderGlyphShadowText(item.text, {
            fontFamily: style.fontFamily,
            keyPrefix: `coco-stack-${item.id}`,
            textShadow,
          })
        : item.text}
    </div>
  );
}

function stackItemTransform(item: CocoTypographyStackItem, pxPerPct: number) {
  const transforms = [];
  const x = Number(item.offsetXPct ?? 0);
  const y = Number(item.offsetYPct ?? 0);
  const rotation = Number(item.rotationDeg ?? 0);
  // offsetXPct/offsetYPct are canvas percentage points everywhere else in
  // the composition model. CSS percentage translations are relative to the
  // item's own dimensions, so using "%" here put the rendered item in a
  // different place from the rect checked against the face zone.
  if (x || y) transforms.push(`translate(${x * pxPerPct}px, ${y * pxPerPct}px)`);
  if (rotation) transforms.push(`rotate(${rotation}deg)`);
  return transforms.length ? transforms.join(" ") : undefined;
}

function stackTextShadow(
  baseShadow: string | undefined,
  effects: CocoTypographyStackItem["effects"]
) {
  const shadows = [];
  if (baseShadow && baseShadow !== "none") shadows.push(baseShadow);
  const boost = Math.max(0, Number(effects?.glowBoost ?? 0));
  if (boost > 0) shadows.push(`0 0 ${Math.round(boost * 24)}px currentColor`);
  if (effects?.softBloom) shadows.push("0 0 18px currentColor");
  return shadows.length ? shadows.join(", ") : "none";
}
