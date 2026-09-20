import React from "react";
import { WhimsicalSvgText } from './WhimsicalSvgText';

/** Paint each textured glyph with its shadow in sequence, like the gradient renderer. */
export function TexturedGlyphShadowText({ text, textureStyle, filter, textShadow, tracking = 0 }: {
  text: string;
  textureStyle: React.CSSProperties;
  color: string;
  filter?: React.CSSProperties["filter"];
  textShadow?: React.CSSProperties["textShadow"];
  tracking?: number;
}) {
  const root = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    let cancelled = false;
    const alignTexture = () => {
      if (cancelled) return;
      const position = String(textureStyle.backgroundPosition || "0% 0%").split(/\s+/);
      for (const glyph of Array.from(element.children) as HTMLElement[]) {
        // Offset the repeating texture back to the word's origin, rather than
        // restarting the texture at the left edge of every letter.
        const axis = (base: string, offset: number, extra: number) => {
          const percent = /^(-?[\d.]+)%$/.exec(base);
          return percent ? `${Number(percent[1]) / 100 * extra - offset}px`
            : `calc(${base} - ${offset}px)`;
        };
        glyph.style.backgroundPosition = `${axis(position[0], glyph.offsetLeft, element.clientWidth - glyph.offsetWidth)} ${axis(position[1] || "50%", glyph.offsetTop, element.clientHeight - glyph.offsetHeight)}`;
      }
    };
    alignTexture();
    const observer = new ResizeObserver(alignTexture);
    observer.observe(element);
    for (const glyph of Array.from(element.children)) observer.observe(glyph);
    void document.fonts.ready.then(alignTexture);
    return () => { cancelled = true; observer.disconnect(); };
  }, [text, tracking, textureStyle.backgroundPosition, textureStyle.backgroundSize]);
  // Keep the full glyph paint box; tracking changes its advance via margin.
  // Negative letter-spacing would clip the texture at the glyph's right edge.
  return <span ref={root} style={{ display: "block", position: "relative", letterSpacing: 0 }}>
    {Array.from(text).map((glyph, index) => /\s/u.test(glyph) && glyph !== " " ? glyph : (
      <span key={index} data-headline-shadow-glyph={index} data-headline-texture-paint="true"
        style={{ ...textureStyle, display: "inline-block", letterSpacing: 0,
          marginRight: `${tracking}em`, filter, textShadow }}>
        {glyph === " " ? "\u00a0" : glyph}
      </span>
    ))}
  </span>;
}

export type GlyphShadowTextOptions = {
  fontFamily?: string;
  filter?: React.CSSProperties["filter"];
  keyPrefix: string;
  textShadow?: React.CSSProperties["textShadow"];
};

/** Paints editable headline shadows on the visible letters, not the text box. */
export function renderGlyphShadowText(
  value: string,
  { filter, keyPrefix, textShadow, fontFamily }: GlyphShadowTextOptions,
) {
  // Word-boundary alternates must be shaped as a complete run. Splitting this
  // script into letter spans would incorrectly add a flourish to every letter.
  if (fontFamily?.split(',')[0].trim().replace(/^["']|["']$/g, '') === "Whimsical SVG")
    return <WhimsicalSvgText text={value} filter={filter} textShadow={textShadow} />;
  return Array.from(value || "\u00a0").map((glyph, glyphIndex) => {
    if (/\s/u.test(glyph) && glyph !== " ") return glyph;

    return (
      <span
        key={`${keyPrefix}-glyph-${glyphIndex}`}
        data-headline-shadow-glyph={glyphIndex}
        style={{
          display: "inline-block",
          filter,
          textShadow,
        }}
      >
        {glyph === " " ? "\u00a0" : glyph}
      </span>
    );
  });
}
