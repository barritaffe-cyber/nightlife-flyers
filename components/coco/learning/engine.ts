import type {
  CocoLearningDesignSnapshot,
  CocoLearningEvent,
  CocoLearningInput,
  CocoLearningRecordResult,
  CocoLearningSuggestion,
  GlobalDesignPattern,
  UserTasteProfile,
} from "./types";

const EVENTS_KEY = "nf:coco:learning:events:v1";
const PROFILE_KEY = "nf:coco:learning:userTaste:v1";
const PATTERNS_KEY = "nf:coco:learning:patterns:v1";
const MAX_EVENTS = 600;
const MAX_PATTERNS = 240;

const SUCCESS_SIGNALS = {
  exported: 5,
  paidDownload: 10,
  returnedToEdit: 2,
  saved: 4,
  shared: 6,
  userKeptSuggestion: 3,
} as const;

export function createCocoLearningSessionId() {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `coco-learning-${random}`;
}

export function createEmptyCocoUserTasteProfile(): UserTasteProfile {
  return {
    avoidsNeon: false,
    layoutCounts: {},
    paletteCounts: {},
    prefersCenteredLayouts: false,
    prefersLargeHeadline: false,
    prefersLuxuryFonts: false,
    signals: {
      centeredLayoutExports: 0,
      largeHeadlineKept: 0,
      luxuryTypographyKept: 0,
      neonRejected: 0,
      paletteChanged: 0,
      totalEvents: 0,
    },
    typographyCounts: {},
    usuallyChangesPalette: false,
    updatedAt: Date.now(),
  };
}

export function loadCocoLearningEvents(): CocoLearningEvent[] {
  return readJson<CocoLearningEvent[]>(EVENTS_KEY, []);
}

export function loadCocoUserTasteProfile(): UserTasteProfile {
  return normalizeTasteProfile(readJson<Partial<UserTasteProfile> | null>(PROFILE_KEY, null));
}

export function loadCocoGlobalDesignPatterns(): GlobalDesignPattern[] {
  return readJson<GlobalDesignPattern[]>(PATTERNS_KEY, []).filter(isGlobalDesignPattern);
}

export function buildCocoLearningEvent(input: {
  cocoSuggestion: CocoLearningSuggestion;
  eventType: string;
  finalDesignSnapshot?: CocoLearningDesignSnapshot | null;
  sessionId: string;
  templateId: string;
  timestamp?: number;
  userAction?: CocoLearningEvent["userAction"];
  userId?: string;
}): CocoLearningEvent {
  return {
    cocoSuggestion: normalizeSuggestion(input.cocoSuggestion),
    eventType: input.eventType,
    finalDesignSnapshot: input.finalDesignSnapshot ?? null,
    sessionId: input.sessionId,
    templateId: input.templateId,
    timestamp: input.timestamp ?? Date.now(),
    userAction: input.userAction ?? {},
    userId: input.userId,
  };
}

export function recordCocoLearningEvent(event: CocoLearningEvent): CocoLearningRecordResult {
  const normalizedEvent = {
    ...event,
    cocoSuggestion: normalizeSuggestion(event.cocoSuggestion),
    timestamp: Number.isFinite(event.timestamp) ? event.timestamp : Date.now(),
  };
  const successScore = scoreCocoLearningSuccess(normalizedEvent);
  const events = [normalizedEvent, ...loadCocoLearningEvents()].slice(0, MAX_EVENTS);
  writeJson(EVENTS_KEY, events);

  const currentUserTasteProfile = loadCocoUserTasteProfile();
  const currentGlobalPatterns = loadCocoGlobalDesignPatterns();
  const shouldApplySignal = shouldApplyCocoLearningSignal(normalizedEvent, successScore);
  const userTasteProfile = shouldApplySignal
    ? updateCocoUserTasteProfile(currentUserTasteProfile, normalizedEvent)
    : currentUserTasteProfile;
  const globalPatterns = shouldApplySignal
    ? updateCocoGlobalDesignPatterns(currentGlobalPatterns, normalizedEvent)
    : currentGlobalPatterns;
  if (shouldApplySignal) {
    writeJson(PROFILE_KEY, userTasteProfile);
    writeJson(PATTERNS_KEY, globalPatterns);
  }

  return {
    event: normalizedEvent,
    globalPatterns,
    successScore,
    userTasteProfile,
  };
}

export function scoreCocoLearningSuccess(event: CocoLearningEvent) {
  const action = event.userAction || {};
  let score = 0;
  if (action.exported) score += SUCCESS_SIGNALS.exported;
  if (action.saved) score += SUCCESS_SIGNALS.saved;
  if (action.accepted && !action.ignored) score += SUCCESS_SIGNALS.userKeptSuggestion;
  if (action.shared) score += SUCCESS_SIGNALS.shared;
  if (action.paidDownload) score += SUCCESS_SIGNALS.paidDownload;
  if (action.returnedToEdit) score += SUCCESS_SIGNALS.returnedToEdit;
  if (action.ignored) score -= 2;
  return Math.max(0, score);
}

