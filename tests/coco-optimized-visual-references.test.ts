import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  filterVisualReferencesBySubjectMode,
  mapOptimizedVisualsToTemplates,
  OPTIMIZED_VISUAL_REFERENCE_MANIFEST,
} from "../components/coco/referenceLayouts/optimizedVisualReferences.ts";
import type { TemplateSpec } from "../lib/templates.ts";

const projectRoot = process.cwd();

test("every finished flyer in samples/optimized is registered as a visual reference", async () => {
  const files = (await readdir(path.join(projectRoot, "public/samples/optimized")))
    .filter((name) => !name.startsWith("."))
    .sort();
  const registered = OPTIMIZED_VISUAL_REFERENCE_MANIFEST
    .map((reference) => path.basename(reference.imageUrl))
    .sort();

  assert.deepEqual(registered, files);
});

test("every optimized visual maps to a real template id in the application catalog", async () => {
  const templateSource = await readFile(path.join(projectRoot, "lib/templates.ts"), "utf8");
  for (const reference of OPTIMIZED_VISUAL_REFERENCE_MANIFEST) {
    const singleQuoted = `id: '${reference.templateId}'`;
    const doubleQuoted = `id: "${reference.templateId}"`;
    assert.ok(
      templateSource.includes(singleQuoted) || templateSource.includes(doubleQuoted),
      `${reference.imageUrl} points to missing template ${reference.templateId}`
    );
  }
});

test("mapping keeps the finished visual and exposes its square construction data", () => {
  const template: TemplateSpec = {
    id: "visual-test-template",
    label: "Visual test",
    preview: "/samples/optimized/visual-test.webp",
    tags: [],
    formats: {
      square: {
        headline: "TEST",
        headlineFamily: "Anton",
        headlineSize: 92,
        headX: 12,
        headY: 58,
      },
    },
  };
  const [reference] = mapOptimizedVisualsToTemplates([template], [
    {
      id: "visual-test",
      imageUrl: "/samples/optimized/visual-test.webp",
      templateId: template.id,
      subjectPosition: "center",
    },
  ]);

  assert.equal(reference.imageUrl, template.preview);
  assert.equal(reference.template, template);
  assert.equal(reference.construction, template.formats?.square);
  assert.equal(reference.construction.headlineFamily, "Anton");
  assert.equal(reference.construction.headX, 12);
});

test("an unpaired visual fails loudly instead of silently becoming coordinate-only evidence", () => {
  assert.throws(
    () => mapOptimizedVisualsToTemplates([], [{
      id: "missing",
      imageUrl: "/samples/optimized/missing.webp",
      templateId: "missing-template",
      subjectPosition: "none",
    }]),
    /has no template missing-template/
  );
});

test("background-only searches expose only recipes without subject layers", () => {
  const references = filterVisualReferencesBySubjectMode(
    OPTIMIZED_VISUAL_REFERENCE_MANIFEST,
    "none"
  );

  assert.ok(references.length >= 3);
  assert.ok(references.every((reference) => reference.subjectPosition === "none"));
  assert.deepEqual(
    references.map((reference) => reference.templateId).sort(),
    ["blk_tie", "edm_stage_co2", "miami_heat", "throwback_cassette"].sort()
  );
});

test("explicit subjects never search recipes marked as subject-free", () => {
  const references = filterVisualReferencesBySubjectMode(
    OPTIMIZED_VISUAL_REFERENCE_MANIFEST,
    "required"
  );

  assert.ok(references.length >= 3);
  assert.ok(references.every((reference) => reference.subjectPosition !== "none"));
});
