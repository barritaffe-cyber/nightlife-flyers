import measuredReference from './whimsicalReference.json' with { type: 'json' };

export type WhimsicalGlyph = { path:string; advance:number; bounds:number[]; inkColumns?:number[][] };
type VectorShape = {path:string; width:number; height:number; inkColumns?:number[][]};
export type WhimsicalVectorData = {
  unitsPerEm:number; glyphs:Record<string,WhimsicalGlyph>;
  kerning:Record<string,number>; ornaments:Record<string,VectorShape>;
};
type Box = {x:number;y:number;width:number;height:number};
type Frame = [string,number,number,number,number];
type Letter = {char:string;glyph:WhimsicalGlyph|undefined;x:number;transform:string;box:Box};
type Ornament = Box & {name:string;path:string;transform:string};
type Layout = {letters:Letter[];ornaments:Ornament[];clearance:number;referenceScale:number;wordBounds:number[];viewBox:number[]};
const reference = measuredReference;
const referenceLetters = reference.letters as Frame[];
const referenceOrnaments = reference.ornaments as Frame[];
const caches = new WeakMap<WhimsicalVectorData,Map<string,Layout>>();

function union(boxes:Box[]):Box {
  if(!boxes.length)return {x:0,y:0,width:1,height:1};
  const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
  return {x,y,width:Math.max(...boxes.map(b=>b.x+b.width))-x,height:Math.max(...boxes.map(b=>b.y+b.height))-y};
}
function columns(shape:WhimsicalGlyph|VectorShape,box:Box,mirror=false):Box[] {
  const bounds='bounds' in shape ? shape.bounds : [0,0,shape.width,shape.height];
  const [x0,y0,x1,y1]=bounds, sx=box.width/(x1-x0),sy=box.height/(y1-y0);
  const ink=shape.inkColumns?.length ? shape.inkColumns : [[x0,x1,y0,y1]];
  return ink.map(([left,right,top,bottom])=>({
    x:box.x+(mirror?x1-right:left-x0)*sx,y:box.y+(top-y0)*sy,
    width:(right-left)*sx,height:(bottom-top)*sy,
  }));
}
function clearOf(ink:Box[],obstacles:Box[],gap:number):boolean {
  const maxWidth=Math.max(0,...obstacles.map(b=>b.width));
  for(const a of ink){
    let low=0,high=obstacles.length;
    const start=a.x-gap-maxWidth;
    while(low<high){const mid=(low+high)>>>1;if(obstacles[mid].x<start)low=mid+1;else high=mid;}
    for(let i=low;i<obstacles.length;i++){
      const b=obstacles[i];if(b.x>a.x+a.width+gap)break;
      const dx=Math.max(0,a.x-b.x-b.width,b.x-a.x-a.width);
      const dy=Math.max(0,a.y-b.y-b.height,b.y-a.y-a.height);
      if(dx*dx+dy*dy<gap*gap)return false;
    }
  }
  return true;
}

/** Letter proportions and joins learned from the corrected Brunch composition. */
function letterFrames(text:string,data:WhimsicalVectorData):Frame[] {
  if(text===reference.word)return referenceLetters;
  const known=new Map(referenceLetters.map(f=>[f[0],f]));
  const frameScale=(char:string)=>{
    const f=known.get(char)!,b=data.glyphs[char].bounds;
    return [f[3]/(b[2]-b[0]),f[4]/(b[3]-b[1])];
  };
  const capScale=frameScale('B'),ascenderScale=frameScale('h');
  const bodyScales=['r','u','n','c'].map(frameScale);
  const bodyScale=[0,1].map(axis=>bodyScales.reduce((n,s)=>n+s[axis],0)/bodyScales.length);
  const r=known.get('r')!,h=known.get('h')!,b=known.get('B')!;
  const rBaseline=r[2]-data.glyphs.r.bounds[1]*frameScale('r')[1];
  const hBaseline=h[2]-data.glyphs.h.bounds[1]*ascenderScale[1];
  const rise=(hBaseline-rBaseline)/(h[1]-r[1]);
  const capBaseline=b[2]-data.glyphs.B.bounds[1]*capScale[1];
  const bodyOverlap=referenceLetters.slice(1,-1).reduce((n,f,i)=>n+(f[1]+f[3]-referenceLetters[i+2][1])/f[3],0)/4;
  const capAdvance=(r[1]-b[1])/b[3];
  let x=reference.wordBounds[0],bodyStart=x;
  return Array.from(text).map((char,index)=>{
    const glyph=data.glyphs[char],bounds=glyph?.bounds??[0,-700,700,0];
    const isCapital=/[A-Z]/.test(char),firstCapital=index===0&&isCapital;
    const scale=known.has(char)?frameScale(char):isCapital?capScale:/[bdfhklt]/.test(char)?ascenderScale:bodyScale;
    const width=(bounds[2]-bounds[0])*scale[0],height=(bounds[3]-bounds[1])*scale[1];
    let baseline=firstCapital?capBaseline:rBaseline+(x-bodyStart)*rise;
    const source=known.get(char);
    if(source&&!firstCapital&&char!=='B'){
      const measuredBaseline=source[2]-bounds[1]*scale[1];
      baseline+=measuredBaseline-(rBaseline+(source[1]-r[1])*rise);
    }
    const frame:Frame=[char,x,baseline+bounds[1]*scale[1],width,height];
    x+=width*(firstCapital?capAdvance:1-bodyOverlap);
    if(firstCapital)bodyStart=x;
    return frame;
  });
}

