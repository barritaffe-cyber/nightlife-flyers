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
  referenceOverride?: string;
  referenceHint?: string;
};
type ColorPaletteMood =
  | 'neon-cyan-magenta'
  | 'deep-red-black'
  | 'gold-black-luxury'
  | 'violet-blue-smoke'
  | 'sunset-orange-purple'
  | 'emerald-teal-night'
  | 'mono-silver-black'
  | 'warm-champagne-amber';
type BriefGender = 'male' | 'female' | '';

const MOOD_SAMPLE_BY_EVENT_MOOD: Record<string, string> = {
  'edm rave club|clean and premium': '/mood-brief/edm-rave-club.png',
  'edm rave club|dark and cinematic': '/mood-brief/edm-rave-club.png',
  'edm rave club|high energy and bold': '/mood-brief/edm-rave-club.png',
  'edm rave club|warm and upscale': '/mood-brief/edm-rave-club.png',

  'rooftop party|clean and premium': '/mood-brief/rooftop-party:premium.png',
  'rooftop party|dark and cinematic': '/mood-brief/rooftop-party:cinematic.png',
  'rooftop party|high energy and bold': '/mood-brief/rooftop-party:energy.png',
  'rooftop party|warm and upscale': '/mood-brief/rooftop-party:premium.png',

  'hip-hop night|clean and premium': '/mood-brief/hip-hop-clean:premium.png',
  'hip-hop night|dark and cinematic': '/mood-brief/hip-hop-dark:cinematic.png',
  'hip-hop night|high energy and bold': '/mood-brief/hip-hop-high:energy.png',
  'hip-hop night|warm and upscale': '/mood-brief/hip-hop-clean:premium.png',

  'afrobeat lounge|clean and premium': '/mood-brief/rooftop-party:premium.png',
  'afrobeat lounge|dark and cinematic': '/mood-brief/rooftop-party:cinematic.png',
  'afrobeat lounge|high energy and bold': '/mood-brief/rooftop-party:energy.png',
  'afrobeat lounge|warm and upscale': '/mood-brief/rooftop-party:premium.png',

  'luxury vip club|clean and premium': '/mood-brief/luxury-vip.club-clean:premium.png',
  'luxury vip club|dark and cinematic': '/mood-brief/luxury-vip.club-dark:cinematic.png',
  'luxury vip club|high energy and bold': '/mood-brief/luxury-vip.club-highEnergy:bold.png',
  'luxury vip club|warm and upscale': '/mood-brief/luxury-vip.club-warm:upscale.png',
};

const MOOD_SAMPLE_BY_EVENT: Record<string, string> = {
  'edm rave club': '/mood-brief/edm-rave-club.png',
  'rooftop party': '/mood-brief/rooftop-party:premium.png',
  'hip-hop night': '/mood-brief/hip-hop-clean:premium.png',
  'afrobeat lounge': '/mood-brief/rooftop-party:energy.png',
  'luxury vip club': '/mood-brief/luxury-vip.club-clean:premium.png',
};

