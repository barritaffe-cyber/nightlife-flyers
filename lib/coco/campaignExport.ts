export const COCO_CAMPAIGN_EXPORT_FORMATS = ["square", "story"] as const;

export type CocoCampaignExportFormat =
  (typeof COCO_CAMPAIGN_EXPORT_FORMATS)[number];

type MaybePromise<T> = T | Promise<T>;

export type CocoCampaignExportArtifacts<TArtifact> = Partial<
  Record<CocoCampaignExportFormat, TArtifact>
>;

export type CocoCampaignExportFailurePhase =
  | "switch"
  | "wait"
  | "render"
  | "restore";

export type CocoCampaignExportFailure = {
  error: unknown;
  format: CocoCampaignExportFormat;
  phase: CocoCampaignExportFailurePhase;
};

export type CocoCampaignExportProgressPhase =
  | "switching"
  | "waiting"
  | "rendering"
  | "format-complete"
  | "restoring"
  | "finished";

export type CocoCampaignExportProgress = {
  /** Zero-based position in the requested format queue. */
  formatIndex: number;
  formatCount: number;
  formatProgress: number;
  format: CocoCampaignExportFormat;
  overallProgress: number;
  phase: CocoCampaignExportProgressPhase;
};

export type CocoCampaignExportRenderContext = {
  formatIndex: number;
  formatCount: number;
  reportProgress: (formatProgress: number) => void;
};

export type CocoCampaignExportOptions<TArtifact> = {
  /**
   * The format visible when the operation starts. By default it is rendered
   * first, which avoids an unnecessary initial format transition.
   */
  originalFormat: CocoCampaignExportFormat;
  /** Optional subset/order. Defaults to both formats, original first. */
  formats?: readonly CocoCampaignExportFormat[];
  switchFormat: (format: CocoCampaignExportFormat) => MaybePromise<void>;
  waitForFormatReady: (format: CocoCampaignExportFormat) => MaybePromise<void>;
  renderFormat: (
    format: CocoCampaignExportFormat,
    context: CocoCampaignExportRenderContext
  ) => MaybePromise<TArtifact>;
  /** Must resolve only after the original format has been restored. */
  restoreFormat: (format: CocoCampaignExportFormat) => MaybePromise<void>;
  onProgress?: (progress: CocoCampaignExportProgress) => void;
};

export type CocoCampaignExportResult<TArtifact> = {
  artifacts: CocoCampaignExportArtifacts<TArtifact>;
  completedFormats: readonly CocoCampaignExportFormat[];
  failure: CocoCampaignExportFailure | null;
  formats: readonly CocoCampaignExportFormat[];
  ok: boolean;
  restored: boolean;
  /**
   * Set when restoration fails. If export also failed, `failure` keeps the
   * original export error and this field preserves the restoration error.
   */
  restoreFailure: CocoCampaignExportFailure | null;
};

function isCampaignExportFormat(value: unknown): value is CocoCampaignExportFormat {
  return value === "square" || value === "story";
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function buildFormatQueue(
  originalFormat: CocoCampaignExportFormat,
  requestedFormats?: readonly CocoCampaignExportFormat[]
) {
  if (!isCampaignExportFormat(originalFormat)) {
    throw new TypeError(`Unsupported original campaign format: ${String(originalFormat)}`);
  }

  const source = requestedFormats ?? [
    originalFormat,
    originalFormat === "square" ? "story" : "square",
  ];
  const formats: CocoCampaignExportFormat[] = [];

  for (const format of source) {
    if (!isCampaignExportFormat(format)) {
      throw new TypeError(`Unsupported campaign export format: ${String(format)}`);
    }
    if (!formats.includes(format)) formats.push(format);
  }

  if (!formats.length) {
    throw new RangeError("Campaign export requires at least one format.");
  }

  return formats;
}

/**
 * Runs format exports one at a time against a caller-owned renderer.
 *
 * Operational callback failures are returned as data so a caller can retain
 * already-rendered artifacts. The original format is always restored in the
 * `finally` path. Progress observer errors are ignored because UI reporting
 * must not cancel a render.
 */
export async function coordinateCocoCampaignExport<TArtifact>(
  options: CocoCampaignExportOptions<TArtifact>
): Promise<CocoCampaignExportResult<TArtifact>> {
  const formats = buildFormatQueue(options.originalFormat, options.formats);
  const artifacts: CocoCampaignExportArtifacts<TArtifact> = {};
  const completedFormats: CocoCampaignExportFormat[] = [];
  let currentFormat = options.originalFormat;
  let activeFormat = formats[0];
  let activePhase: Exclude<CocoCampaignExportFailurePhase, "restore"> = "wait";
  let failure: CocoCampaignExportFailure | null = null;
  let restoreFailure: CocoCampaignExportFailure | null = null;
  let restored = false;
  let lastOverallProgress = 0;

  const emitProgress = (
    format: CocoCampaignExportFormat,
    formatIndex: number,
    phase: CocoCampaignExportProgressPhase,
    rawFormatProgress: number,
    rawOverallProgress?: number
  ) => {
    const formatProgress = clampPercent(rawFormatProgress);
    const calculatedOverall =
      rawOverallProgress ??
      ((formatIndex + formatProgress / 100) / formats.length) * 100;
    const overallProgress = Math.max(
      lastOverallProgress,
      clampPercent(calculatedOverall)
    );
    lastOverallProgress = overallProgress;

    try {
      options.onProgress?.({
        format,
        formatCount: formats.length,
        formatIndex,
        formatProgress,
        overallProgress,
        phase,
      });
    } catch {
      // Progress is observational and must never break the export transaction.
    }
  };

  try {
    for (let formatIndex = 0; formatIndex < formats.length; formatIndex += 1) {
      const format = formats[formatIndex];
      activeFormat = format;

      if (format !== currentFormat) {
        activePhase = "switch";
        emitProgress(format, formatIndex, "switching", 0);
        await options.switchFormat(format);
        currentFormat = format;
      }

      activePhase = "wait";
      emitProgress(format, formatIndex, "waiting", 0);
      await options.waitForFormatReady(format);

      activePhase = "render";
      emitProgress(format, formatIndex, "rendering", 0);
      let lastFormatProgress = 0;
      const artifact = await options.renderFormat(format, {
        formatCount: formats.length,
        formatIndex,
        reportProgress: (rawProgress) => {
          lastFormatProgress = Math.max(
            lastFormatProgress,
            clampPercent(rawProgress)
          );
          emitProgress(format, formatIndex, "rendering", lastFormatProgress);
        },
      });

      artifacts[format] = artifact;
      completedFormats.push(format);
      emitProgress(format, formatIndex, "format-complete", 100);
    }
  } catch (error) {
    failure = {
      error,
      format: activeFormat,
      phase: activePhase,
    };
  } finally {
    const completedOverall = (completedFormats.length / formats.length) * 100;
    emitProgress(
      options.originalFormat,
      Math.max(0, completedFormats.length - 1),
      "restoring",
      100,
      completedOverall
    );
    try {
      await options.restoreFormat(options.originalFormat);
      restored = true;
    } catch (error) {
      restoreFailure = {
        error,
        format: options.originalFormat,
        phase: "restore",
      };
    }
  }

  const resultFailure = failure ?? restoreFailure;
  if (!resultFailure) {
    emitProgress(
      options.originalFormat,
      formats.length - 1,
      "finished",
      100,
      100
    );
  }

  return {
    artifacts,
    completedFormats,
    failure: resultFailure,
    formats,
    ok: resultFailure === null,
    restored,
    restoreFailure,
  };
}
