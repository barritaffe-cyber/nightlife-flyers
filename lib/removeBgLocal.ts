"use client";

export async function removeBackgroundLocal(imageSrc: string): Promise<string> {
  try {
    // ✅ MUST be dynamic import (browser only)
    const mod = await import("@imgly/background-removal");

    const removeBackground =
      (mod as any).removeBackground ||
      (mod as any).default?.removeBackground ||
      (mod as any).default;

    if (typeof removeBackground !== "function") {
      throw new Error("removeBackground function not found");
    }

    const config = {
      // ✅ CDN models
      publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
      output: {
        format: "image/png" as const,
        quality: 0.9,
      },
    };

    console.log("🎨 Removing background…");

    const blob: Blob = await removeBackground(imageSrc, config);
    const url = URL.createObjectURL(blob);

    console.log("✅ Background removed");
    return url;
  } catch (err: any) {
    console.error("❌ Background removal failed:", err);
    return imageSrc; // graceful fallback
  }
}
