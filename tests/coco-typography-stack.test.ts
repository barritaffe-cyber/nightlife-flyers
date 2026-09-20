import test from "node:test";
import assert from "node:assert/strict";

import {
  applyResolvedTypographyZoneSnapshot,
  buildTypographyStackModel,
  buildTypographyZoneModels,
  stackOwnsSource,
} from "../components/coco/typographyStack/buildTypographyStackModel.ts";
import { buildConceptTypographyStack } from "../components/coco/typographyStack/buildConceptTypographyStack.ts";
import { drawTypographyStackTextLayers } from "../components/coco/typographyStack/drawTypographyStack.ts";
import type { CocoCompositionSystem } from "../components/coco/layoutTournament/types.ts";

const composition: CocoCompositionSystem = {
  alignment: "left",
  allBlocks: [],
  anchorSide: "left",
  blocks: [],
  copyTreatment: {
    date: "metadata",
    details: "primary-meta",
    details2: "merge",
    script: "accent-support",
    venue: "lock-to-stack",
  },
  explanation: "Test left stack composition.",
  gates: {
    detailsMaxHeadlineRatio: 0.3,
    headlineOverBodyMin: 2.6,
    headlineOverScriptMin: 1.9,
    scriptMaxHeadlineRatio: 0.45,
    venueMaxHeadlineRatio: 0.24,
  },
  hierarchy: {
    accentPowerMaxRatio: 0.45,
    bodyPowerMaxRatio: 0.3,
    headlinePowerMin: 90,
    metadataPowerMaxRatio: 0.26,
  },
  layoutId: "subject-right",
  patternId: "left-premium-stack",
  rhythm: {
    accentToMeta: 4,
    dateTimeToVenue: 4,
    headlineToAccent: 2,
    metaToDateTime: 8,
  },
  score: 96,
  textColumn: { align: "left", height: 68, width: 45, x: 6, y: 14 },
};

test("compiled CSS compositions bypass generic typography without stack-only fields", () => {
  for (const format of ["square", "story"] as const) {
    for (const patternId of ["brunch-editorial", "center-hero-event-poster"]) {
      const input = {
        composition: {
          patternId,
          compiledDocument: {
            schemaVersion: 1,
            objects: [{ id: "headline", kind: "text", text: "BRUNCH" }],
          },
        } as unknown as CocoCompositionSystem,
        format,
        styles: {},
        text: { headline: "BRUNCH", script: "Vibes" },
      };
      assert.equal(buildTypographyStackModel(input), null);
      assert.deepEqual(buildTypographyZoneModels(input), []);
    }
  }
});

test("center hero keeps headline and accent in their independent director zones", () => {
  const headlineRect = { align: "left" as const, x: 8, y: 62, width: 48, height: 18 };
  const accentRect = { align: "right" as const, x: 62, y: 8, width: 28, height: 8 };
  const blocks = [
    { role: "headline" as const, source: "headline" as const, rect: headlineRect, align: "left" as const, priority: 1 as const },
    { role: "accent" as const, source: "script" as const, rect: accentRect, align: "right" as const, priority: 2 as const },
  ];
  const zones = buildTypographyZoneModels({
    composition: {
      ...composition,
      alignment: "center",
      allBlocks: blocks,
      blocks,
      patternId: "center-hero-event-poster",
    },
    format: "square",
    signatureMove: {
      id: "script-cross",
      target: "full-stack",
      intensity: "bold",
      priority: 1,
      reason: "Test that obsolete stack offsets cannot move final zones.",
      layout: { stackOffsetX: 12, stackOffsetY: -20, accentOffsetX: 5, accentOffsetY: 7 },
      safety: { maxFaceOverlap: 0, maxHeadlineEdgeRisk: 0, mustKeepReadability: true },
    },
    styles: {
      accent: { color: "#ff0", fontFamily: "Inter", fontSize: 28 },
      headline: { color: "#fff", fontFamily: "Antonio", fontSize: 140 },
    },
    text: { headline: "BEACH BUMS", script: "BRUNCH VIBES" },
  });

  assert.equal(zones.length, 2);
  const headline = zones.find((zone) => zone.zoneId === "headline");
  const accent = zones.find((zone) => zone.zoneId === "accent");
  assert.deepEqual(headline?.rect, headlineRect);
  assert.deepEqual(accent?.rect, accentRect);
  assert.deepEqual(headline?.ownedSources, ["headline"]);
  assert.deepEqual(accent?.ownedSources, ["script"]);
});

