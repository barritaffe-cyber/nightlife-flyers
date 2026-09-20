import { mapCocoFormToRecipe, cocoBriefForFormat } from "./formRecipeMapping.ts";
import { withCocoSocialRecipeAssets } from "./socialRecipeAssets.ts";
import { withCocoPresenterLogo } from "./presenterLogo.ts";
import { restoreCocoDetailLayout, withCocoCompleteDetails } from "./completeRecipeDetails.ts";
import { prepareCocoContentLayout, withCocoContentLayout } from "./contentAwareLayout.ts";
import type { CocoEventBriefInput } from "./eventBriefFields.ts";
import { withCocoRecipeBackground, type CocoRecipeBackgroundChoice } from "./recipeBackground.ts";
import type { CocoGeneratedCopy } from "./copy.ts";
import { materializeCocoComposerCopy } from "./copy.ts";
import {
  getMaterializedCocoVisualRecipe,
  getVisualRecipe,
} from "../visualRecipes.ts";
import type { CocoSubjectDecision } from "./subjectAuthority.ts";

export const COCO_PORTABLE_RECIPE_PROJECT_URLS = {
  "afro-sunset": "/generated-flyers/afro-sunset.nflyer",
  "afrobeat-rooftop": "/generated-flyers/afrobeat-rooftop.nflyer",
  "aura": "/generated-flyers/aura.nflyer",
  "bass-pressure": "/generated-flyers/bass-pressure.nflyer",
  "grills-and-groove": "/generated-flyers/grills-and-groove.nflyer",
  "soft-life": "/generated-flyers/soft-life.nflyer",
  "brunch-sundays": "/generated-flyers/brunch-sundays.nflyer",
  "girl-code": "/generated-flyers/girl-code.nflyer",
  "ycee-live": "/generated-flyers/ycee-live.nflyer",
  "honey-nights": "/generated-flyers/honey-nights.nflyer",
  "girl-code-rose": "/generated-flyers/girl-code-rose.nflyer",
  "bad-girls": "/generated-flyers/bad-girls.nflyer",
  "beat-therapy": "/generated-flyers/beat-therapy.nflyer",
  "black-tie": "/generated-flyers/black-tie.nflyer",
  "branch-happy-hour": "/generated-flyers/branch-happy-hour.nflyer",
  "day-party": "/generated-flyers/day-party.nflyer",
  "disco": "/generated-flyers/disco.nflyer",
  "drift-kingz": "/generated-flyers/drift-kingz.nflyer",
  "electric-sunset": "/generated-flyers/electric-sunset.nflyer",
  "en-blanc": "/generated-flyers/en-blanc.nflyer",
  "euphoria": "/generated-flyers/euphoria.nflyer",
  "fantasy": "/generated-flyers/fantasy.nflyer",
  "in-crowd": "/generated-flyers/in-crowd.nflyer",
  "karaoke-night": "/generated-flyers/karaoke-night.nflyer",
  "ladies-secret": "/generated-flyers/ladies-secret.nflyer",
  "mardi-gras": "/generated-flyers/mardi-gras.nflyer",
  "martini-night": "/generated-flyers/martini-night.nflyer",
  "miami-nights": "/generated-flyers/miami-nights.nflyer",
  "miami-ocean-nights": "/generated-flyers/miami-ocean-nights.nflyer",
  "miami-street": "/generated-flyers/miami-street.nflyer",
  "mind-state": "/generated-flyers/mind-state.nflyer",
  "mojito-monday": "/generated-flyers/mojito-monday.nflyer",
  "new-york": "/generated-flyers/new-york.nflyer",
  "nocturne-muse": "/generated-flyers/nocturne-muse.nflyer",
  "one-love-reggae": "/generated-flyers/one-love-reggae.nflyer",
  "salsa-noche": "/generated-flyers/salsa-noche.nflyer",
  "sip-and-paint": "/generated-flyers/sip-and-paint.nflyer",
  "slow-jamz": "/generated-flyers/slow-jamz.nflyer",
  "soiree-dream-house": "/generated-flyers/soiree-dream-house.nflyer",
  "sugar-rush": "/generated-flyers/sugar-rush.nflyer",
  "sunset-yacht": "/generated-flyers/sunset-yacht.nflyer",
  "taco-tuesday": "/generated-flyers/taco-tuesday.nflyer",
  "throwback-saturdays": "/generated-flyers/throwback-saturdays.nflyer",
  "yacht-escape": "/generated-flyers/yacht-escape.nflyer",
  "rush-night-css": "/generated-flyers/rush-night-coco.nflyer",
  "fashion-club-vertical": "/generated-flyers/friday-fever.nflyer",
  "ladies-css-editorial": "/generated-flyers/ladies-css-coco.nflyer",
  "summer-sunset": "/generated-flyers/summer-sunset-updated.nflyer",
  "diabla-all-white": "/generated-flyers/diabla-all-white-updated.nflyer",
  "rnb-thursdays": "/generated-flyers/rnb-thursdays-updated.nflyer",
  "zona-de-perreo": "/generated-flyers/zona-de-perreo-updated.nflyer",
  "reggae-jams": "/generated-flyers/reggae-jams.nflyer",
  "amapiano-night": "/generated-flyers/amapiano-night-updated.nflyer",
  "como-una-boa": "/generated-flyers/eaden.nflyer",
  "i-love-thursday": "/generated-flyers/i-love-thursday-updated.nflyer",
  "elite-monday": "/generated-flyers/elite-monday-updated.nflyer",
  "we-outside": "/generated-flyers/we-outside.nflyer",
  "pulse": "/generated-flyers/pulse.nflyer",
  "space-neon": "/generated-flyers/space-neon.nflyer",
  "brunch-saturday": "/generated-flyers/brunch-saturday-updated.nflyer",
  "brunch-vibes": "/generated-flyers/brunch-vibes-compiled-portrait-updated.nflyer",
  "black-gold-party": "/generated-flyers/black-gold-party.nflyer",
  "neon-night-shift": "/generated-flyers/neon-night.nflyer",
  "glow-in-the-dark": "/generated-flyers/glow.nflyer",
  "punta-cana-sundays": "/generated-flyers/punta-cana.nflyer",
  "baddies-n-bundles": "/generated-flyers/baddies-n-bundles.nflyer",
  "city-nights": "/generated-flyers/city-nights.nflyer",
  "grey-rave-festival": "/generated-flyers/grey-rave-festival.nflyer",
  "dodge-night-rides": "/generated-flyers/dodge-night-rides.nflyer",
  "ladies-night-rose": "/generated-flyers/ladies-night-rose.nflyer",
} as const;