/** Fit reference-sized flourishes into actual empty ink; never move the letters. */
export function layoutWhimsicalWord(text:string,data:WhimsicalVectorData,tracking=0,whimsy=1):Layout {
  let cache=caches.get(data);if(!cache){cache=new Map();caches.set(data,cache);}
  const key=JSON.stringify([text,tracking,whimsy]);const cached=cache.get(key);if(cached)return cached;
  const em=data.unitsPerEm, unit=.75*em/reference.capHeight;
  const clearance=reference.clearance*unit;
  const frames=letterFrames(text,data);
  const letters:Letter[]=frames.map(([char,x,y,width,height],index)=>{
    const glyph=data.glyphs[char],bounds=glyph?.bounds??[0,-700,700,0];
    const box={x:(x-reference.wordBounds[0])*unit+index*tracking*em,
      y:(y-reference.baseline)*unit,width:width*unit,height:height*unit};
    return {char,glyph,x:box.x,box,
      transform:`translate(${box.x} ${box.y}) scale(${box.width/(bounds[2]-bounds[0])} ${box.height/(bounds[3]-bounds[1])}) translate(${-bounds[0]} ${-bounds[1]})`};
  });
  const bounds=union(letters.map(l=>l.box));
  const natural=union(letters.map((l,i)=>({...l.box,x:l.box.x-i*tracking*em})));
  let obstacles=letters.flatMap(l=>l.glyph?columns(l.glyph,l.box):[l.box]).sort((a,b)=>a.x-b.x);
  const candidates=referenceOrnaments.map(([name,x,y,width,height])=>{
    // Swashes follow the natural word length, never shrinking when tracking closes.
    const lengthScale=name==='top'||name==='bottom'?natural.width/(reference.wordBounds[2]*unit):1;
    const w=width*unit*lengthScale,h=height*unit;
    const cx=(x+width/2-reference.wordBounds[0])/reference.wordBounds[2];
    const v=(y-reference.wordBounds[1])/reference.wordBounds[3];
    const box={x:bounds.x+cx*bounds.width-w/2,y:bounds.y+v*bounds.height,width:w,height:h};
    const source=data.ornaments[name.includes('Burst')?'burst':name];
    return {...box,name,path:source.path,source,
      transform:`translate(${name==='rightBurst'?box.x+w:box.x} ${box.y}) scale(${(name==='rightBurst'?-1:1)*w/source.width} ${h/source.height})`};
  });
  const naturalNames=tracking<0?new Set(layoutWhimsicalWord(text,data,0,whimsy).ornaments.map(o=>o.name)):null;
  const ornaments:Ornament[]=[];
  if(letters.length>=3&&whimsy>0&&letters.every(l=>l.glyph))for(const candidate of candidates){
    if(naturalNames&&!naturalNames.has(candidate.name))continue;
    if(whimsy<.3&&candidate.name!=='bottom')continue;
    if(whimsy<.65&&candidate.name!=='bottom'&&candidate.name!=='top')continue;
    if((candidate.name==='top'||candidate.name==='bottom')&&candidate.width+2*clearance>bounds.width)continue;
    const ink=columns(candidate.source,candidate,candidate.name==='rightBurst');
    if(!clearOf(ink,obstacles,clearance))continue;
    ornaments.push({name:candidate.name,path:candidate.path,transform:candidate.transform,
      x:candidate.x,y:candidate.y,width:candidate.width,height:candidate.height});
    obstacles=[...obstacles,...ink].sort((a,b)=>a.x-b.x);
  }
  // The reference's side accents are a balanced pair; never leave one stranded.
  if(ornaments.filter(o=>o.name.includes('Burst')).length===1){
    const index=ornaments.findIndex(o=>o.name.includes('Burst'));ornaments.splice(index,1);
  }
  // Reserve the measured frame even while ornaments are hidden during typing.
  const frame=union([...letters.map(l=>l.box),...candidates]);
  const [left,top,right,bottom]=reference.padding.map(n=>n*unit);
  const layout={letters,ornaments,clearance,referenceScale:unit,
    wordBounds:[bounds.x,bounds.y,bounds.width,bounds.height],
    viewBox:[frame.x-left,frame.y-top,frame.width+left+right,frame.height+top+bottom]};
  cache.set(key,layout);if(cache.size>160)cache.delete(cache.keys().next().value!);
  return layout;
}
