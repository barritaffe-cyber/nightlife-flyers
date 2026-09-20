import fs from 'node:fs';
import crypto from 'node:crypto';
import { VISUAL_RECIPES } from '../lib/visualRecipes.ts';
import { COCO_PORTABLE_RECIPE_PROJECT_URLS } from '../lib/coco/portableRecipeRuntime.ts';

const projects = { ...COCO_PORTABLE_RECIPE_PROJECT_URLS };
const aliases = { 'glow-in-the-dark': 'glow', 'punta-cana-sundays': 'punta-cana', 'neon-night-shift': 'neon-night', 'como-una-boa': 'eaden', 'fashion-club-vertical': 'friday-fever', 'ladies-css-editorial': 'ladies-css-coco', 'rush-night-css': 'rush-night-coco' };
const assetDir = 'public/generated-flyers/assets/registered-recipes';
fs.mkdirSync(assetDir, { recursive: true });
function externalize(value) {
  if (typeof value === 'string') {
    const match = value.match(/^data:image\/(png|jpeg|webp|svg\+xml);base64,(.*)$/s);
    if (!match) return value;
    const bytes = Buffer.from(match[2], 'base64');
    const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 24);
    const ext = { jpeg: 'jpg', 'svg+xml': 'svg' }[match[1]] || match[1];
    const file = `${assetDir}/${hash}.${ext}`;
    if (!fs.existsSync(file)) fs.writeFileSync(file, bytes);
    return '/' + file.slice('public/'.length);
  }
  if (Array.isArray(value)) return value.map(externalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, externalize(v)]));
  return value;
}
const templates = VISUAL_RECIPES.map(recipe => {
  const file = projects[recipe.id];
  if (!file) throw new Error(`Missing project for ${recipe.id}`);
  const project = JSON.parse(fs.readFileSync('public' + file, 'utf8'));
  const sessions = (project.state ?? project).session;
  for (const format of ['square', 'story']) if (!sessions?.[format]) throw new Error(`${recipe.id}: missing ${format}`);
  const stem = aliases[recipe.id] || recipe.id;
  const candidates = [
    `/generated-flyers/${stem}-square-preview.png`,
    `/coco-references/recipe-exports/${stem}-square-v2.png`,
    `/generated-flyers/${stem}-square-css-preview.png`,
    `/generated-flyers/${stem}-square.png`,
    `/coco-references/recipe-exports/${stem}-square.png`,
    `/coco-references/recipe-exports/${stem}-square.jpg`,
    `/generated-flyers/${stem}-css-preview.png`,
    `/generated-flyers/${stem}-studio-final.png`,
    `/generated-flyers/${stem}-reference-master.png`,
  ];
  const preview = candidates.find(url => fs.existsSync('public' + url));
  if (!preview) throw new Error(`${recipe.id}: missing preview`);
  const formats = Object.fromEntries(['square', 'story'].map(format => {
    const variant = externalize(sessions[format]);
    if (variant.portraits?.length) variant.emojiList = variant.portraits;
    delete variant.portraits;
    delete variant.emojis;
    return [format, variant];
  }));
  return { id: `recipe_${recipe.id.replaceAll('-', '_')}`, label: recipe.name, recipeId: recipe.id,
    recipeSummary: recipe.summary, tags: ['Coco', 'Registered recipe', 'Square', 'Story'], preview, formats };
});
fs.writeFileSync('lib/template-data/registered-recipes.json', JSON.stringify(templates));
console.log(`Built ${templates.length} registered recipe templates from saved projects.`);
