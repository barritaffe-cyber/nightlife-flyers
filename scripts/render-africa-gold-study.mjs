import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1500,height:1200}});
 await page.goto('http://localhost:3000/generated-flyers/africa-gold-font-preview.html');
 await page.evaluate(()=>document.fonts.ready);
 assert.ok(await page.evaluate(()=>document.fonts.check('85px AfricaGold')));
 await page.screenshot({path:'public/font-specimens/africa-gold.png',fullPage:true});
 await page.goto('http://localhost:3000/font-specimens/lettering-catalog.html');
 await page.evaluate(()=>document.fonts.ready);
 await page.getByRole('button',{name:'Use Africa Gold PNG lettering',exact:true}).screenshot({path:'public/font-specimens/africa-gold-picker.png'});
 console.log('Africa Gold alphabet and picker previews refreshed');
} finally {await browser.close();}
