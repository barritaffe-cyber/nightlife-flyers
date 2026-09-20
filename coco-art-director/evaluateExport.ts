import type { ArtDirectorFinding, ArtDirectorInput } from "./types.ts";

export function evaluateExportIntegrity(
  input: ArtDirectorInput
): ArtDirectorFinding[] {
  const findings: ArtDirectorFinding[] = [];
  const metrics = input.renderedSnapshot.globalMetrics;

  if (metrics?.previewExportMatch === false) {
    findings.push({
      id: "export:preview-mismatch",
      category: "exportIntegrity",
      severity: "critical",
      confidence: 1,
      observation: "Preview and export do not match.",
      cause: "The export renderer is not using the same immutable design model.",
      evidence: ["previewExportMatch=false."],
      targetIds: [],
      contractIds: ["preview-export-parity"],
      scorePenalty: 30,
      blocker: true,
      userFacingMessage: "Export is blocked because the saved flyer does not match the preview.",
    });
  }

  if (metrics?.exportClipped) {
    findings.push({
      id: "export:clipped",
      category: "exportIntegrity",
      severity: "critical",
      confidence: 1,
      observation: "The exported artwork is clipped.",
      cause: "One or more rendered elements exceed export bounds.",
      evidence: ["exportClipped=true."],
      targetIds: [],
      contractIds: ["preview-export-parity"],
      scorePenalty: 30,
      blocker: true,
      userFacingMessage: "Export is blocked because artwork is being cut off.",
    });
  }

  if ((metrics?.safeMarginViolations ?? 0) > 2) {
    findings.push({
      id: "export:many-margin-violations",
      category: "exportIntegrity",
      severity: "high",
      confidence: 0.95,
      observation: "Several elements are outside safe margins.",
      cause: "The render model is not respecting export-safe bounds.",
      evidence: [`Safe margin violations: ${metrics?.safeMarginViolations}.`],
      targetIds: [],
      contractIds: [],
      scorePenalty: 12,
      blocker: false,
      userFacingMessage: "Several elements need to be pulled inward before export.",
    });
  }

  return findings;
}
