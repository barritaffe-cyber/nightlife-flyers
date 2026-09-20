import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1100,height:1150},deviceScaleFactor:1});await page.goto('http://localhost:3000/generated-flyers/eaden-font-preview.html');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'public/generated-flyers/eaden-font-preview.png',fullPage:true});}finally{await browser.close();}
