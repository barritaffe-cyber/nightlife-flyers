import test from "node:test";
import assert from "node:assert/strict";

import { loadTemplate } from "../lib/template-utils.ts";

test("loadTemplate prefers explicit format variant", () => {
  const square = { headline: "SQUARE" };
  const story = { headline: "STORY" };
  const base = { headline: "BASE" };
  const tpl = {
    id: "t",
    label: "Template",
    preview: "/x.png",
    tags: [],
    base,
    formats: { square, story },
  } as any;

  assert.equal(loadTemplate(tpl, "story"), story);
  assert.equal(loadTemplate(tpl, "square"), square);
});

test("loadTemplate falls back to square when non-story format is passed", () => {
  const square = { headline: "SQUARE" };
  const tpl = {
    id: "t",
    label: "Template",
    preview: "/x.png",
    tags: [],
    base: { headline: "BASE" },
    formats: { square },
  } as any;

  assert.equal(loadTemplate(tpl, "unknown"), square);
});

test("loadTemplate falls back to base then empty object", () => {
  const base = { headline: "BASE" };
  const withBase = {
    id: "t1",
    label: "Template 1",
    preview: "/x.png",
    tags: [],
    base,
  } as any;
  const emptyTpl = {
    id: "t2",
    label: "Template 2",
    preview: "/x.png",
    tags: [],
  } as any;

  assert.equal(loadTemplate(withBase, "story"), base);
  assert.deepEqual(loadTemplate(emptyTpl, "square"), {});
});