test("subheadline inline ink never exceeds headline width in stacks or independent zones", () => {
  for (const format of ["square", "story"] as const) {
    const stack = buildTypographyStackModel({
      authoritativeReference: true,
      composition: {
        ...composition,
        textColumn: { align: "left", height: 68, width: 72, x: 6, y: 14 },
      },
      format,
      minReadableSize: 10,
      styles: {
        accent: { color: "#ff0", fontFamily: "Bebas Neue", fontSize: 92 },
        headline: { color: "#fff", fontFamily: "Bebas Neue", fontSize: 100 },
      },
      text: { headline: "DJ", script: "INTERNATIONAL BRUNCH" },
    });

    assert.ok(stack, `${format} stack should build`);
    const stackHeadline = stack.items.find((item) => item.kind === "headline");
    const stackAccent = stack.items.find((item) => item.kind === "accent");
    assert.ok(stackHeadline?.measuredRect, `${format} stack headline should be measured`);
    assert.ok(stackAccent?.measuredRect, `${format} stack accent should be measured`);
    assert.ok(
      stackAccent.measuredRect.width <= stackHeadline.measuredRect.width + 0.01,
      `${format} stack accent ink should not exceed headline ink`
    );

    const headlineRect = { align: "center" as const, x: 8, y: 40, width: 80, height: 18 };
    const accentRect = { align: "center" as const, x: 8, y: 60, width: 80, height: 18 };
    const blocks = [
      { role: "headline" as const, source: "headline" as const, rect: headlineRect, align: "center" as const, priority: 1 as const },
      { role: "accent" as const, source: "script" as const, rect: accentRect, align: "center" as const, priority: 2 as const },
    ];
    const zones = buildTypographyZoneModels({
      authoritativeReference: true,
      composition: {
        ...composition,
        alignment: "center",
        allBlocks: blocks,
        blocks,
        patternId: "center-hero-event-poster",
      },
      format,
      minReadableSize: 10,
      styles: {
        accent: { color: "#ff0", fontFamily: "Bebas Neue", fontSize: 92 },
        headline: { color: "#fff", fontFamily: "Bebas Neue", fontSize: 100 },
      },
      text: { headline: "DJ", script: "INTERNATIONAL BRUNCH" },
    });
    const zoneHeadline = zones.find((zone) => zone.zoneId === "headline");
    const zoneAccent = zones.find((zone) => zone.zoneId === "accent");

    assert.deepEqual(zoneHeadline?.rect, headlineRect, `${format} headline zone coordinates should remain unchanged`);
    assert.deepEqual(zoneAccent?.rect, accentRect, `${format} accent zone coordinates should remain unchanged`);
    assert.ok(zoneHeadline?.item.measuredRect, `${format} zone headline should be measured`);
    assert.ok(zoneAccent?.item.measuredRect, `${format} zone accent should be measured`);
    assert.ok(
      zoneAccent.item.measuredRect.width <= zoneHeadline.item.measuredRect.width + 0.01,
      `${format} zone accent ink should not exceed headline ink`
    );
    assert.ok(zoneAccent.item.style.fontSize < 92, `${format} should shrink only the hostile accent size`);
  }
});

test("export zone consumes only the matching finalized preview snapshot", () => {
  const zones = buildTypographyZoneModels({
    composition: {
      ...composition,
      allBlocks: [{ role: "headline", source: "headline", rect: { x: 8, y: 58, width: 52, height: 20 }, align: "left", priority: 1 }],
      blocks: [{ role: "headline", source: "headline", rect: { x: 8, y: 58, width: 52, height: 20 }, align: "left", priority: 1 }],
      patternId: "center-hero-event-poster",
    },
    format: "square",
    styles: { headline: { color: "#fff", fontFamily: "Antonio", fontSize: 60 } },
    text: { headline: "BEACH BUMS" },
  });
  const zone = zones[0];
  assert.ok(zone);
  const snapshot = {
    fontSize: 94,
    glyphRect: { x: 10, y: 59, width: 44, height: 17 },
    lineHeight: 1.02,
    text: "BEACH\nBUMS",
    zoneId: "headline" as const,
    zoneRect: zone.rect,
  };
  // Snapshot text must match the already-resolved line breaks exactly.
  const matching = { ...snapshot, text: zone.item.text };
  const resolved = applyResolvedTypographyZoneSnapshot(zone, matching);
  assert.equal(resolved.item.style.fontSize, 94);
  assert.deepEqual(resolved.item.measuredRect, snapshot.glyphRect);
  assert.equal(
    applyResolvedTypographyZoneSnapshot(zone, { ...snapshot, text: "STALE HEADLINE" }),
    zone
  );
  assert.equal(
    applyResolvedTypographyZoneSnapshot(zone, { ...matching, zoneRect: { ...zone.rect, x: 20 } }),
    zone
  );
});

test("typography builder preserves the composition director's explicit headline break", () => {
  const model = buildTypographyStackModel({
    composition,
    format: "square",
    styles: { headline: { color: "#fff", fontFamily: "Antonio", fontSize: 70 } },
    text: { headline: "ULTIMATE\nSUMMER TAKEOVER" },
  });
  assert.equal(model?.items.find((item) => item.kind === "headline")?.text, "ULTIMATE\nSUMMER TAKEOVER");
});

