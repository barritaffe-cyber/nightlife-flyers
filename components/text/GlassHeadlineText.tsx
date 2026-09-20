import React from 'react';
import { PngGlyphShadowText } from './PngGlyphShadowText';
import { glassHeadlineStyles } from '../../lib/coco/glassHeadline';

/** Four paint passes share one live string and the editor's existing hit layer. */
export function GlassHeadlineText({ text, solidColor, gradient, filter }: {
  text: string;
  solidColor?: string;
  gradient?: string;
  filter?: React.CSSProperties['filter'];
}) {
  const layers = glassHeadlineStyles({ solidColor, gradient });
  return <span data-coco-glass-headline="true" style={{
    position: 'relative', display: 'inline-block', isolation: 'isolate',
    color: 'transparent', WebkitTextFillColor: 'transparent', WebkitTextStroke: 0,
    textShadow: 'none', pointerEvents: 'none',
  }}>
    <PngGlyphShadowText text={text} filter={filter} renderGlyph={glyph =>
      <span style={{position:'relative',display:'inline-block',isolation:'isolate'}}>
        {(['depth', 'bevel', 'face', 'rim'] as const).map(layer =>
          <span key={layer} data-coco-glass-layer={layer} aria-hidden={layer !== 'face' ? true : undefined}
            style={layers[layer]}>{glyph}</span>)}
      </span>
    } />
  </span>;
}
