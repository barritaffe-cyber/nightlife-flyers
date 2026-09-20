'use client';

import React from 'react';
import vectorData from '../../lib/whimsicalSvgData.json';
import { layoutWhimsicalWord } from '../../lib/whimsicalWordLayout';

/** Editable letter outlines with optional, separated ornaments after typing. */
export function WhimsicalSvgText({ text, color, tracking, filter, textShadow }: {
  text: string;
  color?: string;
  tracking?: number;
  filter?: React.CSSProperties['filter'];
  textShadow?: React.CSSProperties['textShadow'];
}) {
  const root = React.useRef<HTMLSpanElement>(null);
  const [settledText, setSettledText] = React.useState(text);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setSettledText(text), 450);
    return () => window.clearTimeout(timer);
  }, [text]);
  const ornamentsReady = text === settledText || /\s$/.test(text);
  const [style, setStyle] = React.useState({ color: 'currentColor', tracking: 0, uppercase: false, shadow: 'none', italic: false });
  // Parent typography can change without text props changing (case, color,
  // shadow). The equality guard makes this render-time style sync converge.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useLayoutEffect(() => {
    if (!root.current) return;
    const css = getComputedStyle(root.current);
    const next = {
      color: css.color === 'rgba(0, 0, 0, 0)' || css.color === 'transparent' ? '#ffffff' : css.color,
      tracking: (parseFloat(css.letterSpacing) || 0) / (parseFloat(css.fontSize) || 16),
      uppercase: css.textTransform === 'uppercase', shadow: css.textShadow,
      italic: css.fontStyle === 'italic',
    };
    setStyle(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
  });
  const shadow = String(textShadow ?? style.shadow);
  const shadowFilter = shadow === 'none' ? undefined : shadow.split(/,(?![^()]*\))/).map(part => {
    const paint = part.match(/rgba?\([^)]+\)|#[\da-f]+/i)?.[0] ?? '#000';
    const lengths = part.replace(paint, '').trim();
    return `drop-shadow(${lengths} ${paint})`;
  }).join(' ');
  const value = style.uppercase ? text.toUpperCase() : text;
  return <span ref={root} data-whimsical-word-run="true" data-whimsical-settled={ornamentsReady} aria-label={text}
    style={{ display: 'inline-block', maxWidth: 'none', verticalAlign: 'middle' }}>
    {value.replace(/\r\n?/g, '\n').split('\n').map((line, lineIndex) => <span key={lineIndex}
      style={{ display: 'block', whiteSpace: 'pre', lineHeight: 'inherit' }}>
      {line.split(/(\s+)/).map((word, wordIndex) => {
        if (!word || /^\s+$/.test(word)) return <span key={wordIndex} style={{ display: 'inline-block', width: `${word.length*.32}em` }} />;
        const layout = layoutWhimsicalWord(word, vectorData, tracking ?? style.tracking);
        const [, , width, height] = layout.viewBox;
        return <svg key={wordIndex} data-whimsical-svg-word={word} xmlns="http://www.w3.org/2000/svg"
          role="img" aria-label={word} viewBox={layout.viewBox.join(' ')}
          width={`${width/1000}em`} height={`${height/1000}em`}
          style={{ display: 'inline-block', verticalAlign: `${-(layout.viewBox[1]+height)/1000}em`, overflow: 'visible',
            color: color ?? style.color, filter: filter && filter !== 'none' ? filter : shadowFilter,
            transform: style.italic ? 'skewX(-6deg)' : undefined,
            pointerEvents: 'visiblePainted', textShadow: 'none' }}>
          <g fill="currentColor" data-whimsical-letters="true">
            {layout.letters.map(({ char, glyph, transform }, index) => glyph
              ? <path key={index} d={glyph.path} transform={transform} />
              : <text key={index} transform={transform} fontSize="700" textLength="700" lengthAdjust="spacingAndGlyphs" fontFamily="sans-serif">{char}</text>)}
          </g>
          <g fill="currentColor" data-whimsical-flourishes="clear-space" data-whimsical-clearance={layout.clearance}>
            {ornamentsReady && layout.ornaments.map(ornament => <path key={ornament.name} data-whimsical-ornament={ornament.name}
              d={ornament.path} transform={ornament.transform} />)}
          </g>
        </svg>;
      })}
      {!line && <span style={{ display: 'inline-block', height: '1em' }} />}
    </span>)}
  </span>;
}
