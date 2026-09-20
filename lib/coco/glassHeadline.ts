import type { CSSProperties } from 'react';

export const GLASS_HEADLINE_EFFECT = 'cyan-glass-v1';
export const GLASS_HEADLINE_FONT = '"Bodoni 72", Didot, "Bodoni MT", "Times New Roman", serif';
export const GLASS_HEADLINE_FILL = 'linear-gradient(180deg,rgba(255,255,255,.9) 0%,rgba(126,232,255,.45) 8%,rgba(0,137,204,.10) 25%,rgba(214,250,255,.42) 48%,rgba(0,101,166,.12) 70%,rgba(215,252,255,.78) 94%,rgba(255,255,255,.95) 100%)';

/** CSS lengths scale with the live font size; 330px is the supplied foundation. */
export function glassHeadlineStyles(options: { solidColor?: string; gradient?: string } = {}) {
  const em = (px: number) => `${px / 330}em`;
  const base: CSSProperties = {
    font: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit',
    whiteSpace: 'inherit', textShadow: 'none', pointerEvents: 'none',
    WebkitTextFillColor: 'transparent', color: 'transparent',
  };
  const copy: CSSProperties = { ...base, position: 'absolute', inset: 0 };
  const depth: CSSProperties = {
    ...copy, zIndex: 1, WebkitTextStroke: `${em(7)} rgba(0,167,230,.5)`,
    filter: `blur(${em(.7)}) drop-shadow(0 0 ${em(3)} rgba(0,220,255,.65)) drop-shadow(0 ${em(3)} ${em(2)} rgba(0,55,110,.65))`,
    transform: `translateY(${em(2)})`,
  };
  const bevel: CSSProperties = {
    ...copy, zIndex: 2, WebkitTextStroke: `${em(5)} rgba(92,224,255,.18)`,
    filter: `drop-shadow(${em(2)} 0 0 rgba(255,255,255,.65)) drop-shadow(${em(-3)} 0 0 rgba(0,62,125,.65)) drop-shadow(0 ${em(3)} 0 rgba(0,101,160,.5)) drop-shadow(0 ${em(-2)} 0 rgba(220,253,255,.75))`,
    transform: 'scale(.985)', transformOrigin: 'center',
  };
  const face: CSSProperties = {
    ...base, position: 'relative', display: 'block', zIndex: 3,
    color: options.solidColor || 'rgba(115,225,255,.08)',
    WebkitTextFillColor: options.solidColor || 'rgba(115,225,255,.08)',
    WebkitTextStroke: `${em(2)} rgba(205,250,255,.95)`,
    backgroundImage: options.solidColor ? 'none' : options.gradient || GLASS_HEADLINE_FILL,
    WebkitBackgroundClip: 'text', backgroundClip: 'text',
    filter: `drop-shadow(0 0 ${em(1)} white) drop-shadow(0 0 ${em(4)} rgba(44,221,255,.7)) drop-shadow(0 ${em(5)} ${em(7)} rgba(0,54,95,.5))`,
  };
  const rim: CSSProperties = {
    ...copy, zIndex: 4, WebkitTextStroke: `${em(1)} rgba(255,255,255,.95)`,
    filter: `drop-shadow(${em(1)} 0 0 rgba(171,248,255,.8)) drop-shadow(${em(-1)} 0 0 rgba(0,126,199,.75)) drop-shadow(0 ${em(-2)} ${em(1)} rgba(255,255,255,.55))`,
    opacity: .85,
  };
  return { depth, bevel, face, rim };
}
