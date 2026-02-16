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
type GenerateBackgroundOpts = {
  prompt?: string;
  allowPeopleOverride?: boolean;
};

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
  genCount: 1 | 2;
  setGenCount: React.Dispatch<React.SetStateAction<1 | 2>>;
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
  generateBackground: (opts?: GenerateBackgroundOpts) => void;
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
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [briefEvent, setBriefEvent] = React.useState<string>('');
  const [briefMood, setBriefMood] = React.useState<string>('');
  const [briefColors, setBriefColors] = React.useState<string>('');
  const [briefSubject, setBriefSubject] = React.useState<string>('');
  const [briefMustInclude, setBriefMustInclude] = React.useState<string>('');
  const [briefError, setBriefError] = React.useState<string>('');
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const briefReady =
    briefEvent.trim().length > 0 &&
    briefMood.trim().length > 0 &&
    briefColors.trim().length > 0 &&
    briefSubject.trim().length > 0;

  const subjectNeedsPeople = React.useMemo(
    () =>
      briefSubject === 'dj' ||
      briefSubject === 'crowd' ||
      briefSubject === 'performer',
    [briefSubject]
  );

  const briefPrompt = React.useMemo(() => {
    if (!briefReady) return '';
    const chunks = [
      `${briefEvent} background`,
      `${briefMood} tone`,
      `color palette: ${briefColors}`,
      `subject: ${
        briefSubject === 'none'
          ? 'no visible people, clean environmental scene'
          : briefSubject === 'dj'
            ? 'single DJ on one side of frame'
            : briefSubject === 'crowd'
              ? 'dance crowd with high energy'
              : 'single performer with stage presence'
      }`,
      'leave clean negative space for headline text',
      genPrompt.trim() ? `extra direction: ${genPrompt.trim()}` : '',
      briefMustInclude.trim()
        ? `must include: ${briefMustInclude.trim()}`
        : '',
    ]
      .filter(Boolean)
      .join(', ');
    return chunks;
  }, [briefColors, briefEvent, briefMood, briefMustInclude, briefReady, briefSubject, genPrompt]);

  const handleGenerate = React.useCallback(() => {
    if (!briefReady) {
      setBriefError('Complete Event, Mood, Colors, and Subject before generating.');
      return;
    }
    setBriefError('');
    setAllowPeople(subjectNeedsPeople);
    generateBackground({
      prompt: briefPrompt,
      allowPeopleOverride: subjectNeedsPeople,
    });
  }, [briefPrompt, briefReady, generateBackground, setAllowPeople, subjectNeedsPeople]);

  React.useEffect(() => {
    if (!helpOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelpOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [helpOpen]);

  return (
    <>
      <Collapsible
        title="AI Background"
        storageKey="p_ai_bg"
        defaultOpen={true}
        isOpen={isOpen}
        onToggle={onToggle}
        panelClassName={
          isOpen ? "ring-1 ring-inset ring-[#00FFF0]/70" : undefined
        }
        right={
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="AI Background help"
            title="How AI Background works"
            className="h-6 w-6 rounded-full border border-cyan-400/70 text-cyan-300 text-[11px] font-bold hover:bg-cyan-400/10"
          >
            ?
          </button>
        }
      >
        <div className="space-y-4">
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
           {(['urban', 'neon', 'tropical', 'vintage'] as GenStyle[]).map((s) => (
             <Chip key={s} active={s === genStyle} onClick={() => setGenStyle(s)}>
               {s.toUpperCase()}
             </Chip>
           ))}
         </div>

         <div className="rounded-xl border border-white/10 bg-[#0f1117] p-3 sm:p-4 space-y-3">
           <div className="flex items-center justify-between gap-2">
             <div className="text-[12px] uppercase tracking-[0.12em] text-cyan-300">Idea Brief</div>
             <div className="text-[10px] text-neutral-400">Required before generate</div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
             <label className="text-[11px] text-neutral-300">
               Event
               <select
                 value={briefEvent}
                 onChange={(e) => setBriefEvent(e.target.value)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1.5 text-[12px]"
               >
                 <option value="">Select event</option>
                 <option value="EDM rave club">EDM rave club</option>
                 <option value="Rooftop party">Rooftop party</option>
                 <option value="Hip-hop night">Hip-hop night</option>
                 <option value="Afrobeat lounge">Afrobeat lounge</option>
                 <option value="Luxury VIP club">Luxury VIP club</option>
               </select>
             </label>
             <label className="text-[11px] text-neutral-300">
               Mood
               <select
                 value={briefMood}
                 onChange={(e) => setBriefMood(e.target.value)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1.5 text-[12px]"
               >
                 <option value="">Select mood</option>
                 <option value="clean and premium">Clean and premium</option>
                 <option value="dark and cinematic">Dark and cinematic</option>
                 <option value="high energy and bold">High energy and bold</option>
                 <option value="warm and upscale">Warm and upscale</option>
               </select>
             </label>
             <label className="text-[11px] text-neutral-300 sm:col-span-2">
               Colors
               <input
                 value={briefColors}
                 onChange={(e) => setBriefColors(e.target.value)}
                 placeholder="e.g. neon cyan + magenta, deep black shadows"
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1.5 text-[12px]"
               />
             </label>
             <label className="text-[11px] text-neutral-300">
               Subject
               <select
                 value={briefSubject}
                 onChange={(e) => setBriefSubject(e.target.value)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1.5 text-[12px]"
               >
                 <option value="">Select subject</option>
                 <option value="none">No people (environment only)</option>
                 <option value="dj">Single DJ</option>
                 <option value="performer">Single performer</option>
                 <option value="crowd">Dance crowd</option>
               </select>
             </label>
             <label className="text-[11px] text-neutral-300">
               Must Include (optional)
               <input
                 value={briefMustInclude}
                 onChange={(e) => setBriefMustInclude(e.target.value)}
                 placeholder="e.g. disco ball, LED wall, CO2 jets"
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1.5 text-[12px]"
               />
             </label>
           </div>

           <label className="block text-[11px] text-neutral-300">
             Extra Direction (optional)
             <textarea
               value={genPrompt}
               onChange={(e) => setGenPrompt(e.target.value)}
               rows={2}
               placeholder="Add short notes if needed."
               className="mt-1 w-full rounded p-2 bg-[#17171b] text-white border border-neutral-700 text-[12px]"
             />
           </label>

           <div className="flex items-center gap-2 text-[11px]">
             <span>Batch</span>
             <Chip small active={genCount === 1} onClick={() => setGenCount(1)}>
               1
             </Chip>
             <Chip small active={genCount === 2} onClick={() => setGenCount(2)}>
               2
             </Chip>
             <span className="ml-2 text-neutral-500">People auto-set from Subject</span>
           </div>

           <button
             type="button"
             onClick={handleGenerate}
             disabled={genLoading || !briefReady}
             className="w-full px-3 py-2.5 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {genLoading ? (
               <span className="inline-flex items-center gap-2">
                 <span className="w-3 h-3 rounded-full bg-gradient-to-r from-fuchsia-400 to-indigo-400 animate-pulse" />
                 Creating Magic…
               </span>
             ) : (
               'Generate Background'
             )}
           </button>

           {briefError && <div className="text-[11px] text-amber-300">{briefError}</div>}
         </div>

         <div className="rounded-xl border border-white/10 bg-neutral-900/30">
           <button
             type="button"
             onClick={() => setShowAdvanced((v) => !v)}
             className="w-full px-3 py-2 text-left text-[12px] text-neutral-200 hover:bg-white/[0.03] rounded-xl"
           >
             {showAdvanced ? 'Hide Advanced Controls' : 'Show Advanced Controls'}
           </button>

           {showAdvanced && (
             <div className="px-3 pb-3 space-y-3">
               <div className="flex items-center gap-2 text-[11px] flex-wrap">
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

               <div className="flex items-center gap-2 text-[11px] flex-wrap">
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

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <Stepper
                   label="Diversity"
                   value={variety}
                   setValue={setVariety}
                   min={0}
                   max={6}
                   step={1}
                 />
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
                     title="Load preset into extra direction"
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
               </div>

               <button
                 type="button"
                 onClick={resetCredits}
                 className="px-3 py-2 rounded bg-neutral-900/70 border border-neutral-700 hover:bg-neutral-800 text-[12px]"
                 title="Reset credits (dev)"
               >
                 Reset Credits
               </button>
             </div>
           )}
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
                 onClick={handleGenerate}
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

      {helpOpen && (
        <div className="fixed inset-0 z-[5100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-cyan-400/30 bg-[#0a0d12] shadow-[0_30px_80px_rgba(0,0,0,.6)] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/10">
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">AI Background Guide</div>
              <div className="mt-1 text-lg font-semibold text-white">Generate cleaner backgrounds in 4 steps.</div>
            </div>

            <div className="p-5 space-y-4 text-sm text-neutral-200 max-h-[70vh] overflow-y-auto">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Step 1: Fill Idea Brief</div>
                <div className="text-neutral-300">
                  Set Event, Mood, Colors, and Subject. These are required so generations stay aligned with your idea.
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Step 2: Add Optional Notes</div>
                <div className="text-neutral-300">
                  Use Extra Direction and Must Include for small constraints only. Keep it short for cleaner output.
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Step 3: Generate</div>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li>Use Batch 2 to compare options quickly.</li>
                  <li>Subject choice automatically toggles People mode.</li>
                  <li>Pick your favorite candidate and apply it.</li>
                </ul>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Step 4: Use Advanced Only If Needed</div>
                <div className="text-neutral-300">
                  Open Advanced Controls for provider, size, diversity, clarity, presets, and deeper subject tuning.
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
   );
 }

 export default React.memo(AiBackgroundPanel);
