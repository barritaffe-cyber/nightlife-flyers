import { access, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { compileCssMaster } from './lib/coco-css-master-compiler.mjs';
import { createPortableCocoProject } from './lib/coco-materializer.mjs';
import { withCompiledTextSelection } from '../lib/coco/compiledTextSelection.ts';

const native = {headline:'headline',subtitle:'headline2',date:'date',time:'time',genres:'details',venue:'venue',address:'address'};
const companions = {day:['weekday','date'],month:['month','date'],endTime:['endTime','time'],djLabel:['djLineupLabel','details2'],dj1:['dj1','details2'],dj2:['dj2','details2'],dj3:['dj3','details2'],mood:['mood','details'],motto:['motto','details'],tagline:['tagline','details'],venueCaption:['venueCaption','venue'],contactLabel:['contactLabel','details'],contact:['bookingContact','details']};
const semanticRoles = {...Object.fromEntries(Object.entries(native).map(([id,semanticRole])=>[id,{semanticRole}])),...Object.fromEntries(Object.entries(companions).map(([id,[semanticRole,panel]])=>[id,{semanticRole,text:id==='djLabel'?'djLineupLabel':`girlCode_${id}`,panel,uiField:id==='djLabel'?'djLineupLabel':panel,moveTarget:panel,mappedControls:true,editable:true}])),background:{semanticRole:'background',editable:false},...Object.fromEntries(['legibility','rMood','rMotto','rDate','rDjs','rVenue','crown','heart'].map(id=>[id,{editable:false}]))};
const fontMap = {GoldBrush:'Drift Brush SVG',Brush:'Bad Girls Brush PNG',GirlSerif:'Avigea',Hand:'Northwell',Sans:'LEMONMILK-Light',Medium:'LEMONMILK-Regular',...Object.fromEntries(Object.keys(semanticRoles).map(id=>[id,id==='headline'?'Drift Brush SVG':id==='subtitle'?'Bad Girls Brush PNG':['date','venue'].includes(id)?'Avigea':id==='tagline'?'Northwell':['day','month','time','dj1','dj2','dj3','address','contact'].includes(id)?'LEMONMILK-Regular':'LEMONMILK-Light']))};
export const cocoCssMasterAdapter = {
  id:'girl-code', masterPath:new URL('../public/generated-flyers/girl-code-master.html',import.meta.url),
  outputPath:new URL('../public/generated-flyers/girl-code.nflyer',import.meta.url), publicRoot:new URL('../public/',import.meta.url),
  editorTextScale:.5, requiredFonts:['GoldBrush','Brush','GirlSerif','Hand','Sans','Medium'], requiredRoles:Object.values(native), semanticRoles, fontMap,
  recipe:{id:'girl-code',name:'Girl Code',version:1,summary:'Gold and ivory brush lettering above a futuristic rooftop portrait, with independent event information.',runtime:{
    compositionPattern:'center-poster-stack',styleId:'black-electric',
    palette:{bgFrom:'#071612',bgTo:'#132719',primary:'#f6ce5f',secondary:'#fff7de',accent:'#90cb15',neutral:'#fff7de'},
    authority:{layout:{owner:'recipe-elements'},palette:{owner:'recipe-element-paint'},assets:{owner:'recipe-elements'},crop:{owner:'recipe-background-image'}},
    formats:{square:{canvas:{width:1080,height:1080}},story:{canvas:{width:1080,height:1920}}},
  }}, eventBrief:{eventName:'GIRL',subtitle:'CODE',date:'17',startTime:'9PM',djs:'DJ NOVA | DJ KAY | DJ RELL',venueName:'Flyers HQ',address:'297 GRODIFY ST · NEW YORK · NY 07345'},
};

export async function buildGirlCodeMaster() {
  if (await access(new URL('../lib/template-data/girl-code-saved-source.json',import.meta.url)).then(()=>true,()=>false)) {
    throw new Error('Girl Code has an accepted user save; preserve it instead of rebuilding.');
  }
  const result = await compileCssMaster(cocoCssMasterAdapter);
  const blank = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
  for (const v of [result.square,result.story]) {
    Object.assign(v,{
      backgroundUrl:blank,bgUrl:blank,subtagEnabled:false,rightRailEnabled:false,rightRailLabel:'',
      presenterEnabled:false,venueEnabled:true,priceEnabled:false,priceLabel:'',qrEnabled:false,qrImageUrl:null,
      leftRailEnabled:false,leftRail:'',leftRailLabel:'',headShadow:true,headShadowStrength:1,head2Shadow:true,head2ShadowStrength:1,detailsShadow:false,venueShadow:false,
      socialHandleEnabled:false,cocoSocialHandleEnabled:false,details2Enabled:true,details2:'',djLineupLabel:'SOUNDS BY',
      exp:1,contrast:1/.9,saturation:1,warmth:0,tint:0,gamma:1,grain:0,vibrance:0,filmGrade:0,
    });
    const doc = v.cocoCompositionSystem.compiledDocument;
    const body = doc.objects.find(o=>o.id==='genres');
    const bounds = {x:62/10.8,y:v===result.story?1385/19.2:792/10.8,width:26,height:1};
    doc.objects.push({...structuredClone(body),id:'detailsLabel',sourceObjectId:'detailsLabel',semanticRole:'detailsLabel',text:'',textRuns:[],bounds,paintBounds:bounds,
      typography:{...body.typography,fontSizePx:6,lineHeight:1.4},
      binding:{text:'detailsLabel',size:'detailsLabelSize',color:'detailsLabelColor',family:'detailsFamily',panel:'details',moveTarget:'details',uiField:'detailsLabel',mappedControls:true,initial:{text:'',size:6,color:'#fff7de'}},
    });
    v.detailsLabel='';v.detailsLabelSize=6;v.detailsLabelColor='#fff7de';v.detailsTracking=v.bodyTracking;
    v.head2Fx={...v.head2Fx,shadowEnabled:true,uppercase:false,tracking:doc.objects.find(o=>o.id==='subtitle').typography.letterSpacingEm};
    doc.objects=doc.objects.map(withCompiledTextSelection).map(o=>{
      if(o.kind!=='text')return o;
      
      if(o.id==='subtitle')o.binding.tracking='head2Tracking';
      o.binding.pixelHitBounds=true;
      if(o.paint?.backgroundImage)o.paint.backgroundImage=o.paint.backgroundImage.replace(/http:\/\/(?:127\.0\.0\.1|localhost):\d+/g,'');
      if(o.binding.panel==='details')o.binding.labelObjectId='detailsLabel';
      if(o.id==='contact')o.binding.labelObjectId='contactLabel';
      if(o.binding.panel==='details2' && o.id!=='djLabel')o.binding.labelObjectId='djLabel';
      if(['details','venue','details2'].includes(o.binding.panel))o.binding.mappedControls=true;
      return o;
    });
    doc.report.compiled=doc.objects.length;
    v.textFx={...v.textFx,uppercase:false};v.headlineUppercase=false;v.cocoCssCompiler.ir=doc;
  }
  await writeFile(cocoCssMasterAdapter.outputPath,JSON.stringify(createPortableCocoProject(result),null,2)+'\n');
  await writeFile(new URL('../lib/template-data/girl-code-v1.json',import.meta.url),JSON.stringify({square:result.square,story:result.story},null,2)+'\n');
  console.log(JSON.stringify({square:result.square.cocoCssCompiler.report,story:result.story.cocoCssCompiler.report}));
  return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)await buildGirlCodeMaster();
