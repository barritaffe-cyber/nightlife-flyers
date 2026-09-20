import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';

// One isolated guest context covers artwork, real exports, controls and roundtrip.
// Full run: NF_GIRL_CODE_ROSE_EXPORT_ACCESS_FIXTURE=1 node scripts/verify-girl-code-rose.mjs
// Artwork iteration: NF_GIRL_CODE_ROSE_CONTROLS_CHECK=0 NF_GIRL_CODE_ROSE_EXPORT_CHECK=0 ...
// Use NF_GIRL_CODE_ROSE_FORMATS=square or story for a focused artwork iteration.
const out = process.env.NF_GIRL_CODE_ROSE_AUDIT_DIR || '/tmp/girl-code-rose';
const projectPath = process.env.NF_GIRL_CODE_ROSE_IMPORT || 'public/generated-flyers/girl-code-rose.nflyer';
const baseUrl = process.env.NF_BASE_URL || 'http://localhost:3000';
const runControls = process.env.NF_GIRL_CODE_ROSE_CONTROLS_CHECK !== '0';
const runExports = process.env.NF_GIRL_CODE_ROSE_EXPORT_CHECK !== '0';
const runOriginalExports = runExports && process.env.NF_GIRL_CODE_ROSE_ORIGINAL_EXPORT_CHECK !== '0';
const formats = (process.env.NF_GIRL_CODE_ROSE_FORMATS || 'square,story').split(',');
assert.ok(formats.length && formats.every(format => ['square', 'story'].includes(format)));
const source = JSON.parse(await readFile(projectPath, 'utf8'));
const sourceState = source.state ?? source;
const initialIds = ['presenter','headline','subtitle','mood','motto','day','month','date','time','endTime','tagline','djLabel','dj1','dj2','dj3','genres','venue','venueCaption','address','contactLabel','contact'];
const initialMaps = Object.fromEntries(['square', 'story'].map(format => {
  const system = sourceState.session[format].cocoCompositionSystem;
  return [format, Object.fromEntries(system.compiledDocument.objects.filter(object => object.kind === 'text')
    .map(object => [object.id, system.compiledObjectOverrides?.[object.id]?.text ?? object.text ?? '']))];
}));
for (const format of formats) {
  assert.deepEqual(Object.keys(initialMaps[format]).sort(), [...initialIds, 'detailsLabel'].sort(), `${format}: expected independent text owners`);
}
await mkdir(out, {recursive: true});
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({viewport: {width: 1500, height: 1200}, deviceScaleFactor: 2, serviceWorkers: 'block'});
await context.addInitScript(() => {
  for (const key of ['nf:pwa-install-ack:v1', 'nf:onboarded:v1', 'nf:saveNoticeDismissed', 'nightlife-flyers:coco-dismissed:v2', 'nightlife-flyers:coco-seen:v1']) localStorage.setItem(key, '1');
  sessionStorage.setItem('nightlife-flyers:coco-startup-intro:v1', '1');
});
const page = await context.newPage();
const errors = [];
const report = {projectPath, formats, originals: [], selections: [], labels: [], exports: [], roundtrip: [], errors};
if (process.env.NF_GIRL_CODE_ROSE_EXPORT_ACCESS_FIXTURE === '1') {
  // Local responses isolate renderer QA from guest account quota. This does not
  // change application entitlements or consume real quota; PNGs use the real UI.
  await page.route('**/api/auth/starter-render', route => route.fulfill({json: {ok: true, limit: 2, used: 0, remaining: 2, blocked: false}}));
  report.exportAccessFixture = 'Local starter-render response only; real export renderer under test.';
  console.log('EXPORT ACCESS FIXTURE: local responses only; real renderer and PNG files remain under test');
}
page.on('pageerror', error => errors.push(error.message));
page.on('dialog', dialog => dialog.accept());
const board = page.locator('#artboard');
const owner = id => board.locator(`[data-coco-compiled-object="${id}"]`);
const textMap = () => board.locator('[data-coco-text-value]').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.dataset.cocoCompiledObject, node.dataset.cocoTextValue])));
const waitValue = (id, value) => page.waitForFunction(({id, value}) => document.querySelector(`#artboard [data-coco-compiled-object="${id}"]`)?.getAttribute('data-coco-text-value') === value, {id, value});

