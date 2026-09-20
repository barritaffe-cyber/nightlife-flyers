import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { cocoQrCode } from '../lib/coco/qrCode.ts';
import { materializeCocoPortableRecipeVariant as materialize, type CocoPortableRecipeId } from '../lib/coco/portableRecipeRuntime.ts';
import { buildCocoRecipeChoices, cocoRecipeDetailsIssue, diversifyCocoRecipeChoices, isCocoRecipeChoiceEligible } from '../lib/coco/recipeChoices.ts';
import { cocoRecipeFormCapabilities } from '../lib/coco/formRecipeMapping.ts';
import type { CocoEventBriefInput } from '../lib/coco/eventBriefFields.ts';
import { COCO_CURATED_ART_DIRECTION_LIBRARY } from '../components/coco/artDirections/library.ts';

const recipes = JSON.parse(readFileSync(new URL('../lib/template-data/registered-recipes.json', import.meta.url), 'utf8'));
const brief = { date: 'Dec 1 2026', startTime: '9 PM', endTime: '2 AM', venueName: 'Nova Room', address: '47 Grand Avenue', djs: 'DJ Ana\nDJ Bea', presenterName: 'Nova Events', hosts: 'MC Joy', musicPolicy: 'R&B / Afro House', entryFee: '£15.50', ageRequirement: 'All ages', rsvpContact: '+1 212 555 0100', bookingContact: '+1 212 555 0200', dressCode: 'White on jeans', mainPromotion: 'Two for one', qrDestination: 'https://example.com/scan', socials: '@clubwoods', socialPlatforms: ['instagram'], experienceFeatures: ['hookah', 'vip'] };
const render = (id: CocoPortableRecipeId, format: string, facts: CocoEventBriefInput = brief, source?: any) => materialize(id, source ?? recipes.find((r: any) => r.recipeId === id).formats[format], { eventName: 'Nova Nights', eventBrief: facts, fieldMappingVersion: 1 });
const visibleText = (v: any) => v.cocoCompositionSystem.compiledDocument.objects.filter((o: any) => o.kind === 'text' && !v.cocoCompositionSystem.compiledObjectOverrides[o.id]?.removed).map((o: any) => v.cocoCompositionSystem.compiledObjectOverrides[o.id]?.text ?? o.text).join('\n');

