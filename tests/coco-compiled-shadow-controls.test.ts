import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync("app/page.tsx", "utf8");
const glyphRendererSource = readFileSync("components/text/GlyphShadowText.tsx", "utf8");
const typographyStackSource = readFileSync(
  "components/coco/typographyStack/TypographyStack.tsx",
  "utf8",
);

test("gradient headline paint respects solid color and shadows on the visible SVG", () => {
  const svg = appSource.slice(appSource.indexOf('data-coco-compiled-gold-text-mask="true"'), appSource.indexOf('{!hideUiForExport && (', appSource.indexOf('data-coco-compiled-gold-text-mask="true"')));
  assert.match(svg, /gradientUnits="userSpaceOnUse"/);
  assert.match(svg, /data-headline-shadow-glyph=\{compiledSemanticRole === "headline" \? paintIndex : undefined\}/);
  assert.match(svg, /style=\{\{ filter: liveHeadlineGlyphFilter \}\}/);
  assert.doesNotMatch(svg, /filter: \[compiledAssetFilter, liveHeadlineGlyphFilter\]/);
  assert.match(svg, /fill=\{compiledSemanticRole === "headline" && textFx.gradient === false\s*\? color/);
  assert.match(svg, /mask=\{`url\(#\$\{compiledGradientIdBase\}-mask-\$\{paintIndex\}\)`\}/);
});

test("edited compiled gradient endpoints override authored CSS while untouched imports retain it", () => {
  const resolver = appSource.slice(appSource.indexOf('const compiledSvgGradientStops ='), appSource.indexOf('const compiledGradientIdBase ='));
  assert.match(resolver, /compiledSemanticRole === "headline" && textFx.compiledGradientEdited/);
  assert.match(resolver, /textFx.gradFrom/);
  assert.match(resolver, /textFx.gradTo/);
  assert.match(resolver, /: compiledTextGradientImage/);
  const manualFill = appSource.slice(appSource.indexOf('const applyManualCocoTextColor ='), appSource.indexOf('const applyManualCocoTextColor =') + 1300);
  assert.match(manualFill, /hasCocoCompiledCanvas[\s\S]*\? \{ gradient: false \}/);
  assert.match(manualFill, /textFx: \{ \.\.\.compiledSolidFill, color: nextColor/);
  for (const field of ['gradFrom', 'gradTo']) {
    assert.match(appSource, new RegExp(`const next = \\{ \\.\\.\\.textFx, ${field}: c, strokeWidth: 0, compiledGradientEdited: true \\}`));
    assert.match(appSource, new RegExp(`const next = \\{ \\.\\.\\.textFx, gradient: true, ${field}: c, compiledGradientEdited: true \\}`));
  }
});

test("compiled recipe text preserves authored depth and adds live shadow controls", () => {
  const compiledTextRenderer = appSource.slice(
    appSource.indexOf("const compiledSemanticRole ="),
    appSource.indexOf("const visualStyle: React.CSSProperties")
  );

  assert.match(
    compiledTextRenderer,
    /compiledSemanticRole === "headline" && headShadow[\s\S]*buildPremiumDropShadowFilter/
  );
  assert.match(compiledTextRenderer, /case "headline2"[\s\S]*head2Shadow/);
  assert.match(compiledTextRenderer, /case "details"[\s\S]*detailsShadow/);
  assert.match(compiledTextRenderer, /case "djLineup"[\s\S]*details2Shadow/);
  assert.match(compiledTextRenderer, /case "venue"[\s\S]*venueShadow/);
  assert.match(compiledTextRenderer, /case "subtag"[\s\S]*subtagShadow/);
  assert.match(
    compiledTextRenderer,
    /const liveCompiledTextShadow = \[authoredTextShadow, liveEditorTextShadow\]/
  );
  assert.match(compiledTextRenderer, /compiledSemanticRole !== "headline"/);
  assert.match(compiledTextRenderer, /renderGlyphShadowText\(value/);
  assert.match(compiledTextRenderer, /filter: liveHeadlineGlyphFilter/);
  assert.match(compiledTextRenderer, /textShadow: liveCompiledTextShadow/);
});

test("headline shadows use the shared per-glyph renderer globally", () => {
  assert.match(glyphRendererSource, /data-headline-shadow-glyph=\{glyphIndex\}/);
  assert.match(glyphRendererSource, /display: "inline-block"/);
  assert.match(appSource, /data-headline-glyph-shadow-layer="true"/);
  assert.match(appSource, /glyphTextShadow: headlineGlyphShadow/);
  assert.match(typographyStackSource, /item\.kind === "headline" \? "none" : textShadow/);
  assert.match(typographyStackSource, /renderGlyphShadowText\(item\.text/);
});

test("compact text controls can enable and tune recipe shadows", () => {
  const activeControls = appSource.slice(
    appSource.indexOf("type ActiveTextControls ="),
    appSource.indexOf("const ASSET_LAYER_STEP")
  );
  const mobileControlsStart = appSource.indexOf("(activeTextControls.onShadowStrength");
  const mobileControls = appSource.slice(
    mobileControlsStart,
    appSource.indexOf("showMobileHeadlineStyleControls", mobileControlsStart)
  );

  assert.match(activeControls, /shadowEnabled\?: boolean/);
  assert.match(activeControls, /onToggleShadow\?: \(\) => void/);
  assert.match(activeControls, /onToggleShadow: \(\) => setHeadShadow\(!headShadow\)/);
  assert.match(mobileControls, /active=\{!!activeTextControls\.shadowEnabled\}/);
  assert.match(mobileControls, />\s*Shadow\s*<\/Chip>/);
});
