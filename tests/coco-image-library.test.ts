import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  COCO_BACKGROUND_LIBRARY,
  COCO_SUBJECT_LIBRARY,
} from "../lib/cocoImageLibrary.ts";

const publicAssetPath = (src: string) =>
  path.join(process.cwd(), "public", src.replace(/^\//, ""));

test("Coco exposes every image in the current background and subject folders", async () => {
  assert.equal(COCO_BACKGROUND_LIBRARY.length, 16);
  assert.equal(COCO_SUBJECT_LIBRARY.length, 18);

  assert.ok(
    COCO_BACKGROUND_LIBRARY.every((asset) =>
      asset.src.startsWith("/create-with-coco/backgrounds2/")
    )
  );
  assert.ok(
    COCO_BACKGROUND_LIBRARY.every((asset) => !asset.src.includes("/backgrounds/background"))
  );
  assert.ok(
    COCO_SUBJECT_LIBRARY.every((asset) =>
      asset.src.startsWith("/create-with-coco/subjects/")
    )
  );

  await Promise.all(
    [...COCO_BACKGROUND_LIBRARY, ...COCO_SUBJECT_LIBRARY].map((asset) =>
      access(publicAssetPath(asset.src))
    )
  );

  const visibleImageFiles = (files: string[]) =>
    files.filter((file) => /\.(?:jpe?g|png|webp)$/i.test(file)).sort();
  const backgroundFiles = visibleImageFiles(
    await readdir(path.join(process.cwd(), "public/create-with-coco/backgrounds2"))
  );
  const subjectFiles = visibleImageFiles(
    await readdir(path.join(process.cwd(), "public/create-with-coco/subjects"))
  );

  assert.deepEqual(
    COCO_BACKGROUND_LIBRARY.map((asset) => path.basename(asset.src)).sort(),
    backgroundFiles
  );
  assert.deepEqual(
    COCO_SUBJECT_LIBRARY.map((asset) => path.basename(asset.src)).sort(),
    subjectFiles
  );
});
