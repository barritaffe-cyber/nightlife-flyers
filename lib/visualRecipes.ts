import { SUMMER_SUNSET_RECIPE } from "./recipes/summerSunset.ts";
import { REMOVED_COCO_RECIPE_IDS } from './coco/removedRecipes.ts';
import { DIABLA_ALL_WHITE_RECIPE } from "./recipes/diablaAllWhite.ts";
import { RNB_THURSDAYS_RECIPE } from "./recipes/rnbThursdays.ts";
import { ZONA_DE_PERREO_RECIPE } from "./recipes/zonaDePerreo.ts";
import { REGGAE_JAMS_RECIPE } from "./recipes/reggaeJams.ts";
import { AMAPIANO_NIGHT_RECIPE } from "./recipes/amapianoNight.ts";
import { COMO_UNA_BOA_RECIPE } from "./recipes/comoUnaBoa.ts";
import { I_LOVE_THURSDAY_RECIPE } from "./recipes/iLoveThursday.ts";
import { ELITE_MONDAY_RECIPE } from "./recipes/eliteMonday.ts";
import { WE_OUTSIDE_RECIPE } from "./recipes/weOutside.ts";
import { PULSE_RECIPE } from "./recipes/pulse.ts";
import { SPACE_NEON_RECIPE } from "./recipes/spaceNeon.ts";
import { BRUNCH_SATURDAY_RECIPE } from "./recipes/brunchSaturday.ts";
import { BRUNCH_VIBES_RECIPE } from "./recipes/brunchVibes.ts";
import { FASHION_CLUB_VERTICAL_RECIPE } from "./recipes/fashionClubVertical.ts";
import { LADIES_CSS_EDITORIAL_RECIPE } from "./recipes/ladiesCssEditorial.ts";
import { RUSH_NIGHT_RECIPE } from "./recipes/rushNight.ts";
import { NEON_NIGHT_SHIFT_RECIPE } from "./recipes/neonNightShift.ts";
import { GLOW_IN_THE_DARK_RECIPE } from "./recipes/glowInTheDark.ts";
import { PUNTA_CANA_SUNDAYS_RECIPE } from "./recipes/puntaCanaSundays.ts";
import { BADDIES_N_BUNDLES_RECIPE } from "./recipes/baddiesNBundles.ts";
import { CITY_NIGHTS_RECIPE } from "./recipes/cityNights.ts";
import { BLACK_GOLD_PARTY_RECIPE } from "./recipes/blackGoldParty.ts";
import { GREY_RAVE_FESTIVAL_RECIPE } from "./recipes/greyRaveFestival.ts";
import { DODGE_NIGHT_RIDES_RECIPE } from "./recipes/dodgeNightRides.ts";
import { LADIES_NIGHT_ROSE_RECIPE } from "./recipes/ladiesNightRose.ts";
import { GRILLS_AND_GROOVE_RECIPE } from "./recipes/grillsAndGroove.ts";
import { BRUNCH_SUNDAYS_RECIPE } from './recipes/brunchSundays.ts';
import { GIRL_CODE_RECIPE } from "./recipes/girlCode.ts";
import { YCEE_LIVE_RECIPE } from './recipes/yceeLive.ts';
import { HONEY_NIGHTS_RECIPE } from './recipes/honeyNights.ts';
import { GIRL_CODE_ROSE_RECIPE } from './recipes/girlCodeRose.ts';
import { SOFT_LIFE_RECIPE } from "./recipes/softLife.ts";
import { BAD_GIRLS_RECIPE } from "./recipes/badGirls.ts";
import { BEAT_THERAPY_RECIPE } from "./recipes/beatTherapy.ts";
import { GALLERY_TEMPLATE_RECIPES } from "./recipes/galleryTemplateRecipes.ts";
import type { VisualRecipe } from "./recipes/types.ts";

export type {
  VisualRecipe,
  VisualRecipeComposition,
  VisualRecipeMeasurementReference,
  VisualRecipeOverlapRule,
  VisualRecipeRect,
  VisualRecipeRole,
  VisualRecipeTargetAssets,
  VisualRecipeTextZone,
} from "./recipes/types.ts";

export const TYPOGRAPHY_DOCTRINE = {
  summary:
    "Strong flyer typography is hierarchy, contrast, spacing, tone, and one unforgettable typographic moment.",
  principles: [
    "Build aggressive hierarchy: event name first, artist/theme second, date/location third, fine print last.",
    "Use extreme size contrast. Headlines can be 140-300px, support lines 40-80px, date/location 24-48px, fine print 14-22px.",
    "Use only one or two font families: one display face and one clean support face.",
    "Create contrast through thick vs thin, large vs small, tight vs open, clean vs expressive.",
    "Tighten big headline tracking. Luxury and club headlines usually need tighter spacing, not browser-default spacing.",
    "Use small spaced uppercase for metadata and authority labels.",
    "Layer typography into the scene: behind subject, masked, oversized, cropped, duplicated, blurred, shadowed, or interacting with glow.",
    "Crop oversized text when it improves poster energy.",
    "Use depth stacks: sharp foreground title, blurred duplicate behind, shadow echo, glow, chromatic split, grain overlay.",
    "Do not center everything by default. Use asymmetry, side lanes, anchored corners, vertical date/type, and diagonal flow when the subject supports it.",
    "Control line height: large headlines around 0.8-0.95, small info around 1.1-1.4.",
    "Add texture to hero typography: metallic, chrome, glass, grain, emboss, smoke, or glow. Keep it subtle.",
    "Match type color to the scene: gold for luxury, cyan/magenta for neon club, red/orange for Latin, white/silver for upscale.",
    "Create a clear reading path: headline, hook/artist, date/location, CTA.",
    "Use blur intentionally for depth, especially a huge blurred duplicate behind sharp title.",
    "Use repetition only when it creates motion or branding.",
    "Preserve negative space. Premium flyers are not packed with boxes and badges.",
    "Match typography to event energy: elegant serif/gold for luxury, heavy condensed for trap/hip-hop, minimal spaced for techno, warm bold for Latin.",
    "Test mobile readability. If the headline fails at phone thumbnail size, the flyer fails.",
    "Use one hero typographic moment. Everything else must support it.",
    "Simplicity wins: one strong headline, one strong subject, controlled effects, clean hierarchy.",
  ],
  cheapWarningSigns: [
    "Too many boxes, cards, pills, and badges.",
    "Too many fonts or mismatched font moods.",
    "Flat text sitting on top of an image instead of integrated into it.",
    "Effects used to compensate for weak composition.",
    "Rainbow palettes or unmotivated colors.",
    "Centered everything with no editorial tension.",
    "Footer copy competing with the headline.",
    "Every inch filled with text or graphics.",
    "Default spacing, default shadows, and untextured headline type.",
  ],
} as const;

