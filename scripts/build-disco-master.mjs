import {writeFile,access} from 'node:fs/promises';
import {compileCssMaster} from './lib/coco-css-master-compiler.mjs';
import {createPortableCocoProject} from './lib/coco-materializer.mjs';
import {withCompiledTextSelection} from '../lib/coco/compiledTextSelection.ts';

const native={presenter:'presenter',headline:'headline',subtitle:'headline2',genres:'details',date:'date',venue:'venue',address:'address',dj2:'djLineup',musicLabel:'djLineupLabel',reserve:'footerDetails'};
const companions={presents:['presents','presenter','presenter'],day:['day','date','date'],month:['month','date','date'],mood:['mood','details','details'],dj1:['dj1','details2','details2'],dj3:['dj3','details2','details2'],tagline:['tagline','details','details'],city:['venueCompanion','venue','venueAddress'],...Object.fromEntries(['entry','entryNote'].map(id=>[id,[id,'details','details']]))};
const semanticRoles={...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel,uiField]])=>[id,{semanticRole,text:`disco_${id}`,panel,uiField,moveTarget:panel,mappedControls:true,editable:true}]))};
const sans=new Set(['presenter','presents','tagline','mood','musicLabel','genres','entry','entryNote','city','address','reserve']);
const fontMap={DiscoSerif:'Didot',DiscoSans:'LEMONMILK-Regular',DiscoScript:'Northwell',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='subtitle'?'Northwell':sans.has(id)?'LEMONMILK-Regular':'Didot']))};
export const cocoCssMasterAdapter={
 id:'disco',masterPath:new URL('../public/generated-flyers/disco-master.html',import.meta.url),outputPath:new URL('../public/generated-flyers/disco.nflyer',import.meta.url),publicRoot:new URL('../public/',import.meta.url),editorTextScale:.5,requiredFonts:['DiscoSerif','DiscoSans','DiscoScript'],requiredRoles:Object.values(native),semanticRoles,fontMap,
 recipe:{id:'disco',name:'Disco · Y2K',version:2,runtime:{compositionPattern:'center-poster-stack',styleId:'black-electric',palette:{bgFrom:'#17130f',bgTo:'#9c6d35',primary:'#fff7e7',secondary:'#9c6d35',accent:'#dfbf7b',neutral:'#fff7e7'},authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}}}},eventBrief:{eventName:'Y2K',subtitle:'Disco',date:'OCT 12'}
};
if(await access(new URL('../lib/template-data/disco-saved-source.json',import.meta.url)).then(()=>true,()=>false))throw Error('Disco has an accepted user save; preserve it instead of rebuilding.');
const result=await compileCssMaster(cocoCssMasterAdapter);
const blank="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
for(const v of [result.square,result.story]){
 Object.assign(v,{backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,subtag:'',priceEnabled:false,priceLabel:'',qrEnabled:false,socialHandleEnabled:false,cocoSocialHandleEnabled:false,exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0});
 const doc=v.cocoCompositionSystem.compiledDocument;doc.objects=doc.objects.map(withCompiledTextSelection);
 doc.objects.find(object=>object.id==='headline').paint.textEffect='gold-specular-v1';
 v.cocoCssCompiler.ir=doc;
}
await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
await writeFile(new URL('../lib/template-data/disco-v2.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
