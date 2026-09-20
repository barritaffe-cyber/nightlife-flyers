import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { compileCssMaster } from './lib/coco-css-master-compiler.mjs';
import { createPortableCocoProject } from './lib/coco-materializer.mjs';
import { withCompiledTextSelection } from '../lib/coco/compiledTextSelection.ts';

const publicRoot = new URL('../public/', import.meta.url);
const sourcePath = new URL('../public/generated-flyers/brunch-saturday-master.html', import.meta.url);
const extra = role => ({ semanticRole: role, text: role, family: `${role}Family`, size: `${role}Size`, color: `${role}Color`, x: `${role}X`, y: `${role}Y`, align: `${role}Align`, lineHeight: `${role}LineHeight`, rotation: `${role}Rotation`, editable: true, fontFamily: 'Arial', label: role });
const roles = { presenter:'presenter', headline:'headline', script:'headline2', 'day-number':'day', month:'month', time:'time', meridiem:'meridiem', weekday:'weekday', 'offer-one-price':'offerOnePrice', 'offer-one-copy':'offerOneCopy', 'offer-two-price':'offerTwoPrice', 'offer-two-copy':'offerTwoCopy', 'offer-three-price':'offerThreePrice', 'offer-three-copy':'offerThreeCopy', band:'details', address:'address' };
const standard = new Set(['presenter','headline','headline2','time','details','address']);
export const cocoCssMasterAdapter = {
  id: 'brunch-saturday',
  masterPath: new URL('../public/generated-flyers/brunch-saturday-coco-master.html', import.meta.url),
  outputPath: new URL('../public/generated-flyers/brunch-saturday.nflyer', import.meta.url), publicRoot,
  editorTextScale: 540 / 1000,
  recipe: { id:'brunch-saturday', name:'Brunch Saturday', version:1, runtime: {
    compositionPattern:'brunch-editorial', styleId:'terrace-brunch',
    palette:{bgFrom:'#180702',bgTo:'#180702',primary:'#e8dfc2',secondary:'#ffffff',accent:'#b00809',neutral:'#180702'},
    authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},
    formats:{square:{canvas:{width:1000,height:1000}},story:{canvas:{width:1000,height:1778}}}
  }},
  requiredFonts:['BrunchAnton','SaturdayScript'], requiredRoles:Object.values(roles),
  fontMap:{BrunchAnton:'Anton',SaturdayScript:'Dear Script (Demo_Font)',headline:'Anton',headline2:'Dear Script (Demo_Font)',presenter:'Arial',time:'Arial',details:'Arial',address:'Arial',Arial:'Arial'},
  semanticRoles:{...Object.fromEntries(Object.entries(roles).map(([id,role])=>[id,standard.has(role)?{semanticRole:role,editable:true}:extra(role)])), background:{semanticRole:'background',editable:false},'cocktail-foreground':{semanticRole:'subject',editable:false},'kiwi-foreground':{editable:false},'orange-foreground':{editable:false},'offer-ribbon':{editable:true},'qr-placeholder':{editable:true,label:'Replaceable QR placeholder'}},
  eventBrief:{eventName:'BRUNCH',subtitle:'Saturday',presenterName:'REDSANITY PRESENTS',date:'18 AUG',startTime:'8 PM',eventDetails:'WITH LIVE ACOUSTIC BAND',address:'217 ROYALE STREET, CALIFORNIA 0010'}
};

// Persist the same established-panel mappings used to open older saved projects.
for (const [id, role] of Object.entries(roles)) {
  const binding = cocoCssMasterAdapter.semanticRoles[id];
  cocoCssMasterAdapter.semanticRoles[id] = withCompiledTextSelection({
    id, kind: 'text', editable: true, semanticRole: role, binding,
  }).binding;
}

