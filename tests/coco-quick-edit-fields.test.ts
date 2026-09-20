import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const quickEditUrl = new URL("../components/coco/CocoQuickEdit.tsx", import.meta.url);
const pageUrl = new URL("../app/page.tsx", import.meta.url);

test("Coco Quick Edit exposes distinct offer and RSVP contact fields", async () => {
  const source = await readFile(quickEditUrl, "utf8");

  assert.match(source, /export type CocoQuickEditFieldName =[\s\S]*?\| "offer"[\s\S]*?\| "rsvp"/);
  assert.match(source, /offer\?: string;/);
  assert.match(source, /rsvp\?: string;/);
  assert.match(source, /rsvpLabel\?: string;/);
  assert.match(source, /name: "offer",\s*label: "Offer \/ special"/);
  assert.match(source, /name: "rsvp",\s*label: "RSVP \/ contact"/);
  assert.match(source, /offer: "coco-quick-offer"/);
  assert.match(source, /rsvp: "coco-quick-rsvp"/);
  assert.match(source, /rsvpLabel: "coco-quick-rsvp-label"/);
  assert.match(source, /name: "details",\s*label: "Event details"/);
  assert.match(source, /name: "responsible",\s*label: "Responsible drinking"/);
  assert.match(source, /responsible: "coco-quick-responsible"/);
});

