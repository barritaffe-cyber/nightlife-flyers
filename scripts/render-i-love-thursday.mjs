import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
 for(const format of ['story','square']){
  await page.goto(`http://localhost:3000/generated-flyers/i-love-thursday-master.html?format=${format}`,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  await page.locator('[data-coco-canvas]').screenshot({path:`public/generated-flyers/i-love-thursday-${format}-css-preview.png`});
  console.log(format,await page.locator('[data-coco-canvas]').ariaSnapshot());
 }
}finally{await browser.close();}
