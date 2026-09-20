import { access, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { compileCssMaster } from './lib/coco-css-master-compiler.mjs';
import { createPortableCocoProject } from './lib/coco-materializer.mjs';
import { withCompiledTextSelection } from '../lib/coco/compiledTextSelection.ts';

const native = {presenter:'presenter',headline:'headline',subtitle:'headline2',date:'date',time:'time',genres:'details',venue:'venue',address:'address'};
const companions = {day:['weekday','date'],month:['month','date'],presents:['presenterLabel','presenter'],age:['ageRequirement','details'],djLabel:['djLineupLabel','details2'],dj1:['djs','details2'],mood:['mood','details'],motto:['motto','details'],tagline:['tagline','details']};
const semanticRoles = {...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel]])=>[id,{semanticRole,text:id==='djLabel'?'djLineupLabel':`honeyNights_${id}`,panel,uiField:id==='djLabel'?'djLineupLabel':panel,moveTarget:panel,mappedControls:true,editable:true}])),background:{semanticRole:'background',editable:false},...Object.fromEntries(['rDate','rMotto','rTagline','rMood','rMoodTop','rDjs','rGenres','rTime','rAge','bee'].map(id=>[id,{editable:false}]))};
const fontMap={Honey:'Honey Gold Serif PNG',HoneySerif:'Avigea',Sans:'LEMONMILK-Light',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='headline'?'Honey Gold Serif PNG':['subtitle','day','month','date','time','age','dj1'].includes(id)?'Avigea':'LEMONMILK-Light']))};
export const cocoCssMasterAdapter = {
  id:'honey-nights', masterPath:new URL('../public/generated-flyers/honey-nights-master.html',import.meta.url),
  outputPath:new URL('../public/generated-flyers/honey-nights.nflyer',import.meta.url), publicRoot:new URL('../public/',import.meta.url),
  editorTextScale:.5, requiredFonts:['Honey','HoneySerif','Sans'], requiredRoles:Object.values(native), semanticRoles, fontMap,
  recipe:{id:'honey-nights',name:'Honey Nights',version:1,summary:'Honey gold lettering on black stone, a central bee medallion and independent event information.',runtime:{
    compositionPattern:'center-poster-stack',styleId:'black-electric',
    palette:{bgFrom:'#0b0906',bgTo:'#34281c',primary:'#eabb58',secondary:'#eee9df',accent:'#dcae48',neutral:'#eee9df'},
    authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},
    formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}},
  }}, eventBrief:{eventName:'HONEY',subtitle:'NIGHTS',date:'24',startTime:'10PM',djs:'DJ HARDBEL × DJ ANGELO',venueName:'CLUB WOODS',address:'1234 WEST AVENUE STREET, CITY'},
};

export async function buildHoneyNightsMaster() {
  if (await access(new URL('../lib/template-data/honey-nights-saved-source.json',import.meta.url)).then(()=>true,()=>false)) {
    throw new Error('Honey Nights has an accepted user save; preserve it instead of rebuilding.');
  }
  const result = await compileCssMaster(cocoCssMasterAdapter);
  const blank = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
  for (const v of [result.square,result.story]) {
    Object.assign(v,{
      backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,rightRailEnabled:false,rightRailLabel:'',
      presenterEnabled:true,venueEnabled:true,priceEnabled:false,priceLabel:'',qrEnabled:false,qrImageUrl:null,
      leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:false,headShadowStrength:1,head2Shadow:false,head2ShadowStrength:1,detailsShadow:false,venueShadow:false,
      socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:true,details2:'',djLineupLabel:'SOUNDS BY',
      exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0,
    });
    const doc = v.cocoCompositionSystem.compiledDocument;
    const body = doc.objects.find(o=>o.id==='genres');
    const bounds = {x:25,y:v===result.story?1555/19.2:900/10.8,width:50,height:1};
    doc.objects.push({...structuredClone(body),id:'detailsLabel',sourceObjectId:'detailsLabel',semanticRole:'detailsLabel',text:'',textRuns:[],bounds,paintBounds:bounds,
      typography:{...body.typography,fontSizePx:6,lineHeight:1.4},
      binding:{text:'detailsLabel',size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily',panel:'details',moveTarget:'details',uiField:'detailsLabel',mappedControls:true,initial:{text:'',size:6,color:'#eee9df'}},
    });
    v.detailsLabel='';v.detailsLabelSize=6;v.detailsLabelColor='#eee9df';v.detailsTracking=v.bodyTracking;
    v.head2Fx={...v.head2Fx,shadowEnabled:false,uppercase:false,tracking:doc.objects.find(o=>o.id==='subtitle').typography.letterSpacingEm};
    doc.objects=doc.objects.map(withCompiledTextSelection).map(o=>{
      if(o.kind!=='text')return o;
      
      if(o.id==='subtitle')o.binding.tracking='head2Tracking';
      o.binding.pixelHitBounds=true;
      if(o.paint?.backgroundImage)o.paint.backgroundImage=o.paint.backgroundImage.replace(/http:\/\/(?:127\.0\.0\.1|localhost):\d+/g,'');
      if(o.binding.panel==='details')o.binding.labelObjectId='detailsLabel';
      if(o.id==='presenter')o.binding.labelObjectId='presents';
      if(o.binding.panel==='details2' && o.id!=='djLabel')o.binding.labelObjectId='djLabel';
      if(['details','venue','details2'].includes(o.binding.panel))o.binding.mappedControls=true;
      return o;
    });
    doc.report.compiled=doc.objects.length;
    v.textFx={...v.textFx,uppercase:false};v.headlineUppercase=false;v.cocoCssCompiler.ir=doc;
  }
  await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
  await writeFile(new URL('../lib/template-data/honey-nights-v1.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
  console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
  return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)await buildHoneyNightsMaster();
