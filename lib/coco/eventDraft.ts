import type { CocoEventBriefInput } from './eventBriefFields';

/** Update only the questions this design asked. Unavailable facts stay in the
 * campaign draft, while deliberate clearing of an available answer is retained. */
export function mergeCocoEventDraft(
  previous: CocoEventBriefInput,
  answers: CocoEventBriefInput,
  fields: readonly string[],
): CocoEventBriefInput {
  const keys = [...fields];
  if(fields.includes('presenterName'))keys.push('presenterLogo');
  if (fields.includes('socials') || answers.fieldFormats?.socialPlatforms?.length) keys.push('socialPlatforms');
  return {
    ...previous,
    ...Object.fromEntries(keys.filter(key => key in answers).map(key => [key, answers[key as keyof CocoEventBriefInput]])),
  };
}
