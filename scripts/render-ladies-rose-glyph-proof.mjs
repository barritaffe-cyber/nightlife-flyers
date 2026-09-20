import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
const metrics=JSON.parse(await readFile('public/generated-flyers/assets/png-glyphs/ladies-night-rose/metrics.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1440}});
 await page.goto('http://localhost:3001/generated-flyers/ladies-night-rose-master.html');
 await page.setContent(`<style>body{margin:0;background:#171118;color:#eee;font:15px sans-serif}.grid{display:grid;grid-template-columns:repeat(8,180px)}figure{margin:0;width:180px;height:180px;border:1px solid #49333c;box-sizing:border-box}img{display:block;width:150px;height:150px;object-fit:contain;margin:auto}figcaption{text-align:center}</style><div class=grid>${Object.entries(metrics.glyphs).map(([c,g])=>`<figure><img src="http://localhost:3001/generated-flyers/assets/png-glyphs/ladies-night-rose/${g.nativeGlyph}"><figcaption>${c} · ${g.sourceSize.join('×')}</figcaption></figure>`).join('')}</div>`);
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 await page.screenshot({path:'public/generated-flyers/ladies-night-rose-glyph-proof.png',fullPage:true});
}finally{await browser.close()}
