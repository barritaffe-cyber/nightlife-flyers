import type {
  DesignPatch,
  RenderedSnapshot,
} from "./types.ts";
import { normalizeText } from "./utils.ts";

export function snapshotSignature(snapshot: RenderedSnapshot): string {
  const payload = snapshot.elements
    .filter((element) => element.visible)
    .map((element) => [
      element.id,
      element.role,
      round3(element.rect.x),
      round3(element.rect.y),
      round3(element.rect.width),
      round3(element.rect.height),
      round3(element.opacity),
      normalizeText(element.text),
      element.fontFamily ?? "",
      round3(element.fontSize ?? 0),
      round3(element.visualPower ?? 0),
      element.color ?? "",
      round3(element.effects?.glow ?? 0),
      round3(element.effects?.blur ?? 0),
    ].join("|"))
    .sort()
    .join("||");

  return simpleHash(payload);
}

export function patchSignature(patch: DesignPatch): string {
  const values = Object.entries(patch.values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join("|");

  return simpleHash([
    patch.targetId,
    patch.action,
    values,
    patch.sourceFindingId,
  ].join("::"));
}

export function patchesSignature(patches: DesignPatch[]): string {
  return simpleHash(
    patches
      .map(patchSignature)
      .sort()
      .join("||")
  );
}

function simpleHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
