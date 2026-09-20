export type CocoTarget =
  | "canvas"
  | "headline"
  | "headline2"
  | "details"
  | "details2"
  | "venue"
  | "subtag"
  | "date"
  | "presenter"
  | "leftRail"
  | "rightRail"
  | "price"
  | "subject"
  | "format"
  | "background"
  | "layout"
  | "palette"
  | "export";

export type CocoTone =
  | "general"
  | "glam"
  | "premium"
  | "retro"
  | "street"
  | "tropical"
  | "dream";

export type CocoStep = {
  id: string;
  target: CocoTarget;
  eyebrow: string;
  message: string;
  detail?: string;
};

export type CocoGuide = {
  templateId: string;
  tone: CocoTone;
  intro: string;
  steps: CocoStep[];
};