test("Baddies Quick Edit follows the authored semantic objects", async () => {
  const source = await readFile(pageUrl, "utf8");

  assert.match(source, /activeCocoQuickBaddies[\s\S]*?cocoVisualRecipeId === "baddies-n-bundles"/);
  assert.match(source, /baddiesRecipeActive[\s\S]*?eventBrief\.hosts = detailsBody/);
  assert.match(source, /field === "responsible"[\s\S]*?eventBrief\.responsibleDrinking = clean/);
  assert.match(source, /field === "rsvpLabel"[\s\S]*?eventBrief\.reservationLabel = clean/);
  assert.match(source, /activeCocoQuickBaddies[\s\S]*?activeCocoQuickBrief\.hosts/);
  assert.match(source, /details: "Hyped by",\s*lineup: "Music by",\s*time: "Doors open"/);
  const quickEditSource = await readFile(quickEditUrl, "utf8");
  assert.match(quickEditSource, /testId="coco-quick-date-size"/);
  assert.match(quickEditSource, /testId="coco-quick-time-size"/);
  assert.match(quickEditSource, /testId="coco-quick-time-leading"/);
  assert.match(source, /onReplaceLogo=\{activeCocoQuickBaddies/);
  assert.match(source, /timeLineHeight=\{activeCocoQuickBaddies \? activeCocoTimeLineHeight : undefined\}/);
  assert.match(source, /onTimeLineHeightChange=\{activeCocoQuickBaddies \? setActiveCocoTimeLineHeight : undefined\}/);
  assert.match(source, /Stepper label="Time Leading" value=\{activeCocoTimeLineHeight\}/);
  assert.match(source, /timeLineHeight=\{activeCocoTimeLineHeight\}/);
  assert.match(source, /timeSize: cocoRushDateStyles\.timeSize,\s*timeLineHeight,/);
});

test("Coco Quick Edit keeps export and the existing master grade visible above the long form", async () => {
  const source = await readFile(quickEditUrl, "utf8");

  const actionsIndex = source.indexOf('data-testid="coco-quick-project-actions"');
  const scrollingFormIndex = source.indexOf('className="min-h-0 flex-1 space-y-3 overflow-y-auto');

  assert.ok(actionsIndex >= 0, "expected visible project actions");
  assert.ok(scrollingFormIndex >= 0, "expected the scrolling Quick Edit form");
  assert.ok(actionsIndex < scrollingFormIndex, "project actions must appear before the scrolling form");
  assert.doesNotMatch(source, /<span className="min-w-0 truncate">\{children\}<\/span>/);
  assert.match(source, /<span className="min-w-0 whitespace-normal">\{children\}<\/span>/);
  assert.match(source, /testId="coco-quick-master-grade"[\s\S]*?Master grade/);
  assert.match(source, /onClick=\{onOpenMasterGrade\}/);
  assert.match(source, /testId="coco-quick-export-both"[\s\S]*?Export Square \+ Story/);
});

test("Coco Quick Edit opens the original Master Color Grade panel", async () => {
  const source = await readFile(pageUrl, "utf8");

  assert.match(
    source,
    /onOpenMasterGrade=\{\(\) => \{\s*setCocoEditorSurface\("fine"\);\s*openSaveExportCta\(\);\s*\}\}/
  );
  assert.match(source, /id="mastergrade-panel"[\s\S]*?title="Master Color Grade"/);
  const mainMasterGradeIndex = source.indexOf('onClick={openSaveExportCta}', source.indexOf("UI: PAGE HEADER"));
  const accountButtonIndex = source.indexOf('id="account-logo-button-mobile"');
  assert.ok(mainMasterGradeIndex >= 0, "expected Master Grade in the main editor toolbar");
  assert.ok(mainMasterGradeIndex < accountButtonIndex, "Master Grade should precede secondary toolbar controls");
  assert.match(source, /flex w-full items-center justify-start gap-2 overflow-x-auto/);
  assert.match(
    source,
    /isCocoLayoutEditable && cocoEditorSurface === "fine"[\s\S]*?Quick Edit/
  );
});

test("compiled stacked copy keeps real line boxes and drag commits its visual box", async () => {
  const source = await readFile(pageUrl, "utf8");

  assert.match(source, /const stackedTextRuns = Boolean\(styledTextRuns\?\.some\(\(run\) => run\.breakAfter\)\)/);
  assert.match(source, /display: stackedTextRuns \? "block" : "inline"/);
  assert.match(source, /const finalLeft = Number\(element\.dataset\.sl \|\| 0\) \+ deltaX/);
  assert.match(source, /commitCompiledObjectPosition\(object\.id, finalX, finalY, finalLeft, finalTop\)/);
  assert.match(source, /Number\.isFinite\(overrideLeft\)[\s\S]*?overrideLeft[\s\S]*?: boundX/);
});

test("Fine Tune preserves portable recipe date and time formatting after edits", async () => {
  const source = await readFile(pageUrl, "utf8");

  assert.match(
    source,
    /const portableRecipeActive = isCocoPortableRecipeId\(updatedVariant\.cocoVisualRecipeId\);[\s\S]*?const recipeDateActive =[\s\S]*?portableRecipeActive;/
  );
  assert.match(
    source,
    /portableRecipeActive[\s\S]*?String\(updatedVariant\.time \?\? clean\)/
  );
  assert.match(
    source,
    /value=\{activeCocoQuickRushNight \|\| activeCocoQuickPortableRecipe \? String\(activeCocoQuickBrief\.date \?\? ""\) : dateText\}/
  );
  assert.match(
    source,
    /activeCocoQuickRushNight \|\| activeCocoQuickPortableRecipe \? updateCocoQuickField\("date", e\.target\.value\) : setDateText\(e\.target\.value\)/
  );
  assert.match(
    source,
    /if \(activeCocoQuickRushNight \|\| activeCocoQuickPortableRecipe\) \{\s*updateCocoQuickField\("time", event\.target\.value\)/
  );
});

test("compiled Baddies labels render with their corresponding value objects", async () => {
  const source = await readFile(pageUrl, "utf8");

  assert.match(source, /details,\s*detailsLabel,\s*detailsFamily/);
  assert.match(source, /details2,\s*djLineupLabel,\s*details2Family/);
  assert.match(
    source,
    /String\(cocoCompiledDocument\?\.id \?\? ""\) === "baddies-n-bundles"[\s\S]*?object\.semanticRole === "details"[\s\S]*?detailsLabel[\s\S]*?djLineupLabel/
  );
  assert.match(source, /\[compiledLabel, valueLines\.join\("\\n"\)\]/);
  assert.match(source, /setDetailsLabel\(textValue\("detailsLabel"\)\)/);
  assert.match(source, /setDjLineupLabel\(textValue\("djLineupLabel"\)\)/);
  assert.match(source, /splitCocoLegacyLabelLockup\([\s\S]*?"Hyped By"/);
  assert.match(source, /splitCocoLegacyLabelLockup\([\s\S]*?"Music By"/);
  assert.match(source, /const lineupBody = lineupLockup\?\.value \?\? clean/);
  assert.match(source, /const detailsBody = detailsLockup\?\.value \?\? clean/);
  assert.match(source, /const styledTextRuns =[\s\S]*?usesSeparateRecipeLabel[\s\S]*?resolvedTextRuns\.map/);
  assert.match(source, /compiledLabelBgColor/);
  assert.match(source, /onReplace: isLogo \? openCocoQuickLogoReplacement : undefined/);
  assert.match(source, /id="logo-selected-controls"[\s\S]*?Replace Logo/);
});

test("multiline compiled and rail copy aligns every line against the full text box", async () => {
  const source = await readFile(pageUrl, "utf8");

  assert.match(source, /data-coco-compiled-auto-wrap="true"/);
  assert.match(source, /minWidth: "min-content"/);
  assert.match(
    source,
    /align === "right"\s*\? "translateX\(-100%\)"\s*:\s*align === "center"\s*\? "translateX\(-50%\)"/
  );
  assert.match(source, /data-coco-compiled-align=\{align\}/);
  assert.match(
    source,
    /const compiledLineItems =\s*align === "right" \? "flex-end" : align === "center" \? "center" : "flex-start"/
  );
  assert.match(source, /alignItems: compiledMultilineText \? compiledLineItems : undefined/);
  assert.match(source, /data-coco-compiled-text-line=\{index\}/);
  assert.match(
    source,
    /data-coco-compiled-text-line=\{index\}[\s\S]*?display: "block"[\s\S]*?textAlign: align[\s\S]*?width: "max-content"/
  );
  assert.match(source, /data-right-rail-line=\{index\}/);
  assert.match(
    source,
    /alignItems: rightRailAlign === "right" \? "flex-end" : rightRailAlign === "center" \? "center" : "flex-start"/
  );
  assert.match(
    source,
    /data-right-rail-line=\{index\}[\s\S]*?textAlign: rightRailAlign[\s\S]*?width: "max-content"/
  );
});
