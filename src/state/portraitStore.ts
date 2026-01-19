// src/state/portraitStore.ts
export type PortraitPose = {
  x: number;      // 0..100
  y: number;      // 0..100
  scale: number;  // 0.5..4.0
};

export const portraitDefaults: PortraitPose = {
  x: 60,
  y: 22,
  scale: 1,
};

// ---- Keys ----
function urlKey(designKey?: string) {
  return `nf:portrait:url:v1:${designKey || 'current'}`;
}
function poseKey(format: 'square' | 'story', designKey?: string) {
  return `nf:portrait:pose:v1:${designKey || 'current'}:${format}`;
}

// ---- URL (global) ----
export function loadPortraitUrl(designKey?: string): string | null {
  try {
    const v = localStorage.getItem(urlKey(designKey));
    return typeof v === 'string' && v ? v : null;
  } catch {
    return null;
  }
}
export function savePortraitUrl(url: string | null, designKey?: string) {
  try {
    if (url) localStorage.setItem(urlKey(designKey), url);
    else localStorage.removeItem(urlKey(designKey));
  } catch {}
}

// ---- Pose (per format) ----
export function loadPortraitPose(
  format: 'square' | 'story',
  designKey?: string
): PortraitPose {
  try {
    const raw = localStorage.getItem(poseKey(format, designKey));
    if (!raw) return { ...portraitDefaults };
    const p = JSON.parse(raw) as Partial<PortraitPose>;
    return {
      x: clampNum(p.x, 0, 100, portraitDefaults.x),
      y: clampNum(p.y, 0, 100, portraitDefaults.y),
      scale: clampNum(p.scale, 0.5, 4.0, portraitDefaults.scale),
    };
  } catch {
    return { ...portraitDefaults };
  }
}
export function savePortraitPose(
  format: 'square' | 'story',
  pose: PortraitPose,
  designKey?: string
) {
  try {
    const safe: PortraitPose = {
      x: clampNum(pose.x, 0, 100, portraitDefaults.x),
      y: clampNum(pose.y, 0, 100, portraitDefaults.y),
      scale: clampNum(pose.scale, 0.5, 4.0, portraitDefaults.scale),
    };
    localStorage.setItem(poseKey(format, designKey), JSON.stringify(safe));
  } catch {}
}

export function clearPortraitAll(designKey?: string) {
  try {
    localStorage.removeItem(urlKey(designKey));
    localStorage.removeItem(poseKey('square', designKey));
    localStorage.removeItem(poseKey('story', designKey));
  } catch {}
}

function clampNum(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (Number.isFinite(n)) return Math.min(max, Math.max(min, n));
  return fallback;
}
