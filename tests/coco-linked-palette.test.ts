import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blendPalettePixel, mapImagePalette, compiledPaletteRole, paletteRoleTargets, parsePaletteColor, recolorPaletteCss, recolorPaletteSvg, type RGB } from '../lib/coco/paletteBindings.ts';
import { linkedPaletteNativeSource, resetCocoLinkedPalette, mergeCocoLinkedPalette } from '../lib/coco/linkedPalette.ts';
import { COCO_TEXT_PALETTES, cocoConversationLinkedPalette } from '../lib/coco/conversationPalette.ts';

const luminance=(c:RGB)=>.3*c[0]+.59*c[1]+.11*c[2];
test('Hue and Soft Light preserve source lighting, black, white and chromatic depth',()=>{
  for(const mode of ['hue','soft-light'] as const)for(const source of [[.8,.4,.1],[.1,.3,.5],[0,0,0],[1,1,1],[.02,.01,.005]] as RGB[]) {
    const result=blendPalettePixel(source,[.8,.12,.35],mode,.7);
    assert.ok(Math.abs(luminance(source)-luminance(result))<.000001);
    assert.ok(result.every(v=>v>=0&&v<=1));
    if(source[0]===0||source[0]===1)assert.ok(result.every((v,i)=>Math.abs(v-source[i])<1e-12));
  }
  assert.deepEqual(blendPalettePixel([.8,.4,.1],[0,0,0],'hue',1),[.8,.4,.1],'neutral palette color does not desaturate the photograph');
});

test('automatic image mapping preserves alpha, neutral pixels and untargeted color ranges',()=>{
  const pixels=new Uint8ClampedArray([...Array.from({length:120},()=>[210,95,25,255]).flat(),...Array.from({length:100},()=>[25,90,200,255]).flat(),30,210,70,255,80,80,80,255,245,245,245,255,0,0,0,255,110,45,20,0]);
  const original=pixels.slice();mapImagePalette(pixels,[[.75,.12,.4],[.1,.65,.6]],'hue',.3);
  assert.notDeepEqual(pixels.slice(0,4),original.slice(0,4));
  assert.deepEqual(pixels.slice(-20),original.slice(-20),'green, gray, white, black and transparent samples stay untouched');
  for(let i=0;i<pixels.length;i+=4){assert.equal(pixels[i+3],original[i+3]);assert.ok(Math.abs(luminance(Array.from(pixels.slice(i,i+3)).map(v=>v/255) as RGB)-luminance(Array.from(original.slice(i,i+3)).map(v=>v/255) as RGB))<.004);}
  const zero=original.slice();mapImagePalette(zero,[[1,0,0]],'hue',0);assert.deepEqual(zero,original);
});

test('every registered compiled object has a palette role, including backgrounds without semantic roles',()=>{
  const recipes=JSON.parse(readFileSync('lib/template-data/registered-recipes.json','utf8'));
  let count=0;
  for(const recipe of recipes)for(const variant of Object.values<any>(recipe.formats))for(const object of variant.cocoCompositionSystem?.compiledDocument?.objects??[]) {
    assert.ok(['background','primary','secondary','accent','neutral'].includes(compiledPaletteRole(object)));count++;
    if(object.id==='background')assert.equal(compiledPaletteRole(object),'background');
  }
  assert.ok(count>1000);
});

test('main Coco palettes wire both background swatches to raster backgrounds',()=>{
  for (const preset of COCO_TEXT_PALETTES) {
    const palette=cocoConversationLinkedPalette(preset.id);
    assert.ok(palette);
    assert.deepEqual(paletteRoleTargets(palette,'background'),[preset.background,preset.backgroundSecondary]);
    assert.deepEqual(paletteRoleTargets(palette,'primary'),[preset.headline,preset.accent]);
    assert.notEqual(preset.background,preset.backgroundSecondary);
  }
  assert.equal(cocoConversationLinkedPalette('missing'),null);
  assert.deepEqual(
    paletteRoleTargets({bgFrom:'#112233',bgTo:'#445566',accent:'#ff0099'},'background'),
    ['#112233','#445566'],
    'accent artwork must not replace the background shadow color'
  );
});

test('changing Shadow changes the secondary image range; changing Accent alone keeps background pixels',()=>{
  const original=new Uint8ClampedArray([...Array.from({length:120},()=>[210,95,25,255]).flat(),...Array.from({length:100},()=>[25,90,200,255]).flat()]);
  const colors={bgFrom:'#A34278',bgTo:'#246A98',accent:'#F0BD63'};
  const render=(palette:typeof colors)=>{
    const pixels=original.slice();
    mapImagePalette(pixels,paletteRoleTargets(palette,'background').map(c=>parsePaletteColor(c)!), 'hue',.3);
    return pixels;
  };
  const first=render(colors), shadow=render({...colors,bgTo:'#25835A'});
  assert.deepEqual(shadow.slice(0,480),first.slice(0,480));
  assert.notDeepEqual(shadow.slice(480),first.slice(480));
  assert.deepEqual(render({...colors,accent:'#FF1122'}),first);
});

test('SVG strokes follow their palette role without flattening black detail or breaking gradient references',()=>{
  const source='<svg><path fill="#000" stroke="#fff"/><path fill="url(#abc)"/><linearGradient id="abc"><stop stop-color="#140603"/><stop offset="1" stop-color="#f5cf87"/></linearGradient></svg>';
  const result=recolorPaletteSvg(source,'#7EBBCC','hue',.3);
  assert.ok(result.includes('stroke="rgb(126,187,204)"'));
  assert.ok(result.includes('fill="rgb(0,0,0)"'));
  assert.ok(result.includes('fill="url(#abc)"'));
  const stops=[...result.matchAll(/stop-color="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(stops.length,2);assert.notEqual(stops[0],stops[1]);
});

test('palette merge/reset preserve unrelated text and later manual color edits; replaced backgrounds ignore stale palette output',()=>{
  const prepared:any={palette:{accent:'#f00'},cocoCompositionSystem:{linkedPalette:{originalPalette:{accent:'#abc'},bindings:{headline:{original:{color:'#abc'},applied:{color:'#f00',paletteFilter:'hue-rotate(2deg)'}}}}}};
  const current:any={headline:'LATER WORDING',cocoCompositionSystem:{compiledObjectOverrides:{headline:{text:'LATER WORDING',left:7,color:'#abc'}}}};
  const merged=mergeCocoLinkedPalette(current,prepared);assert.equal(merged.cocoCompositionSystem.compiledObjectOverrides.headline.text,'LATER WORDING');
  const restored=resetCocoLinkedPalette(merged);assert.equal(restored.cocoCompositionSystem.compiledObjectOverrides.headline.color,'#abc');assert.equal(restored.cocoCompositionSystem.compiledObjectOverrides.headline.left,7);
  merged.cocoCompositionSystem.compiledObjectOverrides.headline.color='#777';assert.equal(resetCocoLinkedPalette(merged).cocoCompositionSystem.compiledObjectOverrides.headline.color,'#777');
  assert.equal(linkedPaletteNativeSource(undefined,undefined),undefined);
  assert.equal(linkedPaletteNativeSource({linkedPalette:{nativeBackground:{source:'old',output:'processed'}}},'new'),'new');
  assert.equal(recolorPaletteCss('url(#abc) rgba(90,40,15,0.4)','#ae3388','hue',.3).startsWith('url(#abc) rgba('),true);
});
