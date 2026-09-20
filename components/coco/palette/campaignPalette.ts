import {
  buildColorRenderModel,
  normalizeHex,
  type ColorDirectorResult,
  type ColorRole,
  type ColorSystem,
  type Hex,
  type PaletteRoleAssignment,
} from "../../../coco-color-director/index.ts";
import {
  COCO_CAMPAIGN_COLOR_ROLES,
  type CocoCampaignColorRole,
  type CocoCampaignColorRoles,
  type CocoCampaignFormat,
  type CocoCampaignFormatPalettes,
  type CocoCampaignPaletteCandidate,
  type CocoColorSelection,
  type CocoLegacyPalette,
} from "./types.ts";

const ROLE_IMPORTANCE: Record<CocoCampaignColorRole, PaletteRoleAssignment["importance"]> = {
  accent: "high",
  background: "critical",
  backgroundSecondary: "medium",
  badgeBackground: "medium",
  badgeText: "high",
  dateTime: "high",
  footer: "low",
  glow: "low",
  headline: "critical",
  metadata: "high",
  neutral: "medium",
  presenter: "low",
  stroke: "low",
  utility: "medium",
  venue: "medium",
};

function roleColor(system: ColorSystem, role: ColorRole): Hex | undefined {
  const value = system.roles.find((assignment) => assignment.role === role)?.color;
  return value ? normalizeHex(value) : undefined;
}

/** Materialize every semantic role so renderers never reinterpret slots. */
export function canonicalColorRoles(system: ColorSystem): CocoCampaignColorRoles {
  const background = roleColor(system, "background") ?? normalizeHex(system.colors.dominant);
  const backgroundSecondary =
    roleColor(system, "backgroundSecondary") ?? normalizeHex(system.colors.dark);
  const headline = roleColor(system, "headline") ?? normalizeHex(system.colors.light);
  const accent = roleColor(system, "accent") ?? normalizeHex(system.colors.accent);
  const metadata = roleColor(system, "metadata") ?? normalizeHex(system.colors.neutral);
  const neutral = roleColor(system, "neutral") ?? normalizeHex(system.colors.neutral);
  const dateTime = roleColor(system, "dateTime") ?? metadata;
  const venue = roleColor(system, "venue") ?? metadata;
  const badgeBackground = roleColor(system, "badgeBackground") ?? accent;
  const badgeText = roleColor(system, "badgeText") ?? headline;
  const presenter = roleColor(system, "presenter") ?? venue;
  const footer = roleColor(system, "footer") ?? metadata;
  const stroke = roleColor(system, "stroke") ?? backgroundSecondary;
  const glow = roleColor(system, "glow") ?? accent;
  const utility = roleColor(system, "utility") ?? metadata;

  return {
    accent,
    background,
    backgroundSecondary,
    badgeBackground,
    badgeText,
    dateTime,
    footer,
    glow,
    headline,
    metadata,
    neutral,
    presenter,
    stroke,
    utility,
    venue,
  };
}

function canonicalRoleAssignments(
  system: ColorSystem,
  roles: CocoCampaignColorRoles
): PaletteRoleAssignment[] {
  const authored = new Map(system.roles.map((assignment) => [assignment.role, assignment]));
  return COCO_CAMPAIGN_COLOR_ROLES.map((role) => {
    const assignment = authored.get(role);
    const canonical: PaletteRoleAssignment = {
      color: roles[role],
      importance: assignment?.importance ?? ROLE_IMPORTANCE[role],
      reason: assignment?.reason ?? "Campaign palette semantic fallback",
      role,
    };
    if (assignment?.contrastAgainst) {
      canonical.contrastAgainst = normalizeHex(assignment.contrastAgainst);
    }
    if (typeof assignment?.contrastRatio === "number") {
      canonical.contrastRatio = assignment.contrastRatio;
    }
    return canonical;
  });
}

export function campaignPaletteCandidateFromColorSystem(
  system: ColorSystem,
  maxStrongColors = 3
): CocoCampaignPaletteCandidate {
  const roles = canonicalColorRoles(system);
  const baseRenderModel = buildColorRenderModel(system, maxStrongColors);
  return {
    id: system.id,
    name: system.name,
    policy: system.policy,
    renderModel: {
      ...baseRenderModel,
      roles: canonicalRoleAssignments(system, roles),
    },
    roles,
    score: { ...system.score },
    strongColors: Array.from(new Set(system.strongColors.map(normalizeHex))).slice(
      0,
      maxStrongColors
    ),
  };
}