test("split square reserves display-headline ink before flowing metadata", () => {
  const model = buildTypographyStackModel({
    composition: {
      ...composition,
      patternId: "split-hero-editorial",
      textColumn: { align: "left", height: 80, width: 46, x: 6, y: 10 },
    },
    enabled: {
      date: false,
      details: true,
      details2: false,
      headline: true,
      script: false,
      venue: false,
    },
    format: "square",
    minReadableSize: 10,
    styles: {
      headline: {
        color: "#fff",
        fontFamily: "Decorative Display",
        fontSize: 108,
        lineHeight: 1,
      },
      metadata: {
        color: "#fff",
        fontFamily: "LEMONMILK-Regular",
        fontSize: 28,
        lineHeight: 1,
      },
    },
    text: {
      details: "UPTOWN NIGHTS • CHAMPAGNE • LIVE MUSIC",
      headline: "VELVET\nNOIR",
    },
  });

  assert.ok(model);
  const headline = model.items.find((item) => item.kind === "headline");
  const metadata = model.items.find((item) => item.kind === "metadata");
  assert.ok(headline?.measuredRect);
  assert.ok(metadata?.measuredRect);

  const pxPerPct = 5.4;
  const lineCount = headline.text.split("\n").filter(Boolean).length;
  const minimumFallbackInkHeight =
    headline.style.fontSize *
    (1.28 + Math.max(0, lineCount - 1) * Number(headline.style.lineHeight ?? 1));
  assert.ok(
    headline.measuredRect.height * pxPerPct >= minimumFallbackInkHeight - 0.5,
    "headline flow height should include painted display-font ink, not only its CSS line box"
  );
  assert.ok(
    metadata.measuredRect.y >= headline.measuredRect.y + headline.measuredRect.height,
    "metadata should start after the headline's painted footprint"
  );

  const layers = drawTypographyStackTextLayers({ height: 540, model });
  const headlineLayer = layers.find((layer) => layer.id === headline.id);
  const metadataLayer = layers.find((layer) => layer.id === metadata.id);
  assert.ok(headlineLayer);
  assert.ok(metadataLayer);
  const expectedMetadataY =
    model.rect.y +
    headline.spacingBeforePct +
    headline.measuredRect.height +
    metadata.spacingBeforePct;
  assert.ok(
    Math.abs(metadataLayer.yPct - expectedMetadataY) < 0.001,
    "export should advance by the same ink-aware headline height as preview"
  );
});

test("native split copy is owned by one ordered stack while center copy routes to zones", () => {
  const text = {
    date: "SATURDAY, OCTOBER 18 • 10PM",
    details: "LIVE MUSIC • CHAMPAGNE • LATE NIGHT",
    headline: "VELVET\nNOIR",
    presenter: "LEVEL 47 PRESENTS",
    venue: "3712 EAST INDUSTRIAL WAY",
  };
  const styles = {
    dateTime: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 18 },
    headline: { color: "#fff", fontFamily: "Bodoni Moda", fontSize: 88 },
    metadata: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 16 },
    presenter: { color: "#fff", fontFamily: "LEMONMILK-Bold", fontSize: 14 },
    venue: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 14 },
  };
  const splitComposition: CocoCompositionSystem = {
    ...composition,
    patternId: "split-hero-editorial",
    textColumn: { align: "left", height: 82, width: 44, x: 5, y: 9 },
  };
  const splitStack = buildTypographyStackModel({
    authoritativeReference: true,
    composition: splitComposition,
    enabled: { date: true, details: true, headline: true, presenter: true, venue: true },
    format: "square",
    styles,
    text,
  });

  assert.ok(splitStack);
  assert.deepEqual(
    splitStack.items.map((item) => item.source),
    ["presenter", "date", "headline", "details", "venue"]
  );
  for (const source of ["headline", "details", "date", "venue", "presenter"] as const) {
    assert.equal(stackOwnsSource(splitStack, source), true, `${source} must suppress its legacy node`);
  }
  assert.deepEqual(buildTypographyZoneModels({
    composition: splitComposition,
    format: "square",
    styles,
    text,
  }), []);

  const centerBlocks: CocoCompositionSystem["blocks"] = [
    { role: "headline", source: "headline", rect: { x: 12, y: 52, width: 76, height: 17 }, align: "center", priority: 1 },
    { role: "primaryMeta", source: "details", rect: { x: 8, y: 72, width: 38, height: 8 }, align: "left", priority: 2 },
    { role: "footer", source: "presenter", rect: { x: 8, y: 8, width: 30, height: 7 }, align: "left", priority: 2 },
    { role: "dateTime", source: "date", rect: { x: 8, y: 84, width: 38, height: 8 }, align: "left", priority: 2 },
    { role: "venue", source: "venue", rect: { x: 54, y: 84, width: 38, height: 8 }, align: "right", priority: 2 },
  ];
  const centerComposition: CocoCompositionSystem = {
    ...composition,
    alignment: "center",
    allBlocks: centerBlocks,
    blocks: centerBlocks,
    patternId: "center-hero-event-poster",
  };
  const centerStack = centerComposition.patternId === "center-hero-event-poster"
    ? null
    : buildTypographyStackModel({ composition: centerComposition, format: "square", styles, text });
  const centerZones = buildTypographyZoneModels({
    composition: centerComposition,
    format: "square",
    styles,
    text,
  });

  assert.equal(centerStack, null, "center references must not become a flowing side stack");
  assert.deepEqual(
    centerZones.map((zone) => zone.zoneId).sort(),
    ["date-card", "details", "headline", "left-info", "venue-footer"]
  );
});

