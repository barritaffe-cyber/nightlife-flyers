import type { CocoNightlifeStyle, CocoTextRole } from "./types";

export type CocoExpressiveOverlapKind =
  | "details_over_subject"
  | "headline_over_face"
  | "headline_over_subject_torso"
  | "metadata_over_subject"
  | "script_over_headline";

export type CocoNightlifeImpactDoctrine = {
  allowedMoves: string[];
  expressiveOverlap: Record<CocoExpressiveOverlapKind, "bad" | "expressive" | "usually-bad">;
  principle: string;
  protectedAreas: string[];
  rule: string;
  shortHeadlineMaxWords: number;
  strongStyles: CocoNightlifeStyle[];
};

export const COCO_NIGHTLIFE_IMPACT_DOCTRINE: CocoNightlifeImpactDoctrine = {
  allowedMoves: [
    "Oversized headline",
    "Headline overlapping subject torso",
    "Script crossing headline",
    "Subject partially behind title",
    "Footer metadata compressed into clean systems",
  ],
  expressiveOverlap: {
    details_over_subject: "usually-bad",
    headline_over_face: "bad",
    headline_over_subject_torso: "expressive",
    metadata_over_subject: "bad",
    script_over_headline: "expressive",
  },
  principle: "Controlled Force",
  protectedAreas: ["eyes", "face center", "mouth", "critical date", "critical venue"],
  rule: "A nightlife flyer must have one dominant visual event.",
  shortHeadlineMaxWords: 2,
  strongStyles: [
    "afrobeats",
    "edm",
    "general-nightlife",
    "hip-hop",
    "house",
    "ladies-night",
    "latin-night",
    "rnb-lounge",
    "techno",
    "throwback",
  ],
};

export const COCO_REFERENCE_LESSONS = [
  {
    appliesWhen: {
      eventNameWordsMax: COCO_NIGHTLIFE_IMPACT_DOCTRINE.shortHeadlineMaxWords,
      styles: COCO_NIGHTLIFE_IMPACT_DOCTRINE.strongStyles,
    },
    id: "oversized-rave-subject-overlap",
    lessons: [
      "Short event names can become giant graphic objects.",
      "Face protection matters more than full-body protection.",
      "Hero type can overlap the subject body when the face stays clear.",
      "The date can become the second anchor after the headline.",
      "Footer information can be compact when the hero moment is strong.",
    ],
  },
] as const;

export const COCO_CRITICAL_INFO_ROLES: CocoTextRole[] = ["date", "venue"];
