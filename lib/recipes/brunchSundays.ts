import type { VisualRecipe } from './types.ts';

export const BRUNCH_SUNDAYS_RECIPE = {
  id: 'brunch-sundays',
  name: 'Brunch Sundays',
  version: 1,
  reference: 'brunch-sundays.nflyer',
  referenceMode: 'visual-inheritance',
  summary: 'White whimsical script with turquoise depth, a yellow Sunday ribbon and pink brunch photography.',
  layerStack: [
    'Supplied format-specific pink brunch restaurant photograph.',
    'Editable Whimsical SVG title and Sunday ribbon.',
    'Independent date, DJs, brunch package, venue, booking and age copy.',
    'Editable handwritten atmosphere and mug copy, plus a mimosa illustration.',
  ],
  textZones: [
    { id: 'headline', purpose: 'First title word.', placement: 'Large flowing script above the subject.' },
    { id: 'headline2', purpose: 'Second title word.', placement: 'Pink uppercase text on a yellow ribbon.' },
    { id: 'details', purpose: 'Brunch package and booking details.', placement: 'Centered footer beneath the food.' },
    { id: 'date', purpose: 'Calendar and time.', placement: 'Upper date cluster.' },
    { id: 'venue', purpose: 'Venue and address.', placement: 'Centered footer.' },
  ],
  typography: ['Whimsical SVG with separated flourishes.', 'Bold uppercase offer text.', 'Tracked support copy and a serif venue name.'],
  colorGrade: ['Preserve the supplied pink, teal, ivory and yellow palette.'],
  avoid: ['Flattening editable text into the artwork.', 'Obscuring the face with event copy.', 'Automatically shrinking saved title sizes to fit unrelated names.'],
  appNotes: ['Square and Story are independently authored.', 'The supplied photograph includes the model; no uploaded portrait is required.', 'Authoritative project: brunch-sundays.nflyer.'],
  runtime: {
    directionId: 'brunch-sundays', compositionPattern: 'center-poster-stack', styleId: 'black-electric',
    formats: { square: { canvas: { width: 1080, height: 1080 } }, story: { canvas: { width: 1080, height: 1920 } } },
  },
} satisfies VisualRecipe & { runtime: Record<string, unknown> };