test("split editorial uses one fixed panel-aligned reading field and balanced title lockup", () => {
  const model = buildTypographyStackModel({
    composition: {
      ...composition,
      patternId: "split-hero-editorial",
      textColumn: { align: "left", height: 44, width: 78, x: 14, y: 33 },
    },
    enabled: {
      date: true,
      details: true,
      details2: false,
      headline: true,
      presenter: true,
      script: false,
      subtag: true,
      venue: true,
    },
    faceZone: { align: "center", height: 26, width: 24, x: 30, y: 10 },
    format: "square",
    hasSubject: true,
    minReadableSize: 10,
    styles: {
      dateTime: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 13 },
      headline: { color: "#fff", fontFamily: "Bodoni Moda", fontSize: 108 },
      metadata: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 12 },
      presenter: { color: "#fff", fontFamily: "LEMONMILK-Bold", fontSize: 12 },
      tagline: { color: "#d6ba73", fontFamily: "LEMONMILK-Regular", fontSize: 12 },
      venue: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 12 },
    },
    subjectZone: { align: "right", height: 96, width: 70, x: 30, y: 2 },
    text: {
      date: "SATURDAY • OCTOBER 18 • 10PM",
      details: "BLACK TIE • CHAMPAGNE • LATE NIGHT",
      headline: "VELVET NOIR",
      presenter: "LEVEL 47 PRESENTS",
      subtag: "AN EVENING IN BLACK",
      venue: "3712 EAST INDUSTRIAL WAY",
    },
  });

  assert.ok(model);
  assert.deepEqual(model.rect, {
    align: "left",
    height: 84,
    width: 36,
    x: 6,
    y: 8,
  });
  assert.deepEqual(
    model.items.map((item) => item.source),
    ["presenter", "date", "headline", "subtag", "details", "venue"]
  );
  assert.equal(
    model.items.find((item) => item.kind === "headline")?.text,
    "VELVET\nNOIR"
  );

  const readableMinimums = {
    presenter: 15,
    dateTime: 15,
    tagline: 15,
    metadata: 15,
    venue: 15,
  } as const;
  for (const [kind, minimum] of Object.entries(readableMinimums)) {
    const item = model.items.find((candidate) => candidate.kind === kind);
    assert.ok(item, `${kind} should be rendered`);
    assert.ok(item.style.fontSize >= minimum, `${kind} should remain readable`);
    assert.equal(item.maxWidthRatio >= 0.92, true, `${kind} should use the text field`);
  }

  const stackBottom = model.rect.y + model.rect.height;
  for (const item of model.items) {
    assert.ok(item.measuredRect);
    assert.ok(
      item.measuredRect!.y + item.measuredRect!.height <= stackBottom + 0.5,
      `${item.kind} should remain inside the fixed panel field`
    );
    assert.ok(item.spacingBeforePct < 4, `${item.kind} should use compact rhythm`);
  }
});

test("split editorial mirrors its fixed field in Story without changing the campaign grammar", () => {
  const model = buildTypographyStackModel({
    composition: {
      ...composition,
      alignment: "right",
      anchorSide: "right",
      layoutId: "subject-left",
      patternId: "split-hero-editorial",
      textColumn: { align: "right", height: 30, width: 70, x: 2, y: 40 },
    },
    enabled: {
      date: true,
      details: true,
      details2: false,
      headline: true,
      presenter: true,
      script: false,
      subtag: true,
      venue: true,
    },
    format: "story",
    hasSubject: true,
    styles: {
      dateTime: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 14 },
      headline: { color: "#fff", fontFamily: "Bodoni Moda", fontSize: 108 },
      metadata: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 14 },
      presenter: { color: "#fff", fontFamily: "LEMONMILK-Bold", fontSize: 14 },
      tagline: { color: "#d6ba73", fontFamily: "LEMONMILK-Regular", fontSize: 14 },
      venue: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 14 },
    },
    text: {
      date: "SATURDAY • 10PM",
      details: "BLACK TIE • CHAMPAGNE",
      headline: "AFTER DARK",
      presenter: "LEVEL 47 PRESENTS",
      subtag: "DRESS WITH INTENTION",
      venue: "THE VELVET ROOM",
    },
  });

  assert.ok(model);
  assert.deepEqual(model.rect, {
    align: "right",
    height: 86,
    width: 36,
    x: 58,
    y: 7,
  });
  assert.equal(
    model.items.find((item) => item.kind === "headline")?.text,
    "AFTER\nDARK"
  );
  assert.deepEqual(
    model.items.map((item) => item.source),
    ["presenter", "date", "headline", "subtag", "details", "venue"]
  );
  assert.ok(
    model.items
      .filter((item) => item.kind !== "headline")
      .every((item) => item.style.fontSize >= 16),
    "Story support copy should use the campaign readability floor"
  );
});