export const ICON_LANE_RULES = {
  summary:
    "Icons and logos must live in clean lanes with compact, intentional spacing.",
  principles: [
    "Icons and logos must live in deliberate lanes, never scattered as decoration.",
    "Social icons should read as one compact group.",
    "The spacing between icons should be visibly smaller than the width of the whole icon group.",
    "Horizontal icon spacing should generally be about 1.5-2.0 icon widths center-to-center for footer social groups.",
    "Vertical spacing between a label and its icon row must be close enough to feel connected: about 0.6-1.0 icon height between label baseline and icon top.",
    "If a lane has a text label, the label and icons should align to the same center or edge.",
    "Use equal spacing between all icons in the row.",
    "Icon size, glow, stroke, and opacity should be consistent across the row.",
    "Keep icons secondary; they should support the CTA or contact lane, not compete with the hero title.",
    "When icon spacing feels loose, reduce both horizontal spacing and label-to-icon vertical spacing together.",
    "If the icons start to look like individual stickers, the lane is too loose.",
  ],
} as const;

export const SUBJECT_ISOLATION_RULES = {
  summary:
    "Premium subject-led flyers need a separated subject layer so typography can sit inside the scene instead of only on top of it.",
  layerOrder: [
    "background",
    "behind-subject typography",
    "extracted subject",
    "foreground title/details",
    "atmosphere/color grade",
  ],
  principles: [
    "Isolate the subject as its own foreground layer instead of leaving the whole image flat.",
    "Keep or create a full-bleed background/base layer behind the extracted subject.",
    "Place oversized title, repeated title, or ghost typography between the background and extracted subject.",
    "The extracted subject should physically occlude the behind-subject type.",
    "Behind-subject type should usually be lower contrast than the main title: partial opacity, blur, mask, shadow, or scene-reactive color.",
    "Do not cover important facial features, eyewear, hands, jewelry, or the strongest accessory unless the text is intentionally masked by the subject.",
    "Auto-layout should detect the subject silhouette and reserve an occlusion zone where text can pass behind the subject but not over key facial details.",
    "If subject extraction is not available, use a manual mask or duplicate-image workaround before attempting this look.",
  ],
} as const;

