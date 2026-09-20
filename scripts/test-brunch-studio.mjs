// End-to-end authoring regression: uses the same endpoint as the UI.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {measureAndFitCssStudio} from '../lib/coco/renderCssStudio.ts';
import http from 'node:http';
const dir='/private/tmp/brunch-studio-verification';
await mkdir(dir,{recursive:true});
const form=new FormData();
form.append('reference',new Blob([await readFile('public/generated-flyers/assets/brunch-final.png')],{type:'image/png'}),'brunch-final.png');
form.append('assets',new Blob([await readFile('public/generated-flyers/assets/brunch backgroud.png')],{type:'image/png'}),'brunch-background.png');
form.append('instructions','Reproduce the reference closely, including every text block and divider. Use Georgia Brush for Vibes, a thin high-contrast Didot serif for BRUNCH, and light/medium sans weights for supporting text. Preserve the large overlapping headline and brush script. Compare the reference carefully: the weekday/month are regular-weight and compact; the day numeral is medium, not heavy black. Supporting features are light sans and small with six lines; time is medium-weight, with a smaller regular TO. BRUNCH has tall proportions, not short/wide letters. Vibes is dark olive with an upward slant and overlaps the bottom of BRUNCH; do not leave a large gap or collide with the right-side copy. The footer must leave space for its bottom rule and have tracked small lettering, not bold. Match the reference ink positions and relative dimensions, not generic title hierarchy.');
if(process.argv[2]){form.append('mode','composition');form.append('source',await readFile(process.argv[2],'utf8'));}
const request=new Request('http://localhost:3000/api/flyer-css',{method:'POST',body:form});
const body=Buffer.from(await request.arrayBuffer());
const response=await new Promise((resolve,reject)=>{
  const req=http.request(request.url,{method:'POST',headers:{Origin:'http://localhost:3000','Content-Type':request.headers.get('content-type'),'Content-Length':body.length}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({ok:res.statusCode===200,result:JSON.parse(Buffer.concat(chunks).toString())}));res.on('error',reject);});
  req.setTimeout(20*60*1000,()=>req.destroy(new Error('Full workflow timeout')));req.on('error',reject);req.end(body);
});
const result=response.result;
if(!response.ok){
  await writeFile(`${dir}/failed-attempt.json`,JSON.stringify(result,null,2));
  throw new Error(result.error);
}
await writeFile(`${dir}/result.json`,JSON.stringify(result,null,2));
await writeFile(`${dir}/result.html`,result.html);
const rendered=await measureAndFitCssStudio(result.html,result.width,result.height);
await writeFile(`${dir}/result.png`,rendered.screenshot);
console.log(JSON.stringify({dir,width:result.width,height:result.height,passed:result.visualReview.passed,selectedIteration:result.visualReview.selectedIteration,checks:result.visualReview.checks,notes:result.notes},null,2));