test('QR artwork decodes to the exact destination at preview and 4K asset sizes', async () => {
  for (const link of ['https://example.com/tickets?event=night&vip=1', 'https://example.com/soirée?name=Zoë']) {
    const qr = cocoQrCode({ ticketLink: link });
    assert.ok(qr && !('error' in qr));
    const svg = Buffer.from(decodeURIComponent(qr.url.split(',')[1]));
    for (const size of [160, 600]) {
      const { data, info } = await sharp(svg).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data, new URL(link).href);
    }
  }
});
test('QR validation, automatic ticket link, explicit override and clearing', () => {
  assert.equal(cocoQrCode({}), null);
  assert.ok('error' in cocoQrCode({ qrDestination: 'javascript:alert(1)' })!);
  assert.ok('error' in cocoQrCode({ qrDestination: 'not a link' })!);
  const qr = cocoQrCode({ qrDestination: 'example.com/rsvp', ticketLink: 'https://example.com/tickets' });
  assert.ok(qr && !('error' in qr)); assert.equal(qr.destination, 'https://example.com/rsvp');
});
test('all eight subject-free templates preserve authored geometry and offer only mappable fields', () => {
  const eligible = COCO_CURATED_ART_DIRECTION_LIBRARY.filter(d => 'containsSubject' in d && d.containsSubject === false);
  assert.equal(eligible.length, 8);
  for (const d of eligible) {
    const master = recipes.find((r: any) => r.recipeId === d.visualRecipeId);
    const caps = cocoRecipeFormCapabilities(d.visualRecipeId!, master.formats);
    const facts = Object.fromEntries(caps.fields.filter(k => !['qrDestination', 'qrLabel'].includes(k)).map(key => [key, key === 'date' ? 'Dec 1 2026' : key === 'startTime' ? '9 PM' : key === 'endTime' ? '2 AM' : 'Nova']));
    const formats: Record<string, any> = {};
    for (const format of ['square', 'story']) {
      const v = render(d.visualRecipeId as CocoPortableRecipeId, format, facts); formats[format] = v;
      assert.deepEqual(v.cocoFormMappingReport.unplacedFields, [], `${d.id}/${format}`);
      assert.equal(v.cocoDetailsPanelBox, null);
      assert.ok(!v.portraits.some((a: any) => a.id.startsWith('coco-form-detail-')));
      for (const original of master.formats[format].cocoCompositionSystem.compiledDocument.objects.filter((o: any) => o.kind === 'text')) {
        const actual = v.cocoCompositionSystem.compiledDocument.objects.find((o: any) => o.id === original.id);
        assert.deepEqual(actual.bounds, original.bounds, `${d.id}/${format}/${original.id} geometry`);
        assert.deepEqual(actual.typography, original.typography, `${d.id}/${format}/${original.id} typeface`);
        assert.deepEqual(actual.paint, original.paint, `${d.id}/${format}/${original.id} effects`);
      }
    }
    assert.equal(cocoRecipeDetailsIssue(formats), null);
  }
});
test('rebinding preserves edits, removes deselected features/QR, and restores automatic title layout', () => {
  const first = render('reggae-jams', 'square', { qrDestination: brief.qrDestination });
  const qr = first.portraits.find((a: any) => a.id === 'coco-form-qr');
  const moved = { ...first, emojiList: first.portraits.map((a: any) => a.id === qr.id ? { ...a, x: 76, scale: 1.2 } : a) };
  const next = render('reggae-jams', 'square', { qrDestination: 'https://example.com/new' }, moved);
  assert.equal(next.portraits.find((a: any) => a.id === qr.id).x, 76);
  assert.equal(next.portraits.find((a: any) => a.id === qr.id).scale, 1.2);
  assert.equal(next.portraits.find((a: any) => a.id === qr.id).cocoQrDestination, 'https://example.com/new');
  const restored = render('reggae-jams', 'square', {}, JSON.parse(JSON.stringify(next)));
  assert.ok(!restored.portraits.some((a: any) => /^coco-form-(qr|detail)/.test(a.id)));
  assert.ok(!visibleText(restored).includes('New Room'));
});
test('a QR label without a destination preserves the draft and allows five complete choices', async () => {
  const facts = { qrDestination: '', qrLabel: 'Scan for tickets' };
  const eligible = COCO_CURATED_ART_DIRECTION_LIBRARY.filter(d => isCocoRecipeChoiceEligible(d, { subjectDecision: { intent: 'none' } as any }, recipes.find((r: any) => r.recipeId === d.visualRecipeId)?.formats));
  assert.equal(eligible.length, 8);
  const candidates = eligible.map(d => {
    const formats: Record<string, any> = {};
    for (const format of ['square', 'story']) {
      const v = render(d.visualRecipeId as CocoPortableRecipeId, format, facts);
      formats[format] = v;
      assert.equal(v.cocoEventBrief.qrLabel, facts.qrLabel);
      assert.ok(!v.cocoFormMappingReport.mappedFields.includes('qrLabel'), 'an unused label is not claimed as placed');
      assert.ok(!v.portraits.some((a: any) => a.id === 'coco-form-qr'));
      assert.ok(!visibleText(v).includes(facts.qrLabel));
      assert.deepEqual(v.cocoFormMappingReport.unplacedFields, [], `${d.id}/${format}`);
    }
    return { id: d.id, formats };
  });
  const choices = await buildCocoRecipeChoices(candidates, async candidate => {
    const issue = cocoRecipeDetailsIssue(candidate.formats);
    if (issue) throw new Error(issue);
    return candidate;
  });
  assert.equal(choices.length, 5);
  assert.equal(new Set(choices.map(c => c.id)).size, 5);
});
test('QR labels follow explicit, ticket and RSVP links and stop blocking after links are cleared', () => {
  for (const linkField of ['qrDestination', 'ticketLink', 'rsvpContact']) {
    for (const format of ['square', 'story']) {
      const facts = { qrDestination: '', qrLabel: 'Get tickets', [linkField]: 'https://example.com/tickets' };
      const first = render('reggae-jams', format, facts);
      assert.ok(first.cocoFormMappingReport.mappedFields.includes('qrLabel'));
      assert.ok(visibleText(first).includes(facts.qrLabel));
      assert.equal(first.portraits.find((a: any) => a.id === 'coco-form-qr')?.cocoQrDestination, 'https://example.com/tickets');
      const cleared = render('reggae-jams', format, { ...facts, [linkField]: '' }, JSON.parse(JSON.stringify(first)));
      assert.equal(cocoRecipeDetailsIssue({ square: cleared, story: cleared }), null);
      assert.equal(cleared.cocoEventBrief.qrLabel, facts.qrLabel);
      assert.ok(!cleared.portraits.some((a: any) => a.id === 'coco-form-qr'));
      assert.ok(!visibleText(cleared).includes(facts.qrLabel));
    }
  }
});
test('a QR label never hides an invalid destination error', () => {
  for (const format of ['square', 'story']) {
    const v = render('city-nights', format, { ...brief, qrDestination: 'not a link', qrLabel: 'Get tickets' });
    assert.match(cocoRecipeDetailsIssue({ square: v, story: v })!, /complete website link/);
    assert.ok(v.cocoFormMappingReport.unplacedFields.includes('qrLabel'));
  }
});
test('oversized briefs are rejected for choices without losing their saved data', () => {
  const facts = { ...brief, djs: 'A very long guest list '.repeat(1000) };
  const square = render('city-nights', 'square', facts);
  assert.ok(cocoRecipeDetailsIssue({ square, story: square }));
  assert.equal(square.cocoEventBrief.djs, facts.djs);
});
test('diversity retains every eligible candidate and respects compatibility costs', () => {
  const ranked = COCO_CURATED_ART_DIRECTION_LIBRARY.filter(d => 'containsSubject' in d && d.containsSubject === false).map((direction, index) => ({ direction, index, cost: index === 0 ? 100 : 0 }));
  const result = diversifyCocoRecipeChoices(ranked);
  assert.equal(new Set(result.map(d => d.id)).size, ranked.length);
  assert.equal(result.at(-1)?.id, ranked[0].direction.id);
});
