import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const startupSource = readFileSync("components/ui/StartupTemplates.tsx", "utf8");
const appSource = readFileSync("app/page.tsx", "utf8");
const chooserSource = readFileSync("components/coco/CocoDirectionChooser.tsx", "utf8");
const quickEditSource = readFileSync("components/coco/CocoQuickEdit.tsx", "utf8");

function sourceSection(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing source section start: ${start}`);
  assert.notEqual(endIndex, -1, `missing source section end: ${end}`);
  return source.slice(startIndex, endIndex);
}

test("startup hands separate recipe subject authority through the composer payload", () => {
  const payloadType = sourceSection(
    startupSource,
    "export type StartupSelectPayload",
    "export type StartupTemplateOption",
  );
  assert.match(payloadType, /recipeSubjectDataUrl\?: string/);
  assert.match(payloadType, /recipeSubjectBounds\?: CocoComposerSubjectBounds/);
  assert.match(payloadType, /subjectSourceDataUrl\?: string/);
  assert.match(payloadType, /subjectDecision\?: CocoSubjectDecision/);

  const submit = sourceSection(
    startupSource,
    "const handleComposerSubmit",
    "const openComposerStudio",
  );
  const handoff = sourceSection(
    submit,
    'onSelect("coco-composer"',
    "    } finally {",
  );
  assert.match(handoff, /recipeSubjectDataUrl:\s*recipeSubjectDataUrl \|\| undefined/);
  assert.match(handoff, /recipeSubjectBounds,/);
  assert.match(handoff, /subjectSourceDataUrl:\s*subjectSourceDataUrl \|\| undefined/);
  assert.match(handoff, /subjectDecision,/);
});

test("a background without an explicit subject stays background-only", () => {
  const submit = sourceSection(
    startupSource,
    "const handleComposerSubmit",
    "const openComposerStudio",
  );
  assert.match(submit, /else if \(backgroundAnalysisDataUrl\) \{[\s\S]*?backgroundOnlyHero = true;/);
  assert.match(submit, /subjectDecision = \{ intent: "none", quality: "none" \}/);
  assert.doesNotMatch(submit, /recipeSubjectDataUrl = segmentedForBounds/);
  assert.doesNotMatch(submit, /subjectReferenceImage = backgroundAnalysisDataUrl/);
  assert.doesNotMatch(submit, /analyzeImageWithAutoDetection\(backgroundAnalysisDataUrl/);
  assert.match(appSource, /isCocoRecipeChoiceEligible\(direction, sourceComposer, registered\?\.formats\)/);
});

test("recipe candidates resolve user, recipe, and blocked subject authority centrally", () => {
  const candidateBuilder = sourceSection(
    appSource,
    "async function buildPendingCocoDirectionCandidate",
    "function mergeStartupVariant",
  );

  assert.match(candidateBuilder, /resolveCocoRecipeSubjectAuthority\(\{/);
  assert.match(candidateBuilder, /decision: sourceComposer\.subjectDecision/);
  assert.match(candidateBuilder, /hasUserSubject: Boolean\(recipeSubjectDataUrl\)/);
  assert.match(candidateBuilder, /subjectAuthority\.mode === "user"/);
  assert.match(
    candidateBuilder,
    /requiresRecipeSubjectConsent: subjectAuthority\.requiresRecipeSubjectConsent/,
  );
  assert.match(candidateBuilder, /requiresSubjectRetry: subjectAuthority\.mode === "blocked"/);
});

test("direction chooser requires an explicit recipe-subject decision", () => {
  assert.match(
    chooserSource,
    /data-testid=\{\s*choice\.requiresRecipeSubjectConsent\s*\?\s*"coco-recipe-subject-consent"/,
  );
  assert.match(chooserSource, /data-testid="coco-retry-subject"/);
  assert.match(chooserSource, /data-testid="coco-use-recipe-subject"/);
  assert.match(
    chooserSource,
    /onSelect\(choice\.id, \{ approveRecipeSubject: true \}\)/,
  );
});

test("Quick Edit exposes the weak-cutout improvement action", () => {
  assert.match(quickEditSource, /showImproveCutout\?: boolean/);
  assert.match(quickEditSource, /onImproveCutout\?: \(\) => void/);
  assert.match(quickEditSource, /testId="coco-improve-cutout"/);
  assert.match(quickEditSource, /"Improve cutout"/);

  const improveCutout = sourceSection(
    appSource,
    "const improveCocoQuickSubjectCutout",
    "const canvasMasterFilterCss",
  );
  assert.doesNotMatch(improveCutout, /cocoSubjectBounds:\s*undefined/);
  assert.match(
    improveCutout,
    /targetFormat === format\s*\?\s*liveList\.find\(\(item: any\) => isCocoRecipeSubjectAsset\(item\)\)/,
  );
});
