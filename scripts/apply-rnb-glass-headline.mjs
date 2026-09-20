import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLASS_HEADLINE_EFFECT, GLASS_HEADLINE_FILL, GLASS_HEADLINE_FONT, glassHeadlineStyles } from '../lib/coco/glassHeadline.ts';

const path = 'public/generated-flyers/rnb-thursdays.nflyer';
const original = await readFile(path, 'utf8');
const hash = createHash('sha256').update(original).digest('hex');
await mkdir('recipe-file-backups', { recursive: true });
await writeFile(`recipe-file-backups/rnb-thursdays-before-glass-${hash.slice(0, 12)}.nflyer`, original, { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
const project = JSON.parse(original);
let headlines = 0;
function patch(value) {
  if (!value || typeof value !== 'object') return;
  if (value.cocoCompositionSystem?.compiledDocument?.id === 'rnb-thursdays') {
    value.headlineFamily = GLASS_HEADLINE_FONT;
    value.headTracking = -.07;
    value.lineHeight = .85;
    value.textFx = { ...value.textFx, tracking: -.07, gradient: true, compiledGradientEdited: false };
  }
  if (value.kind === 'text' && value.id === 'headline' && value.semanticRole === 'headline') {
    value.paint = { ...value.paint, textEffect: GLASS_HEADLINE_EFFECT,
      backgroundImage: GLASS_HEADLINE_FILL, backgroundClip: 'text', webkitBackgroundClip: 'text',
      strokeWidthPx: 0, textShadow: 'none', filter: 'none' };
    value.typography = { ...value.typography, fontFamily: GLASS_HEADLINE_FONT, fontWeight: '700',
      lineHeight: .85, letterSpacingEm: -.07 };
    value.binding.initial = { ...value.binding.initial, family: GLASS_HEADLINE_FONT, lineHeight: .85, tracking: -.07 };
    for (const run of value.textRuns || []) {
      run.fontFamily = GLASS_HEADLINE_FONT; run.runtimeFontFamily = GLASS_HEADLINE_FONT; run.fontWeight = '700';
    }
    headlines++;
  }
  for (const child of Object.values(value)) if (typeof child === 'object') patch(child);
}
patch(project);
await writeFile(path, JSON.stringify(project, null, 2) + '\n');

// Use the same four paint definitions for the authored CSS and the Coco renderer.
const kebab = key => key.replace(/[A-Z]/g, char => '-' + char.toLowerCase());
const css = style => Object.entries(style).map(([key, value]) => `${kebab(key)}:${value}`).join(';');
const styles = glassHeadlineStyles();
const glassCss = `\n/* User's layered glass foundation, shared with the Coco renderer. */\n.headline{font-family:${GLASS_HEADLINE_FONT};font-weight:700;line-height:.85;letter-spacing:-.07em;background:none;color:transparent;-webkit-text-stroke:0;text-shadow:none;isolation:isolate}\n.headline>.glass-word{position:relative;display:inline-block;isolation:isolate;font:inherit;letter-spacing:inherit;line-height:inherit}\n.glass-word::before{content:attr(data-text);${css(styles.depth)}}\n.glass-word::after{content:attr(data-text);${css(styles.rim)}}\n.glass-word>.glass-fill{${css(styles.face)}}\n.glass-word>.glass-fill::before{content:attr(data-text);${css(styles.bevel)}}\n`;
const masterPath = 'public/generated-flyers/rnb-thursdays-master.html';
let master = await readFile(masterPath, 'utf8');
if (!master.includes('User\'s layered glass foundation')) {
  master = master.replace('</style>', glassCss + '</style>');
  master = master.replace('data-coco-role="headline" data-coco-editable="true">R&amp;B</div>', 'data-coco-role="headline" data-coco-editable="true"><span class="glass-word" data-text="R&amp;B"><span class="glass-fill" data-text="R&amp;B">R&amp;B</span></span></div>');
  await writeFile(masterPath, master);
}
const previewLayers = Object.entries(styles).map(([layer, style]) => `<span data-layer="${layer}" style="${css(style)}">R&amp;B</span>`).join('');
await writeFile('public/generated-flyers/rnb-glass-headline-foundation.html', `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1080px;overflow:hidden}body{display:grid;place-items:center;background:radial-gradient(circle at 50% 72%,#23bad9 0%,#087fad 30%,#063f72 65%,#031b3b 100%)}.glass{position:relative;display:inline-block;isolation:isolate;font-family:${GLASS_HEADLINE_FONT};font-size:330px;font-weight:700;line-height:.85;letter-spacing:-.07em}</style></head><body><div class="glass">${previewLayers}</div></body></html>`);
console.log({ path, headlines, backupHash: hash });
