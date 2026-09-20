import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=new URL('../public/generated-flyers/new-york.nflyer',import.meta.url);
const bytes=await readFile(source);const project=JSON.parse(bytes);const sessions=project.state?.session;
for(const format of ['square','story'])if(sessions?.[format]?.cocoCompositionSystem?.compiledDocument?.id!=='new-york')throw new Error(`Missing New York ${format} document`);
const submittedSha256=createHash('sha256').update(bytes).digest('hex');
const submittedPath=`public/generated-flyers/new-york-submitted-${submittedSha256.slice(0,12)}.nflyer`;
await writeFile(new URL('../'+submittedPath,import.meta.url),bytes);
// Authored image objects already own the city backgrounds. A nonempty transparent
// base prevents gallery loading from substituting the finished flyer preview.
const blank="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
for(const state of [project.state,sessions.square,sessions.story]){
 if ([state.bgUrl,state.backgroundUrl].some(url => /^\/generated-flyers\/new-york-(square|story)-preview\.png(?:[?#].*)?$/.test(String(url || '')))) {
  state.bgUrl=blank;state.backgroundUrl=blank;
 }
}
const corrected=JSON.stringify(project,null,2)+'\n';
await writeFile(source,corrected);
await writeFile(new URL('../public/generated-flyers/new-york-updated.nflyer',import.meta.url),corrected);
await writeFile(new URL('../lib/template-data/new-york-v2.json',import.meta.url),JSON.stringify({square:sessions.square,story:sessions.story},null,2)+'\n');
const metadata={source:'public/generated-flyers/new-york.nflyer',submittedPath,submittedSha256,sha256:createHash('sha256').update(corrected).digest('hex'),savedAt:project.state.savedAt,format:project.state.format,correction:'Only root and Square/Story bgUrl/backgroundUrl replaced with transparent base; authored background objects and all user edits retained.'};
await writeFile(new URL('../lib/template-data/new-york-saved-source.json',import.meta.url),JSON.stringify(metadata,null,2)+'\n');
console.log(metadata);
