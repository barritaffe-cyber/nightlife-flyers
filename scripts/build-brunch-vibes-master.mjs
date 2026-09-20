import { pathToFileURL } from 'node:url';
import { compileCssMaster } from './lib/coco-css-master-compiler.mjs';

// Compile the approved portrait verbatim. Format adaptations are a separate
// authoring step; never stretch this master or silently reuse an older draft.
const extra = (role, field, family) => ({ semanticRole: role, text: field,
  family: `${field}Family`, size: `${field}Size`, color: `${field}Color`,
  x: `${field}X`, y: `${field}Y`, align: `${field}Align`,
  lineHeight: `${field}LineHeight`, rotation: `${field}Rotation`,
  editable: true, fontFamily: family, label: role });
export const cocoCssMasterAdapter = {
  id: 'brunch-vibes',
  masterPath: new URL('../public/generated-flyers/brunch-vibes-studio-final.html', import.meta.url),
  outputPath: new URL('../public/generated-flyers/brunch-vibes-compiled-portrait.nflyer', import.meta.url),
  publicRoot: new URL('../public/', import.meta.url),
  // This source has one native 2:3 canvas, not format-dependent markup.
  requireFormatCanvas: false,
  editorTextScale: 540 / 1024,
  recipe: {
    id: 'brunch-vibes', name: 'Brunch Vibes — compiled portrait', version: 2,
    runtime: {
      compositionPattern: 'brunch-editorial', styleId: 'terrace-brunch',
      palette: { bgFrom: '#f5efdf', bgTo: '#e4dac2', primary: '#91601d', secondary: '#475216', accent: '#776333', neutral: '#22180c' },
      authority: { layout: { owner: 'recipe-elements' }, palette: { owner: 'recipe-element-paint' }, assets: { owner: 'recipe-elements' }, crop: { owner: 'recipe-background-image' } },
      formats: { square: { canvas: { width: 1024, height: 1536 } }, story: { canvas: { width: 1024, height: 1536 } } },
    },
  },
  requiredFonts: ['LocalDidot', 'GeorgiaBrush', 'LemonLight', 'LemonRegular', 'LemonMedium'],
  fontMap: {
    LocalDidot: 'Didot', GeorgiaBrush: 'Georgia Brush',
    LemonLight: 'LEMONMILK-Light', LemonRegular: 'LEMONMILK-Regular', LemonMedium: 'LEMONMILK-Medium',
    headline: 'Didot', headline2: 'Georgia Brush', presenter: 'LEMONMILK-Light',
    details: 'LEMONMILK-Light', time: 'LEMONMILK-Medium', venue: 'LEMONMILK-Light',
    subtag: 'LEMONMILK-Light', address: 'LEMONMILK-Light', footerDetails: 'LEMONMILK-Light',
  },
  requiredRoles: ['headline', 'headline2', 'presenter', 'presents', 'weekday', 'day', 'month', 'details', 'time', 'timeConnector', 'endTime', 'venue', 'subtag', 'address', 'footerDetails'],
  semanticRoles: {
    'bg-image': { semanticRole: 'background', editable: false },
    headline: { semanticRole: 'headline', editable: true },
    script: { semanticRole: 'headline2', editable: true },
    presenter: { semanticRole: 'presenter', editable: true },
    'presents-label': extra('presents', 'presenterLabel', 'LEMONMILK-Light'),
    weekday: extra('weekday', 'dateWeekday', 'LEMONMILK-Light'),
    'day-numeral': extra('day', 'dateDay', 'LEMONMILK-Medium'),
    month: extra('month', 'dateMonth', 'LEMONMILK-Light'),
    details: { semanticRole: 'details', editable: true },
    'time-start': { semanticRole: 'time', editable: true },
    'time-to': extra('timeConnector', 'timeConnector', 'LEMONMILK-Regular'),
    'time-end': extra('endTime', 'endTime', 'LEMONMILK-Medium'),
    venue: { semanticRole: 'venue', editable: true },
    'venue-description': { semanticRole: 'subtag', editable: true },
    address: { semanticRole: 'address', editable: true },
    footer: { semanticRole: 'footerDetails', editable: true },
  },
  eventBrief: { eventName: 'BRUNCH', subtitle: 'Vibes', presenterName: 'THE TERRACE', venueName: 'THE TERRACE', address: '123 OCEAN DRIVE, MIAMI, FL' },
};
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await compileCssMaster(cocoCssMasterAdapter);
  console.log(JSON.stringify({ output: cocoCssMasterAdapter.outputPath.pathname, sourceHash: result.sourceHash, report: result.story.cocoCssCompiler.report }));
}
