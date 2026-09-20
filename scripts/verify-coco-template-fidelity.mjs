import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { verifyCocoFineTuneText } from './verify-coco-fine-tune-text.mjs';
const eventName = process.env.NF_COCO_EVENT_NAME || (process.env.NF_COCO_PORTRAIT ? 'Reggae Jams' : 'City Nights');
const theme = process.env.NF_COCO_THEME || (process.env.NF_COCO_PORTRAIT ? 'Reggae / Dancehall' : 'Urban');
const auditDir = process.env.NF_COCO_AUDIT_DIR;
if (auditDir) await mkdir(auditDir, { recursive: true });
const artifactPath = name => `${auditDir || '/tmp'}/${name}`;
const recipeId = process.env.NF_COCO_RECIPE || (process.env.NF_COCO_PORTRAIT ? 'reggae-jams' : 'city-nights');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 1200 }, acceptDownloads: true, serviceWorkers: 'block' });
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2', 'nightlife-flyers:coco-seen:v1']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('dialog', d => d.accept());
await page.route('**/api/coco-copy', r => r.fulfill({ json: { copy: { headline: eventName } } }));
await page.route('**/api/coco-style', r => r.fulfill({ json: {} }));
try {
  await page.goto(`${process.env.NF_BASE_URL || 'http://localhost:3001'}/?guest=1`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('button').filter({ hasText: 'Create with Coco' }).click({ timeout: 120000 });
  assert.equal(await page.getByTestId('coco-composer-fields').count(), 0, 'no unsupported upfront brief');
  await page.getByLabel('Event name', { exact: true }).fill(eventName);
  assert.equal(await page.getByTestId('coco-build-event-next').isEnabled(), false, 'theme is required');
  assert.equal(await page.getByRole('button', { name: 'Let Coco choose', exact: true }).count(), 0);
  assert.equal(await page.getByTestId('coco-composer-event-description').count(), 0);
  await page.getByRole('button', { name: theme, exact: true }).click();
  await page.getByTestId('coco-build-event-next').click();
  await page.getByRole('button', { name: 'Yes, include a portrait', exact: true }).click();
  assert.equal(await page.getByTestId('coco-build-images-next').isEnabled(), false);
  await page.getByTestId('coco-composer-portrait-upload').setInputFiles(process.env.NF_COCO_PORTRAIT_FILE || 'public/dj-templates/club01/subject.png');
  assert.equal(await page.getByTestId('coco-build-images-next').isEnabled(), true);
  if (!process.env.NF_COCO_PORTRAIT) {
    await page.getByRole('button', { name: 'No portrait', exact: true }).click();
    assert.equal(await page.getByTestId('coco-composer-portrait-upload').count(), 0);
  }
  if (!process.env.NF_COCO_SKIP_BACKGROUND) await page.getByTestId('coco-composer-image-upload').setInputFiles('public/generated-flyers/assets/city-nights-background.jpg');
  await page.getByTestId('coco-build-images-next').click();
  const chooser = page.getByTestId('coco-direction-chooser');
  await chooser.waitFor({ timeout: 180000 });
  const choiceCount = await chooser.locator('[data-coco-direction-id]').count();
  assert.ok(choiceCount >= 1 && choiceCount <= 5, `expected 1–5 matching choices, got ${choiceCount}`);
  console.log('Matching choices:', await chooser.locator('[data-coco-direction-id]').evaluateAll(nodes => nodes.map(n => n.dataset.cocoDirectionId))); 
  if (!process.env.NF_COCO_PORTRAIT && !process.env.NF_COCO_EVENT_NAME) assert.equal(await chooser.locator('[data-coco-direction-id]').first().getAttribute('data-coco-direction-id'), 'city-nights', 'event keywords rank the exact match first');
  assert.equal(await chooser.locator('[data-coco-personalized-preview]').count(), choiceCount * 2);
  assert.equal(await chooser.locator('[data-coco-recipe-preview]').count(), 0);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-coco-personalized-preview]')].every(node => node.dataset.previewReady === 'true'), null, { timeout: 120000 });
  if (process.env.NF_COCO_MORE_CHECK) {
    assert.equal(await chooser.locator('[data-coco-direction-id]').first().getAttribute('data-coco-direction-id'), 'glow-in-the-dark');
    const firstIds = await chooser.locator('[data-coco-direction-id]').evaluateAll(nodes => nodes.map(n => n.dataset.cocoDirectionId));
    let pages = 0;
    while (await chooser.getByTestId('coco-more-directions').count()) {
      assert.ok(pages++ < 12, 'show more must exhaust its queue');
      await chooser.getByTestId('coco-more-directions').click();
      await page.waitForFunction(() => { const b = document.querySelector('[data-testid="coco-more-directions"]'); return !b || !b.disabled; }, null, { timeout: 180000 });
    }
    await page.waitForFunction(() => [...document.querySelectorAll('[data-coco-personalized-preview]')].every(node => node.dataset.previewReady === 'true'), null, { timeout: 120000 });
    const allIds = await chooser.locator('[data-coco-direction-id]').evaluateAll(nodes => nodes.map(n => n.dataset.cocoDirectionId));
    assert.ok(allIds.length > firstIds.length, 'remaining matches must be reachable');
    assert.equal(new Set(allIds).size, allIds.length);
    assert.deepEqual(allIds.slice(0, firstIds.length), firstIds, 'loading more keeps the original directions');
    console.log('All matching directions after Show more:', allIds);
  }
  for (const preview of await chooser.locator('[data-coco-personalized-preview]').all()) {
    const copy = await preview.locator('[data-coco-text-value]').evaluateAll(nodes => nodes.map(node => node.dataset.cocoTextValue).join(''));
    assert.ok(copy.replace(/\s/g, '').toLowerCase().includes(eventName.replace(/\s/g, '').toLowerCase()));
    assert.equal(await preview.locator('[data-nonexport]').count(), 0);
  }
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[data-testid="coco-direction-chooser"]');
    return dialog && getComputedStyle(dialog.parentElement).opacity === '1';
  });
  assert.equal(await chooser.getByRole('img', { name: /generated flyer preview/ }).count(), 0);
  await page.screenshot({ path: artifactPath('coco-template-choices.png'), fullPage: true });
  if (process.env.NF_COCO_CHOICES_ONLY) {
    assert.deepEqual(errors, []);
    console.log(`PASS: ${theme} builds ${choiceCount} matching Square/Story pairs`);
  } else if (process.env.NF_COCO_PORTRAIT && !auditDir) {
    const sources = [];
    for (const preview of await chooser.locator('[data-coco-personalized-preview]').all()) {
      const portrait = preview.locator('[data-coco-subject="true"] img').first();
      assert.equal(await portrait.count(), 1, 'each direction/format renders the selected portrait');
      sources.push(await portrait.getAttribute('src'));
    }
    assert.equal(new Set(sources).size, 1, 'matching directions use the same uploaded portrait');
    assert.match(sources[0], /^data:image\//);
    await page.screenshot({ path: '/tmp/coco-personalized-portraits.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: uploaded portrait appears in matching personalized Square/Story pairs');
    process.exitCode = 0;
  } else {
  const card = chooser.locator(`[data-coco-direction-id="${recipeId}"]`);
  assert.equal(await card.count(), 1);
  const previewTypography = {};
  const previewLayers = {};
  const previewText = {};
  const layerStyles = nodes => Object.fromEntries(nodes.map(node => {
    const style=getComputedStyle(node);
    return [node.dataset.cocoCompiledObject, Object.fromEntries(['left','top','width','fontFamily','fontSize','lineHeight','letterSpacing','textTransform','transform','opacity','mixBlendMode'].map(key=>[key,style[key]]))];
  }));
  for (const format of ['square', 'story']) {
    previewText[format] = await card.locator(`[data-coco-preview-artboard="${format}"] [data-coco-text-value]`).evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.dataset.cocoCompiledObject,n.dataset.cocoTextValue])));
    previewLayers[format] = await card.locator(`[data-coco-preview-artboard="${format}"] [data-coco-compiled-object]`).evaluateAll(layerStyles);
    previewTypography[format] = await card.locator(`[data-coco-personalized-preview="${format}"] [data-coco-compiled-role="headline"]`).evaluate(node => {
      const s = getComputedStyle(node);
      return { fontFamily: s.fontFamily, fontSize: s.fontSize, letterSpacing: s.letterSpacing, lineHeight: s.lineHeight, transform: s.transform };
    });
  }
  if (auditDir) for (const format of ['square', 'story']) {
    const preview = card.locator(`[data-coco-personalized-preview="${format}"]`);
    const originalStyle = await preview.getAttribute('style');
    await preview.evaluate((node, format) => { node.style.cssText = `position:fixed;top:0;left:0;width:540px;height:${format==='square'?540:960}px;z-index:99999;border:0;`; },format);
    await page.waitForFunction(({format,recipeId}) => getComputedStyle(document.querySelector(`[data-coco-direction-id="${recipeId}"] [data-coco-preview-artboard="${format}"]`)).transform === 'matrix(1, 0, 0, 1, 0, 0)',{format,recipeId});
    await card.locator(`[data-coco-preview-artboard="${format}"]`).screenshot({ path: `${auditDir}/preview-${format}.png` });
    await preview.evaluate((node, style) => style ? node.setAttribute('style',style) : node.removeAttribute('style'),originalStyle);
  }
  await card.getByRole('button', { name: 'Choose this direction', exact: true }).click();
  const form = page.getByTestId('coco-build-details');
  await form.waitFor({ timeout: 120000 });
  await form.locator('details').evaluateAll(nodes => nodes.forEach(n => n.open = true));
  if (recipeId === 'pulse') {
    const expected = {mainPromotion:['offer','ENJOY 15% OFF'],eventDetails:['details','ON ALL MENU ITEMS'],rsvpContact:['rsvp','FOR RESERVATIONS : +971 50 836 2445'],address:['address','CONCORDE CREEK VIEW HOTEL, GROUND FLOOR, AL SEEF, ABRA, BUR DUBAI'],entryRestrictions:['terms','* T & C APPLY']};
    assert.equal(await form.getByTestId('coco-build-brief-subtitle').count(), 0, 'terms are not a subtitle');
    for (const [key,[id,saved]] of Object.entries(expected)) {
      const field = form.getByTestId(`coco-build-brief-${key}`);
      assert.equal(await field.getAttribute('maxlength'), String(saved.length + 10));
      assert.notEqual(await field.getAttribute('placeholder'), saved, 'guidance must not quote the recipe copy');
      assert.deepEqual(JSON.parse(await field.getAttribute('data-coco-target-objects')), {square:[id],story:[id]});
    }
    assert.equal(await form.getByText('Enter the phone number or contact guests should use to reserve.', {exact:true}).count(), 1);
    assert.equal(await form.getByText(/In this design:|Square wording:|Story wording:/).count(), 0);
  }
  if (recipeId === 'glow-in-the-dark') {
    assert.equal(await form.getByTestId('coco-build-brief-recipe:connector').count(), 0);
    assert.equal(await form.getByTestId('coco-build-brief-bottleSpecials').count(), 0);
    assert.equal(await form.getByTestId('coco-build-brief-musicPolicy').count(), 0);
  }
  if (['beat-therapy','bad-girls'].includes(recipeId)) {
    const source = JSON.parse(await readFile('lib/template-data/registered-recipes.json', 'utf8')).find(r => r.recipeId === recipeId);
    const expected = {
      presenterName:['presenter'], eventDetails:['mood'], date:['day','month','date'], startTime:['time'],
      musicPolicy:['genres'], subtitle:['tagline'], djs:['dj1','dj2'], drinkSpecials:['cocktails'],
      'recipe:tables':['tables'], dressCode:['dressCode'], venueName:['venue'], address:['address'],
      entryFee:['entry'], rsvpContact:['contact'], 'recipe:motto':['motto'],
    };
    if(recipeId==='bad-girls') Object.assign(expected, {'recipe:only':['only'],ageRequirement:['age']});
    const offeredKeys = await form.locator('input[data-testid],textarea[data-testid]').evaluateAll(nodes => nodes.map(n => n.dataset.testid.replace('coco-build-brief-','')));
    assert.deepEqual([...offeredKeys].sort(), Object.keys(expected).sort(), 'only recipe-supported fields appear');
    for (const [field,ids] of Object.entries(expected)) {
      const input = form.getByTestId(`coco-build-brief-${field}`);
      assert.deepEqual(JSON.parse(await input.getAttribute('data-coco-target-objects')), {square:ids,story:ids}, `${field} targets the exact saved objects`);
      for (const format of ['square','story']) {
        const doc=source.formats[format].cocoCompositionSystem.compiledDocument;
        const wording=ids.map(id=>doc.objects.find(o=>o.id===id).text).join(field==='date'?' ':'\n');
        assert.equal(await input.getAttribute('maxlength'), String(wording.length+10), `${format}/${field}: saved wording plus ten`);
        assert.notEqual(await input.getAttribute('placeholder'), wording, 'guidance explains the field instead of quoting saved text');
      }
    }
    console.log(`PASS: all ${Object.keys(expected).length} ${recipeId} fields bind exact objects and use saved wording + 10`);
  }
  if (!auditDir) for (const field of ['hosts', 'bookingContact', 'email', 'qrDestination', 'drinkSpecials', 'responsibleDrinking']) assert.equal(await page.getByTestId(`coco-build-brief-${field}`).count(), 0, `${field} has no dedicated template slot`);
  if (process.env.NF_COCO_SCOPED_FIELDS) {
    const storyField = recipeId === 'reggae-jams' ? 'dressCode' : 'eventDetails';
    assert.equal(await form.locator('[data-coco-field-scope="story"]').getByTestId(`coco-build-brief-${storyField}`).count(), 1);
    assert.equal(await form.getByTestId(`coco-build-brief-${storyField}`).getAttribute('data-coco-field-formats'), 'story');
    const masters = JSON.parse(await readFile('lib/template-data/registered-recipes.json', 'utf8')).find(r => r.recipeId === recipeId);
    const original = masters.formats.story.cocoCompositionSystem.compiledDocument.objects.find(o => o.id === 'presenter').text;
    assert.equal(await form.getByTestId('coco-build-brief-presenterName').getAttribute('maxlength'), String(original.length + 10));
  }
  const facts = { presenterName: 'Nightlife Flyers', date: 'Dec 1 2026', startTime: '10 PM', venueName: 'The Loft', address: '35 Francis Isabella Road', djs: 'DJ Flip\nDJ Flop', mainPromotion: 'Good music' };
  if (auditDir) {
    const offered = await form.locator('input[data-testid],textarea[data-testid]').evaluateAll(nodes => nodes.map(n => ({key:n.dataset.testid.replace('coco-build-brief-',''),max:n.maxLength})));
    const sample = { entryRestrictions:'GUESTS 21+ ONLY', presenterName:'Nightlife Flyers', date:'Dec 1 2026', startTime:'10PM', endTime:'4AM', venueName:'The Loft', address:'35 Francis Isabella Rd', djs:'DJ Flip\nDJ Flop', hosts:'MC Hype\nMC Prince', musicPolicy:'Hip Hop • R&B', mainPromotion:'The\nHottest\nNight\nIn The\nCity', ageRequirement:'21+\nEvent', rsvpContact:'8765333715', dressCode:'White on jeans', eventDetails:'Great music • Good people', qrDestination:'https://example.com/event', qrLabel:'Scan here', subtitle:'After Dark' };
    if (recipeId === 'bad-girls') Object.assign(sample, {presenterName:'Nova Events',eventDetails:'Music\nFriends\nStyle\nGood\nVibes',date:'Nov 7 2026',startTime:'9PM\nTill late',musicPolicy:'Afrobeats\nHip Hop\nR&B\nAmapiano\nDancehall\nSoul',subtitle:'Sweet\nMusic','recipe:only':'Always','recipe:motto':'New\nEnergy\nHigher\nLevel',drinkSpecials:'Cocktail\nHappy Hour','recipe:tables':'VIP Booths\nAvailable',dressCode:'Dress Code:\nSmart & Bold',ageRequirement:'21+ Only',venueName:'Club Aurora',address:'123 Ocean Drive, Miami',entryFee:'Tickets $30',rsvpContact:'RSVP 555 123 4567'});
    if (recipeId === 'black-tie') Object.assign(sample, {eventDetails:'NEW\nCITY\nSAME\nCLASS','recipe:invitation':'JOIN US','recipe:details':'MUSIC AND\nGOOD COMPANY'});
    if (recipeId === 'beat-therapy') Object.assign(sample, {
      presenterName:'Nova Events Presents',eventDetails:'Music\nFriends\nCocktails\nVibes',date:'Nov 7 2026',startTime:'9PM\nTill late',
      musicPolicy:'House\nTech House\nAfro House\nMelodic\nDisco',subtitle:'Feel the beat. Find your people',
      djs:'DJ Nova\nDJ Orbit',drinkSpecials:'Cocktail\nHappy Hour','recipe:tables':'VIP Seating\nAvailable',
      dressCode:'Dress Code\nSmart & Stylish',venueName:'Club Aurora',address:'123 Ocean Drive, Miami',
      entryFee:'Tickets $30',rsvpContact:'R.S.V.P 555 123 4567','recipe:motto':'Let\nThe Rhythm\nMove You',
    });
    if (recipeId === 'glow-in-the-dark') Object.assign(sample, {'recipe:rail':'Music\nDrinks\nGood\nPeople',eventDetails:'Good\nMusic\nGreat\nPeople',dressCode:'Wear white'});
    for (const key of Object.keys(facts)) delete facts[key];
    for (const {key,max} of offered) { assert.ok(sample[key], `Add realistic sample for ${key}`); const value = ['beat-therapy','bad-girls'].includes(recipeId) ? sample[key] : recipeId === 'pulse' ? ({mainPromotion:'SAVE 20% TODAY',eventDetails:'ON FOOD AND DRINKS',rsvpContact:'RESERVE: 555 123 4567',address:'123 OCEAN DRIVE, MIAMI'}[key] ?? sample[key]) : process.env.NF_COCO_EVENT_NAME ? ({presenterName:'Club',venueName:'Loft',address:'West Ave',djs:'DJ Flip',musicPolicy:'R&B',mainPromotion:'Free entry',ageRequirement:'21+',subtitle:'After Dark'}[key] ?? sample[key]) : process.env.NF_COCO_PORTRAIT ? ({presenterName:'Nightlife',address:'Kingston',startTime:'7PM'}[key] ?? sample[key]) : sample[key]; assert.ok(max<0 || value.length<=max, `${key} sample exceeds form capacity`); facts[key] = value; }
    await writeFile(`${auditDir}/form-values.json`,JSON.stringify(facts,null,2));
  }
  if (process.env.NF_COCO_CASE_CHECK) {
    Object.assign(facts, { presenterName:'nOVA eVENTS', venueName:'oCEAN lOUNGE', djs:'dJ fLIP\nDj fLOP', startTime:'9pm' });
    await writeFile(`${auditDir}/form-values.json`, JSON.stringify(facts, null, 2));
  }
  for (const [key, value] of Object.entries(facts)) await page.getByTestId(`coco-build-brief-${key}`).fill(value);
  await form.screenshot({ path: artifactPath('coco-guided-details.png') });
  await form.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByTestId('coco-direction-chooser').locator(`[data-coco-direction-id="${recipeId}"]`).getByRole('button', { name: 'Choose this direction', exact: true }).click();
  for (const [key,value] of Object.entries(facts)) assert.equal(await page.getByTestId(`coco-build-brief-${key}`).inputValue(), value, 'Back preserves the draft');
  assert.equal(await page.getByTestId('coco-quick-brief-fields').count(), 0, 'editor waits for the completed brief');
  await page.getByTestId('coco-build-finish').click();
  await page.getByTestId('coco-quick-brief-fields').waitFor({ timeout: 120000 });
  if (recipeId === 'black-tie') {
    await page.getByTestId('coco-quick-brief-fields').locator('details').evaluateAll(nodes => nodes.forEach(n => n.open = true));
    await page.getByTestId('coco-quick-brief-recipe:invitation').fill('COME IN');
    facts['recipe:invitation'] = 'COME IN';
    assert.equal(await page.getByTestId('coco-quick-brief-eventDetails').inputValue(), facts.eventDetails, 'editing invitation preserves the separate mood line');
    if (auditDir) await writeFile(`${auditDir}/form-values.json`, JSON.stringify(facts, null, 2));
  }
  if (process.env.NF_COCO_SCOPED_FIELDS) {
    // A Story-only field remains editable even while Square is the active canvas.
    const key = recipeId === 'reggae-jams' ? 'dressCode' : 'eventDetails';
    const value = recipeId === 'reggae-jams' ? 'All white' : 'Good music and people';
    await page.getByTestId('coco-quick-brief-fields').locator('details').evaluateAll(nodes => nodes.forEach(n => n.open = true));
    const input = page.getByTestId(`coco-quick-brief-${key}`);
    assert.equal(await input.getAttribute('data-coco-field-formats'), 'story');
    await input.fill(value);
    facts[key] = value;
    if (auditDir) await writeFile(`${auditDir}/form-values.json`, JSON.stringify(facts, null, 2));
  }
  for (const format of ['story', 'square']) {
    await page.getByTestId(`coco-quick-format-${format}`).click();
    await page.waitForTimeout(1800);
    await page.getByText(`Preparing ${format} canvas.`, { exact: true }).waitFor({ state: 'hidden', timeout: 120000 });
    assert.equal(await page.locator('#artboard [data-coco-compiled-object^="coco-form-detail-"]').count(), 0);
    const editorTypography = await page.locator('#artboard [data-coco-compiled-role="headline"]').evaluate(node => {
      const s = getComputedStyle(node);
      return { fontFamily: s.fontFamily, fontSize: s.fontSize, letterSpacing: s.letterSpacing, lineHeight: s.lineHeight, transform: s.transform };
    });
    const canvasLayers = await page.locator('#artboard [data-coco-compiled-object]').evaluateAll(layerStyles);
    for (const [id,styles] of Object.entries(previewLayers[format])) { if(canvasLayers[id]) assert.deepEqual(canvasLayers[id],styles,`${format}/${id}: preview and canvas layer styles`); }
    assert.deepEqual(editorTypography, previewTypography[format], `${format}: preview and editor typography must match`);
    if (auditDir) {
      await page.locator('#artboard').screenshot({ path: `${auditDir}/canvas-${format}.png` });
      const masks = await page.locator('#artboard').evaluate((root, originalText) => {
        const frame=root.getBoundingClientRect();
        return [...root.querySelectorAll('[data-coco-text-value]')].filter(n=>n.dataset.cocoTextValue!==originalText[n.dataset.cocoCompiledObject]).map(n=>{
          const rect=n.getBoundingClientRect();return {x:(rect.x-frame.x)/frame.width*540-12,y:(rect.y-frame.y)/frame.width*540-12,width:rect.width/frame.width*540+24,height:rect.height/frame.width*540+24};
        });
      },previewText[format]);
      const height=format==='square'?540:960;
      const original=await sharp(`${auditDir}/preview-${format}.png`).resize(540,height).removeAlpha().raw().toBuffer();
      const actual=await sharp(`${auditDir}/canvas-${format}.png`).resize(540,height).removeAlpha().raw().toBuffer();
      let compared=0,matching=0,totalDelta=0;
      for(let y=28;y<height-8;y++)for(let x=8;x<532;x++){
        if(masks.some(m=>x>=m.x&&x<m.x+m.width&&y>=m.y&&y<m.y+m.height))continue;
        const offset=(y*540+x)*3;const delta=Math.max(...[0,1,2].map(c=>Math.abs(actual[offset+c]-original[offset+c])));
        compared++;if(delta<=24)matching++;totalDelta+=delta;
      }
      const result={comparedPixels:compared,matchingPixelsPercent:100*matching/compared,meanMaxChannelDifference:totalDelta/compared,changedTextMasks:masks.length,note:'Pixels in unchanged areas within 24/255 RGB tolerance; excludes changed text, shadows and editor edges. This is not a whole-design visual score.'};
      await writeFile(`${auditDir}/comparison-${format}.json`,JSON.stringify(result,null,2));
      console.log(format,result);
      assert.ok(result.matchingPixelsPercent>=90,`${format}: unchanged artwork must be at least 90% similar`);
      await writeFile(`${auditDir}/rendered-${format}.json`,JSON.stringify(await page.locator('#artboard [data-coco-text-value]').evaluateAll(nodes => nodes.map(n=>({id:n.dataset.cocoCompiledObject,text:n.dataset.cocoTextValue}))),null,2));
    }
    await page.locator('#artboard').screenshot({ path: artifactPath(`coco-template-${format}.png`) });
  }
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('coco-quick-save').click()]);
  const savedPath = artifactPath(auditDir ? 'result.nflyer' : 'coco-template-fidelity.nflyer');
  await download.saveAs(savedPath);
  const saved = JSON.parse(await readFile(savedPath, 'utf8'));
  const masters = JSON.parse(await readFile('lib/template-data/registered-recipes.json', 'utf8')).find(r => r.recipeId === recipeId);
  for (const format of ['square', 'story']) {
    const v = saved.state.session[format];
    for (const [key, value] of Object.entries(facts)) assert.equal(v.cocoEventBrief[key], value);
    assert.deepEqual(v.cocoFormMappingReport.unplacedFields, []);
    if (process.env.NF_COCO_CASE_CHECK) {
      const o = v.cocoCompositionSystem.compiledObjectOverrides;
      assert.equal(o.headline.text, 'City');
      assert.equal(o.headline2.text, 'Nights');
      assert.equal(o.venue.text, 'Ocean Lounge');
      assert.equal(o.presenter.text, 'Nova Events');
      assert.equal(o['dj-lineup'].text, 'DJ Flip\nDJ Flop');
      assert.equal(o.doors.text, 'Doors\nOpen\n9PM');
    }
    if (recipeId === 'pulse') for (const [field,id] of Object.entries({mainPromotion:'offer',eventDetails:'details',rsvpContact:'rsvp',address:'address',entryRestrictions:'terms'})) {
      assert.equal(v.cocoCompositionSystem.compiledObjectOverrides[id].text, facts[field]);
    }
    if (recipeId === 'black-tie') {
      const edits = v.cocoCompositionSystem.compiledObjectOverrides;
      assert.equal(edits.mood.text, facts.eventDetails);
      assert.equal(edits.invitation.text, facts['recipe:invitation']);
      assert.equal(edits.details.text, format === 'story' ? facts['recipe:details'] : '');
    }
    if (recipeId === 'glow-in-the-dark') {
      const edits = v.cocoCompositionSystem.compiledObjectOverrides;
      assert.equal(edits.headline.text, 'NEON');
      assert.equal(edits.subtitle.text, 'GLOW');
      assert.equal(edits.connector.text, '');
      assert.equal(edits.genres.text, 'WEAR WHITE');
      assert.equal(edits.bucket.text, 'Good\nMusic\nGreat\nPeople');
    }
    assert.equal(v.cocoDetailsPanelBox, null);
    if (process.env.NF_COCO_SCOPED_FIELDS) {
      const key = recipeId === 'reggae-jams' ? 'dressCode' : 'eventDetails';
      assert.deepEqual(v.cocoEventBrief.fieldFormats[key], ['story']);
      const owners = Object.values(v.cocoCompositionSystem.compiledObjectOverrides).filter(o => !o.removed && o.text && o.cocoFormFields?.includes(key));
      assert.equal(owners.length > 0, format === 'story', `${key} paints only on Story`);
    }
    if (auditDir) {
      const rendered=JSON.parse(await readFile(`${auditDir}/rendered-${format}.json`,'utf8'));
      for(const [id,edit] of Object.entries(v.cocoCompositionSystem.compiledObjectOverrides)) {
        if(edit.removed || !edit.text || !edit.cocoFormFields?.some(key=>facts[key])) continue;
        const visible=rendered.find(row=>row.id===id);
        assert.ok(visible,`${format}/${id}: mapped field must render on canvas`);
        assert.ok(visible.text.replace(/\s/g,'').toLowerCase().includes(edit.text.replace(/\s/g,'').toLowerCase()),`${format}/${id}: rendered copy must match the mapped value`);
      }
    }
    for (const original of masters.formats[format].cocoCompositionSystem.compiledDocument.objects.filter(o => o.kind === 'text')) {
      const actual = v.cocoCompositionSystem.compiledDocument.objects.find(o => o.id === original.id);
      assert.deepEqual(actual.bounds, original.bounds, `${format}/${original.id} must keep the authored position`);
      assert.equal(actual.typography.fontFamily, original.typography.fontFamily);
    }
  }
  if (process.env.NF_COCO_FINE_TUNE_CHECK) await verifyCocoFineTuneText(page, { saved, auditDir,
    cases: recipeId === 'bad-girls' ? [
      ['headline','NOVA'],['subtitle','GIRLS'],['presenter','NOVA EVENTS'],['mood','MUSIC\nDANCE\nFRIENDS\nSTYLE\nVIBES'],
      ['presents','PRESENTS'],['day','FRI'],['month','DEC'],['date','12'],['time','10PM\nTILL LATE'],['genres','HOUSE\nDISCO'],
      ['tagline','Great\nMusic'],['only','Always'],['lineupLabel','MUSIC BY'],['dj1','DJ VIBE'],['dj2','DJ WAVE'],
      ['cocktails','HAPPY\nHOUR'],['tables','VIP BOOTHS\nAVAILABLE'],['dressCode','SMART\nCASUAL'],['age','21+ ONLY'],
      ['venue','ROOM'],['address','EAST AVE'],['entry','TICKETS $20'],['contact','555 222 3333'],['motto','Feel\nThe\nGood\nMusic'],
    ] : recipeId === 'beat-therapy' ? [
      ['headline','NOVA'],['subtitle','RUSH'],['presenter','NOVA EVENTS'],['mood','MUSIC\nDANCE\nFRIENDS\nVIBES'],
      ['day','FRI'],['month','DEC'],['date','12'],['time','10PM\nTILL LATE'],['genres','HOUSE\nDISCO'],['tagline','FEEL THE RHYTHM'],
      ['dj1','DJ VIBE'],['dj2','DJ WAVE'],['cocktails','HAPPY\nHOUR'],['tables','VIP BOOTHS\nAVAILABLE'],
      ['dressCode','SMART\nCASUAL'],['venue','ROOM'],['address','EAST AVE'],['entry','TICKETS $20'],['contact','555 222 3333'],['motto','FEEL\nTHE\nMUSIC'],
    ] : undefined,
  });
  assert.deepEqual(errors, []);
  console.log('PASS: guided event → images → matching choices → supported details → finished Square/Story canvas');
  }
} catch (error) {
  await page.screenshot({ path: artifactPath('coco-template-fidelity-failure.png') });
  console.log((await page.locator('body').innerText()).slice(-1200));
  throw error;
} finally { await browser.close(); }
