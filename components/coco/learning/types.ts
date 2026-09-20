export type CocoLearningUserAction = {
  accepted?: boolean;
  exported?: boolean;
  ignored?: boolean;
  modified?: boolean;
  paidDownload?: boolean;
  returnedToEdit?: boolean;
  saved?: boolean;
  shared?: boolean;
};

export type CocoLearningSuggestion = {
  conceptId?: string;
  directionId?: string;
  headlineTreatment?: string;
  layoutId: string;
  moodId?: string;
  nightlifeStyle?: string | null;
  paletteId: string;
  paletteStyle?: string;
  score: number;
  typographyId: string;
  typographyPersonality?: string;
};

export type CocoLearningDesignSnapshot = {
  artDirectorScores?: Record<string, unknown> | null;
  effects?: Record<string, unknown> | null;
  eventType?: string | null;
  exportCount?: number;
  imageMood?: string | null;
  layout?: Record<string, unknown> | null;
  paid?: boolean;
  palette?: Record<string, unknown> | null;
  typography?: Record<string, unknown> | null;
  userFinalEdits?: Record<string, unknown> | null;
};

export type CocoLearningEvent = {
  userId?: string;
  sessionId: string;
  templateId: string;
  eventType: string;
  cocoSuggestion: CocoLearningSuggestion;
  userAction: CocoLearningUserAction;
  finalDesignSnapshot?: CocoLearningDesignSnapshot | null;
  timestamp: number;
};

export type CocoLearningSignalCounts = {
  centeredLayoutExports: number;
  largeHeadlineKept: number;
  luxuryTypographyKept: number;
  neonRejected: number;
  paletteChanged: number;
  totalEvents: number;
};

export type UserTasteProfile = {
  avoidsNeon: boolean;
  prefersCenteredLayouts: boolean;
  prefersLargeHeadline: boolean;
  prefersLuxuryFonts: boolean;
  usuallyChangesPalette: boolean;
  signals: CocoLearningSignalCounts;
  layoutCounts: Record<string, number>;
  paletteCounts: Record<string, number>;
  typographyCounts: Record<string, number>;
  updatedAt: number;
};

export type GlobalDesignPattern = {
  averageSuccessScore: number;
  eventType: string;
  exportRate: number;
  exportedCount: number;
  key: string;
  layoutStyle: string;
  paidConversionRate: number;
  paidCount: number;
  paletteStyle: string;
  sampleSize: number;
  savedCount: number;
  totalSuccessScore: number;
  typographyStyle: string;
  updatedAt: number;
};

export type CocoLearningInput = {
  globalPatterns?: GlobalDesignPattern[] | null;
  userTasteProfile?: UserTasteProfile | null;
};

export type CocoLearningRecordResult = {
  event: CocoLearningEvent;
  globalPatterns: GlobalDesignPattern[];
  successScore: number;
  userTasteProfile: UserTasteProfile;
};
