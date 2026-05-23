export type VisualRecipeTextZone = {
  id: string;
  purpose: string;
  placement: string;
};

export type VisualRecipe = {
  id: string;
  name: string;
  reference: string;
  summary: string;
  layerStack: string[];
  textZones: VisualRecipeTextZone[];
  typography: string[];
  colorGrade: string[];
  avoid: string[];
  appNotes: string[];
};

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

export const VISUAL_RECIPES: ReadonlyArray<VisualRecipe> = [
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

export function getVisualRecipe(id: string): VisualRecipe | undefined {
  return VISUAL_RECIPES.find((recipe) => recipe.id === id);
}
