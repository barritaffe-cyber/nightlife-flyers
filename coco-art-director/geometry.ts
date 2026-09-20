import type { Rect } from "./types.ts";

export function area(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

export function center(rect: Rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

export function intersection(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= x || bottom <= y) return null;
  return { x, y, width: right - x, height: bottom - y };
}

export function overlapRatio(a: Rect, b: Rect, denominator: "a" | "b" | "min" = "a"): number {
  const overlap = intersection(a, b);
  if (!overlap) return 0;
  const overlapArea = area(overlap);
  const base =
    denominator === "a" ? area(a) :
    denominator === "b" ? area(b) :
    Math.min(area(a), area(b));
  return base <= 0 ? 0 : overlapArea / base;
}

export function distanceBetweenRects(a: Rect, b: Rect): number {
  const ac = center(a);
  const bc = center(b);
  return Math.hypot(ac.x - bc.x, ac.y - bc.y);
}

export function edgeDistances(rect: Rect) {
  return {
    left: rect.x,
    right: 100 - (rect.x + rect.width),
    top: rect.y,
    bottom: 100 - (rect.y + rect.height),
  };
}

export function rectInside(rect: Rect, bounds: Rect): boolean {
  return (
    rect.x >= bounds.x &&
    rect.y >= bounds.y &&
    rect.x + rect.width <= bounds.x + bounds.width &&
    rect.y + rect.height <= bounds.y + bounds.height
  );
}

export function safeBounds(format: "square" | "story"): Rect {
  return format === "story"
    ? { x: 5, y: 7, width: 90, height: 86 }
    : { x: 5, y: 5, width: 90, height: 90 };
}

export function horizontalAlignmentDelta(a: Rect, b: Rect, align: "left" | "center" | "right") {
  if (align === "left") return Math.abs(a.x - b.x);
  if (align === "right") return Math.abs(a.x + a.width - (b.x + b.width));
  return Math.abs(center(a).x - center(b).x);
}

export function verticalGap(a: Rect, b: Rect): number {
  return b.y - (a.y + a.height);
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
