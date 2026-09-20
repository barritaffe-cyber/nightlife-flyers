// Publish only the actual reviewed tool output; never a hand-authored fallback.
import {readFile,writeFile} from 'node:fs/promises';
import {measureAndFitCssStudio} from '../lib/coco/renderCssStudio.ts';
import {previewDocument} from '../lib/coco/cssStudio.ts';
const dir='/private/tmp/brunch-studio-verification';
const result=JSON.parse(await readFile(`${dir}/result.json`,'utf8'));
if(!result.visualReview?.passed)throw new Error('Visual review has not passed; do not publish as final.');
const stem='public/generated-flyers/brunch-vibes-studio-final';
const rendered=await measureAndFitCssStudio(result.html,result.width,result.height);
await writeFile(`${stem}.html`,previewDocument(result.html,'https://invalid.local'));
await writeFile(`${stem}.png`,rendered.screenshot);
await writeFile(`${stem}.review.json`,JSON.stringify({width:result.width,height:result.height,notes:result.notes,visualReview:result.visualReview},null,2));
console.log(stem);
