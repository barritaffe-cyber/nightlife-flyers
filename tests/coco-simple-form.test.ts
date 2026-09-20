import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cocoAuthoredFieldValue, cocoInputLine, cocoFieldLines, cocoFieldLineError, cocoInputValue, cocoPaintInputLine } from '../lib/coco/formFieldLayout.ts';
import { cocoRecipeFormCapabilities, cocoBriefForCapabilities } from '../lib/coco/formRecipeMapping.ts';
import { materializeCocoPortableRecipeVariant } from '../lib/coco/portableRecipeRuntime.ts';
import { isCocoRecipeChoiceEligible } from '../lib/coco/recipeChoices.ts';
import { COCO_CURATED_ART_DIRECTION_LIBRARY } from '../components/coco/artDirections/library.ts';
const recipes: { recipeId: string; formats: Record<'square' | 'story', any> }[] = JSON.parse(readFileSync('lib/template-data/registered-recipes.json', 'utf8'));

test('number inputs retain authored labels, currencies, suffixes and line breaks without duplicates', () => {
  for (const [saved, value, expected] of [
    ['TICKETS $25', '30', 'TICKETS $30'], ['TICKETS $25', '$30', 'TICKETS $30'],
    ['TICKETS $25', 'Tickets $30', 'TICKETS $30'], ['TICKETS\n$25', '30', 'TICKETS\n$30'],
    ['TICKETS $25', 'Free', 'TICKETS Free'], ['RSVP 0088 235 0089', '555 123 4567', 'RSVP 555 123 4567'],
    ['R.S.V.P 0088 235 0089', '555 123 4567', 'R.S.V.P 555 123 4567'],
    ['21+ EVENT', '18', '18+ EVENT'], ['$25 PER PERSON', '12.50', '$12.50 PER PERSON'],
    ['DRESS CODE:\nSTYLISH & BOLD', 'Casual', 'DRESS CODE:\nCasual'],
    ['234 WEST AVENUE', '12 Main Street', '12 Main Street'], ['TICKETS $25', '', ''],
  ]) assert.equal(cocoAuthoredFieldValue(saved, value), expected);
});

test('two-line fields have two independent answers; one line cannot silently replace both', () => {
  const lines = cocoFieldLines({label:'Tagline',group:'Event details',kind:'text',targets:{square:['tagline']},originalText:{square:'Good\nMusic'}},2);
  assert.equal(lines.length,2);
  assert.ok(cocoFieldLineError('Tagline','Great\n',lines));
  assert.equal(cocoFieldLineError('Tagline','Great\nMusic',lines),null);
  assert.equal(cocoFieldLineError('Tagline','',lines),null);
  assert.equal(cocoPaintInputLine(lines[0],'Great'),'Great');
});

test('different Square and Story line structures get separately scoped answers', () => {
  const recipe=recipes.find(r=>r.recipeId==='black-tie');
  assert.ok(recipe);
  const cap=cocoRecipeFormCapabilities('black-tie',recipe.formats);
  assert.deepEqual(cap.fieldFormats.subtitle,['square']);
  assert.deepEqual(cap.fieldFormats['recipe:story:subtitle'],['story']);
  assert.equal(cocoFieldLines(cap.bindings['recipe:story:subtitle'],2).length,2);
  const brief=cocoBriefForCapabilities({subtitle:'A great night','recipe:story:subtitle':'A great\nNight'},cap);
  for(const format of ['square','story'] as const) {
    const v=materializeCocoPortableRecipeVariant('black-tie',recipe.formats[format],{eventName:'Black Tie',eventBrief:brief,fieldMappingVersion:1});
    const id=cap.bindings[format==='square'?'subtitle':'recipe:story:subtitle'].targets[format]![0];
    assert.equal(v.cocoCompositionSystem.compiledObjectOverrides[id].text,format==='square'?'A GREAT NIGHT':'A GREAT\nNIGHT');
  }
});

test('default design browsing includes both asset types; custom portraits still require replacement slots', () => {
  for (const recipe of recipes) {
    const direction=COCO_CURATED_ART_DIRECTION_LIBRARY.find(d=>d.visualRecipeId===recipe.recipeId);
    if (!direction) continue;
    assert.equal(isCocoRecipeChoiceEligible(direction,{keepDesignImages:true},recipe.formats),true,recipe.recipeId);
  }
  const baked=COCO_CURATED_ART_DIRECTION_LIBRARY.find(d=>d.visualRecipeId==='beat-therapy')!;
  assert.equal(isCocoRecipeChoiceEligible(baked,{keepDesignImages:true,subjectDataUrl:'/person.png'},recipes.find(r=>r.recipeId==='beat-therapy')!.formats),false);
});

