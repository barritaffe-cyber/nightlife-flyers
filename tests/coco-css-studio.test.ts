import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPOSITION_REFINEMENT_RULES, TYPOGRAPHY_REPRODUCTION_RULES, previewDocument, validateCssDraft } from '../lib/coco/cssStudio.ts';
const valid='<main data-coco-canvas><div data-coco-role="headline">BRUNCH</div></main>';
test('composition pass compares the render and repairs decoration without claiming a pass',()=>{
  for(const phrase of ['CURRENT draft','thin rules','data-coco-kind="shape"','Keep working placements','Minor font','never\nclaim the revision passed']) assert.ok(COMPOSITION_REFINEMENT_RULES.includes(phrase),phrase);
});
test('typography instructions require weight, ink sizing and editable gradient treatment',()=>{
  for(const rule of ['Do not make all text bold','actual local regular/bold','Container width is not glyph width','background-clip:text','Solid reference text must remain solid']) assert.ok(TYPOGRAPHY_REPRODUCTION_RULES.includes(rule),rule);
});
test('CSS studio accepts annotated draft and rejects executable or unresolved content',()=>{
  assert.deepEqual(validateCssDraft(valid),[]);
  for(const extra of ['<script>alert(1)</script>','<img onerror="alert(1)">','<iframe src="x">','<img src="https://example.com/x">','__ASSET_2__','<style>@import "x";</style>']) assert.ok(validateCssDraft(valid+extra).length,extra);
  assert.equal(validateCssDraft('<div>missing semantic contract</div>').length,2);
});
test('preview blocks scripts, forms and remote images with restrictive CSP',()=>{
  const result=previewDocument(valid,'http://localhost:3003');
  assert.ok(result.includes("default-src 'none'"));
  assert.ok(result.includes("form-action 'none'"));
  assert.ok(result.includes("img-src data: blob:"));
  assert.ok(result.includes("font-src data: http://localhost:3003"));
});
