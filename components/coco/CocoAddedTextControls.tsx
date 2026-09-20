'use client';

import { Chip, ColorDot, InlineSliderInput, Stepper } from '../editor/controls';
import { FontPicker } from '../editor/FontPicker';
import type { CocoAddedTextAppearance } from '../../lib/coco/editorTextObjects';

type TextControls = {
  text: string; font: string; fonts: string[];
  size: number; sizeMin: number; sizeMax: number; sizeStep: number;
  lineHeight: number; lineMin: number; lineMax: number; lineStep: number;
  color?: string; rotation?: number;
  onText?: (value: string) => void; onFont?: (value: string) => void;
  onSize?: (value: number) => void; onLine?: (value: number) => void;
  onColor?: (value: string) => void; onRotate?: (value: number) => void;
};
type AppearanceProps = {
  appearance: CocoAddedTextAppearance;
  onAppearance: (patch: Partial<CocoAddedTextAppearance>) => void;
};

export function CocoAddedTextAppearanceControls({ appearance: a, onAppearance, showTracking = false }: AppearanceProps & { showTracking?: boolean }) {
  return <div className="space-y-3 border-t border-neutral-800 pt-3" data-testid="coco-added-text-appearance">
    <div className="flex flex-wrap items-center gap-2">
      <Chip small active={a.uppercase} onClick={() => onAppearance({ uppercase: !a.uppercase })}>Upper</Chip>
      <Chip small active={a.bold} onClick={() => onAppearance({ bold: !a.bold })}>Bold</Chip>
      <Chip small active={a.italic} onClick={() => onAppearance({ italic: !a.italic })}>Italic</Chip>
      <Chip small active={a.shadowEnabled} onClick={() => onAppearance({ shadowEnabled: !a.shadowEnabled })}>Shadow</Chip>
    </div>
    {showTracking && <Stepper label="Spacing" value={a.tracking} setValue={tracking => onAppearance({ tracking })} min={-.1} max={.5} step={.01} digits={2} displayScale={1} />}
    <div className="grid grid-cols-2 gap-3">
      <div data-added-control="shadow"><Stepper label="Shadow strength" value={a.shadowStrength} setValue={shadowStrength => onAppearance({ shadowStrength })} min={0} max={8} step={.1} digits={1} displayScale={1} disabled={!a.shadowEnabled} /></div>
      <div data-added-control="opacity"><Stepper label="Opacity" value={a.opacity} setValue={opacity => onAppearance({ opacity })} min={0} max={1} step={.01} displayScale={100} suffix="%" /></div>
    </div>
  </div>;
}

/** Added objects use their own values with the controls of the current editor. */
export default function CocoAddedTextControls({ controls: c, align, onAlign, advanced = false, appearance, onAppearance }: AppearanceProps & {
  controls: TextControls;
  align: string;
  onAlign: (value: 'left' | 'center' | 'right') => void;
  advanced?: boolean;
}) {
  const sample = c.text.trim().replace(/\s+/g, ' ').slice(0, 48) || 'Aa Bb 123';
  const textField = <label className="block text-[11px] text-neutral-400">Text
    <textarea data-testid="coco-canvas-text" className="mt-1 w-full rounded border border-neutral-700 bg-[#17171b] p-2 text-sm text-white" rows={3} placeholder="Your text" value={c.text} onChange={e => c.onText?.(e.target.value)} />
  </label>;
  const fontPicker = <FontPicker label="Font" value={c.font} options={c.fonts} onChange={font => c.onFont?.(font)} sample={sample} previewMode="text" />;
  if (advanced) return <div className="space-y-4" data-testid="coco-added-text-controls" data-editor-mode="advanced">
    {fontPicker}
    {textField}
    <div className="grid grid-cols-2 gap-3">
      <div data-added-control="size"><Stepper label="Size" value={c.size} setValue={value => c.onSize?.(value)} min={c.sizeMin} max={c.sizeMax} step={c.sizeStep} /></div>
      <div data-added-control="tracking"><Stepper label="Spacing" value={appearance.tracking} setValue={tracking => onAppearance({ tracking })} min={-.1} max={.5} step={.01} digits={2} displayScale={1} /></div>
      <div data-added-control="leading"><Stepper label="Leading" value={c.lineHeight} setValue={value => c.onLine?.(value)} min={c.lineMin} max={c.lineMax} step={c.lineStep} digits={2} displayScale={1} /></div>
      <div data-added-control="rotation"><Stepper label="Rotate" value={c.rotation ?? 0} setValue={value => c.onRotate?.(value)} min={-360} max={360} step={1} /></div>
    </div>
    <div className="flex items-center justify-between text-[11px] text-neutral-400"><span>Color</span><ColorDot title="Text color" value={c.color ?? '#ffffff'} onChange={value => c.onColor?.(value)} /></div>
    <CocoAddedTextAppearanceControls appearance={appearance} onAppearance={onAppearance} />
  </div>;
  return <div className="space-y-4" data-testid="coco-added-text-controls" data-editor-mode="simple">
    {textField}
    {fontPicker}
    <div className="flex items-center justify-between text-sm"><span>Color</span><ColorDot title="Text color" value={c.color ?? '#ffffff'} onChange={value => c.onColor?.(value)} /></div>
    <InlineSliderInput label="Size" value={c.size} min={c.sizeMin} max={c.sizeMax} step={c.sizeStep} precision={0} onChange={value => c.onSize?.(value)} />
    <div className="flex gap-2" role="group" aria-label="Text alignment">
      {(['left', 'center', 'right'] as const).map(value => <button key={value} type="button" aria-pressed={align === value} onClick={() => onAlign(value)} className={`min-h-10 flex-1 rounded border text-xs capitalize ${align === value ? 'border-cyan-200/50 bg-cyan-200/10 text-cyan-100' : 'border-white/15 text-neutral-300'}`}>{value}</button>)}
    </div>
    <details className="text-sm">
      <summary className="cursor-pointer text-neutral-300">Spacing & rotation</summary>
      <div className="mt-3 space-y-3">
        <InlineSliderInput label="Line spacing" value={c.lineHeight} min={c.lineMin} max={c.lineMax} step={c.lineStep} precision={2} displayScale={1} onChange={value => c.onLine?.(value)} />
        <InlineSliderInput label="Rotation" value={c.rotation ?? 0} min={-180} max={180} step={1} precision={0} onChange={value => c.onRotate?.(value)} />
      </div>
    </details>
  </div>;
}