// Historical design studies remain below as documentation while old saved
// projects are migrated, but they are not materializable Coco recipes. Keep
// the public registry restricted to authored, versioned recipe families.
const VISUAL_RECIPE_CATALOG: ReadonlyArray<VisualRecipe> = [
  ...GALLERY_TEMPLATE_RECIPES,
  {
    id: "triple-hero-takeover-red-system",
    name: "Sunday Takeover Measurement Reference",
    reference: "square_center_hero_nightlife",
    referenceMode: "measurement-only",
    summary:
      "A Sunday Takeover red club layout that uses one center-hero template only as measurement data for subject scale, headline zones, support lanes, and overlap rules.",
    measurementReference: {
      mode: "measurement-only",
      sourceTemplateId: "square_center_hero_nightlife",
      allowedUses: [
        "subject size relative to the square canvas",
        "subject anchor and visible safe zone",
        "headline placement and safe bounds",
        "support text placement and safe bounds",
        "layer-order measurements",
        "overlap rules",
      ],
      deniedUses: [
        "background asset",
        "subject/cutout asset",
        "icons and stickers",
        "color palette",
        "font styling",
        "finished visual look",
      ],
      measurements: {
        portrait: { x: 55.3, y: 70.2, scale: 0.39 },
        subjectVisibleRect: { x: 21.8, y: 15.2, width: 56, height: 84.8 },
        subjectSideVisibleRect: { x: 0, y: 8.5, width: 36.8, height: 91.5 },
        subjectFaceRect: { x: 39.4, y: 19.3, width: 25.35, height: 25.35 },
        subjectSideFaceRect: { x: 7.25, y: 19.3, width: 25.35, height: 25.35 },
        subjectScaleBoost: 1.146,
        headlineSizeBoost: 3,
        sideScriptY: 36.8,
        mainTitleRect: { x: 5.9, y: 64.1, width: 86, height: 22 },
        scriptRect: { x: 20, y: 55.6, width: 54, height: 10 },
        leftMetaRect: { x: 5, y: 41, width: 25, height: 13 },
        rightMetaRect: { x: 73, y: 34, width: 18, height: 21 },
        priceRect: { x: 75, y: 35, width: 14, height: 9 },
        footerRect: { x: 30, y: 92.5, width: 56, height: 6 },
      },
    },
    targetAssets: {
      backgroundUrl: "/scene-assets/takeover-red/red-arch-background.svg",
      subjectUrl: "/dj-templates/club01/subject.png",
      footerUrl: "/scene-assets/takeover-red/torn-paper-band.svg",
      dateBadgeUrl: "/scene-assets/takeover-red/red-date-badge.svg",
      notes: [
        "These are Sunday Takeover target assets, not reference-template assets.",
        "The subject asset is a placeholder until the user uploads a portrait.",
      ],
    },
    composition: {
      referenceMode: "measurement-only",
      referenceTemplateId: "square_center_hero_nightlife",
      referenceUses: [
        "subject size relative to the square canvas",
        "subject anchor and visible safe zone",
        "headline placement and safe bounds",
        "support text placement and safe bounds",
        "layer-order measurements",
        "overlap rules",
      ],
      deniedReferenceUses: [
        "background asset",
        "subject/cutout asset",
        "icons and stickers",
        "color palette",
        "font styling",
        "finished visual look",
      ],
      canvas: {
        format: "square",
        safeArea: { x: 4, y: 4, width: 92, height: 92 },
      },
      roles: [
        {
          id: "background",
          kind: "background",
          purpose: "Sunday Takeover red club background owned by this template.",
          required: true,
          editable: false,
          bounds: { x: 0, y: 0, width: 100, height: 100 },
          layer: "background",
        },
        {
          id: "subjectPrimary",
          kind: "subject",
          purpose: "Hero subject fitted to the measured center-hero cutout zone.",
          required: true,
          editable: true,
          bounds: { x: 21.8, y: 15.2, width: 56, height: 84.8 },
          layer: "subject",
          notes: [
            "Measurement source: square_center_hero_nightlife subjectVisibleRect.",
            "Use the zone size, not the reference cutout asset.",
            "Fit replacement portraits into this same visible subject zone before moving text.",
          ],
        },
        {
          id: "mainHeadline",
          kind: "headline",
          purpose: "Main TAKE OVER title placed in the measured lower headline zone.",
          required: true,
          editable: true,
          bounds: { x: 5.9, y: 64.1, width: 86, height: 22 },
          layer: "foreground",
        },
        {
          id: "scriptHeadline",
          kind: "headline",
          purpose: "Sunday hook attached to the top edge of the lower headline zone.",
          required: true,
          editable: true,
          bounds: { x: 20, y: 55.6, width: 54, height: 10 },
          layer: "foreground",
        },
        {
          id: "leftInfo",
          kind: "copy",
          purpose: "Music and DJ billing in the left side lane.",
          required: true,
          editable: true,
          bounds: { x: 5, y: 41, width: 25, height: 13 },
          layer: "foreground",
        },
        {
          id: "rightInfo",
          kind: "copy",
          purpose: "Entry and promo rules in the right side lane.",
          required: true,
          editable: true,
          bounds: { x: 73, y: 34, width: 18, height: 21 },
          layer: "foreground",
        },
        {
          id: "date",
          kind: "badge",
          purpose: "Date and time in the lower-left utility lane.",
          required: true,
          editable: true,
          bounds: { x: 8, y: 87, width: 16, height: 11 },
          layer: "utility",
        },
        {
          id: "price",
          kind: "utility",
          purpose: "Entry price in the right promo lane.",
          required: true,
          editable: true,
          bounds: { x: 75, y: 35, width: 14, height: 9 },
          layer: "foreground",
        },
        {
          id: "venue",
          kind: "footer",
          purpose: "Venue and amenities in the bottom footer lane.",
          required: true,
          editable: true,
          bounds: { x: 30, y: 92.5, width: 56, height: 6 },
          layer: "utility",
        },
      ],
      layoutRules: [
        "Read the reference template as measurement data only.",
        "Place the Sunday Takeover subject in the measured center-hero visible zone.",
        "Place TAKE OVER in the measured lower headline zone.",
        "Attach the Sunday script hook to the upper edge of the headline zone.",
        "Keep left and right support copy outside the measured subject zone.",
        "Keep date, price, and footer utility copy in their dedicated lanes.",
      ],
      overlapRules: [
        {
          objects: ["subjectPrimary", "mainHeadline"],
          allowed: true,
          maxCoveragePercent: 10,
          response: "Hero combo. Ask the user if they want to keep it.",
        },
        {
          objects: ["subjectPrimary", "leftInfo"],
          allowed: false,
          response: "Move the side copy away from the subject.",
        },
        {
          objects: ["subjectPrimary", "rightInfo"],
          allowed: false,
          response: "Move the promo lane away from the subject.",
        },
      ],
      generationSteps: [
        "Load the Sunday Takeover red background plate.",
        "Place the subject by reference measurements, not by copying the reference subject.",
        "Place TAKE OVER and Sunday into the target headline stack.",
        "Place DJ, entry, date, venue, and utility copy into the target support lanes.",
        "Run overlap and contrast checks before polish.",
      ],
    },
    layerStack: [
      "Sunday Takeover red arch/club background plate.",
      "Measured center-hero subject zone using a target placeholder or user-uploaded subject.",
      "Script Sunday hook above the lower TAKE OVER title.",
      "Left DJ lane and right entry/promo lane outside the subject zone.",
      "Bottom date badge, venue strip, and age/responsibility utilities.",
      "Warm red/orange grade, central glow, dark edges, and controlled flare.",
    ],
    textZones: [
      {
        id: "promoter",
        purpose: "Promoter authority line.",
        placement: "Top center, small and clean above the subject head.",
      },
      {
        id: "main-headline",
        purpose: "Main event name.",
        placement: "Lower-middle block stack inside the measured center-hero headline zone.",
      },
      {
        id: "script-title",
        purpose: "Day-of-week hook.",
        placement: "Lower middle, attached to the upper edge of the block headline.",
      },
      {
        id: "left-dj-lane",
        purpose: "Music/DJ billing.",
        placement: "Mid-left edge, outside the measured subject silhouette.",
      },
      {
        id: "right-price-lane",
        purpose: "Entry price and promo rule.",
        placement: "Mid-right edge, stacked and compact.",
      },
      {
        id: "footer-info",
        purpose: "Date, venue, amenities, and age utility.",
        placement: "Bottom lane below the main title.",
      },
    ],
    typography: [
      "Main headline uses a wide block face with tight tracking and short line height.",
      "Script title sits above the block title and can cross the subject torso.",
      "Support copy uses condensed uppercase sans with high contrast.",
      "Avoid long headlines: this family works best with one to three short words.",
    ],
    colorGrade: [
      "Deep red/black club plate.",
      "Hot red central glow behind the subject.",
      "White headline and support text.",
      "Orange/warm accents for time and promo emphasis.",
      "Dark bottom vignette to ground the footer.",
    ],
    avoid: [
      "Copying the reference background, cutout, colors, icons, or completed look.",
      "Using three equally important subjects.",
      "Letting side portraits compete with the center subject.",
      "Putting long copy in the headline stack.",
      "Allowing side-lane copy to cover faces.",
      "Bright backgrounds behind the white block headline.",
    ],
    appNotes: [
      "Reference template means measurement source only.",
      "Reference template: square_center_hero_nightlife.",
      "Measured subject placement: portrait x 55.3, y 70.2, scale 0.39; visible rect x 21.8, y 15.2, width 56, height 84.8.",
      "The Sunday template owns its red background, footer, date badge, title style, and placeholder subject.",
      "When user uploads a subject, fit the visible silhouette into the measured subject zone before moving text.",
    ],
  },
  {
    id: "mustang-hero-subject-poster",
    name: "Mustang Hero Subject Poster",
    reference: "MUSTANG-SQUARE.png",
    summary:
      "A cinematic subject-led poster where the car is the hero, the title sits behind it, and the event details live in disciplined supporting lanes.",
    layerStack: [
      "Full-bleed industrial alley/background image.",
      "Large title word behind the subject: LEGEND.",
      "Extracted Mustang/car foreground subject.",
      "Social icon lane stacked vertically on the left.",
      "Secondary tagline in front of the subject/ground zone: NEVER DIES.",
      "Short descriptive subtitle below the tagline.",
      "Bottom footer lane with date/location and music/details.",
      "Warm amber/red/purple color grade, glow, vignette, and atmospheric depth.",
    ],
    textZones: [
      {
        id: "hero-title",
        purpose: "Main poster identity.",
        placement: "Huge display word behind or partially overlapped by the subject.",
      },
      {
        id: "tagline",
        purpose: "Emotional hook.",
        placement: "Lower-middle foreground over the subject/ground zone.",
      },
      {
        id: "footer-info",
        purpose: "Event logistics and supporting details.",
        placement: "Bottom lane split into date/location and music/detail groups.",
      },
      {
        id: "social-lane",
        purpose: "Social media utility.",
        placement: "Vertical lane on the left side, separate from the main composition.",
      },
    ],
    typography: [
      "Main title should be a designed graphic layer or heavily styled editable text.",
      "Main title needs neon/chrome/block treatment with strong stroke, inner glow, and depth.",
      "Tagline can use a rough brush/script or expressive italic display face.",
      "Footer text should be clean, high-contrast, and grouped into readable lanes.",
    ],
    colorGrade: [
      "Warm amber/orange highlights.",
      "Red neon title treatment.",
      "Yellow tagline and footer accents.",
      "Deep purple shadow/vignette structure.",
      "Subject highlights must match the background lighting.",
    ],
    avoid: [
      "Floating text on a blank or generic background.",
      "Effects that compete with the subject.",
      "Scattered icons outside lanes.",
      "More than a few text zones.",
      "Main title placed only on top when it can be integrated behind or around the subject.",
    ],
    appNotes: [
      "Support background -> behind-subject title -> extracted subject -> foreground copy -> grade/effects.",
      "Title layer needs explicit layer-order controls so it can sit behind the subject.",
      "Subject extraction/cutout placement is central to this recipe.",
      "Auto-layout should identify safe foreground zones for tagline and footer copy.",
      "Typography presets should include neon tube/block title, chrome/block title, and brush tagline treatments.",
      "MUSTANG.json stores the useful design payload under state.session.square; currentTemplate.square is empty.",
      "MUSTANG.json hides the editable headline and uses an imported logo/image layer for the large LEGEND title.",
      "The title image layer uses a negative layerOffset and is locked behind the extracted Mustang PNG subject.",
      "The extracted subject layer, rendered title layer, social SVG stickers, and screen-blend flare are separate portrait-layer assets.",
      "The footer text is split across head2/head2line, details, details2, and venue rather than one large text block.",
      "The background is persisted as bgUploadUrl with bgScale/bgPos controls, with bgUrl only acting as a fallback/template reference.",
    ],
  },
  {
    id: "sample01-fantasy-portrait-flyer",
    name: "Fantasy Portrait Flyer",
    reference: "sample01.jpg",
    summary:
      "A fantasy portrait flyer where the face is the poster and every text layer supports the central character.",
    layerStack: [
      "Full-bleed fantasy portrait art with face centered and cropped large.",
      "Blue/pink atmospheric background glow and soft particle depth.",
      "Top brand/logo mark.",
      "Red horizontal date bar near the top.",
      "Main title across the lower face/chest area.",
      "Script tag attached to the main title.",
      "DJ/music credit stack below title.",
      "Red promo offer bar.",
      "Venue/footer information.",
    ],
    textZones: [
      {
        id: "brand-date",
        purpose: "Brand and event timing.",
        placement: "Top lane with logo above a red date bar.",
      },
      {
        id: "main-title",
        purpose: "Event identity.",
        placement: "Across the lower portrait/chest area without hiding the eyes.",
      },
      {
        id: "performer-credit",
        purpose: "DJ/music credit.",
        placement: "Centered below the main title.",
      },
      {
        id: "promo-footer",
        purpose: "Offer, venue, RSVP, and logistics.",
        placement: "Bottom red promo bar plus footer lines.",
      },
    ],
    typography: [
      "Main title needs a chrome/block/premium glow treatment.",
      "Script tag should overlap or tuck into the title.",
      "DJ name should be tall, condensed, and letter-spaced.",
      "Promo bar should be high-contrast red with compact uppercase copy.",
    ],
    colorGrade: [
      "Deep blue base.",
      "Electric cyan and magenta face lighting.",
      "Red date and promo anchors.",
      "White title glow.",
      "Face lighting should drive the full palette.",
    ],
    avoid: [
      "Reducing the portrait to a background texture.",
      "Adding many small floating elements around the face.",
      "Letting bottom details compete with the eyes/title.",
    ],
    appNotes: [
      "Needs generated or uploaded fantasy portrait art first.",
      "Needs title presets for chrome/block title plus script tag.",
      "Needs clean red date/promo bar components.",
      "Auto-layout should protect the face while allowing title overlap across chest/lower face.",
    ],
  },
  {
    id: "center-hero-subject-title-system",
    name: "Center Hero Subject Title System",
    reference: "Marcus/Sanders center hero reference and sample05.jpg",
    summary:
      "A subject-first poster where the extracted center subject and massive behind-subject title form one dominant composition system.",
    layerStack: [
      "Low-noise dark cinematic background with grain, scratches, and vignette.",
      "Oversized ghost title behind everything, low contrast and partially cropped.",
      "Massive main title behind the subject, textured, tight, and high value.",
      "Extracted center subject large enough to physically occlude the title.",
      "Script accent crossing the subject/title intersection.",
      "Small metadata lanes: date, presenter, side promo, price, QR, and footer.",
      "Bottom torn/paint band only if it grounds the footer without becoming the hero.",
      "Final grade, grain, haze, and texture pass to bind all layers.",
    ],
    textZones: [
      {
        id: "main-title",
        purpose: "Poster architecture and event identity.",
        placement: "Huge behind-subject word across the upper/middle canvas.",
      },
      {
        id: "ghost-title",
        purpose: "Depth and scale echo.",
        placement: "Lower and darker duplicate behind the subject/title system.",
      },
      {
        id: "script-accent",
        purpose: "Expressive name/accent.",
        placement: "Across the subject/title intersection, usually torso height.",
      },
      {
        id: "metadata-lanes",
        purpose: "Event logistics.",
        placement: "Edges and footer only: top-left date, top-center presenter, top-right QR, side rails, bottom venue.",
      },
    ],
    typography: [
      "Main title must be oversized, tightly tracked, and treated as a background shape.",
      "Use texture or rendered title art when plain editable text looks too clean.",
      "Script accent must attach to the subject/title system instead of floating alone.",
      "Metadata should use compact uppercase support type and stay visually secondary.",
    ],
    colorGrade: [
      "Dark charcoal/black base.",
      "White or silver main title values.",
      "One neon accent, usually teal/cyan, for the script and small side copy.",
      "Strong vignette and grain so clean UI layers do not look pasted on.",
    ],
    avoid: [
      "Busy illustrated crowd or city scenes competing with the subject.",
      "Multiple background people, cars, props, or characters fighting the hero.",
      "Main title in front of the subject unless deliberately masked.",
      "Clean stickers, QR, or badges that are brighter than the subject/title system.",
      "Treating the recipe as a list of positions instead of a depth composition.",
    ],
    appNotes: [
      "Use headBehindPortrait with a low headline z-index.",
      "Use head2 as the ghost title or place a rendered title/logo layer behind the cutout.",
      "Use an extracted portrait layer with positive layerOffset above the title.",
      "Use textLayerOffset to keep metadata above the subject while headline layers remain behind it.",
      "Default background should be quiet and textural; user-provided busy scenes need replacement or heavy blur/vignette.",
      "The center hero template should load with this recipe already applied, not as a blank collage starter.",
    ],
  },
  {
    id: "sample02-cinematic-creature-cover",
    name: "Cinematic Creature Cover",
    reference: "sample02.jpg",
    summary:
      "A full cinematic cover image where the snake, face, jungle, glowing eyes, and title are integrated into one dramatic subject composition.",
    layerStack: [
      "Full-bleed cinematic creature/portrait background.",
      "Large creature subject at top with eyes and mouth as focal point.",
      "Human face subject lower center with glowing eyes.",
      "Rendered title graphic embedded between creature and face.",
      "Vertical date and time lanes on left/right.",
      "DJ and offer copy below the face.",
      "Venue name and sponsor/logo footer.",
      "Small embers, foreground leaves, and vignette.",
    ],
    textZones: [
      {
        id: "top-logo-lane",
        purpose: "Brand and age mark.",
        placement: "Small top corner/center logo lane.",
      },
      {
        id: "rendered-title",
        purpose: "Main event identity.",
        placement: "Inside the subject composition between creature and face.",
      },
      {
        id: "side-date-time",
        purpose: "Date and time.",
        placement: "Vertical lanes on left and right edges.",
      },
      {
        id: "bottom-venue-sponsors",
        purpose: "DJ, offer, venue, and sponsors.",
        placement: "Bottom stack and footer logo lane.",
      },
    ],
    typography: [
      "Main title should be rendered artwork, not plain editable text.",
      "Title can mix sharp dimensional letters with brush/script letters.",
      "Side date/time should be vertical, condensed, and high-contrast.",
      "Venue footer should be bold but smaller than title and face.",
    ],
    colorGrade: [
      "Deep teal and black-green jungle shadows.",
      "Warm orange glowing eyes.",
      "Icy cyan title highlights.",
      "Strong vignette with foreground blur.",
      "Eye glow is the primary accent.",
    ],
    avoid: [
      "Building this from separate random stickers.",
      "Using normal text for the main title when rendered title art is needed.",
      "Flattening the creature and face into equal background noise.",
    ],
    appNotes: [
      "Needs AI/generated cinematic cover art first.",
      "Needs rendered title/image layer support for the main title.",
      "Needs side text lane presets for date/time.",
      "Needs foreground atmosphere controls: leaves, embers, blur, vignette.",
    ],
  },
  {
    id: "sample03-luxury-mask-event-layout",
    name: "Luxury Mask Event Layout",
    reference: "sample03.jpg",
    summary:
      "A premium event layout with a brand cluster, elegant title stack, horizontal date/time row, luxury portrait subject, offer band, and venue footer.",
    layerStack: [
      "Full-bleed dark luxury venue/background with purple/green lighting.",
      "Top brand/logo cluster.",
      "Elegant title stack near upper third.",
      "Subtitle/genre row.",
      "Horizontal date/time row with thin divider.",
      "Subtle oversized background text behind the subject.",
      "Extracted subject portrait lower center, cropped large with mask/sunglasses as focal object.",
      "Featuring/DJ row.",
      "Offer band and RSVP/venue footer.",
      "Color arcs, foliage, and soft vignette.",
    ],
    textZones: [
      {
        id: "brand-cluster",
        purpose: "Promoter/venue identity.",
        placement: "Top logo cluster with room around it.",
      },
      {
        id: "title-stack",
        purpose: "Event identity and theme.",
        placement: "Upper third, centered above the portrait.",
      },
      {
        id: "date-time-row",
        purpose: "Date and time.",
        placement: "Horizontal row with divider below the subtitle.",
      },
      {
        id: "offer-footer",
        purpose: "Offer, RSVP, and venue logistics.",
        placement: "Bottom framed band and footer stack.",
      },
    ],
    typography: [
      "Title pairs clean geometric uppercase with script.",
      "Date/time should be large, minimal, and aligned to a horizontal rule.",
      "Offer band should be compact and framed.",
      "Footer text can be dense but must stay in clean lanes.",
    ],
    colorGrade: [
      "Black/purple base.",
      "Emerald/teal accessory accents.",
      "White title clarity.",
      "Gold brand marks.",
      "Dark background preserved behind title.",
    ],
    avoid: [
      "Crowding the title with the brand cluster.",
      "Random date/time placement.",
      "Burying offer and RSVP copy without a lane.",
    ],
    appNotes: [
      "Needs portrait/background image with a luxury object or accessory.",
      "Needs subject isolation so the portrait/accessory can sit above behind-subject typography.",
      "Needs explicit layer controls for background -> ghost title/text -> extracted subject -> foreground info.",
      "Needs geometric plus script title preset.",
      "Needs date/time row component with divider.",
      "Needs offer band/footer component that can hold dense event logistics.",
    ],
  },
  FASHION_CLUB_VERTICAL_RECIPE,
  LADIES_CSS_EDITORIAL_RECIPE,
  RUSH_NIGHT_RECIPE,
  NEON_NIGHT_SHIFT_RECIPE,
  GLOW_IN_THE_DARK_RECIPE,
  PUNTA_CANA_SUNDAYS_RECIPE,
  BADDIES_N_BUNDLES_RECIPE,
  CITY_NIGHTS_RECIPE,
  BLACK_GOLD_PARTY_RECIPE,
  BRUNCH_SATURDAY_RECIPE,
  PULSE_RECIPE,
  SPACE_NEON_RECIPE,
  ZONA_DE_PERREO_RECIPE,
  SUMMER_SUNSET_RECIPE,
  DIABLA_ALL_WHITE_RECIPE,
  RNB_THURSDAYS_RECIPE,
  REGGAE_JAMS_RECIPE,
  AMAPIANO_NIGHT_RECIPE,
  COMO_UNA_BOA_RECIPE,
  I_LOVE_THURSDAY_RECIPE,
  ELITE_MONDAY_RECIPE,
  WE_OUTSIDE_RECIPE,
  BRUNCH_VIBES_RECIPE,
  GREY_RAVE_FESTIVAL_RECIPE,
  DODGE_NIGHT_RIDES_RECIPE,
  LADIES_NIGHT_ROSE_RECIPE,
  GRILLS_AND_GROOVE_RECIPE,
  SOFT_LIFE_RECIPE,
  GIRL_CODE_RECIPE,
  GIRL_CODE_ROSE_RECIPE,
  HONEY_NIGHTS_RECIPE,
  YCEE_LIVE_RECIPE,
  BRUNCH_SUNDAYS_RECIPE,
  BAD_GIRLS_RECIPE,
  BEAT_THERAPY_RECIPE,
  {
    id: "golden-hero-editorial",
    name: "Golden Hero Editorial",
    version: 3,
    reference: "tribal-night-final.html",
    referenceMode: "measurement-only",
    summary:
      "A warm nightlife portrait anchored on the right, balanced by an oversized stacked title, a script gesture, compact event metadata, and an editorial footer built from ordinary editable Coco layers.",
    measurementReference: {
      mode: "measurement-only",
      sourceTemplateId: "tribal-night-final",
      allowedUses: [
        "right-side subject crop and visual mass",
        "stacked headline scale and placement",
        "script-to-headline relationship",
        "date and support-copy hierarchy",
        "structured footer geometry",
        "contrast field and atmosphere placement",
      ],
      deniedUses: [
        "literal event copy",
        "literal uploaded portrait",
        "flattened finished artwork",
        "watermarks or third-party logos",
      ],
      measurements: {
        squareSubjectRect: { x: 42, y: 5, width: 58, height: 95 },
        squareHeadlineRect: { x: 6, y: 7, width: 42, height: 30 },
        squareScriptRect: { x: 6, y: 49, width: 34, height: 13 },
        squareDateRect: { x: 6, y: 66, width: 15, height: 7 },
        squareTimeRect: { x: 6, y: 74, width: 15, height: 2.5 },
        squareLineupRect: { x: 25, y: 66, width: 67, height: 6 },
        squareOptionalDetailsRect: { x: 25, y: 72.5, width: 67, height: 4 },
        squareVenueRect: { x: 6, y: 85, width: 34, height: 8 },
        squareMusicPolicyRect: { x: 50, y: 85, width: 27, height: 8 },
        squareEntryRect: { x: 84, y: 84, width: 11, height: 10 },
        squarePresenterRect: { x: 70, y: 3, width: 24, height: 7 },
        squareSocialRect: { x: 70, y: 8, width: 24, height: 2.4 },
        squareRsvpRect: { x: 6, y: 94, width: 88, height: 3 },
        storySubjectRect: { x: 40, y: 3, width: 60, height: 97 },
        storyHeadlineRect: { x: 6, y: 6, width: 42, height: 29 },
        storyScriptRect: { x: 6, y: 36.5, width: 36, height: 11 },
        storyDateRect: { x: 6, y: 56.5, width: 15, height: 7 },
        storyTimeRect: { x: 6, y: 64, width: 15, height: 2.5 },
        storyLineupRect: { x: 25, y: 57, width: 67, height: 7.5 },
        storyOptionalDetailsRect: { x: 25, y: 67.5, width: 67, height: 5 },
        storyVenueRect: { x: 6, y: 85, width: 34, height: 8 },
        storyMusicPolicyRect: { x: 50, y: 85, width: 27, height: 8 },
        storyEntryRect: { x: 84, y: 84, width: 11, height: 10 },
        storyPresenterRect: { x: 70, y: 3, width: 24, height: 7 },
        storySocialRect: { x: 70, y: 8, width: 24, height: 2.4 },
        storyRsvpRect: { x: 6, y: 94, width: 88, height: 3 },
        headlineMinCanvasSpan: 0.7,
        maximumStrongColors: 2,
        recipeVersion: 3,
      },
    },
    targetAssets: {
      backgroundUrl: "/create-with-coco/subjects/subject02.jpg",
      footerUrl: "/scene-assets/afrobeats-night/gold-particles.svg",
      notes: [
        "The sample portrait is replaceable; user uploads inherit the crop relationship.",
        "Palm shadow, gold particles, contrast curtains, glow, brush line, and footer hairline remain unlocked Coco objects.",
      ],
    },
    composition: {
      referenceMode: "measurement-only",
      referenceTemplateId: "tribal-night-final",
      referenceUses: [
        "role geometry",
        "hierarchy ratios",
        "layer order",
        "contrast treatment",
      ],
      deniedReferenceUses: ["literal copy", "flattened canvas", "literal subject"],
      canvas: {
        format: "story",
        safeArea: { x: 4, y: 3, width: 92, height: 94 },
      },
      roles: [
        { id: "contrastField", kind: "background", purpose: "Feather the contained photo edge into readable narrative space on the left.", required: true, editable: true, bounds: { x: 0, y: 0, width: 49, height: 100 }, layer: "behindSubject" },
        { id: "subjectPrimary", kind: "subject", purpose: "Full-height photographic hero positioned on the right.", required: true, editable: true, bounds: { x: 40, y: 3, width: 60, height: 97 }, layer: "subject" },
        { id: "mainHeadline", kind: "headline", purpose: "Dominant stacked event identity in flat orange-gold type.", required: true, editable: true, bounds: { x: 6, y: 6, width: 42, height: 29 }, layer: "foreground" },
        { id: "scriptHeadline", kind: "headline", purpose: "Expressive weekday gesture with its own compact identity zone beneath the title.", editable: true, bounds: { x: 6, y: 36.5, width: 36, height: 11 }, layer: "foreground" },
        { id: "date", kind: "utility", purpose: "Compact month and ordinal date block anchoring the left calendar column.", editable: true, bounds: { x: 6, y: 56.5, width: 15, height: 7 }, layer: "foreground" },
        { id: "time", kind: "utility", purpose: "Small start-time line aligned directly beneath the date column.", editable: true, bounds: { x: 6, y: 64, width: 15, height: 2.5 }, layer: "foreground" },
        { id: "lineup", kind: "copy", purpose: "Primary performer or host information in the wide support lane beside the date.", editable: true, bounds: { x: 25, y: 57, width: 67, height: 7.5 }, layer: "foreground" },
        { id: "optionalDetails", kind: "copy", purpose: "Optional offer or event facts aligned beneath the lineup lane; hidden when the brief supplies description-only prose.", editable: true, bounds: { x: 25, y: 67.5, width: 67, height: 5 }, layer: "foreground" },
        { id: "venue", kind: "footer", purpose: "Venue and address cell.", editable: true, bounds: { x: 6, y: 85, width: 34, height: 8 }, layer: "utility" },
        { id: "musicPolicy", kind: "footer", purpose: "Compact music-policy cell aligned with the venue.", editable: true, bounds: { x: 50, y: 85, width: 27, height: 8 }, layer: "utility" },
        { id: "entry", kind: "badge", purpose: "Entry price or QR cell.", editable: true, bounds: { x: 84, y: 84, width: 11, height: 10 }, layer: "utility" },
        { id: "presenter", kind: "utility", purpose: "Small promoter lockup in the upper-right corner.", editable: true, bounds: { x: 70, y: 3, width: 24, height: 7 }, layer: "foreground" },
        { id: "social", kind: "utility", purpose: "Social handle attached directly below the presenter.", editable: true, bounds: { x: 70, y: 8, width: 24, height: 2.4 }, layer: "foreground" },
        { id: "rsvp", kind: "footer", purpose: "Low-priority reservation line on the bottom baseline.", editable: true, bounds: { x: 6, y: 94, width: 88, height: 3 }, layer: "utility" },
      ],
      layoutRules: [
        "Determine the hero crop before placing type; keep the face in the upper-right field.",
        "Headline must occupy at least seventy percent of its available text field and normally breaks into two display lines.",
        "Give the OpenScript weekday gesture its own compact identity zone below the headline; it never becomes an unrelated subtitle card or support-copy label.",
        "Treat the event description as design direction, not automatic flyer copy; keep the optional detail block hidden until the user supplies a real offer or fact.",
        "Build the middle information row as two deliberate columns: date and time at left, lineup and optional facts in the wide lane to their right.",
        "Use the left contrast field and bottom veil to integrate typography into the photograph.",
        "Use one editable hairline above the footer cells so venue, music policy, entry, and RSVP read as a single information system.",
        "Footer roles align to one shared baseline and remain visibly subordinate to the title.",
        "Square and Story preserve the same subject-right, title-left, dedicated-weekday, two-column support-band, black-gold campaign logic.",
      ],
      overlapRules: [
        { objects: ["mainHeadline", "face"], allowed: false, response: "Move or tighten the title inside the left narrative field." },
        { objects: ["scriptHeadline", "mainHeadline"], allowed: false, response: "Keep the dedicated weekday zone visibly separate from the title." },
        { objects: ["footer", "subject"], allowed: true, maxCoveragePercent: 25, response: "Use the bottom veil to maintain contrast without hiding the hero." },
      ],
      generationSteps: [
        "Analyze and crop the uploaded hero into the right-side visual-mass target.",
        "Add the editable left contrast curtain, bottom veil, warm glow, foliage shadow, particles, and brush line.",
        "Fit the event identity as a huge stacked Coolvetica Hv Comp headline in flat orange-gold, without metallic, bevel, glow, or 3D effects.",
        "Place the script accent in its dedicated weekday zone, then anchor the date/time column beneath it.",
        "Place performer copy in the wide support lane beside the calendar column and keep footer cells on their stored guides.",
        "Check face protection, mobile hierarchy, and Square/Story campaign consistency.",
      ],
    },
    layerStack: [
      "Uploaded full-bleed photograph.",
      "Warm haze and atmospheric foliage/particles.",
      "Editable left contrast curtain and bottom veil.",
      "Stacked condensed headline and script gesture.",
      "Date, time, performer information, and structured factual footer.",
    ],
    textZones: [
      { id: "stacked-title", purpose: "Primary event identity.", placement: "Oversized in the upper-left narrative field." },
      { id: "script-gesture", purpose: "Weekday identity accent.", placement: "In a compact dedicated zone beneath the title." },
      { id: "date-support", purpose: "Date, time, primary talent, and optional facts.", placement: "A narrow calendar column on the left paired with a wide support lane to its right." },
      { id: "footer-cells", purpose: "Venue, guests, sponsors, QR, or entry.", placement: "One aligned bottom communication row." },
    ],
    typography: [
      "Use Coolvetica Hv Comp for the stacked headline, set in a flat #E89300 orange-gold with no metallic, bevel, glow, gradient, or 3D treatment.",
      "Use OpenScript for the weekday gesture and keep it visually related to, but spatially separate from, the headline.",
      "Use LEMONMILK for all supporting facts and footer cells.",
      "Keep headline line height around 0.72 with tight tracking.",
    ],
    colorGrade: [
      "Deep near-black contrast field.",
      "Flat orange-gold #E89300 headline.",
      "One vivid orange script accent.",
      "Warm skin-preserving grade with strong vignette and restrained grain.",
    ],
    avoid: [
      "Shrinking the headline into a narrow generic text box.",
      "Centering every text role over the subject.",
      "Using neon colors unrelated to the photograph.",
      "Adding chrome, metallic gradients, bevels, glows, or generic headline effects.",
      "Printing description prose as event facts when no offer was supplied.",
      "Scattering footer facts at unrelated heights.",
      "Flattening the contrast, atmosphere, or copy into the background image.",
    ],
    appNotes: [
      "This recipe is implemented by the golden-hero-editorial Coco art direction and composition family.",
      "Every generated atmosphere and contrast object is unlocked and survives .nflyer export.",
      "The original 4:5 reference is adapted into Coco's supported Square and 9:16 Story campaign formats.",
    ],
  },
  {
    id: "sample04-giant-face-vertical-type-poster",
    name: "Giant Face Vertical Type Poster",
    reference: "sample04.jpg",
    summary:
      "A bold design-system poster where a giant cropped face anchors the flyer and oversized vertical type becomes the central layout structure.",
    layerStack: [
      "Full-bleed saturated portrait background with giant cropped face.",
      "Sunglasses/lens copy integrated into the portrait.",
      "Small top date/time card.",
      "Massive stacked vertical title block over chest/center.",
      "Red date card on left side.",
      "Right detail stack.",
      "Bottom music/hypeman row.",
      "Venue footer bar.",
    ],
    textZones: [
      {
        id: "lens-copy",
        purpose: "Brand/theme detail.",
        placement: "Inside sunglasses lenses.",
      },
      {
        id: "main-vertical-title",
        purpose: "Dominant event identity.",
        placement: "Huge stacked type through the center.",
      },
      {
        id: "date-card",
        purpose: "Date/time.",
        placement: "Red card on top/right or left side depending on crop.",
      },
      {
        id: "details-footer",
        purpose: "Attractions, performers, and venue.",
        placement: "Right stack plus bottom rows and venue bar.",
      },
    ],
    typography: [
      "Main title should be ultra-condensed, huge, stacked, and tightly aligned.",
      "Lens copy should be script and follow the lens placement.",
      "Date card text should be tall condensed white on red.",
      "Bottom performer/venue copy should be clean block text.",
    ],
    colorGrade: [
      "Hot pink/red background.",
      "Warm gold title.",
      "Black bottom field.",
      "Glossy skin highlights.",
      "Gold accessories should connect to title color.",
    ],
    avoid: [
      "Making the face small.",
      "Scattering text when the type block should be the structure.",
      "Using standard horizontal headline placement for this recipe.",
    ],
    appNotes: [
      "Needs aggressive portrait crop controls.",
      "Needs huge stacked type presets.",
      "Needs lens/text placement controls for sunglasses copy.",
      "Needs red date card and right detail stack components.",
    ],
  },
] as const;

