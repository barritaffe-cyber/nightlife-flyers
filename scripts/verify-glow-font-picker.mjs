import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const compile=async file=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(await readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(name=>name.includes('pngGlyphCollections')?registry:require(name),m,m.exports);return m.exports;};
const registry=await compile('lib/pngGlyphCollections.ts');
const map=await compile('lib/localFontMap.ts');
assert.ok(map.TEMPLATE_ONLY_FONT_FAMILIES.has('Glow Chrome PNG'));
assert.ok(!map.TEMPLATE_ONLY_FONT_FAMILIES.has('Neon Green PNG'));
const {PngGlyphPicker}=await compile('components/text/PngGlyphPicker.tsx');
await writeFile('public/generated-flyers/glow-font-picker.html',`<!doctype html><style>@font-face{font-family:'Neon Green PNG';src:url('/fonts/NeonGreenPNG.woff2')}body{background:#10121b;color:white;padding:24px}button{display:block;width:480px;padding:20px;background:#151822;color:white}span{display:block}</style>${renderToStaticMarkup(React.createElement(PngGlyphPicker,{selected:'Neon Green PNG',onSelect:()=>{}})).replace('<details','<details open')}`);
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:550,height:900}});
 await page.goto('http://localhost:3000/generated-flyers/glow-font-picker.html');await page.evaluate(()=>document.fonts.ready);
 const button=page.getByRole('button',{name:'Use Neon Green PNG lettering',exact:true});
 assert.equal(await button.count(),1);
 assert.equal(await page.getByRole('button',{name:'Use Glow Chrome PNG lettering',exact:true}).count(),0);
 assert.ok((await button.locator('span').first().evaluate(el=>getComputedStyle(el).fontFamily)).includes('Neon Green'));
 const count=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=180;const x=c.getContext('2d');x.font='100px "Neon Green PNG"';x.fillText('DARK',5,100);const d=x.getImageData(0,0,600,180).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>100 && d[i+1]>180 && d[i+2]<80)n++;return n;});
 assert.ok(count>100,'Picker family loads colored bitmap lettering');
 await button.screenshot({path:'public/generated-flyers/neon-green-picker-preview.png'});
 console.log('NEON GREEN PUBLIC / GLOW CHROME PRIVATE: PASSED');
} finally {await browser.close();}