function compareSystems(
  winnerId: string,
  left: ColorSystem,
  right: ColorSystem
): number {
  const leftWinner = left.id === winnerId ? 1 : 0;
  const rightWinner = right.id === winnerId ? 1 : 0;
  return (
    rightWinner - leftWinner ||
    right.score.total - left.score.total ||
    right.score.readability - left.score.readability ||
    right.score.contrast - left.score.contrast ||
    (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  );
}

function candidateVisualSignature(candidate: CocoCampaignPaletteCandidate): string {
  return COCO_CAMPAIGN_COLOR_ROLES.map((role) => candidate.roles[role]).join("|");
}

/**
 * Produces winner-first, score-ordered candidates independent of input array
 * order, removing duplicate IDs and duplicate semantic color systems.
 */
export function orderedCampaignPaletteCandidates(
  result: ColorDirectorResult
): CocoCampaignPaletteCandidate[] {
  const systems = [result.winner, ...result.finalists, ...result.candidates].sort((left, right) =>
    compareSystems(result.winner.id, left, right)
  );
  const seenIds = new Set<string>();
  const seenVisuals = new Set<string>();
  const candidates: CocoCampaignPaletteCandidate[] = [];

  for (const system of systems) {
    if (!system.id || seenIds.has(system.id)) continue;
    const candidate = campaignPaletteCandidateFromColorSystem(
      system,
      result.authority.maxStrongColors
    );
    const signature = candidateVisualSignature(candidate);
    seenIds.add(system.id);
    if (seenVisuals.has(signature)) continue;
    seenVisuals.add(signature);
    candidates.push(candidate);
  }

  return candidates;
}

export function createCocoColorSelection(
  result: ColorDirectorResult,
  inputHash: string,
  selectedId = result.winner.id
): CocoColorSelection {
  const normalizedInputHash = String(inputHash || "").trim();
  if (!normalizedInputHash) throw new Error("Coco campaign palette inputHash is required.");
  const candidates = orderedCampaignPaletteCandidates(result);
  if (!candidates.length) throw new Error("Coco Color Director returned no usable palette candidates.");
  const selectedIndex = Math.max(
    0,
    candidates.findIndex((candidate) => candidate.id === selectedId)
  );
  return {
    version: 1,
    inputHash: normalizedInputHash,
    candidates,
    selectedId: candidates[selectedIndex].id,
    selectedIndex,
  };
}

export function selectedCampaignPalette(
  selection: CocoColorSelection
): CocoCampaignPaletteCandidate {
  const matchingIndex = selection.candidates.findIndex(
    (candidate) => candidate.id === selection.selectedId
  );
  const selectedIndex = matchingIndex >= 0 ? matchingIndex : selection.selectedIndex;
  return selection.candidates[selectedIndex] ?? selection.candidates[0];
}

export function nextCocoColorSelection(
  selection: CocoColorSelection,
  step = 1
): CocoColorSelection {
  if (!selection.candidates.length) return selection;
  const matchingIndex = selection.candidates.findIndex(
    (candidate) => candidate.id === selection.selectedId
  );
  const currentIndex =
    matchingIndex >= 0
      ? matchingIndex
      : Math.max(0, Math.min(selection.candidates.length - 1, selection.selectedIndex));
  const offset = Number.isFinite(step) ? Math.trunc(step) : 1;
  const selectedIndex =
    ((currentIndex + offset) % selection.candidates.length + selection.candidates.length) %
    selection.candidates.length;
  return {
    ...selection,
    selectedId: selection.candidates[selectedIndex].id,
    selectedIndex,
  };
}

/** The single boundary from semantic Color Director roles to page.tsx slots. */
export function campaignCandidateToLegacyPalette(
  candidate: CocoCampaignPaletteCandidate
): CocoLegacyPalette {
  return {
    bgFrom: candidate.roles.background,
    bgTo: candidate.roles.backgroundSecondary,
    primary: candidate.roles.headline,
    // Scene Builder historically calls this slot "Base".
    secondary: candidate.roles.background,
    accent: candidate.roles.accent,
    // Scene Builder labels this legacy slot "Meta".
    neutral: candidate.roles.metadata,
  };
}

export function campaignPalettesByFormat(
  selection: CocoColorSelection
): CocoCampaignFormatPalettes {
  const palette = campaignCandidateToLegacyPalette(selectedCampaignPalette(selection));
  return {
    square: { ...palette },
    story: { ...palette },
  };
}

export function mapCampaignPaletteToFormats<T>(
  selection: CocoColorSelection,
  map: (
    candidate: CocoCampaignPaletteCandidate,
    format: CocoCampaignFormat
  ) => T
): Record<CocoCampaignFormat, T> {
  const candidate = selectedCampaignPalette(selection);
  return {
    square: map(candidate, "square"),
    story: map(candidate, "story"),
  };
}

export function serializeCocoColorSelection(selection: CocoColorSelection): string {
  return JSON.stringify(selection);
}

export function deserializeCocoColorSelection(serialized: string): CocoColorSelection | null {
  try {
    const value = JSON.parse(serialized) as Partial<CocoColorSelection>;
    if (
      value.version !== 1 ||
      !String(value.inputHash || "").trim() ||
      !Array.isArray(value.candidates) ||
      value.candidates.length === 0
    ) {
      return null;
    }
    const candidates = value.candidates as CocoCampaignPaletteCandidate[];
    const requestedId = String(value.selectedId || "");
    const matchingIndex = candidates.findIndex((candidate) => candidate.id === requestedId);
    const fallbackIndex = Number.isInteger(value.selectedIndex)
      ? Math.max(0, Math.min(candidates.length - 1, Number(value.selectedIndex)))
      : 0;
    const selectedIndex = matchingIndex >= 0 ? matchingIndex : fallbackIndex;
    return {
      version: 1,
      inputHash: String(value.inputHash),
      candidates,
      selectedId: candidates[selectedIndex].id,
      selectedIndex,
    };
  } catch {
    return null;
  }
}
