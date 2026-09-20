import type { ArtDirectorInput } from "./types.ts";

export function validateArtDirectorInput(
  input: ArtDirectorInput
): string[] {
  const errors: string[] = [];

  if (!input.renderedSnapshot) errors.push("renderedSnapshot is required.");
  if (!input.renderedSnapshot?.width || input.renderedSnapshot.width <= 0) {
    errors.push("renderedSnapshot.width must be positive.");
  }
  if (!input.renderedSnapshot?.height || input.renderedSnapshot.height <= 0) {
    errors.push("renderedSnapshot.height must be positive.");
  }
  if (!input.renderedSnapshot?.elements) {
    errors.push("renderedSnapshot.elements is required.");
  }

  for (const element of input.renderedSnapshot?.elements ?? []) {
    if (!element.id) errors.push("Every rendered element requires an id.");
    if (!element.role) errors.push(`Rendered element ${element.id || "unknown"} requires a role.`);
    if (!element.rect) errors.push(`Rendered element ${element.id || "unknown"} requires a rect.`);
  }

  return errors;
}
