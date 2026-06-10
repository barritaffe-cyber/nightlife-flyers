import { TEMPLATE_GALLERY, type TemplateSpec } from "./templates";

export const NIGHTLIFE_FLYERS_IDENTITY =
  "Nightlife Flyers is a flyer design platform built specifically for nightlife promoters, DJs, lounges, clubs, bars, and event marketers.";

export type CategoryLandingPage = {
  slug: string;
  title: string;
  h1: string;
  eyebrow: string;
  metaDescription: string;
  intro: string;
  audience: string;
  keywords: string[];
  bullets: string[];
  useCases: string[];
  templateIds: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export type TemplateLandingPage = {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  intro: string;
  audience: string;
  keywords: string[];
  useCases: string[];
  template: TemplateSpec;
};

export const CATEGORY_LANDING_PAGES: CategoryLandingPage[] = [
  {
    slug: "nightclub-flyer-maker",
    title: "Nightclub Flyer Maker",
    h1: "Create Professional Nightclub Flyers in Minutes",
    eyebrow: "Nightclub flyer maker",
    metaDescription:
      "Create nightclub flyers online with editable club templates, square post and story formats, AI backgrounds, cutouts, typography, and clean exports.",
    intro:
      "Build high-impact nightclub flyers for weekly events, guest DJs, VIP nights, bottle service, and special promotions. Start from club-ready layouts, customize every layer, and export polished social graphics fast.",
    audience:
      "Built for club promoters, venue marketers, nightlife teams, DJs, and social media managers who need reliable flyer output every week.",
    keywords: [
      "nightclub flyer maker",
      "club flyer maker",
      "nightlife flyer templates",
      "club event flyer",
      "AI nightclub flyer maker",
    ],
    bullets: [
      "Editable club flyer templates for posts and stories",
      "AI-assisted backgrounds, subject cutouts, flares, and textures",
      "Typography presets built for bold nightlife headlines",
      "Fast PNG and JPG exports for social promotion",
    ],
    useCases: [
      "Friday and Saturday club nights",
      "Guest DJ announcements",
      "VIP table and bottle service promotions",
      "Holiday and themed nightlife events",
    ],
    templateIds: ["secret_friday", "luxe", "new-york", "miami2", "la-lux", "blk_tie"],
    faqs: [
      {
        question: "How do I make a nightclub flyer online?",
        answer:
          "Choose a nightlife flyer template, update the headline, date, venue, DJ, colors, and images, then export a square post or vertical story for social promotion.",
      },
      {
        question: "What should a nightclub flyer include?",
        answer:
          "A strong event name, date, time, venue, music style, host or DJ, ticket or RSVP details, and a visual style that matches the club audience.",
      },
    ],
  },
  {
    slug: "dj-flyer-maker",
    title: "DJ Flyer Maker",
    h1: "Design DJ Flyers for Club Nights, Sets, and Guest Appearances",
    eyebrow: "DJ flyer maker",
    metaDescription:
      "Make DJ flyers online with editable nightlife templates, bold headline effects, AI backgrounds, story formats, and instant social exports.",
    intro:
      "Create flyers for DJ sets, guest appearances, mixes, afterhours events, and weekly residencies. Nightlife Flyers gives DJs and promoters fast layouts with readable type, event details, and club-ready visual energy.",
    audience:
      "Built for DJs, managers, party promoters, clubs, and artist teams promoting live sets and nightlife appearances.",
    keywords: [
      "DJ flyer maker",
      "DJ event flyer",
      "DJ flyer template",
      "AI DJ flyer maker",
      "club DJ flyer",
    ],
    bullets: [
      "Square and story templates for DJ announcements",
      "Neon, glass, chrome, halftone, and 3D headline styles",
      "Fast flyer edits for weekly residencies and guest sets",
      "Upload logos, artist images, and social handles",
    ],
    useCases: [
      "Guest DJ flyers",
      "Resident DJ weekly promos",
      "Afterhours and techno events",
      "Artist and DJ lineup announcements",
    ],
    templateIds: ["square_center_hero_nightlife", "edm_stage_co2", "techno_warehouse", "dnb_bunker", "hiphop_graffiti"],
    faqs: [
      {
        question: "Can I make both DJ post and story flyers?",
        answer:
          "Yes. Nightlife Flyers supports editable square posts and vertical story formats so DJs can promote events across Instagram, TikTok, and other social channels.",
      },
      {
        question: "Can I add a DJ photo or logo?",
        answer:
          "Yes. Upload a photo, logo, or subject cutout, then adjust scale, blur, rotation, shadow, and layer order inside the editor.",
      },
    ],
  },
  {
    slug: "party-flyer-maker",
    title: "Party Flyer Maker",
    h1: "Make Party Flyers That Look Ready for Social Media",
    eyebrow: "Party flyer maker",
    metaDescription:
      "Create party flyers online for birthdays, themed nights, throwback parties, day parties, and club events with editable templates and quick exports.",
    intro:
      "Start with a party flyer template, change the copy and colors, add graphics or cutouts, and export a polished design. The workflow is built for quick event promotion without starting from a blank canvas.",
    audience:
      "Built for party hosts, promoters, DJs, bars, lounges, and creators who need a finished flyer quickly.",
    keywords: [
      "party flyer maker",
      "birthday flyer maker",
      "event party flyer",
      "throwback party flyer",
      "AI party flyer maker",
    ],
    bullets: [
      "Templates for birthdays, throwbacks, day parties, and theme nights",
      "Editable date, venue, details, pricing, and social graphics",
      "Designed for Instagram posts and stories",
      "Fast visual changes with palettes, backgrounds, and effects",
    ],
    useCases: [
      "Birthday parties",
      "Throwback and old-school nights",
      "Day parties and brunch events",
      "Holiday and themed parties",
    ],
    templateIds: ["sugar_rush", "throwback_cassette", "disco_mirrorball", "mardi_gras", "day_party", "summer_splash"],
    faqs: [
      {
        question: "What size should a party flyer be?",
        answer:
          "Most promoters need a square post for feeds and a vertical story for Instagram and TikTok. Nightlife Flyers includes both formats on supported templates.",
      },
      {
        question: "Can I make a flyer without design experience?",
        answer:
          "Yes. Start from a finished nightlife template, replace the event details, and export the design without building the layout from scratch.",
      },
    ],
  },
  {
    slug: "ladies-night-flyer-maker",
    title: "Ladies Night Flyer Maker",
    h1: "Create Ladies Night Flyers With a Polished Club Look",
    eyebrow: "Ladies night flyer maker",
    metaDescription:
      "Design ladies night flyers online with fashion-forward nightlife templates, neon visuals, story layouts, and editable event details.",
    intro:
      "Promote ladies night events with templates that already understand nightlife composition: bold headline placement, fashion-driven visuals, readable details, and social-first formats.",
    audience:
      "Built for lounges, bars, clubs, promoters, DJs, and event teams promoting ladies night offers and upscale social events.",
    keywords: [
      "ladies night flyer maker",
      "ladies night flyer template",
      "girls night flyer",
      "club ladies night flyer",
      "AI ladies night flyer",
    ],
    bullets: [
      "Fashion-forward nightlife flyer templates",
      "Editable offers, dates, venue details, and social handles",
      "Subject cutout tools for portraits and host images",
      "Post and story exports for event promotion",
    ],
    useCases: [
      "Ladies free before a set time",
      "Cocktail specials and lounge events",
      "R&B and dancehall nights",
      "VIP table and bottle service promotions",
    ],
    templateIds: ["ladies_night_center_hero", "rnb_velvet", "luxe", "bottle_service", "kpop_pastel_led"],
    faqs: [
      {
        question: "What makes a good ladies night flyer?",
        answer:
          "Clear event details, a polished mood, strong contrast, readable offer copy, and visuals that match the venue and audience.",
      },
      {
        question: "Can I customize a ladies night template?",
        answer:
          "Yes. You can edit the headline, details, venue, colors, background, portrait cutout, graphics, and export format.",
      },
    ],
  },
  {
    slug: "afrobeats-flyer-maker",
    title: "Afrobeats Flyer Maker",
    h1: "Design Afrobeats Flyers for Rooftop, Lounge, and Club Events",
    eyebrow: "Afrobeats flyer maker",
    metaDescription:
      "Create Afrobeats flyers online with tropical nightlife templates, bold typography, warm color palettes, story formats, and instant exports.",
    intro:
      "Build flyers for Afrobeats nights, rooftop parties, tropical club events, and DJ sets with layouts designed around rhythm, color, and nightlife readability.",
    audience:
      "Built for Afrobeats promoters, DJs, lounges, rooftops, clubs, and event brands creating social promo graphics.",
    keywords: [
      "Afrobeats flyer maker",
      "Afrobeats flyer template",
      "Afrobeat party flyer",
      "rooftop flyer maker",
      "tropical club flyer",
    ],
    bullets: [
      "Warm tropical and rooftop flyer styles",
      "Editable music, venue, date, and RSVP details",
      "Square post and vertical story workflows",
      "Fast export for weekly social promotion",
    ],
    useCases: [
      "Afrobeats rooftop parties",
      "Dancehall and Afrobeats club nights",
      "Tropical lounge events",
      "Guest DJ and artist showcases",
    ],
    templateIds: ["afrobeat_rooftop", "latin_street_tropical", "miami_heat", "summer_splash", "yacht_escape"],
    faqs: [
      {
        question: "Can I make an Afrobeats flyer for Instagram?",
        answer:
          "Yes. Use a square post or vertical story template, customize the event details, then export an image for social platforms.",
      },
      {
        question: "What should an Afrobeats flyer include?",
        answer:
          "Include the event name, DJ or host, venue, date, music styles, RSVP details, and a visual palette that feels warm, rhythmic, and energetic.",
      },
    ],
  },
  {
    slug: "latin-night-flyer-maker",
    title: "Latin Night Flyer Maker",
    h1: "Make Latin Night Flyers for Salsa, Reggaeton, and Tropical Events",
    eyebrow: "Latin night flyer maker",
    metaDescription:
      "Create Latin night flyers online for salsa, reggaeton, bachata, tropical parties, lounges, and club events with editable templates.",
    intro:
      "Use tropical street, mojito, and nightlife templates to promote Latin nights with clear details, bright color, and social-ready formats.",
    audience:
      "Built for Latin night promoters, DJs, bars, lounges, clubs, and event marketers.",
    keywords: [
      "Latin night flyer maker",
      "Latin party flyer",
      "salsa flyer template",
      "reggaeton flyer maker",
      "tropical flyer maker",
    ],
    bullets: [
      "Templates for salsa, reggaeton, bachata, and tropical nights",
      "Editable social post and story formats",
      "Bright palette controls and nightlife text effects",
      "Export-ready designs for bars and clubs",
    ],
    useCases: [
      "Salsa and bachata nights",
      "Reggaeton parties",
      "Tropical cocktail events",
      "Latin DJ sets and venue promos",
    ],
    templateIds: ["latin_street_tropical", "kpop_pastel_led", "miami2", "mardi_gras", "martini"],
    faqs: [
      {
        question: "Can I make a reggaeton or salsa flyer?",
        answer:
          "Yes. Start with a Latin or tropical template, update the event details, and export a social-ready flyer.",
      },
      {
        question: "Can I add drink specials and venue details?",
        answer:
          "Yes. The editor supports editable body copy, venue text, social handles, icons, and additional graphic elements.",
      },
    ],
  },
  {
    slug: "lounge-flyer-maker",
    title: "Lounge Flyer Maker",
    h1: "Create Lounge Flyers for VIP Nights, Cocktails, and Upscale Events",
    eyebrow: "Lounge flyer maker",
    metaDescription:
      "Make lounge flyers online with editable templates for VIP events, cocktail nights, bottle service, R&B lounges, and upscale nightlife promos.",
    intro:
      "Design flyers for lounges, bars, cocktail events, and VIP nights with polished templates, elegant type, bottle service graphics, and story-ready exports.",
    audience:
      "Built for lounges, bars, VIP hosts, promoters, venue marketers, and hospitality teams.",
    keywords: [
      "lounge flyer maker",
      "VIP lounge flyer",
      "cocktail flyer maker",
      "bottle service flyer",
      "bar flyer maker",
    ],
    bullets: [
      "Upscale lounge, cocktail, and bottle service templates",
      "Editable offers, table details, RSVP copy, and venue information",
      "Luxury typography and color grading controls",
      "Fast exports for Instagram and event promotion",
    ],
    useCases: [
      "VIP lounge nights",
      "Bottle service promotions",
      "Cocktail specials",
      "R&B and upscale social events",
    ],
    templateIds: ["bottle_service", "martini", "kpop_pastel_led", "rnb_velvet", "luxe", "blk_tie"],
    faqs: [
      {
        question: "Can I make a flyer for bottle service?",
        answer:
          "Yes. Use a bottle service or VIP lounge template, edit the table details and offers, then export a polished social flyer.",
      },
      {
        question: "Can I make flyers for bars and lounges?",
        answer:
          "Yes. Nightlife Flyers is designed for clubs, bars, lounges, DJs, and event promoters.",
      },
    ],
  },
  {
    slug: "hip-hop-flyer-maker",
    title: "Hip Hop Flyer Maker",
    h1: "Create Hip Hop Flyers for Club Nights, Showcases, and DJ Events",
    eyebrow: "Hip hop flyer maker",
    metaDescription:
      "Make hip hop flyers online for club nights, artist showcases, DJ events, open mics, throwback parties, and urban nightlife promotion.",
    intro:
      "Create hip hop flyers with bold type, urban textures, artist-focused layouts, and social-ready formats. Start from nightlife templates built for showcases, DJs, MCs, open mics, and weekly club promotion.",
    audience:
      "Built for hip hop promoters, DJs, artists, venues, managers, open mic hosts, and streetwear or nightlife brands.",
    keywords: [
      "hip hop flyer maker",
      "hip hop flyer template",
      "rap flyer maker",
      "artist showcase flyer",
      "urban flyer maker",
    ],
    bullets: [
      "Urban flyer templates for hip hop and rap events",
      "Editable artist names, lineups, venues, dates, and social handles",
      "Chrome, graffiti, halftone, and gritty nightlife effects",
      "Square post and story exports for fast promotion",
    ],
    useCases: [
      "Hip hop club nights",
      "Artist showcases",
      "Open mic events",
      "Throwback and old-school parties",
    ],
    templateIds: ["hiphop_graffiti", "hiphop_lowrider", "industrial_muscle_hero", "throwback_cassette", "atlanta"],
    faqs: [
      {
        question: "How do I make a hip hop flyer?",
        answer:
          "Choose a hip hop or urban flyer template, add the artist, DJ, venue, date, and ticket details, then export a square post or vertical story.",
      },
      {
        question: "Can I promote an artist showcase with Nightlife Flyers?",
        answer:
          "Yes. The editor supports artist names, lineup copy, portrait cutouts, social handles, venue details, and export formats for social promotion.",
      },
    ],
  },
  {
    slug: "bottle-service-flyer-maker",
    title: "Bottle Service Flyer Maker",
    h1: "Design Bottle Service Flyers for VIP Tables and Club Nights",
    eyebrow: "Bottle service flyer maker",
    metaDescription:
      "Create bottle service flyers online for VIP tables, champagne nights, lounge events, club promos, and upscale nightlife offers.",
    intro:
      "Promote VIP tables, bottle packages, champagne nights, and premium lounge events with templates built for luxury nightlife marketing and clean social exports.",
    audience:
      "Built for VIP hosts, club promoters, lounges, bars, nightlife teams, and hospitality marketers selling table reservations.",
    keywords: [
      "bottle service flyer maker",
      "bottle service flyer template",
      "VIP table flyer",
      "champagne flyer maker",
      "club table flyer",
    ],
    bullets: [
      "VIP and bottle service flyer templates",
      "Editable table offers, RSVP details, and venue copy",
      "Luxury color grading, flares, and typography presets",
      "Post and story exports for nightlife promotion",
    ],
    useCases: [
      "VIP table reservations",
      "Champagne nights",
      "Birthday table packages",
      "Upscale lounge promotions",
    ],
    templateIds: ["bottle_service", "luxe", "martini", "blk_tie", "rnb_velvet"],
    faqs: [
      {
        question: "What should a bottle service flyer include?",
        answer:
          "Include the venue, date, VIP table offer, bottle package, host or RSVP contact, music style, and any dress code or arrival details.",
      },
      {
        question: "Can I make a VIP table flyer for Instagram?",
        answer:
          "Yes. Nightlife Flyers supports square post and vertical story exports for Instagram and other social platforms.",
      },
    ],
  },
  {
    slug: "rooftop-party-flyer-maker",
    title: "Rooftop Party Flyer Maker",
    h1: "Make Rooftop Party Flyers for Sunset, Afrobeats, and Lounge Events",
    eyebrow: "Rooftop flyer maker",
    metaDescription:
      "Create rooftop party flyers online for sunset parties, Afrobeats events, lounge nights, day parties, and tropical nightlife promotion.",
    intro:
      "Design rooftop party flyers with warm palettes, skyline energy, tropical visuals, and readable event details for social promotion.",
    audience:
      "Built for rooftops, lounges, DJs, promoters, brunch parties, sunset sessions, and venue marketers.",
    keywords: [
      "rooftop party flyer maker",
      "rooftop flyer template",
      "sunset party flyer",
      "Afrobeats rooftop flyer",
      "day party flyer maker",
    ],
    bullets: [
      "Rooftop and sunset flyer templates",
      "Warm tropical backgrounds and skyline-ready layouts",
      "Editable DJ, venue, RSVP, and date details",
      "Square and story formats for social promotion",
    ],
    useCases: [
      "Afrobeats rooftop parties",
      "Sunset sessions",
      "Rooftop brunch events",
      "Outdoor lounge nights",
    ],
    templateIds: ["afrobeat_rooftop", "day_party", "sunset_yacht", "yacht_escape", "summer_splash"],
    faqs: [
      {
        question: "Can I make a rooftop party flyer quickly?",
        answer:
          "Yes. Start from a rooftop or tropical template, replace the event details, and export a finished post or story flyer.",
      },
      {
        question: "What style works for rooftop flyers?",
        answer:
          "Rooftop flyers usually work best with warm color, skyline or sunset imagery, clear event details, and a premium social-first layout.",
      },
    ],
  },
  {
    slug: "karaoke-flyer-maker",
    title: "Karaoke Flyer Maker",
    h1: "Create Karaoke Night Flyers for Bars, Lounges, and Weekly Events",
    eyebrow: "Karaoke flyer maker",
    metaDescription:
      "Make karaoke flyers online for bar nights, open mic events, weekly lounge promos, neon mic nights, and social media promotion.",
    intro:
      "Promote karaoke nights with bright, readable templates built for bars, lounges, hosts, DJs, and weekly event schedules.",
    audience:
      "Built for bars, lounges, karaoke hosts, DJs, venues, and promoters running recurring karaoke events.",
    keywords: [
      "karaoke flyer maker",
      "karaoke flyer template",
      "karaoke night flyer",
      "open mic flyer maker",
      "bar event flyer",
    ],
    bullets: [
      "Neon karaoke and mic-night flyer templates",
      "Editable host, venue, time, drink specials, and RSVP copy",
      "Readable layouts for weekly recurring events",
      "Fast social exports for bar promotion",
    ],
    useCases: [
      "Karaoke nights",
      "Open mic events",
      "Bar weekly promos",
      "Host and DJ announcements",
    ],
    templateIds: ["karaokee", "kpop_pastel_led", "martini", "rnb_velvet", "secret_friday"],
    faqs: [
      {
        question: "Can I make a weekly karaoke flyer?",
        answer:
          "Yes. Use a karaoke template, update the weekday, time, host, and venue details, then save or export the design for recurring promotion.",
      },
      {
        question: "Can karaoke flyers include drink specials?",
        answer:
          "Yes. You can add or edit drink specials, venue details, social icons, and event rules in the flyer editor.",
      },
    ],
  },
  {
    slug: "rave-flyer-maker",
    title: "Rave Flyer Maker",
    h1: "Design Rave and EDM Flyers for Warehouse, Club, and Afterhours Events",
    eyebrow: "Rave flyer maker",
    metaDescription:
      "Create rave flyers online for EDM nights, techno events, warehouse parties, afterhours sets, and neon club promotion.",
    intro:
      "Make high-energy rave flyers with neon backgrounds, fog, lasers, bold typography, and social-ready layouts for EDM and underground events.",
    audience:
      "Built for EDM promoters, DJs, techno crews, warehouse event teams, clubs, and afterhours brands.",
    keywords: [
      "rave flyer maker",
      "EDM flyer template",
      "techno flyer maker",
      "warehouse party flyer",
      "afterhours flyer maker",
    ],
    bullets: [
      "EDM, techno, and warehouse flyer templates",
      "Neon, fog, tunnel, and stage-inspired visuals",
      "Editable lineup, DJ, venue, date, and ticket details",
      "Square post and story exports for social promotion",
    ],
    useCases: [
      "Rave events",
      "Techno warehouse nights",
      "EDM club shows",
      "Afterhours parties",
    ],
    templateIds: ["edm_tunnel", "edm_stage_co2", "techno_warehouse", "dnb_bunker", "sugar_rush"],
    faqs: [
      {
        question: "Can I make an EDM flyer online?",
        answer:
          "Yes. Pick an EDM, rave, or techno template, edit the lineup and event details, then export the flyer for social promotion.",
      },
      {
        question: "What should a rave flyer include?",
        answer:
          "Include the event name, lineup, venue, date, start time, ticket details, age policy if needed, and a visual style that matches the music.",
      },
    ],
  },
  {
    slug: "birthday-flyer-maker",
    title: "Birthday Flyer Maker",
    h1: "Create Birthday Party Flyers for Club Nights and Private Events",
    eyebrow: "Birthday flyer maker",
    metaDescription:
      "Make birthday flyers online for club birthdays, VIP tables, private parties, brunch events, and social media promotion.",
    intro:
      "Create birthday flyers with bold event copy, host details, RSVP info, party visuals, and post plus story formats ready for social platforms.",
    audience:
      "Built for birthday hosts, promoters, DJs, clubs, lounges, brunch parties, and VIP table teams.",
    keywords: [
      "birthday flyer maker",
      "birthday flyer template",
      "club birthday flyer",
      "birthday bash flyer",
      "party flyer maker",
    ],
    bullets: [
      "Birthday and party flyer templates",
      "Editable host, age, venue, date, RSVP, and package details",
      "Club, lounge, brunch, and private event styles",
      "Download social-ready post and story graphics",
    ],
    useCases: [
      "Birthday bash flyers",
      "VIP birthday table promos",
      "Birthday brunch events",
      "Private party announcements",
    ],
    templateIds: ["sugar_rush", "mardi_gras", "day_party", "bottle_service", "luxe"],
    faqs: [
      {
        question: "Can I make a club birthday flyer?",
        answer:
          "Yes. Start from a birthday or VIP nightlife template, add the host name, venue, date, and RSVP details, then export it for social media.",
      },
      {
        question: "Can I include bottle service or table details?",
        answer:
          "Yes. You can add table packages, bottle service details, guest list copy, and contact information.",
      },
    ],
  },
  {
    slug: "rnb-flyer-maker",
    title: "R&B Flyer Maker",
    h1: "Make R&B Flyers for Lounge Nights, Slow Jams, and DJ Events",
    eyebrow: "R&B flyer maker",
    metaDescription:
      "Create R&B flyers online for lounge nights, slow jams, brunch events, DJ sets, and upscale nightlife promotion.",
    intro:
      "Design R&B flyers with smooth lounge visuals, premium type, smoky textures, and social-first layouts for DJs, lounges, bars, and promoters.",
    audience:
      "Built for R&B promoters, lounges, DJs, bars, brunch teams, and nightlife marketers.",
    keywords: [
      "R&B flyer maker",
      "R&B flyer template",
      "slow jams flyer",
      "lounge flyer maker",
      "RNB night flyer",
    ],
    bullets: [
      "R&B, lounge, and slow-jam flyer templates",
      "Editable DJ, host, venue, date, and RSVP copy",
      "Luxury and smoky visual styles for grown nightlife events",
      "Post and story exports for Instagram promotion",
    ],
    useCases: [
      "R&B lounge nights",
      "Slow jams events",
      "Brunch and day parties",
      "DJ tribute nights",
    ],
    templateIds: ["rnb_velvet", "luxe", "bottle_service", "martini", "ladies_night_center_hero"],
    faqs: [
      {
        question: "Can I make a flyer for an R&B night?",
        answer:
          "Yes. Use an R&B, lounge, or VIP template, edit the details, and export a polished post or story flyer.",
      },
      {
        question: "What style works for R&B flyers?",
        answer:
          "R&B flyers often work well with warm light, smoky backgrounds, elegant typography, clear event details, and a premium lounge feel.",
      },
    ],
  },
  {
    slug: "disco-party-flyer-maker",
    title: "Disco Party Flyer Maker",
    h1: "Create Disco Party Flyers for Throwback and Theme Nights",
    eyebrow: "Disco flyer maker",
    metaDescription:
      "Make disco party flyers online for throwback nights, funk events, retro club parties, theme nights, and social media promotion.",
    intro:
      "Promote disco nights with retro color, mirrorball energy, bold event titles, and social-ready flyer formats.",
    audience:
      "Built for promoters, DJs, bars, clubs, lounges, and event teams running retro, funk, soul, and throwback parties.",
    keywords: [
      "disco party flyer maker",
      "disco flyer template",
      "throwback flyer maker",
      "retro party flyer",
      "funk night flyer",
    ],
    bullets: [
      "Disco, retro, and throwback flyer templates",
      "Editable theme, DJ, venue, date, and ticket copy",
      "Vintage color and nightlife-ready composition",
      "Export square posts and vertical stories",
    ],
    useCases: [
      "Disco parties",
      "Funk and soul nights",
      "Throwback events",
      "Retro theme parties",
    ],
    templateIds: ["disco_mirrorball", "throwback_cassette", "mardi_gras", "day_party", "secret_friday"],
    faqs: [
      {
        question: "Can I make a disco flyer without design experience?",
        answer:
          "Yes. Start from a disco or throwback template, replace the event details, and export a finished flyer.",
      },
      {
        question: "Can I use the flyer for Instagram stories?",
        answer:
          "Yes. Supported templates can be opened as square posts or vertical story formats for social promotion.",
      },
    ],
  },
  {
    slug: "yacht-party-flyer-maker",
    title: "Yacht Party Flyer Maker",
    h1: "Design Yacht Party Flyers for Day Events and Luxury Nightlife",
    eyebrow: "Yacht flyer maker",
    metaDescription:
      "Create yacht party flyers online for boat parties, sunset cruises, day events, luxury socials, and tropical nightlife promotion.",
    intro:
      "Make yacht party flyers with ocean color, sunset energy, luxury typography, and clean social formats for boat parties and premium day events.",
    audience:
      "Built for yacht party promoters, DJs, day-event brands, lounges, travel hosts, and luxury nightlife marketers.",
    keywords: [
      "yacht party flyer maker",
      "boat party flyer",
      "yacht flyer template",
      "sunset cruise flyer",
      "luxury party flyer",
    ],
    bullets: [
      "Yacht, boat party, and ocean-luxe flyer templates",
      "Editable ticket, RSVP, dock, date, and host details",
      "Premium tropical visuals for day and sunset events",
      "Social-ready post and story exports",
    ],
    useCases: [
      "Yacht parties",
      "Boat cruises",
      "Sunset events",
      "Luxury day parties",
    ],
    templateIds: ["yacht_escape", "sunset_yacht", "day_party", "summer_splash", "miami_st"],
    faqs: [
      {
        question: "Can I make a yacht party flyer online?",
        answer:
          "Yes. Choose a yacht or tropical event template, add the date, dock, host, and RSVP details, then export the flyer.",
      },
      {
        question: "Can I make both post and story versions?",
        answer:
          "Yes. Nightlife Flyers supports square post and vertical story workflows for supported templates.",
      },
    ],
  },
  {
    slug: "bar-flyer-maker",
    title: "Bar Flyer Maker",
    h1: "Create Bar Flyers for Drink Specials, Weekly Events, and Live DJs",
    eyebrow: "Bar flyer maker",
    metaDescription:
      "Make bar flyers online for drink specials, karaoke nights, happy hours, DJs, cocktail events, and weekly social promotion.",
    intro:
      "Design bar flyers for weekly promotions, cocktails, happy hour, karaoke, live DJs, and themed nights without starting from a blank layout.",
    audience:
      "Built for bars, pubs, lounges, DJs, hosts, managers, and social media teams promoting recurring nightlife events.",
    keywords: [
      "bar flyer maker",
      "bar flyer template",
      "happy hour flyer maker",
      "drink specials flyer",
      "bar event flyer",
    ],
    bullets: [
      "Bar, cocktail, happy hour, and weekly event templates",
      "Editable drink specials, venue, DJ, date, and time details",
      "Fast visuals for recurring promotion",
      "Clean exports for Instagram posts and stories",
    ],
    useCases: [
      "Happy hour specials",
      "Karaoke nights",
      "Live DJ bar events",
      "Cocktail and theme nights",
    ],
    templateIds: ["kpop_pastel_led", "martini", "karaokee", "latin_street_tropical", "miami2"],
    faqs: [
      {
        question: "Can I make a happy hour flyer?",
        answer:
          "Yes. Use a bar, cocktail, or lounge template, update the drink specials and event time, then export the flyer.",
      },
      {
        question: "Can I reuse bar flyer designs weekly?",
        answer:
          "Yes. You can update the same template for recurring events by changing the date, host, DJ, and offer copy.",
      },
    ],
  },
];

const TEMPLATE_SLUG_OVERRIDES: Record<string, string> = {
  square_center_hero_nightlife: "dj-night-flyer",
  secret_friday: "secret-friday-club-flyer",
  sugar_rush: "birthday-bash-flyer",
  ladies_night_center_hero: "ladies-night-flyer",
  kpop_pastel_led: "mojito-monday-flyer",
  hiphop_graffiti: "hip-hop-flyer",
  industrial_muscle_hero: "car-culture-hip-hop-flyer",
  hiphop_lowrider: "lowrider-hip-hop-flyer",
  throwback_cassette: "throwback-party-flyer",
  dnb_bunker: "dnb-bunker-flyer",
  rnb_velvet: "rnb-lounge-flyer",
  disco_mirrorball: "disco-party-flyer",
  latin_street_tropical: "latin-night-flyer",
  afrobeat_rooftop: "afrobeats-flyer",
  atlanta: "atlanta-nightlife-flyer",
  "la-lux": "la-luxe-afterhours-flyer",
  miami2: "miami-nights-flyer",
  "new-york": "new-york-nightclub-flyer",
  karaokee: "karaoke-night-flyer",
  bottle_service: "bottle-service-flyer",
  techno_warehouse: "techno-warehouse-flyer",
  mardi_gras: "mardi-gras-party-flyer",
  miami_heat: "miami-heat-flyer",
  summer_splash: "summer-party-flyer",
  luau_tiki: "luau-party-flyer",
  martini: "martini-cocktail-flyer",
  day_party: "day-party-flyer",
  yacht_escape: "yacht-party-flyer",
  blk_tie: "black-tie-event-flyer",
  luxe: "vip-lounge-flyer",
  fantasy: "fantasy-night-flyer",
  miami_st: "miami-street-flyer",
  sunset_yacht: "sunset-yacht-flyer",
};

const TEMPLATE_COPY_OVERRIDES: Record<
  string,
  Partial<Pick<TemplateLandingPage, "title" | "h1" | "metaDescription" | "intro" | "audience" | "keywords" | "useCases">>
> = {
  ladies_night_center_hero: {
    title: "Ladies Night Flyer Template",
    h1: "Ladies Night Flyer Template for Clubs, Bars, and Lounges",
    metaDescription:
      "Customize a ladies night flyer template with neon nightlife styling, editable event details, portrait cutouts, square posts, and story exports.",
    intro:
      "This ladies night flyer template gives promoters a fashion-forward club look with a strong headline, social details, and post plus story layouts ready to edit.",
    audience: "Best for ladies night events, cocktail offers, club nights, lounges, and R&B or dancehall promotions.",
    keywords: ["ladies night flyer template", "ladies night flyer maker", "girls night flyer", "club flyer template"],
    useCases: ["Ladies free promotions", "Cocktail and lounge events", "R&B or dancehall nights", "VIP table promos"],
  },
  kpop_pastel_led: {
    title: "Mojito Monday Flyer Template",
    h1: "Mojito Monday Flyer Template for Bars and Lounges",
    metaDescription:
      "Edit a Mojito Monday flyer template for cocktail nights, lounges, happy hour, tropical bars, and nightlife promotions.",
    intro:
      "This mojito flyer template is built for bars, lounges, cocktail nights, and Monday drink specials with fresh tropical color and readable event copy.",
    audience: "Best for cocktail nights, mojito specials, lounges, happy hour events, and tropical party promotions.",
    keywords: ["mojito monday flyer", "cocktail flyer template", "happy hour flyer maker", "lounge flyer template"],
    useCases: ["Mojito Monday", "Cocktail specials", "Happy hour events", "Tropical lounge nights"],
  },
  bottle_service: {
    title: "Bottle Service Flyer Template",
    h1: "Bottle Service Flyer Template for VIP Nightlife Events",
    metaDescription:
      "Customize a bottle service flyer template for VIP tables, champagne nights, lounge events, and upscale club promotions.",
    intro:
      "This bottle service flyer template is designed for premium nightlife offers with elegant type, table details, and quick social exports.",
    audience: "Best for VIP hosts, lounges, nightclubs, bottle service teams, and upscale event promoters.",
    keywords: ["bottle service flyer", "VIP flyer template", "lounge flyer maker", "club bottle service flyer"],
    useCases: ["VIP table promos", "Champagne nights", "Lounge events", "Private table reservations"],
  },
  afrobeat_rooftop: {
    title: "Afrobeats Flyer Template",
    h1: "Afrobeats Flyer Template for Rooftop and Club Events",
    metaDescription:
      "Edit an Afrobeats flyer template for rooftop parties, club nights, tropical events, DJs, and nightlife promotion.",
    intro:
      "This Afrobeats flyer template pairs warm rooftop energy with bold typography and social-ready layouts for post and story promotion.",
    audience: "Best for Afrobeats DJs, rooftops, lounges, clubs, and tropical nightlife events.",
    keywords: ["Afrobeats flyer template", "Afrobeats flyer maker", "rooftop flyer template", "tropical club flyer"],
    useCases: ["Afrobeats rooftop parties", "Dancehall and Afrobeats nights", "Guest DJ events", "Golden hour promos"],
  },
  disco_mirrorball: {
    title: "Disco Party Flyer Template",
    h1: "Disco Party Flyer Template for Throwback Nights",
    metaDescription:
      "Customize a disco party flyer template for throwback events, funk nights, club parties, and social media promotion.",
    intro:
      "This disco party flyer template is designed for throwback energy with bold type, mirrorball atmosphere, and editable post plus story formats.",
    audience: "Best for disco parties, throwback nights, funk events, clubs, bars, and themed nightlife promotions.",
    keywords: ["disco party flyer", "throwback flyer template", "retro party flyer", "club flyer maker"],
    useCases: ["Disco nights", "Throwback parties", "Funk and soul events", "Theme nights"],
  },
  hiphop_graffiti: {
    title: "Hip Hop Flyer Template",
    h1: "Hip Hop Flyer Template for Urban Club Events",
    metaDescription:
      "Edit a hip hop flyer template for club nights, artist showcases, DJ events, open mics, and street-style nightlife promotion.",
    intro:
      "This hip hop flyer template gives promoters a bold urban layout for artist showcases, DJ sets, club nights, and social event promotion.",
    audience: "Best for hip hop nights, artist showcases, DJs, open mics, venues, and party promoters.",
    keywords: ["hip hop flyer template", "hip hop flyer maker", "urban flyer template", "artist showcase flyer"],
    useCases: ["Hip hop club nights", "Artist showcases", "DJ and MC events", "Open mic promotions"],
  },
};

const TEMPLATE_PAGE_EXCLUSIONS = new Set(["square_right_hero_left_text", "square_left_hero_right_text"]);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanTemplateTitle(label: string) {
  const firstPart = label.split(/\s+[\u2013\u2014-]\s+/)[0]?.trim() || label;
  return firstPart.replace(/\s+Flyer$/i, "").trim() || label;
}

function templateSlug(template: TemplateSpec) {
  return TEMPLATE_SLUG_OVERRIDES[template.id] || `${slugify(cleanTemplateTitle(template.label))}-flyer`;
}

function stylePhrase(template: TemplateSpec) {
  const tags = template.tags.filter(Boolean).slice(0, 3);
  if (!tags.length) return "nightlife";
  return tags.map((tag) => tag.toLowerCase()).join(", ");
}

function defaultTemplateLandingPage(template: TemplateSpec): TemplateLandingPage {
  const name = cleanTemplateTitle(template.label);
  const style = stylePhrase(template);
  const title = `${name} Flyer Template`;

  return {
    slug: templateSlug(template),
    title,
    h1: `${title} for Nightlife Promotion`,
    metaDescription: `Customize the ${name} flyer template for ${style} events with editable text, colors, graphics, square posts, story layouts, and clean exports.`,
    intro: `The ${name} flyer template gives promoters a finished visual starting point for ${style} events. Edit the headline, venue, date, colors, graphics, background, and export format without starting from a blank canvas.`,
    audience: `Best for DJs, venues, bars, lounges, promoters, and event marketers creating ${style} social flyers.`,
    keywords: [
      `${name} flyer template`,
      `${name} flyer maker`,
      `${style} flyer template`,
      "nightlife flyer maker",
      "club flyer template",
    ],
    useCases: [
      "Instagram post promotion",
      "Instagram story promotion",
      "Weekly event announcements",
      "Club, bar, lounge, and DJ marketing",
    ],
    template,
  };
}

export function getAllTemplateLandingPages() {
  const seen = new Set<string>();
  return TEMPLATE_GALLERY.filter((template) => !TEMPLATE_PAGE_EXCLUSIONS.has(template.id)).map((template) => {
    const page = {
      ...defaultTemplateLandingPage(template),
      ...TEMPLATE_COPY_OVERRIDES[template.id],
      template,
    };
    let slug = page.slug;
    if (seen.has(slug)) slug = `${slug}-${slugify(template.id)}`;
    seen.add(slug);
    return { ...page, slug };
  });
}

export function getTemplateLandingPage(slug: string) {
  return getAllTemplateLandingPages().find((page) => page.slug === slug) || null;
}

export function getCategoryLandingPage(slug: string) {
  return CATEGORY_LANDING_PAGES.find((page) => page.slug === slug) || null;
}

export function getTemplateLandingPagesByIds(ids: string[]) {
  const pages = getAllTemplateLandingPages();
  return ids
    .map((id) => pages.find((page) => page.template.id === id))
    .filter((page): page is TemplateLandingPage => Boolean(page));
}

export function getRelatedTemplateLandingPages(page: TemplateLandingPage, limit = 4) {
  const tagSet = new Set(page.template.tags.map((tag) => tag.toLowerCase()));
  return getAllTemplateLandingPages()
    .filter((candidate) => candidate.template.id !== page.template.id)
    .map((candidate) => {
      const score = candidate.template.tags.reduce(
        (total, tag) => total + (tagSet.has(tag.toLowerCase()) ? 1 : 0),
        0
      );
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function buildEditorHref(templateId: string, format: "square" | "story" = "square") {
  return `/?studio=1&template=${encodeURIComponent(templateId)}&format=${encodeURIComponent(format)}&from=seo`;
}

export function absoluteUrl(siteUrl: string, path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
