import type {
  ImageLayer,
  PosterCandidate,
  PosterSize,
  Rect,
  SceneLayer,
  SubjectAnalysis,
  TextLayer,
} from "./artDirectorEngine";

export type OverlapIntent = "forbidden" | "allowed" | "encouraged" | "required";

export type OverlapPlane =
  | "behind_subject"
  | "subject_plane"
  | "front_of_subject"
  | "information_plane"
  | "foreground_fx";

export type OverlapRole =
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

export type OverlapDecision = {
  role: OverlapRole;
  intent: OverlapIntent;
  plane: OverlapPlane;
  targetZone?: "face" | "torso" | "shoulders" | "lower_body" | "outside_subject";
  zIndex: number;
  allowFaceOverlap: boolean;
  allowTorsoOverlap: boolean;
  allowSubjectOverlap: boolean;
  requiredIntersectionRatio?: number;
  maxIntersectionRatio?: number;
  action: "sendBehind" | "bringForward" | "crossTorso" | "avoidSubject" | "avoidFace" | "keep";
};

export type OverlapDirectorOptions = {
  style?: "red_only_center_hero" | "center_hero_big_ghost" | "miami_luxe" | "neon_club" | "editorial";
  enforceRequiredOverlaps?: boolean;
  protectFace?: boolean;
  protectMetadata?: boolean;
  allowPrimaryTitleBodyOverlap?: boolean;
};

export type OverlapCritique = {
  passed: boolean;
  score: number;
  failures: string[];
  fixes: string[];
};

type SubjectOverlapZones = {
  full: Rect;
  face?: Rect;
  torso?: Rect;
  shoulders?: Rect;
  lowerBody?: Rect;
};

export function applyDepthOverlapDirector(
  candidate: PosterCandidate,
  subject?: SubjectAnalysis,
  options: OverlapDirectorOptions = {}
): PosterCandidate {
  const c = cloneCandidate(candidate);
  const subjectLayer = findSubjectLayer(c);
  if (!subjectLayer) return c;

  const subjectZones = buildSubjectOverlapZones(subjectLayer.bounds, subject);
  const decisions = buildOverlapDecisions(c, options);

  for (const layer of c.layers) {
    if (!isTextLayer(layer)) continue;
    const role = getOverlapRole(layer);
    const decision = decisions[role] ?? decisions.unknown;
    applyOverlapDecision({
      layer,
      subjectLayer,
      subjectZones,
      decision,
      size: c.size,
    });
  }

  subjectLayer.zIndex = 30;
  subjectLayer.meta = {
    ...subjectLayer.meta,
    overlapPlane: "subject_plane",
    depthRole: "hero_subject",
  };

  repairForbiddenOverlaps(c, subjectLayer, subjectZones, options);

  const critique = critiqueOverlap(c, subject, options);
  c.score = mergeOverlapScore(c.score, critique);
  c.layers = c.layers.sort((a, b) => a.zIndex - b.zIndex);
  return c;
}

function buildOverlapDecisions(
  _candidate: PosterCandidate,
  options: OverlapDirectorOptions
): Record<OverlapRole, OverlapDecision> {
  const allowPrimaryBody = options.allowPrimaryTitleBodyOverlap ?? true;

  return {
    ghostTitle: {
      role: "ghostTitle",
      intent: "required",
      plane: "behind_subject",
      targetZone: "torso",
      zIndex: 12,
      allowFaceOverlap: true,
      allowTorsoOverlap: true,
      allowSubjectOverlap: true,
      requiredIntersectionRatio: 0.18,
      action: "sendBehind",
    },
    scriptAccent: {
      role: "scriptAccent",
      intent: "encouraged",
      plane: "front_of_subject",
      targetZone: "torso",
      zIndex: 58,
      allowFaceOverlap: false,
      allowTorsoOverlap: true,
      allowSubjectOverlap: true,
      requiredIntersectionRatio: 0.08,
      maxIntersectionRatio: 0.32,
      action: "crossTorso",
    },
    primaryTitle: {
      role: "primaryTitle",
      intent: allowPrimaryBody ? "allowed" : "forbidden",
      plane: "front_of_subject",
      targetZone: allowPrimaryBody ? "lower_body" : "outside_subject",
      zIndex: 54,
      allowFaceOverlap: false,
      allowTorsoOverlap: allowPrimaryBody,
      allowSubjectOverlap: allowPrimaryBody,
      maxIntersectionRatio: allowPrimaryBody ? 0.22 : 0,
      action: allowPrimaryBody ? "bringForward" : "avoidSubject",
    },
    dateBlock: infoDecision("dateBlock", 64),
    artistBlock: infoDecision("artistBlock", 64),
    offerLine: infoDecision("offerLine", 66),
    footerTitle: infoDecision("footerTitle", 66),
    addressLine: infoDecision("addressLine", 66),
    presenter: infoDecision("presenter", 66),
    unknown: infoDecision("unknown", 66),
  };
}

