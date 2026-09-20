export const PNG_GLYPH_COLLECTIONS = [
  {family:'Spotlight Gold PNG',label:'Spotlight Gold',sample:'YCEE Live'},
  {family:'Honey Gold Serif PNG',label:'Honey Gold Serif',sample:'HONEY Nights'},
  {family:'Rose Chrome Serif PNG',label:'Rose Chrome Serif',sample:'GIRL Code'},
  {family:'Neon Green PNG',label:'Neon Green',sample:'NEON GREEN'},
  {family:'Paint Splash Serif PNG',label:'Paint Splash Serif',sample:'PAINT'},
  {family:'Sunset Paint Brush PNG',label:'Sunset Paint Brush',sample:'SIP'},
  {family:'Euphoria Chrome PNG',label:'Euphoria Chrome',sample:'EUPHORIA'},
  {family:'Mojito Serif PNG',label:'Mojito Serif',sample:'MOJITo'},
  {family:'Textured Gold Serif PNG',label:'Textured Gold Serif',sample:'TEXTURED GOLD'},
  {family:'Arctic Metal PNG',label:'Arctic Metal',sample:'ARCTIC METAL'},
  {family:'Gold Flourish PNG',label:'Gold Flourish',sample:'GOLD FLOURISH'},
  {family:'Gold Filigree PNG',label:'Gold Filigree',sample:'GOLD FILIGREE'},
  {family:'Africa Gold PNG',label:'Africa Gold',sample:'AFRICA GOLD'},
  {family:'Sunset Gold PNG',label:'Sunset Gold',sample:'SUNSET GOLD'},

  {family:'Future Outline PNG',label:'Future Outline',sample:'FUTURE OUTLINE'},
  {family:'Liquid Chrome PNG',label:'Liquid Chrome',sample:'Liquid Chrome'},
  {family:'Circuit Lines PNG',label:'Circuit Lines',sample:'Circuit Lines'},
  {family:'Distressed Ink PNG',label:'Distressed Ink',sample:'Distressed Ink'},
  {family:'Tribal Pattern PNG',label:'Tribal Pattern',sample:'TRIBAL PATTERN'},
  {family:'Rainbow Gradient PNG',label:'Rainbow Gradient',sample:'RAINBOW GRADIENT'},
  {family:'Whimsical Gold PNG',label:'Whimsical Gold',sample:'Whimsical Gold'},
  {family:'Rose Fur PNG',label:'Rose Fur',sample:'Rose Fur'},

  {family:'Calligraphy Gold PNG',label:'Calligraphy Gold',sample:'Calligraphy Gold'},
  {family:'Classic Gold Serif PNG',label:'Classic Gold Serif',sample:'CLASSIC GOLD SERIF'},
  {family:'Block Gold PNG',label:'Block Gold',sample:'BLOCK GOLD'},
  {family:'Clean Gold PNG',label:'Clean Gold',sample:'CLEAN GOLD'},
  {family:'Crimson Neon PNG',label:'Crimson Neon',sample:'CRIMSON NEON'},
] as const;
// Legacy names remain valid for existing saved projects and exports.
export const PNG_GLYPH_FAMILY_ALIASES: Readonly<Record<string, string>> = {
  'Future 02 PNG': 'Future Outline PNG',
  'Chrome PNG': 'Liquid Chrome PNG',
  'Future PNG': 'Circuit Lines PNG',
  'Grunge PNG': 'Distressed Ink PNG',
  'Afro PNG': 'Tribal Pattern PNG',
  'Rainbow PNG': 'Rainbow Gradient PNG',
  'Gold Whimsical PNG': 'Whimsical Gold PNG',
  'Pink Fur PNG': 'Rose Fur PNG',
  'Gold Script PNG': 'Calligraphy Gold PNG',
  'Gold Serif PNG': 'Classic Gold Serif PNG',
  'Gold PNG': 'Block Gold PNG',
  'Red Neon PNG': 'Crimson Neon PNG',
};
export const resolvePngGlyphFamily = (family?: string) =>
  family ? PNG_GLYPH_FAMILY_ALIASES[family] ?? family : family;
export const isPngGlyphFamily = (family?: string) =>
  family === 'Bad Girls Brush PNG' || family === 'Bad Girls Pink PNG' || family === 'Glow Chrome PNG' || family === 'Eaden Gold PNG' || family === 'Ladies Neon Chrome PNG' || family === 'Bass Pressure Blue PNG' || family === 'Reggae Jams Script PNG' || family === 'Ladies Night Pink PNG' || family === 'Ladies Rose Gold PNG' || PNG_GLYPH_COLLECTIONS.some(item => item.family === resolvePngGlyphFamily(family));
