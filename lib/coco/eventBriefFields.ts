/** Shared field names and labels for Create with Coco and its editor. */
export const COCO_EVENT_FIELD_GROUPS = [
    { label: 'Event details', fields: [['subtitle', 'Subtitle / tagline'], ['presenterName', 'Presenter / promoter'], ['date', 'Date'], ['startTime', 'Start time'], ['endTime', 'End time'], ['venueName', 'Venue name'], ['address', 'Full address'], ['djs', 'DJs / headline acts']] },
    { label: 'Entertainment', fields: [['hosts', 'Hosts / hype team'], ['performers', 'Live performers'], ['additionalActs', 'Additional acts'], ['musicPolicy', 'Music genres / policy']] },
    { label: 'Experience & specials', fields: [['eventDetails', 'Short event details'], ['dressCode', 'Dress code'], ['mainPromotion', 'Main promotion'], ['bottleSpecials', 'Bottle specials'], ['drinkSpecials', 'Drink specials'], ['foodSpecials', 'Food specials'], ['hookahSpecials', 'Hookah specials'], ['promotionDeadline', 'Offer deadline'], ['additionalOffers', 'Other offers']] },
    { label: 'Admission', fields: [['entryFee', 'Entry fee'], ['ageRequirement', 'Age requirement'], ['freeEntryCondition', 'Free-entry condition'], ['entryRestrictions', 'Entry restrictions'], ['responsibleDrinking', 'Responsible drinking note']] },
    { label: 'Reservations, socials & QR', fields: [['rsvpContact', 'RSVP contact'], ['bookingContact', 'Table booking contact'], ['website', 'Website'], ['email', 'Email'], ['ticketLink', 'Ticket link'], ['socials', 'Social handle'], ['qrDestination', 'QR destination'], ['qrLabel', 'QR label']] },
] as const;
export type CocoEventTextField = typeof COCO_EVENT_FIELD_GROUPS[number]['fields'][number][0] | `recipe:${string}` | 'presenterLogo';
export type CocoRecipeFieldBinding = {
    label: string;
    guidance?: string;
    group: string;
    kind: 'text' | 'lines' | 'date' | 'qr';
    targets: Partial<Record<'square' | 'story', string[]>>;
    originalText: Partial<Record<'square' | 'story', string>>;
};
export type CocoEventBriefInput = Partial<Record<CocoEventTextField | 'description' | 'reservationLabel' | 'ticketLabel', string>> & {
    /** Recipe-owned routing, persisted with the full brief for format switching. */
    fieldFormats?: Record<string, ('square' | 'story')[]>;
    recipeFieldBindings?: Record<string, CocoRecipeFieldBinding>;
    theme?: string;
    experienceFeatures?: string[];
    socialPlatforms?: string[];
    requestedAssetIds?: string[];
};
export const COCO_EVENT_FIELD_LABELS = Object.fromEntries(COCO_EVENT_FIELD_GROUPS.flatMap(g => g.fields as readonly (readonly [
    CocoEventTextField,
    string
])[])) as Record<CocoEventTextField, string>;
export const COCO_EXPERIENCE_FEATURES = ['hookah', 'food', 'drinks', 'bottle-service', 'bucket-deals', 'champagne', 'vip'] as const;
export const COCO_FEATURE_LABELS: Record<string, string> = { hookah: 'Hookah', food: 'Food', drinks: 'Drinks', 'bottle-service': 'Bottle service', 'bucket-deals': 'Bucket deals', champagne: 'Champagne', vip: 'VIP' };
export { COCO_THEMES as COCO_STYLE_CHOICES } from './recipeCompatibility.ts';
export const COCO_SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'x', 'whatsapp', 'youtube', 'twitch'] as const;
