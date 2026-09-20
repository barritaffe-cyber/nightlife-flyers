import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
if(!process.argv[2]) throw new Error('Usage: node scripts/verify-png-glyph-paint.mjs /path/to/original-font.woff2');
const before=await readFile(process.argv[2]);
const after=await readFile('public/fonts/GoldSerifPNG.woff2');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1100,height:600},deviceScaleFactor:1});
 await page.setContent(`<style>@font-face{font-family:Before;src:url(data:font/woff2;base64,${before.toString('base64')})}@font-face{font-family:After;src:url(data:font/woff2;base64,${after.toString('base64')})}body{background:#14202b;color:white;margin:20px}.run{font-size:160px;line-height:1.5;white-space:pre;letter-spacing:.015em}.before{font-family:Before}.after{font-family:After}</style><div>Before</div><div class="run before">MARDI GRAS</div><div>After — identical spacing</div><div class="run after">MARDI GRAS</div>`);
 await page.evaluate(()=>document.fonts.ready);
 const metrics=await page.evaluate(()=>{
 const ctx=document.createElement('canvas').getContext('2d');return ['Before','After'].map(f=>{ctx.font=`160px ${f}`;return ['MARDI GRAS','ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].map(t=>ctx.measureText(t).width)});
 });assert.deepEqual(metrics[0],metrics[1]);
 await page.screenshot({path:'/tmp/png-glyph-paint-proof.png'});
 console.log('ADVANCES AND KERNING UNCHANGED',metrics);
}finally{await browser.close();}