async function ready(format, expectedMap) {
  await page.getByRole('button', {name: format === 'square' ? 'Square' : 'Story', exact: true}).click();
  await page.locator('[aria-label="Preparing flyer canvas"]').waitFor({state: 'hidden', timeout: 120000});
  await page.evaluate(() => document.fonts.ready);
  // Require a stable canvas geometry and content across the format transition.
  await page.waitForFunction(({format, expectedMap}) => {
    const root = document.querySelector('#artboard');
    const bounds = root?.getBoundingClientRect();
    const current = root && Object.fromEntries([...root.querySelectorAll('[data-coco-text-value]')].map(node => [node.dataset.cocoCompiledObject, node.dataset.cocoTextValue]));
    const complete = bounds && (format === 'square' ? Math.abs(bounds.height / bounds.width - 1) < .01 : Math.abs(bounds.height / bounds.width - 16 / 9) < .01)
      && Object.entries(expectedMap).every(([id, value]) => current[id] === value)
      && Object.keys(current).length === Object.keys(expectedMap).length
      && [...root.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0)
      && ![...document.querySelectorAll('[aria-label="Preparing flyer canvas"]')].some(node => node.getClientRects().length)
      && document.fonts.status === 'loaded';
    const signature = complete ? JSON.stringify([format, bounds.x, bounds.y, bounds.width, bounds.height, current]) : '';
    if (!signature || window.__girlCodeReadySignature !== signature) {
      window.__girlCodeReadySignature = signature;
      window.__girlCodeReadyAt = performance.now();
      return false;
    }
    return performance.now() - window.__girlCodeReadyAt > 1800;
  }, {format, expectedMap}, {timeout: 120000});
  assert.deepEqual(await textMap(), expectedMap, `${format}: loaded wording`);
}

async function capture(name, publishFormat) {
  await board.scrollIntoViewIfNeeded();
  // Hide application chrome only for capture, including selection handles. Keep
  // controls intact for subsequent actual clicks and edits in this same context.
  const captureStyle = await page.addStyleTag({content: '#artboard button,#artboard [data-nonexport],#artboard [data-nonexport] *,[data-floating-controls]{visibility:hidden!important} #artboard,#artboard [data-coco-compiled-active="true"]{border-radius:0!important}'});
  const ancestorStyles = await board.evaluate(node => {
    const styles = [];
    for (let parent = node; parent; parent = parent.parentElement) {
      styles.push(parent.style.borderRadius);
      parent.style.borderRadius = '0';
    }
    return styles;
  });
  await board.screenshot({path: `${out}/${name}.png`, animations: 'disabled'});
  if (publishFormat && process.env.NF_GIRL_CODE_ROSE_PUBLISH_PREVIEWS === '1') {
    await board.screenshot({path: `public/generated-flyers/girl-code-rose-${publishFormat}-preview.png`, animations: 'disabled'});
  }
  await board.evaluate((node, styles) => {
    let index = 0;
    for (let parent = node; parent; parent = parent.parentElement) parent.style.borderRadius = styles[index++];
  }, ancestorStyles);
  await captureStyle.evaluate(node => node.remove());
  console.log('ARTWORK READY FOR VISUAL REVIEW', name);
}

