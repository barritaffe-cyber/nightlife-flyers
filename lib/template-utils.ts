import type { TemplateSpec } from './templates';

// Keep this local so we don't fight whatever Format is elsewhere
type KnownFormat = 'square' | 'story';

/**
 * Loads the correct layout (square or story) from a template.
 * Falls back to base layout if that format is not defined.
 */
export function loadTemplate(tpl: TemplateSpec, format: string) {
  // Narrow anything that's not 'story' to 'square' (your UI only exposes these two)
  const fmt: KnownFormat = format === 'story' ? 'story' : 'square';

  const variant =
    (tpl as any).formats?.[fmt] ??
    (tpl as any).formats?.square ??
    tpl.base ??
    {};

  return variant as NonNullable<TemplateSpec['base']>;
}
