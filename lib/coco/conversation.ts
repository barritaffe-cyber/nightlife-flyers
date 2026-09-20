import type { CocoRecipeFormCapabilities } from './formRecipeMapping.ts';
import type { CocoEventBriefInput } from './eventBriefFields.ts';
import { cocoFieldLines, cocoFieldLineError } from './formFieldLayout.ts';
export type CocoQuestion = { id: string; prompt: string; fields: string[] };
const prompts: Record<string, string> = {
  date: 'When is it happening?', startTime: 'What time should everyone arrive?', endTime: 'When does the night end?',
  venueName: 'Where are we meeting?', address: 'What’s the address?', presenterName: 'Who’s bringing everyone together?',
  djs: 'Who’s on the decks?', hosts: 'Who’s hosting?', performers: 'Who’s performing?', musicPolicy: 'What will we be listening to?',
  subtitle: 'What’s your event’s tagline?', dressCode: 'What should everyone wear?', entryFee: 'What’s the entry price?',
  ageRequirement: 'Is there an age requirement?', eventDetails: 'What else should your guests know?',
  socials: 'Where can people follow you?', socialPlatforms: 'Which social platforms should I show?', rsvpContact: 'How can guests book or get in touch?',
  ticketLink: 'Where can guests get tickets?', website: 'Do you have a website to share?', qrDestination: 'Where should the QR code take people?',
  qrLabel: 'What should the QR code say?', mainPromotion: 'What’s the special offer?', drinkSpecials: 'Any drink specials?',
};
export function cocoQuestions(capabilities: CocoRecipeFormCapabilities): CocoQuestion[] {
  const fields = [...capabilities.fields];
  if (capabilities.fieldFormats.socialPlatforms?.length) fields.push('socialPlatforms');
  const ordered = [...new Set(['date', 'startTime', 'endTime', 'venueName', 'address', 'djs', 'musicPolicy', ...fields])].filter(f => fields.includes(f));
  return ordered.filter(field => field !== 'socialPlatforms' || !fields.includes('socials')).map(field => ({ id: field, fields: field === 'socials' && fields.includes('socialPlatforms') ? ['socials', 'socialPlatforms'] : [field], prompt: prompts[field] ?? `What should I put for ${(capabilities.bindings[field]?.label ?? field).toLowerCase()}?` }));
}
export function cocoQuestionCapabilities(cap: CocoRecipeFormCapabilities, fields: string[]): CocoRecipeFormCapabilities {
  const pick = <T,>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).filter(([key]) => fields.includes(key)));
  return { fields: cap.fields.filter(f => fields.includes(f)), bindings: pick(cap.bindings), limits: pick(cap.limits), fieldFormats: pick(cap.fieldFormats), byFormat: { square: pick(cap.byFormat.square), story: pick(cap.byFormat.story) } };
}
export function cocoQuestionError(brief: CocoEventBriefInput, cap: CocoRecipeFormCapabilities, fields: string[]): string | null {
  for (const field of fields) {
    const binding = cap.bindings[field], limit = cap.limits[field];
    if (!binding || !limit) continue;
    const value = String((brief as Record<string, unknown>)[field] ?? '');
    const error = cocoFieldLineError(binding.label, value, cocoFieldLines(binding, limit.maxLines));
    if (error) return error;
    if (value.length > limit.maxLength || value.split('\n').length > limit.maxLines) return `Shorten ${binding.label.toLowerCase()} to fit this design.`;
  }
  return null;
}
export const COCO_CONVERSATION_GRADES = [
  { id: 'original', label: 'Original', filter: 'none', values: null },
  { id: 'gold', label: 'Golden', filter: 'sepia(.22) saturate(1.08)', values: { exp: 1.02, contrast: 1.10, saturation: 1.05, warmth: .35, tint: .1, grain: .10, gamma: .95, filmGrade: .5, vibrance: .1 } },
  { id: 'cyber', label: 'Electric', filter: 'saturate(1.35) hue-rotate(-12deg)', values: { exp: 1.05, contrast: 1.15, saturation: 1.25, warmth: 0, tint: -.5, grain: .15, gamma: 1, filmGrade: .55, vibrance: .25 } },
  { id: 'noir', label: 'Noir', filter: 'grayscale(1) contrast(1.15)', values: { exp: 1.1, contrast: 1.25, saturation: 0, warmth: .1, tint: 0, grain: .35, gamma: 1.1, filmGrade: .65, vibrance: 0 } },
] as const;
export const COCO_GRADE_KEYS = ['exp', 'contrast', 'saturation', 'warmth', 'tint', 'grain', 'gamma', 'filmGrade', 'vibrance'] as const;
