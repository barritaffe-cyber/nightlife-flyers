type Value = Record<string, any>;
export type CocoDjFrameSource = {
  document?: Value | null;
  overrides: Record<string, Value>;
  assets: Value[];
  format: 'square' | 'story';
  live: (object: Value, property: string, fallback: unknown) => any;
};
export type CocoFrameTextRun = {
  id: string; text: string; family: string; size: number;
  weight: string; style: string; tracking: number; lineHeight: number;
};
export type CocoDjFrameLayout = {
  boxes: Record<string, { left: number; top: number; width: number; height: number }>;
  hidden: string[];
  text: Record<string, string>;
  restoreFrame: boolean;
};

export function cocoDjFrameRuns(source: CocoDjFrameSource): CocoFrameTextRun[] {
  if (source.document?.id !== 'elite-monday') return [];
  return ['dj', 'special'].flatMap(id => {
    const object = source.document?.objects?.find((o: Value) => o.id === id);
    if (!object || source.overrides[id]?.removed) return [];
    let text = String(source.live(object, 'text', object.text ?? '')).trim();
    // A form-cleared label comes back when its name is edited on the canvas.
    if (id === 'dj' && !text && source.overrides[id]?.cocoFormIsLabel && !source.overrides[id]?.cocoEditorText) text = object.text;
    if (object.typography?.textTransform === 'uppercase') text = text.toUpperCase();
    const live = (key: string, fallback: unknown) => source.live(object, key, fallback);
    return [{ id, text, family: String(live('family', object.typography?.fontFamily ?? 'sans-serif')),
      size: Number(live('size', object.typography?.fontSizePx ?? 16)),
      weight: String(object.typography?.fontWeight ?? 'normal'), style: String(object.typography?.fontStyle ?? 'normal'),
      tracking: Number(live('tracking', object.typography?.letterSpacingEm ?? 0)),
      lineHeight: Number(live('lineHeight', object.typography?.lineHeight ?? 1)) }];
  });
}

/** Layout at the shared 540px canvas size, then let the whole flyer scale. */
export function cocoDjFrameLayout(source: CocoDjFrameSource, measure: (run: CocoFrameTextRun, line: string) => number): CocoDjFrameLayout | null {
  const runs = cocoDjFrameRuns(source);
  if (!runs.length) return null;
  const frame = source.document?.objects?.find((o: Value) => o.id === 'djFrame');
  if (!frame?.bounds) return null;
  const name = runs.find(run => run.id === 'special');
  if (!name?.text) return { boxes: {}, hidden: ['dj', 'featuring', 'djFrame', 'rule'], text: {}, restoreFrame: false };
  const label = runs.find(run => run.id === 'dj');
  const asset = source.assets.find(a => a.cocoCompiledObjectId === 'djFrame');
  const scale = Math.max(.01, Number(asset?.scale ?? 1));
  const canvasHeight = source.format === 'story' ? 960 : 540;
  const widthPct = frame.bounds.width * scale, heightPct = frame.bounds.height * scale;
  const left = asset ? Number(asset.x) - widthPct / 2 : source.overrides.djFrame?.left ?? frame.bounds.x;
  const top = asset ? Number(asset.y) - heightPct / 2 : source.overrides.djFrame?.top ?? frame.bounds.y;
  const paddingX = 6 * scale, paddingY = 4 * scale, gap = label?.text ? 6 * scale : 0;
  const width = (run: CocoFrameTextRun | undefined) => !run?.text ? 0 : Math.max(...run.text.split('\n').map(line => measure(run, line)));
  const height = (run: CocoFrameTextRun | undefined) => !run?.text ? 0 : run.size * run.lineHeight * run.text.split('\n').length;
  const labelWidth = width(label), nameWidth = width(name);
  const labelHeight = height(label), nameHeight = height(name);
  const frameWidth = paddingX * 2 + labelWidth + gap + nameWidth;
  const frameHeight = Math.max(heightPct * canvasHeight / 100, Math.max(labelHeight, nameHeight) + paddingY * 2);
  const boxes: CocoDjFrameLayout['boxes'] = {
    djFrame: { left, top, width: frameWidth / 5.4, height: frameHeight / canvasHeight * 100 },
    special: { left: left + (paddingX + labelWidth + gap) / 5.4,
      top: top + (frameHeight - nameHeight) / 2 / canvasHeight * 100,
      width: nameWidth / 5.4, height: nameHeight / canvasHeight * 100 },
  };
  if (label?.text) boxes.dj = { left: left + paddingX / 5.4,
    top: top + (frameHeight - labelHeight) / 2 / canvasHeight * 100,
    width: labelWidth / 5.4, height: labelHeight / canvasHeight * 100 };
  return { boxes, hidden: [], text: label?.text ? { dj: label.text } : {},
    restoreFrame: Boolean(source.overrides.djFrame?.cocoFormBackdropHidden) };
}
