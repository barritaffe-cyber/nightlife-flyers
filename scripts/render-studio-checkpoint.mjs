import {readFile,writeFile} from 'node:fs/promises';
import {measureAndFitCssStudio} from '../lib/coco/renderCssStudio.ts';
const [source,destination,width='1024',height='1536']=process.argv.slice(2);
if(!source||!destination)throw new Error('Usage: render-studio-checkpoint.mjs source.html output.png [width height]');
const rendered=await measureAndFitCssStudio(await readFile(source,'utf8'),Number(width),Number(height));
await writeFile(destination,rendered.screenshot);
console.log(destination);
