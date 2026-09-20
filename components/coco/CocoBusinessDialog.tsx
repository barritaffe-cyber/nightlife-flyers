'use client';
import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import CocoBusinessSetup from './CocoBusinessSetup';
export default function CocoBusinessDialog({owner,uploadLogo,onClose}:{owner:string;uploadLogo:(file:File)=>Promise<string|null>;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=dialog.current;el?.showModal();el?.querySelector<HTMLElement>('h2')?.focus();return()=>el?.close();},[]);
 return createPortal(<dialog ref={dialog} aria-labelledby="coco-business-title" onCancel={onClose} className="coco-conversation fixed inset-0 m-auto max-h-[90dvh] w-[min(95vw,640px)] overflow-y-auto rounded-2xl border border-white/15 bg-[#0d1119] p-6 text-white backdrop:bg-black/75 md:p-10">
  <CocoBusinessSetup manage owner={owner} canRemember uploadLogo={uploadLogo} onContinue={onClose} onCancel={onClose}/>
 </dialog>,document.body);
}
