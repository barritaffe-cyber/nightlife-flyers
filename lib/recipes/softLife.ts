import type { VisualRecipe } from './types.ts';

export const SOFT_LIFE_RECIPE = {
  id: 'soft-life',
  name: 'Soft Life',
  version: 1,
  reference: 'soft-life.nflyer',
  referenceMode: 'visual-inheritance',
  summary: 'Cream and crimson R&B editorial with a dramatic serif SOFT, a sweeping Life script, and independent event details around the supplied fashion photograph.',
  layerStack: [
    'Supplied format-specific cream, rose and fashion photograph.',
    'Editable crimson serif and warm script title.',
    'Independent date, music, admission, dress code and venue copy.',
    'Editable handwritten atmosphere and badge copy.',
  ],
  textZones: [
    { id: 'headline', purpose: 'First title word.', placement: 'Large serif title in the open left field.' },
    { id: 'headline2', purpose: 'Second title word.', placement: 'Sweeping script across the lower title.' },
    { id: 'details', purpose: 'Music, experience, admission and dress code.', placement: 'Left-side information stack.' },
    { id: 'date', purpose: 'Calendar and time.', placement: 'Upper date cluster.' },
    { id: 'venue', purpose: 'Venue and address.', placement: 'Lower-left footer.' },
  ],
  typography: ['High-contrast editorial serif for SOFT.', 'Expressive script for Life.', 'Tracked uppercase support copy and independent serif DJs.'],
  colorGrade: ['Preserve the supplied cream, rose, crimson and warm gold palette.'],
  avoid: ['Flattening editable text into the artwork.', 'Obscuring the face or shoes with event copy.', 'Automatically shrinking saved title sizes to fit unrelated names.'],
  appNotes: ['Square and Story are independently authored.', 'The supplied photograph includes the model; no uploaded portrait is required.', 'Authoritative project: soft-life.nflyer.'],
  runtime: {
    directionId: 'soft-life', compositionPattern: 'center-poster-stack', styleId: 'black-electric',
    formats: { square: { canvas: { width: 1080, height: 1080 } }, story: { canvas: { width: 1080, height: 1920 } } },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> };
