import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { getNeonNightShiftFormatRecipe } from "../lib/recipes/neonNightShift.ts";
import { cocoCssRecipeAdapter } from "../scripts/build-neon-night-shift-master.mjs";
import {
  compileCssRecipeAdapter,
  readSemanticCssMaster,
} from "../scripts/lib/coco-css-recipe-compiler.mjs";

test("semantic CSS master exposes one unique marked element per Coco object", async () => {
  const html = await readFile(
    new URL("../public/generated-flyers/neon-night-shift-reference-master.html", import.meta.url),
    "utf8"
  );
  const master = readSemanticCssMaster(html, "neon-night-shift-css-master-geometry");
  const ids = master.objectElements.map((item) => item.objectId);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.sort(), [
    "compliance",
    "date",
    "details",
    "djLineup",
    "headline",
    "offer",
    "rsvp",
    "subheadline",
    "subject",
    "subtag",
    "time",
    "venue",
  ]);
  assert.ok(master.geometry.formats.square.zones.headline);
  assert.ok(master.geometry.formats.story.zones.headline);
  assert.ok(master.assetElements.length >= 15);
});

test("compiled Neon project records its CSS object contract in every format", async () => {
  const tempDirectory = await mkdtemp(join(tmpdir(), "coco-neon-adapter-"));
  const outputPath = join(tempDirectory, "neon-night-shift.nflyer");
  await compileCssRecipeAdapter(cocoCssRecipeAdapter, { outputPath, formatRefinements: {} });
  const project = JSON.parse(
    await readFile(outputPath, "utf8")
  );
  for (const format of ["square", "story"] as const) {
    const variant = project.state.session[format];
    assert.equal(variant.cocoCssCompiler.schemaVersion, 1);
    assert.equal(variant.cocoCssCompiler.semanticObjects.headline.stateField, "headline");
    assert.equal(variant.cocoCssCompiler.semanticObjects.time.stateField, "time");
    assert.equal(variant.cocoCssCompiler.semanticObjects.offer.stateField, "rightRail");
    const semanticRoles = variant.cocoCssCompiler.semanticTextBindings.flatMap((binding: any) => binding.segments.map((segment: any) => segment.semanticRole));
    assert.ok(semanticRoles.includes("lineupLabel"));
    assert.ok(semanticRoles.includes("offerLabel"));
    assert.ok(semanticRoles.includes("rsvpLabel"));
    assert.ok(semanticRoles.includes("doorsLabel"));
    assert.ok(semanticRoles.includes("complianceLabel"));
    assert.ok(semanticRoles.includes("venue"));
    const nativeShapes = variant.portraits.filter((asset: any) => asset.svgTemplate);
    assert.ok(nativeShapes.length >= 18);
    assert.ok(nativeShapes.every((asset: any) => asset.iconColor), "every Coco-native shape exposes its own color dot");
    assert.equal(variant.djLineupLabel, "MUSIC BY");
    assert.equal(variant.details2, "DJ NOVA\nDJ KAIRO\nDJ VYBE");
    assert.equal(variant.timeLabel, "DOORS OPEN");
    assert.equal(variant.time, "10:00PM");
    assert.equal(variant.timeLabelSize, format === "story" ? 11 : 8);
    assert.equal(variant.timeLabelColor, "#F50087");
    assert.equal(variant.timeLabelBgColor, "transparent");
    assert.equal(variant.timeX, variant.cocoCompositionSystem.rendererZones.doors.x);
    assert.equal(variant.timeY, variant.cocoCompositionSystem.rendererZones.doors.y);
    assert.equal(variant.timeX, getNeonNightShiftFormatRecipe(format).zones.doors.x);
    assert.equal(variant.timeY, getNeonNightShiftFormatRecipe(format).zones.doors.y);
    assert.equal(variant.complianceLabel, "ID REQUIRED");
    assert.equal(variant.compliance, "18+");
    assert.equal(variant.complianceLabelSize, format === "story" ? 8 : 7);
    assert.equal(variant.complianceLabelColor, "#F2F0ED");
    assert.equal(variant.complianceLabelBgColor, "transparent");
    assert.equal(variant.rightRailLabel, "SPECIAL");
    assert.equal(variant.rightRail, "VIP TABLES\nHOOKAH");
    assert.equal(variant.rightRailLabelSize, format === "story" ? 9 : 7);
    assert.equal(variant.rightRailLabelColor, "#020305");
    assert.equal(variant.rightRailLabelBgColor, "#00D9E9");
    assert.equal(variant.leftRailLabel, "VIP TABLES & INFO");
    assert.equal(variant.leftRail, "555 123 4567");
    assert.equal(variant.leftRailLabelSize, format === "story" ? 9 : 7);
    assert.equal(variant.leftRailLabelColor, "#F50087");
    assert.equal(variant.leftRailLabelBgColor, "#020305");
    assert.deepEqual(variant.cocoNeonSemanticFields, {
      timeLabel: "DOORS OPEN",
      time: "10:00PM",
      complianceLabel: "ID REQUIRED",
      compliance: "18+",
      offerLabel: "SPECIAL",
      offerCopy: "VIP TABLES\nHOOKAH",
      rsvpLabel: "VIP TABLES & INFO",
      rsvpContact: "555 123 4567",
    });
    assert.equal(variant.cocoCompositionSystem.rendererZones.headline.x, variant.headX);
  }
});