function resolveMoodSample(eventName: string, moodName: string): string | undefined {
  const eventKey = eventName.trim().toLowerCase();
  const moodKey = moodName.trim().toLowerCase();
  if (!eventKey) return undefined;
  const full = MOOD_SAMPLE_BY_EVENT_MOOD[`${eventKey}|${moodKey}`];
  if (full) return full;
  return MOOD_SAMPLE_BY_EVENT[eventKey];
}

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
  const [briefColors, setBriefColors] = React.useState<ColorPaletteMood | ''>('');
  const [briefSubject, setBriefSubject] = React.useState<string>('');
  const [briefSubjectGender, setBriefSubjectGender] = React.useState<BriefGender>('');
  const [briefMustInclude, setBriefMustInclude] = React.useState<string>('');
  const [briefError, setBriefError] = React.useState<string>('');
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const subjectNeedsPeople = React.useMemo(
    () =>
      briefSubject === 'dj' ||
      briefSubject === 'crowd' ||
      briefSubject === 'performer',
    [briefSubject]
  );

  const briefReady =
    briefEvent.trim().length > 0 &&
    briefMood.trim().length > 0 &&
    briefColors.trim().length > 0 &&
    briefSubject.trim().length > 0 &&
    (!subjectNeedsPeople || briefSubjectGender !== '');

  React.useEffect(() => {
    // Keep advanced subject controls in sync with the brief selection immediately.
    setAllowPeople(subjectNeedsPeople);
  }, [setAllowPeople, subjectNeedsPeople]);

  React.useEffect(() => {
    if (!subjectNeedsPeople) {
      setBriefSubjectGender('');
      setGenGender?.('any');
      return;
    }
    if (briefSubjectGender === 'male') setGenGender?.('man');
    if (briefSubjectGender === 'female') setGenGender?.('woman');
  }, [briefSubjectGender, setGenGender, subjectNeedsPeople]);

  const briefPrompt = React.useMemo(() => {
    if (!briefReady) return '';
    const paletteByMood: Record<ColorPaletteMood, string> = {
      'neon-cyan-magenta': 'neon cyan and magenta with deep black contrast',
      'deep-red-black': 'deep red, crimson accents, and rich black shadows',
      'gold-black-luxury': 'gold highlights, warm black base, and luxe contrast',
      'violet-blue-smoke': 'violet and electric blue with smoky shadows',
      'sunset-orange-purple': 'sunset orange, hot pink, and purple nightlife gradients',
      'emerald-teal-night': 'emerald and teal glow with dark night tones',
      'mono-silver-black': 'monochrome silver, graphite, and black',
      'warm-champagne-amber': 'champagne gold, amber warmth, and soft dark browns',
    };
    const chunks = [
      `${briefEvent} background`,
      `${briefMood} tone`,
      `color palette: ${paletteByMood[briefColors as ColorPaletteMood] ?? briefColors}`,
      `subject: ${
        briefSubject === 'none'
          ? 'no visible people, clean environmental scene'
          : briefSubject === 'dj'
            ? 'single DJ on one side of frame'
            : briefSubject === 'crowd'
              ? 'dance crowd with high energy'
              : 'single performer with stage presence'
      }`,
      subjectNeedsPeople
        ? `subject gender: ${briefSubjectGender === 'male' ? 'male' : 'female'}`
        : '',
      'leave clean negative space for headline text',
      genPrompt.trim() ? `extra direction: ${genPrompt.trim()}` : '',
      briefMustInclude.trim()
        ? `must include: ${briefMustInclude.trim()}`
        : '',
    ]
      .filter(Boolean)
      .join(', ');
    return chunks;
  }, [
    briefColors,
    briefEvent,
    briefMood,
    briefMustInclude,
    briefReady,
    briefSubject,
    briefSubjectGender,
    genPrompt,
    subjectNeedsPeople,
  ]);

  const handleGenerate = React.useCallback(() => {
    if (!briefReady) {
      setBriefError(
        subjectNeedsPeople
          ? 'Complete Event, Mood, Color Palette, Subject, and Subject Gender before generating.'
          : 'Complete Event, Mood, Color Palette, and Subject before generating.'
      );
      return;
    }
    setBriefError('');
    setAllowPeople(subjectNeedsPeople);
    const moodReference = resolveMoodSample(briefEvent, briefMood);
    generateBackground({
      prompt: briefPrompt,
      allowPeopleOverride: subjectNeedsPeople,
      referenceOverride: moodReference,
      referenceHint: moodReference
        ? 'Use the mood sample for palette, lighting, and atmosphere only. Keep output text-free and original.'
        : undefined,
    });
  }, [
    briefEvent,
    briefMood,
    briefPrompt,
    briefReady,
    generateBackground,
    setAllowPeople,
    subjectNeedsPeople,
  ]);

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
               Color Palette Mood
               <select
                 value={briefColors}
                 onChange={(e) => setBriefColors(e.target.value as ColorPaletteMood)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1.5 text-[12px]"
               >
                 <option value="">Select palette mood</option>
                 <option value="neon-cyan-magenta">Neon Cyan + Magenta</option>
                 <option value="deep-red-black">Deep Red + Black</option>
                 <option value="gold-black-luxury">Gold + Black Luxury</option>
                 <option value="violet-blue-smoke">Violet Blue Smoke</option>
                 <option value="sunset-orange-purple">Sunset Orange + Purple</option>
                 <option value="emerald-teal-night">Emerald Teal Night</option>
                 <option value="mono-silver-black">Mono Silver + Black</option>
                 <option value="warm-champagne-amber">Warm Champagne Amber</option>
               </select>
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
               Subject Gender
               <select
                 value={briefSubjectGender}
                 onChange={(e) => setBriefSubjectGender(e.target.value as BriefGender)}
                 className="mt-1 w-full rounded bg-[#17171b] text-white border border-neutral-700 px-2 py-1.5 text-[12px]"
                 disabled={!subjectNeedsPeople}
               >
                 <option value="">
                   {subjectNeedsPeople ? 'Select male or female' : 'Not needed for no-people scenes'}
                 </option>
                 <option value="male">Male</option>
                 <option value="female">Female</option>
               </select>
             </label>
             <label className="text-[11px] text-neutral-300 sm:col-span-2">
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
                   FAL
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
              <div className="mt-1 text-lg font-semibold text-white">Current flow: brief-first, then generate.</div>
            </div>

            <div className="p-5 space-y-4 text-sm text-neutral-200 max-h-[70vh] overflow-y-auto">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Step 1: Pick A Style Direction</div>
                <div className="text-neutral-300">
                  Start with Urban, Neon, Tropical, or Vintage. This sets the overall visual lane.
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Step 2: Complete The Idea Brief (Required)</div>
                <div className="text-neutral-300">
                  Fill Event, Mood, Color Palette Mood, and Subject. If Subject includes people, choose Subject Gender (male/female). Generate stays disabled until these are set.
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Step 3: Add Optional Direction + Generate</div>
                <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                  <li>Use Extra Direction and Must Include only for small constraints.</li>
                  <li>Subject choice auto-sets People mode (DJ/Crowd/Performer = on).</li>
                  <li>Use Batch 1 or 2, then click a candidate thumbnail to apply.</li>
                </ul>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">Step 4: Use Advanced Only If Needed</div>
                <div className="text-neutral-300">
                  Advanced Controls holds provider, size, diversity, clarity, presets, and deeper subject profile tuning.
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
