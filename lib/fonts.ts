import { FONT_FILE_MAP } from "./localFontMap";

// Every font name is now auto-generated
export const HEADLINE_FONTS_LOCAL = Object.keys(FONT_FILE_MAP);
export const HEADLINE2_FONTS_LOCAL = [...HEADLINE_FONTS_LOCAL];
export const BODY_FONTS_LOCAL = [...HEADLINE_FONTS_LOCAL];
export const BODY_FONTS2_LOCAL = [...HEADLINE_FONTS_LOCAL];
export const VENUE_FONTS_LOCAL = [...HEADLINE_FONTS_LOCAL];
export const SUBTAG_FONTS_LOCAL = [...HEADLINE_FONTS_LOCAL];