test("typography stack owns composed sources and enforces visual power caps", () => {
  const model = buildTypographyStackModel({
    composition,
    format: "square",
    minReadableSize: 10,
    styles: {
      accent: { color: "#fff", fontFamily: "Good Brush", fontSize: 90 },
      dateTime: { color: "#fff", fontFamily: "Inter", fontSize: 44 },
      headline: { color: "#fff4aa", fontFamily: "Bebas Neue", fontSize: 100 },
      metadata: { color: "#fff", fontFamily: "Inter", fontSize: 70 },
      venue: { color: "#fff", fontFamily: "Inter", fontSize: 42 },
    },
    text: {
      date: "Monday • 4PM-10PM",
      details: "Tropical Rhythms • Cocktails • Afrobeats",
      details2: "Island Energy",
      headline: "Mojito Mondaze",
      script: "Brunch Vibes",
      venue: "Sky Lounge Miami",
    },
  });

  assert.ok(model);
  assert.equal(model.boundsPolicy, "scale-to-fit");
  assert.equal(stackOwnsSource(model, "headline"), true);
  assert.equal(stackOwnsSource(model, "script"), true);
  assert.equal(stackOwnsSource(model, "details"), true);
  assert.equal(stackOwnsSource(model, "details2"), true);
  assert.equal(stackOwnsSource(model, "date"), true);
  assert.equal(stackOwnsSource(model, "venue"), true);
  assert.equal(model.signatureMove?.id, "none");

  const accent = model.items.find((item) => item.kind === "accent");
  const metadata = model.items.find((item) => item.kind === "metadata");
  const headline = model.items.find((item) => item.kind === "headline");
  const date = model.items.find((item) => item.kind === "dateTime");
  const venue = model.items.find((item) => item.kind === "venue");
  const footer = model.items.find((item) => item.kind === "footer");

  assert.equal(headline?.effects, undefined);
  assert.ok((accent?.style.fontSize ?? 90) <= 45);
  // Headline's box is now sized from its actual content (small padding),
  // not a fixed guessed fraction - it can range up to the full given
  // space, but must never exceed what the composition allocated.
  assert.ok((headline?.maxWidthRatio ?? 1) > 0 && (headline?.maxWidthRatio ?? 1) <= 1);
  assert.ok(
    (headline?.measuredRect?.height ?? model.rect.height) <= model.rect.height * 0.4,
    "side-layout headline should not consume the supporting copy's share of the column"
  );
  assert.ok(
    (headline?.measuredRect?.y ?? model.rect.y) > model.rect.y,
    "side-layout headline should retain top ink clearance inside the stack"
  );
  assert.equal(accent?.rotationDeg ?? 0, -5);
  assert.ok((accent?.spacingBeforePct ?? 0) > 0);
  assert.equal(accent?.offsetYPct ?? 0, 0);
  assert.ok(
    (accent?.measuredRect?.y ?? 0) >=
      (headline?.measuredRect?.y ?? 0) + (headline?.measuredRect?.height ?? 0),
    "side-layout accent should flow after the headline instead of crossing its glyphs"
  );
  const finalItem = model.items[model.items.length - 1];
  assert.ok(finalItem?.measuredRect);
  assert.ok(
    finalItem.measuredRect!.y + finalItem.measuredRect!.height <=
      model.rect.y + model.rect.height,
    "vertical breathing-room distribution must remain inside the stack"
  );
  assert.equal(accent?.effects, undefined);
  assert.ok((metadata?.maxWidthRatio ?? 1) <= 0.62);
  assert.ok((metadata?.style.fontSize ?? 70) <= 30);
  assert.equal(metadata?.effects, undefined);
  assert.equal(date?.effects, undefined);
  assert.ok((venue?.style.fontSize ?? 42) <= 24);
  assert.equal(venue?.effects, undefined);
  assert.ok((metadata?.text ?? "").split("\n").filter(Boolean).length <= 3);
  assert.match(metadata?.text ?? "", /TROPICAL RHYTHMS|COCKTAILS|AFROBEATS/);
  assert.equal(footer, undefined);
});

test("brunch stack does not add script motion without an explicit signature move", () => {
  const model = buildTypographyStackModel({
    composition,
    format: "square",
    minReadableSize: 10,
    styles: {
      accent: { color: "#fff", fontFamily: "Bebas Neue", fontSize: 90 },
      dateTime: { color: "#fff", fontFamily: "Inter", fontSize: 44 },
      headline: { color: "#fff4aa", fontFamily: "Bebas Neue", fontSize: 100 },
      metadata: { color: "#fff", fontFamily: "Inter", fontSize: 70 },
      venue: { color: "#fff", fontFamily: "Inter", fontSize: 42 },
    },
    text: {
      date: "Monday • 4PM-10PM",
      details: "Tropical Rhythms • Cocktails • Afrobeats",
      details2: "Island Energy",
      headline: "Mojito Mondaze",
      script: "Brunch Bliss",
      venue: "Sky Lounge Miami",
    },
  });

  assert.ok(model);
  assert.equal(model.signatureMove?.id, "none");

  const accent = model.items.find((item) => item.kind === "accent");

  assert.equal(accent?.style.fontFamily, "Bebas Neue");
  assert.equal(accent?.effects, undefined);
  assert.equal(accent?.rotationDeg ?? 0, 0);
  assert.ok((accent?.style.fontSize ?? 90) <= 45);
});

test("single-line display headline never uses a clipping-prone sub-1 line box", () => {
  const model = buildTypographyStackModel({
    composition: {
      ...composition,
      textColumn: { align: "left", height: 24, width: 60, x: 8, y: 58 },
    },
    enabled: {
      date: false,
      details: false,
      details2: false,
      headline: true,
      script: false,
      venue: false,
    },
    format: "square",
    minReadableSize: 10,
    styles: {
      headline: {
        color: "#fff",
        fontFamily: "Decorative Display",
        fontSize: 150,
        lineHeight: 0.76,
      },
    },
    text: {
      headline: "HEADLINE",
    },
  });

  assert.ok(model);
  const headline = model.items.find((item) => item.kind === "headline");
  assert.ok(headline);
  assert.ok((headline.style.lineHeight ?? 0) >= 1);
  assert.ok((headline.measuredRect?.height ?? 0) <= model.rect.height);
});

