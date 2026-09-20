import type{PercentRect,Point}from"./types.ts";
export const clamp=(v:number,min=0,max=1)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):min;
export const normalizeRect=(r:PercentRect):PercentRect=>{const width=clamp(r.width,.01,100),height=clamp(r.height,.01,100);return{x:clamp(r.x,0,100-width),y:clamp(r.y,0,100-height),width,height}};
export const rectCenter=(r:PercentRect):Point=>({x:r.x+r.width/2,y:r.y+r.height/2});
export const rectArea=(r:PercentRect)=>Math.max(0,r.width)*Math.max(0,r.height);
export function intersectionArea(a:PercentRect,b:PercentRect){const l=Math.max(a.x,b.x),r=Math.min(a.x+a.width,b.x+b.width),t=Math.max(a.y,b.y),d=Math.min(a.y+a.height,b.y+b.height);return r<=l||d<=t?0:(r-l)*(d-t)}
export function overlapRatio(a:PercentRect,b:PercentRect,den:"a"|"b"|"min"="a"){const i=intersectionArea(a,b),aa=rectArea(a),ab=rectArea(b),base=den==="a"?aa:den==="b"?ab:Math.min(aa,ab);return base<=0?0:i/base}
export const expandRect=(r:PercentRect,x:number,y=x)=>normalizeRect({x:r.x-x,y:r.y-y,width:r.width+x*2,height:r.height+y*2});
export const sideForCenter=(p:Point,t=8)=>p.x<50-t?"left":p.x>50+t?"right":"center";
export const rectTouchesEdge=(r:PercentRect,t=1.5)=>({left:r.x<=t,right:r.x+r.width>=100-t,top:r.y<=t,bottom:r.y+r.height>=100-t});
export function weightedCenter(items:Array<{point:Point;weight:number}>):Point{const total=items.reduce((s,i)=>s+Math.max(0,i.weight),0);if(total<=0)return{x:50,y:50};return{x:items.reduce((s,i)=>s+i.point.x*Math.max(0,i.weight),0)/total,y:items.reduce((s,i)=>s+i.point.y*Math.max(0,i.weight),0)/total}}
export const percentRect=(x:number,y:number,width:number,height:number)=>normalizeRect({x,y,width,height});
