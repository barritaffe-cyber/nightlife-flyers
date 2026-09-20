import type { CSSProperties } from 'react';

// SVG alpha operations supply actual inset lighting. CSS still controls the
// editable text, colors, gradient light masks, and blend modes.
export function clearGlassFilterMarkup(fontSize = 180, lights: { specular?: number; glow?: number } = {}) {
  const unit = Math.max(1, Number.isFinite(fontSize) ? fontSize : 180) / 180;
  const specularGain = Math.pow(Math.max(0, Math.min(2, lights.specular ?? 1)), 2);
  const glowGain = Math.max(0, Math.min(72, lights.glow ?? 6)) / 6;
  return `<filter id="clear-glass-inner-shadow" x="-20%" y="-30%" width="140%" height="160%" color-interpolation-filters="sRGB">
    <feOffset in="SourceAlpha" dx="${-3 * unit}" dy="${-4 * unit}" result="shift"/>
    <feGaussianBlur in="shift" stdDeviation="${2 * unit}" result="soft"/>
    <feComposite in="SourceAlpha" in2="soft" operator="out" result="inset"/>
    <feFlood flood-color="#030810" flood-opacity=".72"/>
    <feComposite in2="inset" operator="in"/>
  </filter>
  <filter id="clear-glass-inner-glow" x="-20%" y="-30%" width="140%" height="160%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="erode" radius="${2 * unit}" result="core"/>
    <feComposite in="SourceAlpha" in2="core" operator="out" result="rim"/>
    <feGaussianBlur in="rim" stdDeviation="${2.2 * unit}" result="soft"/>
    <feComposite in="soft" in2="SourceAlpha" operator="in" result="inset"/>
    <feFlood flood-color="#eef5ff" flood-opacity=".78"/>
    <feComposite in2="inset" operator="in"/>
  </filter>
  <filter id="clear-glass-highlight" x="-20%" y="-30%" width="140%" height="160%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="erode" radius="${2.5 * unit}" result="core"/>
    <feComposite in="SourceAlpha" in2="core" operator="out" result="rim"/>
    <feGaussianBlur in="rim" stdDeviation="${1.1 * unit}" result="soft"/>
    <feComposite in="soft" in2="SourceAlpha" operator="in" result="inset"/>
    <feFlood flood-color="#f5f9ff" flood-opacity=".95"/>
    <feComposite in2="inset" operator="in"/>
    <!-- Highlight curve: retain clear shadows, lift mids and bright catches. -->
    <feComponentTransfer>
      <feFuncA type="table" tableValues="0 .14 .48 .8 .97 1"/>
    </feComponentTransfer>
  </filter>
  <filter id="clear-glass-specular-gain" x="-20%" y="-30%" width="140%" height="160%" color-interpolation-filters="sRGB">
    <feComponentTransfer><feFuncA type="linear" slope="${specularGain}" intercept="0"/></feComponentTransfer>
  </filter>
  <filter id="clear-glass-glow-gain" x="-20%" y="-30%" width="140%" height="160%" color-interpolation-filters="sRGB">
    <feComponentTransfer><feFuncA type="linear" slope="${glowGain}" intercept="0"/></feComponentTransfer>
  </filter>`;
}

