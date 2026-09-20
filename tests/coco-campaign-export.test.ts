import assert from "node:assert/strict";
import test from "node:test";

import {
  coordinateCocoCampaignExport,
  type CocoCampaignExportProgress,
} from "../lib/coco/campaignExport.ts";

test("campaign export runs serially, maps per-format progress, and restores", async () => {
  const events: string[] = [];
  const progress: CocoCampaignExportProgress[] = [];
  let rendering = false;

  const result = await coordinateCocoCampaignExport({
    originalFormat: "story",
    switchFormat: async (format) => {
      events.push(`switch:${format}`);
    },
    waitForFormatReady: async (format) => {
      events.push(`wait:${format}`);
    },
    renderFormat: async (format, context) => {
      assert.equal(rendering, false, "format renders must never overlap");
      rendering = true;
      events.push(`render:start:${format}`);
      context.reportProgress(50);
      await Promise.resolve();
      events.push(`render:end:${format}`);
      rendering = false;
      return `${format}-artifact`;
    },
    restoreFormat: async (format) => {
      events.push(`restore:${format}`);
    },
    onProgress: (update) => progress.push(update),
  });

  assert.equal(result.ok, true);
  assert.equal(result.restored, true);
  assert.deepEqual(result.formats, ["story", "square"]);
  assert.deepEqual(result.completedFormats, ["story", "square"]);
  assert.deepEqual(result.artifacts, {
    square: "square-artifact",
    story: "story-artifact",
  });
  assert.deepEqual(events, [
    "wait:story",
    "render:start:story",
    "render:end:story",
    "switch:square",
    "wait:square",
    "render:start:square",
    "render:end:square",
    "restore:story",
  ]);

  const storyHalf = progress.find(
    (update) =>
      update.phase === "rendering" &&
      update.format === "story" &&
      update.formatProgress === 50
  );
  const squareHalf = progress.find(
    (update) =>
      update.phase === "rendering" &&
      update.format === "square" &&
      update.formatProgress === 50
  );
  assert.equal(storyHalf?.overallProgress, 25);
  assert.equal(squareHalf?.overallProgress, 75);
  assert.deepEqual(progress.at(-1), {
    format: "story",
    formatCount: 2,
    formatIndex: 1,
    formatProgress: 100,
    overallProgress: 100,
    phase: "finished",
  });
});

test("campaign export preserves its first artifact and error when the second render fails", async () => {
  const renderError = new Error("story renderer failed");
  const events: string[] = [];

  const result = await coordinateCocoCampaignExport({
    originalFormat: "square",
    switchFormat: async (format) => {
      events.push(`switch:${format}`);
    },
    waitForFormatReady: async (format) => {
      events.push(`wait:${format}`);
    },
    renderFormat: async (format) => {
      events.push(`render:${format}`);
      if (format === "story") throw renderError;
      return { filename: "campaign-square.png" };
    },
    restoreFormat: async (format) => {
      events.push(`restore:${format}`);
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.restored, true);
  assert.deepEqual(result.completedFormats, ["square"]);
  assert.deepEqual(result.artifacts, {
    square: { filename: "campaign-square.png" },
  });
  assert.equal(result.failure?.error, renderError);
  assert.equal(result.failure?.format, "story");
  assert.equal(result.failure?.phase, "render");
  assert.equal(result.restoreFailure, null);
  assert.deepEqual(events, [
    "wait:square",
    "render:square",
    "switch:story",
    "wait:story",
    "render:story",
    "restore:square",
  ]);
});

test("campaign export preserves both artifacts when restoring the original format fails", async () => {
  const restoreError = new Error("could not restore square");

  const result = await coordinateCocoCampaignExport({
    originalFormat: "square",
    switchFormat: async () => undefined,
    waitForFormatReady: async () => undefined,
    renderFormat: async (format) => ({ format }),
    restoreFormat: async () => {
      throw restoreError;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.restored, false);
  assert.deepEqual(result.completedFormats, ["square", "story"]);
  assert.deepEqual(result.artifacts, {
    square: { format: "square" },
    story: { format: "story" },
  });
  assert.equal(result.failure?.error, restoreError);
  assert.equal(result.failure?.format, "square");
  assert.equal(result.failure?.phase, "restore");
  assert.equal(result.restoreFailure, result.failure);
});

test("campaign export keeps the primary failure when restoration also fails", async () => {
  const waitError = new Error("story was not ready");
  const restoreError = new Error("restore failed too");

  const result = await coordinateCocoCampaignExport({
    originalFormat: "square",
    switchFormat: async () => undefined,
    waitForFormatReady: async (format) => {
      if (format === "story") throw waitError;
    },
    renderFormat: async (format) => `${format}-artifact`,
    restoreFormat: async () => {
      throw restoreError;
    },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.artifacts, { square: "square-artifact" });
  assert.equal(result.failure?.error, waitError);
  assert.equal(result.failure?.format, "story");
  assert.equal(result.failure?.phase, "wait");
  assert.equal(result.restoreFailure?.error, restoreError);
  assert.equal(result.restoreFailure?.phase, "restore");
});

test("campaign export accepts a deduplicated explicit subset", async () => {
  const rendered: string[] = [];

  const result = await coordinateCocoCampaignExport({
    originalFormat: "story",
    formats: ["square", "square"],
    switchFormat: async () => undefined,
    waitForFormatReady: async () => undefined,
    renderFormat: async (format) => {
      rendered.push(format);
      return format;
    },
    restoreFormat: async () => undefined,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.formats, ["square"]);
  assert.deepEqual(rendered, ["square"]);
  assert.deepEqual(result.artifacts, { square: "square" });
});
