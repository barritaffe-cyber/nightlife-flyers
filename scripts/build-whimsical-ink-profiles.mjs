import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

// Conservative exterior contours measured from the actual vector masters.
// Closed counters prevent ornaments being placed inside letters.
const file = 'lib/whimsicalSvgData.json';
const data = JSON.parse(readFileSync(file, 'utf8'));
for (const glyph of [...Object.values(data.glyphs), ...Object.values(data.ornaments)]) {
  if (!glyph.path) { glyph.inkColumns = []; continue; }
  const [x0,y0,x1,y1] = glyph.bounds ?? [0,0,glyph.width,glyph.height];
  const step = glyph.bounds ? data.unitsPerEm/250 : (x1-x0)/512;
  const width = Math.ceil((x1-x0)/step), height = Math.ceil((y1-y0)/step);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x0} ${y0} ${width*step} ${height*step}"><path fill="white" d="${glyph.path}"/></svg>`;
  const pixels = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
  glyph.inkColumns = [];
  for (let x=0; x<width; x++) {
    let first=height, last=-1;
    for (let y=0; y<height; y++) if (pixels[(y*width+x)*4+3]) {
      first=Math.min(first,y); last=y;
    }
    if (last<0) continue;
    glyph.inkColumns.push([x0+x*step, Math.min(x1,x0+(x+1)*step),
      y0+first*step, Math.min(y1,y0+(last+1)*step)].map(n=>Math.round(n*1000)/1000));
  }
}
writeFileSync(file,JSON.stringify(data)+'\n');
console.log('Measured exterior ink profiles for Whimsical SVG letters');