/** The nine reference passes. Drop shadow is listed last but paints behind. */
export function buildClearGlassLayers(options: {
  edge?: number; fill?: number; blur?: number; glow?: number; specular?: number;
  highlight?: string; edgeColor?: string;
} = {}) {
  const em = (px: number) => `${px / 180}em`;
  const edge = Math.max(.5, Math.min(8, options.edge ?? 1.2));
  const fill = Math.max(0, Math.min(.3, options.fill ?? .08));
  const blur = Math.max(0, Math.min(28, options.blur ?? .3));
  const glow = Math.max(0, Math.min(72, options.glow ?? 6));
  const specular = Math.max(0, Math.min(2, options.specular ?? 1));
  const highlight = options.highlight || '#ffffff';
  const tint = options.edgeColor || '#dce2e8';
  const base: CSSProperties = {
    color: 'transparent', WebkitTextFillColor: 'transparent', textShadow: 'none',
    WebkitTextStrokeWidth: 0, backgroundImage: 'none', mixBlendMode: 'normal',
  };
  const layer = (key: string, zIndex: number, style: CSSProperties) => ({
    key, style: { ...base, zIndex, ...style },
  });
  const alphaSource: CSSProperties = { color: '#fff', WebkitTextFillColor: '#fff' };
  // These masks modulate a STROKE, never a filled glyph. The bright core can
  // therefore only land on an outside contour or the edge of a counter.
  const circularLights = [
    'radial-gradient(circle .04em at 18% 11.5%,#000 0%,#000 25%,transparent 100%)',
    'radial-gradient(circle .035em at 40% 78%,#000 0%,#000 25%,transparent 100%)',
    'radial-gradient(circle .04em at 91% 20%,#000 0%,#000 25%,transparent 100%)',
    'radial-gradient(circle .032em at 49% 12%,#000d 0%,#0009 25%,transparent 100%)',
    'radial-gradient(circle .03em at 67.5% 71%,#000c 0%,#0008 25%,transparent 100%)',
    'radial-gradient(circle .032em at 9% 64%,#000c 0%,#0008 25%,transparent 100%)',
  ].join(',');
  const edgeLights = [
    circularLights,
    'radial-gradient(ellipse 17% 3% at 26% 19%,#000 0%,#000b 25%,transparent 100%)',
    'radial-gradient(ellipse 14% 2% at 67% 74%,#000 0%,#0009 25%,transparent 100%)',
    'linear-gradient(118deg,transparent 18%,#0000 25%,#000 28%,#0000 31%,transparent 60%,#0000 70%,#000 73%,#0000 76%,transparent 100%)',
  ].join(',');
  return [
    layer('base-fill', 1, {
      color: `rgba(235,241,248,${fill})`, WebkitTextFillColor: `rgba(235,241,248,${fill})`,
      // Interior reflection gradient and frosting. The Blur control softens
      // this pass at full strength without blurring the bevel or light catches.
      backgroundClip: 'text', WebkitBackgroundClip: 'text',
      backgroundImage: [
        'linear-gradient(155deg,rgba(245,250,255,.18) 0%,rgba(235,243,252,.025) 28%,rgba(245,250,255,.13) 43%,rgba(235,243,252,.025) 53%,rgba(12,22,34,.12) 72%,rgba(245,250,255,.16) 100%)',
        'radial-gradient(ellipse at 24% 28%,rgba(245,249,255,.045),transparent 55%)',
        'radial-gradient(ellipse at 76% 68%,rgba(235,243,252,.035),transparent 52%)',
        'linear-gradient(155deg,rgba(245,249,255,.035),transparent 48%,rgba(235,243,252,.045))',
      ].join(','),
      filter: blur > 0 ? `blur(${em(blur)})` : 'none',
    }),
    layer('inner-shadow', 2, { ...alphaSource, filter: 'url(#clear-glass-inner-shadow)' }),
    layer('bevel-edge', 3, {
      WebkitTextStrokeWidth: em(edge), WebkitTextStrokeColor: 'rgba(222,235,248,.65)',
      filter: `drop-shadow(${em(-.7)} ${em(-1)} 0 rgba(255,255,255,.9)) drop-shadow(${em(1.4)} ${em(2)} ${em(.4)} rgba(0,5,12,.9))`,
    }),
    layer('inner-glow', 4, {
      ...alphaSource, filter: 'url(#clear-glass-inner-glow)', mixBlendMode: 'screen',
    }),
    layer('highlight', 5, {
      ...alphaSource,
      maskImage: [
        'radial-gradient(ellipse 35% 25% at 28% 17%,#000 0%,#000d 28%,#0005 62%,transparent 100%)',
        'radial-gradient(ellipse 20% 18% at 29% 78%,#000 0%,#000a 22%,transparent 100%)',
        'linear-gradient(165deg,#0006 0%,#0002 24%,transparent 44%,transparent 83%,#0004 100%)',
      ].join(','),
      filter: 'url(#clear-glass-highlight) url(#clear-glass-specular-gain)', mixBlendMode: 'plus-lighter', opacity: specular > 0 ? .92 : 0,
    }),
    layer('specular-streak', 6, {
      WebkitTextStrokeWidth: em(edge + .7), WebkitTextStrokeColor: '#fff',
      maskImage: edgeLights,
      filter: `drop-shadow(0 0 ${em(1)} rgba(255,255,255,.9)) url(#clear-glass-specular-gain)`,
      opacity: specular > 0 ? 1 : 0,
      mixBlendMode: 'screen',
    }),
    layer('refraction', 7, {
      WebkitTextStrokeWidth: em(edge + 1.5), WebkitTextStrokeColor: tint,
      transform: `translate(${em(.7)},${em(1.5)})`,
      maskImage: 'linear-gradient(135deg,transparent 12%,#0008 22%,transparent 34%,transparent 56%,#000b 72%,transparent 88%)',
      filter: `blur(${em(.45 + blur * .2)})`, mixBlendMode: 'screen', opacity: .45,
    }),
    layer('outer-glow', 8, {
      WebkitTextStrokeWidth: em(edge + 3), WebkitTextStrokeColor: highlight,
      maskImage: circularLights,
      filter: `blur(${em(.6)}) drop-shadow(0 0 ${em(1.92)} rgba(255,255,255,.95)) drop-shadow(0 0 ${em(5.1)} rgba(255,255,255,.9)) url(#clear-glass-glow-gain)`,
      mixBlendMode: 'screen', opacity: glow > 0 ? 1 : 0,
    }),
    layer('drop-shadow', 0, {
      color: 'rgba(0,0,0,.18)', WebkitTextFillColor: 'rgba(0,0,0,.18)',
      filter: `blur(${em(7)})`, transform: `translateY(${em(8)})`,
    }),
  ];
}
