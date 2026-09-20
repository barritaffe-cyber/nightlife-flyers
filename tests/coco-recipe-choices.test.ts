import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { collectCocoRecipeChoices, buildCocoRecipeChoices, buildCocoRecipeChoicePage, CocoRecipeChoiceMismatch, cocoNoMatchingDesignsMessage, cocoComposerUsesSubject, isCocoRecipeChoiceEligible } from "../lib/coco/recipeChoices.ts";
import { COCO_CURATED_ART_DIRECTION_LIBRARY } from "../components/coco/artDirections/library.ts";
import { loadCocoPortableRecipeProject } from "../lib/coco/portableRecipeRuntime.ts";

const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));
const noSubject = { subjectDecision: { intent: 'none', quality: 'none' } } as const;
const eligible = COCO_CURATED_ART_DIRECTION_LIBRARY.filter(direction => isCocoRecipeChoiceEligible(direction, noSubject, recipes.find((r: any) => r.recipeId === direction.visualRecipeId)?.formats));

test('all width rejections return a normal empty page with guidance for the existing inputs', async () => {
  const result = await buildCocoRecipeChoicePage([1, 2], async () => {
    throw new CocoRecipeChoiceMismatch('The event name is too wide.', 'headline-width');
  });
  assert.deepEqual(result.choices, []);
  assert.deepEqual(result.remaining, []);
  assert.deepEqual(result.errors, []);
  assert.equal(result.mismatches.length, 2);
  assert.match(cocoNoMatchingDesignsMessage(result.mismatches), /shorter name or a different theme/);
  const empty = await buildCocoRecipeChoicePage([], async candidate => candidate);
  assert.deepEqual(empty.errors, []);
  assert.match(cocoNoMatchingDesignsMessage(empty.mismatches), /different event name or theme/);
});

test('fit rejections do not hide a genuine recipe load failure', async () => {
  const downloadError = new Error('Recipe download failed');
  const result = await buildCocoRecipeChoicePage([1, 2], async candidate => {
    if (candidate === 1) throw new CocoRecipeChoiceMismatch('The event name is too wide.', 'headline-width');
    throw downloadError;
  });
  assert.deepEqual(result.errors, [downloadError]);
  assert.equal(result.mismatches.length, 1);
});

test('a rejected candidate can be retried with a shorter name and successful choices are retained', async () => {
  const build = async (name: string) => {
    if (name.length > 10) throw new CocoRecipeChoiceMismatch('Too wide', 'headline-width');
    return name;
  };
  assert.deepEqual((await buildCocoRecipeChoicePage(['An excessively wide event name'], build)).choices, []);
  const retry = await buildCocoRecipeChoicePage(['City Night', 'Another excessively wide name'], build);
  assert.deepEqual(retry.choices, ['City Night']);
  assert.deepEqual(retry.errors, []);
});

test('no-portrait requests include baked people and exclude separate editable subjects', () => {
  assert.ok(eligible.length >= 6, 'five choices plus a replacement');
  for (const id of ['reggae-jams', 'rnb-thursdays', 'space-neon', 'elite-monday']) {
    assert.ok(!eligible.some(d => d.id === id), `${id} must not appear without a subject`);
  }
  for (const id of ['we-outside', 'diabla-all-white', 'amapiano-night', 'punta-cana-sundays']) {
    assert.ok(eligible.some(d => d.id === id), `${id}: baked people do not require a portrait`);
  }
  assert.ok(eligible.some(d => d.id === 'brunch-saturday'), 'decorative cocktail is not a portrait');
  assert.ok(eligible.some(d => d.id === 'city-nights'));
  assert.equal(cocoComposerUsesSubject({ ...noSubject, subjectDataUrl: 'stale-subject.png' }), false);
  assert.equal(cocoComposerUsesSubject({ subjectDataUrl: 'selected-subject.png' }), true);
});

test('an unexpected subject in either downloaded format invalidates a no-subject choice', () => {
  const direction = eligible.find(d => d.id === 'city-nights')!;
  const source = recipes.find((r: any) => r.recipeId === direction.visualRecipeId).formats;
  for (const format of ['square', 'story']) {
    const changed = structuredClone(source);
    changed[format].portraits = [{ isExtracted: true, url: 'unexpected-model.png' }];
    assert.equal(isCocoRecipeChoiceEligible(direction, noSubject, changed), false);
  }
});

