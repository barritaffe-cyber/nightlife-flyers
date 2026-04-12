"use client";

import { cleanupCutoutUrl, PREMIUM_CUTOUT_CLEANUP } from "./cleanupCutoutUrl";

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);base64/)?.[1] || "image/png";
  const bin = atob(b64 || "");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type: mime });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read remove-bg output"));
    reader.readAsDataURL(blob);
  });
}

async function toBlob(imageSrc: string): Promise<Blob> {
  if (imageSrc.startsWith("data:image/")) return dataUrlToBlob(imageSrc);
  const res = await fetch(imageSrc, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load image (${res.status})`);
  return await res.blob();
}

async function imageToPngDataUrl(imageSrc: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load remove-bg output"));
    el.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx || !canvas.width || !canvas.height) {
    throw new Error("Failed to render remove-bg output");
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

async function removeBackgroundViaApi(imageSrc: string): Promise<string> {
  const blob = await toBlob(imageSrc);
  const fd = new FormData();
  fd.append("image", blob, "image.png");

  const res = await fetch("/api/remove-bg", { method: "POST", body: fd });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `remove-bg API failed (${res.status})`);
  }

  const out = await res.blob();
  return await blobToDataUrl(out);
}

async function removeBackgroundWithLocalModel(imageSrc: string): Promise<string> {
  // Dynamic import keeps this browser-only and as a fallback path.
  const mod = await import("@imgly/background-removal");

  const removeBackground =
    (mod as any).removeBackground ||
    (mod as any).default?.removeBackground ||
    (mod as any).default;

  if (typeof removeBackground !== "function") {
    throw new Error("removeBackground function not found");
  }

  const config = {
    publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
    output: {
      format: "image/png" as const,
      quality: 0.9,
    },
  };

  const blob: Blob = await removeBackground(imageSrc, config);
  return await blobToDataUrl(blob);
}

async function refineCutoutOutput(output: string): Promise<string> {
  const pngOutput = output.startsWith("data:image/png")
    ? output
    : await imageToPngDataUrl(output);

  try {
    return await cleanupCutoutUrl(pngOutput, PREMIUM_CUTOUT_CLEANUP);
  } catch (err: any) {
    console.warn("Cutout cleanup failed, using raw remove-bg output:", err?.message || err);
    return pngOutput;
  }
}

export async function removeBackgroundLocal(imageSrc: string): Promise<string> {
  try {
    // Primary path: remove.bg via server route.
    const output = await removeBackgroundViaApi(imageSrc);
    return await refineCutoutOutput(output);
  } catch (err: any) {
    console.warn("remove.bg path failed, falling back to local model:", err?.message || err);
  }

  try {
    const output = await removeBackgroundWithLocalModel(imageSrc);
    return await refineCutoutOutput(output);
  } catch (err: any) {
    console.error("Background removal failed:", err?.message || err);
    throw new Error("Background removal failed");
  }
}
