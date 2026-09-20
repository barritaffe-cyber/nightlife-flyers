import { access, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { compileCssMaster } from './lib/coco-css-master-compiler.mjs';
import { createPortableCocoProject } from './lib/coco-materializer.mjs';
import { withCompiledTextSelection } from '../lib/coco/compiledTextSelection.ts';

const native = {presenter:'presenter',headline:'headline',subtitle:'headline2',date:'date',time:'time',genres:'details',venue:'venue',address:'address'};
const companions = {presents:['presents','presenter'],day:['weekday','date'],month:['month','date'],tagline:['tagline','details'],djLabel:['djLineupLabel','details2'],dj1:['dj1','details2'],dj2:['dj2','details2'],experience:['eventDetails','details'],entry:['freeEntryCondition','details'],dressLabel:['dressLabel','details'],dress:['dressCode','details'],motto:['motto','details'],badgeTitle:['badgeTitle','details'],badgeCaption:['badgeCaption','details'],signoff:['signoff','details']};
const semanticRoles = {
 ...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),
 ...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel]])=>[id,{semanticRole,text:id==='djLabel'?'djLineupLabel':`softLife_${id}`,panel,uiField:id==='djLabel'?'djLineupLabel':panel,moveTarget:panel,mappedControls:true,editable:true}])),
 background:{semanticRole:'background',editable:false},
 ...Object.fromEntries(['r1','r2','r3','oval','oval2'].map(id=>[id,{editable:false}]))
};
const fontMap = {SoftSerif:'Avigea',Hand:'Northwell',Sans:'LEMONMILK-Light',Medium:'LEMONMILK-Regular',
 ...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,['headline','date','month','dj1','dj2','venue'].includes(id)?'Avigea':id==='subtitle'?'Northwell':['motto','badgeTitle','signoff'].includes(id)?'Northwell':['entry','dressLabel','dress','address','badgeCaption'].includes(id)?'LEMONMILK-Regular':'LEMONMILK-Light']))};
export const cocoCssMasterAdapter = {
  id:'soft-life', masterPath:new URL('../public/generated-flyers/soft-life-master.html',import.meta.url),
  outputPath:new URL('../public/generated-flyers/soft-life.nflyer',import.meta.url), publicRoot:new URL('../public/',import.meta.url),
  editorTextScale:.5, requiredFonts:['SoftSerif','Hand','Sans','Medium'], requiredRoles:Object.values(native), semanticRoles, fontMap,
  recipe:{id:'soft-life',name:'Soft Life',version:1,summary:'Glossy crimson serif type, gold script and blush editorial R&B information around the supplied fashion photograph.',runtime:{
    compositionPattern:'center-poster-stack',styleId:'black-electric',
    palette:{bgFrom:'#f9e3d3',bgTo:'#f5dcc9',primary:'#a90028',secondary:'#edc997',accent:'#bd1239',neutral:'#16120f'},
    authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},
    formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}},
  }}, eventBrief:{eventName:'SOFT',subtitle:'Life',date:'24',presenterName:'CLUB WOODS',startTime:'9PM\nTILL LATE',djs:'DJ SPICE | DJ ELEVATE',venueName:'CLUB WOODS',address:'234 WEST AVENUE STREET'},
};

export async function buildSoftLifeMaster() {
  if (await access(new URL('../lib/template-data/soft-life-saved-source.json',import.meta.url)).then(()=>true,()=>false)) {
    throw new Error('Soft Life has an accepted user save; preserve it instead of rebuilding.');
  }
  const result = await compileCssMaster(cocoCssMasterAdapter);
  const blank = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
  for (const v of [result.square,result.story]) {
    Object.assign(v,{
      backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,rightRailEnabled:false,rightRailLabel:'',
      presenterEnabled:true,venueEnabled:true,priceEnabled:false,priceLabel:'',qrEnabled:false,qrImageUrl:null,
      leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:true,headShadowStrength:1,head2Shadow:true,head2ShadowStrength:1,detailsShadow:false,venueShadow:false,
      socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:true,details2:'',djLineupLabel:'MUSIC BY',
      exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0,
    });
    const doc = v.cocoCompositionSystem.compiledDocument;
    const body = doc.objects.find(o=>o.id==='genres');
    const bounds = {x:4,y:v===result.story?64:76,width:35,height:1};
    doc.objects.push({...structuredClone(body),id:'detailsLabel',sourceObjectId:'detailsLabel',semanticRole:'detailsLabel',text:'',textRuns:[],bounds,paintBounds:bounds,
      typography:{...body.typography,fontSizePx:6,lineHeight:1.4},
      binding:{text:'detailsLabel',size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily',panel:'details',moveTarget:'details',uiField:'detailsLabel',mappedControls:true,initial:{text:'',size:6,color:'#18130f'}},
    });
    v.detailsLabel='';v.detailsLabelSize=6;v.detailsLabelColor='#18130f';v.detailsTracking=v.bodyTracking;
    v.head2Fx={...v.head2Fx,shadowEnabled:true,uppercase:false,tracking:doc.objects.find(o=>o.id==='subtitle').typography.letterSpacingEm};
    doc.objects=doc.objects.map(withCompiledTextSelection).map(o=>{
      if(o.kind!=='text')return o;
      
      if(o.id==='subtitle')o.binding.tracking='head2Tracking';
      o.binding.pixelHitBounds=true;
      if(o.paint?.backgroundImage)o.paint.backgroundImage=o.paint.backgroundImage.replace(/http:\/\/(?:127\.0\.0\.1|localhost):\d+/g,'');
      if(o.binding.panel==='details')o.binding.labelObjectId='detailsLabel';
      if(o.id==='dress')o.binding.labelObjectId='dressLabel';
      if(o.binding.panel==='details2' && o.id!=='djLabel')o.binding.labelObjectId='djLabel';
      if(['details','venue','details2'].includes(o.binding.panel))o.binding.mappedControls=true;
      return o;
    });
    doc.report.compiled=doc.objects.length;
    v.textFx={...v.textFx,uppercase:false};v.headlineUppercase=false;v.cocoCssCompiler.ir=doc;
  }
  await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
  await writeFile(new URL('../lib/template-data/soft-life-v1.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
  console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
  return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)await buildSoftLifeMaster();