const AUTHORITATIVE_VISUAL_RECIPE_IDS = new Set([
  ...GALLERY_TEMPLATE_RECIPES.map((recipe) => recipe.id),
  "summer-sunset",
  "diabla-all-white",
  "rnb-thursdays",
  "zona-de-perreo",
  "reggae-jams",
  "amapiano-night",
  "como-una-boa",
  "i-love-thursday",
  "elite-monday",
  "we-outside",
  "pulse",
  "space-neon",
  "brunch-saturday",
  "brunch-vibes",
  "fashion-club-vertical",
  "ladies-css-editorial",
  "rush-night-css",
  "neon-night-shift",
  "glow-in-the-dark",
  "punta-cana-sundays",
  "baddies-n-bundles",
  "city-nights",
  "black-gold-party",
  "grey-rave-festival",
  "dodge-night-rides",
  "ladies-night-rose",
  "grills-and-groove",
  "soft-life",
  "girl-code",
  "girl-code-rose",
  "honey-nights",
  "ycee-live",
  "brunch-sundays",
  "bad-girls",
  "beat-therapy",
]);

// Removed recipes stay available only for provenance recovery of already-saved
// projects. They are deliberately excluded from getVisualRecipe(), so Coco
// cannot select them for new concepts or previews.
const ARCHIVED_VISUAL_RECIPE_IDS = new Set(["golden-hero-editorial", ...REMOVED_COCO_RECIPE_IDS]);

