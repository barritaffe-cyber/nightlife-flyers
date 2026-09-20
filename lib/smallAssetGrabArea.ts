/** Screen-pixel grab areas; never enlarge the artwork itself. */
export function smallAssetGrabPadding(width: number, height: number, touch = false, separator = false) {
  if (![width, height].every(n => Number.isFinite(n) && n > 0)) return null;
  const target = touch ? 44 : 36;
  // Hollow icons also need their centres to be selectable, even when their
  // outside dimensions already meet the minimum target size.
  const small = Math.max(width, height) <= 96;
  // Imported rules are not consistently tagged as separators.
  const thin = Math.min(width, height) <= (separator ? target : 18);
  if (!small && !thin) return null;
  return { x: Math.max(0, (target - width) / 2), y: Math.max(0, (target - height) / 2) };
}