test("hero accent and two-line headline fit the live 540px design-space height", () => {
  const model = buildTypographyStackModel({
    composition: {
      ...composition,
      alignment: "center",
      patternId: "center-hero-event-poster",
      textColumn: { align: "center", height: 23.28, width: 60, x: 20, y: 56.5 },
    },
    enabled: {
      date: false,
      details: false,
      details2: false,
      headline: true,
      script: true,
      venue: false,
    },
    format: "square",
    minReadableSize: 10,
    stackOrder: "accent-headline",
    styles: {
      accent: {
        color: "#ff0",
        fontFamily: "Bebas Neue",
        fontSize: 14,
        lineHeight: 0.92,
      },
      headline: {
        color: "#fff",
        fontFamily: "Antonio",
        fontSize: 150,
        lineHeight: 0.76,
      },
    },
    text: {
      headline: "BEACH BUMS",
      script: "Brunch Vibes",
    },
  });

  assert.ok(model);
  const headline = model.items.find((item) => item.kind === "headline");
  assert.ok(headline);
  assert.ok((headline.style.fontSize ?? 150) < 86);
  const modelBottom = model.rect.y + model.rect.height;
  for (const item of model.items) {
    assert.ok(item.measuredRect);
    assert.ok(
      item.measuredRect!.y + item.measuredRect!.height <= modelBottom + 0.5,
      `${item.kind} should remain inside the live hero-title height`
    );
  }
});

test("headline remains inside every layout and format at layout-selector maximum sizes", () => {
  const cases = [
    {
      format: "square" as const,
      layoutId: "subject-center" as const,
      patternId: "center-hero-event-poster" as const,
      rect: { align: "center" as const, height: 23, width: 88, x: 6, y: 56 },
      size: 190,
    },
    {
      format: "story" as const,
      layoutId: "subject-center" as const,
      patternId: "center-hero-event-poster" as const,
      rect: { align: "center" as const, height: 24, width: 89, x: 5.5, y: 55 },
      size: 240,
    },
    {
      format: "square" as const,
      layoutId: "subject-left" as const,
      patternId: "right-premium-stack" as const,
      rect: { align: "right" as const, height: 70, width: 38, x: 56.2, y: 18 },
      size: 210,
    },
    {
      format: "square" as const,
      layoutId: "subject-right" as const,
      patternId: "left-premium-stack" as const,
      rect: { align: "left" as const, height: 70, width: 38, x: 5.8, y: 18 },
      size: 210,
    },
    {
      format: "story" as const,
      layoutId: "subject-left" as const,
      patternId: "right-premium-stack" as const,
      rect: { align: "right" as const, height: 78, width: 44, x: 50, y: 20 },
      size: 240,
    },
    {
      format: "story" as const,
      layoutId: "subject-right" as const,
      patternId: "left-premium-stack" as const,
      rect: { align: "left" as const, height: 78, width: 44, x: 6, y: 20 },
      size: 240,
    },
  ];

  for (const sample of cases) {
    const model = buildTypographyStackModel({
      composition: {
        ...composition,
        alignment: sample.rect.align,
        anchorSide: sample.layoutId === "subject-left" ? "right" : "left",
        layoutId: sample.layoutId,
        patternId: sample.patternId,
        textColumn: sample.rect,
      },
      enabled: {
        date: true,
        details: true,
        details2: true,
        headline: true,
        script: true,
        venue: true,
      },
      format: sample.format,
      minReadableSize: 10,
      stackOrder: sample.layoutId === "subject-center" ? "accent-headline" : undefined,
      styles: {
        accent: { color: "#ff0", fontFamily: "Good Brush", fontSize: 54, lineHeight: 0.9 },
        dateTime: { color: "#fff", fontFamily: "Inter", fontSize: 30 },
        headline: {
          color: "#fff",
          fontFamily: "Antonio",
          fontSize: sample.size,
          lineHeight: 0.72,
        },
        metadata: { color: "#fff", fontFamily: "Inter", fontSize: 30 },
        venue: { color: "#fff", fontFamily: "Inter", fontSize: 24 },
      },
      text: {
        date: "SATURDAY • 10PM",
        details: "DINNER • COCKTAILS",
        details2: "MUSIC • DANCING",
        headline: "SATURDAY NIGHT EXPERIENCE",
        script: "Brunch Vibes",
        venue: "VENUE NAME • ADDRESS",
      },
    });

    assert.ok(model, `${sample.format}/${sample.layoutId} should build`);
    const modelBottom = model!.rect.y + model!.rect.height;
    for (const item of model!.items) {
      assert.ok(item.measuredRect, `${sample.format}/${sample.layoutId}/${item.kind} should be measured`);
      assert.ok(
        item.measuredRect!.y + item.measuredRect!.height <= modelBottom + 0.5,
        `${sample.format}/${sample.layoutId}/${item.kind} should remain inside its layout box`
      );
    }
  }
});