function infoDecision(role: OverlapRole, zIndex: number): OverlapDecision {
  return {
    role,
    intent: "forbidden",
    plane: "information_plane",
    targetZone: "outside_subject",
    zIndex,
    allowFaceOverlap: false,
    allowTorsoOverlap: false,
    allowSubjectOverlap: false,
    maxIntersectionRatio: 0,
    action: "avoidSubject",
  };
}

function applyOverlapDecision(args: {
  layer: TextLayer;
  subjectLayer: ImageLayer;
  subjectZones: SubjectOverlapZones;
  decision: OverlapDecision;
  size: PosterSize;
}): void {
  const { layer, subjectLayer, subjectZones, decision, size } = args;

  layer.zIndex = decision.zIndex;
  layer.meta = {
    ...layer.meta,
    overlapIntent: decision.intent,
    overlapPlane: decision.plane,
    overlapRole: decision.role,
    overlapDecision: decision,
  };

  switch (decision.action) {
    case "sendBehind":
      sendLayerBehindSubject(layer, subjectLayer, size, decision);
      break;
    case "crossTorso":
      placeLayerAcrossTorso(layer, subjectLayer, subjectZones, size, decision);
      break;
    case "bringForward":
      placePrimaryTitleWithBodyOverlap(layer, subjectLayer, subjectZones, size, decision);
      break;
    case "avoidSubject":
      moveLayerOutOfSubject(layer, subjectLayer, size);
      break;
    case "avoidFace":
      moveLayerAwayFromFace(layer, subjectZones, size);
      break;
    case "keep":
    default:
      break;
  }
}

function sendLayerBehindSubject(
  layer: TextLayer,
  subjectLayer: ImageLayer,
  size: PosterSize,
  decision: OverlapDecision
): void {
  layer.zIndex = Math.min(layer.zIndex, subjectLayer.zIndex - 10);
  layer.opacity = Math.min(layer.opacity, 0.58);
  layer.blendMode = "screen";

  const currentIntersection = intersectionRatio(layer.bounds, subjectLayer.bounds);
  if (currentIntersection < (decision.requiredIntersectionRatio ?? 0.15)) {
    layer.bounds = {
      x: -size.width * 0.08,
      y: size.height * 0.07,
      width: size.width * 1.16,
      height: size.height * 0.24,
    };
    layer.fontSize = Math.max(layer.fontSize, size.width * 0.22);
  }

  layer.shadow = {
    color: "rgba(255,0,70,0.45)",
    blur: 18,
    offsetX: 0,
    offsetY: 0,
  };
}

function placeLayerAcrossTorso(
  layer: TextLayer,
  subjectLayer: ImageLayer,
  subjectZones: SubjectOverlapZones,
  size: PosterSize,
  decision: OverlapDecision
): void {
  layer.zIndex = Math.max(layer.zIndex, subjectLayer.zIndex + 20);

  const torso = subjectZones.torso ?? subjectLayer.bounds;
  const face = subjectZones.face;
  layer.bounds = {
    x: Math.max(size.width * 0.08, subjectLayer.bounds.x - size.width * 0.1),
    y: torso.y + torso.height * 0.16,
    width: Math.min(size.width * 0.84, subjectLayer.bounds.width + size.width * 0.22),
    height: size.height * 0.085,
  };

  if (face && intersects(layer.bounds, face)) {
    layer.bounds.y = face.y + face.height + size.height * 0.025;
  }

  if (intersectionRatio(layer.bounds, torso) < (decision.requiredIntersectionRatio ?? 0.06)) {
    layer.bounds.y = torso.y + torso.height * 0.28;
  }

  layer.rotation = layer.rotation ?? -2;
  layer.opacity = 1;
  layer.shadow = {
    color: "rgba(255,255,255,0.85)",
    blur: 18,
    offsetX: 0,
    offsetY: 0,
  };
  layer.meta = {
    ...layer.meta,
    crossesSubject: true,
    crossesTorso: true,
  };
}

