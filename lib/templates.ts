import { PRESETS } from '../lib/presets';
import type { Emoji } from "../app/types/emoji";

// Quick reference: emoji characters we commonly bake into templates
export const EMOJI_CHARS: string[] = [
  '🎉','🎊','✨','🎭','🎈','🥳','💋',
  '💜','💛','💚','💙',
  '🔥','🌟'
];


// Nightlife graphics (same icons as Library panel, with color token)
const NIGHTLIFE_GRAPHIC_TEMPLATES: Record<string, string> = {
  hookah:
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M58 14L70 14L70 26L58 26Z"/>' +
      '<path d="M54 26L74 26L80 40L74 52L54 52L48 40Z"/>' +
      '<path d="M64 52L64 78"/>' +
      '<path d="M52 86L76 86L76 98L52 98Z"/>' +
      '<path d="M80 36H92Q104 36 104 48V66"/>' +
      '<path d="M100 66L110 66"/>' +
    '</svg>',
  bottle:
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M54 14H74V24H54Z"/>' +
      '<path d="M58 24H70V36"/>' +
      '<path d="M58 36Q58 32 62 32H66Q70 32 70 36V88Q70 98 64 100Q58 98 58 88Z"/>' +
      '<path d="M58 88H70"/>' +
      '<path d="M58 96H70"/>' +
      '<path d="M80 54H96V80H80Z"/>' +
      '<path d="M88 80V98"/>' +
      '<path d="M82 98H94"/>' +
    '</svg>',
  bucket:
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M32 44H96L90 108Q64 116 38 108L32 44Z"/>' +
      '<path d="M38 50H90"/>' +
      '<path d="M34 60Q22 76 26 100Q30 116 50 112"/>' +
      '<path d="M94 60Q106 76 102 100Q98 116 78 112"/>' +
      '<path d="M44 44L52 36L62 44L54 52Z"/>' +
      '<path d="M56 44L64 36L74 44L66 52Z"/>' +
      '<path d="M68 44L76 36L86 44L78 52Z"/>' +
      '<path d="M74 18L86 30L80 36L68 24Z"/>' +
      '<path d="M70 24L80 34L76 72L66 66Z"/>' +
    '</svg>',
  drink:
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M28 8A14 14 0 1 1 27.99 8Z"/>' +
      '<path d="M40 18L100 18L74 52L66 52Z"/>' +
      '<path d="M48 32L92 32"/>' +
      '<path d="M70 52L70 86"/>' +
      '<path d="M52 98L88 98"/>' +
      '<path d="M34 58A20 20 0 1 1 33.99 58Z"/>' +
      '<path d="M34 78L34 64"/>' +
      '<path d="M34 78L24 84"/>' +
      '<path d="M34 56L34 60"/>' +
      '<path d="M34 96L34 92"/>' +
      '<path d="M12 78L16 78"/>' +
      '<path d="M56 78L52 78"/>' +
    '</svg>',
  venue:
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M64 20C46 20 32 34 32 52C32 76 64 108 64 108C64 108 96 76 96 52C96 34 82 20 64 20Z"/>' +
      '<path d="M64 52A10 10 0 1 0 64 32A10 10 0 0 0 64 52Z"/>' +
    '</svg>',
  music:
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M56 32L96 24V80"/>' +
      '<path d="M56 32V88"/>' +
      '<path d="M56 88A8 8 0 1 0 48 80A8 8 0 0 0 56 88Z"/>' +
      '<path d="M96 80A8 8 0 1 0 88 72A8 8 0 0 0 96 80Z"/>' +
    '</svg>',
  time:
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none" stroke="{{COLOR}}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M64 28V60L82 70"/>' +
      '<path d="M64 112A48 48 0 1 0 64 16A48 48 0 0 0 64 112Z"/>' +
    '</svg>',
};

// Reusable preset you can drop into any template's emojiList
export const NIGHTLIFE_GRAPHICS_PRESET: Emoji[] = [
  { id: "graphic_hookah_sq", kind: "flare", char: "", svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah, iconColor: "#ffffff", isFlare: true, isSticker: true, blendMode: "normal", x: 10, y: 88, scale: 0.3, rotation: 0, opacity: 1, locked: false },
  { id: "graphic_bottle_service_sq", kind: "flare", char: "", svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, iconColor: "#ffffff", isFlare: true, isSticker: true, blendMode: "normal", x: 24, y: 88, scale: 0.28, rotation: 0, opacity: 1, locked: false },
  { id: "graphic_bucket_deals_sq", kind: "flare", char: "", svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bucket, iconColor: "#ffffff", isFlare: true, isSticker: true, blendMode: "normal", x: 38, y: 88, scale: 0.28, rotation: 0, opacity: 1, locked: false },
  { id: "graphic_drink_specials_sq", kind: "flare", char: "", svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, iconColor: "#ffffff", isFlare: true, isSticker: true, blendMode: "normal", x: 52, y: 88, scale: 0.28, rotation: 0, opacity: 1, locked: false },
  { id: "graphic_venue_sq", kind: "flare", char: "", svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, iconColor: "#ffffff", isFlare: true, isSticker: true, blendMode: "normal", x: 66, y: 88, scale: 0.24, rotation: 0, opacity: 1, locked: false },
  { id: "graphic_music_sq", kind: "flare", char: "", svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.music, iconColor: "#ffffff", isFlare: true, isSticker: true, blendMode: "normal", x: 80, y: 88, scale: 0.28, rotation: 0, opacity: 1, locked: false },
  { id: "graphic_time_sq", kind: "flare", char: "", svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.time, iconColor: "#ffffff", isFlare: true, isSticker: true, blendMode: "normal", x: 90, y: 88, scale: 0.28, rotation: 0, opacity: 1, locked: false },
];




// === SUPPORTED TEMPLATE FORMATS ============================================
export type Format = 'square' | 'story';

export type TextFx = {
  uppercase: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  tracking: number;
  texture?: string;
  gradient: boolean;
  gradFrom: string;
  gradTo: string;
  color: string;
  strokeWidth: number;
  strokeColor: string;
  shadow: number;
  glow: number;
  shadowEnabled: boolean;
};

// === TemplateSpec unified interface ======================================
export interface TemplateBase {
  // -----------------------------------------------------
  // GENERAL LAYOUT
  // -----------------------------------------------------
  textColWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: 'square' | 'story';
  bodyColor?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textFx?: TextFx;

  // -----------------------------------------------------
  // BACKGROUND
  // -----------------------------------------------------
  bgPosX?: number;
  bgPosY?: number;
  bgX?: number; 
  bgY?: number;
  bgScale?: number;
  backgroundUrl?: string;
  bgBlur?: number;
  vignette?: boolean;
  vignetteStrength?: number;

  // -----------------------------------------------------
  // HEADLINE 1
  // -----------------------------------------------------
  headline?: string;
  headlineFamily?: string;
  headlineHeight?: number;
  headlineSize?: number;
  headColor?: string;
  headX?: number;
  headY?: number;
  headShadow?: boolean;
  headShadowStrength?: number;
  headlineLineHeight?: number;

  headItalic?: boolean;
  headTracking?: number;
  headLeadTrackDelta?: number;
  headLastTrackDelta?: number;
  headBold?: boolean;
  headUnderline?: boolean;
  headSizeAuto?: boolean;
  headMaxPx?: number;
  textAlign?: 'left' | 'center' | 'right';
  headAlign?: 'left' | 'center' | 'right';
  headlineItalic?: boolean;
  headlineBold?: boolean;      // Good idea to add this too
  headlineUppercase?: boolean;