test("a second semantic CSS master compiles through an adapter without compiler changes", async () => {
  const tempDirectory = await mkdtemp(join(tmpdir(), "coco-css-adapter-"));
  const masterPath = join(tempDirectory, "independent-master.html");
  const outputPath = join(tempDirectory, "independent-master.nflyer");
  const squareZones = {
    title: { x: 8, y: 12, width: 84, height: 22 },
    frame: { x: 4, y: 4, width: 92, height: 92 },
  };
  const storyZones = {
    title: { x: 10, y: 18, width: 80, height: 16 },
    frame: { x: 5, y: 3, width: 90, height: 94 },
  };
  const geometry = {
    deniedUses: ["generic layout replacement"],
    formats: {
      square: { canvas: { width: 1080, height: 1080 }, zones: squareZones },
      story: { canvas: { width: 1080, height: 1920 }, zones: storyZones },
    },
  };
  await writeFile(masterPath, `<!doctype html><html><body>
    <section data-region="title" data-coco-object="title"><span>TONIGHT</span><br>AFTERGLOW</section>
    <div data-region="frame" data-coco-asset="frame"></div>
    <script type="application/json" id="independent-geometry">${JSON.stringify(geometry)}</script>
  </body></html>`);

  const recipe = {
    id: "independent-css-recipe",
    version: 1,
    runtime: {
      compositionPattern: "independent-css-recipe",
      formats: {
        square: { zones: squareZones },
        story: { zones: storyZones },
      },
    },
  };
  const objectMap = { title: { stateField: "headline", zone: "title" } };
  const adapter = {
    id: recipe.id,
    geometryScriptId: "independent-geometry",
    masterPath,
    outputPath,
    objectMap,
    recipe,
    semanticKeywordRules: [{ role: "eyebrow", pattern: /^TONIGHT$/i }],
    semanticBindingRules: {
      title: {
        valueField: "headline",
        labelField: "presenter",
        labelRoles: ["eyebrow"],
        transform: "uppercase",
      },
    },
    coordinateBindings: [{ zone: "headline", xField: "headX", yField: "headY" }],
    materializeFormat(format: "square" | "story", context: any) {
      const zones = context.geometry.formats[format].zones;
      return {
        format,
        headline: "",
        presenter: "",
        headX: zones.title.x,
        headY: zones.title.y,
        cocoVisualRecipeId: recipe.id,
        cocoVisualRecipeVersion: recipe.version,
        cocoVisualRecipeMaterializedVersion: recipe.version,
        cocoCenterLayoutOptionId: "subject-center",
        cocoCompositionSystem: { patternId: recipe.id, rendererZones: { headline: zones.title } },
        portraits: [{ id: `frame-${format}`, cocoAssetRole: "frame", url: "data:image/svg+xml,<svg/>" }],
        emojiList: [{ id: `frame-${format}`, cocoAssetRole: "frame", url: "data:image/svg+xml,<svg/>" }],
      };
    },
  };

  await compileCssRecipeAdapter(adapter, {
    formatRefinements: {
      square: { headX: 20, headY: 30, cocoVisualRecipeId: "cannot-override-provenance" },
    },
  });
  const project = JSON.parse(await readFile(outputPath, "utf8"));
  assert.equal(project.state.session.square.presenter, "TONIGHT");
  assert.equal(project.state.session.square.headline, "AFTERGLOW");
  assert.equal(project.state.session.square.cocoVisualRecipeId, recipe.id);
  assert.equal(project.state.session.square.cocoCompositionSystem.rendererZones.headline.x, 20);
  assert.equal(project.state.session.square.cocoCompositionSystem.rendererZones.headline.y, 30);
  assert.equal(project.state.session.story.cocoVisualRecipeId, recipe.id);
  assert.deepEqual(project.state.session.story.cocoCompositionSystem.rendererZones.headline, storyZones.title);
});
