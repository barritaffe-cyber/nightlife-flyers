import sharp from 'sharp';

type Rect = {x:number;y:number;width:number;height:number};
type Block = {id:string;ink?:Rect|null;target?:Rect};

// Identical canvas coordinates and identical scale on both sides. Independent
// tight crops would conceal the very position/size differences being reviewed.
export function comparisonRect(block:Block,width:number,height:number) {
  const boxes=[block.target,block.ink].filter((box):box is Rect=>!!box);
  if(!boxes.length)return null;
  const pad=Math.max(32,Math.round(height*.035));
  const left=Math.max(0,Math.floor(Math.min(...boxes.map(b=>b.x))-pad));
  const top=Math.max(0,Math.floor(Math.min(...boxes.map(b=>b.y))-pad));
  const right=Math.min(width,Math.ceil(Math.max(...boxes.map(b=>b.x+b.width))+pad));
  const bottom=Math.min(height,Math.ceil(Math.max(...boxes.map(b=>b.y+b.height))+pad));
  if(right<=left||bottom<=top)return null;
  return {left,top,width:right-left,height:bottom-top};
}

export async function cssReviewCrops(reference:Buffer,render:Buffer,width:number,height:number,blocks:Block[]) {
  const original=await sharp(reference).resize(width,height,{fit:'fill'}).png().toBuffer();
  const pairs=[];
  for(const block of blocks.slice(0,24)){
    const rect=comparisonRect(block,width,height);
    if(!rect)continue;
    // Large lockups are already legible in the overview; magnify small copy.
    if(rect.width>width*.65&&rect.height>height*.15)continue;
    const sides=await Promise.all([original,render].map(bytes=>sharp(bytes).extract(rect).png().toBuffer()));
    // Sharp runs resize before composite in the same pipeline, regardless of
    // call order. Materialize the full-size pair first so wide detail crops
    // cannot become larger than their resized destination canvas.
    const composite=await sharp({create:{width:rect.width*2+8,height:rect.height,channels:3,background:'#888'}})
      .composite([{input:sides[0],left:0,top:0},{input:sides[1],left:rect.width+8,top:0}])
      .png().toBuffer();
    const pair=await sharp(composite).resize({width:1400,withoutEnlargement:true}).jpeg({quality:90}).toBuffer();
    pairs.push({type:'text' as const,text:`Detail ${block.id}: ORIGINAL LEFT, CURRENT RIGHT; identical crop (${rect.left},${rect.top},${rect.width},${rect.height}) in canvas pixels. Judge visible glyphs, not guessed reference rectangles. Nearby text is context.`},
      {type:'image_url' as const,image_url:{url:`data:image/jpeg;base64,${pair.toString('base64')}`,detail:'high' as const}});
  }
  return pairs;
}