function getArchivedVisualRecipe(id: string): VisualRecipe | undefined {
  if (!ARCHIVED_VISUAL_RECIPE_IDS.has(id)) return undefined;
  return VISUAL_RECIPE_CATALOG.find((recipe) => recipe.id === id);
}

export const VISUAL_RECIPES: ReadonlyArray<VisualRecipe> =
  VISUAL_RECIPE_CATALOG.filter((recipe) =>
    AUTHORITATIVE_VISUAL_RECIPE_IDS.has(recipe.id) && !ARCHIVED_VISUAL_RECIPE_IDS.has(recipe.id)
  );

export function getVisualRecipe(id: string): VisualRecipe | undefined {
  return VISUAL_RECIPES.find((recipe) => recipe.id === id);
}

/**
 * Durable recipe provenance written onto an editable Coco canvas.
 *
 * Keep this deliberately smaller than TemplateBase.  The resolver is used at
 * routing boundaries where importing the full editor type would create a
 * dependency cycle (recipe registry -> template runtime -> recipe registry).
 */
export type CocoVisualRecipeProvenanceInput = Readonly<{
  cocoVisualRecipeId?: unknown;
  cocoVisualRecipeMaterializedVersion?: unknown;
  cocoVisualRecipeVersion?: unknown;
}>;

