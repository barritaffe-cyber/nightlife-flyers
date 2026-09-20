/** A compiled import owns its canvas even before admission to the recipe chooser. */
export function hasCocoCompiledCanvas(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const variant = value as Record<string, any>;
  const document = variant.cocoCompositionSystem?.compiledDocument;
  return Number(document?.schemaVersion) >= 1 &&
    Number(document?.canvas?.width) > 0 && Number(document?.canvas?.height) > 0 &&
    Array.isArray(document?.objects) && document.objects.length > 0 &&
    document.objects.every((object: any) => object && typeof object.id === "string" &&
      ["text", "image", "shape", "texture"].includes(object.kind));
}
