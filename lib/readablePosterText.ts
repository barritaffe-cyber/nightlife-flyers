import type {
  ImageLayer,
  LayoutScore,
  PosterCandidate,
  PosterSize,
  Rect,
  SceneLayer,
  SubjectAnalysis,
  TextLayer,
} from "./artDirectorEngine";

export type ReadableTextRole =
  | "ghostTitle"
  | "primaryTitle"
  | "scriptAccent"
  | "dateBlock"
  | "artistBlock"
  | "offerLine"
  | "footerTitle"
  | "addressLine"
  | "presenter"
  | "unknown";

export type ReadableTextIssue = {
  layerId: string;
  role: ReadableTextRole;
  issue: string;
  fix: string;
};

export type ReadablePosterTextOptions = {
  protectFace?: boolean;
  protectInformationText?: boolean;
  allowBodyTitleOverlap?: boolean;
};

type SubjectTextZones = {
  subject: Rect;
  face?: Rect;
  torso: Rect;
  lowerBody: Rect;
};

export function enforceReadablePosterText(
  candidate: PosterCandidate,
  subject?: SubjectAnalysis,
  options: ReadablePosterTextOptions = {}
): PosterCandidate {
  const c = cloneCandidate(candidate);
  const subjectLayer = findSubjectLayer(c);
  if (!subjectLayer) return c;

  const zones = buildSubjectTextZones(subjectLayer.bounds, subject);
  const issues: ReadableTextIssue[] = [];

  for (const layer of c.layers) {
    if (!isTextLayer(layer)) continue;

    const role = getReadableTextRole(layer);
    layer.meta = {
      ...layer.meta,
      readableTextRole: role,
      readableTextEnforced: true,
    };

    applyLegibilityTreatment(layer, role, subjectLayer);
    repairTextPlacement(layer, role, subjectLayer, zones, c.size, options, issues);
    clampLayerToCanvas(layer, c.size, role);
  }

  c.score = mergeReadableScore(c.score, issues);
  c.layers = c.layers.sort((a, b) => a.zIndex - b.zIndex);
  return c;
}

function repairTextPlacement(
  layer: TextLayer,
  role: ReadableTextRole,
  subjectLayer: ImageLayer,
  zones: SubjectTextZones,
  size: PosterSize,
  options: ReadablePosterTextOptions,
  issues: ReadableTextIssue[]
): void {
  const protectFace = options.protectFace ?? true;
  const protectInformationText = options.protectInformationText ?? true;
  const allowBodyTitleOverlap = options.allowBodyTitleOverlap ?? true;

  if (role === "ghostTitle") {
    layer.zIndex = Math.min(layer.zIndex, subjectLayer.zIndex - 12);
    layer.opacity = Math.min(layer.opacity, 0.58);
    return;
  }

  if (role === "scriptAccent") {
    layer.zIndex = Math.max(layer.zIndex, subjectLayer.zIndex + 20);
    if (protectFace && zones.face && intersects(layer.bounds, zones.face)) {
      layer.bounds.y = zones.face.y + zones.face.height + size.height * 0.028;
      issues.push(issue(layer, role, "Script accent crossed face.", "Moved script into chest/torso lane."));
    }
    if (intersectionRatio(layer.bounds, zones.torso) < 0.04) {
      layer.bounds.y = zones.torso.y + zones.torso.height * 0.24;
      issues.push(issue(layer, role, "Script accent missed torso depth lane.", "Recentered script across torso."));
    }
    return;
  }

  if (role === "primaryTitle") {
    layer.zIndex = Math.max(layer.zIndex, subjectLayer.zIndex + 16);
    if (protectFace && zones.face && intersects(layer.bounds, zones.face)) {
      layer.bounds.y = zones.face.y + zones.face.height + size.height * 0.07;
      issues.push(issue(layer, role, "Primary title touched face.", "Moved title below face."));
    }
    if (!allowBodyTitleOverlap && intersects(layer.bounds, subjectLayer.bounds)) {
      moveTextToNearestAir(layer, role, subjectLayer, size);
      issues.push(issue(layer, role, "Primary title overlap was disabled.", "Moved title to open air."));
    }
    return;
  }

  if (!protectInformationText) return;

  const informationRole = [
    "dateBlock",
    "artistBlock",
    "offerLine",
    "footerTitle",
    "addressLine",
    "presenter",
    "unknown",
  ].includes(role);

  if (!informationRole) return;

  const hitsFace = Boolean(zones.face && intersects(layer.bounds, zones.face));
  const hitsSubject = intersects(layer.bounds, subjectLayer.bounds);

  if (hitsFace || hitsSubject) {
    moveTextToNearestAir(layer, role, subjectLayer, size);
    issues.push(
      issue(
        layer,
        role,
        hitsFace ? "Information text overlapped face." : "Information text overlapped subject.",
        "Moved information text into reserved air lane."
      )
    );
  }

  if (zones.face && intersects(layer.bounds, zones.face)) {
    layer.bounds.y = zones.face.y + zones.face.height + size.height * 0.04;
  }
}

