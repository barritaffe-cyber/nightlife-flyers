import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoBriefForCapabilities, cocoRecipeFormCapabilities, mapCocoFormToRecipe } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant as materialize, type CocoPortableRecipeId } from '../lib/coco/portableRecipeRuntime.ts';
const recipes = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));

test('We Outside initials and brand name have independent form and editor owners in both formats', async () => {
  const { cocoCompiledTextControl, cocoCompiledTextEdit } = await import('../lib/coco/compiledTextEditing.ts');
  const formats = JSON.parse(readFileSync('public/generated-flyers/we-outside.nflyer', 'utf8')).state.session;
  const caps = cocoRecipeFormCapabilities('we-outside', formats);
  assert.deepEqual(caps.bindings['recipe:brand'].targets, { square: ['brand'], story: ['brand'] });
  assert.equal(caps.bindings['recipe:brand'].label, 'Brand initials');
  assert.equal(caps.bindings.presenterName.label, 'Brand / venue name');
  assert.ok(!caps.bindings.eventDetails?.targets.square?.includes('brand'));
  const brief = cocoBriefForCapabilities({ theme: 'Urban' }, caps);
  for (const format of ['square', 'story']) {
    const build = (source: any, initials: string, name: string) => materialize('we-outside', source, {
      fieldMappingVersion: 1, eventName: 'We Outside', eventBrief: { ...brief, 'recipe:brand': initials, presenterName: name },
    });
    const empty = build(formats[format], '', '');
    let filled = build(empty, 'NC', 'NOVA\nCLUB');
    assert.equal(filled.cocoCompositionSystem.compiledObjectOverrides.brand.text, 'NC');
    assert.equal(filled.cocoCompositionSystem.compiledObjectOverrides.presenter.text, 'NOVA\nCLUB');
    for (const [field, id, other] of [['rightRail', 'brand', 'presenter'], ['presenter', 'presenter', 'brand']]) {
      const owner = cocoCompiledTextControl(filled, field, other);
      assert.equal(owner.id, id);
      const unchanged = JSON.parse(JSON.stringify(filled.cocoCompositionSystem.compiledObjectOverrides[other]));
      for (const text of ['EDIT', '', 'NEW']) {
        filled = JSON.parse(JSON.stringify({ ...filled, ...cocoCompiledTextEdit(filled, owner, text) }));
        assert.equal(filled.cocoCompositionSystem.compiledObjectOverrides[id].text, text);
        assert.deepEqual(filled.cocoCompositionSystem.compiledObjectOverrides[other], unchanged);
      }
    }
    const cleared = build(filled, '', '');
    assert.equal(cleared.cocoCompositionSystem.compiledObjectOverrides.brand.text, '');
    assert.equal(cleared.cocoCompositionSystem.compiledObjectOverrides.presenter.text, '');
    assert.deepEqual(cocoRecipeFormCapabilities('we-outside', { ...formats, [format]: empty }), caps);
  }
});

test('Elite Monday venue and ONWARDS follow Venue name and Start time independently of DJs', () => {
  const formats = JSON.parse(readFileSync('public/generated-flyers/elite-monday-updated.nflyer', 'utf8')).state.session;
  const caps = cocoRecipeFormCapabilities('elite-monday', formats);
  assert.deepEqual(caps.bindings.venueName.targets, { square: ['artist'], story: ['artist'] });
  assert.equal(caps.bindings.venueName.label, 'Venue name');
  assert.equal(caps.limits.venueName.maxLines, 1);
  assert.ok(!caps.fields.includes('performers'));
  assert.ok(!caps.fields.includes('recipe:onwards'));
  const brief = cocoBriefForCapabilities({ theme: 'Elegant' }, caps);
  for (const format of ['square', 'story']) {
    const build = (source: any, venueName = '', startTime = '') => materialize('elite-monday', source, {
      fieldMappingVersion: 1, eventName: 'Elite Monday', eventBrief: { ...brief, venueName, startTime, djs: 'Flip' },
    });
    const empty = build(formats[format]);
    const filled = build(empty, 'The Loft', '8 PM');
    const overrides = filled.cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(overrides.artist.text, 'THE LOFT');
    assert.deepEqual(overrides.artist.cocoFormFields, ['venueName']);
    assert.equal(filled.venue, 'THE LOFT');
    assert.equal(overrides.time.text.replace(/\s/g, ''), '8PM');
    assert.equal(overrides.onwards.text, 'ONWARDS');
    assert.equal(filled.timeConnector, 'ONWARDS');
    assert.equal(overrides.special.text, 'FLIP');
    const noTime = build(filled, 'The Loft');
    assert.equal(noTime.cocoCompositionSystem.compiledObjectOverrides.onwards.text, '');
    assert.equal(noTime.cocoCompositionSystem.compiledObjectOverrides.artist.text, 'THE LOFT');
    const noVenue = build(filled, '', '9 PM');
    assert.equal(noVenue.cocoCompositionSystem.compiledObjectOverrides.artist.text, '');
    assert.equal(noVenue.cocoCompositionSystem.compiledObjectOverrides.onwards.text, 'ONWARDS');
    assert.deepEqual(cocoRecipeFormCapabilities('elite-monday', { ...formats, [format]: empty }), caps);
  }
});

