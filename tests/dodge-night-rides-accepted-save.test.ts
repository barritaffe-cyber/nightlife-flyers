import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const meta=JSON.parse(readFileSync('lib/template-data/dodge-night-rides-saved-source.json','utf8'));
const bytes=readFileSync('public/generated-flyers/dodge-night-rides.nflyer');
const saved=JSON.parse(bytes.toString()).state.session;
test('Night Rides accepted source remains byte-identical to the archive',()=>{
 assert.deepEqual(bytes,readFileSync(meta.archive));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.sha256);
 for(const f of ['square','story']) assert.equal(saved[f].cocoVisualRecipeId,'dodge-night-rides');
});
function externalize(v:any):any {
 if(typeof v==='string'){
  const m=v.match(/^data:image\/(png|jpeg|webp|svg\+xml);base64,(.*)$/s);if(!m)return v;
  const hash=createHash('sha256').update(Buffer.from(m[2],'base64')).digest('hex').slice(0,24);
  const ext=m[1]==='jpeg'?'jpg':m[1]==='svg+xml'?'svg':m[1];
  return `/generated-flyers/assets/registered-recipes/${hash}.${ext}`;
 }
 if(Array.isArray(v))return v.map(externalize);
 if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,externalize(x)]));
 return v;
}
test('Night Rides gallery preserves every accepted Square and Story setting',()=>{
 const gallery=JSON.parse(readFileSync('lib/template-data/registered-recipes.json','utf8')).find((t:any)=>t.recipeId==='dodge-night-rides');
 for(const f of ['square','story']){
  const expected=externalize(saved[f]);
  if(expected.portraits?.length)expected.emojiList=expected.portraits;
  delete expected.portraits;delete expected.emojis;
  assert.deepEqual(gallery.formats[f],expected);
 }
});
