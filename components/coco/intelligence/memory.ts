import type { CocoFinding, CocoMemorySnapshot } from "./types";

type CreateCocoMemorySnapshotInput = {
  acceptedFindingIds?: readonly string[];
  cooldownMs?: number;
  dismissedFindingIds?: readonly string[];
  lastShownAtByFindingId?: Readonly<Record<string, number>>;
  now?: number;
};

export function createCocoMemorySnapshot({
  acceptedFindingIds = [],
  cooldownMs = 18000,
  dismissedFindingIds = [],
  lastShownAtByFindingId = {},
  now = Date.now(),
}: CreateCocoMemorySnapshotInput = {}): CocoMemorySnapshot {
  return {
    acceptedFindingIds,
    cooldownMs,
    dismissedFindingIds,
    lastShownAtByFindingId,
    now,
  };
}

export function getCocoFindingMemoryKey(finding: CocoFinding) {
  return finding.id;
}

export function isCocoFindingSuppressed(finding: CocoFinding, memory: CocoMemorySnapshot) {
  const key = getCocoFindingMemoryKey(finding);
  if (memory.acceptedFindingIds.includes(key)) return true;
  if (memory.dismissedFindingIds.includes(key)) return true;

  const lastShownAt = memory.lastShownAtByFindingId[key];
  return typeof lastShownAt === "number" && memory.now - lastShownAt < memory.cooldownMs;
}
