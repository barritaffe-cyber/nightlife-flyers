import type { VisualRecipe } from './types.ts';

export const GIRL_CODE_ROSE_RECIPE = {
  id: 'girl-code-rose',
  name: 'Girl Code — Rose',
  version: 1,
  reference: 'girl-code-rose.nflyer',
  referenceMode: 'visual-inheritance',
  summary: 'Rose chrome serif and flowing script lettering with pink smoke, tropical rooftop photography and independent event details.',
  layerStack: [
    'Supplied format-specific pink smoke and rooftop fashion photograph.',
    'Editable rose chrome title and pink script.',
    'Independent date, DJs, music, venue and reservation copy.',
    'Editable handwritten atmosphere copy, rose crown and heart.',
  ],
  textZones: [
    { id: 'headline', purpose: 'First title word.', placement: 'Large metallic serif title above the subject.' },
    { id: 'headline2', purpose: 'Second title word.', placement: 'Flowing pink script line beneath the first word.' },
    { id: 'details', purpose: 'Music and booking details.', placement: 'Left-side information stack.' },
    { id: 'date', purpose: 'Calendar and time.', placement: 'Upper date cluster.' },
    { id: 'venue', purpose: 'Venue and address.', placement: 'Lower-left footer.' },
  ],
  typography: ['Supplied rose chrome glyphs for GIRL.', 'Pink script letterforms for CODE.', 'Tracked uppercase support copy and a serif venue name.'],
  colorGrade: ['Preserve the supplied pink, rose gold and sunset palette.'],
  avoid: ['Flattening editable text into the artwork.', 'Obscuring the face with event copy.', 'Automatically shrinking saved title sizes to fit unrelated names.'],
  appNotes: ['Square and Story are independently authored.', 'The supplied photograph includes the model; no uploaded portrait is required.', 'Authoritative project: girl-code-rose.nflyer.'],
  runtime: {
    directionId: 'girl-code-rose', compositionPattern: 'center-poster-stack', styleId: 'black-electric',
    formats: { square: { canvas: { width: 1080, height: 1080 } }, story: { canvas: { width: 1080, height: 1920 } } },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> };
