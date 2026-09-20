export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function average(values: number[]): number {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return 0;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

export function weightedAverage(entries: Array<[number, number]>): number {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) return 0;
  return entries.reduce((sum, [value, weight]) => sum + value * weight, 0) / total;
}

export function stableSort<T>(items: T[], compare: (a: T, b: T) => number): T[] {
  return items.map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map(({ item }) => item);
}

export function severityWeight(severity: string): number {
  if (severity === "critical") return 5;
  if (severity === "high") return 4;
  if (severity === "medium") return 3;
  if (severity === "low") return 2;
  return 1;
}

export function unique<T>(values: T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
