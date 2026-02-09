'use client';
/* eslint-disable @next/next/no-img-element */

 import * as React from 'react';
 import { Chip, Stepper, Collapsible } from './controls';

type GenStyle = 'urban' | 'neon' | 'vintage' | 'tropical';
type GenGender = 'any' | 'woman' | 'man' | 'nonbinary';
type GenEthnicity =
  | 'any'
  | 'black'
  | 'white'
  | 'latino'
  | 'east-asian'
  | 'indian'
  | 'middle-eastern'
  | 'mixed';
type GenEnergy = 'calm' | 'vibe' | 'wild';
type GenAttire = 'streetwear' | 'club-glam' | 'luxury' | 'festival' | 'all-white' | 'cyberpunk';
type GenColorway = 'neon' | 'monochrome' | 'warm' | 'cool' | 'gold-black';
type GenAttireColor =
  | 'black'
  | 'white'
  | 'gold'
  | 'silver'
  | 'red'
  | 'blue'
  | 'emerald'
  | 'champagne';
type GenPose = 'dancing' | 'hands-up' | 'performance' | 'dj';
type GenShot = 'full-body' | 'three-quarter' | 'waist-up' | 'chest-up' | 'close-up';
type GenLighting = 'strobe' | 'softbox' | 'backlit' | 'flash';
 type GenProvider = 'auto' | 'nano' | 'openai' | 'venice';
 type GenSize = '1080' | '2160' | '3840';

type Preset = {
  key: string;
  label: string;
  style: GenStyle;
  prompt: string;
};

type Props = {
  selectedPanel?: string | null;
  setSelectedPanel?: (panel: string | null) => void;
  genStyle: GenStyle;
  setGenStyle: (s: GenStyle) => void;
   presetKey: string;
   setPresetKey: (v: string) => void;
   presets: Preset[];
   randomPreset: () => void;
   genPrompt: string;
   setGenPrompt: (v: string) => void;
   genProvider: GenProvider;
   setGenProvider: (v: GenProvider) => void;
  genCount: 1 | 2 | 4;
  setGenCount: React.Dispatch<React.SetStateAction<1 | 2 | 4>>;
   genSize: GenSize;
   setGenSize: (v: GenSize) => void;
   allowPeople: boolean;
   setAllowPeople: React.Dispatch<React.SetStateAction<boolean>>;
  variety: number;
  setVariety: (n: number) => void;
  clarity: number;
  setClarity: (n: number) => void;
  genGender?: GenGender;
  setGenGender?: (v: GenGender) => void;
  genEthnicity?: GenEthnicity;
  setGenEthnicity?: (v: GenEthnicity) => void;
  genEnergy: GenEnergy;
  setGenEnergy: (v: GenEnergy) => void;
  genAttire: GenAttire;
  setGenAttire: (v: GenAttire) => void;
  genColorway: GenColorway;
  setGenColorway: (v: GenColorway) => void;
  genAttireColor: GenAttireColor;
  setGenAttireColor: (v: GenAttireColor) => void;
  genPose: GenPose;
  setGenPose: (v: GenPose) => void;
  genShot: GenShot;
  setGenShot: (v: GenShot) => void;
  genLighting: GenLighting;
  setGenLighting: (v: GenLighting) => void;
  resetCredits: () => void;
  generateBackground: () => void;
   genLoading: boolean;
   isPlaceholder: boolean;
   genError: string | null;
  genCandidates: string[];
  setBgUploadUrl: (v: string | null) => void;
  setBgUrl: (v: string | null) => void;
};

