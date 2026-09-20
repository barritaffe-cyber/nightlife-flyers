/** Resolve the same bound controls and explicit overrides as the editable canvas. */
export function compiledMasterFilter(v: Record<string, any>): string {
  const g = Math.max(.5, Math.min(1.5, v.gamma ?? 1));
  const tint = Number.isFinite(v.tint) ? Math.max(-1, Math.min(1, v.tint)) : 0;
  return [
    `brightness(${((v.exp ?? 1) * (1 + (g - 1) * .6)).toFixed(3)})`,
    `contrast(${((v.contrast ?? 1.08) * (.9 + (g - 1) * .9)).toFixed(3)})`,
    `saturate(${((v.saturation ?? 1.1) + (v.vibrance ?? .15) * .8).toFixed(3)})`,
    `sepia(${Math.max(0, Math.min(1, v.warmth ?? .1)).toFixed(3)})`,
    `hue-rotate(${(tint * 12).toFixed(3)}deg)`,
  ].join(' ');
}

export function compiledObjectValue(overrides: Record<string, any>, fields: Record<string, any>, object: any, property: string, fallback: unknown): any {
  const override = overrides[object.id]?.[property];
  if (override !== undefined) return override;
  // Old projects contain unused placeholders such as "Venue Name". An editor
  // companion stays blank until its input writes an explicit text override.
  if (object.editorCompanion && property === 'text') return '';
  const field = object.binding?.[property];
  const live = fields[field];
  return field && live !== undefined && live !== object.binding?.initial?.[property] ? live : fallback;
}

/** The compiled binding names differ from a few stored editor control names. */
export function compiledPreviewFields(variant: Record<string, any>): Record<string, any> {
  return {
    ...variant,
    headColor: variant.textFx?.color ?? variant.headColor,
    headTracking: variant.textFx?.tracking ?? variant.headTracking,
    head2line: variant.head2line ?? variant.head2,
    head2Tracking: variant.head2Fx?.tracking ?? variant.head2Tracking,
    detailsColor: variant.bodyColor ?? variant.detailsColor,
    detailsSize: variant.bodySize ?? variant.detailsSize,
  };
}

/** Multiple live previews must not share an inline SVG's masks/gradient IDs. */
export function namespaceCompiledSvg(markup: string, namespace: string): string {
  const ids = [...markup.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
  let result = markup;
  for (const id of new Set(ids)) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result
      .replace(new RegExp(`(\\bid=["'])${escaped}(["'])`, 'g'), `$1${namespace}-${id}$2`)
      .replace(new RegExp(`(url\\(\\s*["']?#)${escaped}(["']?\\s*\\))`, 'g'), `$1${namespace}-${id}$2`)
      .replace(new RegExp(`((?:href|xlink:href)=["']#)${escaped}(["'])`, 'g'), `$1${namespace}-${id}$2`);
  }
  return result;
}
