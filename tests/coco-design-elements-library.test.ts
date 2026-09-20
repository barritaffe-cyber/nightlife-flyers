import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const addedElements = [
  { id: "bold-plus", src: "/design-elements/bold+.svg", name: "Bold Plus" },
  { id: "dashed-plus", src: "/design-elements/dashed+.svg", name: "Dashed Plus" },
  { id: "slim-plus", src: "/design-elements/slim+.svg", name: "Slim Plus" },
] as const;

test("new plus SVGs are registered as editable design elements", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  for (const element of addedElements) {
    assert.match(
      page,
      new RegExp(
        `id: ["']${element.id}["'], src: ["']${element.src.replace(/[+]/g, "\\+")}["'], name: ["']${element.name}["']`,
      ),
    );

    const svg = await readFile(
      new URL(`../public${element.src}`, import.meta.url),
      "utf8",
    );
    assert.match(svg, /<svg\b/);
    assert.match(svg, /viewBox="0 0 128 128\.62"/);
    assert.match(svg, /<line\b/);
  }
});

test("the torn-paper PNG is registered through the raster design-element path", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const library = await readFile(
    new URL("../components/editor/LibraryPanel.tsx", import.meta.url),
    "utf8",
  );
  const optimized = await readFile(
    new URL("../public/textures/optimized/torn-paper.png", import.meta.url),
  );

  assert.match(page, /id: "torn-paper"/);
  assert.match(page, /src: "\/textures\/optimized\/torn-paper\.png"/);
  assert.match(page, /name: "Torn Paper"/);
  assert.match(page, /kind: "raster"/);
  assert.match(library, /const isRaster = item\.kind === 'raster'/);
  assert.match(library, /\.\.\.\(svgTemplate \? \{ svgTemplate, iconColor \} : \{\}\)/);
  assert.deepEqual([...optimized.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(optimized.readUInt32BE(16), 2800);
  assert.equal(optimized.readUInt32BE(20), 1202);
});