test('Elite Monday only shows its DJ block when DJ details are supplied', () => {
  const formats = JSON.parse(readFileSync('public/generated-flyers/elite-monday-updated.nflyer', 'utf8')).state.session;
  const caps = cocoRecipeFormCapabilities('elite-monday', formats);
  assert.deepEqual(caps.bindings.djs.targets, { square: ['special'], story: ['special'] });
  const brief = cocoBriefForCapabilities({ theme: 'Elegant' }, caps);
  for (const format of ['square', 'story']) {
    const source = formats[format];
    const before = JSON.stringify(source);
    const build = (variant: any, djs = '') => materialize('elite-monday', variant, {
      eventName: 'Ladies Night', eventBrief: { ...brief, djs }, fieldMappingVersion: 1,
    });
    const preview = build(source);
    const filled = build(preview, 'Nova');
    const cleared = build(filled);
    for (const empty of [preview, cleared]) {
      const overrides = empty.cocoCompositionSystem.compiledObjectOverrides;
      for (const id of ['special', 'dj', 'featuring']) assert.equal(overrides[id].text, '', `${format}/${id}`);
      for (const id of ['djFrame', 'rule']) assert.equal(overrides[id].removed, true, `${format}/${id}`);
    }
    const overrides = filled.cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(overrides.special.text, 'NOVA');
    assert.equal(overrides.dj.text, 'DJ');
    assert.equal(overrides.featuring.text, 'FEATURING');
    for (const id of ['djFrame', 'rule']) assert.equal(overrides[id].removed, false);
    const edited = structuredClone(filled);
    edited.cocoCompositionSystem.compiledObjectOverrides.djFrame = { removed: true };
    assert.equal(build(edited, 'Orbit').cocoCompositionSystem.compiledObjectOverrides.djFrame.removed, true, 'retain a manually removed frame');
    assert.equal(JSON.stringify(source), before, 'preserve the saved master');
    assert.deepEqual(cocoRecipeFormCapabilities('elite-monday', { ...formats, [format]: preview }), caps, 'the empty preview retains its DJ input');
  }
});

test('the form routes every offered field to its supported formats, including all fields together', () => {
  for (const recipe of recipes) {
    const capabilities = cocoRecipeFormCapabilities(recipe.recipeId, recipe.formats);
    const materialized: Record<string, any> = {};
    const brief = { fieldFormats: capabilities.fieldFormats, recipeFieldBindings: capabilities.bindings, ...Object.fromEntries(capabilities.fields.map(key => [key, key === 'qrDestination' ? 'https://example.com' : key === 'date' ? 'Dec 1 2026' : key === 'startTime' ? '9 PM' : 'Nova'])) };
    for (const format of ['square', 'story']) {
      const v = materialize(recipe.recipeId as CocoPortableRecipeId, recipe.formats[format], { eventName: 'Nova Nights', eventBrief: brief, fieldMappingVersion: 1 });
      materialized[format] = v;
      assert.deepEqual(v.cocoFormMappingReport.unplacedFields, [], `${recipe.recipeId}/${format}`);
      assert.equal(v.cocoDetailsPanelBox ?? null, null);
    }
    assert.deepEqual(cocoRecipeFormCapabilities(recipe.recipeId, materialized), capabilities, `${recipe.recipeId}: fields stay available after binding`);
  }
});

