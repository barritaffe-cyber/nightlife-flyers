import type {
  CocoCanvasFieldState,
  CocoCanvasPhase,
  CocoCanvasPostChangeState,
  CocoCanvasSnapshot,
  CocoCanvasSubjectIssue,
  CocoCanvasTextNode,
  CocoRect,
  CocoNightlifeStyle,
  CocoTargetRef,
} from "./types";
import type { CocoTone } from "../types";

type BuildCocoCanvasSnapshotInput = {
  activeTarget?: CocoTargetRef | null;
  artboardRect?: CocoRect | null;
  field?: CocoCanvasFieldState | null;
  format: "square" | "story";
  hasSubject?: boolean;
  headlineText?: string | null;
  isMobile?: boolean;
  nightlifeStyle?: CocoNightlifeStyle;
  phase: CocoCanvasPhase;
  postChange?: CocoCanvasPostChangeState | null;
  subjectIssue?: CocoCanvasSubjectIssue | null;
  templateId?: string | null;
  textNodes?: CocoCanvasTextNode[];
  tone: CocoTone;
  userIsDragging?: boolean;
};

export function buildCocoCanvasSnapshot({
  activeTarget,
  artboardRect = null,
  field = null,
  format,
  hasSubject = false,
  headlineText = null,
  isMobile = false,
  nightlifeStyle = "general-nightlife",
  phase,
  postChange = null,
  subjectIssue = null,
  templateId = null,
  textNodes = [],
  tone,
  userIsDragging = false,
}: BuildCocoCanvasSnapshotInput): CocoCanvasSnapshot {
  return {
    activeTarget: activeTarget ?? { type: "canvas" },
    artboardRect,
    field,
    format,
    hasSubject,
    headlineText,
    isMobile,
    nightlifeStyle,
    phase,
    postChange,
    subjectIssue,
    templateId,
    textNodes,
    tone,
    userIsDragging,
  };
}
