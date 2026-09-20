export type CocoCompiledTextRun = {
  color?: string;
  fontFamily?: string;
  fontSizePx?: number;
  marginLeftEm?: number;
  fontStyle?: string;
  fontWeight?: string | number;
  runtimeFontFamily?: string;
  text?: string;
};

export type CocoResolvedTextRun = {
  breakAfter: boolean;
  color?: string;
  fontFamily?: string;
  fontSizePx?: number;
  marginLeftEm?: number;
  fontStyle?: string;
  fontWeight?: string | number;
  text: string;
};

type CocoCompiledTextObject = {
  paint?: { color?: string };
  text?: string;
  textRuns?: CocoCompiledTextRun[];
  typography?: {
    fontFamily?: string;
    fontSizePx?: number;
    fontStyle?: string;
    fontWeight?: string | number;
  };
};

const normalizedLine = (value: unknown) => String(value ?? "").trim();

function runStyleDiffersFromObject(
  run: CocoCompiledTextRun,
  object: CocoCompiledTextObject,
) {
  const typography = object.typography ?? {};
  const runtimeFamily = run.runtimeFontFamily;
  return (
    Boolean(run.marginLeftEm) ||
    (runtimeFamily && runtimeFamily !== typography.fontFamily) ||
    (Number.isFinite(Number(run.fontSizePx)) &&
      Math.abs(Number(run.fontSizePx) - Number(typography.fontSizePx)) > 0.01) ||
    (run.fontWeight != null && String(run.fontWeight) !== String(typography.fontWeight)) ||
    (run.fontStyle != null && String(run.fontStyle) !== String(typography.fontStyle)) ||
    (run.color != null && String(run.color) !== String(object.paint?.color))
  );
}

function resolvedRun(
  run: CocoCompiledTextRun,
  text: string,
  breakAfter: boolean,
  sizeScale: number,
) {
  return {
    breakAfter,
    color: run.color,
    fontFamily: run.runtimeFontFamily,
    fontSizePx: Number.isFinite(Number(run.fontSizePx))
      ? Number(run.fontSizePx) * sizeScale
      : undefined,
    ...(run.marginLeftEm !== undefined ? { marginLeftEm: run.marginLeftEm } : {}),
    fontStyle: run.fontStyle,
    fontWeight: run.fontWeight,
    text,
  } satisfies CocoResolvedTextRun;
}

/**
 * Retains authored span typography when a compiled text object contains one
 * independently styled run per line. Runtime copy may replace those lines,
 * but it must not erase the label/value hierarchy measured from the master.
 */
export function resolveCocoCompiledTextRuns(
  object: CocoCompiledTextObject,
  liveText: string,
  options: { liveFontSizePx?: number } = {},
): CocoResolvedTextRun[] | null {
  const runs = Array.isArray(object.textRuns)
    ? object.textRuns.filter((run) => normalizedLine(run.text))
    : [];
  if (runs.length < 2 || !runs.some((run) => runStyleDiffersFromObject(run, object))) {
    return null;
  }

  const authoredText = String(object.text ?? "").replace(/\r/g, "");
  const currentText = String(liveText ?? "").replace(/\r/g, "");
  const authoredSize = Number(object.typography?.fontSizePx);
  const liveSize = Number(options.liveFontSizePx);
  const sizeScale =
    Number.isFinite(authoredSize) && authoredSize > 0 && Number.isFinite(liveSize) && liveSize > 0
      ? liveSize / authoredSize
      : 1;
  const authoredLines = authoredText.split("\n");
  const runsMatchAuthoredLines =
    authoredLines.length === runs.length &&
    authoredLines.every(
      (line, index) => normalizedLine(line) === normalizedLine(runs[index]?.text),
    );

  if (runsMatchAuthoredLines) {
    const liveLines = currentText.split("\n");
    if (liveLines.length > runs.length) {
      // A role label plus an editable body can grow from two authored lines
      // to three or more live lines. Keep the leading authored hierarchy and
      // repeat the final (body) run for every additional body line.
      return liveLines.map((line, index) =>
        resolvedRun(
          runs[Math.min(index, runs.length - 1)],
          line,
          index < liveLines.length - 1,
          sizeScale,
        ),
      );
    }
    // Missing date metadata should keep the important day/month styles, which
    // occupy the final runs in authored stacked lockups.
    const runOffset = runs.length - liveLines.length;
    return liveLines.map((line, index) =>
      resolvedRun(runs[index + runOffset], line, index < liveLines.length - 1, sizeScale),
    );
  }

  // Two-part inline lockups such as regular "Classic" + bold "Lounge" retain
  // their hierarchy when replaced: all leading words use the first authored
  // style and the final word remains the emphasized second run.
  if (currentText !== authoredText) {
    const words = currentText.trim().split(/\s+/).filter(Boolean);
    if (runs.length === 2 && words.length >= 2 && !currentText.includes("\n")) {
      return [
        resolvedRun(runs[0], `${words.slice(0, -1).join(" ")} `, false, sizeScale),
        resolvedRun(runs[1], words.at(-1) ?? "", false, sizeScale),
      ];
    }
    return null;
  }
  return runs.map((run) => resolvedRun(run, String(run.text ?? ""), false, sizeScale));
}
