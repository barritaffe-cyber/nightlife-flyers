import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { layoutWhimsicalWord } from '../lib/whimsicalWordLayout.ts';

const data=JSON.parse(readFileSync('lib/whimsicalSvgData.json','utf8'));
const words=['Brunch','Love','Sunday','Celebrate','Party','Ladies','NIGHTS','gyp','hi','123'];
const glyphs=l=>l.letters.map(({glyph,transform})=>`<path transform="${transform}" d="${glyph?.path||''}"/>`).join('');
const decoration=o=>`<path transform="${o.transform}" d="${o.path}"/>`;
const wrap=(l,paths,width,height)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${l.viewBox.join(' ')}" width="${width}" height="${height}"><g fill="white">${paths}</g></svg>`;
function distanceField(mask,width,height) {
  const d=new Uint16Array(width*height).fill(60000);
  for(let i=0;i<d.length;i++)if(mask[i*4+3]>0)d[i]=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=y*width+x;
    if(x)d[i]=Math.min(d[i],d[i-1]+1);
    if(y)d[i]=Math.min(d[i],d[i-width]+1,x?d[i-width-1]+1:60000,x+1<width?d[i-width+1]+1:60000);
  }
  for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){
    const i=y*width+x;
    if(x+1<width)d[i]=Math.min(d[i],d[i+1]+1);
    if(y+1<height)d[i]=Math.min(d[i],d[i+width]+1,x?d[i+width-1]+1:60000,x+1<width?d[i+width+1]+1:60000);
  }
  return d;
}
const results=[];
for(const word of words)for(const tracking of [-.25,-.1,-.04,0,.1]){
  const l=layoutWhimsicalWord(word,data,tracking);
  assert.ok(l.ornaments.length<=5);
  assert.ok(l.viewBox.every(Number.isFinite));
  const width=Math.ceil(l.viewBox[2]/4),height=Math.ceil(l.viewBox[3]/4);
  let painted=glyphs(l);
  for(const o of l.ornaments){
    const mask=await sharp(Buffer.from(wrap(l,painted,width,height))).ensureAlpha().raw().toBuffer();
    const ornament=await sharp(Buffer.from(wrap(l,decoration(o),width,height))).ensureAlpha().raw().toBuffer();
    const distances=distanceField(mask,width,height);
    let minimum=60000;
    for(let i=0;i<distances.length;i++)if(ornament[i*4+3]>0)minimum=Math.min(minimum,distances[i]);
    // Independent rendered-ink check, allowing raster rounding at both edges.
    assert.ok(minimum>=Math.floor(l.clearance/4)-1,`${word}/${tracking}/${o.name}: gap ${minimum}px`);
    results.push({word,tracking,ornament:o.name,minimumPixels:minimum});
    painted+=decoration(o);
  }
}
const normal=layoutWhimsicalWord('Brunch',data);
assert.ok(normal.ornaments.some(o=>o.name==='bottom'));
assert.ok(!layoutWhimsicalWord('Brunch',data,-.25).ornaments.some(o=>o.name==='bottom'));
assert.deepEqual(layoutWhimsicalWord('Brunch',data).ornaments,normal.ornaments,'restores original placement when spacing returns');
// The successful image is the calibration target, not just a coordinate table.
assert.equal(normal.ornaments.length,5,'all reference ornaments fit at natural spacing');
const expected=await sharp('public/font-specimens/whimsical-brunch.svg').resize(1360,680).ensureAlpha().raw().toBuffer();
const actual=await sharp(Buffer.from(wrap(normal,glyphs(normal)+normal.ornaments.map(decoration).join(''),1360,680))).ensureAlpha().raw().toBuffer();
let changed=0;
for(let i=3;i<expected.length;i+=4)if(Math.abs(expected[i]-actual[i])>16)changed++;
assert.ok(changed<100,`reference silhouette differs at ${changed} pixels`);
const examples=[['Brunch',0],['Brunch',-.04],['Love',0],['Sunday',0],['Celebrate',0],['Party',0],['Ladies',0],['NIGHTS',0]];
const panels=examples.map(([word,tracking],i)=>{
  const l=layoutWhimsicalWord(word,data,tracking),x=30+(i%2)*690,y=30+Math.floor(i/2)*245;
  return `<text x="${x}" y="${y+20}" fill="#9ba6ad" font-family="sans-serif" font-size="16">${word}${tracking?' · tight spacing':''}</text><svg x="${x}" y="${y+40}" width="630" height="175" viewBox="${l.viewBox.join(' ')}"><g fill="white">${glyphs(l)}${l.ornaments.map(decoration).join('')}</g></svg>`;
}).join('');
const proof=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1020"><rect width="1400" height="1020" fill="#101416"/>${panels}</svg>`;
await sharp(Buffer.from(proof)).png().toFile('public/font-specimens/whimsical-auto-spacing.png');
writeFileSync('/tmp/whimsical-clearance-results.json',JSON.stringify(results,null,2));
console.log(`PASS: corrected Brunch reference (${changed} changed pixels); 50 word/spacing combinations; ${results.length} rendered clearance checks; hide/restore`);
