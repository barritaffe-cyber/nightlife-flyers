import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const out=process.env.NF_OUTPUT_DIR || '/tmp/soft-life';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  for(const format of ['square','story']) {
    await page.goto(`http://localhost:3000/generated-flyers/soft-life-master.html?format=${format}`);
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.canvas').screenshot({path:`${out}/css-${format}.png`});
    console.log(format,await page.locator('.headline,.subtitle').evaluateAll(nodes=>nodes.map(el=>({text:el.textContent,width:el.clientWidth,scroll:el.scrollWidth,font:getComputedStyle(el).fontFamily}))));
  }
} finally {await browser.close();}