export type CocoPortableRecipeId = keyof typeof COCO_PORTABLE_RECIPE_PROJECT_URLS;

type CocoPortableEventBrief = CocoEventBriefInput;

export type CocoPortableRecipeComposer = CocoRecipeBackgroundChoice & {
  eventName: string;
  fieldMappingVersion?: 1;
  eventBrief: CocoPortableEventBrief;
  copy?: CocoGeneratedCopy;
  selectedConceptDirectionId?: string;
  styleDecision?: { style?: string | null };
  subjectBounds?: unknown;
  subjectDataUrl?: string;
  subjectSourceDataUrl?: string;
  subjectDecision?: CocoSubjectDecision;
};

type CocoPortableProjectState = {
  session?: {
    square?: Record<string, any>;
    story?: Record<string, any>;
  };
};

export type CocoPortableRecipeProject = {
  state?: CocoPortableProjectState;
} & CocoPortableProjectState;

const projectPromises = new Map<CocoPortableRecipeId, Promise<CocoPortableRecipeProject>>();

const COCO_PORTABLE_RECIPE_PROJECT_REVISIONS: Partial<
  Record<CocoPortableRecipeId, string>
> = {
  "bad-girls": "bad-girls-v1",
  "beat-therapy": "beat-therapy-v1",
  "brunch-saturday": "e2f04e3e6dc7",
  "fashion-club-vertical": "d62582847a93",
  "pulse": "d9af4b77f87c",
  "space-neon": "cb1f7f6c0822",
  "zona-de-perreo": "42e4b25eb1f6",
  "summer-sunset": "498f43aeffe4",
  "diabla-all-white": "40c175865102",
  "rnb-thursdays": "ed8217f0d5cb",
  "reggae-jams": "reggae-jams-v5-story",
  "amapiano-night": "280c64873550",
  "como-una-boa": "8ab53e4465b0",
  "neon-night-shift": "b36259e46975",
  "punta-cana-sundays": "11350524d3b5",
  "glow-in-the-dark": "e2c95f27570d",
  "i-love-thursday": "b4c9b88af0d9",
  "elite-monday": "1361764e7a4d",
  "we-outside": "58d0ebc10e13",
  "black-gold-party": "1",
  "baddies-n-bundles": "6",
  "city-nights": "5",
  "dodge-night-rides": "03d8ba36f7cf",
  "ladies-night-rose": "ladies-night-rose-v3",
  "mojito-monday": "24a2d11d8fd9",
  "afro-sunset": "0f1ad4d03e84",
  "afrobeat-rooftop": "1a5e511f594c",
  "aura": "f9c14506b652",
  "disco": "a87060830f94",
  "drift-kingz": "126649e1e22c",
  "in-crowd": "b420a0d33013",
  "ladies-secret": "be869ba7e1c8",
  "mardi-gras": "c7c046fafa4e",
  "mind-state": "e65f5b3316d9",
  "soiree-dream-house": "6e39efc4c59c",
};

export function isCocoPortableRecipeId(value: unknown): value is CocoPortableRecipeId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(COCO_PORTABLE_RECIPE_PROJECT_URLS, value)
  );
}

function projectSessions(project: CocoPortableRecipeProject) {
  return (project.state ?? project).session;
}

function validatePortableRecipeProject(
  recipeId: CocoPortableRecipeId,
  project: CocoPortableRecipeProject,
) {
  const session = projectSessions(project);
  const square = session?.square;
  const story = session?.story;
  if (!square || !story) {
    throw new Error(`${recipeId} is missing an authored Square or Story session.`);
  }
  for (const [format, variant] of Object.entries({ square, story })) {
    const materialized = getMaterializedCocoVisualRecipe(variant);
    if (materialized?.id !== recipeId) {
      throw new Error(`${recipeId} ${format} is not a materialized registered recipe.`);
    }
  }
  return project;
}