export async function buildBrunchSaturdayMaster() {
  // Render existing CSS masks into isolated transparent decoration assets.
  // All event text remains native editable text in the compiled document.
  const root = resolve(publicRoot.pathname);
  const mime = {'.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
  const server = createServer(async(req,res)=>{try {
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')) {res.writeHead(403).end();return;}
    res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(await readFile(path));
  }catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  let html=await readFile(sourcePath,'utf8');
  try {
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1000,height:1000},deviceScaleFactor:1});
    await page.goto(`http://127.0.0.1:${server.address().port}/generated-flyers/brunch-saturday-master.html`);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
    await page.screenshot({path:resolve(root,'generated-flyers/brunch-saturday-css-preview.png')});
    for(const id of ['cocktail-foreground','kiwi-foreground','orange-foreground','qr-placeholder']) {
      await page.evaluate(id=>{
        document.documentElement.style.background='transparent';document.body.style.background='transparent';
        for(const el of document.querySelectorAll('[data-region]'))el.style.visibility=el.dataset.region===id?'visible':'hidden';
      },id);
      const file=`brunch-saturday-coco-${id}.png`;
      if(id==='qr-placeholder')await page.locator(`[data-region="${id}"]`).screenshot({path:resolve(root,'generated-flyers/assets',file),omitBackground:true});
      else await page.screenshot({path:resolve(root,'generated-flyers/assets',file),omitBackground:true});
      if(id==='qr-placeholder')html=html.replace(/<div class="qr-placeholder"[\s\S]*?<\/div>/,`<img class="qr-placeholder" src="assets/${file}" data-region="qr-placeholder" data-coco-kind="image" data-coco-role="qr" alt="YOUR QR placeholder">`);
      else html=html.replace(new RegExp(`<img[^>]+data-region="${id}"[^>]*>`),tag=>tag.replace('assets/brunch-saturday-scene.png',`assets/${file}`));
    }
  }finally {await browser?.close();await new Promise(r=>server.close(r));}
  html=html.replaceAll('assets/','/generated-flyers/assets/');
  html=html.replace('<main class="canvas" data-coco-canvas="true" data-format="square"', '<main class="stage" data-coco-canvas="true" data-format="square"');
  html=html.replace('aria-label="Brunch Saturday flyer">','aria-label="Brunch Saturday flyer"><div class="canvas">').replace('</main>','</div></main>');
  html=html.replace('</style>',`.stage{position:relative;width:1000px;height:1000px;overflow:hidden;background:#180702}.stage .canvas{position:absolute;left:0;top:0}.cocktail-front,.kiwi-front,.orange-front{clip-path:none;mask-image:none}.qr-placeholder{border:0;background:transparent}\n</style>`);
  html=html.replace('</body>',`<script>if(new URLSearchParams(location.search).get('format')==='story'){const stage=document.querySelector('.stage');stage.dataset.format='story';stage.style.height=(1000*16/9)+'px';document.querySelector('.canvas').style.top=((1000*16/9-1000)/2)+'px'}</script></body>`);
  await writeFile(cocoCssMasterAdapter.masterPath,html);
  const result=await compileCssMaster(cocoCssMasterAdapter);
  // Embed local assets: browser-extracted CSS URLs otherwise point at its temporary server.
  const embedded = new Map();
  const embed=async url=>{if(embedded.has(url))return embedded.get(url);const path=new URL(url,'http://localhost').pathname;let bytes=await readFile(resolve(root,'.'+decodeURIComponent(path)));let type=mime[extname(path)]||'application/octet-stream';if(type==='image/png'){bytes=await sharp(bytes).webp({quality:95,alphaQuality:100}).toBuffer();type='image/webp';}const result=`data:${type};base64,${bytes.toString('base64')}`;embedded.set(url,result);return result;};
  for(const variant of [result.square,result.story]){
    const doc=variant.cocoCompositionSystem.compiledDocument;
    for(const obj of doc.objects){
      if(obj.image?.src)obj.image.src=await embed(obj.image.src);
      if(obj.paint?.backgroundImage?.startsWith('url(')){
        const url=obj.paint.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)[1];
        obj.paint.backgroundImage=`url("${await embed(url)}")`;
      }
    }
    variant.cocoCssCompiler.ir=doc;
    for(const assets of [variant.portraits,variant.emojiList])for(const asset of assets){const obj=doc.objects.find(o=>o.id===asset.cocoCompiledObjectId);if(obj?.image)asset.url=obj.image.src;}
  }
  await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
  console.log(JSON.stringify({output:cocoCssMasterAdapter.outputPath.pathname,square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildBrunchSaturdayMaster();
