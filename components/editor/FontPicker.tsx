 'use client';

 import * as React from 'react';

 export function FontPicker({
   value,
   options,
   onChange,
   label,
   disabled,
   className,
   sample = 'Aa Bb 123',
 }: {
   value: string;
   options: string[];
   onChange: (v: string) => void;
   label?: string;
   disabled?: boolean;
   className?: string;
   sample?: string;
 }) {
   const [open, setOpen] = React.useState(false);
   const wrapRef = React.useRef<HTMLDivElement | null>(null);

   React.useEffect(() => {
     const handle = (e: MouseEvent | TouchEvent) => {
       if (!wrapRef.current) return;
       if (!wrapRef.current.contains(e.target as Node)) {
         setOpen(false);
       }
     };
     document.addEventListener('mousedown', handle);
     document.addEventListener('touchstart', handle, { passive: true });
     return () => {
       document.removeEventListener('mousedown', handle);
       document.removeEventListener('touchstart', handle);
     };
   }, []);

   return (
     <div className={`relative ${className ?? ''}`} ref={wrapRef}>
       {label && <div className="text-[11px] text-neutral-400 mb-1">{label}</div>}
       <button
         type="button"
         disabled={disabled}
         onClick={() => setOpen((v) => !v)}
         className="w-full rounded px-2 py-2 bg-[#17171b] text-white border border-neutral-700 text-left flex items-center justify-between gap-2 disabled:opacity-60"
       >
         <span className="truncate" style={{ fontFamily: value }}>
           {value}
         </span>
         <span className="text-[11px] text-neutral-400" style={{ fontFamily: value }}>
           {sample}
         </span>
       </button>
       {open && (
         <div className="absolute z-[60] mt-1 w-full max-h-64 overflow-auto rounded border border-neutral-700 bg-[#0f0f12] shadow-xl">
           {options.map((f) => (
             <button
               key={f}
               type="button"
               onClick={() => {
                 onChange(f);
                 setOpen(false);
               }}
               className="w-full px-2 py-2 text-left hover:bg-neutral-800/80 border-b border-neutral-800 last:border-b-0"
             >
               <div className="text-[12px] text-white" style={{ fontFamily: f }}>
                 {f}
               </div>
               <div className="text-[11px] text-neutral-400" style={{ fontFamily: f }}>
                 {sample}
               </div>
             </button>
           ))}
         </div>
       )}
     </div>
   );
 }
