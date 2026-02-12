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
  {
    id: "graphic_hookah_sq",
    kind: "flare",
    char: "",
    svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah,
    iconColor: "#ffffff",
    isFlare: true,
    isSticker: true,
    blendMode: "normal",
    x: 10,
    y: 88,
    scale: 0.3,
    rotation: 0,
    opacity: 1,
    tint: 0,
    locked: false,
  },
  {
    id: "graphic_bottle_service_sq",
    kind: "flare",
    char: "",
    svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle,
    iconColor: "#ffffff",
    isFlare: true,
    isSticker: true,
    blendMode: "normal",
    x: 24,
    y: 88,
    scale: 0.28,
    rotation: 0,
    opacity: 1,
    tint: 0,
    locked: false,
  },
  {
    id: "graphic_bucket_deals_sq",
    kind: "flare",
    char: "",
    svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bucket,
    iconColor: "#ffffff",
    isFlare: true,
    isSticker: true,
    blendMode: "normal",
    x: 38,
    y: 88,
    scale: 0.28,
    rotation: 0,
    opacity: 1,
    tint: 0,
    locked: false,
  },
  {
    id: "graphic_drink_specials_sq",
    kind: "flare",
    char: "",
    svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink,
    iconColor: "#ffffff",
    isFlare: true,
    isSticker: true,
    blendMode: "normal",
    x: 52,
    y: 88,
    scale: 0.28,
    rotation: 0,
    opacity: 1,
    tint: 0,
    locked: false,
  },
  {
    id: "graphic_venue_sq",
    kind: "flare",
    char: "",
    svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue,
    iconColor: "#ffffff",
    isFlare: true,
    isSticker: true,
    blendMode: "normal",
    x: 66,
    y: 88,
    scale: 0.24,
    rotation: 0,
    opacity: 1,
    tint: 0,
    locked: false,
  },
  {
    id: "graphic_music_sq",
    kind: "flare",
    char: "",
    svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.music,
    iconColor: "#ffffff",
    isFlare: true,
    isSticker: true,
    blendMode: "normal",
    x: 80,
    y: 88,
    scale: 0.28,
    rotation: 0,
    opacity: 1,
    tint: 0,
    locked: false,
  },
  {
    id: "graphic_time_sq",
    kind: "flare",
    char: "",
    svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.time,
    iconColor: "#ffffff",
    isFlare: true,
    isSticker: true,
    blendMode: "normal",
    x: 90,
    y: 88,
    scale: 0.28,
    rotation: 0,
    opacity: 1,
    tint: 0,
    locked: false,
  },
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
  bgRotate?: number;
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
        headX: 7.8,
        headY: 13.3,
        headAlign: 'center',
        headShadow: false,
        headGradient: false,

        details: 'SAT • 10 PM\nDRESS CODE: WHITE\nRSVP REQUIRED',
        detailsLineHeight: .6,
        detailsX: 7.7,
        detailsY: 53.7,
        bodyColor: '#222222',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsShadow: false,

        details2Enabled: true,
        details2: 'Drink specials     Bottle Service',
        details2X: 5,
        details2Y: 82.8,
        details2Size: 19,
        details2Color: '#333333',
        details2Family: 'bebas neue',
        details2Align: 'center',
        details2Shadow: false,

        venue: 'THE ROOFTOP',
        venueX: 6.8,
        venueY: 66.1,
        venueColor: '#333333',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: false,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 6.4,
        bgPosY: 29.9,
        bgScale: 1.9,
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
            x: 25.2,
            y: 47.6,
            scale: 0.41,
            rotation: 0,
            opacity: 1,
            locked: false,
            tint: 0,
          },
          { id: "graphic_drink_specials_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
            iconColor: "#333333", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 15.1, 
            y: 78.2, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
          },
          { id: "graphic_bottle_service_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
            iconColor: "#333333", isFlare: true, isSticker: true, 
            blendMode: "normal", 
            x: 32.5, 
            y: 78.3, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
          },
         
        ],
        
      },
      story: {
        headline: 'WHITE\nNIGHT',
        headlineFamily: 'Bebas Neue',
        headlineSize: 176,
        headlineHeight: .9,
        headColor: '#111111',
        headX: 17.3,
        headY: 37,
        headAlign: 'center',
        headShadow: false,
        headGradient: false,

        details: 'SAT • 10 PM\nDRESS CODE: WHITE\nRSVP REQUIRED',
        detailsLineHeight: .74,
        detailsX: 33.5,
        detailsY: 74.6,
        bodyColor: '#222222',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsShadow: false,

        details2Enabled: true,
        details2: 'Drink specials     Bottle Service',
        details2X: 31.6,
        details2Y: 95.9,
        details2Size: 19,
        details2Color: '#333333',
        details2Family: 'bebas neue',
        details2Align: 'center',
        details2Shadow: false,

        venue: 'THE ROOFTOP CLUB',
        venueX: 23.2,
        venueY: 81.8,
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
            x: 50.,
            y: 70.9,
            scale: 0.80,
            rotation: 0,
            opacity: 1,
            locked: false,
            tint: 0,
          },
           { id: "graphic_drink_specials_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
            iconColor: "#333333", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 41.1, 
            y: 93.3, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
          },
          { id: "graphic_bottle_service_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
            iconColor: "#333333", isFlare: true, isSticker: true, 
            blendMode: "normal", 
            x: 59.5, 
            y: 93.4, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
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
        headX: 4.7,
        headY: 65.6,
        headAlign: 'center',
        headItalic: false,
        headShadow: true,
        headShadowStrength: 3,
        headGradient: false,

        details: 'Trance • House • Techno\nDoors 10PM - 4AM\nLASERS • CO2 • VISUALS',
        detailsLineHeight: .7,
        detailsX: 25.1,
        detailsY: 85.4,
        bodyColor: '#fdf1de',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsShadow: true,
        detailsShadowStrength: .7,

        venue: 'THE UNDERGROUND',
        venueX: 32.0,
        venueY: 12.4,
        venueColor: '#fdbc00',
        venueSize: 34,
        venueFamily: 'Bebas Neue',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'SEASON OPENER',
        head2Color: '#f9f6f8',
        head2Align: 'center',
        head2Size: 58,
        head2X: 23.3,
        head2Y: 3.5,
        head2Family: 'Bebas Neue',
        head2Shadow: true,
        head2ShadowStrength: 1,

        subtagEnabled: false,
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
        bgScale: 1.1,
        vignetteStrength: .02,

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
        headX: 15,
        headY: 53.8,
        headAlign: 'center',
        headItalic: false,
        headShadow: true,
        headShadowStrength: 3,

        details: 'Trance • House • Techno\nDoors 10PM - 4AM\nLASERS • CO2 • VISUALS',
        detailsLineHeight: .64,
        detailsX: 18.9,
        detailsY: 87.1,
        bodyColor: '#fbf4e1',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 20,
        detailsShadow: true,
        detailsShadowStrength: 1,

        details2Enabled: true,
        details2: '21+ Event',
        details2Family: 'Inter',
        details2X: 35.6,
        details2Y: 94.4,
        details2Size: 36,
        details2LineHeight: 1.2,
        details2LetterSpacing: 0,
        details2Color: '#f2af00',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'THE UNDERGROUND',
        venueX: 32.5,
        venueY: 10.2,
        venueColor: '#ffbc00',
        venueSize: 33,
        venueFamily: 'Bebas Neue',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'SEASON OPENER',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 52,
        head2X: 26,
        head2Y: 5.6,
        head2Family: 'Bebas Neue',
        head2Shadow: true,
        head2ShadowStrength: 1,

        subtagEnabled: false,
        subtag: 'the drop waits for no one',
        subtagX: 27.1,
        subtagY: 5.6,
        subtagSize: 18,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#fcbc00',
        subtagBgColor: '#3e3c3d',
        subtagShadow: true,
        subtagShadowStrength: 1,
        subtagAlpha: 1,

        bgPosX: 51.5,
        bgPosY: 65.6,
        vignette: true,
        bgScale: 1.1,
        vignetteStrength:.02,

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
        headX: 10.4,
        headY: 35.9,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'Special Guest DJ\nPyrotechnics + Cryo\nDoors Open 9PM',
        detailsLineHeight: .82,
        detailsX: 51.4,
        detailsY: 82.2,
        bodyColor: '#00F2F2',
        detailsAlign: "left",
        detailsFamily: 'Azonix',
        detailsShadow: true,
        detailsShadowStrength: 1,
        

        venue: 'ARENA CLUB',
        venueX: 14.1,
        venueY: 81.1,
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
        head2X: 15.9,
        head2Y: 90.2,
        head2Family: 'Azonix',
        head2Shadow: true,
        head2ShadowStrength: 1.4,

        subtagEnabled: true,
        subtag: 'live the moment',
        subtagX: 32.5,
        subtagY: 25,
        subtagSize: 15,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#FFFFFF',
        subtagShadow: false,
        subtagShadowStrength: 1,
        subtagBgColor: '#FF00FF',
        subtagAlpha: 0.8,

        bgPosX: 67.1,
        bgPosY: 81.9,
        bgScale: 1.2,

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
        headX: 5.9,
        headY: 10.7,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'Special Guest DJ\nPyrotechnics + Cryo\nDoors Open 9PM',
        detailsLineHeight: 0.62,
        detailsX: 21.8,
        detailsY: 85.8,
        bodyColor: '#00F2F2',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 23,

        venue: 'ARENA CLUB',
        venueX: 32.9,
        venueY: 80,
        venueColor: '#FF00FF',
        venueSize: 45,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'FESTIVAL',
        head2Color: '#FF00FF',
        head2Align: 'center',
        head2Size: 90,
        head2X: 5.5,
        head2Y: 36.5,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'live the moment',
        subtagX: 27.8,
        subtagY: 3.8,
        subtagSize: 23,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#FFFFFF',
        subtagBgColor: '#FF00FF',
        subtagShadow: false,
        
        vignetteStrength:.06,

        details2Enabled: true,
        details2: 'Get Tickets Now',
        details2X: 32,
        details2Y: 94,
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
        detailsX: 31.5,
        detailsY: 17,
        bodyColor: '#ebfb04',
        detailsAlign: 'center',
        detailsFamily: 'lemonmilk-light',
        detailsSize: 12,

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
        head2X: 21,
        head2Y: 67,
        head2Family: 'Azonix',
        head2TrackEm: .15,

        details2Enabled: true,
        details2: 'drink specials     bottle service     hookah',
        details2X: 23.2,
        details2Y: 92.1,
        details2Size: 12,
        details2Color: '#ffffff',
        details2Family: 'lemonmilk-light',
        details2Align: 'center',
        details2Shadow: true,
        details2ShadowStrength: 1,  

        subtagEnabled: false,
        subtag: 'shine bright tonight',
        subtagX: 30.5,
        subtagY: 16.4,
        subtagSize: 15,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ebfb04',
        subtagBgColor: '#ffffff',

        vignetteStrength: .1,

        textColWidth: 70,
        align: 'center',
        headItalic: false,
        textAlign: 'center',

         emojiList: [
          { id: "graphic_drink_specials_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
            iconColor: "#f0df00", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 33, 
            y: 87.1, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
          },
          { id: "graphic_bottle_service_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
            iconColor: "#f0df00", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 52.9, 
            y: 87.1, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
          },
          { id: "graphic_hookah_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah, 
            iconColor: "#f0df00", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 71.8, 
            y: 87.1, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
          },
          {
            id: 'wm_confetti_sq',
            kind: 'emoji',
            char: '💋',
            x: 84.6,
            y: 69.8,
            scale: 1.51,
            rotation: 0,
            opacity: 1,
            locked: false,
            tint: 0,
          },
        ],
      },
      story: {
        headline: 'LADIES',
        headlineFamily: 'Doctor Glitch',
        headlineSize: 122,
        headlineHeight: 0.29,
        headColor: '#f1099c',
        headX: 7.2,
        headY: 63.3,
        headAlign: 'center',
        headShadowStrength: .9,

        details: 'Free Entry Before 11PM\nComplimentary Champagne\nDress to Impress',
        detailsLineHeight: .7,
        detailsX: 28.4,
        detailsY: 91,
        bodyColor: '#ebfb04',
        detailsAlign: 'center',
        detailsFamily: 'lemonmilk-light',
        detailsSize: 14,

        venue: 'CHROME LOUNGE',
        venueX: 29.8,
        venueY: 10,
        venueColor: '#FFFFFF',
        venueSize: 45,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'NIGHT',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 84,
        head2X: 19.5,
        head2Y: 71.7,
        head2Family: 'Azonix',
        head2TrackEm: .15,

        subtagEnabled: true,
        subtag: 'shine bright tonight',
        subtagX: 26.3,
        subtagY: 14.8,
        subtagSize: 19,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ebfb04',
        subtagBgColor: '#f1099c',
        subtagShadow: false,

        details2Enabled: true,
        details2: 'drink specials     bottle service     hookah',
        details2X: 23.2,
        details2Y: 88.1,
        details2Size: 12,
        details2Color: '#ffffff',
        details2Family: 'lemonmilk-light',
        details2Align: 'center',
        details2Shadow: true,
        details2ShadowStrength: 1,

        bgPosX: 50,
        bgPosY: 54.8,
        bgScale: 1,
        vignette: true,

        vignetteStrength: .1,

        headItalic: false,
        textAlign: 'center',

         emojiList: [
          { id: "graphic_drink_specials_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
            iconColor: "#f0df00", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 31.8, 
            y: 85.7, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
          },
          { id: "graphic_bottle_service_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
            iconColor: "#f0df00", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 51.7, 
            y: 85.7, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
          },
          { id: "graphic_hookah_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah, 
            iconColor: "#f0df00", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 71.1, 
            y: 85.7, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false 
          },
         {
            id: 'wm_confetti_sq',
            kind: 'emoji',
            char: '💋',
            x: 85.3,
            y: 74.2,
            scale: 1.51,
            rotation: 0,
            opacity: 1,
            locked: false,
            tint: 0,
          },
        ],
      },
    },
  },
  {
    id: 'kpop_pastel_led',
    label: 'Mojito — Lemon Mint',
    tags: ['College', 'Neon'],
    style: 'neon',
    bgPrompt: PRESETS.find((p) => p.key === 'kpop_pastel_led')!.prompt,
    preview: '/templates/kpop_pastel_led.jpg',
    formats: {
      square: {
        headline: 'MOJITO',
        headlineFamily: 'Dune_Rise',
        headlineSize: 90,
        headlineLineHeight: 0.64,
        headColor: '#07f702',
        headX: 7.6,
        headY: 12.2,
        textAlign: 'center',
        headItalic: false,
        headShadow: true,
        headShadowStrength: 1,

        details: 'Fresh mint, cold rum,\nand the perfect\nMonday reset.',
        detailsLineHeight: .6,
        detailsX: 8.8,
        detailsY: 43.8,
        bodyColor: '#ffffff',
        detailsAlign: 'left',
        detailsFamily: 'Azonix',
        detailsSize: 13,

        venue: 'SEOUL VIBES',
        venueX: 8.8,
        venueY: 52.7,
        venueColor: '#f7c202',
        venueSize: 45,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'Monday',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 48,
        head2X: 8.8,
        head2Y: 27.2,
        head2Family: 'Azonix',
        head2TrackEm: .15,

        subtagEnabled: false,
        subtag: 'One night. All idols!',
        subtagX: 17.4,
        subtagY: 54.3,
        subtagSize: 28,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#28efe5',
        subtagBgColor: '#041a3e',
        pillAlpha: 0.7,
        subtagShadow: false,

        vignetteStrength:.04,
        bgPosX: 10.2,
        bgPosY: 0,
        bgScale: 1.2,
        vignette: true,

         emojiList: [
          { id: "graphic_drink_specials_sq", 
            kind: "flare", char: "Mojito Specials", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
            iconColor: "#2d863b", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 14.4, 
            y: 76.1, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false,
            labelBg:false,
            labelColor: "#2d863b",
          },
          { id: "graphic_bottle_service_sq", 
            kind: "flare", char: "bottle service", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
            iconColor: "#2d863b", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 30.4, 
            y: 76.1, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false, 
            labelBg:false,
            labelColor: "#2d863b",
          },
        ],

        textColWidth: 70,
        align: 'center',
      },
      story: {
        headline: 'MOJITO',
        headlineFamily: 'Dune_Rise',
        headlineSize: 90,
        headlineLineHeight: 0.64,
        headColor: '#07f702',
        headX: 5.2,
        headY: 8.6,
        textAlign: 'center',
        headItalic: false,
        headShadow: true,
        headShadowStrength: 1,

        details: 'Fresh mint, cold rum,\nand the perfect\nMonday reset.',
        detailsLineHeight: .6,
        detailsX: 6.8,
        detailsY: 23,
        bodyColor: '#ffffff',
        detailsAlign: 'left',
        detailsFamily: 'Azonix',
        detailsSize: 13,

        venue: 'SEOUL VIBES',
        venueX: 6.8,
        venueY: 92,
        venueColor: '#f7c202',
        venueSize: 45,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'Monday',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 48,
        head2X: 6.8,
        head2Y: 17.3,
        head2Family: 'Azonix',
        head2TrackEm: .15,

        subtagEnabled: false,
        subtag: 'One night. All idols!',
        subtagX: 17.4,
        subtagY: 54.3,
        subtagSize: 28,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#28efe5',
        subtagBgColor: '#041a3e',
        pillAlpha: 0.7,
        subtagShadow: false,

        vignetteStrength:.04,
        bgPosX: 55.1,
        bgPosY: 39.6,
        bgScale: 1.1,
        vignette: true,

         emojiList: [
          { id: "graphic_drink_specials_sq", 
            kind: "flare", char: "Mojito Specials", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
            iconColor: "#2d863b", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 14.6, 
            y: 85.2, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false,
            labelBg:false,
            labelColor: "#2d863b",
          },
          { id: "graphic_bottle_service_sq", 
            kind: "flare", char: "bottle service", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
            iconColor: "#2d863b", 
            isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 30.9, 
            y: 85.2, 
            scale: 0.43, 
            rotation: 0, 
            opacity: 1, 
            tint: 0,
            locked: false, 
            labelBg:false,
            labelColor: "#2d863b",
          },
        ],

        textColWidth: 70,
        align: 'center',
      },
    },
  },
  {
    id: 'hiphop_graffiti',
    label: 'Hip Hop Block Party',
    tags: ['Hip-Hop', 'Urban'],
    style: 'urban',
    bgPrompt: PRESETS.find((p) => p.key === 'hiphop_graffiti')!.prompt,
    preview: '/templates/hiphop_graffiti.jpg',
    formats: {
      square: {
        headline: 'THE\nBLOCK\nIS HOT',
        headlineFamily: 'Designer',
        headlineSize: 84,
        headlineLineHeight: .68,
        headColor: '#ffffff',
        headX: 9.2,
        headY: 32.3,
        headAlign: 'left',
        headItalic: true,
        headShadow: true,
        headShadowStrength: 1,

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
        subtag: 'Pull up! vibe!',
        subtagX: 6.9,
        subtagY: 23.2,
        subtagSize: 26,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: true,
        subtagShadowStrength: 1,

        bgPosX: 49,
        bgPosY: 71.8,
        bgScale: 1.7,
        bgRotate: -16,
        vignette: false,
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
        headShadow: true,
        headShadowStrength: 1,

        details: 'Good vibes only.\nBring your crew,\nwe’ll bring the noise',
        detailsLineHeight: .6,
        detailsX: 24.7,
        detailsY: 86.6,
        bodyColor: '#f7c025',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 20,
        detailsShadow: true,
        detailsShadowStrength: 1,

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
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'LIVE DJ X ARTISTE',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 27.2,
        head2Y: 81,
        head2Family: 'Azonix',
        head2Shadow: true,
        head2ShadowStrength: 1,

        subtagEnabled: true,
        subtag: 'Pull up! vibe!',
        subtagX: 32.8,
        subtagY: 92.9,
        subtagSize: 29,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#ffffff',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: true,
        subtagShadowStrength: 1,

        bgPosX: 80.1,
        bgPosY: 50.7,
        bgScale: 1.2,
        bgRotate: -15,
        vignette: false,
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
        headX: 16.8,
        headY: 23.1,
        headAlign: 'center',
        headItalic: true,
        headShadow: true,
        headShadowStrength: 1,

        details: 'G-Funk • Lowriders • BBQ\nSunday Service\nDoors 2PM',
        detailsLineHeight: .52,
        detailsX: 18.8,
        detailsY: 74.4,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 20,

        venue: 'SUNSET BLVD',
        venueX: 44.3,
        venueY: 58.2,
        venueColor: '#f7c202',
        venueSize: 38,
        venueFamily: 'Bebas Neue',

        head2Enabled: true,
        head2line: 'CRUISING',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 38,
        head2X: 27.7,
        head2Y: 87.3,
        head2Family: 'Azonix',

        subtagEnabled: true,
        subtag: 'california love',
        subtagX: 24.9,
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
        headShadow: true,
        headShadowStrength: 1,

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
        headShadow: true,
        headShadowStrength: 1,

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
        headX: 5.5,
        headY: 37.2,
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
        headX: 11.2,
        headY: 63.3,
        headAlign: 'center',
        headItalic: true,

        details: 'Reggaeton • Salsa • Bachata\nMojitos on Deck\nFree Salsa Lessons 8PM',
        detailsLineHeight: .7,
        detailsX: 18.3,
        detailsY: 74.5,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 18,

        venue: 'LA FIESTA',
        venueX: 39,
        venueY: 82.5,
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
        subtagX: 76.8,
        subtagY: 3,
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
        headX: 7.5,
        headY: 27.2,
        headAlign: 'left',
        headItalic: true,
        headShadow: true,
        headShadowStrength: 1,

        details: 'Afrobeats • High Life • Hookah\nGolden Hour Vibes\nLadies Free b4 10',
        detailsLineHeight: .64,
        detailsX: 8.1,
        detailsY: 75.8,
        bodyColor: '#09f1ed',
        detailsAlign: 'left',
        detailsFamily: 'Azonix',
        detailsSize: 18,
        detailsShadow: true,
        detailsShadowStrength: 1,

        details2Enabled: true,
        details2Size: 17,
        details2: 'Golden hour to late night',
        details2X: 8.5,
        details2Y: 88.3,
        details2Color: '#ffffff',
        details2Family: 'LEMONMILK-Light',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'SKY BAR',
        venueX: 9.7,
        venueY: 5.5,
        venueColor: '#2febe1',
        venueSize: 41,
        venueFamily: 'Bebas Neue',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'SUNDOWN',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 9.9,
        head2Y: 13,
        head2Family: 'Azonix',
        head2Shadow: true,
        head2ShadowStrength: 1,

        subtagEnabled: true,
        subtag: 'rhythms of africa',
        subtagX: 5.8,
        subtagY: 56.2,
        subtagSize: 24,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#125450',
        pillAlpha: 0,
        subtagShadow: true,
        subtagShadowStrength: 1,

        bgPosX: 44.8,
        bgPosY: 35.6,
        bgScale: 1.6,
        bgRotate: -32,
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
        headX: 14.2,
        headY: 60.5,
        headAlign: 'center',
        headItalic: true,
        headShadow: true,
        headShadowStrength: 1,

        details: 'Afrobeats • High Life • Hookah\nGolden Hour Vibes\nLadies Free b4 10',
        detailsLineHeight: .66,
        detailsX: 17.3,
        detailsY: 83.7,
        bodyColor: '#09f1ed',
        detailsAlign: 'center',
        detailsFamily: 'Azonix',
        detailsSize: 17,
        detailsShadow: true,
        detailsShadowStrength: 1,

        details2Enabled: true,
        details2Size: 17,
        details2: 'Golden hour to late night',
        details2X: 25.1,
        details2Y: 90.7,
        details2Color: '#ffffff',
        details2Family: 'LEMONMILK-Light',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'SKY BAR',
        venueX: 7.9,
        venueY: 9.2,
        venueColor: '#2febe1',
        venueSize: 41,
        venueFamily: 'Bebas Neue',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'SUNDOWN',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 24,
        head2X: 66.9,
        head2Y: 10.3,
        head2Family: 'Azonix',
        head2Shadow: true,
        head2ShadowStrength: 1,

        subtagEnabled: true,
        subtag: 'rhythms of africa',
        subtagX: 18.2,
        subtagY: 77.8,
        subtagSize: 29,
        subtagFamily: 'Nexa-Heavy',
        subtagTextColor: '#f7c202',
        pillColor: '#131314',
        pillAlpha: 0,
        subtagShadow: true,
        subtagShadowStrength: 1,

        bgPosX: 87.1,
        bgPosY: 68.7,
        bgScale: 1,
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
        headline: 'THE\nIN',
        headlineFamily: 'Bebas Neue',
        headlineSize: 96,
        headlineHeight: 0.76,
        headColor: '#ffffff',
        headX: 20.6,
        headY: 16.3,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'SAT • 10 PM\nDJ SETS + DRINKS\n21+ ONLY',
        detailsLineHeight: 0.62,
        detailsX: 16.8,
        detailsY: 60.7,
        bodyColor: '#dbeafe',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 16,

        venue: 'PEACHTREE ROOFTOP',
        venueX: 15.9,
        venueY: 80.3,
        venueColor: '#f7c202',
        venueSize: 15,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'CROWD',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 64,
        head2X: 10.4,
        head2Y: 47,
        head2Family: 'chettaVissto',
        head2Shadow: true,
        head2ShadowStrength: 1,

        subtagEnabled: false,

        bgPosX: 9.6,
        bgPosY: 5.2,
        bgScale: 1.6,
        vignette: true,
        vignetteStrength: 0.04,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [
          { id: "graphic_venue_sq", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
            iconColor: "#ffffff", isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 31.2, y: 76.3, scale: 0.28, 
            rotation: 0, opacity: 1, locked: false,
            tint: 0,
          },
          {
            id: 'mgr_flare_sq_1',
            kind: 'flare',
            char: '',
            url: '/flares/flare02.png',
            isFlare: true,
            blendMode: 'screen',
            x: -23.9,
            y: 11,
            scale: .8,
            rotation: 0,
            opacity: 0.85,
            tint: 0,
            locked: true,
          },
           {
            id: 'mgr_flare_sq_2',
            kind: 'flare',
            char: '',
            url: '/flares/flare02.png',
            isFlare: true,
            blendMode: 'screen',
            x: 155.3,
            y: 24.5,
            scale: 0.8,
            rotation: 0,
            opacity: 0.85,
            tint: 0,
            locked: true,
          },
           {
            id: 'mgr_flare_sq_3',
            kind: 'flare',
            char: '',
            url: '/flares/sun01.png',
            isFlare: true,
            blendMode: 'screen',
            x: 35.6,
            y: 124.4,
            scale: .4,
            rotation: 0,
            opacity: 0.85,
            tint: 0,
            locked: true,
          },
        ],
      },
      story: {
        headline: 'THE\nIN',
        headlineFamily: 'Bebas Neue',
        headlineSize: 140,
        headlineHeight: 0.76,
        headColor: '#ffffff',
        headX: 34.5,
        headY: 38.3,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'SAT • 10 PM\nDJ SETS + DRINKS\n21+ ONLY',
        detailsLineHeight: 0.74,
        detailsX: 34.1,
        detailsY: 69,
        bodyColor: '#dbeafe',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 18,
        detailsShadow: true,
        detailsShadowStrength: 1,

        venue: 'PEACHTREE ROOFTOP',
        venueX: 18.7,
        venueY: 89.9,
        venueColor: '#f7c202',
        venueSize: 30,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: true,
        head2line: 'CROWD',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 102,
        head2X: 13.5,
        head2Y: 59.1,
        head2Family: 'chettaVissto',
        head2Shadow: true,
        head2ShadowStrength: 1,

        subtagEnabled: false,

        bgPosX: 51.5,
        bgPosY: 23,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 60,
        align: 'center',
        textAlign: 'center',

        emojiList: [
          { id: "graphic_venue_st", 
            kind: "flare", char: "", 
            svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
            iconColor: "#ffffff", isFlare: true, 
            isSticker: true, 
            blendMode: "normal", 
            x: 50, y: 87.1, scale: 0.43, 
            rotation: 0, opacity: 1, locked: false,
            tint: 0,
          },
          {
            id: 'mgr_flare_st_1',
            kind: 'flare',
            char: '',
            url: '/flares/flare02.png',
            isFlare: true,
            blendMode: 'screen',
            x: -31.5,
            y: 16.4,
            scale: .8,
            rotation: 0,
            opacity: 0.85,
            tint: 0,
            locked: true,
          },
           {
            id: 'mgr_flare_st_3',
            kind: 'flare',
            char: '',
            url: '/flares/sun01.png',
            isFlare: true,
            blendMode: 'screen',
            x: 49.4,
            y: 118,
            scale: .5,
            rotation: 0,
            opacity: 0.85,
            tint: 0,
            locked: true,
          },
        ],
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
        headline: 'DJ FLIP ⌽ DJ DEX',
        headlineFamily: 'Bebas Neue',
        headlineSize: 44,
        headlineHeight: 0.9,
        headColor: '#fec600',
        headX: 8.6,
        headY: 60,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        head2Enabled: true,
        head2line: 'skyline',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 88,
        head2X: 8.3,
        head2Y: 45,
        head2Family: 'galaxia personal used',
        head2Shadow: true,
        head2ShadowStrength: 1,

        details: 'FRI • 11 PM\nLATE NIGHT SET\nGUEST LIST OPEN',
        detailsLineHeight: 0.62,
        detailsX: 9.6,
        detailsY: 19.6,
        bodyColor: '#e5e7eb',
        detailsAlign: 'left',
        detailsFamily: 'lemonmilk-regular',
        detailsSize: 16,

        venue: 'GOLDEN',
        venueX: 8,
        venueY: 36.3,
        venueColor: '#f7c202',
        venueSize: 42,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

       
        subtagEnabled: false,

        bgPosX: 45.1,
        bgPosY: 33.4,
        bgScale: 3.5,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [
         { id: "graphic_venue_sq", 
          kind: "flare", char: "", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 12.1, y: 13.9, scale: 0.37, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
        },
         { id: "graphic_hookah_sq", 
          kind: "flare", 
          char: "VSOP HOOKAH", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah, 
          iconColor: "#ffffff",
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 61.5, y: 78, scale: 0.6, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },
         { id: "graphic_bottle_service_sq", 
          kind: "flare", 
          char: "BOTTLE SERVICE", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 39, y: 78, scale: 0.60, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
         },
        { id: "graphic_drink_specials_sq", 
          kind: "flare", char: "DRINK SPECIALS", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 16, y: 78, scale: 0.60, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
        },
        ],
      },
      story: {
        headline: 'DJ FLIP ⌽ DJ DEX',
        headlineFamily: 'Bebas Neue',
        headlineSize: 44,
        headlineHeight: 0.9,
        headColor: '#fec600',
        headX: 10.2,
        headY: 69.4,
        headAlign: 'left',
        headShadow: true,
        headShadowStrength: 1,

        head2Enabled: true,
        head2line: 'sky\nline',
        head2Color: '#ffffff',
        head2Align: 'left',
        head2Size: 136,
        head2X: 9.3,
        head2Y: 50.4,
        head2LineHeight: 0.38,
        head2Family: 'galaxia personal used',
        head2Shadow: true,
        head2ShadowStrength: 1,

        details: 'FRI • 11 PM\nLATE NIGHT SET\nGUEST LIST OPEN',
        detailsLineHeight: 0.62,
        detailsX: 9.6,
        detailsY: 18.2,
        bodyColor: '#e5e7eb',
        detailsAlign: 'left',
        detailsFamily: 'lemonmilk-regular',
        detailsSize: 16,

        details2Enabled: true,
        details2Size: 10,
        details2Align: 'left',
        details2: 'Rooftop opens at 9. An elevated night of style, sound, and sophistication.\nWhere refined taste meets the city after dark\nA curated experience for those who expect more.',
        details2X: 9.9,
        details2Y: 90.8,
        details2LineHeight: 0.75,
        details2Color: '#ffffff',
        details2Family: 'LEMONMILK-Light',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'GOLDEN',
        venueX: 9.7,
        venueY: 41.9,
        venueColor: '#f7c202',
        venueSize: 42,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

       
        subtagEnabled: false,

        bgPosX: 50.2,
        bgPosY: 39.1,
        bgScale: 2.3,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [
         { id: "graphic_venue_sq", 
          kind: "flare", char: "", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 12.1, y: 13.9, scale: 0.37, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
        },
         { id: "graphic_hookah_sq", 
          kind: "flare", 
          char: "VSOP HOOKAH", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah, 
          iconColor: "#ffffff",
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 62.2, y: 86.2, scale: 0.60, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },
         { id: "graphic_bottle_service_sq", 
          kind: "flare", 
          char: "BOTTLE SERVICE", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 38.6, y: 86.2, scale: 0.60, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
         },
        { id: "graphic_drink_specials_sq", 
          kind: "flare", char: "DRINK SPECIALS", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 16, y: 86.2, scale: 0.60, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
        },
        ],
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
        headline: 'MIAMI',
        headlineFamily: 'game of squids',
        headlineSize: 96,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 7,
        headY: 43.4,
        headAlign: 'left',
        headShadow: true,
        headShadowStrength: 1,

        head2Enabled: true,
        head2line: 'NIGHTS',
        head2Color: '#00cccf',
        head2Align: 'left',
        head2Size: 68,
        head2X: 7.6,
        head2Y: 57.2,
        head2Family: 'game of squids',
        head2Shadow: true,
        head2ShadowStrength: 1,

        details: 'SAT • 9 PM\nOCEAN DRIVE\nOPEN BAR TILL 10',
        detailsLineHeight: 0.62,
        detailsX: 8.2,
        detailsY: 33.8,
        bodyColor: '#faf205',
        detailsAlign: 'left',
        detailsFamily: 'nexa-heavy',
        detailsSize: 16,

        venue: 'Neon nights. Heavy vibes.',
        venueX: 8.6,
        venueY: 70.6,
        venueColor: '#faf205',
        venueSize: 19,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        subtagEnabled: false,

        bgPosX: 0,
        bgPosY: 0,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.1,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [
           { id: "graphic_venue_sq", 
          kind: "flare", char: "", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 10.9, y: 28.1, scale: 0.37, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },
          { id: "graphic_drink_specials_sq", 
          kind: "flare", char: "DRINK SPECIALS", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 16, y: 83.5, scale: 0.40, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
        },
        { id: "graphic_bottle_service_sq", 
          kind: "flare", 
          char: "BOTTLE\nSERVICE", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 31.3, y: 83.5, scale: 0.40, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
         },
          { id: "graphic_hookah_sq", 
          kind: "flare", 
          char: "VSOP HOOKAH", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah, 
          iconColor: "#ffffff",
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 47.3, y: 83.5, scale: 0.40, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },

        ]
      },
      story: {
       headline: 'MIAMI',
        headlineFamily: 'game of squids',
        headlineSize: 96,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 24.5,
        headY: 66.3,
        headAlign: 'left',
        headShadow: true,
        headShadowStrength: 1,

        head2Enabled: true,
        head2line: 'NIGHTS',
        head2Color: '#00cccf',
        head2Align: 'left',
        head2Size: 68,
        head2X: 25,
        head2Y: 73.5,
        head2Family: 'game of squids',
        head2Shadow: true,
        head2ShadowStrength: 1,

        details: 'SAT • 9 PM\nOCEAN DRIVE\nOPEN BAR TILL 10',
        detailsLineHeight: 0.62,
        detailsX: 8.8,
        detailsY: 13.6,
        bodyColor: '#faf205',
        detailsAlign: 'left',
        detailsFamily: 'nexa-heavy',
        detailsSize: 16,

        venue: 'Neon nights. Heavy vibes.',
        venueX: 24.4,
        venueY: 80.6,
        venueColor: '#faf205',
        venueSize: 19,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        subtagEnabled: false,

        bgPosX: 69.9,
        bgPosY: 3.9,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.1,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [
           { id: "graphic_venue_sq", 
          kind: "flare", char: "", 
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 11.5, y: 10.2, scale: 0.37, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },
          { id: "graphic_drink_specials_sq", 
          kind: "flare", char: "DRINK SPECIALS", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 32.7, y: 87.7, scale: 0.60, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
        },
        { id: "graphic_bottle_service_sq", 
          kind: "flare", 
          char: "BOTTLE\nSERVICE", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 50, y: 87.7, scale: 0.60, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
         },
          { id: "graphic_hookah_sq", 
          kind: "flare", 
          char: "VSOP HOOKAH", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah, 
          iconColor: "#ffffff",
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 66.6, y: 87.7, scale: 0.60, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },
          {
          id: 'mgr_flare_st_1',
          kind: 'flare',
          char: '',
          url: '/flares/sun01.png',
          isFlare: true,
          blendMode: 'screen',
          x: 31.1,
          y: 34.8,
          scale: 0.2,
          rotation: 0,
          opacity: 0.55,
          locked: true,
        },
        ]
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
        headline: 'MANHATTAN',
        headlineFamily: 'Bebas Neue',
        headlineSize: 92,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 17.7,
        headY: 43,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        head2Enabled: true,
        head2line: 'Midnight',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 126,
        head2X: 28.1,
        head2Y: 52.8,
        head2Family: 'openscript',
        head2Shadow: true,
        head2ShadowStrength: 1,

        details: 'FRI • 10 PM\nCITY LIGHTS\nVIP TABLES',
        detailsLineHeight: 0.62,
        detailsX: 32.6,
        detailsY: 71.2,
        bodyColor: '#dbeafe',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 16,

        venue: 'SOHO LOUNGE',
        venueX: 25,
        venueY: 83.6,
        venueColor: '#90cdf4',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [
          { id: "graphic_venue_sq", 
          kind: "flare", char: "Down Town", 
          labelBg: false, labelSize: 10, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 11.3, y: 8.8, scale: 0.23, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },
        ]
      },
      story: {
        headline: 'MANHATTAN',
        headlineFamily: 'Bebas Neue',
        headlineSize: 92,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 17.7,
        headY: 43,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        head2Enabled: true,
        head2line: 'Midnight',
        head2Color: '#ffffff',
        head2Align: 'center',
        head2Size: 126,
        head2X: 33.2,
        head2Y: 47.7,
        head2Family: 'openscript',
        head2Shadow: true,
        head2ShadowStrength: 1,

        details: 'FRI • 10 PM\nCITY LIGHTS\nVIP TABLES',
        detailsLineHeight: 0.62,
        detailsX: 35.8,
        detailsY: 58.2,
        bodyColor: '#dbeafe',
        detailsAlign: 'center',
        detailsFamily: 'Inter',
        detailsSize: 16,

        venue: 'SOHO LOUNGE',
        venueX: 28.1,
        venueY: 64.1,
        venueColor: '#90cdf4',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        
        subtagEnabled: false,

        bgPosX: 50,
        bgPosY: 50,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [
          { id: "graphic_venue_sq", 
          kind: "flare", char: "Down Town", 
          labelBg: false, labelSize: 10, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 11.3, y: 8.8, scale: 0.23, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },
        ]
      },
    },
  },
  {
    id: 'karaokee',
    label: 'Karaoke — Neon Mic Night',
    tags: ['Neon', 'Urban'],
    style: 'neon',
    bgPrompt: '',
    preview: '/templates/karaokee.jpg',
    formats: {
      square: {
        headline: 'KARAOKE',
        headlineFamily: 'Bebas Neue',
        headRotate: 90,
        headlineSize: 92,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: -2.5,
        headY: 44.2,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'FRI • 9 PM\nOPEN MIC • PRIZES\nSIGN UP EARLY',
        detailsLineHeight: 0.62,
        detailsX: 9.2,
        detailsY: 85.9,
        bodyColor: '#e5e7eb',
        detailsAlign: 'left',
        detailsFamily: 'OCTIN COLLEGE RG',
        detailsSize: 16,

        venue: 'NEON LOUNGE',
        venueX: 55.1,
        venueY: 90.6,
        venueColor: '#90cdf4',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 8.5,
        bgPosY: 30.2,
        bgScale: 1,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [
         { id: "graphic_venue_sq", 
          kind: "flare", char: "", 
          labelBg: false, labelSize: 10, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 51.9, y: 92.7, scale: 0.27, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },

        ]
      },
      story: {
        headline: 'KARAOKE',
        headlineFamily: 'Bebas Neue',
        headRotate: 90,
        headlineSize: 180,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: -32.3,
        headY: 38.3,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,

        details: 'FRI • 9 PM\nOPEN MIC • PRIZES\nSIGN UP EARLY',
        detailsLineHeight: 0.62,
        detailsX: 8,
        detailsY: 75.3,
        bodyColor: '#e5e7eb',
        detailsAlign: 'left',
        detailsFamily: 'OCTIN COLLEGE RG',
        detailsSize: 20,

        venue: 'NEON\nLOUNGE',
        venueX: 8.3,
        venueY: 12.3,
        venueColor: '#90cdf4',
        venueSize: 29,
        venueFamily: 'LEMONMILK-Light',
        venueAlign: 'left',
        venueShadow: true,
        venueShadowStrength: 1,
        venueLineHeight: .7,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 82.7,
        bgPosY: 34.3,
        bgScale: 1,
        vignette: true,
        vignetteStrength: 0.2,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [
         { id: "graphic_venue_sq", 
          kind: "flare", char: "", 
          labelBg: false, labelSize: 10, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.venue, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 10.6, y: 9.3, scale: 0.27, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },

        ]
      },
    },
  },
  {
    id: 'bottle_service',
    label: 'Bottle Service — Luxe Night',
    tags: ['R&B Lounge', 'Urban'],
    style: 'urban',
    bgPrompt: '',
    preview: '/templates/bottle_service.jpg',
    formats: {
      square: {
        headline: 'Reserve',
        headlineFamily: 'openscript',
        headlineSize: 176,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 22,
        headY: 47.4,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,
        headTracking: -.01,
        headUppercase: false,

        details: 'SAT • 11 PM\nCHAMPAGNE + SPARKLERS\nVIP TABLES',
        detailsLineHeight: 0.62,
        detailsX: 45,
        detailsY: 76.9,
        bodyColor: '#f8fafc',
        detailsAlign: 'right',
        detailsFamily: 'lemonmilk-regular',
        detailsSize: 16,

        details2Enabled: true,
        details2: 'An exclusive night above the city lights\nPrivate tables. Elevated atmosphere.',
        details2X: 35,
        details2Y: 90.8,
        details2Size: 12,
        details2LineHeight: .65,
        details2Color: '#f7c202',
        details2Family: 'LEMONMILK-Light',
        details2Align: 'right',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'SKYLOUNGE',
        venueX: 56.6,
        venueY: 67.8,
        venueColor: '#f7c202',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 11.4,
        bgPosY: 32.9,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.15,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

        emojiList: [

             { id: "graphic_drink_specials_sq", 
          kind: "flare", char: "DRINK SPECIALS", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 54.4, y: 12.1, scale: 0.32, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
        },
        { id: "graphic_bottle_service_sq", 
          kind: "flare", 
          char: "BOTTLE\nSERVICE", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 69.2, y: 12.1, scale: 0.32, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
         },
          { id: "graphic_hookah_sq", 
          kind: "flare", 
          char: "VSOP HOOKAH", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah, 
          iconColor: "#ffffff",
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 83.6, y: 12.1, scale: 0.32, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },

        ]
      },
      story: {
        headline: 'Reserve',
        headlineFamily: 'openscript',
        headlineSize: 176,
        headlineHeight: 0.9,
        headColor: '#ffffff',
        headX: 13.2,
        headY: 59.9,
        headAlign: 'center',
        headShadow: true,
        headShadowStrength: 1,
        headTracking: -.01,
        headUppercase: false,

        details: 'SAT • 11 PM\nCHAMPAGNE + SPARKLERS\nVIP TABLES',
        detailsLineHeight: 0.62,
        detailsX: 28.8,
        detailsY: 78.7,
        bodyColor: '#f8fafc',
        detailsAlign: 'center',
        detailsFamily: 'lemonmilk-regular',
        detailsSize: 16,

        details2Enabled: true,
        details2: 'An exclusive night above the city lights\nPrivate tables. Elevated atmosphere.',
        details2X: 10.9,
        details2Y: 85.6,
        details2Size: 18,
        details2LineHeight: .65,
        details2Color: '#f7c202',
        details2Family: 'LEMONMILK-Light',
        details2Align: 'right',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'SKYLOUNGE',
        venueX: 50.8,
        venueY: 70.7,
        venueColor: '#f7c202',
        venueSize: 26,
        venueFamily: 'LEMONMILK-Light',
        venueShadow: true,
        venueShadowStrength: 1,

        head2Enabled: false,
        subtagEnabled: false,

        bgPosX: 11.4,
        bgPosY: 32.9,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.15,

        textColWidth: 58,
        align: 'center',
        textAlign: 'center',

         emojiList: [

             { id: "graphic_drink_specials_sq", 
          kind: "flare", char: "DRINK SPECIALS", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.drink, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 83.2, y: 20, scale: 0.32, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
        },
        { id: "graphic_bottle_service_sq", 
          kind: "flare", 
          char: "BOTTLE\nSERVICE", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.bottle, 
          iconColor: "#ffffff", 
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 83.2, y: 31.2, scale: 0.32, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
         },
          { id: "graphic_hookah_sq", 
          kind: "flare", 
          char: "VSOP HOOKAH", 
          labelBg: false, labelSize: 12, labelColor: "#e5e7eb",
          svgTemplate: NIGHTLIFE_GRAPHIC_TEMPLATES.hookah, 
          iconColor: "#ffffff",
          isFlare: true, isSticker: true, 
          blendMode: "normal", 
          x: 83.2, y: 9.7, scale: 0.32, 
          rotation: 0, opacity: 1, locked: false,
          tint: 0,
          },

        ]
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
        bgPosX: 4.3,
        bgPosY: 20.6,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.25,

        emojiList: [
         
        ],

        headline: 'MARDI',
        headlineFamily: 'AQILAH-JRYXK',
        headlineSize: 66,
        headlineHeight: 0.9,
        headColor: '#f7c202',
        headX: 8.8,
        headY: 20.5,
        headAlign: 'left',
        headShadow: true,
        headShadowStrength: 1,

        head2Enabled: true,
        head2line: 'GRAS',
        head2Family: 'AQILAH-JRYXK',
        head2Color: '#f7c202',
        head2Size: 84,
        head2X: 8.8,
        head2Y: 32.7,
        head2Align: 'left',
        head2Shadow: true,
        head2ShadowStrength: 1,

        details: 'FEB 25 • 9 PM\nCOSTUMES WELCOME\nOPEN BAR',
        detailsFamily: 'Inter',
        detailsSize: 18,
        detailsLineHeight: 0.75,
        detailsColor: '#e5e7eb',
        detailsX: 8.8,
        detailsY: 63.2,
        detailsAlign: 'left',
        detailsShadow: true,
        detailsShadowStrength: 0.25,

        details2Enabled: true,
        details2: 'Let the good times roll with music, masks, and pure carnival vibes.\nWhere color, culture, and rhythm take over the night.',
        details2X: 8.8,
        details2Y: 79.3,
        details2Size: 12,
        details2LineHeight: .65,
        details2Color: '#f7c202',
        details2Family: 'LEMONMILK-Regular',
        details2Align: 'left',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'BOURBON LOUNGE',
        venueFamily: 'LEMONMILK-Light',
        venueColor: '#e5e7eb',
        venueSize: 30,
        venueX: 8.8,
        venueY: 86.7,
        venueAlign: 'left',
        venueShadow: true,
        venueShadowStrength: 0.3,

        subtagEnabled: false,
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
        bgPosX: 76,
        bgPosY: 21.1,
        bgScale: 1.2,
        vignette: true,
        vignetteStrength: 0.25,

        emojiList: [
         
        ],

        headline: 'MARDI',
        headlineFamily: 'AQILAH-JRYXK',
        headlineSize: 66,
        headlineHeight: 0.9,
        headColor: '#f7c202',
        headX: 24.1,
        headY: 61.5,
        headAlign: 'left',
        headShadow: true,
        headShadowStrength: 1,

        head2Enabled: true,
        head2line: 'GRAS',
        head2Family: 'AQILAH-JRYXK',
        head2Color: '#f7c202',
        head2Size: 84,
        head2X: 22.6,
        head2Y: 69.3,
        head2Align: 'left',
        head2Shadow: true,
        head2ShadowStrength: 1,

        details: 'FEB 25 • 9 PM\nCOSTUMES WELCOME\nOPEN BAR',
        detailsFamily: 'Inter',
        detailsSize: 18,
        detailsLineHeight: 0.75,
        detailsColor: '#e5e7eb',
        detailsX: 29.5,
        detailsY: 80.8,
        detailsAlign: 'center',
        detailsShadow: true,
        detailsShadowStrength: 0.25,

        details2Enabled: true,
        details2: 'Let the good times roll with music, masks, and pure carnival vibes.\nWhere color, culture, and rhythm take over the night.',
        details2X: 7.7,
        details2Y: 94.7,
        details2Size: 12,
        details2LineHeight: .65,
        details2Color: '#f7c202',
        details2Family: 'LEMONMILK-Regular',
        details2Align: 'center',
        details2Shadow: true,
        details2ShadowStrength: 1,

        venue: 'BOURBON LOUNGE',
        venueFamily: 'LEMONMILK-Light',
        venueColor: '#e5e7eb',
        venueSize: 30,
        venueX: 22.2,
        venueY: 89.9,
        venueAlign: 'left',
        venueShadow: true,
        venueShadowStrength: 0.3,

        subtagEnabled: false,
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
    },
  },
];