async function exportPng(format, stage) {
  const masterGrade = page.getByRole('button', {name: 'Master Grade', exact: true});
  if (await masterGrade.isVisible()) await masterGrade.click();
  const saveNotice = page.getByRole('button', {name: 'Dismiss save notice', exact: true});
  if (await saveNotice.isVisible()) await saveNotice.click();
  await page.getByRole('button', {name: 'PNG', exact: true}).click();
  assert.equal(await page.getByRole('button', {name: 'PNG', exact: true}).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', {name: '4x', exact: true}).click();
  assert.equal(await page.getByRole('button', {name: '4x', exact: true}).getAttribute('aria-pressed'), 'true');
  const exportButton = page.getByRole('button', {name: 'Export', exact: true});
  assert.equal(await exportButton.isDisabled(), false, 'Export QA requires export access (or the isolated quota response fixture)');
  await exportButton.click();
  const preview = page.getByAltText('Export preview', {exact: true});
  await preview.waitFor({timeout: 180000});
  const artifact = await preview.evaluate(async img => {
    await img.decode();
    const blob = await (await fetch(img.src)).blob();
    return {width: img.naturalWidth, height: img.naturalHeight, type: blob.type, bytes: Array.from(new Uint8Array(await blob.arrayBuffer()))};
  });
  assert.equal(artifact.type, 'image/png');
  assert.equal(artifact.width, 2160, 'Master Grade PNG width');
  assert.equal(artifact.height, format === 'square' ? 2160 : 3840);
  const path = `${out}/export-${stage}-${format}.png`;
  await writeFile(path, Buffer.from(artifact.bytes));
  report.exports.push({format, stage, path, width: artifact.width, height: artifact.height});
  await page.getByRole('button', {name: 'Close export', exact: true}).click();
  console.log('EXPORT READY FOR VISUAL REVIEW', stage, format, artifact.width, artifact.height);
}

async function selectText(id) {
  const target = owner(id);
  await target.scrollIntoViewIfNeeded();
  const bounds = await board.boundingBox();
  await page.mouse.click(bounds.x + 2, bounds.y + bounds.height - 2);
  // Click an exposed glyph hit surface, not a hidden owner box or a DOM handler.
  const points = await target.evaluate(element => [...element.querySelectorAll('[data-text-hit-surface="true"]')].flatMap(surface => {
    const bounds = surface.getBoundingClientRect();
    return [.3, .5, .7].flatMap(y => [.3, .5, .7].map(x => ({x: bounds.x + bounds.width * x, y: bounds.y + bounds.height * y})));
  }).filter(point => document.elementFromPoint(point.x, point.y)?.closest('[data-coco-compiled-object]') === element));
  for (const point of points) {
    await page.mouse.click(point.x, point.y);
    if (await target.getAttribute('data-active') === 'true') break;
  }
  assert.equal(await target.getAttribute('data-active'), 'true', `${id}: selection through visible type`);
}

async function selectedInput(id, value) {
  const inputs = page.locator('textarea:visible,input:not([type=range]):not([type=file]):visible');
  const matches = await inputs.evaluateAll((nodes, value) => nodes.flatMap((node, index) => node.value === value ? [index] : []), value);
  assert.equal(matches.length, 1, `${id}: one visible input for selected wording`);
  return inputs.nth(matches[0]);
}

async function editAndCheck(id, input, value) {
  const before = await textMap();
  await input.fill(value);
  await waitValue(id, value);
  const after = await textMap();
  for (const [siblingId, text] of Object.entries(before)) {
    assert.equal(after[siblingId], siblingId === id ? value : text, `${id}: preserves independent sibling ${siblingId}`);
  }
}

const debugTimer = process.env.NF_DEBUG ? setInterval(async () => {
  try {
    console.log('STATE', await page.evaluate(() => ({headline: document.querySelector('#artboard [data-coco-compiled-object="headline"]')?.getAttribute('data-coco-text-value'), count: document.querySelectorAll('#artboard [data-coco-text-value]').length, loading: document.querySelector('[aria-label="Preparing flyer canvas"]')?.textContent, startup: Boolean(document.querySelector('.nf-startup-shell')), fonts: document.fonts.status})));
  } catch { /* Page may be closing. */ }
}, 15000) : undefined;

try {
  await page.goto(`${baseUrl}/?guest=1&test=ladies-night&format=square`, {waitUntil: 'domcontentloaded', timeout: 120000});
  await page.getByRole('button', {name: 'Miami Nights — Sunset Sessions Miami Nights — Sunset Sessions Start', exact: true}).click({timeout: 120000});
  await page.locator('.nf-startup-shell').waitFor({state: 'hidden', timeout: 120000});
  await board.waitFor({timeout: 120000});
  const moreTools=page.getByRole('button',{name:'More tools',exact:true}).first();
  if(await moreTools.isVisible())await moreTools.click();
  const projectButton = page.getByRole('button', {name: '▸ Project', exact: true});
  if (await projectButton.count()) await projectButton.click();
  await page.locator('input[type=file]').setInputFiles(projectPath);
  await waitValue('headline', initialMaps.square.headline);
  console.log('IMPORTED', projectPath);
  if (runOriginalExports) await page.getByRole('button', {name: 'Master Grade', exact: true}).click();

  for (const format of formats) {
    await ready(format, initialMaps[format]);
    const font = await owner('headline').evaluate(element => getComputedStyle(element).fontFamily);
    assert.match(font, /Rose Chrome Serif PNG/, 'GIRL uses the supplied glyph font');
    await writeFile(`${out}/editor-${format}.json`, JSON.stringify(await textMap(), null, 2));
    await capture(`editor-${format}`, format);
    report.originals.push({format, textOwners: Object.keys(initialMaps[format]).length, font});
    if (runOriginalExports) await exportPng(format, 'original');
  }

  if (runControls) {
    const backToDesign = page.getByRole('button', {name: 'Back to Design', exact: true});
    if (await backToDesign.isVisible()) await backToDesign.click();
    const editedMaps = {};
    for (const format of formats) {
      await ready(format, initialMaps[format]);
      const checkObjects=process.env.NF_GIRL_CODE_ROSE_CHECK_OBJECTS?.split(',');
      for (const id of initialIds.filter(id=>!checkObjects||checkObjects.includes(id))) {
        await selectText(id);
        const before = await textMap();
        const input = await selectedInput(id, before[id]);
        const value = id === 'headline' ? 'SILK' : id === 'subtitle' ? 'Vibe' : id === 'date' ? '25' : `${before[id]}!`;
        await editAndCheck(id, input, value);
        await editAndCheck(id, input, before[id]);
        if (['djLabel', 'contactLabel'].includes(id)) {
          await editAndCheck(id, input, '');
          await editAndCheck(id, input, before[id]);
          report.labels.push({format, id, clearedAndRetyped: true});
        }
        if (id === 'venue') await editAndCheck(id, input, format === 'square' ? 'CLUB NOVA' : 'CLUB EMBER');
        if (id === 'djLabel') await editAndCheck(id, input, 'SOUNDS BY');
        report.selections.push({format, id, editedAndRestored: true});
        console.log('EDITABLE', format, id);
      }
      await selectText('genres');
      const detailsInput = page.getByPlaceholder('EVENT DETAILS', {exact: true});
      for (const value of ['DETAILS', '', 'DETAILS']) await editAndCheck('detailsLabel', detailsInput, value);
      await selectText('detailsLabel');
      report.labels.push({format, id: 'detailsLabel', clearedAndRetyped: true, visibleSelection: true});

      for (const [id, panel] of [['headline', 'headline'], ['subtitle', 'head2']]) {
        await selectText(id);
        const shadow = page.locator(`#${panel}-panel`).getByRole('button', {name: 'Shadow', exact: true});
        const desired = format === 'square' ? 'true' : 'false';
        if (await shadow.getAttribute('aria-pressed') !== desired) await shadow.click();
        assert.equal(await shadow.getAttribute('aria-pressed'), desired, `${format}/${id}: independent shadow state`);
      }
      editedMaps[format] = await textMap();
      await ready(format, editedMaps[format]);
      await capture(`edited-${format}`);
    }
    for (const format of [...formats, formats[0]]) await ready(format, editedMaps[format]);
    const saveButton = page.getByRole('button', {name: 'Save Project File', exact: true});
    if (!await saveButton.isVisible()) await projectButton.click();
    const download = page.waitForEvent('download');
    await saveButton.click();
    const savedPath = `${out}/roundtrip.nflyer`;
    await (await download).saveAs(savedPath);
    const saved = JSON.parse(await readFile(savedPath, 'utf8'));
    for (const format of formats) {
      const savedFormat = (saved.state ?? saved).session[format];
      assert.equal(savedFormat.headShadow, format === 'square', `${format}: saved headline shadow`);
      assert.equal(savedFormat.head2Shadow, format === 'square', `${format}: saved subtitle shadow`);
    }
    await page.locator('input[type=file][accept*=json]').setInputFiles(savedPath);
    for (const format of formats) {
      if (await backToDesign.isVisible()) await backToDesign.click();
      await ready(format, editedMaps[format]);
      for (const [id, panel] of [['headline', 'headline'], ['subtitle', 'head2']]) {
        await selectText(id);
        assert.equal(await page.locator(`#${panel}-panel`).getByRole('button', {name: 'Shadow', exact: true}).getAttribute('aria-pressed'), format === 'square' ? 'true' : 'false', `${format}/${id}: reopened shadow`);
      }
      await capture(`reopened-${format}`);
      if (runExports) await exportPng(format, 'reopened');
      report.roundtrip.push({format, textOwners: Object.keys(editedMaps[format]).length, shadow: format === 'square'});
    }
  }
  assert.deepEqual(errors, [], 'No browser page errors');
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  console.log('PASS', JSON.stringify({formats, originalRenders: report.originals.length, visibleEdits: report.selections.length, labelChecks: report.labels.length, exports: report.exports.length, roundtrip: report.roundtrip.length, errors}));
} catch (error) {
  report.failure = error.stack ?? String(error);
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  await page.screenshot({path: `${out}/failure.png`, fullPage: true}).catch(() => {});
  console.log((await page.locator('body').ariaSnapshot()).slice(0, 14000));
  throw error;
} finally {
  clearInterval(debugTimer);
  await browser.close();
}
