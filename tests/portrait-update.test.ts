import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
// Execute the production action without loading browser-only editor modules.
const source=readFileSync('app/state/flyerState.ts','utf8');
const file=ts.createSourceFile('flyerState.ts',source,ts.ScriptTarget.Latest,true);
let action='';
function visit(node:ts.Node){
 if(ts.isPropertyAssignment(node)&&node.name.getText(file)==='updatePortrait')action=node.initializer.getText(file);
 ts.forEachChild(node,visit);
}
visit(file);assert.ok(action);
const js=ts.transpileModule(`(${action})`,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
function fixture(portrait:any){
 let state:any={portraits:{square:[portrait],story:[]},emojis:{square:[],story:[]},session:{square:{},story:{}}};
 let notifications=0,syncs=0;
 const update=vm.runInNewContext(js,{
  set:(fn:any)=>{const patch=fn(state);if(patch!==state){state={...state,...patch};notifications++;}},
  buildAssetSessionState:(s:any,fmt:string,portraits:any[])=>{syncs++;return {session:{...s.session,[fmt]:{portraits}}};},
 });
 return {update,read:()=>({state,notifications,syncs})};
}
test('unchanged scale and missing portrait do not publish store/session updates',()=>{
 const f=fixture({id:'subject',scale:1});const before=f.read().state;
 for(let i=0;i<100;i++)f.update('square','subject',{scale:1});
 f.update('square','missing',{scale:2});
 assert.equal(f.read().state,before);assert.equal(f.read().notifications,0);assert.equal(f.read().syncs,0);
});
test('real scale edits retain off-canvas position and synchronize extraction geometry',()=>{
 const f=fixture({id:'subject',x:-20,y:50,scale:1,isExtracted:true,extraction:{canvas:{x:-20,y:50,scale:1,width:60,height:80}}});
 f.update('square','subject',{scale:4});
 const first=f.read();const p=first.state.portraits.square[0];
 assert.equal(p.scale,4);assert.equal(p.x,-20);assert.equal(p.extraction.canvas.width,240);assert.equal(p.extraction.canvas.height,320);
 assert.equal(first.state.session.square.portraits[0],p);
 for(let i=0;i<100;i++)f.update('square','subject',{scale:4});
 assert.equal(f.read().notifications,1);assert.equal(f.read().state,first.state);
 f.update('square','subject',{scale:1});assert.equal(f.read().state.portraits.square[0].extraction.canvas.width,60);
});
