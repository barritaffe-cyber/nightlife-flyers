import type { CompositionDirectorInput, CompositionSystem } from "./types.ts";
import { shift, scaleAroundCenter, normalizeRect } from "./geometry.ts";

export function generateVariations(base:CompositionSystem,input:CompositionDirectorInput):CompositionSystem[]{
  const variations:CompositionSystem[]=[base];
  const configs=[
    {id:"up",dx:0,dy:-2,scale:1},
    {id:"down",dx:0,dy:2,scale:1},
    {id:"inward",dx:inward(base),dy:0,scale:.98},
    {id:"larger",dx:0,dy:-1,scale:1.05},
    {id:"tighter",dx:0,dy:0,scale:.96,compression:.92},
    {id:"airier",dx:0,dy:0,scale:1.02,compression:1.08},
  ];
  for(const cfg of configs){
    let col=shift(base.textColumn,cfg.dx,cfg.dy);col=scaleAroundCenter(col,cfg.scale);
    const rhythm={...base.rhythm,compression:Math.max(.72,Math.min(1.15,base.rhythm.compression*(cfg.compression??1)))};
    const blocks=base.blocks.map(b=>b.pinned?b:{...b,rect:transformBlock(b.rect,base.textColumn,col,rhythm.compression/base.rhythm.compression)});
    variations.push({...base,id:`${base.id}:${cfg.id}`,generation:"variation",textColumn:col,blocks,rhythm,explanation:`${base.explanation} Variation ${cfg.id}.`});
  }
  return variations;
}

function inward(system:CompositionSystem){if(system.typeField==="left")return 2;if(system.typeField==="right")return -2;return 0}
function transformBlock(r:any,oldCol:any,newCol:any,compression:number){
  const rx=(r.x-oldCol.x)/oldCol.width,ry=(r.y-oldCol.y)/oldCol.height;
  return normalizeRect({x:newCol.x+rx*newCol.width,y:newCol.y+ry*newCol.height*compression,width:r.width*(newCol.width/oldCol.width),height:r.height*(newCol.height/oldCol.height)});
}