function shouldApplyCocoLearningSignal(event: CocoLearningEvent, successScore: number) {
  return successScore > 0 || Boolean(event.userAction?.ignored);
}

export function scoreCocoUserPreference(
  suggestion: CocoLearningSuggestion,
  profile?: UserTasteProfile | null
) {
  if (!profile) return 50;
  let score = 50;
  if (profile.prefersCenteredLayouts) {
    score += suggestion.layoutId === "subject-center" ? 18 : -6;
  }
  if (profile.avoidsNeon && isNeonSuggestion(suggestion)) {
    score -= 28;
  }
  if (profile.prefersLuxuryFonts && isLuxuryTypographySuggestion(suggestion)) {
    score += 14;
  }
  if (profile.prefersLargeHeadline && isLargeHeadlineDirection(suggestion)) {
    score += 8;
  }

  score += Math.min(10, (profile.layoutCounts[suggestion.layoutId] ?? 0) * 2);
  score += Math.min(8, (profile.typographyCounts[suggestion.typographyId] ?? 0) * 1.5);
  score += Math.min(6, (profile.paletteCounts[suggestion.paletteId] ?? 0) * 1.25);
  return clamp(score, 0, 100);
}

export function scoreCocoGlobalPattern(
  suggestion: CocoLearningSuggestion,
  patterns?: GlobalDesignPattern[] | null,
  eventType = "general"
) {
  if (!patterns?.length) return 50;
  const exactKey = globalPatternKey(eventType, suggestion);
  const exact = patterns.find((pattern) => pattern.key === exactKey);
  const fallback = patterns
    .filter(
      (pattern) =>
        pattern.eventType === eventType &&
        (pattern.layoutStyle === suggestion.layoutId ||
          pattern.typographyStyle === suggestion.typographyId ||
          pattern.paletteStyle === suggestion.paletteId)
    )
    .sort((a, b) => b.sampleSize - a.sampleSize)[0];
  const pattern = exact ?? fallback;
  if (!pattern) return 50;
  const normalizedSuccess = clamp(pattern.averageSuccessScore / 12, 0, 1);
  return Math.round(
    clamp(42 + normalizedSuccess * 34 + pattern.exportRate * 18 + pattern.paidConversionRate * 6, 0, 100)
  );
}

export function blendCocoLearningScore(input: {
  artScore: number;
  globalSuccessScore: number;
  userPreferenceScore: number;
}) {
  return Math.round(
    clamp(input.artScore * 0.75 + input.globalSuccessScore * 0.2 + input.userPreferenceScore * 0.05, 0, 100)
  );
}

export function applyCocoLearningToScore<TScore extends { overallQuality: number; brandFit?: number }>(
  score: TScore,
  suggestion: CocoLearningSuggestion,
  learning?: CocoLearningInput | null,
  eventType = "general"
): TScore {
  if (!learning?.globalPatterns?.length && !learning?.userTasteProfile) return score;
  const userPreferenceScore = scoreCocoUserPreference(suggestion, learning.userTasteProfile);
  const globalSuccessScore = scoreCocoGlobalPattern(suggestion, learning.globalPatterns, eventType);
  const overallQuality = blendCocoLearningScore({
    artScore: score.overallQuality,
    globalSuccessScore,
    userPreferenceScore,
  });
  return {
    ...score,
    brandFit:
      typeof score.brandFit === "number"
        ? Math.round(clamp(score.brandFit * 0.9 + userPreferenceScore * 0.1, 0, 100))
        : score.brandFit,
    overallQuality,
  };
}

function updateCocoUserTasteProfile(profile: UserTasteProfile, event: CocoLearningEvent): UserTasteProfile {
  const next = normalizeTasteProfile(profile);
  const suggestion = event.cocoSuggestion;
  const action = event.userAction || {};
  const successScore = scoreCocoLearningSuccess(event);
  next.signals.totalEvents += 1;

  if (successScore >= SUCCESS_SIGNALS.userKeptSuggestion) {
    increment(next.layoutCounts, suggestion.layoutId);
    increment(next.typographyCounts, suggestion.typographyId);
    increment(next.paletteCounts, suggestion.paletteId);
  }

  if ((action.exported || action.saved) && suggestion.layoutId === "subject-center") {
    next.signals.centeredLayoutExports += 1;
  }

  if ((action.accepted || action.exported || action.saved) && isLargeHeadlineSnapshot(event.finalDesignSnapshot)) {
    next.signals.largeHeadlineKept += 1;
  }

  if ((action.accepted || action.exported || action.saved) && isLuxuryTypographySuggestion(suggestion)) {
    next.signals.luxuryTypographyKept += 1;
  }

  if ((action.ignored || (action.modified && !action.exported && !action.saved)) && isNeonSuggestion(suggestion)) {
    next.signals.neonRejected += 1;
  }

  if (action.modified && event.finalDesignSnapshot?.userFinalEdits?.paletteChanged) {
    next.signals.paletteChanged += 1;
  }

  next.prefersCenteredLayouts = next.signals.centeredLayoutExports >= 3;
  next.prefersLargeHeadline = next.signals.largeHeadlineKept >= 3;
  next.prefersLuxuryFonts = next.signals.luxuryTypographyKept >= 3;
  next.avoidsNeon = next.signals.neonRejected >= 3;
  next.usuallyChangesPalette = next.signals.paletteChanged >= 3;
  next.updatedAt = Date.now();
  return next;
}

