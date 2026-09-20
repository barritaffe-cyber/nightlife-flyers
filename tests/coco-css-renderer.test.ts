import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { measureAndFitCssStudio } from '../lib/coco/renderCssStudio.ts';
import type {ReferenceBlock} from '../lib/coco/cssReferenceLayout.ts';

test('rejects mid-word wrapping and preserves intended line groups when fitting',async()=>{
  const html='<style>[data-coco-canvas]{position:relative;width:400px;height:600px} [data-region]{position:absolute;left:40px;top:40px;width:30px;font:40px Arial;overflow-wrap:anywhere} [data-region="features"]{top:250px;width:100px}</style><main data-coco-canvas><div data-region="date" data-coco-kind="text" data-coco-role="date">SUN</div><div data-region="features" data-coco-kind="text" data-coco-role="details">DELICIOUS<br>BEAUTIFUL</div></main>';
  const blocks:ReferenceBlock[]=[{id:'date',kind:'text',role:'date',text:'SUN',x:10,y:10,width:20,height:8,fontSize:10,weight:400,align:'left'},{id:'features',kind:'text',role:'details',text:'DELICIOUS\nBEAUTIFUL',x:10,y:40,width:25,height:20,fontSize:10,weight:400,align:'left'}];
  const broken=await measureAndFitCssStudio(html,400,600,blocks);
  assert.ok(broken.measurements.every(block=>!block.pass));
  assert.match(broken.measurements[0].problem,/Line grouping/);
  const fixed=await measureAndFitCssStudio(html,400,600,blocks,false,true);
  assert.ok(fixed.measurements.every(block=>block.pass),JSON.stringify(fixed.measurements));
  assert.match(fixed.html,/DELICIOUS<br>BEAUTIFUL/);
});

test('Brunch reference CSS survives measurement without changing its rendered pixels', async () => {
  let html=await readFile(resolve('public/generated-flyers/brunch-vibes-rebuild.html'),'utf8');
  // Embed local resources exactly as the tool does; no network or AI calls.
  const paths=[...new Set(html.match(/\/(?:fonts|generated-flyers\/assets)\/[^'"()]+/g)||[])];
  for(const path of paths){
    const bytes=await readFile(resolve('public','.'+decodeURIComponent(path)));
    const mime=extname(path)==='.png'?'image/png':extname(path)==='.otf'?'font/otf':'font/ttf';
    html=html.replaceAll(path,`data:${mime};base64,${bytes.toString('base64')}`);
  }
  html=html.replace('data-region="headline"','data-coco-role="headline" data-region="headline"');
  html=html.replace('data-region="footer-rule"','data-coco-kind="shape" data-region="footer-rule"');
  const baseline=await measureAndFitCssStudio(html,1024,1536);
  // Deliberately wrong estimates must not shrink/reposition the working CSS.
  const audited=await measureAndFitCssStudio(html,1024,1536,[
    {id:'headline',kind:'text',text:'BRUNCH',role:'headline',x:0,y:0,width:10,height:2,fontSize:2,weight:700,align:'left'},
    {id:'renamed-time',kind:'text',text:'12PM\nTO\n6PM',role:'time',x:0,y:0,width:10,height:2,fontSize:1,weight:400,align:'left'},
    {id:'headline2',kind:'text',text:'Vibes',role:'headline2',x:0,y:0,width:10,height:2,fontSize:1,weight:400,align:'left'},
    {id:'renamed-footer-rule',kind:'shape',text:'',role:'divider',x:43,y:98.3,width:14.4,height:.07,fontSize:0,weight:400,align:'left'},
  ]);
  assert.deepEqual(audited.screenshot,baseline.screenshot);
  assert.match(audited.html,/<span>TO<\/span>/);
  assert.match(audited.html,/rotate\(-12deg\)/);
  assert.match(audited.html,/linear-gradient/);
  assert.equal(audited.measurements.length,4);
  const script=audited.measurements.find(block=>block.id==='headline2');
  assert.ok(script?.ink && script.ink.width>0 && script.ink.height>0);
  assert.doesNotMatch(audited.html,/data-ink-probe|coco-ink-probe-style/);
  assert.equal(audited.measurements.find(block=>block.id==='renamed-time')?.problem,'');
  const rule=audited.measurements.find(block=>block.id==='renamed-footer-rule');
  assert.ok(rule?.ink && rule.ink.width>=140 && rule.ink.height===1);
  assert.equal(typeof rule?.css?.backgroundColor,'string');
  assert.equal(typeof rule?.css?.borderTop,'string');
  assert.equal(typeof rule?.css?.opacity,'string');
});

test('explicit OCR fitting translates and uniformly scales actual ink, then remeasures it',async()=>{
  const html='<style>[data-coco-canvas]{position:relative;width:400px;height:600px} [data-region]{position:absolute;left:30px;top:100px;font:70px Arial;transform:rotate(-3deg);transform-origin:50% 50%}</style><main data-coco-canvas><div data-region="weekday" data-coco-role="date" data-coco-kind="text">SUN</div></main>';
  const block:ReferenceBlock={id:'weekday',kind:'text',role:'date',text:'SUN',x:10,y:10,width:30,height:10,fontSize:17.5,weight:400,align:'left'};
  const baseline=await measureAndFitCssStudio(html,400,600,[block]);
  const ink=baseline.measurements[0].ink!;
  const target:ReferenceBlock={...block,x:25,y:30,width:ink.width/2/400*100,height:ink.height/2/600*100,measurementSource:'on-device-ocr'};
  const result=await measureAndFitCssStudio(html,400,600,[target],false,true);
  const fitted=result.measurements[0].ink!;
  assert.ok(Math.abs(fitted.x-100)<=2);
  assert.ok(Math.abs(fitted.y-180)<=2);
  assert.ok(Math.abs(fitted.width-ink.width/2)<=2);
  assert.ok(Math.abs(fitted.height-ink.height/2)<=2);
  assert.equal(result.measurements[0].fontSize,70);
  assert.match(result.html,/data-coco-ocr-fit="true"/);
});

test('composition fit prevents gradient boxes from hiding the final headline letters',async()=>{
  const html='<style>[data-coco-canvas]{position:relative;width:400px;height:600px} [data-region]{position:absolute;left:40px;top:100px;width:300px;white-space:nowrap;font:150px Arial;line-height:70px;background:linear-gradient(red,blue);background-clip:text;color:transparent}</style><main data-coco-canvas><div data-region="headline" data-coco-role="headline" data-coco-kind="text">BRUNCH</div></main>';
  const block:ReferenceBlock={id:'headline',kind:'text',role:'headline',text:'BRUNCH',x:10,y:15,width:75,height:20,fontSize:20,weight:400,align:'left'};
  const result=await measureAndFitCssStudio(html,400,600,[block],false,true);
  assert.equal(result.measurements[0].pass,true);
  assert.ok(result.measurements[0].actual!.width<=300);
  assert.match(result.html,/data-coco-overflow-fit="true"/);
  assert.match(result.html,/data-coco-gradient-fit="true"/);
  assert.ok(result.measurements[0].ink!.height>result.measurements[0].fontSize!*.65);
  assert.match(result.html,/linear-gradient/);
  const revised=await measureAndFitCssStudio(result.html+'<style>[data-region="headline"]{font-size:30px!important;line-height:40px!important}</style>',400,600,[block],false,true);
  assert.equal(revised.measurements[0].fontSize,30,'a previous automatic inline fit must not block a later CSS correction');
});
