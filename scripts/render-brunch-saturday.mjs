import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:1100,height:1100},deviceScaleFactor:1});
  await page.goto('http://localhost:3000/generated-flyers/brunch-saturday-master.html',{waitUntil:'networkidle'});
  if (process.argv.includes('--fonts')) {
    const fonts = ['OpenScript.ttf','dear-script-demo-font.ttf','LacheyardScript_PERSONAL_USE_ONLY.otf','script/Mitshuka.otf','script/adelia alternate.otf'];
    await page.setContent(`<style>body{margin:0;background:#32120b;color:white}${fonts.map((f,i)=>`@font-face{font-family:s${i};src:url('http://localhost:3000/fonts/${encodeURI(f)}')} .s${i}{font-family:s${i};font-size:100px;line-height:1.5}`).join('')}</style>${fonts.map((f,i)=>`<div style="height:200px"><small>${f}</small><div class="s${i}">Saturday</div></div>`).join('')}`);
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:'/private/tmp/brunch-saturday-fonts.png',fullPage:true});
    process.exitCode=0;
    await browser.close();
    process.exit();
  }
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  await page.locator('[data-coco-canvas]').screenshot({path:'public/generated-flyers/brunch-saturday-css-preview.png'});
  console.log(await page.locator('[data-coco-canvas]').ariaSnapshot());
  console.log(await page.evaluate(()=>[...document.querySelectorAll('.headline,.script')].map(e=>({text:e.textContent,font:getComputedStyle(e).fontFamily,bounds:e.getBoundingClientRect().toJSON()}))));
} finally {await browser.close();}