export async function loadCocoPortableRecipeProject(
  recipeId: CocoPortableRecipeId,
): Promise<CocoPortableRecipeProject> {
  const cached = projectPromises.get(recipeId);
  if (cached) return cached;

  const revision = COCO_PORTABLE_RECIPE_PROJECT_REVISIONS[recipeId];
  const projectUrl = revision
    ? `${COCO_PORTABLE_RECIPE_PROJECT_URLS[recipeId]}?v=${encodeURIComponent(revision)}`
    : COCO_PORTABLE_RECIPE_PROJECT_URLS[recipeId];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const promise = fetch(projectUrl, {
    // These files are executable design masters. A stale browser or service-
    // worker copy can silently recreate an older composition after its source
    // has been rebuilt, so always validate the current authored payload.
    cache: "no-store",
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Could not load ${recipeId} (${response.status} ${response.statusText}).`,
        );
      }
      return validatePortableRecipeProject(
        recipeId,
        (await response.json()) as CocoPortableRecipeProject,
      );
    })
    .catch((error) => {
      projectPromises.delete(recipeId);
      if (controller.signal.aborted) {
        throw new Error(`Loading Coco recipe ${recipeId} timed out after 20 seconds.`);
      }
      throw new Error(`Coco recipe ${recipeId}: ${error instanceof Error ? error.message : String(error)}`);
    })
    .finally(() => clearTimeout(timeout));

  projectPromises.set(recipeId, promise);
  return promise;
}

function cloneJsonValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function compact(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function oneLine(value: unknown) {
  return compact(value).replace(/\s*\n\s*/g, " ");
}

function uniqueLines(values: unknown[], limit = 4) {
  const lines = values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .flatMap((value) => compact(value).split("\n"))
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line, index, collection) =>
        collection.findIndex((candidate) => candidate.toLowerCase() === line.toLowerCase()) ===
        index,
    );
  return lines.slice(0, limit).join("\n");
}

function removeRolePrefix(value: unknown) {
  return compact(value)
    .replace(
      /^(?:music|sounds?|hosted|hype(?:d)?)\s+by\s*:?\s*/i,
      "",
    )
    .trim();
}

function balancedTitle(value: unknown) {
  const words = oneLine(value).split(" ").filter(Boolean);
  if (words.length <= 1) return [words[0] ?? "", ""] as const;
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")] as const;
}

function threeTierTitle(value: unknown) {
  const words = oneLine(value).split(" ").filter(Boolean);
  if (words.length <= 1) return [words[0] ?? "", "", ""] as const;
  if (words.length === 2) return [words[0], words[1], ""] as const;
  const firstEnd = Math.ceil(words.length / 3);
  const secondEnd = Math.ceil((words.length * 2) / 3);
  return [
    words.slice(0, firstEnd).join(" "),
    words.slice(firstEnd, secondEnd).join(" "),
    words.slice(secondEnd).join(" "),
  ] as const;
}

const MONTHS: Record<string, string> = {
  january: "JAN",
  february: "FEB",
  march: "MAR",
  april: "APR",
  may: "MAY",
  june: "JUN",
  july: "JUL",
  august: "AUG",
  september: "SEP",
  october: "OCT",
  november: "NOV",
  december: "DEC",
};

const WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

type CocoDateParts = {
  day: string;
  fallback: string[];
  month: string;
  weekday: string;
};

function cocoDateParts(value: unknown): CocoDateParts {
  const source = oneLine(value);
  if (!source) return { day: "", fallback: [], month: "", weekday: "" };
  const weekday = WEEKDAYS.find((name) =>
    new RegExp(`\\b${name.slice(0, 3)}(?:${name.slice(3)})?\\b`, "i").test(source),
  ) ?? "";
  const monthEntry = Object.entries(MONTHS).find(([name]) =>
    new RegExp(`\\b${name.slice(0, 3)}(?:${name.slice(3)})?\\b`, "i").test(source),
  );
  const iso = source.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const parsed = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00Z`);
    return {
      day: String(Number(iso[3])),
      fallback: [iso[2], iso[3]],
      month: Object.values(MONTHS)[Number(iso[2]) - 1] ?? iso[2],
      weekday: WEEKDAYS[parsed.getUTCDay()] ?? weekday,
    };
  }
  const numericTokens = source.match(/\b(?:0?[1-9]|[12]\d|3[01])\b/g) ?? [];
  const day = monthEntry ? numericTokens.at(-1) ?? "" : "";
  const year = source.match(/\b(?:19|20)\d{2}\b/)?.[0];
  const monthIndex = monthEntry
    ? Object.keys(MONTHS).indexOf(monthEntry[0])
    : -1;
  const derivedWeekday =
    year && day && monthIndex >= 0
      ? WEEKDAYS[
          new Date(Date.UTC(Number(year), monthIndex, Number(day), 12)).getUTCDay()
        ] ?? ""
      : "";
  const fallback = source
    .replace(/[.,]/g, " ")
    .split(/\s*[\/|\-]\s*|\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\d{4}$/.test(part))
    .slice(0, 3);
  return {
    day: day ? String(Number(day)) : "",
    fallback,
    month: monthEntry?.[1] ?? "",
    weekday: weekday || derivedWeekday,
  };
}