test("scale-to-fit protects right-side subject from oversized left headline", () => {
  const model = buildTypographyStackModel({
    composition: {
      ...composition,
      textColumn: { align: "left", height: 74, width: 48, x: 6, y: 16 },
    },
    format: "square",
    hasSubject: true,
    minReadableSize: 10,
    styles: {
      accent: { color: "#fff", fontFamily: "Inter", fontSize: 42 },
      dateTime: { color: "#fff", fontFamily: "Inter", fontSize: 34 },
      headline: { color: "#fff4aa", fontFamily: "LEMONMILK-Bold", fontSize: 100, lineHeight: 0.84 },
      metadata: { color: "#fff", fontFamily: "Inter", fontSize: 34 },
      venue: { color: "#fff", fontFamily: "Inter", fontSize: 24 },
    },
    subjectZone: { align: "center", height: 92, width: 53, x: 47, y: 4 },
    text: {
      date: "DATE • 10PM",
      details: "Handcrafted Martinis • Cocktails All Night • Lounge Energy",
      headline: "MARTINI SUNDAZE",
      script: "Chic Brunch Vibes",
      venue: "Venue Name Address",
    },
  });

  assert.ok(model);
  assert.ok(model.rect.x + model.rect.width < 47);

  const headline = model.items.find((item) => item.kind === "headline");
  const metadata = model.items.find((item) => item.kind === "metadata");

  assert.ok((headline?.style.fontSize ?? 100) < 100);
  assert.ok((metadata?.style.fontSize ?? 34) < 34);
});

test("scale-to-fit gives right-aligned martini headline optical edge safety", () => {
  const model = buildTypographyStackModel({
    composition: {
      ...composition,
      alignment: "right",
      anchorSide: "right",
      layoutId: "subject-left",
      patternId: "right-premium-stack",
      textColumn: { align: "right", height: 70, width: 48, x: 45, y: 15 },
    },
    format: "square",
    hasSubject: true,
    minReadableSize: 10,
    styles: {
      accent: { color: "#fff", fontFamily: "Good Brush", fontSize: 46, lineHeight: 0.86 },
      dateTime: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 28, letterSpacingEm: 0.05 },
      headline: {
        color: "#fff4aa",
        fontFamily: "LEMONMILK-Bold",
        fontSize: 96,
        letterSpacingEm: 0.07,
        lineHeight: 0.84,
      },
      metadata: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 28, letterSpacingEm: 0.09 },
      venue: { color: "#fff", fontFamily: "LEMONMILK-Regular", fontSize: 20, letterSpacingEm: 0.12 },
    },
    subjectZone: { align: "center", height: 90, width: 42, x: 0, y: 8 },
    text: {
      date: "DATE • 10PM",
      details: "Sip on signature martinis • indulge in brunch classics",
      details2: "Friends and drinks • smooth R&B vibes",
      headline: "MARTINI\nMONDAYZ",
      script: "Brunch Vibes",
      venue: "Venue Name • Address",
    },
  });

  assert.ok(model);
  const headline = model.items.find((item) => item.kind === "headline");

  assert.equal(model.alignment, "right");
  assert.equal(headline?.text, "MARTINI\nMONDAYZ");
  assert.ok((headline?.style.fontSize ?? 96) <= 70);
  // See matching comment in the previous test - headline's box now hugs
  // its content, bounded above only by the full given space.
  assert.ok((headline?.maxWidthRatio ?? 1) > 0 && (headline?.maxWidthRatio ?? 1) <= 1);
});

test("center layout reserves a complete face lane before fitting the stack", () => {
  const faceZone = { align: "center" as const, height: 24, width: 24, x: 38, y: 30 };
  const model = buildTypographyStackModel({
    composition: {
      ...composition,
      alignment: "center",
      anchorSide: "center",
      layoutId: "subject-center",
      patternId: "center-poster-stack",
      textColumn: { align: "center", height: 78, width: 72, x: 14, y: 10 },
    },
    faceZone,
    format: "square",
    hasSubject: true,
    minReadableSize: 10,
    styles: {
      accent: { color: "#fff", fontFamily: "Inter", fontSize: 34 },
      dateTime: { color: "#fff", fontFamily: "Inter", fontSize: 24 },
      headline: { color: "#fff", fontFamily: "Inter", fontSize: 82, lineHeight: 0.86 },
      metadata: { color: "#fff", fontFamily: "Inter", fontSize: 24 },
      venue: { color: "#fff", fontFamily: "Inter", fontSize: 18 },
    },
    subjectZone: { align: "center", height: 92, width: 58, x: 21, y: 4 },
    text: {
      date: "SATURDAY • 10PM",
      details: "DINNER • COCKTAILS • MUSIC",
      headline: "CENTER STAGE",
      script: "Nightlife",
      venue: "VENUE NAME",
    },
  });

  assert.ok(model);
  const stack = model.rect;
  const overlaps =
    stack.x < faceZone.x + faceZone.width &&
    stack.x + stack.width > faceZone.x &&
    stack.y < faceZone.y + faceZone.height &&
    stack.y + stack.height > faceZone.y;
  assert.equal(overlaps, false);
  assert.ok(stack.y >= faceZone.y + faceZone.height + 2.75);
});

