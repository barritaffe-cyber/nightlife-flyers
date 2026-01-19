// /app/lib/isActiveUtil.ts
export type MoveTarget =
  | 'headline'
  | 'headline2'
  | 'details'
  | 'details2'
  | 'venue'
  | 'subtag'
  | 'logo'
  | 'portrait'
  | 'icon'
  | string;

/**
 * Pure helper to determine active element.
 * You pass the current moveMode, moveTarget, dragging, and the target name.
 */
export function isActiveUtil(
  t: MoveTarget,
  moveMode: boolean,
  moveTarget: MoveTarget | null,
  dragging: MoveTarget | null
): boolean {
  return dragging === t || (moveMode && moveTarget === t);
}