function formatRecipeDate(
  value: unknown,
  style: "baddies" | "city" | "glow" | "neon" | "punta",
) {
  const parts = cocoDateParts(value);
  if (!parts.day && !parts.month && !parts.weekday) {
    return parts.fallback.slice(0, style === "glow" || style === "punta" ? 2 : 3).join("\n");
  }
  if (style === "glow") return [parts.month, parts.day].filter(Boolean).join("\n");
  if (style === "punta") return [parts.day, parts.month].filter(Boolean).join("\n");
  if (style === "baddies" || style === "city") {
    return [parts.weekday, parts.day, parts.month].filter(Boolean).join("\n");
  }
  return [parts.weekday && parts.weekday.slice(0, 3), parts.month, parts.day]
    .filter(Boolean)
    .join("\n");
}

function dateWeekday(value: unknown) {
  return cocoDateParts(value).weekday;
}

function formatGlowTime(value: unknown) {
  const source = oneLine(value);
  const match = source.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)$/i);
  if (!match) return compact(value);
  const hour = match[1].padStart(2, "0");
  return `${hour}${match[2] ? `:${match[2]}` : ""}\n${match[3].toUpperCase()}`;
}

function priceValue(value: unknown) {
  const source = oneLine(value);
  if (!source) return "";
  return /^\d+(?:\.\d{1,2})?$/.test(source) ? `$${source}` : source;
}

function ageRequirementValue(value: unknown) {
  const source = oneLine(value);
  if (!source) return "";
  return /^\d{1,2}$/.test(source) ? `${source}+` : source;
}

function glowTitle(value: unknown, subtitle: unknown) {
  const source = oneLine(value);
  const connector = source.match(/^(.+?)\s+(in the|at the|of the)\s+(.+)$/i);
  if (connector) {
    return {
      connector: connector[2],
      headline: connector[1],
      secondary: connector[3],
    };
  }
  const [headline, secondary] = balancedTitle(source);
  return { connector: oneLine(subtitle), headline, secondary };
}

function baddiesTitle(value: unknown) {
  const source = oneLine(value);
  const connector = source.match(/^(.+?)\s+(n|and|&)\s+(.+)$/i);
  if (connector) {
    return {
      connector: connector[2].toLowerCase() === "and" ? "&" : connector[2].toUpperCase(),
      headline: `${connector[1]}\n${connector[3]}`,
    };
  }
  const [first, second] = balancedTitle(source);
  return { connector: second ? "×" : "", headline: [first, second].filter(Boolean).join("\n") };
}

