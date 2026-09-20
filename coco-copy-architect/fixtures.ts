import type { CopyArchitectInput } from "./types.ts";

export const MOJITO_COPY_FIXTURE: CopyArchitectInput = {
  event: {
    name: "Mojito Mondaze",
    headline: "MOJITO MONDAZE",
    accent: "Brunch Vibes",
    details: "Tropical rhythms, Afrobeats, Latin",
    details2: "Cocktails and island energy",
    presenter: "Presented by Sky Lounge",
    date: "Monday",
    time: "4PM til late",
    venue: "Sky Lounge Miami",
    address: "1234 Ocean Drive",
    price: "Entry $50",
    ageRestriction: "21+",
    social: "@skyloungemiami",
  },
  scene: {
    confidence: 0.92,
    creativeDecisions: {
      story: "luxury-tropical-brunch",
      marketingIntent: "sell-lifestyle",
      hero: { type: "subject" },
      densityPolicy: {
        policy: "low",
        maxVisibleGroups: 5,
        maxBodyLines: 3,
        mergeSecondaryCopy: true,
        hideLowPriorityCopy: true,
      },
    },
  },
  creativeDirection: {
    posterIdentity: "lifestyle-editorial",
    posterDNA: "tropical-lifestyle",
    marketingGoal: "sell-lifestyle",
    emotionalGoal: "relaxed-luxury",
    informationDensity: "low",
    hierarchy: {
      headlinePower: 100,
      accentMaxRatio: 0.42,
      bodyMaxRatio: 0.25,
      dateMaxRatio: 0.24,
      venueMaxRatio: 0.18,
      badgeMaxRatio: 0.2,
      presenterMaxRatio: 0.13,
    },
  },
  userPreferences: {
    preserveOriginalCopy: false,
    allowRewriting: true,
    allowHiding: true,
    keepPresenter: false,
    keepPrice: true,
    keepAddress: false,
    maxVisibleGroups: 6,
    preferredTone: "premium-lifestyle",
    forbiddenWords: [],
  },
};

export const TECHNO_COPY_FIXTURE: CopyArchitectInput = {
  event: {
    name: "Neural Core",
    headline: "NEURAL CORE",
    accent: "Warehouse Techno",
    details: "Industrial frequencies, deep techno, late-night pressure",
    date: "Saturday",
    time: "11PM",
    venue: "Sector 9",
    ageRestriction: "21+",
  },
  scene: {
    confidence: 0.86,
    creativeDecisions: {
      story: "techno-underground",
      marketingIntent: "sell-music",
      hero: { type: "background" },
      densityPolicy: {
        policy: "low",
        maxVisibleGroups: 5,
        maxBodyLines: 3,
        mergeSecondaryCopy: true,
        hideLowPriorityCopy: true,
      },
    },
  },
  creativeDirection: {
    posterIdentity: "underground-industrial",
    posterDNA: "underground-rave",
    marketingGoal: "sell-music",
    emotionalGoal: "underground",
    informationDensity: "low",
  },
};
