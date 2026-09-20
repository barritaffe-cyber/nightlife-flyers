import type { CocoGuide, CocoStep, CocoTone } from "./types";

const defaultSteps: CocoStep[] = [
  {
    id: "headline",
    target: "headline",
    eyebrow: "Start with the hook",
    message: "Change the event name first.",
    detail: "Short, loud headlines usually land hardest on nightlife flyers.",
  },
  {
    id: "subtag",
    target: "subtag",
    eyebrow: "Support the hook",
    message: "Tighten the supporting line.",
    detail: "Use this for the theme, offer, guest list, or short mood line.",
  },
  {
    id: "details",
    target: "details",
    eyebrow: "Lock the details",
    message: "Update the date, venue, specials, and socials.",
    detail: "Keep the must-read information easy to scan on a phone.",
  },
  {
    id: "venue",
    target: "venue",
    eyebrow: "Anchor the location",
    message: "Make the venue easy to read.",
    detail: "The venue line should be clear even on a small screen.",
  },
  {
    id: "date",
    target: "date",
    eyebrow: "Check the timing",
    message: "Confirm the date and time.",
    detail: "Date, day, and time should be unmistakable before export.",
  },
  {
    id: "export",
    target: "export",
    eyebrow: "Finish clean",
    message: "Download when the layout feels ready to post.",
    detail: "Export PNG for crisp social graphics or JPG for smaller files.",
  },
];

const guideProfiles: Array<{
  match: RegExp;
  tone: CocoTone;
  intro: string;
  steps?: Partial<CocoStep>[];
}> = [
  {
    match: /(ladies|girls|soiree|soirée|pink|glam|sugar)/i,
    tone: "glam",
    intro:
      "This one works best with a bold title, a tight support line, and clean event details.",
    steps: [
      {
        message: "Give the headline a strong event name.",
        detail: "For glam flyers, two to four words usually feels premium.",
      },
      {
        detail: "Use the supporting line for the offer, guest list, host, or mood.",
      },
    ],
  },
  {
    match: /(bottle|service|luxe|black|gold|vip|premium|lounge|rnb|r&b)/i,
    tone: "premium",
    intro:
      "Keep this layout polished. Short copy, strong contrast, and clean spacing do the work.",
    steps: [
      {
        detail: "Premium nightlife designs work better when the headline has room to breathe.",
      },
      {
        detail: "Keep the supporting text short so the design stays high-end.",
      },
    ],
  },
  {
    match: /(throwback|retro|boombox|old school|90s|80s|disco)/i,
    tone: "retro",
    intro:
      "Nostalgia carries this template. Keep the throwback theme obvious and the date readable.",
    steps: [
      {
        message: "Make the throwback theme clear in the headline.",
        detail: "Names like Throwback Thursday or Old School Night are instantly understood.",
      },
      {
        detail: "Use the supporting line for the era, music style, or dress code.",
      },
    ],
  },
  {
    match: /(hip hop|trap|drill|showcase|artist|street|midnight|manhattan)/i,
    tone: "street",
    intro:
      "This design wants attitude. Lead with the artist or event name, then keep the details tight.",
    steps: [
      {
        detail: "Artist and showcase flyers need a headline that reads fast from a small screen.",
      },
      {
        detail: "Keep the supporting text direct: guest, host, lineup, or cover.",
      },
    ],
  },
  {
    match: /(afro|afrobeats|latin|salsa|tropical|rooftop|yacht|sunset|miami)/i,
    tone: "tropical",
    intro:
      "Let the vibe breathe. Warm color, airy spacing, and a clear venue line help this format.",
    steps: [
      {
        detail: "For rooftop and tropical nights, the headline should feel open, not crowded.",
      },
      {
        detail: "Use clean supporting text for the vibe, venue, and time.",
      },
    ],
  },
  {
    match: /(fantasy|dream|fairy|enchanted|magic)/i,
    tone: "dream",
    intro:
      "This template is about atmosphere. Keep the headline readable while the visuals stay cinematic.",
    steps: [
      {
        detail: "Dreamy flyers still need a clear event name. Let effects support the words.",
      },
      {
        detail: "Keep the supporting copy readable while the atmosphere stays cinematic.",
      },
    ],
  },
];

function mergeSteps(overrides: Partial<CocoStep>[] = []) {
  return defaultSteps.map((step, index) => ({
    ...step,
    ...overrides[index],
  }));
}

export function getCocoGuide(
  templateId?: string | null,
  templateLabel?: string | null
): CocoGuide {
  const key = `${templateId ?? ""} ${templateLabel ?? ""}`.trim();
  const profile = guideProfiles.find((item) => item.match.test(key));

  return {
    templateId: templateId ?? "default",
    tone: profile?.tone ?? "general",
    intro:
      profile?.intro ??
      "This layout is ready. Tighten the event text, confirm the venue and date, then export.",
    steps: mergeSteps(profile?.steps),
  };
}
