import assert from "node:assert/strict";
import test from "node:test";

import { resolveCocoCompiledTextRuns } from "../lib/coco/compiledTextRuns.ts";

const stackedObject = {
  text: "Doors Open\n5PM",
  typography: {
    fontFamily: "Anton",
    fontSizePx: 39.42,
    fontStyle: "normal",
    fontWeight: "900",
  },
  paint: { color: "rgb(255, 255, 255)" },
  textRuns: [
    {
      text: "Doors Open",
      color: "rgb(0, 255, 60)",
      fontFamily: "BaddiesSans, Arial, sans-serif",
      runtimeFontFamily: "LEMONMILK-Bold",
      fontSizePx: 12.22,
      fontWeight: "900",
      fontStyle: "normal",
    },
    {
      text: "5PM",
      color: "rgb(255, 255, 255)",
      fontFamily: "BaddiesDisplay, Impact, sans-serif",
      runtimeFontFamily: "Anton",
      fontSizePx: 39.42,
      fontWeight: "900",
      fontStyle: "normal",
    },
  ],
};

test("compiled stacked text keeps authored label/value styles with replacement copy", () => {
  const runs = resolveCocoCompiledTextRuns(stackedObject, "Doors Open\n9:30PM");
  assert.deepEqual(runs, [
    {
      breakAfter: true,
      color: "rgb(0, 255, 60)",
      fontFamily: "LEMONMILK-Bold",
      fontSizePx: 12.22,
      fontStyle: "normal",
      fontWeight: "900",
      text: "Doors Open",
    },
    {
      breakAfter: false,
      color: "rgb(255, 255, 255)",
      fontFamily: "Anton",
      fontSizePx: 39.42,
      fontStyle: "normal",
      fontWeight: "900",
      text: "9:30PM",
    },
  ]);
});

test("compiled date lockups align missing metadata to the important final runs", () => {
  const runs = resolveCocoCompiledTextRuns(
    {
      text: "Saturday\n18\nJul",
      typography: { fontFamily: "Antonio", fontSizePx: 59.4, fontWeight: "300" },
      paint: { color: "rgb(255, 255, 255)" },
      textRuns: [
        { text: "Saturday", fontSizePx: 14, runtimeFontFamily: "LEMONMILK-Regular" },
        { text: "18", fontSizePx: 59.4, runtimeFontFamily: "Anton" },
        { text: "Jul", fontSizePx: 29.7, runtimeFontFamily: "Bebas Neue" },
      ],
    },
    "18\nSEP",
  );
  assert.equal(runs?.[0].fontFamily, "Anton");
  assert.equal(runs?.[0].text, "18");
  assert.equal(runs?.[1].fontFamily, "Bebas Neue");
  assert.equal(runs?.[1].text, "SEP");
});

test("changed two-part inline emphasis keeps the final word emphasized", () => {
  const runs = resolveCocoCompiledTextRuns(
    {
      text: "Classic Lounge",
      typography: { fontFamily: "Bebas Neue", fontSizePx: 24, fontWeight: "400" },
      paint: { color: "white" },
      textRuns: [
        { text: "Classic ", fontWeight: "400" },
        { text: "Lounge", fontWeight: "900" },
      ],
    },
    "Skyline Hall",
  );
  assert.equal(runs?.[0].text, "Skyline ");
  assert.equal(runs?.[0].fontWeight, "400");
  assert.equal(runs?.[1].text, "Hall");
  assert.equal(runs?.[1].fontWeight, "900");
});

test("compiled run sizes scale with the editable object size", () => {
  const runs = resolveCocoCompiledTextRuns(stackedObject, "Doors Open\n9PM", {
    liveFontSizePx: 78.84,
  });
  assert.equal(runs?.[0].fontSizePx, 24.44);
  assert.equal(runs?.[1].fontSizePx, 78.84);
});

test("extra body lines keep the authored label separate and reuse the body style", () => {
  const runs = resolveCocoCompiledTextRuns(
    stackedObject,
    "Doors Open\n9PM\nUntil Late",
  );

  assert.equal(runs?.length, 3);
  assert.equal(runs?.[0].text, "Doors Open");
  assert.equal(runs?.[0].fontSizePx, 12.22);
  assert.equal(runs?.[1].text, "9PM");
  assert.equal(runs?.[1].fontSizePx, 39.42);
  assert.equal(runs?.[2].text, "Until Late");
  assert.equal(runs?.[2].fontSizePx, 39.42);
  assert.equal(runs?.[2].breakAfter, false);
});

test('inline pair spacing stays local and scales with live type size', () => {
  const object = {text:'ONE',typography:{fontSizePx:100},textRuns:[
    {text:'O',fontSizePx:100},{text:'N',fontSizePx:100},{text:'E',fontSizePx:100,marginLeftEm:-.14},
  ]};
  const runs=resolveCocoCompiledTextRuns(object,'ONE',{liveFontSizePx:200});
  assert.ok(runs);
  assert.deepEqual(runs.map(run=>run.marginLeftEm),[undefined,undefined,-.14]);
  assert.equal(runs[2].fontSizePx,200);
  assert.equal(resolveCocoCompiledTextRuns(object,'OTHER'),null);
});