function updateCocoGlobalDesignPatterns(
  patterns: GlobalDesignPattern[],
  event: CocoLearningEvent
): GlobalDesignPattern[] {
  const suggestion = event.cocoSuggestion;
  const key = globalPatternKey(event.eventType, suggestion);
  const successScore = scoreCocoLearningSuccess(event);
  const current =
    patterns.find((pattern) => pattern.key === key) ??
    ({
      averageSuccessScore: 0,
      eventType: event.eventType,
      exportRate: 0,
      exportedCount: 0,
      key,
      layoutStyle: suggestion.layoutId,
      paidConversionRate: 0,
      paidCount: 0,
      paletteStyle: suggestion.paletteId,
      sampleSize: 0,
      savedCount: 0,
      totalSuccessScore: 0,
      typographyStyle: suggestion.typographyId,
      updatedAt: Date.now(),
    } satisfies GlobalDesignPattern);

  const sampleSize = current.sampleSize + 1;
  const exportedCount = current.exportedCount + (event.userAction.exported ? 1 : 0);
  const paidCount = current.paidCount + (event.userAction.paidDownload ? 1 : 0);
  const savedCount = current.savedCount + (event.userAction.saved ? 1 : 0);
  const totalSuccessScore = current.totalSuccessScore + successScore;
  const nextPattern: GlobalDesignPattern = {
    ...current,
    averageSuccessScore: round(totalSuccessScore / sampleSize, 2),
    exportRate: round(exportedCount / sampleSize, 3),
    exportedCount,
    paidConversionRate: round(paidCount / sampleSize, 3),
    paidCount,
    sampleSize,
    savedCount,
    totalSuccessScore,
    updatedAt: Date.now(),
  };

  return [nextPattern, ...patterns.filter((pattern) => pattern.key !== key)]
    .sort((a, b) => b.averageSuccessScore - a.averageSuccessScore || b.sampleSize - a.sampleSize)
    .slice(0, MAX_PATTERNS);
}

function globalPatternKey(eventType: string, suggestion: CocoLearningSuggestion) {
  return [
    eventType || "general",
    suggestion.layoutId || "layout",
    suggestion.typographyId || "typography",
    suggestion.paletteId || "palette",
  ].join("|");
}

function normalizeTasteProfile(profile?: Partial<UserTasteProfile> | null): UserTasteProfile {
  const empty = createEmptyCocoUserTasteProfile();
  return {
    ...empty,
    ...profile,
    layoutCounts: { ...(profile?.layoutCounts ?? {}) },
    paletteCounts: { ...(profile?.paletteCounts ?? {}) },
    signals: {
      ...empty.signals,
      ...(profile?.signals ?? {}),
    },
    typographyCounts: { ...(profile?.typographyCounts ?? {}) },
    updatedAt: Number.isFinite(profile?.updatedAt) ? Number(profile?.updatedAt) : Date.now(),
  };
}

function normalizeSuggestion(suggestion: CocoLearningSuggestion): CocoLearningSuggestion {
  return {
    ...suggestion,
    layoutId: String(suggestion.layoutId || "unknown-layout"),
    paletteId: String(suggestion.paletteId || "unknown-palette"),
    score: Math.round(clamp(Number(suggestion.score) || 0, 0, 100)),
    typographyId: String(suggestion.typographyId || "unknown-type"),
  };
}

function isGlobalDesignPattern(value: GlobalDesignPattern) {
  return Boolean(value?.key && value?.layoutStyle && value?.typographyStyle && value?.paletteStyle);
}

function isNeonSuggestion(suggestion: CocoLearningSuggestion) {
  const text = [
    suggestion.paletteId,
    suggestion.paletteStyle,
    suggestion.moodId,
    suggestion.directionId,
    suggestion.nightlifeStyle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(neon|electric|rave|edm|techno|glitch)\b/.test(text);
}

function isLuxuryTypographySuggestion(suggestion: CocoLearningSuggestion) {
  const text = [suggestion.typographyId, suggestion.typographyPersonality, suggestion.headlineTreatment]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\b(luxury|elegant|editorial|serifluxury|serif)\b/.test(text);
}

function isLargeHeadlineDirection(suggestion: CocoLearningSuggestion) {
  const text = [suggestion.directionId, suggestion.layoutId].filter(Boolean).join(" ").toLowerCase();
  return /\b(center|bold|high-energy|close-crop)\b/.test(text);
}

function isLargeHeadlineSnapshot(snapshot?: CocoLearningDesignSnapshot | null) {
  const headlineSize = Number(snapshot?.typography?.headlineSize ?? 0);
  const headlineScale = Number(snapshot?.typography?.headlineScale ?? 0);
  return headlineSize >= 78 || headlineScale >= 1.05;
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
