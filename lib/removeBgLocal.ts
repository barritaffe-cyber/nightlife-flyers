"use client";

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
  return URL.createObjectURL(blob);
}

export async function removeBackgroundLocal(imageSrc: string): Promise<string> {
  try {
    // Primary path: remove.bg via server route.
    return await removeBackgroundViaApi(imageSrc);
  } catch (err: any) {
    console.warn("remove.bg path failed, falling back to local model:", err?.message || err);
  }

  try {
    return await removeBackgroundWithLocalModel(imageSrc);
  } catch (err: any) {
    console.error("Background removal failed:", err?.message || err);
    return imageSrc;
  }
}