function compiledRecipeFields(
  recipeId: CocoPortableRecipeId,
  composer: CocoPortableRecipeComposer,
) {
  const brief = composer.eventBrief;
  const copy = materializeCocoComposerCopy(
    composer.copy,
    composer.eventName,
    brief,
    {
      eventDescription: brief.description,
      nightlifeStyle: composer.styleDecision?.style,
    },
  );
  const contact = oneLine(brief.rsvpContact || brief.bookingContact || copy.rsvpContact);
  const djs = removeRolePrefix(brief.djs || copy.djLineup);
  const presenter = oneLine(brief.presenterName || copy.presenter);
  const venue = oneLine(brief.venueName);
  const address = oneLine(brief.address);
  const offers = uniqueLines([
    brief.mainPromotion,
    brief.bottleSpecials,
    brief.drinkSpecials,
    brief.foodSpecials,
    brief.hookahSpecials,
    brief.additionalOffers,
  ]);

  if (recipeId === "ladies-css-editorial") {
    const fields: Record<string, string> = {};
    for (const [field, value] of Object.entries({
      headline: composer.eventName, head2line: brief.subtitle,
      presenter: brief.presenterName, venue: brief.venueName,
      venueAddress: brief.address, details2: brief.djs || brief.musicPolicy,
      details: brief.hosts || brief.eventDetails, time: brief.startTime,
      compliance: brief.ageRequirement, ladiesSignoff: brief.responsibleDrinking,
    })) if (value !== undefined && value !== "") fields[field] = String(value);
    if (brief.venueName) fields.ladiesVenueSuffix = "";
    if (brief.date) {
      const date = cocoDateParts(brief.date);
      fields.date = [date.day, date.month].filter(Boolean).join("\n");
    }
    return { copy, fields };
  }

  if (recipeId === "brunch-saturday" || recipeId === "brunch-vibes" || recipeId === "pulse" || recipeId === "space-neon" || recipeId === "zona-de-perreo" || recipeId === "amapiano-night" || recipeId === "reggae-jams" || recipeId === "rnb-thursdays" || recipeId === "diabla-all-white" || recipeId === "summer-sunset" || recipeId === "como-una-boa" || recipeId === "we-outside" || recipeId === "elite-monday" || recipeId === "i-love-thursday") {
    // Retain the accepted master wherever the new brief supplies no replacement.
    const fields: Record<string, string> = {};
    for (const [field, value] of Object.entries({
      headline: composer.eventName, head2line: brief.subtitle,
      presenter: brief.presenterName, venue: brief.venueName,
      venueAddress: brief.address, details: brief.eventDetails,
    })) if (value !== undefined && value !== "") fields[field] = String(value);
    if (recipeId === "pulse" || recipeId === "space-neon" || recipeId === "zona-de-perreo" || recipeId === "amapiano-night" || recipeId === "reggae-jams" || recipeId === "rnb-thursdays" || recipeId === "diabla-all-white" || recipeId === "summer-sunset" || recipeId === "como-una-boa" || recipeId === "we-outside" || recipeId === "elite-monday" || recipeId === "i-love-thursday") {
      for (const [field, value] of Object.entries({
        details2: brief.djs, leftRail: brief.rsvpContact || brief.bookingContact || brief.socials,
        price: brief.entryFee || brief.mainPromotion,
      })) if (value !== undefined && value !== "") fields[field] = String(value);
    }
    if (brief.date) {
      const date = cocoDateParts(brief.date);
      // These masters have a separate ordinal suffix beside the day.
      if (recipeId === "elite-monday" || recipeId === "i-love-thursday") {
        const day = Number(date.day);
        const teen = day % 100 >= 11 && day % 100 <= 13;
        const suffix = teen ? "TH" : ({ 1: "ST", 2: "ND", 3: "RD" } as Record<number, string>)[day % 10] || "TH";
        if (recipeId === "elite-monday") date.weekday = suffix;
        else fields.dateOrdinal = suffix.toLowerCase();
      }
      const prefix = recipeId === "brunch-vibes" ? "date" : "";
      for (const [role, value] of Object.entries({ Day: date.day, Month: date.month, Weekday: date.weekday })) {
        if (value) fields[prefix ? prefix + role : role.toLowerCase()] =
          role === "Weekday" && !prefix ? value.slice(0, 3) : value;
      }
    }
    if (recipeId === "rnb-thursdays") {
      for (const [field, value] of Object.entries({
        priceLabel: brief.ticketLabel, leftRailLabel: brief.reservationLabel,
        rightRail: brief.additionalOffers, endTime: brief.endTime,
      })) if (value) fields[field] = value;
      if (brief.date) fields.date = cocoDateParts(brief.date).day || brief.date;
    }
    if (recipeId === "reggae-jams") {
      for (const [field, value] of Object.entries({
        details: brief.hosts || brief.eventDetails,
        subtag: brief.dressCode,
        leftRailLabel: brief.reservationLabel,
        rightRail: brief.additionalOffers,
      })) if (value) fields[field] = value;
      if (brief.date) {
        const date = cocoDateParts(brief.date);
        const day = Number(date.day);
        const suffix = day % 100 >= 11 && day % 100 <= 13 ? "TH" : ({ 1: "ST", 2: "ND", 3: "RD" } as Record<number, string>)[day % 10] || "TH";
        const month = Object.keys(MONTHS).find(name => MONTHS[name] === date.month)?.toUpperCase() ?? date.month;
        fields.date = date.day ? `${date.day}${suffix}\n${month}` : brief.date;
        fields.weekday = date.weekday;
        const year = brief.date.match(/\b(?:19|20)\d{2}\b/)?.[0];
        if (year) fields.year = year;
      }
    }
    if (recipeId === "diabla-all-white") {
      // This design uses the time-bound object for its weekday and price for dress code.
      delete fields.price;
      if (brief.dressCode) fields.price = brief.dressCode;
      if (brief.additionalOffers) fields.rightRail = brief.additionalOffers;
      if (brief.date) {
        const date = cocoDateParts(brief.date);
        fields.date = date.day || brief.date;
        if (date.weekday) fields.time = date.weekday.slice(0, 3);
      }
    }
    if (brief.startTime && recipeId !== "diabla-all-white") {
      if (recipeId === "brunch-saturday") {
        const match = oneLine(brief.startTime).match(/^(.*?)\s*(am|pm)$/i);
        fields.time = match ? match[1] : oneLine(brief.startTime);
        fields.meridiem = match ? match[2].toUpperCase() : "";
      } else fields.time = oneLine(brief.startTime);
    }
    if (recipeId === "summer-sunset") {
      delete fields.head2line;
      if (brief.subtitle) fields.subtag = brief.subtitle;
      if (brief.date) fields.date = cocoDateParts(brief.date).day || brief.date;
      if (brief.startTime) fields.time = `STARTS AT ${oneLine(brief.startTime)}`;
      if (brief.entryFee) fields.price = `ENTRY ${oneLine(brief.entryFee)}`;
      if (brief.reservationLabel) fields.leftRailLabel = brief.reservationLabel;
    }
    return { copy, fields };
  }

  if (recipeId === "neon-night-shift") {
    const [headline, secondary] = balancedTitle(composer.eventName);
    return {
      copy,
      fields: {
        headline,
        head2line: secondary,
        details: compact(copy.details),
        details2: djs,
        date: formatRecipeDate(brief.date, "neon"),
        timeLabel: brief.startTime ? "DOORS OPEN" : "",
        time: oneLine(brief.startTime),
        complianceLabel: brief.ageRequirement ? "ID REQUIRED" : "",
        compliance: ageRequirementValue(brief.ageRequirement || copy.compliance),
        rightRailLabel: offers ? "SPECIAL" : "",
        rightRail: offers,
        leftRailLabel: contact ? "VIP TABLES & INFO" : "",
        leftRail: contact,
        venue: [venue, address].filter(Boolean).join(" • "),
        subtag: oneLine(brief.dressCode),
      },
    };
  }

  if (recipeId === "glow-in-the-dark") {
    const title = glowTitle(composer.eventName, brief.subtitle);
    return {
      copy,
      fields: {
        presenter,
        headline: title.headline,
        details: title.connector,
        head2line: title.secondary,
        date: formatRecipeDate(brief.date, "glow"),
        time: formatGlowTime(brief.startTime),
        subtag: dateWeekday(brief.date),
        details2: djs,
        venue,
        rightRail: uniqueLines([
          brief.eventDetails,
          brief.experienceFeatures,
          brief.dressCode,
          copy.details,
        ]),
        venueAddress: address,
        leftRailLabel: contact ? "R.S.V.P" : "",
        leftRail: contact,
        price: priceValue(brief.entryFee || copy.price),
      },
    };
  }

  if (recipeId === "punta-cana-sundays") {
    const [headline, secondary, accent] = threeTierTitle(composer.eventName);
    const hostedBy = removeRolePrefix(brief.hosts || brief.performers);
    return {
      copy,
      fields: {
        headline,
        head2line: secondary,
        details: accent || oneLine(brief.subtitle),
        presenter,
        date: formatRecipeDate(brief.date, "punta"),
        leftRail: hostedBy ? `Hosted By ${hostedBy}` : "",
        cocoSocialHandle: oneLine(brief.socials || copy.socials),
        details2: djs,
        venue,
        rightRail: uniqueLines([
          brief.dressCode,
          brief.eventDetails,
          offers,
          copy.addons,
        ]),
        venueAddress: [address, contact].filter(Boolean).join(" • "),
        compliance: ageRequirementValue(brief.ageRequirement || copy.compliance),
      },
    };
  }

  if (recipeId === "black-gold-party") {
    const [headline, secondary, accent] = threeTierTitle(composer.eventName);
    const startTime = oneLine(brief.startTime);
    const entryFee = priceValue(brief.entryFee || copy.price);
    return {
      copy,
      fields: {
        presenter,
        headline,
        head2line: secondary,
        subtag: accent || "Party",
        date: formatRecipeDate(brief.date, "glow"),
        venue,
        details2: djs,
        time: startTime ? `Starts At ${startTime}` : "",
        details: oneLine(brief.eventDetails || copy.details),
        price: entryFee ? `Entry ${entryFee}` : "",
      },
    };
  }

  if (recipeId === "city-nights") {
    const [headline, secondary] = balancedTitle(composer.eventName);
    return {
      copy,
      fields: {
        presenter,
        headline,
        head2line: secondary,
        date: formatRecipeDate(brief.date, "city"),
        time: brief.startTime
          ? `Doors\nOpen\n${oneLine(brief.startTime).replace(/\s+/g, "")}`
          : "",
        details: oneLine(brief.mainPromotion || "The Hottest Night In The City"),
        details2: djs,
        djLineupLabel: djs ? "Music By" : "",
        rightRail: oneLine(
          brief.musicPolicy || copy.musicPolicy || brief.eventDetails || copy.details,
        ),
        leftRailLabel: contact
          ? oneLine(brief.ticketLabel) || "Tickets & Tables:"
          : "",
        leftRail: contact,
        venue,
        venueAddress: address,
        subtag: ageRequirementValue(brief.ageRequirement || copy.compliance),
      },
    };
  }

  if (recipeId === "dodge-night-rides") {
    return {
      copy,
      fields: {
        presenter,
        headline: oneLine(composer.eventName) || "Night",
        head2line: oneLine(brief.subtitle) || "Rides",
        date: formatRecipeDate(brief.date, "city"),
        time: oneLine(brief.startTime),
        details: oneLine(brief.eventDetails || copy.details),
        subtag: oneLine(brief.hosts) || "Same Energy Different Route",
        djLineupLabel: djs ? "Music By" : "",
        details2: djs,
        venue,
        venueAddress: address,
        rightRail: oneLine(brief.musicPolicy || copy.musicPolicy),
        leftRailLabel: oneLine(brief.ticketLabel) || "Tickets Online",
        leftRail: oneLine(brief.rsvpContact),
      },
    };
  }

  if (recipeId === "grey-rave-festival") {
    return {
      copy,
      fields: {
        headline: oneLine(composer.eventName) || "Rave",
        head2line: oneLine(brief.subtitle) || "Festival",
        date: formatRecipeDate(brief.date, "city"),
        djLineupLabel: djs ? "Line Up" : "",
        details2: djs,
        venue,
        venueAddress: address,
        compliance: ageRequirementValue(brief.ageRequirement || copy.compliance),
        price: priceValue(brief.entryFee || copy.price),
        priceLabel: brief.entryFee || copy.price ? "ENTRY" : "",
        cocoSocialHandle: oneLine(brief.socials || copy.socials),
        rightRail: oneLine(brief.eventDetails) || "Keep The Date",
      },
    };
  }

  const title = baddiesTitle(composer.eventName);
  const hype = removeRolePrefix(brief.hosts);
  return {
    copy,
    fields: {
      presenter,
      headline: title.headline,
      head2line: title.connector,
      date: formatRecipeDate(brief.date, "baddies"),
      time: brief.startTime ? `Doors Open\n${oneLine(brief.startTime).replace(/\s+/g, "")}` : "",
      detailsLabel: hype ? "Hyped By" : "",
      details: hype,
      djLineupLabel: djs ? "Music By" : "",
      details2: djs,
      venue,
      venueAddress: address,
      leftRailLabel: contact
        ? oneLine(brief.reservationLabel) || "For Info & Reservations:"
        : "",
      leftRail: contact,
      rightRail: oneLine(brief.responsibleDrinking),
      subtag: ageRequirementValue(brief.ageRequirement || copy.compliance),
    },
  };
}