  // ⭐ ADDED — missing from your system:
  headUppercase?: boolean;
  headGradient?: boolean;
  headGlow?: number;
  headStrokeWidth?: number;
  headStrokeColor?: string;
  headGradFrom?: string;
  headGradTo?: string;
  headRotate?: number;
  headRandomRotate?: number;
  headBehindPortrait?: boolean;
  headOpticalMargin?: boolean;
  headKerningFix?: boolean;
  headAlpha?: number;
  

  // -----------------------------------------------------
  // HEADLINE 2
  // -----------------------------------------------------
  head2Enabled?: boolean;
  head2line?: string;
  head2Family?: string;
  head2Color?: string;
  head2Align?: 'left' | 'center' | 'right';
  head2Size?: number;
  head2lineHeight?: number;
  head2X?: number;
  head2Y?: number;
  head2Bold?: boolean;
  head2Italic?: boolean;
  head2Underline?: boolean;
  head2Shadow?: boolean;
  head2ShadowStrength?: number;
  head2Alpha?: number;
  head2Fx?: TextFx;
  head2Tracking?: number;
  head2Uppercase?: boolean;
  head2Gradient?: boolean;
  head2Glow?: number;
  head2TrackEm?: number;
  head2Rotate?: number;
  head2LineHeight?: number;

  // -----------------------------------------------------
  // DETAILS 1
  // -----------------------------------------------------
  details?: string;
  detailsFamily?: string;
  detailsAlign?: 'left' | 'center' | 'right';
  detailsX?: number;
  detailsY?: number;
  detailsSize?: number;
  detailsLetterSpacing?: number;
  detailsColor?: string;
  detailsBold?: boolean;
  detailsItalic?: boolean;
  detailsUnderline?: boolean;
  detailsShadow?: boolean;
  detailsShadowStrength?: number;
  detailsTracking?: number;
  detailsUppercase?: boolean;
  detailsRotate?: number;
  detailsLineHeight?: number;

  // -----------------------------------------------------
  // DETAILS 2
  // -----------------------------------------------------
  details2Enabled?: boolean;
  details2?: string;
  details2Family?: string;
  details2X?: number;
  details2Y?: number;
  details2Size?: number;
  details2LineHeight?: number;
  details2LetterSpacing?: number;
  details2Color?: string;
  details2Shadow?: boolean;
  details2ShadowStrength?: number;
  details2Rotate?: number;

  // ⭐ ADDED — UI uses these
  details2Align?: 'left' | 'center' | 'right';
  details2Uppercase?: boolean;
  details2Bold?: boolean;
  details2Italic?: boolean;
  details2Underline?: boolean;

  // -----------------------------------------------------
  // VENUE
  // -----------------------------------------------------
  venue?: string;
  venueFamily?: string;
  venueColor?: string;
  venueX?: number;
  venueY?: number;
  venueSize?: number;
  venueAlign?: 'left' | 'center' | 'right';
  venueLineHeight?: number;
  venueShadow?: boolean;
  venueShadowStrength?: number;
  venueEnabled?: boolean;

  // ⭐ ADDED — UI uses this:
  venueRotate?: number;

  // -----------------------------------------------------
  // SUBTAG
  // -----------------------------------------------------
  subtagEnabled?: boolean;
  subtag?: string;
  subtagX?: number;
  subtagY?: number;
  subtagSize?: number;
  subtagTextColor?: string;
  subtagFamily?: string;
  subtagBgColor?: string;
  subtagShadow?: boolean;
  subtagShadowStrength?: number;
  subtagAlpha?: number;
  subtagRotate?:number

  // ⭐ ADDED — missing controls:
  subtagItalic?: boolean;
  subtagUppercase?: boolean;
  subtagLetterSpacing?: number;

  // -----------------------------------------------------
  // PILL / MISC
  // -----------------------------------------------------
  pillColor?: string;
  pillAlpha?: number;

  // -----------------------------------------------------
  // PORTRAIT
  // -----------------------------------------------------
  portraitEnabled?: boolean;
  portraitUrl?: string | null;
  portraitX?: number;
  portraitY?: number;
  portraitScale?: number;
  portraitRotate?: number;
  portraitOpacity?: number;
  portraitLocked?: boolean;

  // -----------------------------------------------------
  // LOGO
  // -----------------------------------------------------
  logoX?: number;
  logoY?: number;
  logoScale?: number;
  logoRotate?: number;
  logoOpacity?: number;

  // -----------------------------------------------------
  // EMOJIS
  // -----------------------------------------------------
  emojis?: Emoji[];

  // per-format
  emojisEnabled?: boolean;
  emojiList?: Emoji[];
}



// === TemplateSpec (root) ================================================
export interface TemplateSpec {
  id: string;
  label: string;
  tags: string[];
  style?: string;
  bgPrompt?: string;
  preview: string;

  // Root-level emojis (applied before format-level)
  emojis?: Emoji[];

  base?: TemplateBase;

  formats?: {
    square?: TemplateBase;
    story?: TemplateBase;
  };
}




