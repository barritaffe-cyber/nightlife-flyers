import type { CocoArtDirection } from '../../components/coco/artDirections/types.ts';
import type { CocoSubjectDecision } from './subjectAuthority.ts';
import { cocoHeadlineMatches, cocoThemeAllowsRecipe } from './recipeCompatibility.ts';
import { cocoDirectionKeywordScore } from '../../components/coco/artDirections/registry.ts';
import { COCO_THEME_FEATURED_RECIPES } from './recipeCatalog.ts';

export const COCO_RECIPE_CHOICE_COUNT = 5;

/** A normal compatibility rejection, not a failed download or broken recipe. */
export class CocoRecipeChoiceMismatch extends Error {
  readonly reason: 'compatibility' | 'headline-width';
  constructor(message: string, reason: 'compatibility' | 'headline-width' = 'compatibility') {
    super(message);
    this.name = 'CocoRecipeChoiceMismatch';
    this.reason = reason;
  }
}

export function cocoNoMatchingDesignsMessage(mismatches: readonly CocoRecipeChoiceMismatch[]): string {
  return mismatches.some(error => error.reason === 'headline-width')
    ? 'This event name is too wide for the matching designs. Try a shorter name or a different theme.'
    : 'No designs match this event name and theme. Try a different event name or theme.';
}

export function rankCocoMatchingDirections(directions: readonly CocoArtDirection[], composer: SubjectChoice & { eventName: string; eventBrief: { theme?: string } }, formatsFor: (recipeId: string) => Record<string, any> | undefined): CocoArtDirection[] {
  const featured = COCO_THEME_FEATURED_RECIPES[composer.eventBrief.theme ?? ''] ?? [];
  return directions.filter(direction => {
    const id = direction.visualRecipeId ?? '';
    const formats = formatsFor(id);
    return formats && cocoThemeAllowsRecipe(composer.eventBrief.theme, id) &&
      isCocoRecipeChoiceEligible(direction, composer, formats) && cocoHeadlineMatches(id, formats, composer.eventName);
  }).map((direction, index) => ({ direction, index, score: cocoDirectionKeywordScore(direction, composer.eventName), featured: featured.some(id => id === direction.visualRecipeId) }))
    .sort((a, b) => (b.score + (b.featured ? 10 : 0)) - (a.score + (a.featured ? 10 : 0)) || a.index - b.index).map(item => item.direction);
}

/** Keep compatibility first, then favor different palettes and compositions. */
export function diversifyCocoRecipeChoices(ranked: readonly { direction: CocoArtDirection; cost: number; index: number }[]): CocoArtDirection[] {
  const pool = [...ranked], selected: CocoArtDirection[] = [];
  while (pool.length) {
    const score = (item: typeof pool[number]) => item.cost * 100 + item.index * .5 + selected.reduce((sum, d) => sum
      + (d.palettePolicy.id === item.direction.palettePolicy.id ? 4 : 0)
      + (d.layoutByFormat.square.alignment === item.direction.layoutByFormat.square.alignment ? 2 : 0)
      + (d.typographyPersonality === item.direction.typographyPersonality ? 1 : 0), 0);
    pool.sort((a, b) => score(a) - score(b) || a.index - b.index);
    selected.push(pool.shift()!.direction);
  }
  return selected;
}

export function cocoRecipeDetailsIssue(formats: Record<string, any>): string | null {
  for (const format of ['square', 'story']) {
    const report = formats[format]?.cocoFormMappingReport;
    if (!report) return 'This design cannot map all of your event details yet.';
    if (report.layoutError || report.qrError) return report.layoutError || report.qrError;
    if (report.unplacedFields?.length) return `This design needs more room for: ${report.unplacedLabels.join(', ')}.`;
  }
  return null;
}
type SubjectChoice = { keepDesignImages?: boolean; subjectDecision?: CocoSubjectDecision; subjectDataUrl?: string; recipeSubjectDataUrl?: string };

export function cocoComposerUsesSubject(composer: SubjectChoice): boolean {
  if (composer.subjectDecision?.intent === 'none') return false;
  return Boolean(composer.subjectDataUrl || composer.recipeSubjectDataUrl || composer.subjectDecision?.recipeFallbackApproved);
}