const ENABLED_FIELDS: Record<string, string> = {
  cocoSocialHandle: "cocoSocialHandleEnabled",
  compliance: "complianceEnabled",
  date: "dateEnabled",
  details: "detailsEnabled",
  details2: "details2Enabled",
  head2line: "head2Enabled",
  leftRail: "leftRailEnabled",
  presenter: "presenterEnabled",
  price: "priceEnabled",
  rightRail: "rightRailEnabled",
  subtag: "subtagEnabled",
  venue: "venueEnabled",
};

function isCocoRecipeSubjectAssetValue(value: unknown) {
  const asset = (value ?? {}) as Record<string, any>;
  return (
    asset.cocoCompiledObjectId === "subject" ||
    asset.cocoAssetRole === "subject" ||
    String(asset.id || "").startsWith("coco_recipe_subject_") ||
    Boolean(asset.cocoSubjectLayoutId) ||
    (Boolean(asset.isExtracted) && !asset.isLogo && !asset.isSticker)
  );
}

// Echoes share the subject image, but own their framing and visual treatment.
// Never copy the main portrait's opacity, transform, shadow or tint onto them.
function portraitEchoSourcePatch(patch: Record<string, any>) {
  return Object.fromEntries(
    ["url", "cleanupBaseUrl", "cleanup", "cocoSubjectBounds"]
      .filter((key) => Object.prototype.hasOwnProperty.call(patch, key))
      .map((key) => [key, patch[key]]),
  );
}