function applyLegibilityTreatment(layer: TextLayer, role: ReadableTextRole, subjectLayer: ImageLayer): void {
  if (role === "ghostTitle") {
    layer.blendMode = layer.blendMode ?? "screen";
    layer.shadow = layer.shadow ?? {
      color: "rgba(255,0,70,0.45)",
      blur: 18,
      offsetX: 0,
      offsetY: 0,
    };
    return;
  }

  if (role === "scriptAccent") {
    layer.opacity = Math.max(layer.opacity, 0.96);
    layer.shadow = layer.shadow ?? {
      color: "rgba(255,255,255,0.88)",
      blur: 18,
      offsetX: 0,
      offsetY: 0,
    };
    return;
  }

  layer.zIndex = Math.max(layer.zIndex, subjectLayer.zIndex + 24);
  layer.opacity = Math.max(layer.opacity, 0.94);
  layer.shadow = layer.shadow ?? {
    color: "rgba(0,0,0,0.78)",
    blur: 12,
    offsetX: 0,
    offsetY: 5,
  };
}

function moveTextToNearestAir(layer: TextLayer, role: ReadableTextRole, subjectLayer: ImageLayer, size: PosterSize): void {
  const subjectCenter = subjectLayer.bounds.x + subjectLayer.bounds.width / 2;
  const preferRight = subjectCenter < size.width / 2;

  switch (role) {
    case "dateBlock":
      layer.bounds = preferRight ? abs(size, 0.735, 0.47, 0.2, 0.14) : abs(size, 0.06, 0.47, 0.2, 0.14);
      break;
    case "artistBlock":
      layer.bounds = preferRight ? abs(size, 0.72, 0.55, 0.23, 0.12) : abs(size, 0.055, 0.55, 0.24, 0.12);
      break;
    case "offerLine":
      layer.bounds = abs(size, 0.14, 0.785, 0.72, 0.042);
      break;
    case "footerTitle":
      layer.bounds = abs(size, 0.12, 0.845, 0.76, 0.052);
      break;
    case "addressLine":
      layer.bounds = abs(size, 0.16, 0.905, 0.68, 0.034);
      break;
    case "presenter":
      layer.bounds = abs(size, 0.14, 0.035, 0.72, 0.035);
      break;
    default:
      layer.bounds.x = preferRight ? size.width * 0.7 : size.width * 0.06;
      break;
  }
}

function clampLayerToCanvas(layer: TextLayer, size: PosterSize, role: ReadableTextRole): void {
  const allowGhostCrop = role === "ghostTitle";
  const minX = allowGhostCrop ? -size.width * 0.12 : size.width * 0.03;
  const maxX = allowGhostCrop ? size.width * 0.12 : size.width * 0.97 - layer.bounds.width;
  const minY = allowGhostCrop ? -size.height * 0.04 : size.height * 0.025;
  const maxY = size.height * 0.96 - layer.bounds.height;

  layer.bounds = {
    ...layer.bounds,
    x: clamp(layer.bounds.x, minX, Math.max(minX, maxX)),
    y: clamp(layer.bounds.y, minY, Math.max(minY, maxY)),
  };
}

function buildSubjectTextZones(subjectRect: Rect, subject?: SubjectAnalysis): SubjectTextZones {
  const face = subject?.faceBox ? normalizedRectToAbsolute(subject.faceBox, subjectRect) : undefined;
  const torso = subject?.torsoBox
    ? normalizedRectToAbsolute(subject.torsoBox, subjectRect)
    : {
        x: subjectRect.x + subjectRect.width * 0.18,
        y: subjectRect.y + subjectRect.height * 0.28,
        width: subjectRect.width * 0.64,
        height: subjectRect.height * 0.38,
      };
  const lowerBody = {
    x: subjectRect.x + subjectRect.width * 0.14,
    y: subjectRect.y + subjectRect.height * 0.58,
    width: subjectRect.width * 0.72,
    height: subjectRect.height * 0.28,
  };
  return { subject: subjectRect, face, torso, lowerBody };
}