function placePrimaryTitleWithBodyOverlap(
  layer: TextLayer,
  subjectLayer: ImageLayer,
  subjectZones: SubjectOverlapZones,
  size: PosterSize,
  decision: OverlapDecision
): void {
  layer.zIndex = Math.max(layer.zIndex, subjectLayer.zIndex + 16);

  const lowerBody =
    subjectZones.lowerBody ?? {
      x: subjectLayer.bounds.x,
      y: subjectLayer.bounds.y + subjectLayer.bounds.height * 0.55,
      width: subjectLayer.bounds.width,
      height: subjectLayer.bounds.height * 0.32,
    };
  const face = subjectZones.face;
  layer.bounds = {
    x: -size.width * 0.04,
    y: lowerBody.y + lowerBody.height * 0.05,
    width: size.width * 1.08,
    height: size.height * 0.12,
  };

  if (face && intersects(layer.bounds, face)) {
    layer.bounds.y = face.y + face.height + size.height * 0.08;
  }

  if (intersectionRatio(layer.bounds, subjectLayer.bounds) > (decision.maxIntersectionRatio ?? 0.22)) {
    layer.bounds.y += size.height * 0.045;
  }

  layer.opacity = 1;
  layer.shadow = {
    color: "rgba(0,0,0,0.72)",
    blur: 14,
    offsetX: 0,
    offsetY: 6,
  };
}

function moveLayerOutOfSubject(layer: TextLayer, subjectLayer: ImageLayer, size: PosterSize): void {
  if (!intersects(layer.bounds, subjectLayer.bounds)) return;

  const role = getOverlapRole(layer);
  if (role === "dateBlock") {
    layer.bounds = abs(size, 0.065, 0.48, 0.18, 0.15);
    return;
  }
  if (role === "artistBlock") {
    layer.bounds = abs(size, 0.72, 0.5, 0.23, 0.13);
    return;
  }
  if (role === "offerLine") {
    layer.bounds = abs(size, 0.16, 0.79, 0.68, 0.04);
    return;
  }
  if (role === "footerTitle") {
    layer.bounds = abs(size, 0.13, 0.84, 0.74, 0.055);
    return;
  }
  if (role === "addressLine") {
    layer.bounds = abs(size, 0.18, 0.9, 0.64, 0.035);
    return;
  }
  if (role === "presenter") {
    layer.bounds = abs(size, 0.14, 0.035, 0.72, 0.035);
    return;
  }

  const subjectCenter = subjectLayer.bounds.x + subjectLayer.bounds.width / 2;
  layer.bounds.x = subjectCenter < size.width / 2 ? size.width * 0.7 : size.width * 0.06;
}

function moveLayerAwayFromFace(
  layer: TextLayer,
  subjectZones: SubjectOverlapZones,
  size: PosterSize
): void {
  const face = subjectZones.face;
  if (!face || !intersects(layer.bounds, face)) return;

  const role = getOverlapRole(layer);
  if (role === "scriptAccent") {
    layer.bounds.y = face.y + face.height + size.height * 0.025;
    return;
  }
  if (role === "primaryTitle") {
    layer.bounds.y = face.y + face.height + size.height * 0.08;
    return;
  }

  layer.bounds.x =
    layer.bounds.x + layer.bounds.width / 2 < size.width / 2
      ? size.width * 0.055
      : size.width * 0.72;
  if (intersects(layer.bounds, face)) {
    layer.bounds.y = face.y + face.height + size.height * 0.05;
  }
}

function repairForbiddenOverlaps(
  candidate: PosterCandidate,
  subjectLayer: ImageLayer,
  subjectZones: SubjectOverlapZones,
  options: OverlapDirectorOptions
): void {
  const protectFace = options.protectFace ?? true;
  const protectMetadata = options.protectMetadata ?? true;

  for (const layer of candidate.layers) {
    if (!isTextLayer(layer)) continue;

    const role = getOverlapRole(layer);
    const intent = String(layer.meta?.overlapIntent ?? "forbidden") as OverlapIntent;

    if (protectFace && subjectZones.face && role !== "scriptAccent" && role !== "ghostTitle") {
      if (intersects(layer.bounds, subjectZones.face)) {
        moveLayerAwayFromFace(layer, subjectZones, candidate.size);
      }
    }

    if (protectMetadata && intent === "forbidden" && intersects(layer.bounds, subjectLayer.bounds)) {
      moveLayerOutOfSubject(layer, subjectLayer, candidate.size);
    }
  }
}

