import type { TemplateBase, TemplateSpec } from "../../../lib/templates.ts";

export type OptimizedVisualReferenceManifestEntry = {
  id: string;
  imageUrl: `/samples/optimized/${string}`;
  templateId: string;
  subjectPosition: "left" | "center" | "right" | "none";
};

// These are finished flyer renders. The alias is deliberately explicit:
// filenames such as `vip-lounge` and `techno` do not match the ids of the
// structured templates that produced them. Two renders may also point to
// one template (sugar-rush), which is useful visual evidence rather than a
// duplicate construction model.
export const OPTIMIZED_VISUAL_REFERENCE_MANIFEST = [
  { id: "afro", imageUrl: "/samples/optimized/afro.webp", templateId: "afrobeat_rooftop", subjectPosition: "right" },
  { id: "atlanta", imageUrl: "/samples/optimized/atlanta.png", templateId: "atlanta", subjectPosition: "center" },
  { id: "black-tie", imageUrl: "/samples/optimized/black-tie.webp", templateId: "blk_tie", subjectPosition: "none" },
  { id: "disco", imageUrl: "/samples/optimized/disco.png", templateId: "disco_mirrorball", subjectPosition: "center" },
  { id: "dj-night", imageUrl: "/samples/optimized/dj-night.webp", templateId: "square_center_hero_nightlife", subjectPosition: "center" },
  { id: "dnb", imageUrl: "/samples/optimized/dnb.png", templateId: "dnb_bunker", subjectPosition: "center" },
  { id: "fantasy", imageUrl: "/samples/optimized/fantasy.webp", templateId: "fantasy", subjectPosition: "center" },
  { id: "karaoke", imageUrl: "/samples/optimized/karaoke.png", templateId: "karaokee", subjectPosition: "right" },
  { id: "la-luxe", imageUrl: "/samples/optimized/la-luxe.png", templateId: "la-lux", subjectPosition: "right" },
  { id: "latin", imageUrl: "/samples/optimized/latin.png", templateId: "latin_street_tropical", subjectPosition: "center" },
  { id: "mardi-gras", imageUrl: "/samples/optimized/mardi-gras.png", templateId: "mardi_gras", subjectPosition: "right" },
  { id: "miami-nights", imageUrl: "/samples/optimized/miami-nights.png", templateId: "miami2", subjectPosition: "center" },
  { id: "miami", imageUrl: "/samples/optimized/miami.jpg", templateId: "miami_heat", subjectPosition: "none" },
  { id: "minimal", imageUrl: "/samples/optimized/minimal.png", templateId: "white_minimal", subjectPosition: "center" },
  { id: "mojito", imageUrl: "/samples/optimized/mojito.webp", templateId: "kpop_pastel_led", subjectPosition: "right" },
  { id: "new-york", imageUrl: "/samples/optimized/new-york.webp", templateId: "new-york", subjectPosition: "center" },
  { id: "nocturne", imageUrl: "/samples/optimized/nocturne.webp", templateId: "nocturne_midnight_muse", subjectPosition: "right" },
  { id: "r-and-b", imageUrl: "/samples/optimized/r&b.png", templateId: "rnb_velvet", subjectPosition: "right" },
  { id: "secret", imageUrl: "/samples/optimized/secret.png", templateId: "secret_friday", subjectPosition: "center" },
  { id: "sugar-rush", imageUrl: "/samples/optimized/sugar-rush.webp", templateId: "sugar_rush", subjectPosition: "center" },
  { id: "sugar-rush-variant", imageUrl: "/samples/optimized/sugar-rush2.webp", templateId: "sugar_rush", subjectPosition: "center" },
  { id: "techno", imageUrl: "/samples/optimized/techno.webp", templateId: "edm_stage_co2", subjectPosition: "none" },
  { id: "throwback", imageUrl: "/samples/optimized/throwback.png", templateId: "throwback_cassette", subjectPosition: "none" },
  { id: "vip-lounge", imageUrl: "/samples/optimized/vip-lounge.webp", templateId: "luxe", subjectPosition: "right" },
] as const satisfies readonly OptimizedVisualReferenceManifestEntry[];

export type OptimizedVisualTemplateReference = {
  id: string;
  imageUrl: string;
  templateId: string;
  subjectPosition: OptimizedVisualReferenceManifestEntry["subjectPosition"];
  template: TemplateSpec;
  construction: TemplateBase;
};

export type VisualReferenceSubjectMode = "required" | "none" | "any";

export function filterVisualReferencesBySubjectMode<T extends { subjectPosition: OptimizedVisualReferenceManifestEntry["subjectPosition"] }>(
  references: readonly T[],
  subjectMode: VisualReferenceSubjectMode
): T[] {
  return references.filter((reference) =>
    subjectMode === "none"
      ? reference.subjectPosition === "none"
      : subjectMode === "required"
        ? reference.subjectPosition !== "none"
        : true
  );
}

export function mapOptimizedVisualsToTemplates(
  templates: readonly TemplateSpec[],
  manifest: readonly OptimizedVisualReferenceManifestEntry[] = OPTIMIZED_VISUAL_REFERENCE_MANIFEST
): OptimizedVisualTemplateReference[] {
  const templatesById = new Map(templates.map((template) => [template.id, template]));

  return manifest.map((reference) => {
    const template = templatesById.get(reference.templateId);
    if (!template) {
      throw new Error(
        `Optimized visual reference ${reference.imageUrl} has no template ${reference.templateId}.`
      );
    }
    const construction = template.formats?.square ?? template.base;
    if (!construction) {
      throw new Error(
        `Optimized visual reference ${reference.imageUrl} maps to ${reference.templateId}, but that template has no square/base construction data.`
      );
    }
    return {
      ...reference,
      template,
      construction,
    };
  });
}