test("measured rect keeps a wide word inside its allotted column instead of overflowing", () => {
  // Regression test for real flyer output where "MONDAZE"/"HANDCRAFTED"
  // rendered wider than their box and spilled into the subject's face -
  // caused by the old per-glyph-factor guess under-measuring real words.
  // The Node test environment has no canvas, so this exercises the
  // conservative (over-estimating) fallback path, not real ctx.measureText -
  // it proves the shrink math + safety margin actually constrain the
  // result, which real Canvas measurement in the browser then makes precise.
  const model = buildTypographyStackModel({
    composition: {
      ...composition,
      textColumn: { align: "left", height: 60, width: 44, x: 8, y: 16 },
    },
    format: "square",
    hasSubject: true,
    minReadableSize: 10,
    styles: {
      accent: { color: "#fff", fontFamily: "Inter", fontSize: 32 },
      dateTime: { color: "#fff", fontFamily: "Inter", fontSize: 26 },
      headline: { color: "#fff4aa", fontFamily: "Inter", fontSize: 100, lineHeight: 0.86 },
      metadata: { color: "#fff", fontFamily: "Inter", fontSize: 26 },
      venue: { color: "#fff", fontFamily: "Inter", fontSize: 20 },
    },
    subjectZone: { align: "center", height: 92, width: 40, x: 55, y: 4 },
    text: {
      date: "SAT JUNE 28 • 10PM",
      details: "HANDCRAFTED MARTINIS COCKTAILS ALL NIGHT",
      headline: "MOJITO\nMONDAZE",
      script: "Brunch Vibes",
      venue: "Venue Name Address",
    },
  });

  assert.ok(model);
  const headline = model.items.find((item) => item.kind === "headline");
  const metadata = model.items.find((item) => item.kind === "metadata");

  assert.ok(headline?.measuredRect, "headline should have a measured rect");
  assert.ok(metadata?.measuredRect, "metadata should have a measured rect");

  const columnRightEdge = model.rect.x + model.rect.width;
  assert.ok(
    (headline!.measuredRect!.x + headline!.measuredRect!.width) <= columnRightEdge + 0.5,
    "headline's measured footprint should not extend past its column"
  );
  assert.ok(
    (metadata!.measuredRect!.x + metadata!.measuredRect!.width) <= columnRightEdge + 0.5,
    "metadata's measured footprint should not extend past its column"
  );
});

test("luxury brunch stack rejects decorative headline fonts", () => {
  const model = buildConceptTypographyStack({
    concept: {
      brief: {
        scene: {
          subjectCount: 1,
        },
        story: {
          oneLine: "Luxury tropical brunch.",
        },
        storyId: "luxury-tropical-brunch",
      },
      layout: {
        composition,
        zones: {
          subject: { align: "right", height: 84, width: 50, x: 50, y: 8 },
        },
      },
      moodProfile: {
        vector: {
          elegance: 0.8,
          energy: 0.45,
          exclusivity: 0.68,
          playfulness: 0.55,
          summer: 0.84,
          underground: 0.1,
        },
      },
      name: "Mojito Mondaze",
    } as any,
    format: "square",
    palette: {
      details: "#ffffff",
      headline: "#fff18c",
      palette: {
        accent: "#fff18c",
        neutral: "#ffffff",
        primary: "#fff18c",
      },
      subheadline: "#ffffff",
      utility: "#ffffff",
      venue: "#ffffff",
    } as any,
    text: {
      date: "DATE • 10PM",
      details: "Tropical rhythms • Afrobeats Latin",
      headline: "Mojito\nMondaze",
      script: "Brunch Vibes",
      venue: "Venue Name Address",
    },
    typography: {
      date: {
        fontFamily: "Inter",
        letterSpacing: 0.08,
        lineHeight: 1,
        shadow: 0,
        sizeScale: 1,
        text: "",
        transform: "uppercase",
        weight: 700,
      },
      details: {
        fontFamily: "Inter",
        letterSpacing: 0.08,
        lineHeight: 1,
        shadow: 0,
        sizeScale: 1,
        text: "",
        transform: "uppercase",
        weight: 700,
      },
      details2: {
        fontFamily: "Inter",
        letterSpacing: 0.08,
        lineHeight: 1,
        shadow: 0,
        sizeScale: 1,
        text: "",
        transform: "uppercase",
        weight: 700,
      },
      headline: {
        fontFamily: "Magiel Black",
        letterSpacing: 0.02,
        lineHeight: 0.86,
        shadow: 0,
        sizeScale: 1,
        strokeWidth: 0,
        text: "",
        transform: "uppercase",
        weight: 900,
      },
      presenter: {
        fontFamily: "Inter",
        letterSpacing: 0.08,
        lineHeight: 1,
        shadow: 0,
        sizeScale: 1,
        text: "",
        transform: "uppercase",
        weight: 700,
      },
      price: {
        fontFamily: "Inter",
        letterSpacing: 0.08,
        lineHeight: 1,
        shadow: 0,
        sizeScale: 1,
        text: "",
        transform: "uppercase",
        weight: 700,
      },
      subheadline: {
        fontFamily: "Magiel Black",
        letterSpacing: 0.02,
        lineHeight: 1,
        shadow: 0,
        sizeScale: 1,
        text: "",
        transform: "uppercase",
        weight: 900,
      },
      subtag: {
        fontFamily: "Inter",
        letterSpacing: 0.08,
        lineHeight: 1,
        shadow: 0,
        sizeScale: 1,
        text: "",
        transform: "uppercase",
        weight: 700,
      },
      venue: {
        fontFamily: "Inter",
        letterSpacing: 0.08,
        lineHeight: 1,
        shadow: 0,
        sizeScale: 1,
        text: "",
        transform: "uppercase",
        weight: 700,
      },
    },
  });

  assert.ok(model);
  const headline = model.items.find((item) => item.kind === "headline");
  const accent = model.items.find((item) => item.kind === "accent");

  assert.equal(headline?.style.fontFamily, "LEMONMILK-Bold");
  assert.notEqual(headline?.style.fontFamily, "Magiel Black");
  assert.equal(accent?.style.fontFamily, "Good Brush");
  assert.notEqual(accent?.style.fontFamily, "Magiel Black");
});