export function critiqueOverlap(
  candidate: PosterCandidate,
  subject?: SubjectAnalysis,
  options: OverlapDirectorOptions = {}
): OverlapCritique {
  void options;

  const failures: string[] = [];
  const fixes: string[] = [];
  let score = 100;

  const subjectLayer = findSubjectLayer(candidate);
  if (!subjectLayer) {
    return {
      passed: true,
      score: 70,
      failures: ["No subject layer found for overlap critique."],
      fixes: ["Add an isolated subject layer."],
    };
  }

  const zones = buildSubjectOverlapZones(subjectLayer.bounds, subject);
  const ghost = findTextByRole(candidate, "ghostTitle");
  const script = findTextByRole(candidate, "scriptAccent");
  const primary = findTextByRole(candidate, "primaryTitle");
  const metadata = candidate.layers.filter(isTextLayer).filter((layer) => {
    const role = getOverlapRole(layer);
    return ["dateBlock", "artistBlock", "offerLine", "footerTitle", "addressLine", "presenter"].includes(role);
  });

  if (ghost) {
    if (ghost.zIndex >= subjectLayer.zIndex) {
      score -= 18;
      failures.push("Ghost title is not behind subject.");
      fixes.push("Set ghost title zIndex below subject.");
    }
    if (intersectionRatio(ghost.bounds, subjectLayer.bounds) < 0.12) {
      score -= 14;
      failures.push("Ghost title does not overlap subject enough to create depth.");
      fixes.push("Scale or move ghost title behind subject.");
    }
  }

  if (script) {
    if (script.zIndex <= subjectLayer.zIndex) {
      score -= 12;
      failures.push("Script accent should be in front of subject.");
      fixes.push("Raise script zIndex above subject.");
    }
    const torso = zones.torso ?? subjectLayer.bounds;
    if (intersectionRatio(script.bounds, torso) < 0.04) {
      score -= 12;
      failures.push("Script accent does not cross torso/body.");
      fixes.push("Place script accent across torso for designed depth.");
    }
    if (zones.face && intersects(script.bounds, zones.face)) {
      score -= 10;
      failures.push("Script accent touches face.");
      fixes.push("Move script down to chest/torso.");
    }
  }

  if (primary && zones.face && intersects(primary.bounds, zones.face)) {
    score -= 18;
    failures.push("Primary title overlaps face.");
    fixes.push("Primary title may overlap body, not face.");
  }

  for (const layer of metadata) {
    if (zones.face && intersects(layer.bounds, zones.face)) {
      score -= 20;
      failures.push(`${layer.id} overlaps face.`);
      fixes.push("Move metadata into side/footer modules.");
    }
    if (intersects(layer.bounds, subjectLayer.bounds)) {
      score -= 10;
      failures.push(`${layer.id} overlaps subject but should be informational.`);
      fixes.push("Keep metadata outside the subject silhouette.");
    }
  }

  score = clampScore(score);
  return {
    passed: score >= 76 && failures.length <= 2,
    score,
    failures,
    fixes,
  };
}

function buildSubjectOverlapZones(subjectRect: Rect, subject?: SubjectAnalysis): SubjectOverlapZones {
  const face = subject?.faceBox ? normalizedRectToAbsolute(subject.faceBox, subjectRect) : undefined;
  const torso = subject?.torsoBox
    ? normalizedRectToAbsolute(subject.torsoBox, subjectRect)
    : {
        x: subjectRect.x + subjectRect.width * 0.18,
        y: subjectRect.y + subjectRect.height * 0.28,
        width: subjectRect.width * 0.64,
        height: subjectRect.height * 0.38,
      };
  const shoulders = {
    x: subjectRect.x + subjectRect.width * 0.12,
    y: subjectRect.y + subjectRect.height * 0.22,
    width: subjectRect.width * 0.76,
    height: subjectRect.height * 0.2,
  };
  const lowerBody = {
    x: subjectRect.x + subjectRect.width * 0.14,
    y: subjectRect.y + subjectRect.height * 0.58,
    width: subjectRect.width * 0.72,
    height: subjectRect.height * 0.28,
  };

  return { full: subjectRect, face, torso, shoulders, lowerBody };
}

function getOverlapRole(layer: TextLayer): OverlapRole {
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

function findTextByRole(candidate: PosterCandidate, role: OverlapRole): TextLayer | undefined {
  return candidate.layers.find((layer) => isTextLayer(layer) && getOverlapRole(layer) === role) as
    | TextLayer
    | undefined;
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

function mergeOverlapScore(score: PosterCandidate["score"], critique: OverlapCritique): PosterCandidate["score"] {
  if (!score) {
    return {
      hierarchy: critique.score,
      readability: critique.score,
      subjectDominance: critique.score,
      styleMatch: critique.score,
      balance: critique.score,
      premiumFeel: critique.score,
      total: critique.score,
      rejected: !critique.passed,
      failures: critique.failures,
      notes: [...critique.failures, ...critique.fixes],
    };
  }

  const total = Math.round(score.total * 0.7 + critique.score * 0.3);
  return {
    ...score,
    readability: Math.round(score.readability * 0.7 + critique.score * 0.3),
    balance: Math.round(score.balance * 0.7 + critique.score * 0.3),
    premiumFeel: Math.round(score.premiumFeel * 0.75 + critique.score * 0.25),
    total,
    rejected: score.rejected || !critique.passed,
    failures: [...score.failures, ...critique.failures],
    notes: [...score.notes, ...critique.failures, ...critique.fixes],
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
