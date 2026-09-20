import type {
  CopyArchitectInput,
  CopyArchitectureCandidate,
} from "./types.ts";

export function validateCopyArchitectInput(input: CopyArchitectInput): string[] {
  const errors: string[] = [];
  if (!input.event) errors.push("event is required.");
  if (!input.event?.name?.trim()) errors.push("event.name is required.");
  return errors;
}

export function validateCopyArchitecture(candidate: CopyArchitectureCandidate): string[] {
  const errors: string[] = [];
  if (!candidate.id) errors.push("candidate.id is required.");
  if (!candidate.groups.length) errors.push("candidate.groups cannot be empty.");
  if (!candidate.groups.some((group) => group.role === "identity" && group.treatment === "hero")) {
    errors.push("A hero identity group is required.");
  }

  for (const group of candidate.groups) {
    if (group.priority < 1 || group.priority > 5) errors.push(`${group.id} priority is invalid.`);
    if (group.maxLines < 1) errors.push(`${group.id} maxLines must be positive.`);
    if (group.powerRatio < 0 || group.powerRatio > 1.2) errors.push(`${group.id} powerRatio is invalid.`);
    if (group.treatment !== "hide" && !group.text.trim()) errors.push(`${group.id} is visible but has no text.`);
  }

  return errors;
}