test('users supplying a portrait get directions that accept their portrait', () => {
  const direction = COCO_CURATED_ART_DIRECTION_LIBRARY.find(d => d.id === 'black-gold-party')!;
  assert.ok(isCocoRecipeChoiceEligible(direction, { subjectDecision: { intent: 'user', quality: 'strong' }, subjectDataUrl: 'selected.png' }));
  for (const d of COCO_CURATED_ART_DIRECTION_LIBRARY.filter(d => d.subjectPolicy.mode === 'none')) {
    assert.equal(isCocoRecipeChoiceEligible(d, { subjectDataUrl: 'selected.png' }), false, d.id);
  }
});

test('five distinct successful choices are built, replacing failed recipes in order', async () => {
  const attempted: string[] = [];
  const choices = await buildCocoRecipeChoices(eligible, async d => {
    attempted.push(d.id);
    if (d.id === eligible[0].id) throw new Error('Unavailable recipe');
    return { id: d.id };
  });
  assert.equal(choices.length, 5);
  assert.equal(new Set(choices.map(c => c.id)).size, 5);
  assert.equal(attempted.length, 6);
  assert.deepEqual(choices.map(c => c.id), eligible.slice(1, 6).map(d => d.id));
});

test('an incomplete set never silently becomes fewer than five choices', async () => {
  await assert.rejects(buildCocoRecipeChoices(eligible.slice(0, 4), async d => d), /only build 4 of 5/);
});

test('repeated recipe failures are reported once while distinct causes remain visible', async () => {
  await assert.rejects(buildCocoRecipeChoices([0, 1, 2, 3, 4, 5], async candidate => {
    throw new Error(candidate === 5 ? 'Recipe unavailable.' : 'This design needs more room for: DJs.');
  }), {
    message: 'Coco could only build 0 of 5 eligible choices. Please try again. This design needs more room for: DJs.; Recipe unavailable.',
  });
});

test("the image step hands off to authored recipes without awaiting gallery search", () => {
  const source = readFileSync("components/ui/StartupTemplates.tsx", "utf8");
  const submit = source.slice(source.indexOf("const handleComposerSubmit = async"), source.indexOf("const openComposerStudio ="));
  assert.ok(submit.length > 0);
  assert.doesNotMatch(submit, /onFindCocoReference\(|selectedReference/);
  assert.match(submit, /onSelect\("coco-composer",/);
  assert.match(submit, /referenceCandidates: \[\]/);
  assert.match(submit, /layoutRecipeTemplateId: ""/);
  assert.doesNotMatch(submit, /Exploring the strongest creative direction/);
  assert.doesNotMatch(submit, /analyzeImageWithAutoDetection\(backgroundAnalysisDataUrl/);
  assert.doesNotMatch(submit, /segmentSubjectAlphaLocal\(/);
});

test("a missing City Nights export does not hide Grey Rave", async () => {
  assert.deepEqual(await collectCocoRecipeChoices([
    Promise.resolve({ id: "grey-rave-festival" }),
    Promise.reject(new Error("City Nights: 404")),
  ]), [{ id: "grey-rave-festival" }]);
});

test("all failures surface their causes instead of empty choices", async () => {
  await assert.rejects(collectCocoRecipeChoices([
    Promise.reject(new Error("Grey Rave download timed out")),
    Promise.reject(new Error("City Nights: 404")),
  ]), /Grey Rave download timed out; City Nights: 404/);
  await assert.rejects(collectCocoRecipeChoices([]), /No authored Coco recipes/);
});

test("stalled recipe downloads time out and failed downloads can be retried", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let requests = 0;
  t.mock.method(globalThis, "fetch", (_url: unknown, init: RequestInit) => {
    requests++;
    return new Promise((_resolve, reject) => {
      init.signal!.addEventListener("abort", () => reject(new Error("Aborted")), { once: true });
    });
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const pending = loadCocoPortableRecipeProject("grey-rave-festival");
    const assertion = assert.rejects(pending, /grey-rave-festival timed out after 20 seconds/);
    t.mock.timers.tick(20_000);
    await assertion;
  }
  assert.equal(requests, 2, "a failed cached request must not poison later attempts");
});