export function isCocoRecipeChoiceEligible(direction: CocoArtDirection, composer: SubjectChoice, formats?: Record<string, any>): boolean {
  if (composer.keepDesignImages && !cocoComposerUsesSubject(composer)) return true;
  if (cocoComposerUsesSubject(composer)) {
    if (direction.subjectPolicy.mode === 'none') return false;
    // A model baked into a background cannot accept the user's portrait.
    // Empty seed containers are checked again after the actual recipe loads.
    if (!formats || !Object.values(formats).some(v => v?.cocoCompositionSystem?.compiledDocument || v?.emojiList || v?.portraits)) return true;
    return ['square', 'story'].every(format => {
      const v = formats[format];
      return [...(v?.emojiList ?? []), ...(v?.portraits ?? [])].some(a =>
        a.cocoCompiledObjectId === 'subject' || a.cocoAssetRole === 'subject' ||
        String(a.id ?? '').startsWith('coco_recipe_subject_') || (a.isExtracted && !a.isLogo && !a.isSticker));
    });
  }
  // Portrait means an editable subject layer. Baked background people are allowed
  // for a no-portrait request; separate authored portraits remain excluded.
  if (direction.containsSubject !== false || !formats?.square || !formats?.story) return false;
  return ['square', 'story'].every(format => {
    const variant = formats[format];
    const decorative = (id: unknown) => direction.visualRecipeId === 'brunch-saturday' && id === 'cocktail-foreground';
    const objects = variant.cocoCompositionSystem?.compiledDocument?.objects ?? [];
    const hasSubjectObject = objects.some((o: any) => o.kind !== 'text' && !decorative(o.id) && (o.semanticRole === 'subject' || o.assetRole === 'subject' || /^(subject|portrait|model)(?:[-_]|$)/i.test(o.id)));
    const assets = [...(variant.emojiList ?? []), ...(variant.portraits ?? [])];
    const hasSubjectAsset = assets.some((a: any) => !decorative(a.cocoCompiledObjectId) && (a.isExtracted || a.kind === 'subject' || a.cocoAssetRole === 'subject'));
    return !hasSubjectObject && !hasSubjectAsset;
  });
}

/** Build a complete set, replacing failures with the next eligible recipe. */
export async function buildCocoRecipeChoicePage<T, R>(ranked: readonly T[], build: (candidate: T) => Promise<R>, count = COCO_RECIPE_CHOICE_COUNT): Promise<{ choices: R[]; remaining: T[]; failures: string[]; mismatches: CocoRecipeChoiceMismatch[]; errors: unknown[] }> {
  const choices: R[] = [];
  const failures: string[] = [];
  const mismatches: CocoRecipeChoiceMismatch[] = [];
  const errors: unknown[] = [];
  let cursor = 0;
  while (choices.length < count && cursor < ranked.length) {
    const batch = ranked.slice(cursor, cursor + count - choices.length);
    cursor += batch.length;
    const results = await Promise.allSettled(batch.map(candidate => Promise.resolve().then(() => build(candidate))));
    for (const result of results) {
      if (result.status === 'fulfilled') choices.push(result.value);
      else {
        if (result.reason instanceof CocoRecipeChoiceMismatch) mismatches.push(result.reason);
        else errors.push(result.reason);
        const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
        if (!failures.includes(message)) failures.push(message);
      }
    }
  }
  return { choices, remaining: ranked.slice(cursor), failures, mismatches, errors };
}

export async function buildCocoRecipeChoices<T, R>(ranked: readonly T[], build: (candidate: T) => Promise<R>, count = COCO_RECIPE_CHOICE_COUNT, allowPartial = false): Promise<R[]> {
  const { choices, failures } = await buildCocoRecipeChoicePage(ranked, build, count);
  if (allowPartial && choices.length) return choices;
  if (allowPartial) throw new Error(`No designs currently match this theme and event name. Go Back to change the theme or event name.${failures.length ? ` ${failures.join('; ')}` : ''}`);
  if (choices.length !== count) throw new Error(`Coco could only build ${choices.length} of ${count} eligible choices. Please try again.${failures.length ? ` ${failures.join('; ')}` : ''}`);
  return choices;
}

/** Legacy callers may still request a partial set of already-started builds. */
export async function collectCocoRecipeChoices<T>(builds: Promise<T>[]): Promise<T[]> {
  const results = await Promise.allSettled(builds);
  const choices = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (choices.length) return choices;
  const reasons = results.flatMap((result) => result.status === "rejected"
    ? [result.reason instanceof Error ? result.reason.message : String(result.reason)] : []);
  throw new Error(reasons.join("; ") || "No authored Coco recipes are available for this request.");
}
