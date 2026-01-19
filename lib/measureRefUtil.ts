// /app/lib/measureRefUtil.ts
let measureRefInstance: HTMLHeadingElement | null = null;

export function setMeasureRef(ref: HTMLHeadingElement | null) {
  measureRefInstance = ref;
}

export function getMeasureRef(): HTMLHeadingElement | null {
  return measureRefInstance;
}
