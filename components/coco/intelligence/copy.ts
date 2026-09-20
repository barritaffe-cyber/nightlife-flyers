import type { CocoCanvasSnapshot, CocoJudgment, CocoTextRole } from "./types";

const TEXT_LABELS: Record<CocoTextRole, string> = {
  date: "date",
  details: "details",
  details2: "extra details",
  headline: "headline",
  headline2: "second line",
  leftRail: "left rail",
  presenter: "presenter",
  price: "price",
  rightRail: "right rail",
  subtag: "support line",
  venue: "venue",
};

function targetLabel(judgment: CocoJudgment) {
  if (judgment.target?.type === "text") return TEXT_LABELS[judgment.target.role];
  if (judgment.target?.type === "subject") return "subject";
  return "layout";
}

export function getCocoLinesForJudgment(
  judgment: CocoJudgment,
  snapshot: CocoCanvasSnapshot
): string[] | null {
  void snapshot;
  const finding = judgment.finding;
  if (!judgment.intent || judgment.mode === "quiet" || !finding) return null;

  switch (judgment.intent) {
    case "readability_background_complexity":
    case "readability_contrast":
    case "readability_edge_distance":
    case "readability_glow_interference":
    case "readability_shadow_effectiveness":
    case "readability_stroke_effectiveness":
    case "readability_text_size":
    case "alignment_baseline_consistency":
    case "alignment_group_alignment":
    case "alignment_information_grouping":
    case "alignment_optical_center":
    case "alignment_subject_balance":
    case "balance_bottom_heavy":
    case "balance_left_heavy":
    case "balance_right_heavy":
    case "balance_top_heavy":
    case "balance_utility_too_heavy":
    case "rhythm_footer_stack_loose":
    case "rhythm_hero_stack_cramped":
    case "rhythm_info_stack_uneven":
    case "rhythm_utility_spacing_uneven":
      return [finding.observation, finding.recommendation];
    case "headline_too_long":
      return [finding.observation, "A tighter name will land faster."];
    case "headline_too_safe":
      return [finding.observation, "Make it the visual event."];
    case "script_too_timid":
      return [finding.observation, "Let it cross the hero word with intent."];
    case "date_stealing_attention":
      return [finding.observation, finding.recommendation];
    case "subject_covers_headline":
      return [finding.observation, "Give both a little room."];
    case "subject_covers_text":
      return [finding.observation, "I’d protect that information."];
    case "subject_off_canvas":
      return [finding.observation, finding.recommendation];
    case "subject_too_large":
      return [finding.observation, finding.recommendation];
    case "subject_too_small":
      return [finding.observation, finding.recommendation];
    case "text_near_edge":
      return [`The ${targetLabel(judgment)} is close to the edge.`, finding.recommendation];
    default:
      return [finding.observation, finding.recommendation];
  }
}

export function getCocoPostChangeLines(hasIssue: boolean, issueText?: string | null) {
  if (hasIssue && issueText) {
    return [issueText, "Did you mean to make that move?"];
  }

  return ["That move changes the balance.", "Did you mean to make it?"];
}

export function getCocoAcceptedChangeLines() {
  return ["Change accepted.", "Review spacing or continue."];
}
