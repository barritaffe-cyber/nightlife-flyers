import { COCO_RECIPE_CATALOG, type CocoCatalogRecipeId } from "./recipeCatalog.ts";
/** Explicit themes are compatibility rules, never image-inferred styling hints. */
export const COCO_THEMES = ['Elegant', 'Neon', 'Tropical', 'Urban', 'Brunch', 'Reggae / Dancehall', 'R&B / Lounge', 'Latin'] as const;
export type CocoTheme = typeof COCO_THEMES[number];
export const isCocoTheme = (value: unknown): value is CocoTheme => COCO_THEMES.includes(value as CocoTheme);
export const cocoThemeAllowsRecipe = (theme: unknown, recipeId: string) => isCocoTheme(theme) && (COCO_RECIPE_CATALOG[recipeId as CocoCatalogRecipeId]?.themes as readonly string[] | undefined)?.includes(theme) === true;

/** The small linking phrase belongs to the title, and can be omitted. */
export const cocoHeadlineConnectorId = (recipeId: string) => recipeId === 'glow-in-the-dark' ? 'connector' : recipeId === 'grills-and-groove' ? 'ampersand' : null;

type Owner = { id: string; semanticRole?: string; text?: string; binding?: { text?: string }; typography?: { fontSizePx?: number } };
/** Actual title owners, excluding decorative copies and mislabeled DJ controls. */
export function cocoHeadlineOwners(recipeId: string, source: Record<string, any>): Owner[] {
  const objects: Owner[] = source.cocoCompositionSystem?.compiledDocument?.objects ?? [];
  const seen = new Set<string>();
  return objects.filter(o => {
    if (source.cocoCompositionSystem?.compiledObjectOverrides?.[o.id]?.removed) return false;
    if (!['headline', 'headline2'].includes(o.semanticRole ?? '') && !(recipeId === 'throwback-saturdays' && o.id === 'subtag')) return false;
    if (recipeId === 'elite-monday' && o.id === 'dj') return false;
    // Eaden's small "Night" belongs to its music tagline, not its main title.
    if (['como-una-boa', 'aura', 'day-party', 'en-blanc', 'euphoria', 'fantasy', 'mardi-gras', 'mind-state', 'slow-jamz', 'soiree-dream-house'].includes(recipeId) && o.semanticRole === 'headline2') return false;
    const key = o.binding?.text ?? o.id;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);
function titleWords(recipeId: string, owner: Owner) {
  // SUM / MER is a split word, not a two-word title.
  return words(['summer-sunset', 'electric-sunset'].includes(recipeId) && owner.semanticRole === 'headline' ? String(owner.text ?? '').replace(/\n/g, '') : String(owner.text ?? ''));
}
export function cocoHeadlineMatches(recipeId: string, formats: Record<string, any>, eventName: string): boolean {
  return ['square', 'story'].every(format => {
    const owners = cocoHeadlineOwners(recipeId, formats[format] ?? {});
    const mainWords = owners.reduce((count, o) => count + titleWords(recipeId, o).length, 0);
    const extraWords = words(eventName).length - mainWords;
    // GLOW / DARK are two main words. IN THE is an optional connector, not
    // a reason to reject a two-word name or turn it into a one-word title.
    return owners.length > 0 && (cocoHeadlineConnectorId(recipeId) ? extraWords >= 0 && extraWords <= (recipeId === 'grills-and-groove' ? 1 : 2) : extraWords === 0);
  });
}
/** Partition the name once using the authored title's word/line structure. */
export function cocoHeadlineAssignments(recipeId: string, source: Record<string, any>, eventName: string): Record<string, string> {
  const owners = cocoHeadlineOwners(recipeId, source);
  const incoming = words(eventName);
  const result: Record<string, string> = {};
  if (recipeId === 'baddies-n-bundles') return { headline: [incoming[0], incoming[2]].filter(Boolean).join('\n'), connector: incoming[1] ?? '' };
  // These titles read their smaller word first, despite the headline role order.
  if (recipeId === 'electric-sunset') owners.sort((a, b) => a.id === 'subtitle' ? -1 : b.id === 'subtitle' ? 1 : 0);
  if (recipeId === 'space-neon') owners.sort((a, b) => a.id === 'space' ? -1 : b.id === 'space' ? 1 : 0);
  let cursor = 0;
  const connectorWords = cocoHeadlineConnectorId(recipeId)
    ? Math.max(0, Math.min(recipeId === 'grills-and-groove' ? 1 : 2, incoming.length - owners.reduce((count, o) => count + titleWords(recipeId, o).length, 0))) : 0;
  for (const o of owners) {
    const count = titleWords(recipeId, o).length;
    const part = incoming.slice(cursor, cursor + count); cursor += count;
    const lineCounts = String(o.text ?? '').split('\n').map(line => words(line).length);
    if (['summer-sunset', 'electric-sunset'].includes(recipeId) && o.semanticRole === 'headline') {
      const word = part.join(' '); const split = Math.ceil(word.length / 2);
      result[o.id] = `${word.slice(0, split)}\n${word.slice(split)}`;
    } else if (lineCounts.length > 1) {
      let index = 0; result[o.id] = lineCounts.map(n => { const line = part.slice(index, index + n).join(' '); index += n; return line; }).join('\n');
    } else result[o.id] = part.join(' ');
    if (cocoHeadlineConnectorId(recipeId) && o.semanticRole === 'headline') {
      result[cocoHeadlineConnectorId(recipeId)!] = incoming.slice(cursor, cursor + connectorWords).join(' '); cursor += connectorWords;
    }
  }
  return result;
}
