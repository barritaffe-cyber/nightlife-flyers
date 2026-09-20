import type { CocoRecipeFieldBinding } from './eventBriefFields.ts';

// Only known helper labels are fixed. Event names, offers and slogans stay editable.
const labelOnly = /^(?:p\s*r\s*e\s*s\s*e\s*n\s*t\s*s|tickets?|entry|admission|r\.?s\.?v\.?p\.?|reservations?|dress code|music by|hosted by|doors(?: open)?|starts?(?: at)?)\s*:?$/i;
const numberLabel = /^(?:tickets?|entry|admission|price|r\.?s\.?v\.?p\.?|reservations?|tables?|call|phone)\b/i;
export type CocoInputLine = { reference: string; prefix: string; suffix: string; fixed: boolean };

export function cocoInputLine(reference: string, dressCode = false): CocoInputLine {
  const clean = reference.trim();
  if (dressCode) {
    // Preserve the design's instructions and decorative closing line. Only
    // clothing/style/colour is supplied by the guest, never the whole sentence.
    if (/^(?:attire|let the night shine|good vibes only)$/i.test(clean)) return { reference, prefix: reference, suffix: '', fixed: true };
    const starter = reference.match(/^(\s*(?:dress code\s*:\s*|wear\s+|dress in\s+))(.+)$/i);
    if (starter) return { reference, prefix: starter[1], suffix: '', fixed: false };
    // “Dress to casual” is not grammatical. Use a neutral label for this slot.
    if (/^dress to impress$/i.test(clean)) return { reference, prefix: 'DRESS CODE: ', suffix: '', fixed: false };
  }
  if (labelOnly.test(clean)) return { reference, prefix: reference, suffix: '', fixed: true };
  const presents = reference.match(/^(\S.*?)((?:\s+)p\s*r\s*e\s*s\s*e\s*n\s*t\s*s\s*)$/i);
  if (presents) return { reference, prefix: '', suffix: presents[2], fixed: false };
  // Keep words/currency attached to prices and telephone numbers, but never
  // infer a number-only input for dates, street addresses or a DJ's name.
  if (numberLabel.test(clean) || /[$€£¥]/.test(clean) || /^\d+\s*\+/.test(clean)) {
    const match = reference.match(/^(.*?)(\d(?:[\d\s.,()+-]*\d)?)([^\d]*)$/);
    if (match) return { reference, prefix: match[1], suffix: match[3], fixed: false };
  }
  return { reference, prefix: '', suffix: '', fixed: false };
}

export function cocoInputValue(line: CocoInputLine, value: string, editing = false): string {
  // Controlled inputs must retain unfinished words, including the space just
  // typed after one. Strip only authored helpers while editing; normalize on use.
  if (editing) {
    let draft = value;
    if (line.prefix && draft.toLowerCase().startsWith(line.prefix.toLowerCase())) draft = draft.slice(line.prefix.length);
    else {
      const prefix = line.prefix.trim();
      const words = prefix.replace(/[$€£¥]\s*$/, '').trim();
      if (prefix && draft.toLowerCase().startsWith(prefix.toLowerCase())) draft = draft.slice(prefix.length).trimStart();
      else if (words && draft.toLowerCase().startsWith(words.toLowerCase())) draft = draft.slice(words.length).trimStart();
      if (/[$€£¥]\s*$/.test(prefix)) draft = draft.replace(/^[$€£¥]\s*/, '');
    }
    if (line.suffix && draft.toLowerCase().endsWith(line.suffix.toLowerCase())) draft = draft.slice(0, -line.suffix.length);
    return draft;
  }
  let result = value.trim();
  const prefix = line.prefix.trim();
  const suffix = line.suffix.trim();
  if (prefix && result.toLowerCase().startsWith(prefix.toLowerCase())) result = result.slice(prefix.length).trim();
  const words = prefix.replace(/[$€£¥]\s*$/, '').trim();
  if (words && result.toLowerCase().startsWith(words.toLowerCase())) result = result.slice(words.length).trim();
  // Accept a user who types the currency as well as someone who types only 30.
  if (/[$€£¥]\s*$/.test(prefix)) result = result.replace(/^[$€£¥]\s*/, '');
  if (suffix && result.toLowerCase().endsWith(suffix.toLowerCase())) result = result.slice(0, -suffix.length).trim();
  return result;
}

export function cocoPaintInputLine(line: CocoInputLine, value: string, editing = false): string {
  const input = cocoInputValue(line, value, editing);
  if (!input) return '';
  const prefix = /^free$/i.test(input) ? line.prefix.replace(/[$€£¥]\s*$/, '') : line.prefix;
  return prefix + input + line.suffix;
}

export function cocoFieldLines(binding?: CocoRecipeFieldBinding, maxLines?: number): CocoInputLine[] {
  if (!binding || binding.kind === 'date' || binding.kind === 'qr') return [];
  const references = Object.values(binding.originalText).filter((text): text is string => typeof text === 'string');
  const reference = references.find(text => text.trimEnd().split('\n').length === maxLines) ?? references[0] ?? '';
  const lines = reference.trimEnd().split('\n').map(line => cocoInputLine(line, binding.label === 'Dress code'));
  return lines.some(line => !line.fixed) ? lines : [];
}

/** Replace variable content while retaining only known helper wording. */
export function cocoAuthoredFieldValue(reference: string, value: string, dressCode = false): string {
  if (!value.trim()) return '';
  const lines = reference.split('\n').map(line => cocoInputLine(line, dressCode));
  if (lines.every(line => line.fixed)) return value;
  if (!lines.some(line => line.fixed || line.prefix || line.suffix)) return value;
  const incoming = value.split('\n');
  // Numeric callers may omit a separate fixed label line (TICKETS\n$25).
  const hasLabels = lines.some(line => line.fixed);
  const onlyValues = hasLabels && incoming.length === lines.filter(line => !line.fixed).length;
  let index = 0;
  return lines.map((line, i) => line.fixed ? line.reference : cocoPaintInputLine(line, incoming[onlyValues ? index++ : i] ?? '')).join('\n');
}

export function cocoFieldLineError(label: string, value: string, lines: CocoInputLine[]): string | null {
  if (!value.trim() || lines.length < 2) return null;
  const values = value.split('\n');
  if (lines.some((line, i) => !line.fixed && !cocoInputValue(line, values[i] ?? ''))) {
    return `Fill in each line for ${label}, or clear all its lines to leave it out.`;
  }
  return null;
}
