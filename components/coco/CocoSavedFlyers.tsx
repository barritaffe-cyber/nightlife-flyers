'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {listSavedFlyers,type SavedFlyer} from '../../lib/coco/savedFlyers';
export default function CocoSavedFlyers({owner,canReuse,onOpen,onClose}:{owner:string;canReuse:boolean;onOpen:(flyer:SavedFlyer,duplicate:boolean)=>void;onClose:()=>void}){
 const [flyers,setFlyers]=useState<SavedFlyer[]>([]),[error,setError]=useState('');const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{listSavedFlyers(owner).then(setFlyers).catch(()=>setError('Could not read saved flyers on this device.'));root.current?.focus();},[owner]);
 return <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/75 p-5" onClick={onClose}><div ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label="My flyers" className="max-h-[80vh] w-full max-w-xl overflow-auto rounded-2xl border border-white/15 bg-[#0d1119] p-6 text-white" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const items=[...(root.current?.querySelectorAll<HTMLElement>('button,a[href]')??[])];if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus()}}}}>
 <div className="flex justify-between"><h2 className="text-lg">My flyers</h2><button onClick={onClose} aria-label="Close saved flyers">✕</button></div><p className="my-3 text-xs text-white/50">Saved on this device. Your work stays here after cancellation. Download a project file for a backup.</p>
 {error&&<p role="alert">{error}</p>}{!flyers.length&&!error&&<p className="py-6 text-sm text-white/60">Save your first flyer to see it here.</p>}
 {flyers.map(f=><div key={f.id} className="flex items-center justify-between gap-4 border-t border-white/10 py-4"><div className="min-w-0"><p className="truncate text-sm">{f.name}</p><p className="text-xs text-white/40">{new Date(f.updatedAt).toLocaleDateString()}</p></div><div className="flex gap-3 text-xs"><button className="text-cyan-100" onClick={()=>onOpen(f,false)}>Open</button>{canReuse&&<button className="text-cyan-100" onClick={()=>onOpen(f,true)}>Duplicate</button>}</div></div>)}
 {!canReuse&&<Link className="mt-4 block text-sm text-cyan-100" href="/pricing">Subscribe to save and duplicate, or buy One Flyer to export.</Link>}
 </div></div>
}
