import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

// Optical composition from the supplied Whimsical SVG masters. All artwork is
// source letter/ornament paths; no font substitution, raster texture or tracing
// of the finished reference wordmark.
const data = JSON.parse(readFileSync('lib/whimsicalSvgData.json', 'utf8'));
const out = 'public/font-specimens';
mkdirSync(out, { recursive: true });
const reference = JSON.parse(readFileSync('lib/whimsicalReference.json','utf8'));
const letters = reference.letters;
const ornaments = reference.ornaments;
const glyphPaths = letters.map(([char, x, y, width, height]) => {
  const glyph = data.glyphs[char];
  const [x0,y0,x1,y1] = glyph.bounds;
  return `<path data-letter="${char}" d="${glyph.path}" transform="translate(${x} ${y}) scale(${width/(x1-x0)} ${height/(y1-y0)}) translate(${-x0} ${-y0})"/>`;
}).join('\n');
const ornamentPaths = ornaments.map(([name,x,y,width,height]) => {
  const mirror = name === 'rightBurst';
  const source = data.ornaments[name.includes('Burst') ? 'burst' : name];
  return `<path data-ornament="${name}" d="${source.path}" transform="translate(${mirror?x+width:x} ${y}) scale(${(mirror?-1:1)*width/source.width} ${height/source.height})"/>`;
}).join('\n');
const artwork = `<g fill="#ffffff" transform="translate(50 0)">${glyphPaths}\n${ornamentPaths}</g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1360 680" role="img" aria-labelledby="title"><title id="title">Brunch — Whimsical SVG</title>${artwork}</svg>`;
writeFileSync(`${out}/whimsical-brunch.svg`,svg+'\n');
await sharp(Buffer.from(svg)).resize(1890).png().toFile(`${out}/whimsical-brunch-transparent.png`);
await sharp(Buffer.from(svg.replace(artwork,`<rect width="1360" height="680" fill="#101416"/>${artwork}`)))
  .resize(1360).png().toFile(`${out}/whimsical-brunch-preview.png`);
console.log(`Created ${out}/whimsical-brunch.svg and previews`);
