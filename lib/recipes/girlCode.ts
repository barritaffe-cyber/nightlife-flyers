import type { VisualRecipe } from './types.ts';

export const GIRL_CODE_RECIPE = {
  id: 'girl-code',
  name: 'Girl Code',
  version: 1,
  reference: 'girl-code.nflyer',
  referenceMode: 'visual-inheritance',
  summary: 'Gold and white painted brush lettering with neon smoke, tropical rooftop photography and independent event details.',
  layerStack: [
    'Supplied format-specific green smoke and rooftop fashion photograph.',
    'Editable gold and white brush title.',
    'Independent date, DJs, music, venue and reservation copy.',
    'Editable handwritten atmosphere copy, gold crown and heart.',
  ],
  textZones: [
    { id: 'headline', purpose: 'First title word.', placement: 'Large painted brush title above the subject.' },
    { id: 'headline2', purpose: 'Second title word.', placement: 'White painted brush line beneath the first word.' },
    { id: 'details', purpose: 'Music and booking details.', placement: 'Left-side information stack.' },
    { id: 'date', purpose: 'Calendar and time.', placement: 'Upper date cluster.' },
    { id: 'venue', purpose: 'Venue and address.', placement: 'Lower-left footer.' },
  ],
  typography: ['Textured brush letterforms for GIRL.', 'White brush letterforms for CODE.', 'Tracked uppercase support copy and a serif venue name.'],
  colorGrade: ['Preserve the supplied green, black and warm gold palette.'],
  avoid: ['Flattening editable text into the artwork.', 'Obscuring the face with event copy.', 'Automatically shrinking saved title sizes to fit unrelated names.'],
  appNotes: ['Square and Story are independently authored.', 'The supplied photograph includes the model; no uploaded portrait is required.', 'Authoritative project: girl-code.nflyer.'],
  runtime: {
    directionId: 'girl-code', compositionPattern: 'center-poster-stack', styleId: 'black-electric',
    formats: { square: { canvas: { width: 1080, height: 1080 } }, story: { canvas: { width: 1080, height: 1920 } } },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> };
