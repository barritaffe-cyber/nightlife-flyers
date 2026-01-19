// /lib/alignHeadline.ts
export function alignHeadline(headRef: React.RefObject<HTMLDivElement | null>) {
  const headlineEl = headRef?.current;
  if (!headlineEl) {
    alert("❌ Headline not found — ensure ref is attached");
    return;
  }

  // locate the same canvas wrapper used for positioning
  const canvasEl = headlineEl.closest(".absolute.inset-0.z-0.overflow-hidden") as HTMLElement | null;
  if (!canvasEl) {
    alert("❌ Canvas not found");
    return;
  }

  const cRect = canvasEl.getBoundingClientRect();
  const hRect = headlineEl.getBoundingClientRect();

  const centerY = ((cRect.height / 2 - hRect.height / 2) / cRect.height) * 100;
  headlineEl.style.top = `${centerY}%`;
  headlineEl.style.transformOrigin = "center center";

  console.log(`🧭 Headline vertically aligned to ${centerY.toFixed(2)}%`);
}
