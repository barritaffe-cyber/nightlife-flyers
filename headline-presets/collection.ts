/** Public collection; retired renderers remain available to saved documents. */
export const HEADLINE_COLLECTION = [
  { id: 'clean', label: 'Clean', group: 'core' },
  { id: 'glass', label: 'Glass', group: 'core' },
  { id: 'metal', label: 'Metal', group: 'core' },
  { id: '3d', label: '3D', group: 'core' },
  { id: 'neon', label: 'Neon', group: 'core' },
  { id: 'outline', label: 'Outline', group: 'core' },
  { id: 'stroke', label: 'Stroke', group: 'core' },
  { id: 'halftone', label: 'Halftone', group: 'specialty' },
  { id: 'kinetic', label: 'Kinetic', group: 'specialty' },
] as const;
export type HeadlinePresetId = typeof HEADLINE_COLLECTION[number]['id'];
export function isHeadlinePresetId(value: unknown): value is HeadlinePresetId {
  return HEADLINE_COLLECTION.some(preset => preset.id === value);
}

type CorePalette = Partial<Record<'primary' | 'secondary' | 'accent' | 'neutral' | 'bgFrom' | 'bgTo', string>>;
const hex = (value: string | undefined, fallback: string) => {
  if (/^#[\da-f]{6}$/i.test(value || '')) return value!;
  if (/^#[\da-f]{3}$/i.test(value || '')) return '#' + value!.slice(1).split('').map(c => c + c).join('');
  return fallback;
};
const mix = (a: string, b: string, weight: number) => '#' + [1, 3, 5].map(i =>
  Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - weight) + parseInt(b.slice(i, i + 2), 16) * weight).toString(16).padStart(2, '0')
).join('');
/** All effects share these roles. No effect-specific color palette or hue substitution. */
export function mapHeadlinePalette(palette: CorePalette = {}) {
  const primary = hex(palette.primary, '#ffffff');
  const secondary = hex(palette.secondary, primary);
  const accent = hex(palette.accent, primary);
  const neutral = hex(palette.neutral, '#ffffff');
  const base = hex(palette.bgFrom, hex(palette.bgTo, '#101018'));
  return {
    face: primary, edge: accent, depth: secondary, highlight: neutral, shadow: base,
    light: mix(primary, neutral, .72), dark: mix(secondary, base, .66),
    stroke: [primary, accent, neutral, secondary, accent],
  };
}
