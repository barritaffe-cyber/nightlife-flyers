import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import type {ReferenceBlock} from './cssReferenceLayout.ts';

export type OcrRow={text:string;confidence:number;x:number;y:number;width:number;height:number};
const key=(text:string)=>text.toUpperCase().replace(/[^\p{L}\p{N}]/gu,'');
const union=(rows:OcrRow[])=>({x:Math.min(...rows.map(r=>r.x)),y:Math.min(...rows.map(r=>r.y)),width:Math.max(...rows.map(r=>r.x+r.width))-Math.min(...rows.map(r=>r.x)),height:Math.max(...rows.map(r=>r.y+r.height))-Math.min(...rows.map(r=>r.y))});

export function anchorReferenceText(blocks:ReferenceBlock[],rows:OcrRow[]) {
  const valid=rows.filter(r=>r.confidence>=.5&&[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0);
  const candidates=[...valid];
  // Spaced headings are often returned as several words on one baseline.
  for(const start of valid){
    const line=valid.filter(r=>r.x>=start.x&&Math.abs((r.y+r.height/2)-(start.y+start.height/2))<Math.min(r.height,start.height)*.45).sort((a,b)=>a.x-b.x);
    for(let n=2;n<=Math.min(line.length,12);n++){
      const words=line.slice(0,n);
      candidates.push({...union(words),text:words.map(r=>r.text).join(' '),confidence:Math.min(...words.map(r=>r.confidence))});
    }
  }
  return blocks.map(block=>{
    // OCR boxes for ornamental/script fonts can be loose or wrong. Keep the
    // visual measurement there; only anchor exact recognized utility copy.
    if(block.kind!=='text'||/headline|script/i.test(block.role)||block.width>65)return block;
    const lines=block.text.split('\n').filter(Boolean);
    const matches=lines.map(line=>candidates.filter(r=>key(r.text)===key(line)).sort((a,b)=>Math.hypot(a.x+a.width/2-block.x-block.width/2,a.y-block.y)-Math.hypot(b.x+b.width/2-block.x-block.width/2,b.y-block.y))[0]);
    if(matches.some(r=>!r))return block;
    return {...block,...union(matches),measurementSource:'on-device-ocr' as const};
  });
}

export async function readReferenceOcr(bytes:Buffer):Promise<OcrRow[]> {
  if(process.platform!=='darwin')return [];
  return new Promise(resolveRows=>{
    const child=spawn('/usr/bin/swift',[resolve('scripts/flyer-reference-ocr.swift')],{stdio:['pipe','pipe','pipe']});
    const chunks:Buffer[]=[];let length=0;
    const timer=setTimeout(()=>child.kill(),45_000);
    child.stdout.on('data',chunk=>{length+=chunk.length;if(length>2_000_000)child.kill();else chunks.push(chunk);});
    child.stderr.resume();
    child.stdin.on('error',()=>{});
    child.on('error',()=>{clearTimeout(timer);resolveRows([]);});
    child.on('close',code=>{
      clearTimeout(timer);
      try {const rows=JSON.parse(Buffer.concat(chunks).toString());resolveRows(code===0&&Array.isArray(rows)?rows:[]);}catch{resolveRows([]);}
    });
    child.stdin.end(bytes);
  });
}