test('Bad Girls numeric answers and two DJ boxes reach both canvases and keep authored assets', () => {
  const recipe=recipes.find(r=>r.recipeId==='bad-girls');
  assert.ok(recipe);
  const cap=cocoRecipeFormCapabilities(recipe.recipeId,recipe.formats);
  const brief=cocoBriefForCapabilities({theme:'Urban',entryFee:'30',ageRequirement:'18',rsvpContact:'555 123 4567',djs:'dj nova\ndj orbit',subtitle:'Great\nMusic'},cap);
  const price=cocoFieldLines(cap.bindings.entryFee,cap.limits.entryFee.maxLines)[0];
  assert.equal(cocoInputValue(price,'TICKETS $30'),'30');
  for (const format of ['square','story'] as const) {
    const v=materializeCocoPortableRecipeVariant('bad-girls',recipe.formats[format],{eventName:'Bad Girls',eventBrief:brief,fieldMappingVersion:1});
    const o=v.cocoCompositionSystem.compiledObjectOverrides;
    assert.equal(o.entry.text,'TICKETS $30'); assert.equal(o.age.text,'18+ EVENT');
    assert.equal(o.contact.text,'RSVP 555 123 4567'); assert.equal(o.dj1.text,'DJ NOVA'); assert.equal(o.dj2.text,'DJ ORBIT');
    assert.equal(o.tagline.text,'Great\nMusic');
    assert.deepEqual(v.portraits,recipe.formats[format].emojiList);
  }
});

test('dress-code inputs finish the authored sentence and keep decorative lines automatic', () => {
  const reference = 'WEAR WHITE\nLET THE NIGHT SHINE';
  const binding = {label:'Dress code',group:'Experience & specials',kind:'text' as const,targets:{square:['genres']},originalText:{square:reference}};
  const lines = cocoFieldLines(binding,2);
  assert.equal(lines.filter(line => !line.fixed).length,1);
  assert.equal(lines[0].prefix,'WEAR ');
  for (const answer of ['casual','white','white + neon','WEAR white + neon']) {
    const painted = cocoAuthoredFieldValue(reference,answer,true);
    assert.equal(painted,`WEAR ${answer.replace(/^WEAR /,'')}\nLET THE NIGHT SHINE`);
    assert.equal(cocoAuthoredFieldValue(reference,painted,true),painted,'full form value stays idempotent');
    assert.equal(cocoFieldLineError('Dress code',painted,lines),null);
  }
  assert.equal(cocoAuthoredFieldValue(reference,'',true),'');
  assert.equal(cocoAuthoredFieldValue('DRESS CODE: WHITE ON JEANS','white + neon',true),'DRESS CODE: white + neon');
  assert.equal(cocoAuthoredFieldValue('DRESS TO IMPRESS','casual',true),'DRESS CODE: casual');
  assert.equal(cocoAuthoredFieldValue('UPSCALE\nATTIRE','casual',true),'casual\nATTIRE');
  assert.equal(cocoAuthoredFieldValue(reference,'Custom headline',false),'Custom headline','do not interpret unrelated text as dress code');
});

test('Glow dress-code grammar reaches both canvases without changing its typography', () => {
  const recipe=recipes.find(r=>r.recipeId==='glow-in-the-dark')!;
  const caps=cocoRecipeFormCapabilities(recipe.recipeId,recipe.formats);
  const brief=cocoBriefForCapabilities({dressCode:'white + neon'},caps);
  for(const format of ['square','story'] as const) {
    const v=materializeCocoPortableRecipeVariant('glow-in-the-dark',recipe.formats[format],{eventName:'Glow in the Dark',eventBrief:brief,fieldMappingVersion:1});
    assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.genres.text,'WEAR WHITE + NEON\nLET THE NIGHT SHINE');
    assert.deepEqual(v.cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='genres').typography,recipe.formats[format].cocoCompositionSystem.compiledDocument.objects.find((o:any)=>o.id==='genres').typography);
  }
});

test('50-character event details are accepted and preserved in both Pulse formats', () => {
  const recipe=recipes.find(r=>r.recipeId==='pulse')!;
  const caps=cocoRecipeFormCapabilities(recipe.recipeId,recipe.formats);
  const eventDetails='Enjoy great food, good music and friends all night';
  assert.equal(eventDetails.length,50);
  assert.equal(caps.limits.eventDetails.maxLength,50);
  for(const format of ['square','story'] as const) {
    assert.equal(caps.byFormat[format].eventDetails.maxLength,50);
    const v=materializeCocoPortableRecipeVariant('pulse',recipe.formats[format],{eventName:'Pulse Sunday',eventBrief:cocoBriefForCapabilities({eventDetails},caps),fieldMappingVersion:1});
    assert.equal(v.cocoCompositionSystem.compiledObjectOverrides.details.text,eventDetails.toUpperCase());
  }
});


test('structured form typing retains spaces after words and beside authored helpers', () => {
  for (const [reference, answer] of [
    ['DJ SPICE', 'DJ Night Shift'],
    ['WEAR WHITE', 'white + neon'],
    ['RSVP 123456', '555 123 4567'],
    ['CLUB WOODS PRESENTS', 'Night Crew'],
  ]) {
    const line = cocoInputLine(reference, reference.startsWith('WEAR'));
    let saved = '';
    let typed = '';
    for (const key of answer) {
      typed += key;
      saved = cocoPaintInputLine(line, cocoInputValue(line, saved, true) + key, true);
      assert.equal(cocoInputValue(line, saved, true), typed, `${reference}: ${JSON.stringify(typed)}`);
    }
    saved = cocoPaintInputLine(line, cocoInputValue(line, saved, true) + ' ', true);
    assert.equal(cocoInputValue(line, saved, true), answer + ' ', 'keep the final space while editing');
    assert.equal(cocoInputValue(line, saved), answer, 'normalization still trims for final use');
    assert.equal(cocoInputValue(line, cocoPaintInputLine(line, saved, true), true), answer + ' ', 'editing a sibling line preserves this draft');
  }
});