test('Dodge does not solicit contacts, promotions, QR or hosts without authored slots', () => {
  const recipe = recipes.find((r: any) => r.recipeId === 'dodge-night-rides');
  const capabilities = cocoRecipeFormCapabilities(recipe.recipeId, recipe.formats);
  for (const key of ['email', 'bookingContact', 'hosts', 'mainPromotion', 'qrDestination', 'drinkSpecials']) assert.ok(!capabilities.fields.includes(key), key);
  for (const key of ['date', 'djs', 'venueName', 'address', 'eventDetails']) assert.ok(capabilities.fields.includes(key), key);
  const oneFormat = structuredClone(recipe.formats);
  oneFormat.story.cocoCompositionSystem.compiledDocument.objects = oneFormat.story.cocoCompositionSystem.compiledDocument.objects.filter((o: any) => o.id !== 'venue');
  assert.deepEqual(cocoRecipeFormCapabilities(recipe.recipeId, oneFormat).fieldFormats.venueName, ['square']);
});

test('authored headline copy is never shrunk by a generic font estimate', () => {
  const source = recipes.find((r: any) => r.recipeId === 'dodge-night-rides').formats.square;
  const headline = source.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.semanticRole === 'headline');
  const result = mapCocoFormToRecipe('dodge-night-rides', source, headline.text, { subtitle: 'Nights' }, { day: '', month: '', weekday: '' });
  const expected = source.cocoCompositionSystem.compiledObjectOverrides[headline.id]?.size ?? headline.typography.fontSizePx;
  assert.equal(result.system.compiledObjectOverrides[headline.id].size, expected);
});

test('startup collects no unsupported brief before choosing a template', () => {
  const source = readFileSync('components/ui/StartupTemplates.tsx', 'utf8');
  assert.ok(!source.includes('<CocoEventBriefFields'));
  const editor = readFileSync('app/page.tsx', 'utf8');
  assert.match(editor, /capabilities=\{cocoQuickFormCapabilities\}/);
  const chooser = readFileSync('components/coco/CocoDirectionChooser.tsx', 'utf8');
  assert.match(chooser, /if \(!exportedSrc && generatedCanvas\)/);
});

test('rebinding an old automatic panel restores authored layout without deleting the saved brief', () => {
  const master = recipes.find((r: any) => r.recipeId === 'city-nights').formats.square;
  const source = structuredClone(master);
  const system = source.cocoCompositionSystem;
  const headline = system.compiledDocument.objects.find((o: any) => o.id === 'headline');
  const original = structuredClone(headline);
  const prior = { ...system.compiledObjectOverrides.headline };
  const auto = { ...prior, left: 4, top: 4, size: 20 };
  system.compiledObjectOverrides.headline = auto;
  system.cocoDetailsTitleLayout = { headline: { override: prior, bounds: original.bounds, paintBounds: original.paintBounds, auto } };
  headline.bounds = { ...headline.bounds, x: 4, y: 4 };
  system.compiledDocument.objects.push({ id: 'coco-form-detail-backdrop', kind: 'image' });
  source.emojiList = [...(source.emojiList ?? []), { id: 'coco-form-detail-backdrop', url: 'old-panel.svg' }];
  source.cocoDetailsPanelBox = { x: 4, y: 40, width: 92, height: 40 };
  const facts = { venueName: 'The Loft', email: 'saved@example.com', hosts: 'Saved host' };
  const next = materialize('city-nights', source, { eventName: 'Beat Therapy', eventBrief: facts, fieldMappingVersion: 1 });
  assert.deepEqual(next.cocoEventBrief, facts);
  assert.equal(next.cocoDetailsPanelBox, null);
  assert.ok(!next.portraits.some((a: any) => a.id.startsWith('coco-form-detail-')));
  assert.deepEqual(next.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === 'headline').bounds, original.bounds);
  assert.equal(next.cocoCompositionSystem.compiledObjectOverrides.headline.left, prior.left);
  assert.ok(next.cocoFormMappingReport.unplacedFields.includes('hosts'));
});
