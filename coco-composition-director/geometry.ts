import type { PercentRect, Point } from "./types.ts";

export function clamp(v:number,min=0,max=100){return Number.isFinite(v)?Math.max(min,Math.min(max,v)):min}
export function rect(x:number,y:number,width:number,height:number):PercentRect{return normalizeRect({x,y,width,height})}
export function normalizeRect(r:PercentRect):PercentRect{
  const width=clamp(r.width,.01,100),height=clamp(r.height,.01,100);
  return {x:clamp(r.x,0,100-width),y:clamp(r.y,0,100-height),width,height};
}
export function center(r:PercentRect):Point{return{x:r.x+r.width/2,y:r.y+r.height/2}}
export function area(r:PercentRect){return Math.max(0,r.width)*Math.max(0,r.height)}
export function intersection(a:PercentRect,b:PercentRect):PercentRect|null{
  const l=Math.max(a.x,b.x),r=Math.min(a.x+a.width,b.x+b.width),t=Math.max(a.y,b.y),bo=Math.min(a.y+a.height,b.y+b.height);
  return r<=l||bo<=t?null:{x:l,y:t,width:r-l,height:bo-t};
}
export function intersectionArea(a:PercentRect,b:PercentRect){const i=intersection(a,b);return i?area(i):0}
export function overlapRatio(a:PercentRect,b:PercentRect,den:"a"|"b"|"min"="a"){
  const i=intersectionArea(a,b),aa=area(a),ab=area(b);const d=den==="a"?aa:den==="b"?ab:Math.min(aa,ab);return d<=0?0:i/d;
}
export function expand(r:PercentRect,px:number,py=px){return normalizeRect({x:r.x-px,y:r.y-py,width:r.width+px*2,height:r.height+py*2})}
export function inset(r:PercentRect,px:number,py=px){return normalizeRect({x:r.x+px,y:r.y+py,width:Math.max(.01,r.width-px*2),height:Math.max(.01,r.height-py*2)})}
export function shift(r:PercentRect,dx:number,dy:number){return normalizeRect({...r,x:r.x+dx,y:r.y+dy})}
export function scaleAroundCenter(r:PercentRect,sx:number,sy=sx){const c=center(r);return normalizeRect({x:c.x-r.width*sx/2,y:c.y-r.height*sy/2,width:r.width*sx,height:r.height*sy})}
export function union(rects:PercentRect[]):PercentRect|null{
  if(!rects.length)return null;const l=Math.min(...rects.map(r=>r.x)),t=Math.min(...rects.map(r=>r.y));
  const rr=Math.max(...rects.map(r=>r.x+r.width)),b=Math.max(...rects.map(r=>r.y+r.height));return normalizeRect({x:l,y:t,width:rr-l,height:b-t});
}
export function distance(a:Point,b:Point){return Math.hypot(a.x-b.x,a.y-b.y)}
export function weightedCenter(items:Array<{point:Point;weight:number}>):Point{
  const total=items.reduce((s,i)=>s+Math.max(0,i.weight),0);if(total<=0)return{x:50,y:50};
  return{x:items.reduce((s,i)=>s+i.point.x*Math.max(0,i.weight),0)/total,y:items.reduce((s,i)=>s+i.point.y*Math.max(0,i.weight),0)/total};
}
export function rectDistance(a:PercentRect,b:PercentRect){return distance(center(a),center(b))}
export function gapY(a:PercentRect,b:PercentRect){return Math.max(0,b.y-(a.y+a.height))}
export function gapX(a:PercentRect,b:PercentRect){return Math.max(0,b.x-(a.x+a.width))}
// Accumulated float arithmetic from shift/scaleAroundCenter chains (variation
// and refinement passes both compose several of these) can land a value like
// 95.00000000000001 where the math is really just 95 - a strict <=/>= with
// zero tolerance rejects that as "outside bounds" even though it's visually
// and practically identical. EPSILON absorbs float noise without meaningfully
// loosening the actual containment guarantee.
const EPSILON=1e-6;
export function contains(outer:PercentRect,inner:PercentRect){return inner.x>=outer.x-EPSILON&&inner.y>=outer.y-EPSILON&&inner.x+inner.width<=outer.x+outer.width+EPSILON&&inner.y+inner.height<=outer.y+outer.height+EPSILON}
export function safeRect(format:"square"|"story"){return format==="story"?rect(5,7,90,84):rect(5,5,90,90)}
export function opticalShiftForAlignment(align:"left"|"center"|"right",role:string){
  if(align==="center"&&role==="identity")return -0.8;if(align==="right"&&role==="identity")return -0.4;if(role==="accent")return -0.6;return 0;
}
