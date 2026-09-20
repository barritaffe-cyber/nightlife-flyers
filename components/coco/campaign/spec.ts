import {
  getCocoArtDirection,
  requireCocoArtDirection,
} from "../artDirections/registry.ts";
import type { CocoCampaignFormat } from "./types.ts";
import type {
  CocoCampaignFormatLayout,
  CocoCampaignLayoutChoice,
  CocoCampaignSpec,
  CocoCampaignValidationIssue,
  CreateCocoCampaignSpecInput,
} from "./types.ts";

export const COCO_CAMPAIGN_FORMATS = ["square", "story"] as const satisfies readonly CocoCampaignFormat[];

const CANVAS_BY_FORMAT = {
  square: { height: 1080, width: 1080 },
  story: { height: 1920, width: 1080 },
} as const;

function buildFormatLayout(
  directionId: CreateCocoCampaignSpecInput["shared"]["directionId"],
  format: CocoCampaignFormat,
  choice?: CocoCampaignLayoutChoice
): CocoCampaignFormatLayout {
  const direction = requireCocoArtDirection(directionId);
  const policy = direction.layoutByFormat[format];
  const allowedReferences = direction.referenceTemplateIds[format];
  const referenceTemplateId = choice?.referenceTemplateId ?? allowedReferences[0];

  return {
    alignment: policy.alignment,
    canvas: { ...CANVAS_BY_FORMAT[format] },
    compositionPattern: policy.compositionPattern,
    format,
    layoutId: policy.layoutId,
    ...(choice?.layoutVariantId ? { layoutVariantId: choice.layoutVariantId } : {}),
    referenceTemplateId,
    safeMarginPct: policy.safeMarginPct,
    subjectPlacement: direction.subjectPolicy.preferredPlacement[format],
  };
}

export function createCocoCampaignSpec(input: CreateCocoCampaignSpecInput): CocoCampaignSpec {
  const spec: CocoCampaignSpec = {
    id: String(input.id || "").trim(),
    layouts: {
      square: buildFormatLayout(input.shared.directionId, "square", input.layouts?.square),
      story: buildFormatLayout(input.shared.directionId, "story", input.layouts?.story),
    },
    shared: {
      ...input.shared,
      assets: input.shared.assets.map((asset) => ({
        ...asset,
        ...(asset.focalPoint ? { focalPoint: { ...asset.focalPoint } } : {}),
      })),
      copy: { ...input.shared.copy },
      effects: { ...input.shared.effects },
      fonts: { ...input.shared.fonts },
      palette: { ...input.shared.palette },
    },
  };

  assertValidCocoCampaignSpec(spec);
  return spec;
}

export function validateCocoCampaignSpec(
  spec: CocoCampaignSpec
): readonly CocoCampaignValidationIssue[] {
  const issues: CocoCampaignValidationIssue[] = [];
  const add = (
    code: CocoCampaignValidationIssue["code"],
    message: string,
    format?: CocoCampaignFormat
  ) => issues.push({ code, message, ...(format ? { format } : {}) });

  if (!String(spec.id || "").trim()) add("id", "Campaign id is required.");
  if (!String(spec.shared.copy.headline || "").trim()) {
    add("text", "Campaign headline is required.");
  }

  const direction = getCocoArtDirection(spec.shared.directionId);
  if (!direction) {
    add("direction", `Unknown Coco art direction: ${spec.shared.directionId}`);
    return issues;
  }

  if (spec.shared.fonts.personality !== direction.typographyPersonality) {
    add("font", "Campaign font personality must match the selected art direction.");
  }
  if (spec.shared.palette.policyId !== direction.palettePolicy.id) {
    add("palette", "Campaign palette policy must match the selected art direction.");
  }
  if (spec.shared.effects.policyId !== direction.effectsPolicy.id) {
    add("effects", "Campaign effects policy must match the selected art direction.");
  }

  const assetIds = new Set<string>();
  for (const asset of spec.shared.assets) {
    const assetId = String(asset.id || "").trim();
    if (!assetId || assetIds.has(assetId)) {
      add("asset-id", "Campaign asset ids must be non-empty and unique.");
    }
    assetIds.add(assetId);
    if (!String(asset.src || "").trim()) {
      add("asset-id", `Campaign asset ${assetId || "(missing id)"} needs a source.`);
    }
  }

  for (const format of COCO_CAMPAIGN_FORMATS) {
    const layout = spec.layouts?.[format];
    if (!layout || layout.format !== format) {
      add("format", `Campaign needs a ${format} layout labeled as ${format}.`, format);
      continue;
    }
    const policy = direction.layoutByFormat[format];
    if (
      layout.layoutId !== policy.layoutId ||
      layout.compositionPattern !== policy.compositionPattern ||
      layout.alignment !== policy.alignment ||
      layout.safeMarginPct !== policy.safeMarginPct
    ) {
      add("layout", `${format} layout must follow the selected art direction policy.`, format);
    }
    if (layout.subjectPlacement !== direction.subjectPolicy.preferredPlacement[format]) {
      add("layout", `${format} subject placement must follow the shared subject policy.`, format);
    }
    if (!direction.referenceTemplateIds[format].includes(layout.referenceTemplateId)) {
      add(
        "reference",
        `${layout.referenceTemplateId} is not an approved ${format} reference for ${direction.id}.`,
        format
      );
    }
    if (layout.canvas.width <= 0 || layout.canvas.height <= 0) {
      add("format", `${format} canvas dimensions must be positive.`, format);
    }
  }

  return issues;
}

export function assertValidCocoCampaignSpec(
  spec: CocoCampaignSpec
): asserts spec is CocoCampaignSpec {
  const issues = validateCocoCampaignSpec(spec);
  if (!issues.length) return;
  throw new Error(`Invalid Coco campaign spec: ${issues.map((issue) => issue.message).join(" ")}`);
}

export function getCocoCampaignLayout(
  spec: CocoCampaignSpec,
  format: CocoCampaignFormat
): CocoCampaignFormatLayout {
  return spec.layouts[format];
}
