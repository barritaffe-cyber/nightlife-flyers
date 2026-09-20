const SUPPORTED_KINDS = new Set(["text", "image", "shape", "svg", "texture"]);

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function assert(condition, message) {
  if (!condition) throw new Error(`Coco IR validation failed: ${message}`);
}

export function normalizeRect(rect) {
  return {
    x: finite(rect?.x),
    y: finite(rect?.y),
    width: finite(rect?.width),
    height: finite(rect?.height),
  };
}

export function createDocumentIR({
  id,
  format,
  canvas,
  objects = [],
  warnings = [],
  provenance = {},
}) {
  const document = {
    schemaVersion: 1,
    id,
    format,
    canvas: {
      width: finite(canvas?.width),
      height: finite(canvas?.height),
    },
    objects: objects.map((object, index) => ({
      ...object,
      bounds: normalizeRect(object.bounds),
      paintBounds: normalizeRect(object.paintBounds ?? object.bounds),
      stacking: {
        order: index,
        zIndex: 0,
        contextPath: [],
        ...(object.stacking ?? {}),
      },
      compileStatus: object.compileStatus ?? "compiled",
      warnings: Array.isArray(object.warnings) ? object.warnings : [],
    })),
    report: {
      compiled: objects.filter((object) => (object.compileStatus ?? "compiled") === "compiled").length,
      approximated: objects.filter((object) => object.compileStatus === "approximated").length,
      unsupported: objects.filter((object) => object.compileStatus === "unsupported").length,
      warnings,
    },
    provenance,
  };
  validateDocumentIR(document);
  return document;
}

export function validateDocumentIR(document) {
  assert(document && typeof document === "object", "document is missing");
  assert(document.schemaVersion === 1, "unsupported schema version");
  assert(document.id, "document has no stable id");
  assert(["square", "story"].includes(document.format), "format must be square or story");
  assert(document.canvas.width > 0 && document.canvas.height > 0, "canvas is empty");
  assert(Array.isArray(document.objects) && document.objects.length > 0, "document has no objects");
  const ids = new Set();
  for (const object of document.objects) {
    assert(object.id, "object has no stable id");
    assert(!ids.has(object.id), `duplicate object ${object.id}`);
    ids.add(object.id);
    assert(SUPPORTED_KINDS.has(object.kind), `${object.id} has unsupported kind ${object.kind}`);
    assert(object.bounds.width > 0 && object.bounds.height > 0, `${object.id} has empty bounds`);
    if (object.kind === "text") {
      assert(object.typography?.fontFamily, `${object.id} has no font family`);
      assert(finite(object.typography?.fontSizePx) > 0, `${object.id} has no font size`);
    }
    if (object.kind === "image" || object.kind === "texture") {
      assert(object.image?.src, `${object.id} has no image source`);
    }
  }
  return true;
}

