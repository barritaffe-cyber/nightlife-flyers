// User's 1024px reference: cap height 696px. This bitmap font has a .75em cap.
const referenceToEm = 0.75 / 696;
export const GLOW_GLYPH_LAYOUT = [
  { scale: 1, yEm: 0, rotation: 0, overlapEm: 0 },
  { scale: .92, yEm: 28 * referenceToEm, rotation: -1, overlapEm: -40 * referenceToEm },
  { scale: .96, yEm: 8 * referenceToEm, rotation: 1, overlapEm: -32 * referenceToEm },
  { scale: 1.04, yEm: -12 * referenceToEm, rotation: 2, overlapEm: -36 * referenceToEm },
] as const;