export function replaceCocoRecipeSubjectInVariant(
  source: Record<string, any>,
  preferredSubjectId: string | null | undefined,
  patch: Record<string, any>,
) {
  const assetKeys = ["portraits", "emojiList", "emojis"] as const;
  const lists = assetKeys
    .map((key) => source[key])
    .filter((value): value is Record<string, any>[] => Array.isArray(value));
  const preferredId = String(preferredSubjectId ?? "").trim();
  const target =
    (preferredId
      ? lists.flat().find((asset) => String(asset?.id ?? "") === preferredId)
      : undefined) ?? lists.flat().find(isCocoRecipeSubjectAssetValue);
  if (!target) return null;

  const subjectId = String(target.id ?? "").trim();
  const echoPatch = isCocoRecipeSubjectAssetValue(target)
    ? portraitEchoSourcePatch(patch)
    : {};
  const variant = { ...source };
  let replaced = false;
  for (const key of assetKeys) {
    const assets = source[key];
    if (!Array.isArray(assets)) continue;
    let changed = false;
    const nextAssets = assets.map((asset) => {
      const matches = subjectId
        ? String(asset?.id ?? "") === subjectId
        : isCocoRecipeSubjectAssetValue(asset);
      const linkedEcho = asset?.cocoAssetRole === "portraitEcho" && Object.keys(echoPatch).length > 0;
      if (!matches && !linkedEcho) return asset;
      changed = true;
      replaced = true;
      return { ...asset, ...(matches ? patch : echoPatch) };
    });
    if (changed) variant[key] = nextAssets;
  }

  return replaced ? { subjectId: subjectId || preferredId, variant } : null;
}

function withComposerSubject(
  items: unknown,
  composer: CocoPortableRecipeComposer,
) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    const asset = { ...((item ?? {}) as Record<string, any>) };
    if (asset.cocoAssetRole === "portraitEcho" && composer.subjectDataUrl) {
      return { ...asset, ...portraitEchoSourcePatch({
        url: composer.subjectDataUrl,
        cleanupBaseUrl: composer.subjectSourceDataUrl ?? composer.subjectDataUrl,
        cocoSubjectBounds: composer.subjectBounds,
      }) };
    }
    if (!isCocoRecipeSubjectAssetValue(asset) || !composer.subjectDataUrl) return asset;
    return {
      ...asset,
      ...(composer.subjectBounds !== undefined
        ? { cocoSubjectBounds: composer.subjectBounds }
        : {}),
      ...(composer.subjectSourceDataUrl
        ? { cleanupBaseUrl: composer.subjectSourceDataUrl }
        : {}),
      isExtracted: true,
      isSticker: false,
      label: "Subject",
      locked: false,
      url: composer.subjectDataUrl,
    };
  });
}