export type ResolvedCocoVisualRecipeProvenance = Readonly<{
  declaredVersion: number;
  isCurrent: boolean;
  isMaterialized: boolean;
  materializedVersion: number;
  recipe: VisualRecipe;
  registryVersion: number;
}>;

const positiveRecipeVersion = (value: unknown): number | null => {
  const version = Number(value);
  return Number.isFinite(version) && version > 0 ? version : null;
};

/**
 * Resolve a variant's visual-recipe identity through the central registry.
 *
 * This is intentionally ID/provenance based.  Callers must not grow another
 * list of flyer-specific predicates whenever a CSS master becomes an editable
 * recipe.  `isMaterialized` is true only when the variant records that the
 * declared recipe version actually built the canvas; an ID by itself is not
 * enough to claim layout/palette/asset authority.
 *
 * Older authored projects remain recognizable after a recipe version bump.
 * They can therefore bypass generic layout while their materializer performs
 * a controlled upgrade.  `isCurrent` tells the upgrade route whether that is
 * necessary.
 */
export function resolveCocoVisualRecipeProvenance(
  value: unknown
): ResolvedCocoVisualRecipeProvenance | null {
  if (!value || typeof value !== "object") return null;
  const variant = value as CocoVisualRecipeProvenanceInput;
  const recipeId = String(variant.cocoVisualRecipeId ?? "").trim();
  if (!recipeId) return null;

  const recipe = getVisualRecipe(recipeId) ?? getArchivedVisualRecipe(recipeId);
  if (!recipe) return null;

  const registryVersion = positiveRecipeVersion(recipe.version) ?? 1;
  const declaredVersion = positiveRecipeVersion(variant.cocoVisualRecipeVersion) ?? 0;
  const materializedVersion =
    positiveRecipeVersion(variant.cocoVisualRecipeMaterializedVersion) ?? 0;
  const isMaterialized =
    declaredVersion > 0 && materializedVersion >= declaredVersion;

  return {
    declaredVersion,
    isCurrent:
      isMaterialized &&
      declaredVersion === registryVersion &&
      materializedVersion >= registryVersion,
    isMaterialized,
    materializedVersion,
    recipe,
    registryVersion,
  };
}

/** Return the registered recipe only after it has authored this canvas. */
export function getMaterializedCocoVisualRecipe(
  value: unknown
): VisualRecipe | undefined {
  const provenance = resolveCocoVisualRecipeProvenance(value);
  return provenance?.isMaterialized ? provenance.recipe : undefined;
}