function mergeReadableScore(score: LayoutScore | undefined, issues: ReadableTextIssue[]): LayoutScore | undefined {
  if (!score) return undefined;
  const penalty = Math.min(18, issues.length * 3);
  const readability = clampScore(score.readability - penalty);
  return {
    ...score,
    readability,
    total: Math.round(score.total * 0.86 + readability * 0.14),
    rejected: score.rejected || issues.some((item) => item.issue.includes("face")),
    failures: [...score.failures, ...issues.map((item) => item.issue)],
    notes: [...score.notes, ...issues.map((item) => item.fix)],
  };
}

function getReadableTextRole(layer: TextLayer): ReadableTextRole {
  const raw = String(layer.meta?.role ?? layer.meta?.blueprintSlot ?? "");
  if (raw === "ghostTitle" || raw === "oversized_ghost_title" || layer.type === "ghostText") return "ghostTitle";
  if (raw === "primaryTitle" || raw === "primary_title" || layer.type === "headline") return "primaryTitle";
  if (raw === "scriptAccent" || raw === "accent_title" || layer.type === "scriptAccent") return "scriptAccent";
  if (raw === "dateBlock" || raw === "date_time_rail") return "dateBlock";
  if (raw === "artistBlock" || raw === "artist_block") return "artistBlock";
  if (raw === "offerLine") return "offerLine";
  if (raw === "footerTitle" || raw === "footer_info_system") return "footerTitle";
  if (raw === "addressLine") return "addressLine";
  if (raw === "presenter" || raw === "topPresenter") return "presenter";

  const id = layer.id.toLowerCase();
  if (id.includes("ghost")) return "ghostTitle";
  if (id.includes("headline") || id.includes("title")) return "primaryTitle";
  if (id.includes("script")) return "scriptAccent";
  if (id.includes("date")) return "dateBlock";
  if (id.includes("artist") || id.includes("dj")) return "artistBlock";
  if (id.includes("offer")) return "offerLine";
  if (id.includes("footer")) return "footerTitle";
  if (id.includes("address")) return "addressLine";
  return "unknown";
}

function findSubjectLayer(candidate: PosterCandidate): ImageLayer | undefined {
  return candidate.layers.find((layer) => {
    if (layer.type !== "subject") return false;
    return Boolean(layer.meta?.dominant) || layer.meta?.role === "subject" || layer.meta?.blueprintSlot === "subject";
  }) as ImageLayer | undefined;
}

function isTextLayer(layer: SceneLayer): layer is TextLayer {
  return ["ghostText", "headline", "scriptAccent", "metadata", "footer"].includes(layer.type);
}

function cloneCandidate(candidate: PosterCandidate): PosterCandidate {
  return {
    ...candidate,
    score: candidate.score
      ? {
          ...candidate.score,
          failures: [...candidate.score.failures],
          notes: [...candidate.score.notes],
        }
      : undefined,
    layers: candidate.layers.map((layer) => {
      if (isTextLayer(layer)) {
        return {
          ...layer,
          bounds: { ...layer.bounds },
          meta: { ...layer.meta },
          shadow: layer.shadow ? { ...layer.shadow } : undefined,
          stroke: layer.stroke ? { ...layer.stroke } : undefined,
        };
      }
      return {
        ...layer,
        bounds: { ...layer.bounds },
        meta: { ...layer.meta },
        filter: layer.filter ? { ...layer.filter } : undefined,
      };
    }) as SceneLayer[],
  };
}

function issue(layer: TextLayer, role: ReadableTextRole, issueText: string, fix: string): ReadableTextIssue {
  return {
    layerId: layer.id,
    role,
    issue: issueText,
    fix,
  };
}

function normalizedRectToAbsolute(normalized: Rect, container: Rect): Rect {
  return {
    x: container.x + normalized.x * container.width,
    y: container.y + normalized.y * container.height,
    width: normalized.width * container.width,
    height: normalized.height * container.height,
  };
}

function abs(size: PosterSize, x: number, y: number, w: number, h: number): Rect {
  return {
    x: size.width * x,
    y: size.height * y,
    width: size.width * w,
    height: size.height * h,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function intersectionArea(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
}

function area(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function intersectionRatio(a: Rect, b: Rect): number {
  const base = Math.max(1, Math.min(area(a), area(b)));
  return intersectionArea(a, b) / base;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampScore(value: number): number {
  return Math.round(clamp(value, 0, 100));
}
