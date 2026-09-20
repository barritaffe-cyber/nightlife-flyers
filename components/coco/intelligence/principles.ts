import type { CocoDesignPrincipleDefinition } from "./types";

export const COCO_UNIVERSAL_DESIGN_PRINCIPLES: CocoDesignPrincipleDefinition[] = [
  {
    id: "hierarchy",
    label: "Hierarchy",
    question: "Can someone tell what the event is within two seconds?",
    reason: "People should understand the event before scanning supporting details.",
  },
  {
    id: "contrast",
    label: "Contrast",
    question: "Can every important word be read instantly?",
    reason: "A flyer fails if the message disappears into the image or effects.",
  },
  {
    id: "balance",
    label: "Balance",
    question: "Does the flyer feel visually stable?",
    reason: "Balanced visual weight makes the layout feel intentional instead of accidental.",
  },
  {
    id: "alignment",
    label: "Alignment",
    question: "Does every element feel deliberately placed?",
    reason: "Almost-aligned elements make a design feel unfinished.",
  },
  {
    id: "rhythm",
    label: "Rhythm",
    question: "Does spacing repeat with intention?",
    reason: "Consistent intervals make a layout easier to scan.",
  },
  {
    id: "proximity",
    label: "Proximity",
    question: "Are related details grouped together?",
    reason: "People understand information faster when related items live together.",
  },
  {
    id: "scale",
    label: "Scale",
    question: "Do important elements carry enough visual weight?",
    reason: "Scale tells the viewer what matters before they read.",
  },
  {
    id: "dominance",
    label: "Dominance",
    question: "Does the flyer have one clear hero?",
    reason: "When everything competes, nothing feels important.",
  },
  {
    id: "negative-space",
    label: "Negative Space",
    question: "Does the design have enough breathing room?",
    reason: "Restraint is one of the fastest ways to make a flyer feel premium.",
  },
  {
    id: "consistency",
    label: "Consistency",
    question: "Do effects, color, type, and spacing feel like one system?",
    reason: "Consistent decisions create polish and trust.",
  },
  {
    id: "mood-fit",
    label: "Mood",
    question: "Does the design match the event energy?",
    reason: "Luxury, brunch, Afrobeats, throwback, and techno should not speak the same visual language.",
  },
];
