import type {
  CritiqueLoopInput,
} from "./types.ts";

export function validateCritiqueLoopInput(
  input: CritiqueLoopInput
): string[] {
  const errors: string[] = [];

  if (!input.initialSnapshot) {
    errors.push("initialSnapshot is required.");
  }

  if (!input.initialEvaluation) {
    errors.push("initialEvaluation is required.");
  }

  if (!input.adapters) {
    errors.push("adapters is required.");
  }

  if (!input.adapters?.applyPatches) {
    errors.push("adapters.applyPatches is required.");
  }

  if (!input.adapters?.renderSnapshot) {
    errors.push("adapters.renderSnapshot is required.");
  }

  if (!input.adapters?.evaluateArtwork) {
    errors.push("adapters.evaluateArtwork is required.");
  }

  if (!input.initialSnapshot?.id) {
    errors.push("initialSnapshot.id is required.");
  }

  if (!input.initialSnapshot?.elements) {
    errors.push("initialSnapshot.elements is required.");
  }

  return errors;
}
