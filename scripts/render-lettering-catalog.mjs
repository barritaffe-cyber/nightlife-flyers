import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),ts=require('typescript'),React=require('react');
const compile=async file=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(await readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(name=>name.includes('pngGlyphCollections')?registry:require(name),m,m.exports);return m.exports;};
const registry=await compile('lib/pngGlyphCollections.ts');
const {PNG_GLYPH_COLLECTIONS:fonts,PNG_GLYPH_FAMILY_ALIASES:aliases}=registry;
const {PngGlyphPicker}=await compile('components/text/PngGlyphPicker.tsx');
const {FONT_FILE_MAP:files}=await compile('lib/localFontMap.ts');
const css=(await readFile('app/globals.css','utf8')).match(/@font-face\s*\{[^}]*PNG[^}]*\}/g).join('\n');
const slug=s=>s.toLowerCase().replaceAll(' ','-');
const lowercase=new Set(['Liquid Chrome','Circuit Lines','Distressed Ink','Whimsical Gold','Rose Fur','Calligraphy Gold','Africa Gold','Clean Gold']);
const sections=fonts.map(f=>`<section id="${slug(f.label)}"><h1>${f.label}</h1><div class="letters" style="font-family:'${f.family}'">${['ABCDEFGHI','JKLMNOPQR','STUVWXYZ','0123456789',...(lowercase.has(f.label)?['abcdefghi','jklmnopqr','stuvwxyz']:[])].map(s=>`<div>${s}</div>`).join('')}<div class="light">AVATAR 2026</div></div></section>`).join('');
const picker=require('react-dom/server').renderToStaticMarkup(React.createElement(PngGlyphPicker,{selected:'',onSelect:()=>{}})).replace('<details','<details open');
await writeFile('public/font-specimens/lettering-catalog.html',`<!doctype html><html><head><meta charset="utf-8"><title>PNG Lettering Collection</title><style>${css}*{box-sizing:border-box}body{margin:0;background:#151922;color:white;font-family:Arial}section{width:1200px;padding:32px 42px}h1{font-size:28px;font-weight:400}.letters{font-size:90px;line-height:1.7;white-space:nowrap}.light{background:#e1e5ed;padding:15px;color:#111}details{padding:24px;width:470px}button{display:block;background:#08090c;color:white;border:1px solid #536078;padding:18px;width:420px;margin:8px 0}button span{display:block}</style></head><body>${picker}${sections}</body></html>`);
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1250,height:1100}});await page.goto('http://localhost:3000/font-specimens/lettering-catalog.html');await page.evaluate(()=>document.fonts.ready);
for(const f of fonts){assert.ok(await page.evaluate(f=>document.fonts.check(`90px "${f}"`),f.family));await page.locator('#'+slug(f.label)).screenshot({path:`public/font-specimens/${slug(f.label)}.png`});const b=page.getByRole('button',{name:`Use ${f.family} lettering`});assert.equal(await b.locator('span').first().textContent(),f.sample);await b.screenshot({path:`public/font-specimens/${slug(f.label)}-picker.png`});}
for(const [old,current]of Object.entries(aliases)){assert.equal(files[old],files[current]);assert.ok(registry.isPngGlyphFamily(old));const markup=require('react-dom/server').renderToStaticMarkup(React.createElement(PngGlyphPicker,{selected:old,onSelect:()=>{}}));assert.match(markup,new RegExp(`aria-pressed="true"[^>]*aria-label="Use ${current} lettering"`));
const result=await page.evaluate(async({old,current})=>{await document.fonts.load(`70px "${old}"`);const render=family=>{const c=document.createElement('canvas');c.width=900;c.height=180;const ctx=c.getContext('2d');ctx.font=`70px "${family}"`;ctx.fillStyle='white';ctx.fillText('AVATAR 2026',20,110);return c.toDataURL();};return {same:render(old)===render(current),distinct:render(current)!==render('sans-serif')};},{old,current});assert.ok(result.same&&result.distinct,`${old} compatibility and real bitmap`);console.log(`${old} -> ${current}: PASS`);}
}finally{await browser.close();}