function AiBackgroundPanel({
  selectedPanel,
  setSelectedPanel,
  genStyle,
  setGenStyle,
   presetKey,
   setPresetKey,
   presets,
   randomPreset,
   genPrompt,
   setGenPrompt,
   genProvider,
   setGenProvider,
   genCount,
   setGenCount,
   genSize,
   setGenSize,
   allowPeople,
   setAllowPeople,
  variety,
  setVariety,
  clarity,
  setClarity,
  genGender = "any",
  setGenGender,
  genEthnicity = "any",
  setGenEthnicity,
  genEnergy,
  setGenEnergy,
  genAttire,
  setGenAttire,
  genColorway,
  setGenColorway,
  genAttireColor,
  setGenAttireColor,
  genPose,
  setGenPose,
  genShot,
  setGenShot,
  genLighting,
  setGenLighting,
  resetCredits,
  generateBackground,
   genLoading,
   isPlaceholder,
   genError,
  genCandidates,
  setBgUploadUrl,
  setBgUrl,
}: Props) {
  const isControlled = typeof selectedPanel !== 'undefined' && typeof setSelectedPanel === 'function';
  const isOpen = isControlled ? selectedPanel === 'ai_background' : undefined;
  const onToggle = isControlled
    ? () => setSelectedPanel?.(selectedPanel === 'ai_background' ? null : 'ai_background')
    : undefined;
  return (
    <Collapsible
      title="AI Background"
      storageKey="p_ai_bg"
      defaultOpen={true}
      isOpen={isOpen}
      onToggle={onToggle}
      panelClassName={
        isOpen ? "ring-1 ring-[#00d4ff]/35 shadow-[0_0_18px_rgba(0,212,255,0.18)]" : undefined
      }
    >
       <div className="space-y-3">
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
           {(['urban', 'neon', 'tropical', 'vintage'] as GenStyle[]).map((s) => (
             <Chip key={s} active={s === genStyle} onClick={() => setGenStyle(s)}>
               {s.toUpperCase()}
             </Chip>
           ))}
         </div>

         <div className="pt-1" />

         <div className="text-[13px]">
           <div className="flex items-center gap-2 flex-wrap">
             <select
               value={presetKey}
               onChange={(e) => setPresetKey(e.target.value)}
               aria-label="Preset"
               className="w-40 px-3 py-[6px] text-[13px] rounded bg-[#17171b] text-white border border-neutral-700"
             >
               <option value="">preset</option>
               {presets.map((p) => (
                 <option key={p.key} value={p.key}>
                   {p.label}
                 </option>
               ))}
             </select>

             <button
               type="button"
               onClick={() => {
                 const p = presets.find((x) => x.key === presetKey);
                 if (!p) {
                   alert('Pick a preset');
                   return;
                 }
                 setGenStyle(p.style);
                 setGenPrompt(p.prompt);
               }}
               className="px-3 py-[6px] text-[13px] rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
               title="Load preset into the prompt box"
             >
               Use
             </button>

             <button
               type="button"
               onClick={randomPreset}
               className="px-2.5 py-[6px] text-[12px] rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
               title="Pick a random preset"
             >
               Random
             </button>
           </div>
         </div>

         <div className="pt-1" />

         <div className="text-xs">
           <div className="mb-1">Prompt (adds to style)</div>
           <textarea
             value={genPrompt}
             onChange={(e) => setGenPrompt(e.target.value)}
             rows={3}
             placeholder="subject, lighting, background, mood…"
             className="mt-1 w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700"
           />
           <div className="mt-1 text-[10px] text-neutral-400">
             Tip: mention people keywords like “dj”, “rapper”, “crowd”, or “dancer”.
           </div>
         </div>

         <div className="flex items-center gap-2 text-[11px]">
           <span>Provider</span>
           <Chip small active={genProvider === 'auto'} onClick={() => setGenProvider('auto')}>
             Auto
           </Chip>
           <Chip small active={genProvider === 'nano'} onClick={() => setGenProvider('nano')}>
             Nano
           </Chip>
          <Chip small active={genProvider === 'openai'} onClick={() => setGenProvider('openai')}>
            OpenAI
          </Chip>
          <Chip small active={genProvider === 'venice'} onClick={() => setGenProvider('venice')}>
            Imagine
          </Chip>
         </div>

         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 text-[11px]">
             <span>Batch</span>
             <Chip small active={genCount === 1} onClick={() => setGenCount(1)}>
               1
             </Chip>
             <Chip small active={genCount === 2} onClick={() => setGenCount(2)}>
               2
             </Chip>
             <Chip small active={genCount === 4} onClick={() => setGenCount(4)}>
               4
             </Chip>
           </div>
           <div className="flex items-center gap-2 text-[11px]">
             <span>Size</span>
             <Chip small active={genSize === '1080'} onClick={() => setGenSize('1080')}>
               1080
             </Chip>
             <Chip small active={genSize === '2160'} onClick={() => setGenSize('2160')}>
               2160
             </Chip>
             <Chip small active={genSize === '3840'} onClick={() => setGenSize('3840')}>
               3840
             </Chip>
           </div>
         </div>

         <div className="grid grid-cols-[100px_110px_107px] justify-end items-end gap-4">
           <div className="flex items-end justify-end gap-2">
             <span className="text-[10px] text-neutral-300 mb-[6px]">People</span>
             <Chip
               small
               active={allowPeople}
               onClick={() => setAllowPeople((v) => !v)}
               title="Toggle people in generations"
             >
               {allowPeople ? 'On' : 'Off'}
             </Chip>
           </div>

           <div className="w-[110px]">
             <Stepper
               label="Diversity"
               value={variety}
               setValue={setVariety}
               min={0}
               max={6}
               step={1}
             />
           </div>

           <div className="w-[118px]">
             <Stepper
               label="Clarity"
               value={clarity}
               setValue={setClarity}
               min={0}
               max={1}
               step={0.05}
               digits={2}
             />
           </div>
         </div>

         <div className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-2">
           <div className="text-[11px] text-neutral-300 mb-2">Subject Profile (optional)</div>
           <div className="grid grid-cols-2 gap-2">
             <label className="text-[10px] text-neutral-400">
               Subject identity
               <select
                 value={genGender}
                 onChange={(e) => setGenGender?.(e.target.value as GenGender)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1 text-[11px]"
                 disabled={!allowPeople}
               >
                 <option value="any">Any</option>
                 <option value="woman">Female / femme-presenting</option>
                 <option value="man">Male / masc-presenting</option>
                 <option value="nonbinary">Non-binary / androgynous</option>
               </select>
             </label>
             <label className="text-[10px] text-neutral-400">
               Ethnicity
               <select
                 value={genEthnicity}
                 onChange={(e) => setGenEthnicity?.(e.target.value as GenEthnicity)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1 text-[11px]"
                 disabled={!allowPeople}
               >
                <option value="any">Any</option>
                <option value="black">Black</option>
                <option value="white">Caucasian</option>
                <option value="latino">Latina / Latino</option>
                <option value="east-asian">East Asian</option>
                <option value="indian">Indian</option>
                <option value="middle-eastern">Middle Eastern</option>
                <option value="mixed">Mixed</option>
              </select>
             </label>
           </div>
           <div className="mt-2 text-[10px] text-neutral-500">
             Select both to use reference samples for consistent renders.
           </div>
         </div>

         <div className="rounded-lg border border-neutral-700 bg-neutral-900/40 p-2">
           <div className="text-[11px] text-neutral-300 mb-2">Nightlife Subject Builder</div>
           <div className="grid grid-cols-2 gap-2">
             <label className="text-[10px] text-neutral-400">
               Energy
               <select
                 value={genEnergy}
                 onChange={(e) => setGenEnergy(e.target.value as GenEnergy)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1 text-[11px]"
                 disabled={!allowPeople}
               >
                 <option value="calm">Calm</option>
                 <option value="vibe">Vibe</option>
                 <option value="wild">Wild</option>
               </select>
             </label>
             <label className="text-[10px] text-neutral-400">
               Attire
               <select
                 value={genAttire}
                 onChange={(e) => setGenAttire(e.target.value as GenAttire)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1 text-[11px]"
                 disabled={!allowPeople}
               >
                 <option value="streetwear">Streetwear</option>
                 <option value="club-glam">Club Glam</option>
                 <option value="luxury">Luxury</option>
                 <option value="festival">Festival</option>
                 <option value="all-white">All White</option>
                 <option value="cyberpunk">Cyberpunk</option>
               </select>
             </label>
             <label className="text-[10px] text-neutral-400">
               Attire Color
               <select
                 value={genAttireColor}
                 onChange={(e) => setGenAttireColor(e.target.value as GenAttireColor)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1 text-[11px]"
                 disabled={!allowPeople}
               >
                 <option value="black">Black</option>
                 <option value="white">White</option>
                 <option value="gold">Gold</option>
                 <option value="silver">Silver</option>
                 <option value="red">Red</option>
                 <option value="blue">Blue</option>
                 <option value="emerald">Emerald</option>
                 <option value="champagne">Champagne</option>
               </select>
             </label>
             <label className="text-[10px] text-neutral-400">
               Colorway
               <select
                 value={genColorway}
                 onChange={(e) => setGenColorway(e.target.value as GenColorway)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1 text-[11px]"
                 disabled={!allowPeople}
               >
                 <option value="neon">Neon</option>
                 <option value="monochrome">Monochrome</option>
                 <option value="warm">Warm</option>
                 <option value="cool">Cool</option>
                 <option value="gold-black">Gold/Black</option>
               </select>
             </label>
             <label className="text-[10px] text-neutral-400">
               Pose
               <select
                 value={genPose}
                 onChange={(e) => setGenPose(e.target.value as GenPose)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1 text-[11px]"
                 disabled={!allowPeople}
               >
                 <option value="dancing">Dancing</option>
                 <option value="hands-up">Hands Up</option>
                 <option value="performance">Performance</option>
                 <option value="dj">DJ at Decks</option>
               </select>
             </label>
              <label className="text-[10px] text-neutral-400">
                Shot
                <select
                  value={genShot}
                  onChange={(e) => setGenShot(e.target.value as GenShot)}
                  className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1 text-[11px]"
                  disabled={!allowPeople}
                >
                  <option value="full-body">Full Body</option>
                  <option value="three-quarter">Three-Quarter</option>
                  <option value="waist-up">Waist-Up</option>
                  <option value="chest-up">Chest-Up</option>
                  <option value="close-up">Close-Up</option>
                </select>
              </label>
             <label className="text-[10px] text-neutral-400">
               Lighting
               <select
                 value={genLighting}
                 onChange={(e) => setGenLighting(e.target.value as GenLighting)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1 text-[11px]"
                 disabled={!allowPeople}
               >
                 <option value="strobe">Strobe</option>
                 <option value="softbox">Softbox</option>
                 <option value="backlit">Backlit</option>
                 <option value="flash">Flash</option>
               </select>
             </label>
           </div>
           <div className="mt-2 text-[10px] text-neutral-500">
             Controls only apply when People is enabled.
           </div>
         </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={generateBackground}
            disabled={genLoading}
            className="flex-1 px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
             {genLoading ? (
               <span className="inline-flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-gradient-to-r from-fuchsia-400 to-indigo-400 animate-pulse" />
                 Creating Magic…
               </span>
             ) : (
              'Generate'
            )}
          </button>
            <button
              type="button"
              onClick={resetCredits}
              className="px-3 py-2 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 text-[12px]"
              title="Reset credits (dev)"
            >
              Reset Credits
            </button>
         </div>

         {isPlaceholder && (
           <div className="text-[11px] p-2 rounded border border-amber-500/40 bg-amber-900/20">
             <div className="font-semibold text-amber-300">Using placeholder background</div>
             <div className="text-amber-200/90 mt-1">
               Provider error{genError ? `: ${genError}` : ''}. You can keep designing and retry generation anytime.
             </div>
             <div className="mt-2 flex gap-2">
               <button
                 type="button"
                 onClick={generateBackground}
                 className="px-2 py-1 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
               >
                 Retry
               </button>
               <button
                 type="button"
                 onClick={() => {
                   setGenProvider('nano');
                 }}
                 className="px-2 py-1 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800"
               >
                 Switch to Nano
               </button>
             </div>
           </div>
         )}

         {genCandidates.length > 0 && (
           <div className="space-y-2">
             <div className="text-[11px] text-neutral-400">Select a background</div>
             <div className="grid grid-cols-2 gap-2">
               {genCandidates.map((src, i) => (
                 <button
                   key={i}
                   onClick={() => {
                     if (src.startsWith('data:image/')) {
                       setBgUploadUrl(src);
                       setBgUrl(null);
                     } else {
                       setBgUrl(src);
                       setBgUploadUrl(null);
                     }
                   }}
                   className="relative group border border-neutral-700 rounded overflow-hidden hover:border-indigo-500"
                   title="Use this background"
                 >
                   <img src={src} alt={`candidate ${i + 1}`} className="w-full h-28 object-cover" />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20" />
                 </button>
               ))}
             </div>
           </div>
         )}

         {genError && <div className="text-xs text-red-400 break-words">{genError}</div>}
       </div>
     </Collapsible>
   );
 }

 export default React.memo(AiBackgroundPanel);