export function materializeCocoPortableRecipeVariant(
  recipeId: CocoPortableRecipeId,
  source: Record<string, any>,
  composer: CocoPortableRecipeComposer,
  options: { cloneSource?: boolean } = {},
) {
  // Loading a master must detach the complete authored document from the
  // cached project. Quick-edit updates only replace top-level bindings and
  // asset arrays, so they can safely retain the immutable compiled IR by
  // reference instead of cloning several megabytes on every keystroke.
  const variant = prepareCocoContentLayout(restoreCocoDetailLayout(options.cloneSource === false ? { ...source } : cloneJsonValue(source)));
  // Snapshot the actual saved lettering before personalization clears/replaces it.
  // IR text can predate the author's latest edits in compiledObjectOverrides.
  if (!variant.cocoAuthoredText) {
    const system = variant.cocoCompositionSystem;
    variant.cocoAuthoredText = Object.fromEntries((system?.compiledDocument?.objects ?? [])
      .filter((o: any) => o.kind === 'text')
      .map((o: any) => [o.id, String(system.compiledObjectOverrides?.[o.id]?.text ?? o.text ?? '')]));
  }
  const usesFormMapping = composer.fieldMappingVersion === 1 || source.cocoFormMappingVersion === 1;
  const scopedBrief = cocoBriefForFormat(composer.eventBrief, variant.format);
  const mapped = usesFormMapping ? mapCocoFormToRecipe(recipeId, variant, composer.eventName, scopedBrief, cocoDateParts(scopedBrief.date)) : null;
  const { copy, fields } = mapped
    ? { copy: materializeCocoComposerCopy(composer.copy, composer.eventName, scopedBrief), fields: mapped.fields }
    : compiledRecipeFields(recipeId, composer);
  if (mapped) {
    variant.cocoFormMappingVersion = 1;
    variant.cocoFormMappingReport = mapped.report;
    variant.cocoCompositionSystem = mapped.system;
  }
  if (!mapped && recipeId === "baddies-n-bundles") {
    if (typeof source.detailsLabel === "string") fields.detailsLabel = source.detailsLabel;
    if (typeof source.djLineupLabel === "string") fields.djLineupLabel = source.djLineupLabel;
  }
  Object.assign(variant, fields);
  if (!mapped && (recipeId === "brunch-saturday" || recipeId === "brunch-vibes" || recipeId === "pulse" || recipeId === "space-neon" || recipeId === "zona-de-perreo" || recipeId === "amapiano-night" || recipeId === "reggae-jams" || recipeId === "rnb-thursdays" || recipeId === "diabla-all-white" || recipeId === "summer-sunset" || recipeId === "como-una-boa" || recipeId === "we-outside" || recipeId === "elite-monday" || recipeId === "i-love-thursday")) {
    const system = variant.cocoCompositionSystem;
    const overrides = { ...system?.compiledObjectOverrides };
    for (const object of system?.compiledDocument?.objects ?? []) {
      const field = recipeId === "amapiano-night" && object.id === "offer" ? "details" : recipeId === "como-una-boa" && object.id === "addressLabel" ? "venue" : object.binding?.text;
      if (field && Object.prototype.hasOwnProperty.call(fields, field)) {
        overrides[object.id] = { ...overrides[object.id], text: fields[field as keyof typeof fields] };
      }
    }
    variant.cocoCompositionSystem = { ...system, compiledObjectOverrides: overrides };
  }


  for (const [field, enabledField] of Object.entries(mapped ? {} : ENABLED_FIELDS)) {
    if (Object.prototype.hasOwnProperty.call(fields, field)) {
      variant[enabledField] = Boolean(oneLine((fields as Record<string, unknown>)[field]));
    }
  }
  if (Object.prototype.hasOwnProperty.call(fields, "head2line")) {
    variant.headline2Enabled = Boolean(oneLine(fields.head2line));
  }

  variant.cocoCampaignDirectionId = composer.selectedConceptDirectionId ?? recipeId;
  variant.cocoEventBrief = cloneJsonValue(composer.eventBrief);
  variant.cocoEventName = composer.eventName;
  if (composer.subjectDecision !== undefined) {
    variant.cocoSubjectDecision = cloneJsonValue(composer.subjectDecision);
  }
  variant.cocoGeneratedCopy = {
    ...(variant.cocoGeneratedCopy ?? {}),
    ...copy,
  };
  const sourceAssets = Array.isArray(variant.emojiList)
    ? variant.emojiList
    : variant.portraits;
  if (Array.isArray(sourceAssets)) {
    const assets = withComposerSubject(sourceAssets, composer);
    // Runtime rendering, format switching, and project serialization do not
    // all read the same historical asset key. Keep one canonical authored
    // stack on both keys so a selected recipe cannot lose its replacement
    // subject when the user switches formats or saves the project.
    variant.emojiList = cloneJsonValue(assets);
    variant.portraits = cloneJsonValue(assets);
  }
  return withCocoPresenterLogo(withCocoRecipeBackground(mapped ? withCocoContentLayout(withCocoCompleteDetails(withCocoSocialRecipeAssets(variant, scopedBrief), scopedBrief)) : variant, composer),scopedBrief);
}

export function materializeCocoPortableRecipeTemplate<T extends Record<string, any>>({
  baseTemplate,
  composer,
  project,
  recipeId,
}: {
  baseTemplate: T;
  composer: CocoPortableRecipeComposer;
  project: CocoPortableRecipeProject;
  recipeId: CocoPortableRecipeId;
}): T {
  const validated = validatePortableRecipeProject(recipeId, project);
  const session = projectSessions(validated)!;
  const recipe = getVisualRecipe(recipeId);
  const square = materializeCocoPortableRecipeVariant(recipeId, session.square!, composer);
  const story = materializeCocoPortableRecipeVariant(recipeId, session.story!, composer);

  return {
    ...baseTemplate,
    id: `__coco_composer__${recipeId}`,
    label: recipe?.name ?? baseTemplate.label ?? recipeId,
    tags: Array.from(
      new Set([...(Array.isArray(baseTemplate.tags) ? baseTemplate.tags : []), "Coco", recipeId]),
    ),
    formats: {
      ...(baseTemplate.formats ?? {}),
      square,
      story,
    },
  };
}
