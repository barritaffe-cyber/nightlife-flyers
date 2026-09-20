import {chromium} from 'playwright';
const baseUrl=process.env.NF_BASE_URL || 'http://localhost:3000';
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});for(const format of ['square','story']){await page.goto(`${baseUrl}/generated-flyers/new-york-master.html?format=${format}`);await page.evaluate(()=>document.fonts.ready);await page.locator('.canvas').screenshot({path:`public/generated-flyers/new-york-${format}.png`});console.log(format,await page.locator('[data-region="headline"]').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,font:getComputedStyle(el).fontFamily})));}}finally{await browser.close();}