export const TEMPLATE_GALLERY: TemplateSpec[] = [
  {
    id: 'white_minimal',
    label: 'White Minimal — Clean Event',
    tags: ['Minimal', 'Clean', 'White'],
    style: 'urban',
    bgPrompt: '',
    preview: '/templates/white_minimal.jpg',
    formats: {
      square: {
        headline: 'WHITE\nNIGHT',
        headlineFamily: 'Bebas Neue',
        headlineSize: 96,
        headlineHeight: .9,
        headColor: '#111111',
        headX: 32.1,
        headY: 29.1,
        headAlign: 'center',
        headShadow: false,
        headGradient: false,

        details: 'SAT • 10 PM\nDRESS CODE: WHITE\nRSVP REQUIRED',
        detailsLineHeight: .6,
        detailsX: 33.5,
        detailsY: 70,
        bodyColor: '#222222',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsShadow: false,

        venue: 'THE ROOFTOP CLUB',
        venueX: 25.1,
        venueY: 81.2,
        venueColor: '#333333',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: false,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1,
        vignette: false,

        textColWidth: 58,
        align: 'left',
        textAlign: 'left',

        portraitX: 72,
        portraitY: 52,
        portraitScale: 0.7,

        // Library items baked into template (emoji + flare)
        emojiList: [
          {
            id: 'wm_confetti_sq',
            kind: 'emoji',
            char: '🌟',
            x: 50,
            y: 90.5,
            scale: 0.26,
            rotation: 0,
            opacity: 1,
            locked: false,
          },
          {
            id: 'wm_flare_sq',
            kind: 'flare',
            char: '',
            url: '/flares/flare01.png',
            isFlare: true,
            blendMode: 'screen',
            x: 48.8,
            y: 21.4,
            scale: 4,
            rotation: 0,
            opacity: 0.45,
            locked: true,
          },
        ],
        
      },
      story: {
        headline: 'WHITE\nNIGHT',
        headlineFamily: 'Bebas Neue',
        headlineSize: 176,
        headlineHeight: .9,
        headColor: '#111111',
        headX: 19.3,
        headY: 28.8,
        headAlign: 'center',
        headShadow: false,
        headGradient: false,

        details: 'SAT • 10 PM\nDRESS CODE: WHITE\nRSVP REQUIRED',
        detailsLineHeight: .74,
        detailsX: 33.5,
        detailsY: 70.9,
        bodyColor: '#222222',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsShadow: false,

        venue: 'THE ROOFTOP CLUB',
        venueX: 23.4,
        venueY: 78.3,
        venueColor: '#333333',
        venueSize: 28,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: false,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1,
        vignette: false,

        textColWidth: 60,
        align: 'left',
        textAlign: 'left',

        portraitX: 72,
        portraitY: 52,
        portraitScale: 0.65,

        emojiList: [
          {
            id: 'wm_confetti_st',
            kind: 'emoji',
            char: '🌟',
            x: 50.1,
            y: 85,
            scale: 0.80,
            rotation: 0,
            opacity: 1,
            locked: false,
          },
          {
            id: 'wm_flare_st',
            kind: 'flare',
            char: '',
            url: '/flares/flare01.png',
            isFlare: true,
            blendMode: 'screen',
            x: 65.3,
            y: 25,
            scale: 5,
            rotation: 0,
            opacity: 0.45,
            locked: true,
          },
        ],
      },
    },
  },
  {
    id: 'edm_tunnel',
    label: 'EDM Rave — Laser Tunnel',
    tags: ['EDM', 'Neon'],
    style: 'neon',
    bgPrompt: PRESETS.find((p) => p.key === 'edm_tunnel')!.prompt,
    preview: '/templates/edm_tunnel.jpg',
    formats: {
      square: {
        headline: 'EUPHORIA',
        headlineFamily: 'Aliens Among Us',
        headlineSize: 100,
        headlineHeight: 1.1,
        headColor: '#ffbc00',
        headX: 7.1,
        headY: 31,
        headAlign: 'center',
        headItalic: false,
        headShadow: true,
        headShadowStrength: 3,
        headGradient: false,

        details: 'Trance • House • Techno\nDoors 10PM - 4AM\nLASERS • CO2 • VISUALS',
        detailsLineHeight: .7,
        detailsX: 25.9,
        detailsY: 76.8,
        bodyColor: '#fcbc00',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsShadow: true,
        detailsShadowStrength: .7,

        venue: 'THE UNDERGROUND',
        venueX: 33,
        venueY: 69.8,
        venueColor: '#FFFFFF',
        venueSize: 34,
        venueFamily: 'Bebas Neue',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'SEASON OPENER',
        head2Color: '#f9f6f8',
        head2Align: 'center',
        head2Size: 58,
        head2X: 23.9,
        head2Y: 20,
        head2Family: 'Bebas Neue',
        head2Shadow: true,
        head2ShadowStrength: 1,

        subtagEnabled: true,
        subtag: 'the drop waits for no one',
        subtagX: 26.3,
        subtagY: 50.5,
        subtagSize: 15,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#fcbc00',
        subtagBgColor: '#3e3c3d',
        subtagShadow: true,
        subtagShadowStrength: 1,

        bgPosX: 50,
        bgPosY: 50,
        vignette: true,
        bgScale: 1.5,
        vignetteStrength: .1,

        textColWidth: 80,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'EUPH\nORIA',
        headlineFamily: 'Aliens Among Us',
        headlineSize: 150,
        headlineHeight: 1.06,
        headlineLineHeight: 1.06,
        headColor: '#ffbc00',
        headX: 17,
        headY: 18.2,
        headAlign: 'center',
        headItalic: false,
        headShadow: true,
        headShadowStrength: 3,

        details: 'Trance • House • Techno\nDoors 10PM - 4AM\nLASERS • CO2 • VISUALS',
        detailsLineHeight: .64,
        detailsX: 20.6,
        detailsY: 80.6,
        bodyColor: '#ffbc00',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 20,
        detailsShadow: true,
        detailsShadowStrength: 1,

        details2Enabled: true,
        details2: '21+ Event',
        details2Family: 'Inter',
        details2X: 36.1,
        details2Y: 88,
        details2Size: 36,
        details2LineHeight: 1.2,
        details2LetterSpacing: 0,
        details2Color: '#FFFFFF',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'THE UNDERGROUND',
        venueX: 22.8,
        venueY: 73.9,
        venueColor: '#FFFFFF',
        venueSize: 55,
        venueFamily: 'Bebas Neue',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'SEASON OPENER',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 52,
        head2X: 27.7,
        head2Y: 13.5,
        head2Family: 'Bebas Neue',
        head2Shadow: true,
        head2ShadowStrength: 1,

        subtagEnabled: true,
        subtag: 'the drop waits for no one',
        subtagX: 21.7,
        subtagY: 51.6,
        subtagSize: 18,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#fcbc00',
        subtagBgColor: '#3e3c3d',
        subtagShadow: true,
        subtagShadowStrength: 1,
        subtagAlpha: 1,

        bgPosX: 50,
        bgPosY: 50,
        vignette: true,
        bgScale: 1.5,
        vignetteStrength:.1,

        textColWidth: 90,
        align: 'center',
        textAlign: 'center',
      },
    },
  },

  {
    id: 'edm_stage_co2',
    label: 'EDM — Stage + CO₂',
    tags: ['EDM', 'Neon'],
    style: 'neon',
    bgPrompt: PRESETS.find((p) => p.key === 'edm_stage_co2')!.prompt,
    preview: '/templates/edm_stage_co2.jpg',
    formats: {
      square: {
        headline: 'MAIN\nSTAGE',
        headlineFamily: 'Doctor Glitch',
        headlineSize: 114,
        headlineHeight: 0.8,
        headColor: '#FFFFFF',
        headX: 11.8,
        headY: 30.1,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'Special Guest DJ\nPyrotechnics + Cryo\nDoors Open 9PM',
        detailsLineHeight: .82,
        detailsX: 49.8,
        detailsY: 73.3,
        bodyColor: '#00F2F2',
        detailsAlign: "left",
        detailsFamily: 'Azonix',
        detailsShadow: true,
        detailsShadowStrength: 1,
        

        venue: 'ARENA CLUB',
        venueX: 14.5,
        venueY: 72,
        venueColor: '#FF00FF',
        venueSize: 45,
        venueFamily: 'Bebas Neue',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'FESTIVAL',
        head2Color: '#FFFFFF',
        head2Align: 'center',
        head2Size: 30,
        head2X: 16,
        head2Y: 81.2,
        head2Family: 'Azonix',
        head2Shadow: true,
        head2ShadowStrength: 1.4,

        subtagEnabled: true,
        subtag: 'live the moment',
        subtagX: 33.1,
        subtagY: 18.7,
        subtagSize: 15,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#FFFFFF',
        subtagShadow: false,
        subtagShadowStrength: 1,
        subtagBgColor: '#FF00FF',
        subtagAlpha: 0.8,

        vignette: true,
        vignetteStrength: 0.06,

        textColWidth: 70,
        align: 'center',
        headItalic: false,
        textAlign: 'center',
      },
      story: {
        headline: 'MAIN\nSTAGE',
        headlineFamily: 'Doctor Glitch',
        headlineSize: 130,
        headlineHeight: 0.8,
        headColor: '#FFFFFF',
        headX: 4.6,
        headY: 22.1,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'Special Guest DJ\nPyrotechnics + Cryo\nDoors Open 9PM',
        detailsLineHeight: 0.62,
        detailsX: 21.3,
        detailsY: 83.6,
        bodyColor: '#00F2F2',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 23,

        venue: 'ARENA CLUB',
        venueX: 33.1,
        venueY: 76.9,
        venueColor: '#FF00FF',
        venueSize: 45,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'FESTIVAL',
        head2Color: '#FF00FF',
        head2Align: 'center',
        head2Size: 90,
        head2X: 7.5,
        head2Y: 47.5,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'live the moment',
        subtagX: 26.3,
        subtagY: 15.5,
        subtagSize: 23,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#FFFFFF',
        subtagBgColor: '#FF00FF',
        subtagShadow: false,
        
        vignetteStrength:.06,

        details2Enabled: true,
        details2: 'Get Tickets Now',
        details2X: 23,
        details2Y: 91,
        details2Size: 37,
        details2Family: 'Bebas Neue',
        details2Color: '#e9f508',
        details2Shadow: true,
        details2ShadowStrength: 1,

        textColWidth: 80,
        align: 'center',
        headItalic: false,
        textAlign: 'center',
      },
    },
  },
  {
    id: 'ladies_pinkchrome',
    label: 'Ladies Night — Pink Chrome',
    tags: ['Ladies Night', 'Neon'],
    style: 'neon',
    bgPrompt: PRESETS.find((p) => p.key === 'ladies_pinkchrome')!.prompt,
    preview: '/templates/ladies_pinkchrome.jpg',
    formats: {
      square: {
        headline: 'LADIES',
        headlineFamily: 'Doctor Glitch',
        headlineSize: 122,
        headlineHeight: 0.29,
        headColor: '#f1099c',
        headX: 8.5,
        headY: 52,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: .9,

        details: 'Free Entry Before 11PM\nComplimentary Champagne\nDress to Impress',
        detailsLineHeight: .58,
        detailsX: 22.7,
        detailsY: 82,
        bodyColor: '#ebfb04',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 17,

        venue: 'CHROME LOUNGE',
        venueX: 29,
        venueY: 8,
        venueColor: '#FFFFFF',
        venueSize: 45,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'NIGHT',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 80,
        head2X: 32,
        head2Y: 67,
        head2Family: 'Azonix',
        head2TrackEm: .15,

        subtagEnabled: true,
        subtag: 'shine bright tonight',
        subtagX: 30.5,
        subtagY: 16.4,
        subtagSize: 15,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ebfb04',
        subtagBgColor: '#f1099c',

        vignetteStrength: .1,

        textColWidth: 70,
        align: 'center',
        headItalic: false,
        textAlign: 'center',
      },
      story: {
        headline: 'LADIES',
        headlineFamily: 'Doctor Glitch',
        headlineSize: 122,
        headlineHeight: 0.29,
        headColor: '#f1099c',
        headX: 6.7,
        headY: 63.3,
        headAlign: 'center',
        headShadowStrength: .9,

        details: 'Free Entry Before 11PM\nComplimentary Champagne\nDress to Impress',
        detailsLineHeight: .7,
        detailsX: 9.3,
        detailsY: 83.3,
        bodyColor: '#ebfb04',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 24,

        venue: 'CHROME LOUNGE',
        venueX: 29.5,
        venueY: 20,
        venueColor: '#FFFFFF',
        venueSize: 45,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'NIGHT',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 106,
        head2X: 23.7,
        head2Y: 72.2,
        head2Family: 'Azonix',
        head2TrackEm: .15,

        subtagEnabled: true,
        subtag: 'shine bright tonight',
        subtagX: 19,
        subtagY: 25.3,
        subtagSize: 25,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ebfb04',
        subtagBgColor: '#f1099c',
        subtagShadow: false,

        vignetteStrength: .1,

        headItalic: false,
        textAlign: 'center',
      },
    },
  },
  {
    id: 'kpop_pastel_led',
    label: 'K-Pop — Pastel LED',
    tags: ['College', 'Neon'],
    style: 'neon',
    bgPrompt: PRESETS.find((p) => p.key === 'kpop_pastel_led')!.prompt,
    preview: '/templates/kpop_pastel_led.jpg',
    formats: {
      square: {
        headline: 'K-POP',
        headlineFamily: 'Designer',
        headlineSize: 144,
        headlineLineHeight: 0.64,
        headColor: '#09f1ed',
        headX: 9.3,
        headY: 9.5,
        textAlign: 'center',
        headItalic: true,

        details: 'BTS • Blackpink • Twice\nRandom Dance Play @ Midnight\nSoju Specials',
        detailsLineHeight: .7,
        detailsX: 19.3,
        detailsY: 80.7,
        bodyColor: '#ffffff',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 17,

        venue: 'SEOUL VIBES',
        venueX: 34.9,
        venueY: 71.1,
        venueColor: '#f7c202',
        venueSize: 45,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'TAKEOVER',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 60,
        head2X: 11.3,
        head2Y: 45.7,
        head2Family: 'Azonix',
        head2TrackEm: .15,

        subtagEnabled: true,
        subtag: 'One night. All idols!',
        subtagX: 17.4,
        subtagY: 54.3,
        subtagSize: 28,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#28efe5',
        subtagBgColor: '#041a3e',
        pillAlpha: 0.7,
        subtagShadow: false,

        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
      },
      story: {
        headline: 'K-POP',
        headlineFamily: 'Designer',
        headlineSize: 180,
        headlineHeight: 0.6,
        headColor: '#09f1ed',
        headX: 6.7,
        headY: 6.9,
        textAlign: 'center',
        headShadow: true,
        headShadowStrength: 2.2,
        headlineLineHeight: .6,

        details: 'BTS • Blackpink • Twice\nRandom Dance Play @ Midnight\nSoju Specials',
        detailsLineHeight: .58,
        detailsX: 6.7,
        detailsY: 79.8,
        bodyColor: '#fdfdfc',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 23,

        details2Enabled: true,
        details2: 'GET TIX NOW!',
        details2Color:'#f7c202',
        details2Size: 41,
        details2X: 20.6,
        details2Y: 87.9,
        details2Shadow: true,
        details2ShadowStrength: 1,
        
        venue: 'SEOUL VIBES',
        venueX: 33,
        venueY: 73.9,
        venueColor: '#f7c202',
        venueSize: 45,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'TAKEOVER',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 90,
        head2X: 17.4,
        head2Y: 31.4,
        head2Family: 'Azonix',
        head2Shadow: true,
        head2ShadowStrength: .7,

        subtagEnabled: true,
        subtag: 'One night. All idols!',
        subtagX: 14.4,
        subtagY: 39.3,
        subtagSize: 31,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#09f1ed',
        subtagShadow: false,

        vignetteStrength:.1,

        pillAlpha:0,
        headItalic: false,
      },
    },
  },
  {
    id: 'hiphop_graffiti',
    label: 'Hip-Hop — Graffiti Alley',
    tags: ['Hip-Hop', 'Urban'],
    style: 'urban',
    bgPrompt: PRESETS.find((p) => p.key === 'hiphop_graffiti')!.prompt,
    preview: '/templates/hiphop_graffiti.jpg',
    formats: {
      square: {
        headline: 'THE\nBLOCK\nIS HOT',
        headlineFamily: 'Designer',
        headlineSize: 86,
        headlineLineHeight: .68,
        headColor: '#09f1ed',
        headX: 8.2,
        headY: 29.2,
        headAlign: 'left',
        headItalic: true,

        details: 'Good vibes only.\nBring your crew,\nwe’ll bring the noise',
        detailsLineHeight: .66,
        detailsX: 6.5,
        detailsY: 76.5,
        bodyColor: '#09f1ed',
        detailsAlign: 'left',
        detailsFamily: 'Azonix',
        detailsSize: 18,

        venue: '@THE LOT',
        venueX: 6.9,
        venueY: 66.1,
        venueColor: '#f7c202',
        venueSize: 52,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'LIVE DJ X ARTISTE',
        head2Color: '#ffffff',
        head2Align: 'left',
        head2Size: 24,
        head2X: 7.1,
        head2Y: 89.9,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'Pull up and vibe!',
        subtagX: 8.3,
        subtagY: 19.4,
        subtagSize: 26,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        bgPosX: 16.4,
        bgPosY: 100,
        bgScale: 1.4,
        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'THE\nBLOCK\nIS HOT',
        headlineFamily: 'Designer',
        headlineSize: 110,
        headColor: '#fbbf24',
        headX: 9.3,
        headY: 6.6,
        headAlign: 'center',
        headlineLineHeight: .68,
        headlineItalic: true,

        details: 'Good vibes only.\nBring your crew,\nwe’ll bring the noise',
        detailsLineHeight: .6,
        detailsX: 24.7,
        detailsY: 86.6,
        bodyColor: '#f7c025',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 20,

        details2Enabled: true,
        details2:'“THIS OUR BLOCK”',
        details2Size: 39,
        details2Color:'#ffffff',
        details2X: 17.1,
        details2Y: 30.3,
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: '@THE LOT',
        venueX: 34.3,
        venueY: 74.9,
        venueColor: '#ffffff',
        venueSize: 61,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'LIVE DJ X ARTISTE',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 27.2,
        head2Y: 81,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'Pull up and vibe!',
        subtagX: 22.1,
        subtagY: 93.1,
        subtagSize: 29,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ffffff',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        bgPosX: 80.1,
        bgPosY: 50.7,
        vignetteStrength:.1,

        textAlign: 'center',
      },
    },
  },
  {
    id: 'hiphop_lowrider',
    label: 'Hip-Hop — Lowrider Chrome',
    tags: ['Hip-Hop', 'Urban'],
    style: 'urban',
    bgPrompt: PRESETS.find((p) => p.key === 'hiphop_lowrider')!.prompt,
    preview: '/templates/hiphop_lowrider.jpg',
    formats: {
      square: {
        headline: 'WEST\nCOAST',
        headlineFamily: 'DIMITRI_',
        headlineSize: 128,
        headlineHeight: .74,
        headColor: '#09f1ed',
        headX: 18.6,
        headY: 20.8,
        headAlign: 'center',
        headItalic: true,

        details: 'G-Funk • Lowriders • BBQ\nSunday Service\nDoors 2PM',
        detailsLineHeight: .52,
        detailsX: 20.4,
        detailsY: 74.4,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 20,

        venue: 'SUNSET BLVD',
        venueX: 45.9,
        venueY: 62.1,
        venueColor: '#f7c202',
        venueSize: 38,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'CRUISING',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 38,
        head2X: 32,
        head2Y: 87.3,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'california love',
        subtagX: 25.9,
        subtagY: 14,
        subtagSize: 26,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'WEST\nCOAST',
        headlineFamily: 'DIMITRI_',
        headlineSize: 168,
        headlineLineHeight: .76,
        headColor: '#09f1ed',
        headX: 7.4,
        headY: 19.4,
        headAlign: 'center',
        headItalic: true,

        details: 'G-Funk • Lowriders • BBQ\nSunday Service\nDoors 2PM',
        detailsLineHeight: .56,
        detailsX: 12.9,
        detailsY: 74.8,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 25,

        details2Enabled: true,
        details2:'"Slow ride. Smooth sound."',
        details2Family:'Nexa-ExtraLight',
        details2Size: 24,
        details2X: 24,
        details2Y: 88.6,
        details2Color: '#ffffff',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'SUNSET BLVD',
        venueX: 43.1,
        venueY: 45.4,
        venueColor: '#f7c202',
        venueSize: 50,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'CRUISING',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 58,
        head2X: 22.9,
        head2Y: 83.5,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'california love',
        subtagX: 16.2,
        subtagY: 13.4,
        subtagSize: 37,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        vignetteStrength:.1,

        textAlign: 'center',
      },
    },
  },
  {
    id: 'dnb_bunker',
    label: 'DNB — Concrete Bunker',
    tags: ['Techno', 'Urban'],
    style: 'urban',
    bgPrompt: PRESETS.find((p) => p.key === 'dnb_bunker')!.prompt,
    preview: '/templates/dnb_bunker.jpg',
    formats: {
      square: {
        headline: 'BASS',
        headlineFamily: 'raidercrusader',
        headlineSize: 94,
        headlineHeight: 0.8,
        headColor: '#09f1ed',
        headX: 24.1,
        headY: 54.1,
        headAlign: 'center',
        headItalic: true,

        details: '174 BPM • Drum & Bass • Jungle\nSecret Location\nCapacity Limited',
        detailsLineHeight: .62,
        detailsX: 10,
        detailsY: 81.5,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 18,

        venue: 'CONCRETE',
        venueX: 37.8,
        venueY: 7.9,
        venueColor: '#f7c202',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'PRESSURE',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 46,
        head2X: 22.8,
        head2Y: 70.8,
        head2Family: 'raidercrusader',

        subtagEnabled: true,
        subtag: 'PURE CHAOS!',
        subtagX: 36,
        subtagY: 13.6,
        subtagSize: 17,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,

        bgPosX: 50.5,
        bgPosY: 35.4,
        bgScale: 1.3,
        vignetteStrength:.1,
        

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'BASS',
        headlineFamily: 'raidercrusader',
        headlineSize: 148,
        headlineHeight: 0.8,
        headColor: '#09f1ed',
        headX: 12.8,
        headY: 48,
        headAlign: 'center',
        headItalic: true,

        details: '174 BPM • Drum & Bass • Jungle\nSecret Location\nCapacity Limited',
        detailsLineHeight: .66,
        detailsX: 5.4,
        detailsY: 75.1,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 21,

        details2Enabled: true,
        details2Family: 'Designer',
        details2:'GET YOUR TICKETS NOW',
        details2Size: 25,
        details2X: 12.3,
        details2Y: 83.2,
        details2Color: '#ffffff',
        details2Shadow: true,
        details2ShadowStrength: 1,


        venue: 'CONCRETE',
        venueX: 39.1,
        venueY: 8.6,
        venueColor: '#f7c202',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'PRESSURE',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 72,
        head2X: 10.2,
        head2Y: 62.6,
        head2Family: 'raidercrusader',

        subtagEnabled: true,
        subtag: 'PURE CHAOS!',
        subtagX: 36.8,
        subtagY: 11.9,
        subtagSize: 17,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,

        vignetteStrength:.1,

        textColWidth: 80,
        align: 'center',
        textAlign: 'center',
      },
    },
  },
  {
    id: 'rnb_velvet',
    label: 'R&B — Velvet & Smoke',
    tags: ['R&B Lounge', 'Vintage'],
    style: 'vintage',
    bgPrompt: PRESETS.find((p) => p.key === 'rnb_velvet')!.prompt,
    preview: '/templates/rnb_velvet.jpg',
    formats: {
      square: {
        headline: 'SLOW JAMZ',
        headlineFamily: 'Atlantis Famingo DEMO VERSION',
        headlineSize: 104,
        headlineLineHeight: .76,
        headColor: '#dcaf09',
        headX: 34.2,
        headY: 9.7,
        headAlign: 'center',
        headItalic: true,

        details: 'Smooth R&B • Neo-Soul\nCouples Welcome\nDress Code: Casually Elegant',
        detailsLineHeight: .76,
        detailsX: 34.1,
        detailsY: 60.6,
        bodyColor: '#ffffff',
        detailsAlign: 'right',
        detailsFamily: 'Azonix',
        detailsSize: 15,
        

        venue: 'VELVET ROOM',
        venueX: 60.6,
        venueY: 82.7,
        venueColor: '#f7c202',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'LOUNGE',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 71,
        head2Y: 77,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'Nothing rushed,\nEverything felt.',
        subtagX: 56.1,
        subtagY: 37.3,
        subtagSize: 17,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ffffff',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        bgPosX: 80.3,
        bgPosY: 9.7,        
        bgScale: 1.5,
        vignetteStrength:.1,


        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'SLOW JAMZ',
        headlineFamily: 'Atlantis Famingo DEMO VERSION',
        headlineSize: 132,
        headlineHeight: 0.74,
        headColor: '#dcaf09',
        headX: 1.4,
        headY: 55.3,
        headAlign: 'center',
        headItalic: true,

        details: 'Smooth R&B • Neo-Soul • Cocktails\nCouples Welcome\nDress Code: Elegant',
        detailsLineHeight: .68,
        detailsX: 12.9,
        detailsY: 83.8,
        bodyColor: '#D49B44',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 18,

        venue: 'VELVET ROOM',
        venueX: 34.9,
        venueY: 95.2,
        venueColor: '#f7c202',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'LOUNGE',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 40.2,
        head2Y: 92.7,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'Nothing rushed, Everything felt',
        subtagX: 17.7,
        subtagY: 78.3,
        subtagSize: 17,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ffffff',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,
        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
    },
  },
  {
    id: 'disco_mirrorball',
    label: 'Disco — Mirrorball Bloom',
    tags: ['Seasonal', 'Vintage'],
    style: 'vintage',
    bgPrompt: PRESETS.find((p) => p.key === 'disco_mirrorball')!.prompt,
    preview: '/templates/disco_mirrorball.jpg',
    formats: {
      square: {
        headline: 'BOOGIE',
        headlineFamily: 'Galaxia Personal Used',
        headlineSize: 112,
        headlineHeight: 0.8,
        headColor: '#ffc800',
        headX: 5,
        headY: 58.4,
        headAlign: 'center',
        headItalic: true,

        details: 'Funk • Soul • Disco Hits\nBell Bottoms Encouraged\nFree Entry',
        detailsLineHeight: .58,
        detailsX: 21.7,
        detailsY: 82.5,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 18,

        venue: 'STUDIO 54',
        venueX: 7,
        venueY: 10.4,
        venueColor: '#f7c202',
        venueSize: 32,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'WONDER\nLAND',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 72.4,
        head2Y: 11.1,
        head2Family: 'Azonix',
        head2LineHeight: .46,

        subtagEnabled: true,
        subtag: 'dance the night away',
        subtagX: 15.2,
        subtagY: 72.9,
        subtagSize: 29,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ffffff',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'BOOGIE',
        headlineFamily: 'Galaxia Personal Used',
        headlineSize: 102,
        headlineHeight: 0.8,
        headColor: '#ffc800',
        headX: 9.5,
        headY: 76.5,
        headAlign: 'center',
        headItalic: true,

        details: 'Funk • Soul • Disco Hits\nBell Bottoms Encouraged\nFree Entry',
        detailsLineHeight: .7,
        detailsX: 21.7,
        detailsY: 89.4,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 16,

        venue: 'STUDIO 54',
        venueX: 8.1,
        venueY: 5.1,
        venueColor: '#f7c202',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'WONDERLAND',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 61.3,
        head2Y: 5.9,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'dance the night away',
        subtagX: 13.5,
        subtagY: 84,
        subtagSize: 31,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ffffff',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow:false,

        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
    },
  },
  {
    id: 'latin_street_tropical',
    label: 'Latin — Tropical Street',
    tags: ['Latin', 'Tropical'],
    style: 'tropical',
    bgPrompt: PRESETS.find((p) => p.key === 'latin_street_tropical')!.prompt,
    preview: '/templates/latin_street_tropical.jpg',
    formats: {
      square: {
        headline: 'SALSA',
        headlineFamily: 'ChettaVissto',
        headlineSize: 102,
        headlineHeight: 0.8,
        headColor: '#eeff00',
        headX: 5.2,
        headY: 35.4,
        headAlign: 'center',
        headItalic: true,

        details: 'Reggaeton • Salsa • Bachata\nMojitos on Deck\nFree Salsa Lessons 8PM',
        detailsLineHeight: .62,
        detailsX: 7.7,
        detailsY: 68.3,
        bodyColor: '#09f1ed',
        detailsAlign: 'left',
        detailsFamily: 'Azonix',
        detailsSize: 18,


        venue: 'LA FIESTA',
        venueX: 8.2,
        venueY: 81.7,
        venueColor: '#f7c202',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'NOCHE',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 6.5,
        head2Y: 30.7,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'viva la vida',
        subtagX: 4.3,
        subtagY: 49.4,
        subtagSize: 32,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        bgPosX: 11.7,
        bgPosY: 9.9,
        bgScale: 1.5,
        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'SALSA',
        headlineFamily: 'ChettaVissto',
        headlineSize: 128,
        headlineHeight: 0.8,
        headColor: '#eeff00',
        headX: 13.1,
        headY: 63.3,
        headAlign: 'center',
        headItalic: true,

        details: 'Reggaeton • Salsa • Bachata\nMojitos on Deck\nFree Salsa Lessons 8PM',
        detailsLineHeight: .7,
        detailsX: 22,
        detailsY: 75.7,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 18,

        venue: 'LA FIESTA',
        venueX: 42.9,
        venueY: 85.2,
        venueColor: '#f7c202',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'NOCHE',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 8.4,
        head2Y: 4.1,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'viva la vida',
        subtagX: 34.6,
        subtagY: 88.3,
        subtagSize: 28,
        subtagFamily: 'Coolvetica Hv Comp',
        subtagTextColor: '#ffffff',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
    },
  },
  {
    id: 'afrobeat_rooftop',
    label: 'Afrobeat — Golden Rooftop',
    tags: ['Seasonal', 'Tropical'],
    style: 'tropical',
    bgPrompt: PRESETS.find((p) => p.key === 'afrobeat_rooftop')!.prompt,
    preview: '/templates/afrobeat_rooftop.jpg',
    formats: {
      square: {
        headline: 'AFRO\nSUNSET',
        headlineFamily: 'African',
        headlineSize: 78,
        headlineHeight: 0.84,
        headColor: '#eeff00',
        headX: 7.3,
        headY: 32.6,
        headAlign: 'left',
        headItalic: true,

        details: 'Afrobeats • High Life • Hookah\nGolden Hour Vibes\nLadies Free b4 10',
        detailsLineHeight: .64,
        detailsX: 8.1,
        detailsY: 75.8,
        bodyColor: '#09f1ed',
        detailsAlign: 'left',
        detailsFamily: 'Azonix',
        detailsSize: 18,

        details2Enabled: true,
        details2Size: 17,
        details2: 'Golden hour to late night',
        details2X: 8.5,
        details2Y: 88.3,
        details2Color: '#ffffff',
        details2Family: 'LEMONMILK-Light',

        venue: 'SKY BAR',
        venueX: 9.7,
        venueY: 5.5,
        venueColor: '#2febe1',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'SUNDOWN',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 9.9,
        head2Y: 13,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'rhythms of africa',
        subtagX: 5.8,
        subtagY: 56.2,
        subtagSize: 24,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#125450',
        pillAlpha: 0,
        subtagShadow: false,

        bgPosX: 66.5,
        bgPosY: 41.4,
        bgScale: 1.4,
        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'AFRO\nSUNSET',
        headlineFamily: 'African',
        headlineSize: 96,
        headlineHeight: 0.8,
        headColor: '#eeff00',
        headX: 8.3,
        headY: 60.5,
        headAlign: 'left',
        headItalic: true,

        details: 'Afrobeats • High Life • Hookah\nGolden Hour Vibes\nLadies Free b4 10',
        detailsLineHeight: .66,
        detailsX: 9.5,
        detailsY: 83.7,
        bodyColor: '#09f1ed',
        detailsAlign: 'left',
        detailsFamily: 'Azonix',
        detailsSize: 17,

        details2Enabled: true,
        details2Size: 17,
        details2: 'Golden hour to late night',
        details2X: 9.3,
        details2Y: 90.7,
        details2Color: '#ffffff',
        details2Family: 'LEMONMILK-Light',

        venue: 'SKY BAR',
        venueX: 7.9,
        venueY: 9.2,
        venueColor: '#2febe1',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'SUNDOWN',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 66.9,
        head2Y: 10.3,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'rhythms of africa',
        subtagX: 7.1,
        subtagY: 77.8,
        subtagSize: 29,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
    },
  },
  {
    id: 'atlanta',
    label: 'Atlanta — Skyline Nights',
    tags: ['Urban', 'City'],
    style: 'urban',
    bgPrompt: '',
    preview: '/templates/atlanta.jpg',
    formats: {
      square: {
        headline: 'ATL\nNIGHTS',
        headlineFamily: 'Bebas Neue',
        headlineSize: 96,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 32,
        headY: 28,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'SAT • 10 PM\nDJ SETS + DRINKS\n21+ ONLY',
        detailsLineHeight: 0.62,
        detailsX: 33.5,
        detailsY: 70,
        bodyColor: '#dbeafe',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 16,

        venue: 'PEACHTREE ROOFTOP',
        venueX: 25,
        venueY: 82,
        venueColor: '#f7c202',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'ATL\nNIGHTS',
        headlineFamily: 'Bebas Neue',
        headlineSize: 140,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 19.3,
        headY: 28.8,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'SAT • 10 PM\nDJ SETS + DRINKS\n21+ ONLY',
        detailsLineHeight: 0.74,
        detailsX: 33.5,
        detailsY: 70.9,
        bodyColor: '#dbeafe',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 18,

        venue: 'PEACHTREE ROOFTOP',
        venueX: 23.4,
        venueY: 78.3,
        venueColor: '#f7c202',
        venueSize: 30,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 60,
        align: 'center',
        textAlign: 'center',
      },
    },
  },
  {
    id: 'la-lux',
    label: 'LA — Luxe Afterhours',
    tags: ['Luxury', 'Urban'],
    style: 'urban',
    bgPrompt: '',
    preview: '/templates/la-lux.jpg',
    formats: {
      square: {
        headline: 'LA\nLUXE',
        headlineFamily: 'Bebas Neue',
        headlineSize: 98,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 32,
        headY: 28,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'FRI • 11 PM\nLATE NIGHT SET\nGUEST LIST OPEN',
        detailsLineHeight: 0.62,
        detailsX: 33.5,
        detailsY: 70,
        bodyColor: '#e5e7eb',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 16,

        venue: 'SUNSET ROOFTOP',
        venueX: 25,
        venueY: 82,
        venueColor: '#f7c202',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'LA\nLUXE',
        headlineFamily: 'Bebas Neue',
        headlineSize: 140,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 19.3,
        headY: 28.8,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'FRI • 11 PM\nLATE NIGHT SET\nGUEST LIST OPEN',
        detailsLineHeight: 0.74,
        detailsX: 33.5,
        detailsY: 70.9,
        bodyColor: '#e5e7eb',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 18,

        venue: 'SUNSET ROOFTOP',
        venueX: 23.4,
        venueY: 78.3,
        venueColor: '#f7c202',
        venueSize: 30,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 60,
        align: 'center',
        textAlign: 'center',
      },
    },
  },
  {
    id: 'miami2',
    label: 'Miami — Ocean Drive',
    tags: ['Tropical', 'Beach'],
    style: 'tropical',
    bgPrompt: '',
    preview: '/templates/miami2.jpg',
    formats: {
      square: {
        headline: 'MIAMI\nNIGHTS',
        headlineFamily: 'Bebas Neue',
        headlineSize: 96,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 32,
        headY: 28,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'SAT • 9 PM\nTROPICAL HOUSE\nOPEN BAR TILL 10',
        detailsLineHeight: 0.62,
        detailsX: 33.5,
        detailsY: 70,
        bodyColor: '#a5f3fc',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 16,

        venue: 'OCEAN DRIVE',
        venueX: 25,
        venueY: 82,
        venueColor: '#ff7ad9',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'MIAMI\nNIGHTS',
        headlineFamily: 'Bebas Neue',
        headlineSize: 140,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 19.3,
        headY: 28.8,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'SAT • 9 PM\nTROPICAL HOUSE\nOPEN BAR TILL 10',
        detailsLineHeight: 0.74,
        detailsX: 33.5,
        detailsY: 70.9,
        bodyColor: '#a5f3fc',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 18,

        venue: 'OCEAN DRIVE',
        venueX: 23.4,
        venueY: 78.3,
        venueColor: '#ff7ad9',
        venueSize: 30,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 60,
        align: 'center',
        textAlign: 'center',
      },
    },
  },
  {
    id: 'new-york',
    label: 'New York — Midnight City',
    tags: ['Urban', 'City'],
    style: 'urban',
    bgPrompt: '',
    preview: '/templates/new-york.png',
    formats: {
      square: {
        headline: 'NYC\nMIDNIGHT',
        headlineFamily: 'Bebas Neue',
        headlineSize: 92,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 32,
        headY: 28,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'FRI • 10 PM\nCITY LIGHTS\nVIP TABLES',
        detailsLineHeight: 0.62,
        detailsX: 33.5,
        detailsY: 70,
        bodyColor: '#dbeafe',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 16,

        venue: 'SOHO LOUNGE',
        venueX: 25,
        venueY: 82,
        venueColor: '#90cdf4',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'NYC\nMIDNIGHT',
        headlineFamily: 'Bebas Neue',
        headlineSize: 134,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 19.3,
        headY: 28.8,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'FRI • 10 PM\nCITY LIGHTS\nVIP TABLES',
        detailsLineHeight: 0.74,
        detailsX: 33.5,
        detailsY: 70.9,
        bodyColor: '#dbeafe',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 18,

        venue: 'SOHO LOUNGE',
        venueX: 23.4,
        venueY: 78.3,
        venueColor: '#90cdf4',
        venueSize: 30,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 60,
        align: 'center',
        textAlign: 'center',
      },
    },
  },
  {
    id: 'techno_warehouse',
    label: 'Techno — Industrial Fog',
    tags: ['Techno', 'Urban'],
    style: 'urban',
    bgPrompt: PRESETS.find((p) => p.key === 'techno_warehouse')!.prompt,
    preview: '/templates/techno_warehouse.jpg',
    formats: {
      square: {
        headline: 'SYSTEM',
        headlineFamily: 'Designer',
        headlineSize: 102,
        headlineHeight: 0.8,
        headColor: '#eeff00',
        headX: 3.8,
        headY: 43.1,
        headAlign: 'center',
        headItalic: true,

        details: 'Industrial Techno • Acid • Minimal\nStrictly No Cameras\nLocation: TBA',
        detailsLineHeight: .7,
        detailsX: 11.8,
        detailsY: 81.8,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 18,

        venue: 'SEKTOR 7',
        venueX: 6.3,
        venueY: 36.2,
        venueColor: '#f7c202',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'ERROR',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 78,
        head2X: 41.2,
        head2Y: 57.9,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'lost in the sound',
        subtagX: 27,
        subtagY: 74.8,
        subtagSize: 19,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        bgPosX: 43,
        bgPosY: 35.2,
        bgScale: 1.3,
        vignetteStrength:.1,

        textColWidth: 70,
        align: 'center',
        textAlign: 'center',
      },
      story: {
        headline: 'SYSTEM',
        headlineFamily: 'Designer',
        headlineSize: 102,
        headlineHeight: 0.8,
        headColor: '#eeff00',
        headX: 4.3,
        headY: 60.1,
        headAlign: 'center',
        headItalic: true,

        details: 'Industrial Techno • Acid • Minimal\nStrictly No Cameras\nLocation: TBA',
        detailsLineHeight: .7,
        detailsX: 13.8,
        detailsY: 85.3,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 18,

        venue: 'SEKTOR 7',
        venueX: 38.1,
        venueY: 8.7,
        venueColor: '#f7c202',
        venueSize: 41,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'ERROR',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 92,
        head2X: 19.5,
        head2Y: 68.9,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'lost in the sound',
        subtagX: 27.4,
        subtagY: 80.6,
        subtagSize: 22,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: false,

        vignetteStrength:.1,

        textColWidth: 80,
        align: 'center',
        textAlign: 'center',

      },
    },
  },
  {
    id: 'mardi_gras',
    label: 'Mardi Gras — Purple & Gold',
    tags: ['Mardi Gras', 'Festival', 'Party'],
    style: 'tropical',
    bgPrompt: '',
    preview: '/templates/mardi_gras.jpg',
    formats: {
      square: {
        backgroundUrl: '/templates/mardi_gras.jpg',
        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1,
        vignette: true,
        vignetteStrength: 0.25,

        // Library items (emoji / stickers / flares)
        // Add more here to preload Library assets with the template.
        emojiList: [
          {
            id: 'mgr_confetti_sq',
            kind: 'emoji',
            char: '🎉',
            x: 18,
            y: 22,
            scale: 0.28,
            rotation: -10,
            opacity: 1,
            locked: false,
          },
          {
            id: 'mgr_mask_sq',
            kind: 'emoji',
            char: '🎭',
            x: 82,
            y: 68,
            scale: 0.26,
            rotation: 8,
            opacity: 1,
            locked: false,
          },
          {
            id: 'mgr_flare_sq',
            kind: 'flare',
            char: '',
            url: '/flares/flare01.png',
            isFlare: true,
            blendMode: 'screen',
            x: 72,
            y: 30,
            scale: 1.4,
            rotation: 0,
            opacity: 0.85,
            locked: false,
          },
        ],

        headline: 'MARDI\nGRAS',
        headlineFamily: 'Bebas Neue',
        headlineSize: 110,
        headlineHeight: 0.9,
        headColor: '#f7c202',
        headX: 8,
        headY: 16,
        headAlign: 'left',
        headShadow: true,
        headShadowStrength: 0.35,

        head2Enabled: true,
        head2line: 'CARNIVAL EDITION',
        head2Family: 'Nexa-Heavy',
        head2Color: '#00c08a',
        head2Size: 28,
        head2X: 8,
        head2Y: 43,
        head2Align: 'left',
        head2Shadow: true,
        head2ShadowStrength: 0.25,

        details: 'FEB 25 • 9 PM\nCOSTUMES WELCOME\nOPEN BAR',
        detailsFamily: 'Inter',
        detailsSize: 18,
        detailsLineHeight: 0.75,
        detailsColor: '#e5e7eb',
        detailsX: 8,
        detailsY: 58,
        detailsAlign: 'left',
        detailsShadow: true,
        detailsShadowStrength: 0.25,

        venue: 'BOURBON LOUNGE',
        venueFamily: 'LEMONMILK-Light',
        venueColor: '#c084fc',
        venueSize: 30,
        venueX: 8,
        venueY: 73,
        venueAlign: 'left',
        venueShadow: true,
        venueShadowStrength: 0.3,

        subtagEnabled: true,
        subtag: 'NEW ORLEANS',
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        subtagBgColor: '#111827',
        subtagAlpha: 0.7,
        subtagX: 8,
        subtagY: 85,
        subtagSize: 18,
        subtagShadow: false,

        textColWidth: 70,
        align: 'left',
        textAlign: 'left',
      },
      story: {
        backgroundUrl: '/templates/mardi_gras.jpg',
        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.05,
        vignette: true,
        vignetteStrength: 0.28,

        emojiList: [
          {
            id: 'mgr_confetti_st',
            kind: 'emoji',
            char: '🎉',
            x: 20,
            y: 24,
            scale: 0.30,
            rotation: -12,
            opacity: 1,
            locked: false,
          },
          {
            id: 'mgr_mask_st',
            kind: 'emoji',
            char: '🎭',
            x: 80,
            y: 64,
            scale: 0.28,
            rotation: 6,
            opacity: 1,
            locked: false,
          },
          {
            id: 'mgr_flare_st',
            kind: 'flare',
            char: '',
            url: '/flares/flare01.png',
            isFlare: true,
            blendMode: 'screen',
            x: 70,
            y: 28,
            scale: 1.5,
            rotation: 0,
            opacity: 0.85,
            locked: false,
          },
        ],

        headline: 'MARDI\nGRAS',
        headlineFamily: 'Bebas Neue',
        headlineSize: 150,
        headlineHeight: 0.9,
        headColor: '#f7c202',
        headX: 10,
        headY: 14,
        headAlign: 'left',
        headShadow: true,
        headShadowStrength: 0.35,

        head2Enabled: true,
        head2line: 'CARNIVAL EDITION',
        head2Family: 'Nexa-Heavy',
        head2Color: '#00c08a',
        head2Size: 32,
        head2X: 10,
        head2Y: 37,
        head2Align: 'left',
        head2Shadow: true,
        head2ShadowStrength: 0.25,

        details: 'FEB 25 • 9 PM\nCOSTUMES WELCOME\nOPEN BAR',
        detailsFamily: 'Inter',
        detailsSize: 20,
        detailsLineHeight: 0.82,
        detailsColor: '#e5e7eb',
        detailsX: 10,
        detailsY: 52,
        detailsAlign: 'left',
        detailsShadow: true,
        detailsShadowStrength: 0.25,

        venue: 'BOURBON LOUNGE',
        venueFamily: 'LEMONMILK-Light',
        venueColor: '#c084fc',
        venueSize: 34,
        venueX: 10,
        venueY: 70,
        venueAlign: 'left',
        venueShadow: true,
        venueShadowStrength: 0.3,

        subtagEnabled: true,
        subtag: 'NEW ORLEANS',
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        subtagBgColor: '#111827',
        subtagAlpha: 0.7,
        subtagX: 10,
        subtagY: 82,
        subtagSize: 18,
        subtagShadow: false,

        textColWidth: 76,
        align: 'left',
        textAlign: 'left',
      },
    },
  },
];
